import { notFound } from "next/navigation";
import { PreviewPage } from "@/components/admin/preview-page";
import { getCollection } from "@/content/collections";
import { labelOf, parseLang } from "@/lib/i18n";
import { serializeRecords } from "@/server/public/serialize";
import { getItem } from "@/server/repo/collections";
import { requirePageUser } from "@/server/session";

export default async function PreviewCollectionPage({ params, searchParams }: PageProps<"/admin/preview/c/[type]/[id]">) {
  await requirePageUser();
  const { type, id } = await params;
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
