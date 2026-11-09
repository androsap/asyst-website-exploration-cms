import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { COLLECTIONS } from "@/content/collections";
import { SINGLETONS } from "@/content/singletons";
import {
  canAccessModule,
  defaultMenu,
  normalizeMenu,
  parseMenu,
  resolveNav,
  type AdminModule,
  type MenuConfig,
  type NavGroup,
} from "@/lib/admin-menu";
import type { Action } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AuthError, requirePageUser, requireUser, type SessionUser } from "@/server/session";

export const MENU_SETTING_KEY = "admin-menu";

/** Urutan grup bawaan (dipakai saat belum ada konfigurasi tersimpan / tombol Reset). */
const GROUP_ORDER = ["Konten", "Berita", "Karier", "Produk & Solusi", "Halaman", "Global", "Fondasi"];
const groupRank = (g: string) => {
  const i = GROUP_ORDER.indexOf(g);
  return i === -1 ? GROUP_ORDER.length : i;
};

const CRUD: Action[] = ["view", "create", "update", "delete"];

/** Semua modul admin yang tersedia di kode, beserta aksi yang bisa diatur per role. */
export const listAdminModules = cache((): AdminModule[] => {
  const content: AdminModule[] = [
    ...COLLECTIONS.map(
      (c): AdminModule => ({
        id: `c:${c.type}`,
        kind: "collection",
        label: c.label,
        icon: c.icon,
        href: `/admin/c/${c.type}`,
        defaultGroup: c.group,
        actions: c.hasStatus ? [...CRUD, "publish"] : CRUD,
      }),
    ),
    ...SINGLETONS.map(
      (s): AdminModule => ({
        id: `s:${s.slug}`,
        kind: "singleton",
        label: s.label,
        icon: s.icon,
        href: `/admin/s/${s.slug}`,
        defaultGroup: s.group,
        actions: s.draftable ? ["view", "update", "publish"] : ["view", "update"],
      }),
    ),
  ];
  // sort stabil: per grup, urutan dalam grup tetap seperti di registry
  content.sort((a, b) => groupRank(a.defaultGroup) - groupRank(b.defaultGroup));

  const sys = (name: string, label: string, icon: string, href: string, actions: Action[]): AdminModule => ({
    id: `sys:${name}`,
    kind: "system",
    label,
    icon,
    href,
    defaultGroup: "Sistem",
    actions,
  });

  return [
    { id: "sys:dashboard", kind: "system", label: "Dashboard", icon: "LayoutDashboard", href: "/admin", defaultGroup: "", actions: [] },
    ...content,
    sys("media", "Media", "Image", "/admin/media", CRUD),
    sys("submissions", "Form masuk", "Inbox", "/admin/submissions", ["view", "update", "delete"]),
    sys("users", "Pengguna", "Users", "/admin/users", CRUD),
    sys("roles", "Manajemen Role", "Shield", "/admin/roles", CRUD),
    sys("menu", "Manajemen Menu", "Menu", "/admin/menu", ["view", "update"]),
  ];
});

export function getAdminModule(moduleId: string) {
  return listAdminModules().find((m) => m.id === moduleId);
}

/** Konfigurasi menu aktif (sudah dinormalisasi). Di-cache per request. */
export const loadMenuConfig = cache(async (): Promise<{ config: MenuConfig; isDefault: boolean }> => {
  const modules = listAdminModules();
  const row = await prisma.adminSetting.findUnique({ where: { key: MENU_SETTING_KEY } });
  const parsed = row ? parseMenu(row.value) : null;
  if (row && !parsed) console.warn("[admin-menu] konfigurasi tersimpan tidak valid, memakai bawaan");
  return parsed
    ? { config: normalizeMenu(parsed, modules), isDefault: false }
    : { config: defaultMenu(modules), isDefault: true };
});

export async function buildNavFor(user: SessionUser): Promise<NavGroup[]> {
  const { config } = await loadMenuConfig();
  return resolveNav(config, listAdminModules(), user);
}

export async function canDo(user: SessionUser, moduleId: string, action: Action = "view") {
  const mod = getAdminModule(moduleId);
  if (!mod) return false;
  const { config } = await loadMenuConfig();
  return canAccessModule(config, mod, user, action);
}

/** Aksi yang boleh dilakukan user pada modul (untuk menampilkan/menyembunyikan tombol). */
export async function allowedActions(user: SessionUser, moduleId: string): Promise<Record<Action, boolean>> {
  const entries = await Promise.all(
    (["view", "create", "update", "delete", "publish"] as const).map(async (a) => [a, await canDo(user, moduleId, a)] as const),
  );
  return Object.fromEntries(entries) as Record<Action, boolean>;
}

/** Untuk page: login + boleh melakukan `action` pada modul. Modul tidak dikenal → 404. */
export async function requirePageModule(moduleId: string, action: Action = "view"): Promise<SessionUser> {
  const user = await requirePageUser();
  if (!getAdminModule(moduleId)) notFound();
  if (!(await canDo(user, moduleId, action))) redirect("/admin?forbidden=1");
  return user;
}

/** Untuk server action: login + boleh melakukan `action` pada modul. */
export async function requireModule(moduleId: string, action: Action): Promise<SessionUser> {
  const user = await requireUser();
  if (!(await canDo(user, moduleId, action))) throw new AuthError("Anda tidak punya izin untuk aksi ini.");
  return user;
}
