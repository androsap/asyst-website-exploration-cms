// Helper lokalisasi field { id, en } — dipakai admin & API publik.

export type Lang = "id" | "en";
export const LANGS: Lang[] = ["id", "en"];
export const DEFAULT_LANG: Lang = "id";

export type L<T = string> = { id: T; en: T };

export function parseLang(value: string | null | undefined): Lang {
  return value === "en" ? "en" : "id";
}

export function isEmptyValue(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "" || v.trim() === "<p></p>";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** Ambil nilai sesuai bahasa; bila kosong, pakai bahasa lainnya. */
export function pick<T>(value: L<T> | null | undefined, lang: Lang): T | null {
  if (!value || typeof value !== "object") return null;
  const other: Lang = lang === "id" ? "en" : "id";
  const primary = value[lang];
  if (!isEmptyValue(primary)) return primary;
  const fallback = value[other];
  return isEmptyValue(fallback) ? (primary ?? null) : fallback;
}

/** Label singkat untuk tampilan admin (ID dulu, lalu EN). */
export function labelOf(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && ("id" in value || "en" in value)) {
    const v = pick(value as L<unknown>, "id");
    return typeof v === "string" ? v : Array.isArray(v) ? v.join(", ") : "";
  }
  return "";
}

export function emptyL(): L {
  return { id: "", en: "" };
}
