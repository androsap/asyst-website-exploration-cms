"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";
import { ArrowLeft, Eye, ExternalLink, Save, Send, Trash2, Undo2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Lang } from "@/lib/i18n";
import { getCollection } from "@/content/collections";
import {
  deleteCollectionAction,
  previewLinkAction,
  saveCollectionAction,
  setStatusAction,
} from "@/server/actions/content";
import type { Status } from "@/server/repo/collections";
import { ConfirmButton } from "../confirm-button";
import { StickyBar } from "../sticky-bar";
import { StatusBadge } from "../status-badge";
import { EditLangProvider, useAdminConfig } from "./context";
import { DateTimeLocalInput, FieldsRenderer } from "./fields-renderer";
import { LangTabs } from "./lang-tabs";
import { invalidateRefOptions } from "./ref-options";
import { applyServerErrors, onInvalid, useContentForm } from "./use-content-form";

/** Aksi yang diizinkan untuk user (lihat Manajemen Role). Server tetap memeriksa ulang. */
export type FormPerms = { save: boolean; publish: boolean; delete: boolean };

export type EntityMeta = {
  status?: Status;
  publishedAt?: string | null;
  updatedAt?: string;
  createdAt?: string;
  slug?: string | null;
};

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";

export function EntityForm({
  type,
  id,
  initialValues,
  meta,
  perms,
}: {
  type: string;
  id: string | null;
  initialValues: Record<string, unknown>;
  meta: EntityMeta;
  perms: FormPerms;
}) {
  const def = getCollection(type)!;
  const router = useRouter();
  const { previewEnabled } = useAdminConfig();
  const [lang, setLang] = useState<Lang>("id");
  const [status, setStatus] = useState<Status>(meta.status ?? "DRAFT");
  const [publishedAt, setPublishedAt] = useState<string>(meta.publishedAt ?? "");
  const [pending, start] = useTransition();
  const form = useContentForm(def.fields, initialValues);

  const save = (nextStatus?: Status) =>
    form.handleSubmit((values) => {
      start(async () => {
        const st = nextStatus ?? status;
        const res = await saveCollectionAction(type, id, values, {
          ...(def.hasStatus ? { status: st, publishedAt: publishedAt || null } : {}),
        });
        if (!res.ok) return applyServerErrors(form, res.fieldErrors, res.error);
        invalidateRefOptions(type);
        setStatus(st);
        form.reset(form.getValues());
        toast.success(st === "PUBLISHED" && nextStatus ? "Tersimpan & dipublikasikan" : "Tersimpan");
        if (!id) router.replace(`/admin/c/${type}/${res.data.id}`);
        else router.refresh();
      });
    }, onInvalid)();

  const changeStatus = (st: Status) =>
    start(async () => {
      if (!id) return;
      const res = await setStatusAction(type, id, st);
      if (!res.ok) return void toast.error(res.error);
      setStatus(st);
      toast.success(st === "PUBLISHED" ? "Dipublikasikan" : st === "ARCHIVED" ? "Diarsipkan" : "Dikembalikan ke draft");
      router.refresh();
    });

  const openSitePreview = () =>
    start(async () => {
      const slug = form.getValues(def.slugField ?? "slug") || meta.slug;
      const path = (def.previewPath ?? "/").replace("{slug}", String(slug ?? ""));
      const res = await previewLinkAction(path);
      if (!res.ok) return void toast.error(res.error);
      window.open(res.data.url, "_blank", "noopener");
    });

  return (
    <FormProvider {...form}>
      <EditLangProvider value={lang}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="mx-auto max-w-6xl"
        >
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Button asChild color="neutral" variant="tertiary" size="icon">
              <Link href={`/admin/c/${type}`} aria-label="Kembali">
                <ArrowLeft />
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <Breadcrumbs
                className="mb-1"
                items={[
                  { label: "Dashboard", href: "/admin" },
                  { label: def.label, href: `/admin/c/${type}` },
                  { label: id ? "Edit" : "Baru" },
                ]}
              />
              <h1 className="truncate text-title-md text-[var(--neutral900)]">{id ? `Edit ${def.singular.toLowerCase()}` : `${def.singular} baru`}</h1>
            </div>
            {def.hasStatus && <StatusBadge status={status} publishedAt={publishedAt} />}
            {form.formState.isDirty && <span className="text-xs text-[var(--warning700)]">Ada perubahan belum disimpan</span>}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="min-w-0 space-y-4">
              <StickyBar className="-mx-4 flex items-center justify-between gap-2 bg-background px-4 py-2">
                <LangTabs value={lang} onChange={setLang} />
                <span className="hidden text-xs text-muted-foreground sm:block">Field non-teks dipakai bersama kedua bahasa.</span>
              </StickyBar>
              <Card>
                <CardContent className="pt-2">
                  <FieldsRenderer fields={def.fields} />
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card>
                <CardHeader>
                  <CardTitle className="text-subtitle-sm">Publikasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {def.hasStatus && perms.publish && (
                    <div className="space-y-1.5">
                      <Label htmlFor="publishedAt">Tanggal terbit</Label>
                      <DateTimeLocalInput id="publishedAt" value={publishedAt} onChange={setPublishedAt} />
                      <p className="text-xs text-muted-foreground">Kosongkan = saat dipublish. Tanggal mendatang = terjadwal.</p>
                    </div>
                  )}
                  {!perms.save && (
                    <p className="rounded-md bg-[var(--neutral50)] px-3 py-2 text-xs text-muted-foreground">
                      Role Anda hanya bisa melihat data ini.
                    </p>
                  )}
                  <div className="flex flex-col gap-2">
                    {perms.save && (
                    <Button type="submit" color="brand" variant={def.hasStatus && status !== "PUBLISHED" && perms.publish ? "secondary" : "primary"} disabled={pending}>
                      {pending ? <Spinner size="xs" className="text-current" label="Memproses" /> : <Save />}
                      {def.hasStatus && status !== "PUBLISHED" ? "Simpan draft" : "Simpan"}
                    </Button>
                    )}
                    {perms.save && perms.publish && def.hasStatus && status !== "PUBLISHED" && (
                      <Button type="button" disabled={pending} onClick={() => save("PUBLISHED")}>
                        <Send /> Simpan & publish
                      </Button>
                    )}
                    {perms.publish && def.hasStatus && id && status === "PUBLISHED" && (
                      <Button type="button" color="neutral" variant="secondary" disabled={pending} onClick={() => changeStatus("DRAFT")}>
                        <Undo2 /> Unpublish (jadi draft)
                      </Button>
                    )}
                    {perms.publish && def.hasStatus && id && status !== "ARCHIVED" && (
                      <Button type="button" color="neutral" variant="tertiary" size="sm" disabled={pending} onClick={() => changeStatus("ARCHIVED")}>
                        Arsipkan
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {id && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-subtitle-sm">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <Button asChild color="neutral" variant="secondary" size="sm">
                      <Link href={`/admin/preview/c/${type}/${id}`} target="_blank">
                        <Eye /> Preview di CMS
                      </Link>
                    </Button>
                    {def.previewPath && (
                      <Button type="button" color="neutral" variant="secondary" size="sm" disabled={pending || !previewEnabled} onClick={openSitePreview}>
                        <ExternalLink /> Preview di website
                      </Button>
                    )}
                    {!previewEnabled && def.previewPath && (
                      <p className="text-xs text-muted-foreground">Set PREVIEW_URL untuk preview di website.</p>
                    )}
                    <p className="text-xs text-muted-foreground">Preview menampilkan data tersimpan terakhir — simpan dulu perubahan.</p>
                  </CardContent>
                </Card>
              )}

              {id && (
                <Card>
                  <CardContent className="space-y-1 pt-4 text-xs text-muted-foreground">
                    <p>Dibuat: {fmt(meta.createdAt)}</p>
                    <p>Diubah: {fmt(meta.updatedAt)}</p>
                    {perms.delete && (
                    <ConfirmButton
                      color="danger" variant="tertiary"
                      size="sm"
                      className="mt-2 -ml-2"
                      title={`Hapus ${def.singular.toLowerCase()}?`}
                      description="Tindakan ini permanen dan tidak bisa dibatalkan."
                      confirmLabel="Hapus"
                      onConfirm={async () => {
                        const res = await deleteCollectionAction(type, id);
                        if (!res.ok) return void toast.error(res.error);
                        invalidateRefOptions(type);
                        toast.success("Dihapus");
                        form.reset(form.getValues());
                        router.replace(`/admin/c/${type}`);
                      }}
                    >
                      <Trash2 /> Hapus
                    </ConfirmButton>
                    )}
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>
        </form>
      </EditLangProvider>
    </FormProvider>
  );
}
