/* eslint-disable @typescript-eslint/no-explicit-any */
// Repository generik untuk semua collection — dipakai server action, API publik, dan seed.
// Tidak boleh meng-import modul khusus Next (next/cache, server-only) agar bisa dipakai oleh seed.
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { labelOf, pick } from "@/lib/i18n";
import { slugify } from "@/lib/slug";
import { buildSearchText, schemaFor, withDefaults, type Fields, type RefField } from "@/content/fields";
import { getCollection, type CollectionDef } from "@/content/collections";
import { sanitizeFields } from "./sanitize";

export type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export class ValidationError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

export function delegate(def: CollectionDef): any {
  const d = (prisma as any)[def.model];
  if (!d) throw new Error(`Model Prisma tidak ditemukan: ${def.model}`);
  return d;
}

export function mustCollection(type: string): CollectionDef {
  const def = getCollection(type);
  if (!def) throw new ValidationError(`Jenis konten tidak dikenal: ${type}`);
  return def;
}

/** Tabel join berurutan (saat ini hanya ProductCategory.products). */
const JOINS: Record<string, { model: string; ownKey: string; otherKey: string; relation: string }> = {
  "productCategory.products": {
    model: "productCategoryProduct",
    ownKey: "categoryId",
    otherKey: "productId",
    relation: "products",
  },
};

function joinOf(def: CollectionDef, key: string) {
  const j = JOINS[`${def.model}.${key}`];
  if (!j) throw new Error(`Join belum dikonfigurasi: ${def.model}.${key}`);
  return j;
}

const isM2M = (f: RefField) => f.multiple && f.relation !== "join";
const isJoin = (f: RefField) => f.multiple && f.relation === "join";

/** Include Prisma untuk memuat relasi many-to-many / join saat form edit. */
export function formInclude(def: CollectionDef) {
  const include: Record<string, unknown> = {};
  for (const [k, field] of Object.entries(def.fields)) {
    if (field.kind !== "ref") continue;
    if (isM2M(field)) include[k] = { select: { id: true } };
    if (isJoin(field)) {
      const j = joinOf(def, k);
      include[j.relation] = { orderBy: { order: "asc" }, select: { [j.otherKey]: true } };
    }
  }
  return include;
}

// ─────────────── Mapping DB ↔ form ───────────────

function jsonValue(v: unknown) {
  return v == null ? Prisma.DbNull : (v as Prisma.InputJsonValue);
}

function toPrismaData(def: CollectionDef, values: Record<string, unknown>, mode: "create" | "update") {
  const data: Record<string, unknown> = {};
  const joins: { key: string; ids: string[] }[] = [];

  for (const [k, field] of Object.entries(def.fields)) {
    const v = values[k];
    switch (field.kind) {
      case "ref":
        if (isJoin(field)) joins.push({ key: k, ids: (v as string[]) ?? [] });
        else if (isM2M(field)) {
          const ids = ((v as string[]) ?? []).map((id) => ({ id }));
          data[k] = mode === "create" ? { connect: ids } : { set: ids };
        } else data[k] = v || null;
        break;
      case "media":
        data[k] = v || null;
        break;
      case "text":
      case "icon":
      case "select":
        data[k] = v === "" || v == null ? null : v;
        break;
      case "date":
        data[k] = v ? new Date(`${v as string}T00:00:00.000Z`) : null;
        break;
      case "datetime":
        data[k] = v ? new Date(v as string) : null;
        break;
      case "number":
      case "bool":
      case "multiselect":
        data[k] = v;
        break;
      default:
        data[k] = jsonValue(v);
    }
  }
  return { data, joins };
}

/** Ubah record Prisma menjadi nilai form (sesuai definisi field). */
export function toFormValues(def: CollectionDef, record: Record<string, any>): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [k, field] of Object.entries(def.fields)) {
    const v = record[k];
    if (field.kind === "ref" && isM2M(field)) values[k] = (v ?? []).map((x: { id: string }) => x.id);
    else if (field.kind === "ref" && isJoin(field)) {
      const j = joinOf(def, k);
      values[k] = (record[j.relation] ?? []).map((x: Record<string, string>) => x[j.otherKey]);
    } else if (field.kind === "date") values[k] = v ? new Date(v).toISOString().slice(0, 10) : "";
    else if (field.kind === "datetime") values[k] = v ? new Date(v).toISOString() : "";
    else values[k] = v;
  }
  return withDefaults(def.fields, values);
}

