import { notFound } from "next/navigation";
import { EntityForm } from "@/components/admin/form/entity-form";
import { getCollection } from "@/content/collections";
import { getItem, toFormValues } from "@/server/repo/collections";
import { allowedActions, requirePageModule } from "@/server/admin-menu";

export default async function EditItemPage({ params }: PageProps<"/admin/c/[type]/[id]">) {
  const { type, id } = await params;
  const user = await requirePageModule(`c:${type}`);
  const can = await allowedActions(user, `c:${type}`);
  const def = getCollection(type);
  if (!def) notFound();
  const row = await getItem(def, id);
  if (!row) notFound();

  return (
    <EntityForm
      key={new Date(row.updatedAt).toISOString()}
      type={type}
      id={id}
      initialValues={toFormValues(def, row)}
      meta={{
        status: row.status,
        publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : null,
        createdAt: new Date(row.createdAt).toISOString(),
        updatedAt: new Date(row.updatedAt).toISOString(),
        slug: def.slugField ? row[def.slugField] : null,
      }}
      perms={{ save: can.update, publish: can.publish, delete: can.delete }}
    />
  );
}
