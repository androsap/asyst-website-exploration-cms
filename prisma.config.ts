import "dotenv/config";
import { defineConfig } from "prisma/config";

// Konfigurasi Prisma CLI (migrate, studio, seed). Database: MySQL 8 / MariaDB 10.4+.
// Runtime aplikasi memakai DATABASE_URL lewat driver adapter MariaDB di src/lib/prisma.ts.
// `prisma migrate dev` butuh hak CREATE/DROP database (untuk shadow database sementara).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
