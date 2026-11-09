"use client";

import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, Lock, Pencil, Plus, Save, Search, Trash2, Undo2, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ChoiceField } from "@/components/admin/form/choice-field";
import { NavIcon } from "@/components/admin/icon";
import { ACTION_HELP, ACTION_LABEL, toggleAction, type Action, type Permissions } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { createRoleAction, deleteRoleAction, saveRolePermissionsAction, updateRoleAction } from "@/server/actions/roles";

export type RoleRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSuperAdmin: boolean;
  isSystem: boolean;
  userCount: number;
  permissions: Permissions;
};
export type SectionModule = { id: string; label: string; icon: string; actions: Action[]; enabled: boolean };
export type Section = { label: string; hint?: string; modules: SectionModule[] };
type Me = { isSuperAdmin: boolean; permissions: Permissions; roleKey: string };

const sameSet = (a: Action[] = [], b: Action[] = []) => a.length === b.length && a.every((x) => b.includes(x));

// ─────────────── Sel checkbox ───────────────

function Cell({
  checked,
  indeterminate,
  changed,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  changed?: boolean;
  disabled?: boolean;
  label: string;
  onChange?: (v: boolean) => void;
}) {
  return (
    <td className="border-b border-[var(--neutral50)] px-2 py-1.5 text-center">
      <span
        className={cn(
          "inline-flex rounded-[7px] p-1 transition-shadow",
          changed && "bg-[var(--warning50)] ring-2 ring-[var(--warning400)]",
        )}
        title={changed ? "Berubah — belum disimpan" : undefined}
      >
        <Checkbox
          aria-label={label}
          checked={checked && !indeterminate}
          indeterminate={indeterminate}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="gap-0"
        />
      </span>
    </td>
  );
}

// ─────────────── Dialog role ───────────────

type RoleDraft = { id: string | null; name: string; description: string; copyFrom: string };

