import { z } from "zod";

/**
 * Hak akses berbasis role (halaman Manajemen Role).
 * Izin = modul × aksi. Modul didefinisikan di src/server/admin-menu.ts (listAdminModules),
 * masing-masing menyebut aksi yang didukung. Role Super Admin selalu punya akses penuh.
 */

export const ACTIONS = ["view", "create", "update", "delete", "publish"] as const;
export type Action = (typeof ACTIONS)[number];

export const ACTION_LABEL: Record<Action, string> = {
  view: "Lihat",
  create: "Tambah",
  update: "Ubah",
  delete: "Hapus",
  publish: "Terbitkan",
};

export const ACTION_HELP: Record<Action, string> = {
  view: "Membuka halaman modul & melihat data",
  create: "Membuat data baru / upload",
  update: "Mengubah, menyimpan draft, mengatur urutan",
  delete: "Menghapus data",
  publish: "Publish, unpublish, arsipkan",
};

export type Permissions = Record<string, Action[]>;
export type Access = { isSuperAdmin: boolean; permissions: Permissions };

export const permissionsSchema = z.record(z.string().min(1).max(128), z.array(z.enum(ACTIONS)).max(ACTIONS.length));

export function parsePermissions(raw: unknown): Permissions {
  const r = permissionsSchema.safeParse(raw);
  return r.success ? r.data : {};
}

export function can(access: Access, moduleId: string, action: Action = "view"): boolean {
  if (access.isSuperAdmin) return true;
  return access.permissions[moduleId]?.includes(action) ?? false;
}

/**
 * Rapikan izin terhadap daftar modul: buang modul/aksi yang tidak dikenal, urutkan aksi,
 * dan pastikan aksi apa pun menyertakan "view" (tidak bisa mengubah tanpa bisa membuka).
 */
export function normalizePermissions(perms: Permissions, modules: { id: string; actions: Action[] }[]): Permissions {
  const out: Permissions = {};
  for (const m of modules) {
    const set = new Set((perms[m.id] ?? []).filter((a) => m.actions.includes(a)));
    if (set.size && m.actions.includes("view")) set.add("view");
    const list = ACTIONS.filter((a) => set.has(a));
    if (list.length) out[m.id] = list;
  }
  return out;
}

/** Ubah satu aksi dengan menjaga dependensi "view". */
export function toggleAction(current: Action[], action: Action, on: boolean, supported: Action[]): Action[] {
  const set = new Set(current);
  if (on) {
    set.add(action);
    if (supported.includes("view")) set.add("view");
  } else if (action === "view") {
    set.clear();
  } else {
    set.delete(action);
  }
  return ACTIONS.filter((a) => set.has(a) && supported.includes(a));
}

/** Kunci role dari nama: "Content Writer" → "CONTENT_WRITER". */
export function roleKeyFrom(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_")
      .replace(/[^A-Z0-9_]/g, "")
      .slice(0, 48) || "ROLE"
  );
}
