import { notFound } from "next/navigation";
import { EntityForm } from "@/components/admin/form/entity-form";
import { getCollection } from "@/content/collections";
import { defaultsFor } from "@/content/fields";
import { requirePageUser } from "@/server/session";

export default async function NewItemPage({ params, searchParams }: PageProps<"/admin/c/[type]/new">) {
  await requirePageUser();
  const { type } = await params;
  const def = getCollection(type);
  if (!def) notFound();
  const sp = await searchParams;
  const initial = defaultsFor(def.fields);
  // Prefill scope dari filter list (mis. vocabulary untuk Taksonomi).
  if (def.reorderScope && typeof sp[def.reorderScope] === "string") initial[def.reorderScope] = sp[def.reorderScope];
  return <EntityForm type={type} id={null} initialValues={initial} meta={{ status: "DRAFT" }} />;
}
