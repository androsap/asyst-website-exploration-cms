import type { Metadata } from "next";
import { parsePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { allowedActions, listAdminModules, loadMenuConfig, requirePageModule } from "@/server/admin-menu";
import { RolesManager, type RoleRow, type Section } from "./roles-manager";

export const metadata: Metadata = { title: "Manajemen Role" };

export default async function RolesPage() {
  const me = await requirePageModule("sys:roles");
  const [roles, { config }, can] = await Promise.all([
    prisma.role.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { users: true } } },
    }),
    loadMenuConfig(),
    allowedActions(me, "sys:roles"),
  ]);

  // Seksi matrix mengikuti grup & urutan di Manajemen Menu; modul di luar menu dikumpulkan di akhir.
  const modules = listAdminModules().filter((m) => m.actions.length > 0);
  const byId = new Map(modules.map((m) => [m.id, m]));
  const placed = new Set<string>();
  const sections: Section[] = [];
  for (const g of config.groups) {
    const mods = g.items.flatMap((i) => {
      const m = i.kind === "module" ? byId.get(i.module) : undefined;
      if (!m || placed.has(m.id)) return [];
      placed.add(m.id);
      return [{ id: m.id, label: i.label || m.label, icon: i.icon || m.icon, actions: m.actions, enabled: i.enabled }];
    });
    if (mods.length) sections.push({ label: g.label || "Umum", modules: mods });
  }
  const rest = modules.filter((m) => !placed.has(m.id));
  if (rest.length)
    sections.push({
      label: "Tidak ada di menu",
      hint: "Hanya Super Admin yang bisa membuka modul ini sampai ditambahkan ke menu.",
      modules: rest.map((m) => ({ id: m.id, label: m.label, icon: m.icon, actions: m.actions, enabled: false })),
    });

  const rows: RoleRow[] = roles.map((r) => ({
    id: r.id,
    key: r.key,
    name: r.name,
    description: r.description,
    isSuperAdmin: r.isSuperAdmin,
    isSystem: r.isSystem,
    userCount: r._count.users,
    permissions: r.isSuperAdmin ? {} : parsePermissions(r.permissions),
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h1 className="text-title-md text-[var(--neutral900)]">Manajemen Role</h1>
        <p className="text-sm text-muted-foreground">
          Buat role dan atur hak akses tiap role per modul. Perubahan berlaku langsung untuk semua pengguna dengan role tersebut setelah disimpan.
        </p>
      </div>
      <RolesManager
        key={JSON.stringify(rows)}
        roles={rows}
        sections={sections}
        can={{ create: can.create, update: can.update, delete: can.delete }}
        me={{ isSuperAdmin: me.isSuperAdmin, permissions: me.permissions, roleKey: me.roleKey }}
      />
    </div>
  );
}
