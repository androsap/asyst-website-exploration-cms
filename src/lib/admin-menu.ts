import { z } from "zod";
import { can, type Access, type Action } from "./permissions";

/**
 * Struktur sidebar admin yang bisa diatur dari halaman "Manajemen Menu".
 *
 * - Modul (koleksi, halaman/singleton, halaman sistem) tetap didefinisikan di kode
 *   (src/content/**, src/server/admin-menu.ts). Menu hanya mengatur penempatan,
 *   label, ikon, urutan, dan status aktif.
 * - Hak akses modul diatur di "Manajemen Role" (src/lib/permissions.ts).
 * - Modul yang ada di kode tapi belum tercatat di konfigurasi (mis. modul baru dari developer)
 *   otomatis ditambahkan ke grup bawaannya. Modul yang sengaja dikeluarkan dari menu dicatat
 *   di `removed` agar tidak muncul lagi.
 * - Super Admin selalu bisa membuka semua modul lewat URL. Role lain hanya bisa membuka modul
 *   yang ada di menu, aktif, dan diizinkan di Manajemen Role.
 */

export type ModuleKind = "collection" | "singleton" | "system";

export type AdminModule = {
  id: string; // "c:<type>" | "s:<slug>" | "sys:<name>"
  kind: ModuleKind;
  label: string;
  icon: string;
  href: string;
  defaultGroup: string;
  /** Aksi yang bisa diatur di Manajemen Role. Kosong = selalu bisa dibuka (mis. Dashboard). */
  actions: Action[];
};

const id = z.string().trim().min(1).max(64);
const icon = z.string().trim().max(64);
/** Khusus link custom: "admin" = hanya role Super Admin. */
const access = z.enum(["all", "admin"]);

const moduleItem = z.object({
  id,
  kind: z.literal("module"),
  module: z.string().min(1).max(128),
  label: z.string().trim().max(80).optional(),
  icon: icon.optional(),
  enabled: z.boolean(),
  /** Usang (dulu ADMIN/EDITOR) — diabaikan; akses modul dari Manajemen Role. */
  access: access.optional(),
});

