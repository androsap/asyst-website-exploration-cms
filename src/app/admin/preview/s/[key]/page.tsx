import { notFound } from "next/navigation";
import { PreviewPage } from "@/components/admin/preview-page";
import { getSingleton } from "@/content/singletons";
import { parseLang } from "@/lib/i18n";
import { applyExtras } from "@/server/public/extras";
import { serializeDoc } from "@/server/public/serialize";
import { loadSingleton } from "@/server/repo/singletons";
import { requirePageModule } from "@/server/admin-menu";

export default async function PreviewSingletonPage({ params, searchParams }: PageProps<"/admin/preview/s/[key]">) {
  const { key } = await params;
  await requirePageModule(`s:${key}`);
  const lang = parseLang((await searchParams).lang as string | undefined);
  const def = getSingleton(key);
  if (!def) notFound();
  const { draft } = await loadSingleton(def);
  const data = await serializeDoc(def.fields, draft, lang, true);
  await applyExtras(def, data, lang, true);
  return (
    <PreviewPage
      title={def.label}
      subtitle={def.draftable ? "Menampilkan versi draft (tersimpan terakhir)" : "Menampilkan versi tersimpan"}
      lang={lang}
      basePath={`/admin/preview/s/${key}`}
      data={data}
      fields={def.fields}
    />
  );
}
