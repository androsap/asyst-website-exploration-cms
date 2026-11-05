import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { corsHeaders, fail, preflight } from "@/server/public/http";
import { PublicError } from "@/server/public/query";

// POST publik untuk form Contact Us / Ask ASYST / lamaran karier → FormSubmission.
// Proteksi: CORS (ALLOWED_ORIGINS), honeypot `website`, rate limit per IP (hash).

const SOURCES = { "contact-us": "CONTACT_US", "ask-asyst": "ASK_ASYST", "career-apply": "CAREER_APPLY" } as const;
const METHODS = "POST, OPTIONS";
const RATE_LIMIT = { windowMinutes: 10, max: 5 };

const str = (max: number) => z.string().trim().max(max);
const bodySchema = z.object({
  fullName: str(120).min(1, "Nama wajib diisi"),
  email: z.string().trim().toLowerCase().email("Email tidak valid").max(200),
  company: str(160).min(1, "Perusahaan wajib diisi"),
  message: str(5000).min(1, "Pesan wajib diisi"),
  topic: str(80).optional(),
  jobTitle: str(120).optional(),
  phone: str(40).regex(/^[+0-9 ()-]*$/, "Nomor telepon tidak valid").optional(),
  subject: str(200).optional(),
  pageUrl: str(500).optional(),
  language: z.enum(["id", "en"]).optional(),
  website: z.string().optional(), // honeypot — harus kosong
});

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/forms/[source]">) {
  try {
    const { source } = await ctx.params;
    const sourceEnum = SOURCES[source as keyof typeof SOURCES];
    if (!sourceEnum) throw new PublicError(404, "unknown_form", `Form "${source}" tidak ada`);

    const origin = req.headers.get("origin");
    if (origin && !corsHeaders(req, METHODS)["Access-Control-Allow-Origin"])
      throw new PublicError(403, "origin_not_allowed", "Origin tidak diizinkan");

    const json = await req.json().catch(() => {
      throw new PublicError(400, "invalid_json", "Body harus JSON");
    });
    const body = bodySchema.parse(json);

    const headers = { ...corsHeaders(req, METHODS), "Cache-Control": "no-store" };
    if (body.website) {
      // Bot: balas sukses palsu tanpa menyimpan.
      return NextResponse.json({ data: { id: null }, meta: {} }, { status: 201, headers });
    }

    const ipHash = createHash("sha256")
      .update(`${clientIp(req)}|${process.env.AUTH_SECRET ?? ""}`)
      .digest("hex");
    const since = new Date(Date.now() - RATE_LIMIT.windowMinutes * 60_000);
    const recent = await prisma.formSubmission.count({ where: { ipHash, createdAt: { gte: since } } });
    if (recent >= RATE_LIMIT.max) throw new PublicError(429, "rate_limited", "Terlalu banyak kiriman. Coba lagi nanti.");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { website, ...fields } = body;
    const saved = await prisma.formSubmission.create({
      data: { ...fields, source: sourceEnum, ipHash },
      select: { id: true, createdAt: true },
    });
    return NextResponse.json({ data: saved, meta: { source } }, { status: 201, headers });
  } catch (e) {
    return fail(req, e, "id", METHODS);
  }
}

export function OPTIONS(req: NextRequest) {
  return preflight(req, METHODS);
}
