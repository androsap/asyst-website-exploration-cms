/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { pick, type Lang } from "@/lib/i18n";
import { blockFields, type Field, type Fields } from "@/content/fields";
import { getCollection, type CollectionDef } from "@/content/collections";
import { delegate, formInclude, toFormValues } from "@/server/repo/collections";

// Serializer berbasis definisi field:
//   1. kumpulkan id media & ref dari dokumen (rekursif, termasuk di dalam blok)
//   2. ambil sekaligus dari DB (ref hanya yang terbit, kecuali mode preview)
//   3. transform: L<…> → string sesuai bahasa, mediaId → objek media, ref → ringkasan dokumen

type Acc = { media: Set<string>; refs: Map<string, Set<string>> };
type RefRow = { def: CollectionDef; values: Record<string, unknown>; row: Record<string, any> };
export type Ctx = {
  lang: Lang;
  preview: boolean;
  media: Map<string, Record<string, any>>;
  refs: Map<string, RefRow>; // key: `${target}:${id}`
};

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);

function collect(fields: Fields, data: unknown, acc: Acc) {
  if (!isObj(data)) return;
  for (const [k, field] of Object.entries(fields)) collectField(field, data[k], acc);
}

function collectField(field: Field, v: unknown, acc: Acc) {
  if (v == null) return;
  switch (field.kind) {
    case "media":
      if (typeof v === "string" && v) acc.media.add(v);
      break;
    case "mediaList":
      if (Array.isArray(v)) v.forEach((id) => typeof id === "string" && acc.media.add(id));
      break;
    case "ref": {
      const ids = field.multiple ? (Array.isArray(v) ? v : []) : [v];
      let set = acc.refs.get(field.target);
      if (!set) acc.refs.set(field.target, (set = new Set()));
      for (const id of ids) if (typeof id === "string" && id) set.add(id);
      break;
    }
    case "object":
      collect(field.fields, v, acc);
      break;
    case "array":
      if (Array.isArray(v)) v.forEach((item) => collect(field.fields, item, acc));
      break;
    case "blocks":
      if (Array.isArray(v))
        v.forEach((b) => {
          const def = isObj(b) ? field.blocks[b.type] : undefined;
          if (def) collect(blockFields(def), b, acc);
        });
      break;
  }
}

function summaryFields(def: CollectionDef): Fields {
  return Object.fromEntries(def.summary.filter((k) => def.fields[k]).map((k) => [k, def.fields[k]]));
}

export function publishedWhere(def: CollectionDef, preview: boolean): Record<string, unknown> {
  if (preview) return {};
  const where: Record<string, unknown> = {};
  if (def.hasStatus) {
    where.status = "PUBLISHED";
    where.OR = [{ publishedAt: null }, { publishedAt: { lte: new Date() } }];
  }
  if (def.public.activeField) where[def.public.activeField] = true;
  return where;
}

/** Ambil media & ref yang dibutuhkan oleh kumpulan dokumen. */
export async function buildCtx(
  docs: { fields: Fields; data: unknown }[],
  lang: Lang,
  preview: boolean,
): Promise<Ctx> {
  const ctx: Ctx = { lang, preview, media: new Map(), refs: new Map() };
  const acc: Acc = { media: new Set(), refs: new Map() };
  for (const d of docs) collect(d.fields, d.data, acc);

  // Ref bisa memuat ref lain (mis. berita → kategori). Resolve maksimal 3 tingkat.
  for (let round = 0; round < 3 && acc.refs.size; round++) {
    const pending = acc.refs;
    acc.refs = new Map();
    for (const [target, idSet] of pending) {
      const def = getCollection(target);
      const ids = [...idSet].filter((id) => !ctx.refs.has(`${target}:${id}`));
      if (!def || !ids.length) continue;
      const include = formInclude(def);
      const rows: Record<string, any>[] = await delegate(def).findMany({
        where: { id: { in: ids }, ...publishedWhere(def, preview) },
        ...(Object.keys(include).length ? { include } : {}),
      });
      const fields = summaryFields(def);
      for (const row of rows) {
        const values = toFormValues(def, row);
        ctx.refs.set(`${target}:${row.id}`, { def, values, row });
        collect(fields, values, acc);
      }
    }
  }

  if (acc.media.size) {
    const rows = await prisma.media.findMany({ where: { id: { in: [...acc.media] } } });
    for (const m of rows) ctx.media.set(m.id, m);
  }
  return ctx;
}

