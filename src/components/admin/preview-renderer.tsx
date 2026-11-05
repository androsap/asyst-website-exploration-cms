/* eslint-disable @typescript-eslint/no-explicit-any */
import { blockFields, type Field, type Fields } from "@/content/fields";

// Render generik hasil serialisasi API (sudah dilokalisasi) agar editor bisa
// meninjau konten sebelum publish. Bukan tampilan website sebenarnya.

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);
const isMedia = (v: any) => isObj(v) && typeof v.url === "string" && "mimeType" in v;
const looksHtml = (s: string) => /<(p|h[1-6]|ul|ol|strong|em|a|br)[\s>/]/i.test(s);

function fieldFor(fields: Fields | undefined, key: string): Field | undefined {
  return fields?.[key] ?? fields?.[`${key}Id`];
}

function Empty() {
  return <span className="text-muted-foreground italic">kosong</span>;
}

export function PreviewValue({ value, field }: { value: unknown; field?: Field }) {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) return <Empty />;
  if (typeof value === "boolean") return <span>{value ? "Ya" : "Tidak"}</span>;
  if (typeof value === "number") return <span>{value}</span>;
  if (value instanceof Date) return <span>{value.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>;
  if (typeof value === "string") {
    if (looksHtml(value)) return <div className="prose-cms" dangerouslySetInnerHTML={{ __html: value }} />;
    return <span className="whitespace-pre-line">{value}</span>;
  }
  if (isMedia(value)) {
    const m = value as any;
    return (
      <figure className="space-y-1">
        {String(m.mimeType).startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.url} alt={m.alt} className="max-h-56 rounded-md border bg-muted object-contain" />
        ) : (
          <a href={m.url} className="text-primary underline" target="_blank" rel="noreferrer">
            {m.url}
          </a>
        )}
        <figcaption className="text-xs text-muted-foreground">alt: {m.alt || <span className="text-[var(--warning700)]">belum diisi</span>}</figcaption>
      </figure>
    );
  }
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string"))
      return (
        <ul className="list-disc space-y-0.5 pl-5">
          {value.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      );
    const itemFields = field?.kind === "array" ? field.fields : undefined;
    return (
      <div className="space-y-3">
        {value.map((item, i) => {
          const blockDef = field?.kind === "blocks" && isObj(item) ? field.blocks[item.type] : undefined;
          return (
            <div key={i} className="rounded-lg border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {blockDef ? `Blok: ${blockDef.label}` : `#${i + 1}`}
              </p>
              {isObj(item) && !isMedia(item) ? (
                <PreviewObject data={item} fields={blockDef ? blockFields(blockDef) : itemFields} />
              ) : (
                <PreviewValue value={item} />
              )}
            </div>
          );
        })}
      </div>
    );
  }
  if (isObj(value)) return <PreviewObject data={value} fields={field?.kind === "object" ? field.fields : undefined} />;
  return <span>{String(value)}</span>;
}

export function PreviewObject({ data, fields }: { data: Record<string, any>; fields?: Fields }) {
  const entries = Object.entries(data).filter(([k]) => !["type", "hidden", "anchorId"].includes(k));
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[180px_1fr]">
      {entries.map(([k, v]) => {
        const field = fieldFor(fields, k);
        return (
          <div key={k} className="contents">
            <dt className="text-xs font-medium text-muted-foreground sm:pt-0.5">{field?.label ?? k}</dt>
            <dd className="min-w-0 text-sm">
              <PreviewValue value={v} field={field} />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
