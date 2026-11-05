"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";
import { ValidationError } from "@/server/repo/collections";
import { run } from "./result";

const lSchema = z.object({ id: z.string().trim().max(300), en: z.string().trim().max(300) });

const createSchema = z.object({
  url: z.string().min(1),
  pathname: z.string().min(1),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  size: z.number().int().min(0),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  alt: lSchema,
});

export type MediaItem = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: { id: string; en: string };
  caption: { id: string; en: string } | null;
  createdAt: string;
};

function toItem(m: Awaited<ReturnType<typeof prisma.media.findFirstOrThrow>>): MediaItem {
  return {
    id: m.id,
    url: m.url,
    filename: m.filename,
    mimeType: m.mimeType,
    size: m.size,
    width: m.width,
    height: m.height,
    alt: (m.alt as MediaItem["alt"]) ?? { id: "", en: "" },
    caption: (m.caption as MediaItem["caption"]) ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

export async function createMediaAction(input: z.input<typeof createSchema>) {
  return run(async () => {
    const user = await requireUser();
    const data = createSchema.parse(input);
    const m = await prisma.media.create({ data: { ...data, uploadedById: user.id } });
    revalidatePath("/admin/media");
    return toItem(m);
  });
}

export async function listMediaAction(params: { q?: string; page?: number; imagesOnly?: boolean } = {}) {
  return run(async () => {
    await requireUser();
    const take = 24;
    const page = Math.max(1, params.page ?? 1);
    const q = params.q?.trim();
    const where = {
      ...(q ? { filename: { contains: q } } : {}),
      ...(params.imagesOnly ? { mimeType: { startsWith: "image/" } } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.media.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take }),
      prisma.media.count({ where }),
    ]);
    return { items: rows.map(toItem), total, page, totalPages: Math.max(1, Math.ceil(total / take)) };
  });
}

export async function getMediaManyAction(ids: string[]) {
  return run(async () => {
    await requireUser();
    if (!ids.length) return [];
    const rows = await prisma.media.findMany({ where: { id: { in: ids } } });
    return rows.map(toItem);
  });
}

export async function updateMediaAction(id: string, input: { alt: unknown; caption?: unknown }) {
  return run(async () => {
    await requireUser();
    const alt = lSchema.parse(input.alt);
    const caption = input.caption ? lSchema.parse(input.caption) : undefined;
    const m = await prisma.media.update({ where: { id }, data: { alt, ...(caption ? { caption } : {}) } });
    revalidatePath("/admin/media");
    return toItem(m);
  });
}

/** Cari pemakaian media: lewat FK dan lewat mediaId di dalam kolom JSON. */
async function mediaUsage(id: string): Promise<string[]> {
  const tables: [string, string][] = [
    ["NewsArticle", "Berita"],
    ["Job", "Lowongan"],
    ["CaseStudy", "Studi kasus"],
    ["Product", "Produk"],
    ["ProductCategory", "Kategori produk"],
    ["Solution", "Solusi"],
    ["Industry", "Industri"],
    ["Client", "Klien"],
    ["Testimonial", "Testimoni"],
    ["Award", "Penghargaan"],
    ["Leader", "Pimpinan"],
    ["Author", "Penulis"],
    ["PageSeo", "SEO halaman"],
    ["Singleton", "Halaman/global"],
  ];
  // Kolom teks/JSON tiap tabel diambil dari information_schema (MySQL tidak punya row_to_json).
  // Nama tabel dari daftar tetap di atas & nama kolom dari skema DB — bukan input pengguna.
  const cols = await prisma.$queryRawUnsafe<{ t: string; c: string }[]>(
    `SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND DATA_TYPE IN ('json','longtext','text','mediumtext','varchar','char')`,
  );
  const byTable = new Map<string, string[]>();
  for (const { t, c } of cols) byTable.set(t.toLowerCase(), [...(byTable.get(t.toLowerCase()) ?? []), c]);

  const used: string[] = [];
  for (const [table, label] of tables) {
    const columns = byTable.get(table.toLowerCase());
    if (!columns?.length) continue;
    const haystack = columns.map((c) => `COALESCE(CAST(\`${c.replace(/`/g, "")}\` AS CHAR), '')`).join(", ");
    const rows = await prisma.$queryRawUnsafe<{ n: bigint | number }[]>(
      `SELECT COUNT(*) AS n FROM \`${table}\` WHERE INSTR(CONCAT_WS('|', ${haystack}), ?) > 0`,
      id,
    );
    if (Number(rows[0]?.n ?? 0) > 0) used.push(label);
  }
  return used;
}

export async function deleteMediaAction(id: string) {
  return run(async () => {
    await requireUser();
    const m = await prisma.media.findUnique({ where: { id } });
    if (!m) throw new ValidationError("Media tidak ditemukan.");
    const used = await mediaUsage(id);
    if (used.length) throw new ValidationError(`Media masih dipakai di: ${used.join(", ")}.`);
    await prisma.media.delete({ where: { id } });
    try {
      if (m.url.includes(".blob.vercel-storage.com")) await del(m.url);
      else if (m.pathname.startsWith("uploads/")) await unlink(path.join(process.cwd(), "public", m.pathname));
    } catch (e) {
      console.warn("[media] gagal menghapus file fisik", e);
    }
    revalidatePath("/admin/media");
  });
}
