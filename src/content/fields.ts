import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// DSL field: satu definisi → Zod schema, nilai default, form admin,
// serializer API publik (localize + resolve media/ref).
// Modul ini murni data (aman di-import dari client maupun server).
// ─────────────────────────────────────────────────────────────

export type Option = { value: string; label: string };

export type RefTarget =
  | "terms"
  | "clients"
  | "testimonials"
  | "authors"
  | "products"
  | "product-categories"
  | "solutions"
  | "industries"
  | "case-studies";

type Base = {
  label: string;
  required?: boolean;
  help?: string;
  placeholder?: string;
  /** Tampilkan field hanya bila field saudara bernilai tertentu (hanya UI). */
  showIf?: { field: string; equals: string | string[] };
};

export type TextField = Base & { kind: "text"; multiline?: boolean; format?: "url" | "email" | "slug" };
export type LTextField = Base & { kind: "ltext"; multiline?: boolean; rich?: boolean };
export type LListField = Base & { kind: "llist" };
export type ListField = Base & { kind: "list" };
export type NumberField = Base & { kind: "number"; min?: number; max?: number };
export type BoolField = Base & { kind: "bool"; default?: boolean };
export type DateField = Base & { kind: "date" | "datetime" };
export type SelectField = Base & { kind: "select"; options: Option[]; default?: string };
export type MultiSelectField = Base & { kind: "multiselect"; options: Option[] };
export type MediaField = Base & { kind: "media" };
export type MediaListField = Base & { kind: "mediaList" };
export type RefField = Base & {
  kind: "ref";
  target: RefTarget;
  vocabulary?: string;
  multiple?: boolean;
  /** Hanya untuk field top-level collection: "join" = tabel penghubung berurutan. */
  relation?: "join";
};
export type IconField = Base & { kind: "icon" };
export type ObjectField = Base & { kind: "object"; fields: Fields; nullable?: boolean };
export type ArrayField = Base & { kind: "array"; fields: Fields; itemLabel?: string; max?: number };
export type BlockDef = { label: string; description?: string; fields: Fields };
export type BlocksField = Base & { kind: "blocks"; blocks: Record<string, BlockDef> };
export type JsonField = Base & { kind: "json" };

export type Field =
  | TextField
  | LTextField
  | LListField
  | ListField
  | NumberField
  | BoolField
  | DateField
  | SelectField
  | MultiSelectField
  | MediaField
  | MediaListField
  | RefField
  | IconField
  | ObjectField
  | ArrayField
  | BlocksField
  | JsonField;

export type Fields = Record<string, Field>;

type O<T> = Omit<T, "kind" | "label">;

// ─────────────── Builder ───────────────
export const f = {
  text: (label: string, o: O<TextField> = {}): TextField => ({ kind: "text", label, ...o }),
  textarea: (label: string, o: O<TextField> = {}): TextField => ({ kind: "text", label, multiline: true, ...o }),
  url: (label: string, o: O<TextField> = {}): TextField => ({ kind: "text", label, format: "url", ...o }),
  email: (label: string, o: O<TextField> = {}): TextField => ({ kind: "text", label, format: "email", ...o }),
  slug: (label = "Slug", o: O<TextField> = {}): TextField => ({
    kind: "text",
    label,
    format: "slug",
    help: "Huruf kecil, angka, dan tanda hubung. Kosongkan untuk dibuat otomatis dari judul.",
    ...o,
  }),
  /** Teks pendek terlokalisasi L<string> */
  l: (label: string, o: O<LTextField> = {}): LTextField => ({ kind: "ltext", label, ...o }),
  /** Teks panjang terlokalisasi L<text> */
  lt: (label: string, o: O<LTextField> = {}): LTextField => ({ kind: "ltext", label, multiline: true, ...o }),
  /** Rich text terlokalisasi L<richtext> (HTML tersanitasi) */
  lrich: (label: string, o: O<LTextField> = {}): LTextField => ({ kind: "ltext", label, rich: true, ...o }),
  /** Daftar string terlokalisasi L<string[]> — satu item per baris */
  llist: (label: string, o: O<LListField> = {}): LListField => ({ kind: "llist", label, ...o }),
  list: (label: string, o: O<ListField> = {}): ListField => ({ kind: "list", label, ...o }),
  number: (label: string, o: O<NumberField> = {}): NumberField => ({ kind: "number", label, ...o }),
  bool: (label: string, o: O<BoolField> = {}): BoolField => ({ kind: "bool", label, ...o }),
  date: (label: string, o: O<DateField> = {}): DateField => ({ kind: "date", label, ...o }),
  datetime: (label: string, o: O<DateField> = {}): DateField => ({ kind: "datetime", label, ...o }),
  select: (label: string, options: Option[] | string[], o: Omit<O<SelectField>, "options"> = {}): SelectField => ({
    kind: "select",
    label,
    options: options.map((x) => (typeof x === "string" ? { value: x, label: x } : x)),
    ...o,
  }),
  multiselect: (
    label: string,
    options: Option[] | string[],
    o: Omit<O<MultiSelectField>, "options"> = {},
  ): MultiSelectField => ({
    kind: "multiselect",
    label,
    options: options.map((x) => (typeof x === "string" ? { value: x, label: x } : x)),
    ...o,
  }),
  media: (label: string, o: O<MediaField> = {}): MediaField => ({ kind: "media", label, ...o }),
  mediaList: (label: string, o: O<MediaListField> = {}): MediaListField => ({ kind: "mediaList", label, ...o }),
  ref: (label: string, target: RefTarget, o: Omit<O<RefField>, "target"> = {}): RefField => ({
    kind: "ref",
    label,
    target,
    ...o,
  }),
  icon: (label = "Ikon", o: O<IconField> = {}): IconField => ({ kind: "icon", label, ...o }),
  object: (label: string, fields: Fields, o: Omit<O<ObjectField>, "fields"> = {}): ObjectField => ({
    kind: "object",
    label,
    fields,
    ...o,
  }),
  array: (label: string, fields: Fields, o: Omit<O<ArrayField>, "fields"> = {}): ArrayField => ({
    kind: "array",
    label,
    fields,
    ...o,
  }),
  blocks: (label: string, blocks: Record<string, BlockDef>, o: Omit<O<BlocksField>, "blocks"> = {}): BlocksField => ({
    kind: "blocks",
    label,
    blocks,
    ...o,
  }),
  json: (label: string, o: O<JsonField> = {}): JsonField => ({ kind: "json", label, ...o }),
};

