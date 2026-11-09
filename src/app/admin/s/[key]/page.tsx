import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SingletonForm } from "@/components/admin/form/singleton-form";
import { getSingleton } from "@/content/singletons";
import { loadSingleton } from "@/server/repo/singletons";
import { allowedActions, requirePageModule } from "@/server/admin-menu";

export async function generateMetadata({ params }: PageProps<"/admin/s/[key]">): Promise<Metadata> {
  const { key } = await params;
  return { title: getSingleton(key)?.label ?? "Halaman" };
}

export default async function SingletonPage({ params }: PageProps<"/admin/s/[key]">) {
  const { key } = await params;
  const user = await requirePageModule(`s:${key}`);
  const can = await allowedActions(user, `s:${key}`);
  const def = getSingleton(key);
  if (!def) notFound();
  const { row, draft, dirty } = await loadSingleton(def);
  return (
    <SingletonForm
      key={row?.updatedAt.toISOString() ?? "new"}
      slug={key}
      initialValues={draft}
      publishedAt={row?.publishedAt?.toISOString() ?? null}
      updatedAt={row?.updatedAt.toISOString() ?? null}
      hasPublished={!!row?.published}
      dirty={dirty}
      perms={{ save: can.update, publish: can.publish }}
    />
  );
}
