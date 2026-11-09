import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parsePermissions, type Access } from "@/lib/permissions";

export type SessionUser = Access & {
  id: string;
  name: string;
  email: string;
  roleKey: string;
  roleName: string;
};

export class AuthError extends Error {}

/** Ambil user aktif dari session + DB (memastikan user belum dinonaktifkan). Di-cache per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      role: { select: { key: true, name: true, isSuperAdmin: true, permissions: true } },
    },
  });
  if (!user || !user.isActive) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleKey: user.role.key,
    roleName: user.role.name,
    isSuperAdmin: user.role.isSuperAdmin,
    permissions: user.role.isSuperAdmin ? {} : parsePermissions(user.role.permissions),
  };
});

/** Untuk page: redirect ke /login bila belum login. Hak akses modul: requirePageModule (admin-menu.ts). */
export async function requirePageUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    // Bila JWT masih ada tapi user sudah dihapus/nonaktif, tandai `expired` agar proxy
    // tidak memantulkan /login kembali ke /admin (mencegah redirect loop).
    const session = await auth();
    redirect(session?.user ? "/login?expired=1" : "/login");
  }
  return user;
}

/** Untuk server action/route: lempar error bila belum login. Hak akses modul: requireModule (admin-menu.ts). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Sesi berakhir. Silakan login ulang.");
  return user;
}
