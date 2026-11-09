"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavIcon } from "./icon";
import type { NavGroup } from "./nav";

// Grup & item sudah difilter per role di server (resolveNav).
export function SidebarNav({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-5 px-3 py-4 text-sm">
      {groups.map((g, gi) => (
        <div key={`${gi}-${g.label}`}>
          {g.label && <p className="mb-1.5 px-2.5 text-overline text-[var(--neutral400)]">{g.label}</p>}
          <ul className="space-y-0.5">
            {g.items.map((item, ii) => {
              const active =
                !item.external &&
                (item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(`${item.href.replace(/[?#].*$/, "")}/`));
              return (
                <li key={`${ii}-${item.href}`}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    target={item.newTab ? "_blank" : undefined}
                    rel={item.newTab ? "noopener noreferrer" : undefined}
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
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.external && <ExternalLink className="size-3.5 shrink-0 text-[var(--neutral300)]" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
