import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { canDo, requirePageModule } from "@/server/admin-menu";
import { SOURCE_LABEL } from "../labels";
import { SubmissionActions } from "./submission-actions";

export default async function SubmissionDetailPage({ params }: PageProps<"/admin/submissions/[id]">) {
  const user = await requirePageModule("sys:submissions");
  const { id } = await params;
  const s = await prisma.formSubmission.findUnique({ where: { id } });
  if (!s) notFound();

  const rows: [string, string | null][] = [
    ["Nama", s.fullName],
    ["Email", s.email],
    ["Telepon", s.phone],
    ["Perusahaan", s.company],
    ["Jabatan", s.jobTitle],
    ["Topik", s.topic],
    ["Subjek", s.subject],
    ["Halaman", s.pageUrl],
    ["Bahasa", s.language],
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild color="neutral" variant="tertiary" size="icon">
          <Link href="/admin/submissions" aria-label="Kembali">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <p className="text-xs text-muted-foreground">{SOURCE_LABEL[s.source]}</p>
          <h1 className="text-title-md text-[var(--neutral900)]">{s.fullName}</h1>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-subtitle-sm">Isi kiriman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-2 text-sm sm:grid-cols-[140px_1fr]">
              {rows
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="break-words">{k === "Email" ? <a className="text-primary hover:underline" href={`mailto:${v}`}>{v}</a> : v}</dd>
                  </div>
                ))}
            </dl>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Pesan</p>
              <p className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">{s.message}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Masuk {s.createdAt.toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })}
            </p>
          </CardContent>
        </Card>
        <SubmissionActions id={s.id} status={s.status} notes={s.notes ?? ""} canDelete={await canDo(user, "sys:submissions", "delete")} />
      </div>
    </div>
  );
}
