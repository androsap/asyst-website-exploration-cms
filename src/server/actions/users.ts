"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/server/admin-menu";
import { requireUser, type SessionUser } from "@/server/session";
import { ValidationError } from "@/server/repo/collections";
import { run } from "./result";

const password = z.string().min(8, "Password minimal 8 karakter").max(128);
const base = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(120),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  roleKey: z.string().trim().min(1, "Pilih role").max(64),
  isActive: z.boolean(),
});
const createUserSchema = base.extend({ password });
const updateUserSchema = base.extend({ password: z.union([z.literal(""), password]).optional() });

function zodFields(e: z.ZodError) {
  return Object.fromEntries(e.issues.map((i) => [i.path.join("."), i.message]));
}

async function ensureAnotherSuperAdmin(exceptId: string) {
  const n = await prisma.user.count({ where: { isActive: true, role: { isSuperAdmin: true }, id: { not: exceptId } } });
  if (n === 0) throw new ValidationError("Harus ada minimal satu pengguna aktif dengan role Super Admin.");
}

/** Role tujuan harus ada; hanya Super Admin yang boleh memberi role Super Admin. */
async function resolveRole(me: SessionUser, roleKey: string) {
  const role = await prisma.role.findUnique({ where: { key: roleKey }, select: { key: true, isSuperAdmin: true } });
  if (!role) throw new ValidationError("Role tidak ditemukan.", { roleKey: "Role tidak ditemukan" });
  if (role.isSuperAdmin && !me.isSuperAdmin)
    throw new ValidationError("Hanya Super Admin yang boleh memberi role Super Admin.", { roleKey: "Tidak diizinkan" });
  return role;
}

/** Non-Super Admin tidak boleh mengubah/menghapus akun Super Admin. */
async function ensureCanTouch(me: SessionUser, id: string) {
  const target = await prisma.user.findUnique({ where: { id }, select: { role: { select: { isSuperAdmin: true } } } });
  if (!target) throw new ValidationError("Pengguna tidak ditemukan.");
  if (target.role.isSuperAdmin && !me.isSuperAdmin) throw new ValidationError("Hanya Super Admin yang boleh mengubah akun Super Admin.");
  return target;
}

export async function createUserAction(input: unknown) {
  return run(async () => {
    const me = await requireModule("sys:users", "create");
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError("Periksa isian.", zodFields(parsed.error));
    const { password: pw, ...data } = parsed.data;
    await resolveRole(me, data.roleKey);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ValidationError("Email sudah terdaftar.", { email: "Email sudah terdaftar" });
    const user = await prisma.user.create({ data: { ...data, passwordHash: await bcrypt.hash(pw, 12) } });
    revalidatePath("/admin/users");
    revalidatePath("/admin/roles");
    return { id: user.id };
  });
}

export async function updateUserAction(id: string, input: unknown) {
  return run(async () => {
    const me = await requireModule("sys:users", "update");
    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError("Periksa isian.", zodFields(parsed.error));
    const { password: pw, ...data } = parsed.data;
    const target = await ensureCanTouch(me, id);
    const role = await resolveRole(me, data.roleKey);
    if (target.role.isSuperAdmin && (!role.isSuperAdmin || !data.isActive)) await ensureAnotherSuperAdmin(id);
    if (id === me.id && !data.isActive) throw new ValidationError("Tidak bisa menonaktifkan akun sendiri.");
    const dup = await prisma.user.findFirst({ where: { email: data.email, id: { not: id } } });
    if (dup) throw new ValidationError("Email sudah terdaftar.", { email: "Email sudah terdaftar" });
    await prisma.user.update({
      where: { id },
      data: { ...data, ...(pw ? { passwordHash: await bcrypt.hash(pw, 12) } : {}) },
    });
    revalidatePath("/admin", "layout");
  });
}

export async function deleteUserAction(id: string) {
  return run(async () => {
    const me = await requireModule("sys:users", "delete");
    if (id === me.id) throw new ValidationError("Tidak bisa menghapus akun sendiri.");
    const target = await ensureCanTouch(me, id);
    if (target.role.isSuperAdmin) await ensureAnotherSuperAdmin(id);
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/users");
    revalidatePath("/admin/roles");
  });
}

/** Ganti password sendiri (semua role). */
export async function changeOwnPasswordAction(input: { current: string; next: string }) {
  return run(async () => {
    const me = await requireUser();
    const next = password.safeParse(input.next);
    if (!next.success) throw new ValidationError("Periksa isian.", { next: next.error.issues[0].message });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: me.id } });
    if (!(await bcrypt.compare(input.current, user.passwordHash)))
      throw new ValidationError("Password lama salah.", { current: "Password lama salah" });
    await prisma.user.update({ where: { id: me.id }, data: { passwordHash: await bcrypt.hash(next.data, 12) } });
  });
}
