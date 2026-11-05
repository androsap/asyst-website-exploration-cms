import { AuthError } from "@/server/session";
import { mapPrismaError, ValidationError } from "@/server/repo/collections";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (raw) {
    const e = raw instanceof AuthError ? raw : mapPrismaError(raw);
    if (e instanceof ValidationError) return { ok: false, error: e.message, fieldErrors: e.fieldErrors };
    if (e instanceof AuthError) return { ok: false, error: e.message };
    // Error navigasi Next (redirect/notFound) harus diteruskan.
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error("[action]", e);
    return { ok: false, error: "Terjadi kesalahan. Coba lagi atau hubungi admin." };
  }
}
