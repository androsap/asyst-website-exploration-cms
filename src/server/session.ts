import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = { id: string; name: string; email: string; role: "ADMIN" | "EDITOR" };

export class AuthError extends Error {}

/** Ambil user aktif dari session + DB (memastikan user belum dinonaktifkan). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/** Untuk page: redirect ke /login bila belum login. */
export async function requirePageUser(role?: "ADMIN"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    // Bila JWT masih ada tapi user sudah dihapus/nonaktif, tandai `expired` agar proxy
    // tidak memantulkan /login kembali ke /admin (mencegah redirect loop).
    const session = await auth();
    redirect(session?.user ? "/login?expired=1" : "/login");
  }
  if (role === "ADMIN" && user.role !== "ADMIN") redirect("/admin?forbidden=1");
  return user;
}

/** Untuk server action/route: lempar error bila tidak berhak. */
export async function requireUser(role?: "ADMIN"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Sesi berakhir. Silakan login ulang.");
  if (role === "ADMIN" && user.role !== "ADMIN") throw new AuthError("Hanya ADMIN yang boleh melakukan aksi ini.");
  return user;
}
