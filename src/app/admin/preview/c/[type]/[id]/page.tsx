import { notFound } from "next/navigation";
import { PreviewPage } from "@/components/admin/preview-page";
import { getCollection } from "@/content/collections";
import { labelOf, parseLang } from "@/lib/i18n";
import { serializeRecords } from "@/server/public/serialize";
import { getItem } from "@/server/repo/collections";
import { requirePageModule } from "@/server/admin-menu";

export default async function PreviewCollectionPage({ params, searchParams }: PageProps<"/admin/preview/c/[type]/[id]">) {
  const { type, id } = await params;
  await requirePageModule(`c:${type}`);
  const lang = parseLang((await searchParams).lang as string | undefined);
  const def = getCollection(type);
  if (!def) notFound();
  const row = await getItem(def, id);
  if (!row) notFound();
  const [data] = await serializeRecords(def, [row], lang, true);
  return (
    <PreviewPage
      title={labelOf(row[def.titleField]) || def.singular}
      subtitle={`${def.label}${def.hasStatus ? ` · status: ${row.status}` : ""}`}
      lang={lang}
      basePath={`/admin/preview/c/${type}/${id}`}
      data={data}
      fields={def.fields}
      note="Relasi yang belum terbit ikut ditampilkan dalam mode preview."
    />
  );
}
