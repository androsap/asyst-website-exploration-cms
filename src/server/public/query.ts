/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Lang } from "@/lib/i18n";
import { getCollection, type CollectionDef } from "@/content/collections";
import { getSingleton, type SingletonDef } from "@/content/singletons";
import { delegate, formInclude, sortClause } from "@/server/repo/collections";
import { loadSingleton } from "@/server/repo/singletons";
import { publishedWhere, serializeDoc, serializeRecords } from "./serialize";
import { applyExtras } from "./extras";

export class PublicError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

const MAX_LIMIT = 100;
const toEnum = (v: string) => v.trim().toUpperCase().replace(/-/g, "_");

function filterWhere(def: CollectionDef, params: URLSearchParams) {
  const where: Record<string, unknown> = {};
  const applied: Record<string, string> = {};
  for (const flt of def.public.filters ?? []) {
    const raw = params.get(flt.param);
    if (raw == null || raw === "") continue;
    applied[flt.param] = raw;
    const matchKey = flt.matchKey ?? "key";
    switch (flt.kind) {
      case "relKey":
        where[flt.field] = { [matchKey]: raw };
        break;
      case "relSomeKey":
        where[flt.field] = { some: { [matchKey]: { in: raw.split(",") } } };
        break;
      case "joinKey":
        where[flt.field] = { some: { category: { [matchKey]: raw } } };
        break;
      case "enum":
        where[flt.field] = toEnum(raw);
        break;
      case "enumHas":
        where[flt.field] = { array_contains: [toEnum(raw)] }; // kolom Json berisi array enum
        break;
      case "bool":
        where[flt.field] = raw === "true" || raw === "1";
        break;
      case "eq":
        where[flt.field] = raw;
        break;
    }
  }
  return { where, applied };
}

function intParam(params: URLSearchParams, name: string, fallback: number, min: number, max: number) {
  const raw = params.get(name);
  const n = raw == null ? fallback : Number.parseInt(raw, 10);
  if (Number.isNaN(n)) throw new PublicError(400, "invalid_param", `Parameter ${name} harus angka`);
  return Math.min(max, Math.max(min, n));
}

export type ResourceKind = { kind: "collection"; def: CollectionDef } | { kind: "singleton"; def: SingletonDef };

export function resolveResource(resource: string): ResourceKind {
  const c = getCollection(resource);
  if (c) return { kind: "collection", def: c };
  const s = getSingleton(resource);
  if (s) return { kind: "singleton", def: s };
  throw new PublicError(404, "unknown_resource", `Resource "${resource}" tidak ada`);
}

export async function listCollection(def: CollectionDef, params: URLSearchParams, lang: Lang, preview: boolean) {
  const page = intParam(params, "page", 1, 1, 10_000);
  const limit = intParam(params, "limit", def.public.defaultLimit ?? 20, 1, MAX_LIMIT);
  const { where, applied } = filterWhere(def, params);
  const q = params.get("q")?.trim();
  if (q) where.searchText = { contains: q.toLowerCase() }; // collation utf8mb4 MySQL sudah case-insensitive
  Object.assign(where, publishedWhere(def, preview));

  const d = delegate(def);
  const include = formInclude(def);
  const [rows, total] = await Promise.all([
    d.findMany({
      where,
      orderBy: [sortClause(def), { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      ...(Object.keys(include).length ? { include } : {}),
    }),
    d.count({ where }),
  ]);
  const data = await serializeRecords(def, rows, lang, preview);
  return {
    data,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), filters: { ...applied, ...(q ? { q } : {}) } },
  };
}

export async function getCollectionItem(
  def: CollectionDef,
  slug: string,
  params: URLSearchParams,
  lang: Lang,
  preview: boolean,
) {
  if (!def.slugField || def.slugField === "path")
    throw new PublicError(400, "no_slug", `Resource ini tidak mendukung pencarian per slug. Gunakan filter.`);
  const where: Record<string, unknown> = { [def.slugField]: slug, ...publishedWhere(def, preview) };
  if (def.type === "terms") {
    const vocab = params.get("vocabulary");
    if (!vocab) throw new PublicError(400, "missing_param", "Parameter vocabulary wajib untuk detail term");
    where.vocabulary = toEnum(vocab);
  }
  const include = formInclude(def);
  const row = await delegate(def).findFirst({ where, ...(Object.keys(include).length ? { include } : {}) });
  if (!row) throw new PublicError(404, "not_found", "Data tidak ditemukan");
  const [data] = await serializeRecords(def, [row], lang, preview);

  // Studi kasus: sertakan relasi terkait yang terbit.
  if (def.type === "case-studies") {
    const related = await delegate(def).findMany({
      where: { id: { in: (row.related ?? []).map((r: { id: string }) => r.id) }, ...publishedWhere(def, preview) },
      orderBy: { order: "asc" },
      include,
    });
    (data as any).related = await serializeRecords(def, related, lang, preview);
  }
  return { data, meta: {} };
}

export async function getSingletonDoc(def: SingletonDef, lang: Lang, preview: boolean) {
  const { row, draft, published } = await loadSingleton(def);
  const source = preview ? draft : published;
  if (!row || !source) throw new PublicError(404, "not_published", "Konten belum dipublikasikan");
  const data = await serializeDoc(def.fields, source, lang, preview);
  await applyExtras(def, data, lang, preview);
  return {
    data,
    meta: { publishedAt: row.publishedAt, updatedAt: row.updatedAt, ...(preview ? { draft: true } : {}) },
  };
}

/** Utility untuk extras: ambil list collection terbit yang sudah terserialisasi. */
export async function fetchSerialized(
  type: string,
  lang: Lang,
  preview: boolean,
  opts: { where?: Record<string, unknown>; take?: number } = {},
) {
  const def = getCollection(type)!;
  const include = formInclude(def);
  const rows = await delegate(def).findMany({
    where: { ...(opts.where ?? {}), ...publishedWhere(def, preview) },
    orderBy: [sortClause(def), { createdAt: "desc" }],
    take: opts.take ?? 100,
    ...(Object.keys(include).length ? { include } : {}),
  });
  return serializeRecords(def, rows, lang, preview);
}
