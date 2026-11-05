"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";
import { Eye, ExternalLink, RotateCcw, Save, Send } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lang } from "@/lib/i18n";
import { getSingleton } from "@/content/singletons";
import { discardSingletonAction, previewLinkAction, saveSingletonAction } from "@/server/actions/content";
import { ConfirmButton } from "../confirm-button";
import { EditLangProvider, useAdminConfig } from "./context";
import { FieldsRenderer } from "./fields-renderer";
import { LangTabs } from "./lang-tabs";
import { applyServerErrors, onInvalid, useContentForm } from "./use-content-form";

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "belum pernah";

export function SingletonForm({
  slug,
  initialValues,
  publishedAt,
  updatedAt,
  hasPublished,
  dirty,
}: {
  slug: string;
  initialValues: Record<string, unknown>;
  publishedAt: string | null;
  updatedAt: string | null;
  hasPublished: boolean;
  dirty: boolean;
}) {
  const def = getSingleton(slug)!;
  const router = useRouter();
  const { previewEnabled } = useAdminConfig();
  const [lang, setLang] = useState<Lang>("id");
  const [pending, start] = useTransition();
  const form = useContentForm(def.fields, initialValues);

  const save = (publish: boolean) =>
    form.handleSubmit((values) => {
      start(async () => {
        const res = await saveSingletonAction(slug, values, publish);
        if (!res.ok) return applyServerErrors(form, res.fieldErrors, res.error);
        form.reset(form.getValues());
        toast.success(publish || !def.draftable ? "Tersimpan & terbit" : "Draft tersimpan");
        router.refresh();
      });
    }, onInvalid)();

  const openSitePreview = () =>
    start(async () => {
      const res = await previewLinkAction(def.previewPath ?? "/");
      if (!res.ok) return void toast.error(res.error);
      window.open(res.data.url, "_blank", "noopener");
    });

  return (
    <FormProvider {...form}>
      <EditLangProvider value={lang}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(false);
          }}
          className="mx-auto max-w-6xl"
        >
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <Breadcrumbs className="mb-1" items={[{ label: "Dashboard", href: "/admin" }, { label: def.group }, { label: def.label }]} />
              <h1 className="truncate text-title-md text-[var(--neutral900)]">{def.label}</h1>
            </div>
            {def.draftable &&
              (!hasPublished ? (
                <Badge color="neutral" variant="light">Belum terbit</Badge>
              ) : dirty ? (
                <Badge color="warning" variant="light">Draft berbeda dari versi terbit</Badge>
              ) : (
                <Badge color="success" variant="light">Terbit</Badge>
              ))}
            {form.formState.isDirty && <span className="text-xs text-[var(--warning700)]">Ada perubahan belum disimpan</span>}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="min-w-0 space-y-4">
              <div className="sticky top-16 z-20 -mx-1 flex items-center justify-between gap-2 bg-background/95 px-1 py-2 backdrop-blur">
                <LangTabs value={lang} onChange={setLang} />
              </div>
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
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Terbit terakhir: {fmt(publishedAt)}</p>
                    <p>Disimpan terakhir: {fmt(updatedAt)}</p>
                  </div>
                  {def.draftable ? (
                    <div className="flex flex-col gap-2">
                      <Button type="submit" color="neutral" variant="secondary" disabled={pending}>
                        {pending ? <Spinner size="xs" className="text-current" label="Memproses" /> : <Save />} Simpan draft
                      </Button>
                      <Button type="button" disabled={pending} onClick={() => save(true)}>
                        <Send /> Simpan & publish
                      </Button>
                      {hasPublished && dirty && (
                        <ConfirmButton
                          color="neutral" variant="tertiary"
                          size="sm"
                          title="Buang perubahan draft?"
                          description="Draft akan dikembalikan ke versi yang sedang terbit."
                          onConfirm={async () => {
                            const res = await discardSingletonAction(slug);
                            if (!res.ok) return void toast.error(res.error);
                            toast.success("Draft dikembalikan ke versi terbit");
                            router.refresh();
                          }}
                        >
                          <RotateCcw /> Buang perubahan draft
                        </ConfirmButton>
                      )}
                      <p className="text-xs text-muted-foreground">Situs hanya menampilkan versi terbit.</p>
                    </div>
                  ) : (
                    <Button type="submit" className="w-full" disabled={pending}>
                      {pending ? <Spinner size="xs" className="text-current" label="Memproses" /> : <Save />} Simpan
                    </Button>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-subtitle-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button asChild color="neutral" variant="secondary" size="sm">
                    <Link href={`/admin/preview/s/${slug}`} target="_blank">
                      <Eye /> Preview draft di CMS
                    </Link>
                  </Button>
                  {def.previewPath && (
                    <Button type="button" color="neutral" variant="secondary" size="sm" disabled={pending || !previewEnabled} onClick={openSitePreview}>
                      <ExternalLink /> Preview di website
                    </Button>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </form>
      </EditLangProvider>
    </FormProvider>
  );
}
