/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { Inbox, PenLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavIcon } from "@/components/admin/icon";
import { StatusBadge } from "@/components/admin/status-badge";
import { COLLECTIONS } from "@/content/collections";
import { labelOf } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { delegate } from "@/server/repo/collections";
import { requirePageUser } from "@/server/session";
import { canDo } from "@/server/admin-menu";

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const user = await requirePageUser();
  const forbidden = (await searchParams).forbidden;
  const candidates = COLLECTIONS.filter((c) => ["news", "jobs", "case-studies", "products", "solutions", "industries"].includes(c.type));
  const visible = await Promise.all(candidates.map((c) => canDo(user, `c:${c.type}`)));
  const main = candidates.filter((_, i) => visible[i]);
  const canSubmissions = await canDo(user, "sys:submissions");

  const [stats, recent, newSubmissions] = await Promise.all([
    Promise.all(
      main.map(async (def) => {
        const d = delegate(def);
        const [total, drafts] = await Promise.all([d.count(), def.hasStatus ? d.count({ where: { status: "DRAFT" } }) : 0]);
        return { def, total, drafts };
      }),
    ),
    Promise.all(
      main.map(async (def) =>
        ((await delegate(def).findMany({ orderBy: { updatedAt: "desc" }, take: 5 })) as any[]).map((r) => ({ def, row: r })),
      ),
    ).then((all) =>
      all
        .flat()
        .sort((a, b) => +new Date(b.row.updatedAt) - +new Date(a.row.updatedAt))
        .slice(0, 8),
    ),
    prisma.formSubmission.count({ where: { status: "NEW" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {forbidden && (
        <p className="rounded-md bg-[var(--warning50)] px-4 py-2 text-sm text-[var(--warning700)]">Role Anda tidak punya izin untuk membuka halaman tersebut.</p>
      )}
      <div>
        <h1 className="text-heading-sm text-[var(--neutral900)]">Halo, {user.name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-muted-foreground">Ringkasan konten website ASYST.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ def, total, drafts }) => (
          <Link key={def.type} href={`/admin/c/${def.type}`}>
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex items-center gap-3 pt-0">
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-primary">
                  <NavIcon name={def.icon} className="size-5" />
                </span>
                <div>
                  <p className="text-heading-sm text-[var(--neutral900)]">{total}</p>
                  <p className="text-xs text-muted-foreground">
                    {def.label}
                    {drafts ? ` · ${drafts} draft` : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {canSubmissions && (
        <Link href="/admin/submissions?status=NEW">
          <Card className="transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-3 pt-0">
              <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--warning50)] text-[var(--warning700)]">
                <Inbox className="size-5" />
              </span>
              <div>
                <p className="text-heading-sm text-[var(--neutral900)]">{newSubmissions}</p>
                <p className="text-xs text-muted-foreground">Form masuk baru</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-subtitle-sm">
            <PenLine className="size-4" /> Terakhir diubah
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada konten.</p>
          ) : (
            <ul className="divide-y">
              {recent.map(({ def, row }) => (
                <li key={`${def.type}-${row.id}`} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-28 shrink-0 text-xs text-muted-foreground">{def.singular}</span>
                  <Link href={`/admin/c/${def.type}/${row.id}`} className="flex-1 truncate hover:text-primary hover:underline">
                    {labelOf(row[def.titleField]) || "(tanpa judul)"}
                  </Link>
                  {def.hasStatus && <StatusBadge status={row.status} publishedAt={row.publishedAt} />}
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {new Date(row.updatedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