// ─────────────── Query ───────────────

export type ListParams = {
  q?: string;
  page?: number;
  pageSize?: number;
  status?: string;
  filters?: Record<string, string | undefined>;
  all?: boolean;
};

/** `nulls` hanya valid untuk kolom nullable (publishedAt); draft tanpa tanggal tampil paling atas. */
export function sortClause(def: CollectionDef) {
  return def.sort.field === "publishedAt"
    ? { publishedAt: { sort: def.sort.dir, nulls: "first" } }
    : { [def.sort.field]: def.sort.dir };
}

export async function listItems(def: CollectionDef, p: ListParams = {}) {
  const page = Math.max(1, p.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, p.pageSize ?? 20));
  const where: Record<string, unknown> = {};
  if (p.q) where.searchText = { contains: p.q.toLowerCase().trim() };
  if (def.hasStatus && p.status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(p.status)) where.status = p.status;
  for (const af of def.adminFilters ?? []) {
    const v = p.filters?.[af.field];
    if (v && af.options.some((o) => o.value === v)) where[af.field] = v;
  }
  const orderBy = [sortClause(def), { createdAt: "desc" }];
  const d = delegate(def);
  const [items, total] = await Promise.all([
    d.findMany({
      where,
      orderBy,
      include: def.listInclude,
      ...(p.all ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
    }),
    d.count({ where }),
  ]);
  return { items: items as Record<string, any>[], total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getItem(def: CollectionDef, id: string) {
  const include = formInclude(def);
  return (await delegate(def).findUnique({
    where: { id },
    ...(Object.keys(include).length ? { include } : {}),
  })) as Record<string, any> | null;
}

// ─────────────── Mutasi ───────────────

export type SaveMeta = { status?: Status; publishedAt?: string | null };

async function ensureUniqueSlug(def: CollectionDef, values: Record<string, unknown>, id: string | null) {
  const field = def.slugField;
  if (!field || field === "path") return;
  const d = delegate(def);
  let slug = String(values[field] ?? "").trim();
  const auto = slug === "";
  if (auto) {
    const src = def.slugFrom ? values[def.slugFrom] : "";
    const text =
      typeof src === "string" ? src : (pick(src as { id: string; en: string }, "en") ?? labelOf(src));
    slug = slugify(text || "") || `item-${Date.now().toString(36)}`;
  }
  const scope: Record<string, unknown> = def.reorderScope ? { [def.reorderScope]: values[def.reorderScope] } : {};
  for (let i = 1; i < 50; i++) {
    const candidate = i === 1 ? slug : `${slug}-${i}`;
    const existing = await d.findFirst({ where: { [field]: candidate, ...scope }, select: { id: true } });
    if (!existing || existing.id === id) {
      values[field] = candidate;
      return;
    }
    if (!auto) throw new ValidationError("Slug sudah dipakai", { [field]: `"${candidate}" sudah dipakai data lain` });
  }
  throw new ValidationError("Gagal membuat slug unik");
}

export function validateValues(fields: Fields, input: unknown) {
  const parsed = schemaFor(fields).safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    throw new ValidationError("Periksa kembali isian yang ditandai.", fieldErrors);
  }
  return parsed.data as Record<string, unknown>;
}

export async function saveItem(
  def: CollectionDef,
  id: string | null,
  input: unknown,
  meta: SaveMeta,
  userId: string | null,
) {
  const values = sanitizeFields(def.fields, validateValues(def.fields, input));
  await ensureUniqueSlug(def, values, id);
  const { data, joins } = toPrismaData(def, values, id ? "update" : "create");
  data.searchText = buildSearchText(values, def.searchFields);

  if (def.hasStatus) {
    if (meta.status) data.status = meta.status;
    if (meta.publishedAt !== undefined) data.publishedAt = meta.publishedAt ? new Date(meta.publishedAt) : null;
    if (meta.status === "PUBLISHED" && !meta.publishedAt) {
      const current = id ? await delegate(def).findUnique({ where: { id }, select: { publishedAt: true } }) : null;
      data.publishedAt = current?.publishedAt ?? new Date();
    }
  }
  const audited = ["newsArticle", "job", "caseStudy", "product", "solution", "industry", "testimonial"].includes(def.model);
  if (audited) {
    data.updatedById = userId;
    if (!id) data.createdById = userId;
  }

  try {
    return await prisma.$transaction(async (tx: any) => {
      const d = tx[def.model];
      let saved: { id: string };
      if (id) saved = await d.update({ where: { id }, data });
      else {
        if (def.orderable) {
          const scope = def.reorderScope ? { [def.reorderScope]: values[def.reorderScope] } : {};
          const last = await d.findFirst({ where: scope, orderBy: { order: "desc" }, select: { order: true } });
          data.order = (last?.order ?? -1) + 1;
        }
        saved = await d.create({ data });
      }
      for (const j of joins) {
        const cfg = joinOf(def, j.key);
        await tx[cfg.model].deleteMany({ where: { [cfg.ownKey]: saved.id } });
        if (j.ids.length)
          await tx[cfg.model].createMany({
            data: j.ids.map((other, order) => ({ [cfg.ownKey]: saved.id, [cfg.otherKey]: other, order })),
          });
      }
      return saved;
    });
  } catch (e) {
    throw mapPrismaError(e);
  }
}

export async function setItemStatus(def: CollectionDef, id: string, status: Status) {
  if (!def.hasStatus) throw new ValidationError("Konten ini tidak memiliki status.");
  const current = await delegate(def).findUnique({ where: { id }, select: { publishedAt: true } });
  if (!current) throw new ValidationError("Data tidak ditemukan.");
  return delegate(def).update({
    where: { id },
    data: { status, ...(status === "PUBLISHED" && !current.publishedAt ? { publishedAt: new Date() } : {}) },
  });
}

export async function deleteItem(def: CollectionDef, id: string) {
  try {
    await delegate(def).delete({ where: { id } });
  } catch (e) {
    throw mapPrismaError(e);
  }
}

export async function reorderItems(def: CollectionDef, ids: string[]) {
  if (!def.orderable) throw new ValidationError("Konten ini tidak bisa diurutkan.");
  await prisma.$transaction(ids.map((id, order) => delegate(def).update({ where: { id }, data: { order } })));
}

export function mapPrismaError(e: unknown): Error {
  if (e instanceof ValidationError) return e;
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      const target = (e.meta?.target as string[] | string | undefined) ?? "";
      const fields = Array.isArray(target) ? target : [target];
      return new ValidationError(
        "Nilai sudah dipakai data lain.",
        Object.fromEntries(fields.filter(Boolean).map((f) => [f, "Sudah dipakai data lain"])),
      );
    }
    if (e.code === "P2003" || e.code === "P2014")
      return new ValidationError("Data ini masih dipakai oleh konten lain sehingga tidak bisa dihapus/diubah.");
    if (e.code === "P2025") return new ValidationError("Data tidak ditemukan.");
  }
  return e instanceof Error ? e : new Error(String(e));
}

// ─────────────── Opsi relasi untuk form ───────────────

export type RefOption = { id: string; label: string; hint?: string };

export async function refOptions(target: string, vocabulary?: string): Promise<RefOption[]> {
  const def = mustCollection(target);
  const where: Record<string, unknown> = {};
  if (vocabulary && target === "terms") where.vocabulary = vocabulary;
  const rows: Record<string, any>[] = await delegate(def).findMany({
    where,
    orderBy: [sortClause(def), { createdAt: "desc" }],
    take: 1000,
  });
  return rows.map((r) => ({
    id: r.id,
    label: labelOf(r[def.titleField]) || r.slug || r.key || r.id,
    hint: [r.slug ?? r.key, def.hasStatus && r.status !== "PUBLISHED" ? r.status.toLowerCase() : null]
      .filter(Boolean)
      .join(" · "),
  }));
}
