import type { NextRequest } from "next/server";
import { fail, ok, preflight, publicCtx } from "@/server/public/http";
import { getSingletonDoc, listCollection, resolveResource } from "@/server/public/query";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/public/[resource]">) {
  let lang: "id" | "en" = "id";
  try {
    const { resource } = await ctx.params;
    const pctx = await publicCtx(req);
    lang = pctx.lang;
    const r = resolveResource(resource);
    const body =
      r.kind === "collection"
        ? await listCollection(r.def, req.nextUrl.searchParams, pctx.lang, pctx.preview)
        : await getSingletonDoc(r.def, pctx.lang, pctx.preview);
    return ok(req, pctx, body);
  } catch (e) {
    return fail(req, e, lang);
  }
}

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}