const linkItem = z.object({
  id,
  kind: z.literal("link"),
  label: z.string().trim().min(1, "Label link wajib diisi").max(80),
  icon,
  href: z
    .string()
    .trim()
    .max(1024)
    .refine((v) => /^\/(?!\/)/.test(v) || /^https?:\/\//i.test(v), "Link harus diawali / atau http(s)://"),
  newTab: z.boolean(),
  enabled: z.boolean(),
  access,
});

export const menuItemSchema = z.discriminatedUnion("kind", [moduleItem, linkItem]);

export const menuGroupSchema = z.object({
  id,
  label: z.string().trim().max(60),
  items: z.array(menuItemSchema).max(100),
});

export const menuConfigSchema = z.object({
  version: z.literal(1),
  groups: z.array(menuGroupSchema).max(30),
  removed: z.array(z.string().max(128)).max(200),
});

export type MenuItem = z.infer<typeof menuItemSchema>;
export type ModuleMenuItem = Extract<MenuItem, { kind: "module" }>;
export type LinkMenuItem = Extract<MenuItem, { kind: "link" }>;
export type MenuGroup = z.infer<typeof menuGroupSchema>;
export type MenuConfig = z.infer<typeof menuConfigSchema>;

export type NavItem = { href: string; label: string; icon: string; external?: boolean; newTab?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

export const MENU_SYSTEM_GROUP = "Sistem";
/** Modul yang selalu tampil untuk Super Admin agar pengaturan tidak bisa "terkunci". */
export const ALWAYS_FOR_SUPER_ADMIN = ["sys:menu", "sys:roles"];

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const slugId = (label: string) => `g_${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "root"}`;

function moduleItemFor(m: AdminModule): ModuleMenuItem {
  return { id: `i_${m.id.replace(/[^a-z0-9]+/gi, "_")}`, kind: "module", module: m.id, enabled: true };
}

/** Grup bawaan: urutan grup mengikuti urutan pertama kali muncul di daftar modul. */
export function defaultMenu(modules: AdminModule[]): MenuConfig {
  const groups: MenuGroup[] = [];
  for (const m of modules) {
    let g = groups.find((x) => x.label === m.defaultGroup);
    if (!g) groups.push((g = { id: slugId(m.defaultGroup), label: m.defaultGroup, items: [] }));
    g.items.push(moduleItemFor(m));
  }
  return { version: 1, groups, removed: [] };
}

/** Parse konfigurasi tersimpan; null bila kosong/rusak. */
export function parseMenu(raw: unknown): MenuConfig | null {
  const r = menuConfigSchema.safeParse(raw);
  return r.success ? r.data : null;
}

/**
 * Rapikan konfigurasi terhadap daftar modul saat ini:
 * - buang item modul yang sudah tidak ada di kode dan duplikatnya, juga field `access` usang,
 * - tambahkan modul baru (belum ditempatkan & tidak di `removed`) ke grup bawaannya.
 */
export function normalizeMenu(config: MenuConfig, modules: AdminModule[]): MenuConfig {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const seen = new Set<string>();
  const groups: MenuGroup[] = config.groups.map((g) => ({
    ...g,
    items: g.items.flatMap((item): MenuItem[] => {
      if (item.kind === "link") return [item];
      const m = byId.get(item.module);
      if (!m || seen.has(m.id)) return [];
      seen.add(m.id);
      const { access: _legacy, ...rest } = item;
      void _legacy;
      return [rest];
    }),
  }));
  const removed = config.removed.filter((r) => byId.has(r) && !seen.has(r));
  for (const m of modules) {
    if (seen.has(m.id) || removed.includes(m.id)) continue;
    let g = groups.find((x) => x.label === m.defaultGroup);
    if (!g) groups.push((g = { id: newId("g"), label: m.defaultGroup, items: [] }));
    g.items.push(moduleItemFor(m));
  }
  return { version: 1, groups, removed };
}

function moduleVisible(m: AdminModule, access: Access) {
  return m.actions.length === 0 || can(access, m.id, "view");
}

/** Konfigurasi → grup sidebar untuk user dengan hak akses tertentu. */
export function resolveNav(config: MenuConfig, modules: AdminModule[], access: Access): NavGroup[] {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const shown = new Set<string>();
  const groups: NavGroup[] = config.groups.map((g) => ({
    label: g.label,
    items: g.items.flatMap((item): NavItem[] => {
      if (!item.enabled) return [];
      if (item.kind === "link") {
        if (item.access === "admin" && !access.isSuperAdmin) return [];
        const external = /^https?:\/\//i.test(item.href);
        return [{ href: item.href, label: item.label, icon: item.icon || "Link", external, newTab: item.newTab }];
      }
      const m = byId.get(item.module);
      if (!m || !moduleVisible(m, access)) return [];
      shown.add(m.id);
      return [{ href: m.href, label: item.label || m.label, icon: item.icon || m.icon }];
    }),
  }));

  // Jaring pengaman: Manajemen Menu & Role selalu tersedia untuk Super Admin.
  if (access.isSuperAdmin) {
    for (const mid of ALWAYS_FOR_SUPER_ADMIN) {
      const m = byId.get(mid);
      if (!m || shown.has(mid)) continue;
      const item = { href: m.href, label: m.label, icon: m.icon };
      const sys = groups.find((g) => g.label === MENU_SYSTEM_GROUP);
      if (sys) sys.items.push(item);
      else groups.push({ label: MENU_SYSTEM_GROUP, items: [item] });
    }
  }
  return groups.filter((g) => g.items.length > 0);
}

/**
 * Boleh melakukan `action` pada modul? Super Admin selalu boleh. Role lain: modul harus ada di menu,
 * aktif, dan diizinkan. Modul tanpa aksi (Dashboard) selalu boleh dibuka.
 */
export function canAccessModule(config: MenuConfig, mod: AdminModule, access: Access, action: Action = "view"): boolean {
  if (access.isSuperAdmin) return true;
  if (mod.actions.length === 0) return action === "view";
  if (!can(access, mod.id, action)) return false;
  for (const g of config.groups)
    for (const item of g.items) if (item.kind === "module" && item.module === mod.id) return item.enabled;
  return false;
}
