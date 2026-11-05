"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";
import { ValidationError } from "@/server/repo/collections";
import { run } from "./result";

const password = z.string().min(8, "Password minimal 8 karakter").max(128);
const base = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(120),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  role: z.enum(["ADMIN", "EDITOR"]),
  isActive: z.boolean(),
});
const createUserSchema = base.extend({ password });
const updateUserSchema =base.extend({ password: z.union([z.literal(""), password]).optional() });

function zodFields(e: z.ZodError) {
  return Object.fromEntries(e.issues.map((i) => [i.path.join("."), i.message]));
}

async function ensureAnotherAdmin(exceptId: string) {
  const admins = await prisma.user.count({ where: { role: "ADMIN", isActive: true, id: { not: exceptId } } });
  if (admins === 0) throw new ValidationError("Harus ada minimal satu ADMIN aktif.");
}

export async function createUserAction(input: unknown) {
  return run(async () => {
    await requireUser("ADMIN");
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError("Periksa isian.", zodFields(parsed.error));
    const { password: pw, ...data } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ValidationError("Email sudah terdaftar.", { email: "Email sudah terdaftar" });
    const user = await prisma.user.create({ data: { ...data, passwordHash: await bcrypt.hash(pw, 12) } });
    revalidatePath("/admin/users");
    return { id: user.id };
  });
}

export async function updateUserAction(id: string, input: unknown) {
  return run(async () => {
    const me = await requireUser("ADMIN");
    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError("Periksa isian.", zodFields(parsed.error));
    const { password: pw, ...data } = parsed.data;
    if (data.role !== "ADMIN" || !data.isActive) await ensureAnotherAdmin(id);
    if (id === me.id && !data.isActive) throw new ValidationError("Tidak bisa menonaktifkan akun sendiri.");
    const dup = await prisma.user.findFirst({ where: { email: data.email, id: { not: id } } });
    if (dup) throw new ValidationError("Email sudah terdaftar.", { email: "Email sudah terdaftar" });
    await prisma.user.update({
      where: { id },
      data: { ...data, ...(pw ? { passwordHash: await bcrypt.hash(pw, 12) } : {}) },
    });
    revalidatePath("/admin/users");
  });
}

export async function deleteUserAction(id: string) {
  return run(async () => {
    const me = await requireUser("ADMIN");
    if (id === me.id) throw new ValidationError("Tidak bisa menghapus akun sendiri.");
    await ensureAnotherAdmin(id);
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/users");
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
