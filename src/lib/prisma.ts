import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Ubah DATABASE_URL `mysql://user:pass@host:3306/db?ssl=true` menjadi PoolConfig driver `mariadb`
 * (driver ini kompatibel dengan MySQL 5.7/8.x dan MariaDB 10.x).
 */
export function poolConfigFromUrl(raw: string) {
  const url = new URL(raw);
  if (!["mysql:", "mariadb:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL harus diawali mysql:// (atau mariadb://)");
  }
  const sslParam = url.searchParams.get("ssl") ?? url.searchParams.get("sslmode") ?? url.searchParams.get("sslaccept");
  const ssl = sslParam && !["false", "0", "disable", "disabled"].includes(sslParam.toLowerCase());
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    // Pool kecil cukup untuk serverless (tiap instance Vercel berumur pendek).
    connectionLimit: Number(process.env.DATABASE_POOL_MAX) || 5,
    ...(ssl ? { ssl: { rejectUnauthorized: sslParam !== "accept_invalid_certs" } } : {}),
    // Simpan & baca DATETIME sebagai UTC.
    timezone: "Z",
  };
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL belum di-set");
  const adapter = new PrismaMariaDb(poolConfigFromUrl(connectionString));
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
