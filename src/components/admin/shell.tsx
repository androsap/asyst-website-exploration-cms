"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { logoutAction } from "@/server/actions/auth";
import type { SessionUser } from "@/server/session";
import { ChangePasswordDialog } from "./change-password-dialog";
import { AdminConfigProvider, type AdminConfig } from "./form/context";
import { SidebarNav } from "./sidebar";
import type { NavGroup } from "./nav";

function Brand() {
  return (
    <Link href="/admin" className="flex h-16 items-center gap-2.5 border-b border-[var(--neutral100)] px-5">
      <span className="flex size-8 items-center justify-center rounded-[var(--border2xs)] bg-[var(--primary500)] font-display text-sm font-bold text-white">
        A
      </span>
      <span className="leading-tight">
        <span className="block text-subtitle-md text-[var(--neutral900)]">ASYST CMS</span>
        <span className="block text-caption-sm text-[var(--neutral400)]">Atlas Design System</span>
      </span>
    </Link>
  );
}

export function AdminShell({
  user,
  groups,
  config,
  children,
}: {
  user: SessionUser;
  groups: NavGroup[];
  config: AdminConfig;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const isAdmin = user.role === "ADMIN";

  return (
    <AdminConfigProvider value={config}>
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--neutral100)] bg-sidebar lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <SidebarNav groups={groups} isAdmin={isAdmin} />
        </div>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigasi</SheetTitle>
          <Brand />
          <SidebarNav groups={groups} isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--neutral100)] bg-[var(--neutral0)]/95 px-4 backdrop-blur md:px-8">
          <Button color="neutral" variant="tertiary" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu">
            <Menu />
          </Button>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button color="neutral" variant="tertiary" className="gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-[var(--primary50)] text-label-sm text-[var(--primary700)]">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden text-label-md sm:inline">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="tracking-normal normal-case">
                <div className="text-subtitle-sm text-[var(--neutral900)]">{user.name}</div>
                <div className="text-caption-md font-normal text-[var(--neutral500)]">
                  {user.email} · {user.role}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setPwOpen(true)}>
                <KeyRound /> Ganti password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => void logoutAction()}>
                <LogOut /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
    </div>
    </AdminConfigProvider>
  );
}
