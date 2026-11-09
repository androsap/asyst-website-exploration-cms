/* eslint-disable @typescript-eslint/no-explicit-any */
// Importer konten asli website asyst-web → CMS (lihat CMS_HANDOFF_ASYST_WEB.md §3).
//
//   npm run db:import-web                          → impor/update (idempoten)
//   IMPORT_RESET=true npm run db:import-web        → hapus semua konten dulu (disarankan untuk impor pertama)
//   IMPORT_DRY_RUN=true npm run db:import-web      → validasi saja, tanpa menulis ke DB/file
//
// Env: ASYST_WEB_DIR (default ../asyst-web), IMPORT_FILE (default <ASYST_WEB_DIR>/cms-export/asyst-content.json).
// Semua data melewati withDefaults + validasi Zod + sanitasi yang sama dengan form admin (saveItem/saveSingleton).
import "dotenv/config";
import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { prisma } from "../src/lib/prisma";
import { blobEnabled } from "../src/lib/env";
import { ALLOWED_MIME, MAX_UPLOAD_BYTES } from "../src/lib/media";
import { blockFields, withDefaults, type Field, type Fields } from "../src/content/fields";
import { getCollection, type CollectionDef } from "../src/content/collections";
import { getSingleton, SINGLETONS } from "../src/content/singletons";
import { ICON_KEYS } from "../src/content/icons";
import { delegate, reorderItems, saveItem, validateValues, ValidationError, type Status } from "../src/server/repo/collections";
import { saveSingleton } from "../src/server/repo/singletons";
import { findImportUser, resetContent } from "./shared";

// ─────────────── Konfigurasi ───────────────

const WEB_DIR = path.resolve(process.env.ASYST_WEB_DIR || "../asyst-web");
const IMPORT_FILE = path.resolve(process.env.IMPORT_FILE || path.join(WEB_DIR, "cms-export", "asyst-content.json"));
const RESET = process.env.IMPORT_RESET === "true";
const DRY = process.env.IMPORT_DRY_RUN === "true";

/** Urutan impor (§3.4) — mengikuti arah relasi. */
const ORDER = [
  "terms",
  "authors",
  "clients",
  "testimonials",
  "awards",
  "leaders",
  "offices",
  "products",
  "product-categories",
  "solutions",
  "industries",
  "jobs",
  "case-studies",
  "news",
  "page-seo",
];

/** Natural key per collection; dipakai untuk upsert dan untuk me-resolve penanda `$ref`. */
const NATURAL_KEY: Record<string, { label: string; of: (d: any) => string | undefined }> = {
  terms: { label: "vocabulary:key", of: (d) => (d?.vocabulary && d?.key ? `${d.vocabulary}:${d.key}` : undefined) },
  products: { label: "slug", of: (d) => d?.slug || undefined },
  "case-studies": { label: "slug", of: (d) => d?.slug || undefined },
  solutions: { label: "slug", of: (d) => d?.slug || undefined },
  industries: { label: "slug", of: (d) => d?.slug || undefined },
  jobs: { label: "slug", of: (d) => d?.slug || undefined },
  news: { label: "slug", of: (d) => d?.slug || undefined },
  clients: { label: "name", of: (d) => d?.name || undefined },
  testimonials: { label: "name", of: (d) => d?.name || undefined },
  authors: { label: "name", of: (d) => d?.name || undefined },
  leaders: { label: "name", of: (d) => d?.name || undefined },
  "product-categories": { label: "key", of: (d) => d?.key || undefined },
  offices: { label: "title.en", of: (d) => d?.title?.en || d?.title?.id || undefined },
  awards: { label: "title.en", of: (d) => d?.title?.en || d?.title?.id || undefined },
  "page-seo": { label: "path", of: (d) => d?.path || undefined },
};

const MIME_BY_EXT: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
};

