"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import {
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

export async function saveCollectionAction(type: string, id: string | null, values: unknown, meta: SaveMeta) {
  return run(async () => {
    const user = await requireUser();
    const def = mustCollection(type);
    const saved = await saveItem(def, id, values, meta, user.id);
    revalidatePath(`/admin/c/${type}`, "layout");
    return { id: saved.id };
  });
}

export async function setStatusAction(type: string, id: string, status: Status) {
  return run(async () => {
    await requireUser();
    await setItemStatus(mustCollection(type), id, status);
    revalidatePath(`/admin/c/${type}`, "layout");
  });
}

export async function deleteCollectionAction(type: string, id: string) {
  return run(async () => {
    await requireUser();
    await deleteItem(mustCollection(type), id);
    revalidatePath(`/admin/c/${type}`, "layout");
  });
}

export async function reorderAction(type: string, ids: string[]) {
  return run(async () => {
    await requireUser();
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
    const user = await requireUser();
    await saveSingleton(mustSingleton(slug), values, user.id, publish);
    revalidatePath(`/admin/s/${slug}`);
  });
}

export async function discardSingletonAction(slug: string) {
  return run(async () => {
    await requireUser();
    await discardSingletonDraft(mustSingleton(slug));
    revalidatePath(`/admin/s/${slug}`);
  });
}

export async function unpublishSingletonAction(slug: string) {
  return run(async () => {
    await requireUser();
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
