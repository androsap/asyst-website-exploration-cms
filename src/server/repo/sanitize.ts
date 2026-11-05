import sanitizeHtml from "sanitize-html";
import { blockFields, type Field, type Fields } from "@/content/fields";

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "a", "h2", "h3", "h4",
    "ul", "ol", "li", "blockquote", "code", "pre", "hr", "img", "figure", "figcaption",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.target === "_blank" ? { ...attribs, rel: "noopener noreferrer" } : attribs,
    }),
  },
};

export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}

/** Sanitasi semua field rich text (bersarang sekalipun) sebelum disimpan. */
export function sanitizeFields(fields: Fields, data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  for (const [k, field] of Object.entries(fields)) out[k] = sanitizeValue(field, data[k]);
  return out;
}

function sanitizeValue(field: Field, v: unknown): unknown {
  if (v == null) return v;
  switch (field.kind) {
    case "ltext":
      if (!field.rich || typeof v !== "object") return v;
      return Object.fromEntries(
        Object.entries(v as Record<string, unknown>).map(([lang, s]) => [lang, typeof s === "string" ? sanitizeRichHtml(s) : s]),
      );
    case "object":
      return sanitizeFields(field.fields, v as Record<string, unknown>);
    case "array":
      return Array.isArray(v) ? v.map((item) => sanitizeFields(field.fields, item)) : v;
    case "blocks":
      return Array.isArray(v)
        ? v.map((b) => {
            const def = field.blocks[(b as { type: string }).type];
            return def ? sanitizeFields(blockFields(def), b) : b;
          })
        : v;
    default:
      return v;
  }
}