type L = { id: string; en: string };
type ExportItem = { status?: Status; order?: number; data: Record<string, unknown> };
type ExportFile = {
  version: number;
  icons?: string[];
  media?: string[];
  collections?: Record<string, ExportItem[]>;
  singletons?: Record<string, Record<string, unknown>>;
};

// ─────────────── Laporan ───────────────

type Stat = { create: number; update: number; failed: number; valid: number };
const report = {
  collections: new Map<string, Stat>(),
  singletons: { saved: [] as string[], failed: [] as string[], skipped: [] as string[] },
  media: { uploaded: 0, updated: 0, failed: 0 },
  errors: [] as { item: string; message: string; fieldErrors?: Record<string, string> }[],
  unresolved: [] as string[],
  unknownFields: [] as string[],
  unknownIcons: new Set<string>(),
  warnings: [] as string[],
};

const statOf = (type: string) => {
  let s = report.collections.get(type);
  if (!s) report.collections.set(type, (s = { create: 0, update: 0, failed: 0, valid: 0 }));
  return s;
};

function recordError(item: string, e: unknown) {
  if (e instanceof ValidationError) report.errors.push({ item, message: e.message, fieldErrors: e.fieldErrors });
  else report.errors.push({ item, message: e instanceof Error ? e.message : String(e) });
}

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);

// ─────────────── Index natural key → id ───────────────

const index = new Map<string, Map<string, string>>();
const idx = (type: string) => {
  let m = index.get(type);
  if (!m) index.set(type, (m = new Map()));
  return m;
};

async function loadIndex(type: string) {
  const def = getCollection(type);
  const nk = NATURAL_KEY[type];
  if (!def || !nk) return;
  const rows: any[] = await delegate(def).findMany();
  for (const r of rows) {
    const k = nk.of(r);
    if (k && !idx(type).has(k)) idx(type).set(k, r.id);
  }
}

function lookupRef(marker: Record<string, any>): string | null {
  const { $ref: type, ...rest } = marker;
  const nk = NATURAL_KEY[type];
  const k = nk?.of(rest);
  return (k && index.get(type)?.get(k)) || null;
}

// ─────────────── Media ───────────────

const mediaIds = new Map<string, string>();

