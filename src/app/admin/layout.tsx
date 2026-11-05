import { AdminShell } from "@/components/admin/shell";
import { buildNav } from "@/components/admin/nav";
import { blobEnabled } from "@/lib/env";
import { requirePageUser } from "@/server/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requirePageUser();
  const config = { blobEnabled: blobEnabled(), previewEnabled: Boolean(process.env.PREVIEW_URL) };
  return (
    <AdminShell user={user} groups={buildNav()} config={config}>
      {children}
    </AdminShell>
  );
}