function RoleDialog({ draft, roles, onClose }: { draft: RoleDraft; roles: RoleRow[]; onClose: () => void }) {
  const router = useRouter();
  const [d, setD] = useState(draft);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const isNew = !d.id;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.name.trim()) return setError("Nama role wajib diisi.");
    start(async () => {
      const payload = { name: d.name, description: d.description };
      const res = isNew
        ? await createRoleAction({ ...payload, copyFrom: d.copyFrom || undefined })
        : await updateRoleAction(d.id!, payload);
      if (!res.ok) return setError(res.fieldErrors?.name ?? res.error);
      toast.success(isNew ? "Role dibuat" : "Role diperbarui");
      onClose();
      router.refresh();
    });
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? "Role baru" : "Edit role"}</DialogTitle>
          {isNew && <DialogDescription>Setelah dibuat, atur hak aksesnya di tabel.</DialogDescription>}
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="r-name">Nama role</Label>
            <Input id="r-name" value={d.name} maxLength={80} autoFocus placeholder="mis. Penulis Konten" onChange={(e) => setD({ ...d, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-desc">Deskripsi (opsional)</Label>
            <Textarea id="r-desc" rows={2} maxLength={255} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
          </div>
          {isNew && (
            <div className="space-y-1.5">
              <Label htmlFor="r-copy">Salin hak akses dari</Label>
              <ChoiceField
                id="r-copy"
                ariaLabel="Salin hak akses dari"
                value={d.copyFrom}
                onChange={(v) => setD({ ...d, copyFrom: v })}
                emptyLabel="Mulai kosong"
                options={roles.map((r) => ({ value: r.id, label: r.name }))}
              />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" color="neutral" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner size="xs" className="text-current" label="Menyimpan" />} {isNew ? "Buat role" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────── Manager ───────────────

export function RolesManager({
  roles,
  sections,
  can,
  me,
}: {
  roles: RoleRow[];
  sections: Section[];
  can: { create: boolean; update: boolean; delete: boolean };
  me: Me;
}) {
  const router = useRouter();
  const initial = useMemo(() => Object.fromEntries(roles.map((r) => [r.id, r.permissions])) as Record<string, Permissions>, [roles]);
  const [perms, setPerms] = useState(initial);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [roleDraft, setRoleDraft] = useState<RoleDraft | null>(null);
  const [pending, start] = useTransition();

  const allModules = sections.flatMap((s) => s.modules);
  const totalActions = allModules.reduce((n, m) => n + m.actions.length, 0);

  const changedCells = useMemo(() => {
    let n = 0;
    for (const r of roles) {
      if (r.isSuperAdmin) continue;
      for (const m of allModules)
        for (const a of m.actions) if ((initial[r.id][m.id]?.includes(a) ?? false) !== (perms[r.id][m.id]?.includes(a) ?? false)) n++;
    }
    return n;
  }, [roles, allModules, initial, perms]);
  const dirty = changedCells > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** Non-Super Admin hanya boleh mencentang izin yang ia miliki sendiri. */
  const mayGrant = (moduleId: string, a: Action) => me.isSuperAdmin || (me.permissions[moduleId]?.includes(a) ?? false);
  const editable = (r: RoleRow) => can.update && !r.isSuperAdmin;

  const setModule = (roleId: string, m: SectionModule, next: Action[]) =>
    setPerms((p) => {
      const rp = { ...p[roleId] };
      if (next.length) rp[m.id] = next;
      else delete rp[m.id];
      return { ...p, [roleId]: rp };
    });

  const toggleOne = (roleId: string, m: SectionModule, a: Action, on: boolean) => {
    const cur = perms[roleId][m.id] ?? [];
    let next = toggleAction(cur, a, on, m.actions);
    // "view" otomatis ikut dicentang — hanya bila boleh diberikan.
    if (on && !cur.includes("view") && !mayGrant(m.id, "view")) next = next.filter((x) => x !== "view");
    setModule(roleId, m, next);
  };

  const toggleModule = (roleId: string, m: SectionModule) => {
    const cur = perms[roleId][m.id] ?? [];
    const grantable = m.actions.filter((a) => cur.includes(a) || mayGrant(m.id, a));
    const full = grantable.every((a) => cur.includes(a));
    // Penuh → cabut semua (mencabut selalu boleh); selain itu → beri semua aksi yang boleh diberikan.
    setModule(roleId, m, full ? [] : grantable);
  };

  const toggleOpen = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const q = query.trim().toLowerCase();
  const visibleSections = sections
    .map((s) => ({ ...s, modules: q ? s.modules.filter((m) => m.label.toLowerCase().includes(q) || s.label.toLowerCase().includes(q)) : s.modules }))
    .filter((s) => s.modules.length);
  const allOpen = visibleSections.every((s) => s.modules.every((m) => open.has(m.id)));

  const save = () =>
    start(async () => {
      const changes = roles
        .filter((r) => !r.isSuperAdmin)
        .filter((r) => allModules.some((m) => !sameSet(initial[r.id][m.id], perms[r.id][m.id])))
        .map((r) => ({ roleId: r.id, permissions: perms[r.id] }));
      const res = await saveRolePermissionsAction(changes);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Hak akses disimpan", { description: `${changes.length} role diperbarui.` });
      router.refresh();
    });

  const lockedReason = dirty ? "Simpan atau batalkan perubahan hak akses dulu" : undefined;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 border-b border-[var(--neutral100)] px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-subtitle-md text-[var(--neutral900)]">Role & hak akses</h2>
          <p className="text-sm text-muted-foreground">
            {roles.length} role · {allModules.length} modul · {totalActions} izin per role
          </p>
        </div>
        {dirty ? (
          <Badge color="warning" variant="light">
            {changedCells} perubahan belum disimpan
          </Badge>
        ) : (
          <Badge color="neutral" variant="outline">
            Tersimpan
          </Badge>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--neutral100)] bg-[var(--neutral25)] px-5 py-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--neutral400)]" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari modul…" aria-label="Cari modul" className="h-9 pl-9" />
        </div>
        <Button
          color="neutral"
          variant="tertiary"
          size="sm"
          onClick={() => setOpen(allOpen ? new Set() : new Set(visibleSections.flatMap((s) => s.modules.map((m) => m.id))))}
        >
          {allOpen ? <ChevronsDownUp /> : <ChevronsUpDown />} {allOpen ? "Tutup semua aksi" : "Buka semua aksi"}
        </Button>
        <div className="flex-1" />
        {can.create && (
          <Button
            color="neutral"
            variant="secondary"
            size="sm"
            disabled={dirty}
            title={lockedReason}
            onClick={() => setRoleDraft({ id: null, name: "", description: "", copyFrom: "" })}
          >
            <Plus /> Tambah role
          </Button>
        )}
        {can.update && (
          <>
            <Button color="neutral" variant="secondary" size="sm" disabled={!dirty || pending} onClick={() => setPerms(initial)}>
              <Undo2 /> Batalkan
            </Button>
            <Button size="sm" disabled={!dirty || pending} onClick={save}>
              {pending ? <Spinner size="xs" className="text-current" label="Menyimpan" /> : <Save />} Simpan hak akses
            </Button>
          </>
        )}
      </div>

      <p className="border-b border-[var(--neutral100)] px-5 py-2 text-xs text-muted-foreground">
        Centang di baris modul memberi semua aksi sekaligus (− berarti sebagian). Klik <ChevronRight className="inline size-3.5" aria-hidden /> untuk
        mengatur per aksi. Mencentang aksi apa pun otomatis menyertakan <b>Lihat</b>.
        {!me.isSuperAdmin && " Anda hanya bisa memberikan izin yang Anda miliki sendiri."}
      </p>

      {/* Matrix */}
      <div className="max-h-[max(400px,calc(100vh-15rem))] min-h-[400px] overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="bg-[var(--primary50)]">
              <th className="sticky left-0 z-10 min-w-64 border-b border-[var(--neutral100)] bg-[var(--primary50)] px-5 py-3 text-left font-medium text-[var(--neutral700)]">
                <span className="inline-flex items-center gap-2">
                  Modul
                  {dirty && (
                    <span
                      className="inline-flex size-6 items-center justify-center rounded-full bg-[var(--warning500)] text-xs font-semibold text-white ring-2 ring-[var(--warning100)]"
                      title={`${changedCells} sel berubah`}
                    >
                      {changedCells}
                    </span>
                  )}
                </span>
              </th>
              {roles.map((r) => (
                <th key={r.id} className="min-w-32 border-b border-[var(--neutral100)] px-2 py-2.5 text-center align-top font-medium text-[var(--neutral700)]">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="inline-flex items-center gap-1" title={r.description ?? undefined}>
                      {r.isSuperAdmin && <Lock className="size-3.5 text-[var(--primary500)]" aria-label="Akses penuh" />}
                      {r.name}
                      {r.key === me.roleKey && <span className="text-[10px] font-normal text-muted-foreground">(Anda)</span>}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                      <Users className="size-3" aria-hidden /> {r.userCount}
                    </span>
                    {(can.update || (can.delete && !r.isSystem)) && (
                      <span className="mt-0.5 flex items-center gap-0.5">
                        {can.update && (
                          <Button
                            size="icon-xs"
                            color="neutral"
                            variant="tertiary"
                            aria-label={`Edit role ${r.name}`}
                            disabled={dirty}
                            title={lockedReason ?? "Edit nama & deskripsi"}
                            onClick={() => setRoleDraft({ id: r.id, name: r.name, description: r.description ?? "", copyFrom: "" })}
                          >
                            <Pencil />
                          </Button>
                        )}
                        {can.delete && !r.isSystem && (
                          <ConfirmButton
                            size="icon-xs"
                            color="danger"
                            variant="tertiary"
                            aria-label={`Hapus role ${r.name}`}
                            disabled={dirty}
                            title={`Hapus role "${r.name}"?`}
                            description={
                              r.userCount
                                ? `Role ini masih dipakai ${r.userCount} pengguna — pindahkan mereka ke role lain dulu di halaman Pengguna.`
                                : "Role dan seluruh pengaturan hak aksesnya akan dihapus permanen."
                            }
                            confirmLabel="Hapus role"
                            onConfirm={async () => {
                              const res = await deleteRoleAction(r.id);
                              if (!res.ok) return void toast.error(res.error);
                              toast.success("Role dihapus");
                              router.refresh();
                            }}
                          >
                            <Trash2 />
                          </ConfirmButton>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleSections.length === 0 && (
              <tr>
                <td colSpan={roles.length + 1} className="px-5 py-10 text-center text-muted-foreground">
                  Tidak ada modul yang cocok dengan “{query}”.
                </td>
              </tr>
            )}
            {visibleSections.map((s) => (
              <Fragment key={s.label}>
                <tr>
                  <td
                    colSpan={roles.length + 1}
                    className="border-b border-[var(--neutral100)] bg-[var(--neutral25)] px-5 py-2 text-xs font-medium text-[var(--neutral500)]"
                  >
                    <span className="sticky left-5">
                      {s.label}
                      {s.hint && <span className="ml-2 font-normal text-[var(--neutral400)]">— {s.hint}</span>}
                    </span>
                  </td>
                </tr>
                {s.modules.map((m) => {
                  const isOpen = open.has(m.id);
                  return (
                    <Fragment key={m.id}>
                      <tr className="group hover:bg-[var(--neutral25)]">
                        <td className="sticky left-0 z-10 border-b border-[var(--neutral50)] bg-[var(--neutral0)] px-3 py-1.5 group-hover:bg-[var(--neutral25)]">
                          <button
                            type="button"
                            onClick={() => toggleOpen(m.id)}
                            aria-expanded={isOpen}
                            className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-[var(--neutral50)]"
                          >
                            <ChevronRight className={cn("size-4 shrink-0 text-[var(--neutral400)] transition-transform", isOpen && "rotate-90")} />
                            <NavIcon name={m.icon} className="size-4 shrink-0 text-[var(--neutral500)]" />
                            <span className="truncate text-[var(--neutral800)]">{m.label}</span>
                            {!m.enabled && (
                              <Badge size="sm" variant="light" color="neutral">
                                Nonaktif
                              </Badge>
                            )}
                            <span className="ml-auto pl-2 text-xs text-[var(--neutral400)]">{m.actions.length} aksi</span>
                          </button>
                        </td>
                        {roles.map((r) => {
                          if (r.isSuperAdmin) return <Cell key={r.id} checked disabled label={`${r.name}: ${m.label} (akses penuh)`} />;
                          const cur = perms[r.id][m.id] ?? [];
                          const all = m.actions.every((a) => cur.includes(a));
                          const changed = !sameSet(initial[r.id][m.id], cur);
                          const anyGrantable = m.actions.some((a) => cur.includes(a) || mayGrant(m.id, a));
                          return (
                            <Cell
                              key={r.id}
                              checked={cur.length > 0}
                              indeterminate={cur.length > 0 && !all}
                              changed={changed && !isOpen}
                              disabled={!editable(r) || !anyGrantable}
                              label={`${r.name}: semua aksi ${m.label}`}
                              onChange={() => toggleModule(r.id, m)}
                            />
                          );
                        })}
                      </tr>
                      {isOpen &&
                        m.actions.map((a) => (
                          <tr key={a} className="bg-[var(--neutral25)]/60 hover:bg-[var(--neutral25)]">
                            <td className="sticky left-0 z-10 border-b border-[var(--neutral50)] bg-[var(--neutral25)] py-1 pr-3 pl-16" title={ACTION_HELP[a]}>
                              <span className="text-[var(--neutral700)]">{ACTION_LABEL[a]}</span>
                              <span className="ml-2 hidden text-xs text-[var(--neutral400)] xl:inline">{ACTION_HELP[a]}</span>
                            </td>
                            {roles.map((r) => {
                              if (r.isSuperAdmin) return <Cell key={r.id} checked disabled label={`${r.name}: ${ACTION_LABEL[a]} ${m.label}`} />;
                              const on = perms[r.id][m.id]?.includes(a) ?? false;
                              const was = initial[r.id][m.id]?.includes(a) ?? false;
                              return (
                                <Cell
                                  key={r.id}
                                  checked={on}
                                  changed={on !== was}
                                  disabled={!editable(r) || (!on && !mayGrant(m.id, a))}
                                  label={`${r.name}: ${ACTION_LABEL[a]} ${m.label}`}
                                  onChange={(v) => toggleOne(r.id, m, a, v)}
                                />
                              );
                            })}
                          </tr>
                        ))}
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {roleDraft && <RoleDialog key={roleDraft.id ?? "new"} draft={roleDraft} roles={roles} onClose={() => setRoleDraft(null)} />}
    </Card>
  );
}
