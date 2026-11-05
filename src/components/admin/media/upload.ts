"use client";

import { upload } from "@vercel/blob/client";
import { createMediaAction, type MediaItem } from "@/server/actions/media";
import { ALLOWED_MIME, MAX_UPLOAD_BYTES } from "@/lib/media";

async function imageSize(file: File): Promise<{ width: number | null; height: number | null }> {
  if (!file.type.startsWith("image/")) return { width: null, height: null };
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { width: img.naturalWidth || null, height: img.naturalHeight || null };
  } catch {
    return { width: null, height: null };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Upload file ke Vercel Blob (atau folder lokal saat dev) lalu buat record Media. */
export async function uploadMediaFile(file: File, blobEnabled: boolean): Promise<MediaItem> {
  if (!ALLOWED_MIME.includes(file.type)) throw new Error(`Tipe file ${file.type || "?"} tidak diizinkan`);
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Ukuran file melebihi 20 MB");

  const { width, height } = await imageSize(file);
  let url: string;
  let pathname: string;

  if (blobEnabled) {
    const blob = await upload(`media/${file.name}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      contentType: file.type,
    });
    url = blob.url;
    pathname = blob.pathname;
  } else {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload/local", { method: "POST", body });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Upload gagal");
    url = json.url;
    pathname = json.pathname;
  }

  const created = await createMediaAction({
    url,
    pathname,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    width,
    height,
    alt: { id: "", en: "" },
  });
  if (!created.ok) throw new Error(created.error);
  return created.data;
}
