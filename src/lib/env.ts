import { z } from "zod";

// Validasi env server. Dipanggil secara lazy agar `next build` tidak gagal saat env belum tersedia.
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET minimal 16 karakter"),
  ALLOWED_ORIGINS: z.string().default(""),
  PREVIEW_URL: z.string().default(""),
  PREVIEW_SECRET: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  PUBLIC_CACHE_SMAXAGE: z.coerce.number().int().min(0).default(60),
  PUBLIC_CACHE_SWR: z.coerce.number().int().min(0).default(600),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Konfigurasi env tidak valid: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function allowedOrigins(): string[] {
  return env()
    .ALLOWED_ORIGINS.split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}
