import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { FormSource, SubmissionStatus } from "@/generated/prisma/enums";
import { requirePageUser } from "@/server/session";
import { SOURCE_LABEL } from "./labels";

export const metadata: Metadata = { title: "Form masuk" };

const PAGE_SIZE = 25;

export default async function SubmissionsPage({ searchParams }: PageProps<"/admin/submissions">) {
  await requirePageUser();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && ["NEW", "IN_PROGRESS", "CLOSED"].includes(sp.status) ? sp.status : undefined;
  const source = typeof sp.source === "string" && sp.source in SOURCE_LABEL ? sp.source : undefined;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const where = {
    ...(status ? { status: status as SubmissionStatus } : {}),
    ...(source ? { source: source as FormSource } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.formSubmission.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.formSubmission.count({ where }),
  ]);

  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, source, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const qs = p.toString();
    return qs ? `/admin/submissions?${qs}` : "/admin/submissions";
  };
  const pill = (active: boolean) => cn("rounded-md px-2.5 py-1", active ? "bg-primary text-primary-foreground" : "hover:bg-muted");

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-title-md text-[var(--neutral900)]">Form masuk</h1>
        <p className="text-sm text-muted-foreground">Kiriman form Contact Us & Ask ASYST dari website (POST /api/forms/…).</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <div className="flex rounded-lg border p-0.5">
          {[undefined, "NEW", "IN_PROGRESS", "CLOSED"].map((s) => (
            <Link key={s ?? "all"} href={link({ status: s })} className={pill(status === s)}>
              {s ? { NEW: "Baru", IN_PROGRESS: "Diproses", CLOSED: "Selesai" }[s] : "Semua"}
            </Link>
          ))}
        </div>
        <div className="flex rounded-lg border p-0.5">
          {[undefined, ...Object.keys(SOURCE_LABEL)].map((s) => (
            <Link key={s ?? "all"} href={link({ source: s })} className={pill(source === s)}>
              {s ? SOURCE_LABEL[s] : "Semua sumber"}
            </Link>
          ))}
        </div>
      </div>
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pengirim</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead>Subjek / topik</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Masuk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Belum ada kiriman.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link href={`/admin/submissions/${r.id}`} className="font-medium hover:text-primary hover:underline">
                    {r.fullName}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {r.email} · {r.company}
                  </div>
                </TableCell>
                <TableCell className="text-xs">{SOURCE_LABEL[r.source]}</TableCell>
                <TableCell className="max-w-64 truncate text-sm">{r.subject || r.topic || r.message.slice(0, 60)}</TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                  {r.createdAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        total={total}
        basePath="/admin/submissions"
        params={{ status, source }}
      />
    </div>
  );
}
