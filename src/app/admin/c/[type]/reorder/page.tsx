/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SortableList } from "@/components/admin/sortable-list";
import { getCollection } from "@/content/collections";
import { labelOf } from "@/lib/i18n";
import { delegate } from "@/server/repo/collections";
import { requirePageUser } from "@/server/session";

export default async function ReorderPage({ params, searchParams }: PageProps<"/admin/c/[type]/reorder">) {
  await requirePageUser();
  const { type } = await params;
  const def = getCollection(type);
  if (!def || !def.orderable) notFound();
  const sp = await searchParams;
  const scopeValue = def.reorderScope && typeof sp[def.reorderScope] === "string" ? (sp[def.reorderScope] as string) : null;
  if (def.reorderScope && !scopeValue) notFound();

  const thumbKey = def.columns.find((c) => c.kind === "media")?.path;
  const rows: any[] = await delegate(def).findMany({
    where: def.reorderScope ? { [def.reorderScope]: scopeValue } : {},
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: def.listInclude,
    take: 500,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild color="neutral" variant="tertiary" size="icon">
          <Link href={`/admin/c/${type}${scopeValue ? `?${def.reorderScope}=${scopeValue}` : ""}`} aria-label="Kembali">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-title-md text-[var(--neutral900)]">Atur urutan · {def.label}</h1>
          <p className="text-sm text-muted-foreground">
            Seret baris untuk mengubah urutan tampil (keyboard: Spasi lalu panah).{scopeValue ? ` Lingkup: ${scopeValue}` : ""}
          </p>
        </div>
      </div>
      <SortableList
        type={type}
        rows={rows.map((r) => ({
          id: r.id,
          label: labelOf(r[def.titleField]) || r.id,
          hint: def.hasStatus ? String(r.status).toLowerCase() : (r.slug ?? r.key ?? undefined),
          thumb: thumbKey ? (r[thumbKey]?.url ?? null) : null,
        }))}
      />
    </div>
  );
}
