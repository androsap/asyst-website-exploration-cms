import { COLLECTIONS } from "@/content/collections";
import { SINGLETONS } from "@/content/singletons";

export type NavItem = { href: string; label: string; icon: string; adminOnly?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

const GROUP_ORDER = ["Konten", "Berita", "Karier", "Produk & Solusi", "Halaman", "Global", "Fondasi"];

export function buildNav(): NavGroup[] {
  const groups = new Map<string, NavItem[]>();
  const push = (group: string, item: NavItem) => {
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(item);
  };
  for (const c of COLLECTIONS) push(c.group, { href: `/admin/c/${c.type}`, label: c.label, icon: c.icon });
  for (const s of SINGLETONS) push(s.group, { href: `/admin/s/${s.slug}`, label: s.label, icon: s.icon });

  const content = GROUP_ORDER.filter((g) => groups.has(g)).map((g) => ({ label: g, items: groups.get(g)! }));
  return [
    { label: "", items: [{ href: "/admin", label: "Dashboard", icon: "LayoutDashboard" }] },
    ...content,
    {
      label: "Sistem",
      items: [
        { href: "/admin/media", label: "Media", icon: "Image" },
        { href: "/admin/submissions", label: "Form masuk", icon: "Inbox" },
        { href: "/admin/users", label: "Pengguna", icon: "Users", adminOnly: true },
      ],
    },
  ];
}
