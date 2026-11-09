// Utilitas bersama untuk script CLI (seed & importer).
import { prisma } from "../src/lib/prisma";

/**
 * Hapus semua tabel konten (termasuk tabel join implisit "_…") kecuali User, riwayat migrasi,
 * dan FormSubmission. FK check dimatikan di koneksi yang sama (transaction) agar urutan tidak penting.
 */
export async function resetContent() {
  const tables = await prisma.$queryRawUnsafe<{ t: string }[]>(
    `SELECT TABLE_NAME AS t FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
       AND TABLE_NAME NOT IN ('User', '_prisma_migrations', 'FormSubmission')`,
  );
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
    for (const { t } of tables) await tx.$executeRawUnsafe(`DELETE FROM \`${t.replace(/`/g, "")}\``);
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
  });
  console.log(`✔ Konten lama dihapus (${tables.length} tabel)`);
}

/** Admin dari SEED_ADMIN_EMAIL; bila tidak ada, user ADMIN pertama. */
export async function findImportUser() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const byEmail = email ? await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } }) : null;
  return (
    byEmail ??
    (await prisma.user.findFirst({ where: { role: { isSuperAdmin: true } }, orderBy: { createdAt: "asc" }, select: { id: true, email: true } }))
  );
}
