"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavIcon } from "./icon";
import type { NavGroup } from "./nav";

export function SidebarNav({ groups, isAdmin, onNavigate }: { groups: NavGroup[]; isAdmin: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-5 px-3 py-4 text-sm">
      {groups.map((g) => {
        const items = g.items.filter((i) => !i.adminOnly || isAdmin);
        if (!items.length) return null;
        return (
          <div key={g.label || "root"}>
            {g.label && (
              <p className="mb-1.5 px-2.5 text-overline text-[var(--neutral400)]">{g.label}</p>
            )}
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-9 items-center gap-2.5 rounded-[var(--border2xs)] px-2.5 text-body-sm transition-colors",
                        "focus-visible:ring-2 focus-visible:ring-[var(--primary300)] focus-visible:outline-none",
                        active
                          ? "bg-[var(--surface-accent-subtle)] font-medium text-[var(--primary600)]"
                          : "text-[var(--neutral700)] hover:bg-[var(--neutral50)] hover:text-[var(--neutral900)]",
                      )}
                    >
                      <NavIcon
                        name={item.icon}
                        className={cn("size-4 shrink-0", active ? "text-[var(--primary500)]" : "text-[var(--neutral400)]")}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
