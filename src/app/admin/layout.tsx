import { AdminShell } from "@/components/admin/shell";
import { blobEnabled } from "@/lib/env";
import { buildNavFor } from "@/server/admin-menu";
import { requirePageUser } from "@/server/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requirePageUser();
  const config = { blobEnabled: blobEnabled(), previewEnabled: Boolean(process.env.PREVIEW_URL) };
  return (
    <AdminShell user={user} groups={await buildNavFor(user)} config={config}>
      {children}
    </AdminShell>
  );
}
