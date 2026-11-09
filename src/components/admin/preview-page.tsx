import Link from "next/link";
import type { Fields } from "@/content/fields";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { PreviewObject } from "./preview-renderer";
import { LangFlag } from "./lang-flag";

export function PreviewPage({
  title,
  subtitle,
  lang,
  basePath,
  data,
  fields,
  note,
}: {
  title: string;
  subtitle: string;
  lang: Lang;
  basePath: string;
  data: Record<string, unknown>;
  fields: Fields;
  note?: string;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-brand-50 px-4 py-3">
        <div className="flex-1">
          <p className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Preview</p>
          <h1 className="text-title-sm text-[var(--neutral900)]">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex rounded-lg border bg-background p-0.5 text-sm">
          {(["id", "en"] as const).map((l) => (
            <Link
              key={l}
              href={`${basePath}?lang=${l}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-1",
                lang === l ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <LangFlag lang={l} />
              {l === "id" ? "Indonesia" : "English"}
            </Link>
          ))}
        </div>
      </div>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      <Card>
        <CardContent className="pt-2">
          <PreviewObject data={data} fields={fields} />
        </CardContent>
      </Card>
      <details className="rounded-lg border p-3 text-xs">
        <summary className="cursor-pointer font-medium">JSON (seperti respons API)</summary>
        <pre className="mt-2 max-h-[60vh] overflow-auto rounded bg-muted p-3">{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
}
