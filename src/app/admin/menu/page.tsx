import type { Metadata } from "next";
import { canDo, listAdminModules, loadMenuConfig, requirePageModule } from "@/server/admin-menu";
import { MenuManager } from "./menu-manager";

export const metadata: Metadata = { title: "Manajemen Menu" };

export default async function MenuPage() {
  const me = await requirePageModule("sys:menu");
  const canEdit = await canDo(me, "sys:menu", "update");
  const { config, isDefault } = await loadMenuConfig();
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-title-md text-[var(--neutral900)]">Manajemen Menu</h1>
        <p className="text-sm text-muted-foreground">
          Atur grup & item sidebar: tambah, keluarkan, ganti nama/ikon, geser urutan, dan nonaktifkan. Modul yang dikeluarkan
          atau dinonaktifkan hanya bisa dibuka Super Admin. Hak akses per role diatur di Manajemen Role.
        </p>
      </div>
      <MenuManager key={JSON.stringify(config)} initial={config} modules={listAdminModules()} isDefault={isDefault} canEdit={canEdit} />
    </div>
  );
}