// ─────────────── Default value ───────────────
export function defaultFor(field: Field): unknown {
  switch (field.kind) {
    case "text":
    case "date":
    case "datetime":
    case "icon":
      return "";
    case "ltext":
      return { id: "", en: "" };
    case "llist":
      return { id: [], en: [] };
    case "list":
    case "multiselect":
    case "mediaList":
    case "array":
    case "blocks":
      return [];
    case "number":
      return null;
    case "bool":
      return field.default ?? false;
    case "select":
      return field.default ?? "";
    case "media":
      return null;
    case "ref":
      return field.multiple ? [] : null;
    case "object":
      return field.nullable ? null : defaultsFor(field.fields);
    case "json":
      return null;
  }
}

export function defaultsFor(fields: Fields): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, field] of Object.entries(fields)) out[k] = defaultFor(field);
  return out;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Lengkapi data (mis. dari DB) dengan default untuk key yang belum ada — tahan terhadap perubahan skema. */
export function withDefaults(fields: Fields, data: unknown): Record<string, unknown> {
  const src = isObj(data) ? data : {};
  const out: Record<string, unknown> = {};
  for (const [k, field] of Object.entries(fields)) out[k] = fillField(field, src[k]);
  return out;
}

function fillField(field: Field, v: unknown): unknown {
  if (v === undefined) return defaultFor(field);
  switch (field.kind) {
    case "text":
    case "date":
    case "datetime":
    case "icon":
    case "select":
      return v == null ? "" : v;
    case "ltext":
      return isObj(v) ? { id: (v.id as string) ?? "", en: (v.en as string) ?? "" } : { id: "", en: "" };
    case "llist":
      return isObj(v)
        ? { id: Array.isArray(v.id) ? v.id : [], en: Array.isArray(v.en) ? v.en : [] }
        : { id: [], en: [] };
    case "list":
    case "multiselect":
    case "mediaList":
      return Array.isArray(v) ? v : [];
    case "ref":
      return field.multiple ? (Array.isArray(v) ? v : []) : (v ?? null);
    case "object":
      if (v == null) return field.nullable ? null : defaultsFor(field.fields);
      return withDefaults(field.fields, v);
    case "array":
      return Array.isArray(v) ? v.map((item) => withDefaults(field.fields, item)) : [];
    case "blocks":
      return Array.isArray(v)
        ? v
            .filter((b) => isObj(b) && typeof b.type === "string" && field.blocks[b.type as string])
            .map((b) => {
              const block = b as Record<string, unknown>;
              const def = field.blocks[block.type as string];
              return { type: block.type, ...withDefaults(blockFields(def), block) };
            })
        : [];
    default:
      return v;
  }
}

/** Field standar yang ditambahkan ke setiap blok page builder. */
export const blockCommonFields: Fields = {
  anchorId: f.text("Anchor ID", { help: "Opsional, untuk link scroll (#anchor)." }),
  hidden: f.bool("Sembunyikan blok"),
};

export function blockFields(def: BlockDef): Fields {
  return { ...def.fields, ...blockCommonFields };
}

// ─────────────── Zod ───────────────
const REQ = "Wajib diisi";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const filled = (s: unknown) => typeof s === "string" && s.replace(/<p><\/p>/g, "").trim() !== "";

