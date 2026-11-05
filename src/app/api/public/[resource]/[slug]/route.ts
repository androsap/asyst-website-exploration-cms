import type { NextRequest } from "next/server";
import { fail, ok, preflight, publicCtx } from "@/server/public/http";
import { getCollectionItem, PublicError, resolveResource } from "@/server/public/query";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/public/[resource]/[slug]">) {
  let lang: "id" | "en" = "id";
  try {
    const { resource, slug } = await ctx.params;
    const pctx = await publicCtx(req);
    lang = pctx.lang;
    const r = resolveResource(resource);
    if (r.kind !== "collection")
      throw new PublicError(400, "singleton_resource", `"${resource}" adalah singleton; gunakan /api/public/${resource}`);
    const body = await getCollectionItem(r.def, decodeURIComponent(slug), req.nextUrl.searchParams, pctx.lang, pctx.preview);
    return ok(req, pctx, body);
  } catch (e) {
    return fail(req, e, lang);
  }
}

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}
