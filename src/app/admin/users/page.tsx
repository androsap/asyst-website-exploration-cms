import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/server/session";
import { UsersManager } from "./users-manager";

export const metadata: Metadata = { title: "Pengguna" };

export default async function UsersPage() {
  const me = await requirePageUser("ADMIN");
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
  });
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-title-md text-[var(--neutral900)]">Pengguna</h1>
        <p className="text-sm text-muted-foreground">
          ADMIN: semua akses termasuk kelola pengguna. EDITOR: kelola konten & media.
        </p>
      </div>
      <UsersManager
        meId={me.id}
        users={users.map((u) => ({
          ...u,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
