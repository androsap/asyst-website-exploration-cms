/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpDown, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { getCollection, type ListColumn } from "@/content/collections";
import { labelOf } from "@/lib/i18n";
import { isImage } from "@/lib/media";
import { listItems } from "@/server/repo/collections";
import { requirePageUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/admin/c/[type]">): Promise<Metadata> {
  const { type } = await params;
  return { title: getCollection(type)?.label ?? "Konten" };
}

const getPath = (obj: any, path: string) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

function Cell({ col, row, options }: { col: ListColumn; row: any; options?: Map<string, string> }) {
  const v = getPath(row, col.path);
  switch (col.kind) {
    case "media":
      return v?.url && isImage(v.mimeType) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={v.url} alt="" className="h-10 w-14 rounded bg-muted object-contain" />
      ) : (
        <div className="flex h-10 w-14 items-center justify-center rounded bg-muted text-muted-foreground">
          <FileText className="size-4" />
        </div>
      );
    case "l":
      return <span className="line-clamp-2">{labelOf(v) || "—"}</span>;
    case "bool":
      return <span>{v ? "Ya" : "Tidak"}</span>;
    case "date":
      return <span className="whitespace-nowrap">{v ? new Date(v).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "—"}</span>;
    case "datetime":
      return (
        <span className="whitespace-nowrap text-muted-foreground">
          {v ? new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—"}
        </span>
      );
    case "status":
      return <StatusBadge status={v} publishedAt={row.publishedAt} />;
    case "enum":
      return <span className="text-xs">{options?.get(v) ?? v ?? "—"}</span>;
    case "enumList":
      return <span className="text-xs text-muted-foreground">{(v ?? []).join(", ") || "—"}</span>;
    default:
      return <span className="line-clamp-2">{v ?? "—"}</span>;
  }
}

export default async function CollectionListPage({ params, searchParams }: PageProps<"/admin/c/[type]">) {
  await requirePageUser();
  const { type } = await params;
  const def = getCollection(type);
  if (!def) notFound();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const filters = Object.fromEntries((def.adminFilters ?? []).map((f) => [f.field, str(f.field)]));
  const result = await listItems(def, { q: str("q"), page: Number(str("page") ?? 1), status: str("status"), filters });
  const enumLabels = new Map((def.adminFilters ?? []).flatMap((f) => f.options.map((o) => [o.value, o.label] as const)));
  const titleCol = def.columns.findIndex((c) => c.kind !== "media");

  const reorderHref = def.reorderScope
    ? str(def.reorderScope)
      ? `/admin/c/${type}/reorder?${def.reorderScope}=${str(def.reorderScope)}`
      : null
    : `/admin/c/${type}/reorder`;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-title-md text-[var(--neutral900)]">{def.label}</h1>
          <p className="text-sm text-muted-foreground">
            {def.hasStatus ? "Konten dengan status draft/terbit." : "Data referensi."}
            {def.orderable && " Urutan tampil diatur lewat tombol Atur urutan."}
          </p>
        </div>
        {def.orderable &&
          (reorderHref ? (
            <Button asChild color="neutral" variant="secondary">
              <Link href={reorderHref}>
                <ArrowUpDown /> Atur urutan
              </Link>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Pilih {def.reorderScope} untuk mengatur urutan</span>
          ))}
        <Button asChild>
          <Link href={`/admin/c/${type}/new`}>
            <Plus /> Tambah {def.singular.toLowerCase()}
          </Link>
        </Button>
      </div>

      <ListToolbar hasStatus={def.hasStatus} filters={def.adminFilters} />

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              {def.orderable && <TableHead className="w-12">#</TableHead>}
              {def.columns.map((c) => (
                <TableHead key={c.path}>{c.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={def.columns.length + 1} className="py-12 text-center text-muted-foreground">
                  Belum ada data.{" "}
                  <Link href={`/admin/c/${type}/new`} className="text-primary hover:underline">
                    Tambah sekarang
                  </Link>
                </TableCell>
              </TableRow>
            )}
            {result.items.map((row) => (
              <TableRow key={row.id} className="relative">
                {def.orderable && <TableCell className="text-xs text-muted-foreground">{row.order + 1}</TableCell>}
                {def.columns.map((c, i) => (
                  <TableCell key={c.path} className={i === titleCol ? "max-w-80 font-medium whitespace-normal" : "max-w-60 whitespace-normal"}>
                    {i === titleCol ? (
                      <Link href={`/admin/c/${type}/${row.id}`} className="hover:text-primary hover:underline">
                        <Cell col={c} row={row} options={enumLabels} />
                      </Link>
                    ) : (
                      <Cell col={c} row={row} options={enumLabels} />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        basePath={`/admin/c/${type}`}
        params={Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, typeof v === "string" ? v : undefined]))}
      />
    </div>
  );
}
