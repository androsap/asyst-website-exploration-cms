"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { requireModule } from "@/server/admin-menu";
import {
  delegate,
  deleteItem,
  mustCollection,
  refOptions,
  reorderItems,
  saveItem,
  setItemStatus,
  ValidationError,
  type SaveMeta,
  type Status,
} from "@/server/repo/collections";
import { discardSingletonDraft, mustSingleton, saveSingleton, unpublishSingleton } from "@/server/repo/singletons";
import { createPreviewToken } from "@/server/preview";
import { run } from "./result";

/**
 * Simpan butuh izin "publish" hanya bila status berubah (atau item baru langsung terbit),
 * atau tanggal terbit item yang sudah terbit diubah. Mengedit item terbit tanpa mengubah status cukup "update".
 */
async function changesPublication(type: string, id: string | null, meta: SaveMeta) {
  const def = mustCollection(type);
  if (!def.hasStatus || !meta?.status) return false;
  if (!id) return meta.status !== "DRAFT";
  const current = (await delegate(def).findUnique({ where: { id }, select: { status: true, publishedAt: true } })) as {
    status: Status;
    publishedAt: Date | null;
  } | null;
  if (!current) return false;
  if (current.status !== meta.status) return true;
  if (meta.status === "PUBLISHED" && meta.publishedAt !== undefined) {
    const next = meta.publishedAt ? new Date(meta.publishedAt).getTime() : null;
    return next !== null && next !== current.publishedAt?.getTime();
  }
  return false;
}

export async function saveCollectionAction(type: string, id: string | null, values: unknown, meta: SaveMeta) {
  return run(async () => {
    const user = await requireModule(`c:${type}`, id ? "update" : "create");
    if (await changesPublication(type, id, meta)) await requireModule(`c:${type}`, "publish");
    const def = mustCollection(type);
    const saved = await saveItem(def, id, values, meta, user.id);
    revalidatePath(`/admin/c/${type}`, "layout");
    return { id: saved.id };
  });
}

export async function setStatusAction(type: string, id: string, status: Status) {
  return run(async () => {
    await requireModule(`c:${type}`, "publish");
    await setItemStatus(mustCollection(type), id, status);
    revalidatePath(`/admin/c/${type}`, "layout");
  });
}

export async function deleteCollectionAction(type: string, id: string) {
  return run(async () => {
    await requireModule(`c:${type}`, "delete");
    await deleteItem(mustCollection(type), id);
    revalidatePath(`/admin/c/${type}`, "layout");
  });
}

export async function reorderAction(type: string, ids: string[]) {
  return run(async () => {
    await requireModule(`c:${type}`, "update");
    await reorderItems(mustCollection(type), ids);
    revalidatePath(`/admin/c/${type}`, "layout");
  });
}

export async function refOptionsAction(target: string, vocabulary?: string) {
  return run(async () => {
    await requireUser();
    return refOptions(target, vocabulary);
  });
}

export async function saveSingletonAction(slug: string, values: unknown, publish: boolean) {
  return run(async () => {
    const def = mustSingleton(slug);
    const user = await requireModule(`s:${slug}`, publish && def.draftable ? "publish" : "update");
    await saveSingleton(def, values, user.id, publish);
    revalidatePath(`/admin/s/${slug}`);
  });
}

export async function discardSingletonAction(slug: string) {
  return run(async () => {
    await requireModule(`s:${slug}`, "update");
    await discardSingletonDraft(mustSingleton(slug));
    revalidatePath(`/admin/s/${slug}`);
  });
}

export async function unpublishSingletonAction(slug: string) {
  return run(async () => {
    await requireModule(`s:${slug}`, "publish");
    await unpublishSingleton(mustSingleton(slug));
    revalidatePath(`/admin/s/${slug}`);
  });
}

/** Buat URL preview di website (PREVIEW_URL + path + token draft 1 jam). */
export async function previewLinkAction(path: string) {
  return run(async () => {
    const user = await requireUser();
    const base = (process.env.PREVIEW_URL || "").replace(/\/$/, "");
    if (!base) throw new ValidationError("PREVIEW_URL belum di-set di environment.");
    const token = await createPreviewToken(user.id);
    const url = new URL(base + (path.startsWith("/") ? path : `/${path}`));
    url.searchParams.set("preview", token);
    return { url: url.toString() };
  });
}