function titleFromFilename(p: string) {
  return path
    .basename(p, path.extname(p))
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Lebar/tinggi dari header PNG/WebP/GIF/SVG tanpa dependensi tambahan. */
function imageSize(buf: Buffer, mime: string): { width: number | null; height: number | null } {
  try {
    if (mime === "image/png" && buf.length > 24 && buf.toString("ascii", 12, 16) === "IHDR")
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    if (mime === "image/gif" && buf.length > 10) return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    if (mime === "image/webp" && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
      const chunk = buf.toString("ascii", 12, 16);
      if (chunk === "VP8X") return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
      if (chunk === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
      if (chunk === "VP8L") {
        const b = buf.readUInt32LE(21);
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
    }
    if (mime === "image/svg+xml") {
      const head = buf.toString("utf8", 0, Math.min(buf.length, 4000));
      const tag = head.match(/<svg\b[^>]*>/i)?.[0] ?? "";
      const num = (attr: string) => {
        const m = tag.match(new RegExp(`\\b${attr}\\s*=\\s*["']\\s*([\\d.]+)(px)?\\s*["']`, "i"));
        return m ? Math.round(Number(m[1])) : null;
      };
      const w = num("width");
      const h = num("height");
      if (w && h) return { width: w, height: h };
      const vb = tag.match(/viewBox\s*=\s*["']\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
      if (vb) return { width: Math.round(Number(vb[1])), height: Math.round(Number(vb[2])) };
    }
  } catch {
    // header tidak terbaca → biarkan null
  }
  return { width: null, height: null };
}

/** Kumpulkan semua path media + alt pertama yang tersedia dari seluruh pohon. */
function collectMedia(file: ExportFile) {
  const alts = new Map<string, L | null>();
  for (const p of file.media ?? []) if (!alts.has(p)) alts.set(p, null);
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!isObj(v)) return;
    if (typeof v.$media === "string") {
      const alt = isObj(v.alt) && (v.alt.id || v.alt.en) ? { id: v.alt.id || v.alt.en, en: v.alt.en || v.alt.id } : null;
      if (!alts.get(v.$media)) alts.set(v.$media, alt);
      return;
    }
    Object.values(v).forEach(walk);
  };
  walk(file.collections);
  walk(file.singletons);
  return alts;
}

async function importMedia(alts: Map<string, L | null>, userId: string | null) {
  const useBlob = blobEnabled();
  let n = 0;
  for (const [p, altFromMarker] of alts) {
    const rel = p.replace(/\\/g, "/").replace(/^\/+/, "");
    const abs = path.resolve(WEB_DIR, rel);
    const label = `media ${rel}`;
    try {
      if (!abs.startsWith(WEB_DIR + path.sep)) throw new Error("Path di luar ASYST_WEB_DIR");
      if (!existsSync(abs)) throw new Error(`File tidak ditemukan: ${abs}`);
      const mimeType = MIME_BY_EXT[path.extname(rel).toLowerCase()];
      if (!mimeType || !ALLOWED_MIME.includes(mimeType)) throw new Error(`Tipe file tidak diizinkan (${path.extname(rel)})`);
      const size = (await stat(abs)).size;
      if (size > MAX_UPLOAD_BYTES) throw new Error(`Ukuran file melebihi ${MAX_UPLOAD_BYTES} byte`);

      const pathname = `asyst-web/${rel}`;
      if (DRY) {
        mediaIds.set(p, `dry-media-${++n}`);
        continue;
      }

      const buf = await readFile(abs);
      let url: string;
      if (useBlob) {
        const blob = await put(pathname, buf, { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: mimeType });
        url = blob.url;
      } else {
        const dest = path.join(process.cwd(), "public", "uploads", ...pathname.split("/"));
        await mkdir(path.dirname(dest), { recursive: true });
        await writeFile(dest, buf);
        url = `/uploads/${pathname}`;
      }
      const { width, height } = imageSize(buf, mimeType);
      const fallback = titleFromFilename(rel);
      const alt = altFromMarker ?? { id: fallback, en: fallback };
      const data = { url, filename: path.basename(rel), size, mimeType, width, height, alt };
      const existing = await prisma.media.findUnique({ where: { pathname }, select: { id: true } });
      const m = await prisma.media.upsert({
        where: { pathname },
        create: { ...data, pathname, uploadedById: userId },
        update: data,
        select: { id: true },
      });
      mediaIds.set(p, m.id);
      if (existing) report.media.updated++;
      else report.media.uploaded++;
    } catch (e) {
      report.media.failed++;
      recordError(label, e);
    }
  }
  console.log(
    DRY
      ? `• Media diperiksa: ${mediaIds.size} OK, ${report.media.failed} gagal`
      : `✔ Media: ${report.media.uploaded} baru, ${report.media.updated} diperbarui, ${report.media.failed} gagal (${useBlob ? "Vercel Blob" : "public/uploads"})`,
  );
}

// ─────────────── Resolve penanda $media / $ref ───────────────

const DROP = Symbol("drop");

function resolveTree(v: unknown, where: string, inArray = false): unknown {
  if (Array.isArray(v)) {
    const out: unknown[] = [];
    for (const x of v) {
      const r = resolveTree(x, where, true);
      if (r !== DROP) out.push(r);
    }
    return out;
  }
  if (!isObj(v)) return v;
  if (typeof v.$media === "string") {
    const id = mediaIds.get(v.$media);
    if (id) return id;
    report.unresolved.push(`${where}: media "${v.$media}" tidak tersedia`);
    return inArray ? DROP : null;
  }
  if (typeof v.$ref === "string") {
    const id = lookupRef(v);
    if (id) return id;
    const { $ref, ...rest } = v;
    report.unresolved.push(`${where}: $ref ${$ref} ${JSON.stringify(rest)} tidak ditemukan`);
    return inArray ? DROP : null;
  }
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) out[k] = resolveTree(x, where);
  return out;
}

/** Laporkan key di data yang tidak ada di definisi field (akan dibuang oleh withDefaults) & ikon tak dikenal. */
function checkShape(fields: Fields, v: unknown, p: string) {
  if (!isObj(v)) return;
  for (const [k, x] of Object.entries(v)) {
    const at = p ? `${p}.${k}` : k;
    const field = fields[k];
    if (!field) report.unknownFields.push(at);
    else checkField(field, x, at);
  }
}

function checkField(field: Field, v: unknown, p: string) {
  switch (field.kind) {
    case "icon":
      if (typeof v === "string" && v && !ICON_KEYS.includes(v)) report.unknownIcons.add(v);
      break;
    case "object":
      checkShape(field.fields, v, p);
      break;
    case "array":
      if (Array.isArray(v)) v.forEach((x, i) => checkShape(field.fields, x, `${p}[${i}]`));
      break;
    case "blocks":
      if (!Array.isArray(v)) break;
      v.forEach((b, i) => {
        if (!isObj(b)) return;
        const def = field.blocks[b.type];
        if (!def) return report.unknownFields.push(`${p}[${i}] (blok "${b.type}" tidak dikenal)`);
        const rest = { ...b };
        delete rest.type;
        checkShape(blockFields(def), rest, `${p}[${i}:${b.type}]`);
      });
      break;
  }
}

// ─────────────── Collection ───────────────

function itemLabel(type: string, item: ExportItem, i: number) {
  const nk = NATURAL_KEY[type];
  const k = nk?.of(item.data);
  return k ? `${type}[${nk.label}=${k}]` : `${type}[#${i}]`;
}

async function saveOne(def: CollectionDef, item: ExportItem, label: string, userId: string | null, data: Record<string, unknown>) {
  const resolved = resolveTree(data, label) as Record<string, unknown>;
  checkShape(def.fields, resolved, label);
  const values = withDefaults(def.fields, resolved);
  if (DRY) {
    validateValues(def.fields, values);
    return null;
  }
  const key = NATURAL_KEY[def.type]?.of(item.data);
  const existingId = key ? (idx(def.type).get(key) ?? null) : null;
  const status = def.hasStatus ? (item.status ?? "PUBLISHED") : undefined;
  const saved = await saveItem(def, existingId, values, { status }, userId);
  if (key) idx(def.type).set(key, saved.id);
  return { id: saved.id, created: !existingId };
}

async function importCollection(type: string, items: ExportItem[], userId: string | null) {
  const def = getCollection(type);
  if (!def) {
    report.warnings.push(`Collection "${type}" tidak dikenal di CMS — dilewati`);
    return;
  }
  const st = statOf(type);
  if (!items.length) {
    console.log(`• ${type}: kosong di ekspor`);
    return;
  }

  // Duplikat natural key di file → item kedua menimpa yang pertama; laporkan sebagai error.
  const seen = new Set<string>();
  const ordered = items
    .map((item, i) => ({ item, i, label: itemLabel(type, item, i) }))
    .sort((a, b) => (a.item.order ?? a.i) - (b.item.order ?? b.i) || a.i - b.i);

  const savedIds: { id: string; scope: unknown }[] = [];
  const twoStage = type === "case-studies" && !DRY;

  for (const { item, label } of ordered) {
    const key = NATURAL_KEY[type]?.of(item.data);
    if (key && seen.has(key)) {
      st.failed++;
      recordError(label, new Error(`Natural key duplikat di file ekspor (${key})`));
      continue;
    }
    if (key) seen.add(key);
    try {
      // Studi kasus tahap 1: simpan tanpa `related` (slug tujuan mungkin belum ada).
      const data = twoStage ? { ...item.data, related: [] } : item.data;
      const r = await saveOne(def, item, label, userId, data);
      st.valid++;
      if (r) {
        if (r.created) st.create++;
        else st.update++;
        savedIds.push({ id: r.id, scope: def.reorderScope ? (item.data as any)[def.reorderScope] : null });
      }
    } catch (e) {
      st.failed++;
      recordError(label, e);
    }
  }

  // Studi kasus tahap 2: isi `related` setelah semua slug ada.
  if (twoStage) {
    for (const { item, label } of ordered) {
      const related = (item.data as any).related;
      if (!Array.isArray(related) || !related.length) continue;
      const key = NATURAL_KEY[type].of(item.data);
      if (!key || !idx(type).has(key)) continue;
      try {
        await saveOne(def, item, `${label} (related)`, userId, item.data);
      } catch (e) {
        st.failed++;
        recordError(`${label} (related)`, e);
      }
    }
  }

  // Samakan urutan tampil dengan urutan file (per vocabulary untuk terms). Item lain di DB ditaruh di belakang.
  if (!DRY && def.orderable && savedIds.length) {
    const scopes = new Map<unknown, string[]>();
    for (const s of savedIds) {
      if (!scopes.has(s.scope)) scopes.set(s.scope, []);
      scopes.get(s.scope)!.push(s.id);
    }
    for (const [scope, ids] of scopes) {
      const where = def.reorderScope ? { [def.reorderScope]: scope } : {};
      const all: { id: string }[] = await delegate(def).findMany({ where, orderBy: { order: "asc" }, select: { id: true } });
      const rest = all.map((r) => r.id).filter((id) => !ids.includes(id));
      await reorderItems(def, [...ids, ...rest]);
    }
  }

  console.log(
    DRY
      ? `• ${type}: ${st.valid} valid, ${st.failed} gagal`
      : `✔ ${type}: ${st.create} dibuat, ${st.update} diperbarui, ${st.failed} gagal`,
  );
}

// ─────────────── Singleton ───────────────

async function importSingletons(data: Record<string, Record<string, unknown>>, userId: string | null) {
  for (const slug of Object.keys(data)) {
    if (!getSingleton(slug)) report.warnings.push(`Singleton "${slug}" tidak dikenal di CMS — dilewati`);
  }
  for (const def of SINGLETONS) {
    const raw = data[def.slug];
    if (!raw) {
      report.singletons.skipped.push(def.slug);
      continue;
    }
    const label = `singleton ${def.slug}`;
    try {
      const resolved = resolveTree(raw, label);
      checkShape(def.fields, resolved, label);
      const values = withDefaults(def.fields, resolved);
      if (DRY) validateValues(def.fields, values);
      else await saveSingleton(def, values, userId, true);
      report.singletons.saved.push(def.slug);
    } catch (e) {
      report.singletons.failed.push(def.slug);
      recordError(label, e);
    }
  }
  console.log(
    `${DRY ? "•" : "✔"} Singleton: ${report.singletons.saved.length} ${DRY ? "valid" : "tersimpan & terbit"}, ${report.singletons.failed.length} gagal`,
  );
}

// ─────────────── Main ───────────────

function printReport() {
  const line = "─".repeat(64);
  console.log(`\n${line}\nRingkasan impor${DRY ? " (DRY RUN — tidak ada yang ditulis)" : ""}\n${line}`);
  const rows = [...report.collections.entries()].map(([type, s]) =>
    DRY
      ? { collection: type, valid: s.valid, gagal: s.failed }
      : { collection: type, dibuat: s.create, diperbarui: s.update, gagal: s.failed },
  );
  if (rows.length) console.table(rows);
  console.log(`Singleton ${DRY ? "valid" : "tersimpan"}: ${report.singletons.saved.join(", ") || "-"}`);
  if (report.singletons.skipped.length)
    console.log(`Singleton tidak ada di ekspor (tidak diubah): ${report.singletons.skipped.join(", ")}`);
  console.log(
    DRY
      ? `Media: ${mediaIds.size} siap diunggah, ${report.media.failed} gagal`
      : `Media: ${report.media.uploaded} diunggah baru, ${report.media.updated} diperbarui, ${report.media.failed} gagal`,
  );

  if (report.unresolved.length) {
    console.log(`\n⚠ ${report.unresolved.length} referensi tidak ter-resolve (diset null / dibuang dari array):`);
    for (const u of report.unresolved) console.log(`  - ${u}`);
  }
  if (report.unknownFields.length) {
    console.log(`\n⚠ ${report.unknownFields.length} field di ekspor tidak ada di skema CMS (dibuang):`);
    for (const u of report.unknownFields) console.log(`  - ${u}`);
  }
  if (report.unknownIcons.size)
    console.log(`\n⚠ Kunci ikon tidak ada di ICON_GROUPS (tetap disimpan): ${[...report.unknownIcons].join(", ")}`);
  for (const w of report.warnings) console.log(`⚠ ${w}`);

  if (report.errors.length) {
    console.log(`\n✖ ${report.errors.length} error:`);
    for (const e of report.errors) {
      console.log(`  - ${e.item}: ${e.message}`);
      for (const [k, m] of Object.entries(e.fieldErrors ?? {})) console.log(`      ${k}: ${m}`);
    }
  } else console.log(`\n✔ Tanpa error`);
}

async function main() {
  if (!existsSync(IMPORT_FILE)) {
    throw new Error(
      `File ekspor tidak ditemukan: ${IMPORT_FILE}\nJalankan "npm run export:cms" di ${WEB_DIR} terlebih dahulu (atau set IMPORT_FILE).`,
    );
  }
  const file = JSON.parse(await readFile(IMPORT_FILE, "utf8")) as ExportFile;
  if (file.version !== 1) throw new Error(`Versi file ekspor tidak didukung: ${file.version}`);
  console.log(`• Sumber: ${IMPORT_FILE}${DRY ? "  [DRY RUN]" : ""}`);

  const user = await findImportUser();
  if (!user && !DRY) throw new Error("Tidak ada user ADMIN. Jalankan `npm run db:seed` dulu untuk membuat admin.");
  if (user) console.log(`• User impor: ${user.email}`);
  const userId = user?.id ?? null;

  if (RESET) {
    if (DRY) console.log("• IMPORT_RESET diabaikan saat dry run");
    else await resetContent();
  }

  // Index natural key dari DB (untuk update & resolve $ref).
  for (const type of ORDER) await loadIndex(type);
  const collections = file.collections ?? {};
  // Dry run: item di file dianggap sudah ada agar $ref ke item yang belum ada di DB tetap bisa divalidasi.
  if (DRY) {
    for (const [type, items] of Object.entries(collections)) {
      for (const item of items) {
        const k = NATURAL_KEY[type]?.of(item.data);
        if (k && !idx(type).has(k)) idx(type).set(k, `dry-${type}-${k}`);
      }
    }
  }

  await importMedia(collectMedia(file), userId);

  for (const type of Object.keys(collections)) {
    if (!ORDER.includes(type)) report.warnings.push(`Collection "${type}" di ekspor tidak ada di urutan impor — dilewati`);
  }
  for (const type of ORDER) {
    if (collections[type]) await importCollection(type, collections[type], userId);
  }

  await importSingletons(file.singletons ?? {}, userId);

  printReport();
  return report.errors.length === 0;
}

main()
  .then(async (ok) => {
    await prisma.$disconnect();
    process.exit(ok ? 0 : 1);
  })
  .catch(async (e) => {
    console.error("✖", e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
