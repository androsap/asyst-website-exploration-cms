/* eslint-disable @typescript-eslint/no-explicit-any */
// Seed: 1 akun admin dari env + contoh data untuk semua jenis konten.
// Semua data melewati validasi Zod yang sama dengan form admin (saveItem/saveSingleton).
//
//   npm run db:seed                     → admin + contoh konten (konten dilewati bila DB sudah berisi)
//   SEED_RESET=true npm run db:seed     → hapus semua konten lalu isi ulang (user tidak dihapus)
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { withDefaults } from "../src/content/fields";
import { getCollection } from "../src/content/collections";
import { SINGLETONS } from "../src/content/singletons";
import { saveItem, type Status } from "../src/server/repo/collections";
import { saveSingleton } from "../src/server/repo/singletons";
import { SEED_SINGLETONS } from "./seed-data/singletons";
import { seedContent } from "./seed-data/content";

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Administrator";
  if (!email || !password) throw new Error("SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD wajib di-set di .env");
  if (password.length < 8) throw new Error("SEED_ADMIN_PASSWORD minimal 8 karakter");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (process.env.SEED_ADMIN_RESET_PASSWORD === "true") {
      await prisma.user.update({
        where: { email },
        data: { passwordHash: await bcrypt.hash(password, 12), role: "ADMIN", isActive: true },
      });
      console.log(`✔ Password admin ${email} direset`);
    } else console.log(`• Admin ${email} sudah ada (password tidak diubah)`);
    return existing.id;
  }
  const user = await prisma.user.create({
    data: { email, name, role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`✔ Admin ${email} dibuat`);
  return user.id;
}

async function resetContent() {
  // Hapus semua tabel konten (termasuk tabel join implisit "_…") kecuali User & riwayat migrasi.
  // FK check dimatikan di koneksi yang sama (transaction) agar urutan penghapusan tidak penting.
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

export type SeedApi = {
  media: (label: string, w?: number, h?: number, alt?: { id: string; en: string }) => Promise<string>;
  create: (type: string, data: Record<string, unknown>, status?: Status) => Promise<string>;
};

function api(userId: string): SeedApi {
  return {
    async media(label, w = 1200, h = 800, alt) {
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const m = await prisma.media.create({
        data: {
          url: `https://placehold.co/${w}x${h}/3B58A7/FFFFFF/png?text=${encodeURIComponent(label)}`,
          pathname: `seed/${slug}-${Math.random().toString(36).slice(2, 8)}.png`,
          filename: `${slug}.png`,
          mimeType: "image/png",
          size: 0,
          width: w,
          height: h,
          alt: alt ?? { id: label, en: label },
          uploadedById: userId,
        },
      });
      return m.id;
    },
    async create(type, data, status) {
      const def = getCollection(type);
      if (!def) throw new Error(`Collection tidak dikenal: ${type}`);
      try {
        const saved = await saveItem(def, null, withDefaults(def.fields, data), { status: def.hasStatus ? (status ?? "PUBLISHED") : undefined }, userId);
        return saved.id;
      } catch (e: any) {
        console.error(`✖ Gagal membuat ${type}:`, e.message, e.fieldErrors ?? "");
        throw e;
      }
    },
  };
}

async function main() {
  const userId = await seedAdmin();

  if (process.env.SEED_RESET === "true") await resetContent();
  else if ((await prisma.term.count()) > 0) {
    console.log("• Konten sudah ada — lewati contoh data (set SEED_RESET=true untuk mengisi ulang)");
    return;
  }

  const refs = await seedContent(api(userId));
  console.log("✔ Collection contoh dibuat");

  for (const def of SINGLETONS) {
    const build = SEED_SINGLETONS[def.slug];
    const partial = build ? await build(refs, api(userId)) : {};
    try {
      await saveSingleton(def, withDefaults(def.fields, partial), userId, true);
    } catch (e: any) {
      console.error(`✖ Gagal menyimpan singleton ${def.slug}:`, e.message, e.fieldErrors ?? "");
      throw e;
    }
  }
  console.log(`✔ ${SINGLETONS.length} singleton dibuat & dipublikasikan`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
