"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizePermissions, parsePermissions, permissionsSchema, roleKeyFrom, type Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { listAdminModules, requireModule } from "@/server/admin-menu";
import { ValidationError } from "@/server/repo/collections";
import type { SessionUser } from "@/server/session";
import { run } from "./result";

const roleMeta = z.object({
  name: z.string().trim().min(1, "Nama role wajib diisi").max(80),
  description: z.string().trim().max(255).optional(),
});
const createSchema = roleMeta.extend({ copyFrom: z.string().max(64).optional() });
const saveSchema = z.array(z.object({ roleId: z.string().min(1).max(64), permissions: permissionsSchema })).max(50);

function zodFields(e: z.ZodError) {
  return Object.fromEntries(e.issues.map((i) => [i.path.join("."), i.message]));
}

/**
 * Cegah eskalasi hak akses: pengguna non-Super Admin hanya boleh MENAMBAHKAN izin yang
 * ia sendiri miliki. Mencabut izin selalu boleh.
 */
function guardEscalation(me: SessionUser, before: Permissions, after: Permissions) {
  if (me.isSuperAdmin) return;
  for (const [mod, actions] of Object.entries(after)) {
    for (const a of actions) {
      if (before[mod]?.includes(a)) continue;
      if (!me.permissions[mod]?.includes(a))
        throw new ValidationError("Anda tidak bisa memberikan izin yang tidak Anda miliki sendiri.");
    }
  }
}

function revalidateAll() {
  // Izin memengaruhi sidebar & semua halaman admin.
  revalidatePath("/admin", "layout");
}

/** Simpan perubahan matrix izin (beberapa role sekaligus). */
export async function saveRolePermissionsAction(input: unknown) {
  return run(async () => {
    const me = await requireModule("sys:roles", "update");
    const parsed = saveSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError("Data izin tidak valid.");
    const modules = listAdminModules();
    const roles = await prisma.role.findMany({ where: { id: { in: parsed.data.map((c) => c.roleId) } } });
    const byId = new Map(roles.map((r) => [r.id, r]));

    const updates = parsed.data.map((c) => {
      const role = byId.get(c.roleId);
      if (!role) throw new ValidationError("Role tidak ditemukan. Muat ulang halaman.");
      if (role.isSuperAdmin) throw new ValidationError(`Izin role ${role.name} tidak bisa diubah (akses penuh).`);
      const before = parsePermissions(role.permissions);
      const after = normalizePermissions(c.permissions, modules);
      guardEscalation(me, before, after);
      return prisma.role.update({ where: { id: role.id }, data: { permissions: after } });
    });
    await prisma.$transaction(updates);
    revalidateAll();
  });
}

async function uniqueKey(name: string) {
  const base = roleKeyFrom(name);
  let key = base;
  for (let i = 2; await prisma.role.findUnique({ where: { key }, select: { id: true } }); i++) key = `${base}_${i}`;
  return key;
}

export async function createRoleAction(input: unknown) {
  return run(async () => {
    const me = await requireModule("sys:roles", "create");
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError("Periksa isian.", zodFields(parsed.error));
    const { name, description, copyFrom } = parsed.data;
    if (await prisma.role.findFirst({ where: { name } }))
      throw new ValidationError("Nama role sudah dipakai.", { name: "Nama role sudah dipakai" });

    let permissions: Permissions = {};
    if (copyFrom) {
      const src = await prisma.role.findUnique({ where: { id: copyFrom } });
      if (!src) throw new ValidationError("Role sumber tidak ditemukan.");
      const modules = listAdminModules();
      permissions = src.isSuperAdmin
        ? Object.fromEntries(modules.filter((m) => m.actions.length).map((m) => [m.id, m.actions]))
        : normalizePermissions(parsePermissions(src.permissions), modules);
      // Non-Super Admin: salinan dipangkas ke izin yang ia miliki.
      if (!me.isSuperAdmin)
        permissions = normalizePermissions(
          Object.fromEntries(Object.entries(permissions).map(([k, v]) => [k, v.filter((a) => me.permissions[k]?.includes(a))])),
          modules,
        );
    }
    const order = ((await prisma.role.aggregate({ _max: { order: true } }))._max.order ?? 0) + 1;
    const role = await prisma.role.create({
      data: { key: await uniqueKey(name), name, description: description || null, permissions, order },
    });
    revalidateAll();
    return { id: role.id };
  });
}

export async function updateRoleAction(id: string, input: unknown) {
  return run(async () => {
    await requireModule("sys:roles", "update");
    const parsed = roleMeta.safeParse(input);
    if (!parsed.success) throw new ValidationError("Periksa isian.", zodFields(parsed.error));
    const { name, description } = parsed.data;
    if (await prisma.role.findFirst({ where: { name, id: { not: id } } }))
      throw new ValidationError("Nama role sudah dipakai.", { name: "Nama role sudah dipakai" });
    await prisma.role.update({ where: { id }, data: { name, description: description || null } });
    revalidateAll();
  });
}

export async function deleteRoleAction(id: string) {
  return run(async () => {
    await requireModule("sys:roles", "delete");
    const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
    if (!role) throw new ValidationError("Role tidak ditemukan.");
    if (role.isSystem) throw new ValidationError(`Role bawaan "${role.name}" tidak bisa dihapus.`);
    if (role._count.users > 0)
      throw new ValidationError(`Role masih dipakai ${role._count.users} pengguna. Pindahkan mereka ke role lain dulu.`);
    await prisma.role.delete({ where: { id } });
    revalidateAll();
  });
}
