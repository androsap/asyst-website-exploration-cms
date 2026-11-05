import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { allowedOrigins, env } from "@/lib/env";
import { parseLang, type Lang } from "@/lib/i18n";
import { verifyPreviewToken } from "@/server/preview";
import { PublicError } from "./query";

export function corsHeaders(req: NextRequest, methods = "GET, OPTIONS"): Record<string, string> {
  const origin = req.headers.get("origin")?.replace(/\/$/, "");
  const allowed = allowedOrigins();
  const headers: Record<string, string> = { Vary: "Origin" };
  if (origin && (allowed.includes("*") || allowed.includes(origin))) {
    headers["Access-Control-Allow-Origin"] = allowed.includes("*") ? "*" : origin;
    headers["Access-Control-Allow-Methods"] = methods;
    headers["Access-Control-Allow-Headers"] = "Content-Type, X-Preview-Token";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

export function preflight(req: NextRequest, methods?: string) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req, methods) });
}

export type PublicCtx = { lang: Lang; preview: boolean };

export async function publicCtx(req: NextRequest): Promise<PublicCtx> {
  const params = req.nextUrl.searchParams;
  const rawLang = params.get("lang");
  if (rawLang && rawLang !== "id" && rawLang !== "en")
    throw new PublicError(400, "invalid_lang", "Parameter lang harus id atau en");
  const token = params.get("preview") ?? req.headers.get("x-preview-token");
  let preview = false;
  if (token) {
    preview = await verifyPreviewToken(token);
    if (!preview) throw new PublicError(401, "invalid_preview_token", "Token preview tidak valid atau kedaluwarsa");
  }
  return { lang: parseLang(rawLang), preview };
}

function cacheHeader(preview: boolean) {
  if (preview) return "private, no-store";
  const { PUBLIC_CACHE_SMAXAGE, PUBLIC_CACHE_SWR } = env();
  return `public, s-maxage=${PUBLIC_CACHE_SMAXAGE}, stale-while-revalidate=${PUBLIC_CACHE_SWR}`;
}

export function ok(req: NextRequest, ctx: PublicCtx, body: { data: unknown; meta: Record<string, unknown> }) {
  return NextResponse.json(
    { data: body.data, meta: { lang: ctx.lang, ...(ctx.preview ? { preview: true } : {}), ...body.meta } },
    { headers: { ...corsHeaders(req), "Cache-Control": cacheHeader(ctx.preview) } },
  );
}

export function fail(req: NextRequest, e: unknown, lang: Lang = "id", methods?: string) {
  let status = 500;
  let code = "internal_error";
  let message = "Terjadi kesalahan pada server";
  let details: unknown;
  if (e instanceof PublicError) ({ status, code, message } = e);
  else if (e instanceof ZodError) {
    status = 422;
    code = "validation_error";
    message = "Data tidak valid";
    details = e.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
  } else console.error("[public-api]", e);
  return NextResponse.json(
    { data: null, meta: { lang }, error: { code, message, ...(details ? { details } : {}) } },
    {
      status,
      headers: { ...corsHeaders(req, methods), "Cache-Control": status === 404 ? "public, s-maxage=30" : "no-store" },
    },
  );
}