export function serializeMedia(m: Record<string, any> | undefined, lang: Lang) {
  if (!m) return null;
  return {
    id: m.id,
    url: m.url,
    alt: pick(m.alt, lang) ?? "",
    caption: m.caption ? pick(m.caption, lang) : null,
    width: m.width,
    height: m.height,
    mimeType: m.mimeType,
  };
}

/** Kunci output: `categoryId` → `category`, `coverImageId` → `coverImage`. */
function outKey(k: string, field: Field) {
  return (field.kind === "ref" || field.kind === "media") && k.length > 2 && k.endsWith("Id") ? k.slice(0, -2) : k;
}

export function transform(fields: Fields, data: unknown, ctx: Ctx): Record<string, unknown> {
  const src = isObj(data) ? data : {};
  const out: Record<string, unknown> = {};
  for (const [k, field] of Object.entries(fields)) out[outKey(k, field)] = transformField(field, src[k], ctx);
  return out;
}

function transformField(field: Field, v: unknown, ctx: Ctx): unknown {
  switch (field.kind) {
    case "ltext":
      return pick(v as any, ctx.lang) ?? "";
    case "llist":
      return pick(v as any, ctx.lang) ?? [];
    case "media":
      return typeof v === "string" ? serializeMedia(ctx.media.get(v), ctx.lang) : null;
    case "mediaList":
      return Array.isArray(v) ? v.map((id) => serializeMedia(ctx.media.get(id), ctx.lang)).filter(Boolean) : [];
    case "ref":
      if (field.multiple) return Array.isArray(v) ? v.map((id) => refSummary(field.target, id, ctx)).filter(Boolean) : [];
      return typeof v === "string" ? refSummary(field.target, v, ctx) : null;
    case "object":
      return v == null ? null : transform(field.fields, v, ctx);
    case "array":
      return Array.isArray(v) ? v.map((item) => transform(field.fields, item, ctx)) : [];
    case "blocks":
      if (!Array.isArray(v)) return [];
      return v
        .filter((b) => isObj(b) && !b.hidden && field.blocks[b.type])
        .map((b) => ({ type: b.type, ...transform(blockFields(field.blocks[b.type]), b, ctx) }));
    case "text":
    case "icon":
    case "select":
    case "date":
    case "datetime":
      return v === "" ? null : (v ?? null);
    default:
      return v ?? null;
  }
}

function refSummary(target: string, id: string, ctx: Ctx) {
  const ref = ctx.refs.get(`${target}:${id}`);
  if (!ref) return null;
  return { id, ...systemFields(ref.def, ref.row), ...transform(summaryFields(ref.def), ref.values, ctx) };
}

function systemFields(def: CollectionDef, row: Record<string, any>) {
  const out: Record<string, unknown> = {};
  if (def.slugField) out[def.slugField] = row[def.slugField];
  return out;
}

const READING_WPM = 200;

/** Field turunan per jenis konten. */
function computed(def: CollectionDef, row: Record<string, any>, values: Record<string, unknown>, lang: Lang) {
  if (def.type === "news") {
    const html = pick(values.content as any, lang) ?? "";
    const words = String(html).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return { readingTime: Math.max(1, Math.round(words / READING_WPM)) };
  }
  if (def.type === "case-studies") return { hasDetail: row.detail != null };
  if (def.type === "terms") return { vocabulary: String(row.vocabulary).toLowerCase().replace(/_/g, "-") };
  return {};
}

/** Serialisasi record collection lengkap untuk API publik. */
export async function serializeRecords(def: CollectionDef, rows: Record<string, any>[], lang: Lang, preview: boolean) {
  const prepared = rows.map((row) => ({ row, values: toFormValues(def, row) }));
  const ctx = await buildCtx(
    prepared.map((p) => ({ fields: def.fields, data: p.values })),
    lang,
    preview,
  );
  return prepared.map(({ row, values }) => ({
    id: row.id,
    ...transform(def.fields, values, ctx),
    ...computed(def, row, values, lang),
    ...(def.hasStatus ? { publishedAt: row.publishedAt } : {}),
    ...(preview && def.hasStatus ? { status: row.status } : {}),
    ...(def.orderable ? { order: row.order } : {}),
    updatedAt: row.updatedAt,
  }));
}

/** Serialisasi dokumen singleton. */
export async function serializeDoc(fields: Fields, data: unknown, lang: Lang, preview: boolean) {
  const ctx = await buildCtx([{ fields, data }], lang, preview);
  return transform(fields, data, ctx);
}
