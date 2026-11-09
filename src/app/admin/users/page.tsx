import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { allowedActions, canDo, requirePageModule } from "@/server/admin-menu";
import { UsersManager } from "./users-manager";

export const metadata: Metadata = { title: "Pengguna" };

export default async function UsersPage() {
  const me = await requirePageModule("sys:users");
  const [users, roles, can, canRoles] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: { order: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        roleKey: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        role: { select: { isSuperAdmin: true } },
      },
    }),
    prisma.role.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { key: true, name: true, isSuperAdmin: true } }),
    allowedActions(me, "sys:users"),
    canDo(me, "sys:roles"),
  ]);
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-title-md text-[var(--neutral900)]">Pengguna</h1>
        <p className="text-sm text-muted-foreground">
          Hak akses tiap pengguna mengikuti role-nya.{" "}
          {canRoles && (
            <Link href="/admin/roles" className="text-primary hover:underline">
              Atur role & hak akses
            </Link>
          )}
        </p>
      </div>
      <UsersManager
        meId={me.id}
        meIsSuperAdmin={me.isSuperAdmin}
        can={{ create: can.create, update: can.update, delete: can.delete }}
        roles={roles}
        users={users.map(({ role, ...u }) => ({
          ...u,
          isSuperAdmin: role.isSuperAdmin,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