export function zodFor(field: Field): z.ZodType {
  switch (field.kind) {
    case "text": {
      let s: z.ZodType<string> = z.string().trim();
      if (field.format === "url")
        s = s.refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "URL harus diawali http:// atau https://");
      if (field.format === "email")
        s = s.refine((v) => v === "" || z.email().safeParse(v).success, "Format email tidak valid");
      if (field.format === "slug")
        s = s.refine((v) => v === "" || SLUG_RE.test(v), "Gunakan huruf kecil, angka, dan tanda hubung");
      if (field.required) s = s.refine((v) => v !== "", REQ);
      return s;
    }
    case "ltext": {
      const s = z.object({ id: z.string(), en: z.string() });
      return field.required ? s.refine((v) => filled(v.id) || filled(v.en), REQ) : s;
    }
    case "llist": {
      const arr = z.array(z.string().trim()).transform((a) => a.filter((x) => x !== ""));
      const s = z.object({ id: arr, en: arr });
      return field.required ? s.refine((v) => v.id.length > 0 || v.en.length > 0, REQ) : s;
    }
    case "list": {
      const s = z.array(z.string().trim()).transform((a) => a.filter((x) => x !== ""));
      return field.required ? s.refine((v) => v.length > 0, REQ) : s;
    }
    case "number": {
      let n = z.number({ message: "Harus berupa angka" });
      if (field.min != null) n = n.min(field.min, `Minimal ${field.min}`);
      if (field.max != null) n = n.max(field.max, `Maksimal ${field.max}`);
      const s = n.nullable();
      return field.required ? s.refine((v) => v != null, REQ) : s;
    }
    case "bool":
      return z.boolean();
    case "date": {
      const s = z.string().refine((v) => v === "" || DATE_RE.test(v), "Format tanggal tidak valid");
      return field.required ? s.refine((v) => v !== "", REQ) : s;
    }
    case "datetime": {
      const s = z.string().refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Format waktu tidak valid");
      return field.required ? s.refine((v) => v !== "", REQ) : s;
    }
    case "select": {
      const values = field.options.map((o) => o.value);
      const s = z.string().refine((v) => v === "" || values.includes(v), "Pilihan tidak valid");
      return field.required ? s.refine((v) => v !== "", REQ) : s;
    }
    case "multiselect": {
      const values = field.options.map((o) => o.value);
      const s = z.array(z.string().refine((v) => values.includes(v), "Pilihan tidak valid"));
      return field.required ? s.min(1, REQ) : s;
    }
    case "icon": {
      return field.required ? z.string().min(1, REQ) : z.string();
    }
    case "media": {
      const s = z
        .string()
        .nullable()
        .transform((v) => (v === "" ? null : v));
      return field.required ? s.refine((v) => v != null, "Pilih gambar") : s;
    }
    case "mediaList":
      return field.required ? z.array(z.string()).min(1, "Pilih minimal satu gambar") : z.array(z.string());
    case "ref": {
      if (field.multiple) return field.required ? z.array(z.string()).min(1, REQ) : z.array(z.string());
      const s = z
        .string()
        .nullable()
        .transform((v) => (v === "" ? null : v));
      return field.required ? s.refine((v) => v != null, REQ) : s;
    }
    case "object": {
      const s = objectZod(field.fields);
      return field.nullable ? s.nullable() : s;
    }
    case "array": {
      let s = z.array(objectZod(field.fields));
      if (field.required) s = s.min(1, "Tambahkan minimal satu item");
      if (field.max) s = s.max(field.max, `Maksimal ${field.max} item`);
      return s;
    }
    case "blocks": {
      const variants = Object.entries(field.blocks).map(([type, def]) =>
        objectZod(blockFields(def)).extend({ type: z.literal(type) }),
      );
      const union = variants.length
        ? z.discriminatedUnion("type", variants as unknown as [z.ZodObject, ...z.ZodObject[]])
        : z.never();
      return z.array(union);
    }
    case "json":
      return z.any();
  }
}

export function objectZod(fields: Fields) {
  const shape: Record<string, z.ZodType> = {};
  for (const [k, field] of Object.entries(fields)) shape[k] = zodFor(field);
  return z.object(shape);
}

const zodCache = new WeakMap<Fields, z.ZodObject>();
export function schemaFor(fields: Fields): z.ZodObject {
  let s = zodCache.get(fields);
  if (!s) {
    s = objectZod(fields);
    zodCache.set(fields, s);
  }
  return s;
}

/** Kumpulkan teks untuk kolom searchText dari field top-level tertentu. */
export function buildSearchText(data: Record<string, unknown>, keys: string[]): string {
  const parts: string[] = [];
  for (const k of keys) {
    const v = data[k];
    if (typeof v === "string") parts.push(v);
    else if (isObj(v)) {
      for (const lang of ["id", "en"]) {
        const x = v[lang];
        if (typeof x === "string") parts.push(x);
        else if (Array.isArray(x)) parts.push(x.join(" "));
      }
    }
  }
  return parts
    .join(" ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, 4000);
}
