"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  pointerWithin,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FolderPlus, GripVertical, Link2, Pencil, Plus, RotateCcw, Save, Trash2, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { StickyBar } from "@/components/admin/sticky-bar";
import { nativeSelectClass } from "@/components/admin/form/field-shell";
import { ChoiceField } from "@/components/admin/form/choice-field";
import { NAV_ICON_NAMES, NavIcon } from "@/components/admin/icon";
import { newId, type AdminModule, type MenuConfig, type MenuGroup, type MenuItem } from "@/lib/admin-menu";
import { cn } from "@/lib/utils";
import { resetMenuAction, saveMenuAction } from "@/server/actions/menu";

const KIND_LABEL: Record<AdminModule["kind"] | "link", string> = {
  collection: "Koleksi",
  singleton: "Halaman",
  system: "Sistem",
  link: "Link",
};

type ModuleMap = Map<string, AdminModule>;

const itemLabel = (item: MenuItem, modules: ModuleMap) =>
  item.kind === "link" ? item.label : item.label || modules.get(item.module)?.label || item.module;
const itemIcon = (item: MenuItem, modules: ModuleMap) =>
  item.icon || (item.kind === "module" ? modules.get(item.module)?.icon : undefined) || "Link";

// ─────────────── Drag & drop ───────────────
// id: "G:<groupId>" (grup), "I:<itemId>" (item), "D:<groupId>" (area drop daftar item dalam grup)

const collision: CollisionDetection = (args) => {
  const draggingGroup = String(args.active.id).startsWith("G:");
  if (draggingGroup) {
    return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => String(c.id).startsWith("G:")) });
  }
  const targets = args.droppableContainers.filter((c) => !String(c.id).startsWith("G:"));
  const within = pointerWithin({ ...args, droppableContainers: targets });
  const overItem = within.find((c) => String(c.id).startsWith("I:"));
  if (overItem) return [overItem];
  if (within.length) return within;
  return closestCenter({ ...args, droppableContainers: targets.filter((c) => String(c.id).startsWith("I:")) });
};

function ItemRow({
  item,
  modules,
  onToggle,
  onEdit,
  onRemove,
}: {
  item: MenuItem;
  modules: ModuleMap;
  onToggle: (v: boolean) => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `I:${item.id}` });
  const mod = item.kind === "module" ? modules.get(item.module) : undefined;
  const label = itemLabel(item, modules);
  const renamed = item.kind === "module" && !!item.label && item.label !== mod?.label;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2.5 rounded-[var(--border2xs)] border border-transparent bg-card px-2 py-1.5 hover:border-[var(--neutral100)]",
        isDragging && "relative z-20 border-[var(--neutral200)] shadow-lg",
        !item.enabled && "opacity-60",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label={`Geser ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <NavIcon name={itemIcon(item, modules)} className="size-4 shrink-0 text-[var(--neutral500)]" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-[var(--neutral900)]">{label}</div>
        {(renamed || item.kind === "link") && (
          <div className="truncate text-xs text-muted-foreground">{item.kind === "link" ? item.href : `Asli: ${mod?.label}`}</div>
        )}
      </div>
      <div className="hidden shrink-0 items-center gap-1 sm:flex">
        <Badge size="sm" variant="light" color={item.kind === "link" ? "info" : "neutral"}>
          {KIND_LABEL[item.kind === "link" ? "link" : (mod?.kind ?? "system")]}
        </Badge>
        {item.kind === "link" && item.access === "admin" && (
          <Badge size="sm" variant="light" color="warning">
            Super Admin
          </Badge>
        )}
      </div>
      <Switch checked={item.enabled} onCheckedChange={onToggle} aria-label={item.enabled ? `Nonaktifkan ${label}` : `Aktifkan ${label}`} />
      <Button size="icon-sm" color="neutral" variant="tertiary" aria-label={`Edit ${label}`} onClick={onEdit}>
        <Pencil />
      </Button>
      <ConfirmButton
        size="icon-sm"
        color="danger"
        variant="tertiary"
        aria-label={item.kind === "link" ? `Hapus ${label}` : `Keluarkan ${label} dari menu`}
        title={item.kind === "link" ? `Hapus link "${label}"?` : `Keluarkan "${label}" dari menu?`}
        description={
          item.kind === "link"
            ? "Link custom ini akan dihapus. Perubahan baru berlaku setelah Simpan menu."
            : "Modul akan pindah ke panel \"Modul belum di menu\" dan bisa ditambahkan lagi. Setelah disimpan, hanya Super Admin yang bisa membuka modul ini."
        }
        confirmLabel={item.kind === "link" ? "Hapus" : "Keluarkan"}
        onConfirm={onRemove}
      >
        {item.kind === "link" ? <Trash2 /> : <X />}
      </ConfirmButton>
    </li>
  );
}

function GroupCard({
  group,
  onRename,
  onDelete,
  children,
}: {
  group: MenuGroup;
  onRename: (label: string) => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `G:${group.id}` });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `D:${group.id}` });
  const moduleCount = group.items.filter((i) => i.kind === "module").length;
  const linkCount = group.items.length - moduleCount;
  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("gap-0 py-0", isDragging && "relative z-10 shadow-xl")}
    >
      <div className="flex items-center gap-2 border-b border-[var(--neutral100)] px-3 py-2.5">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          aria-label={`Geser grup ${group.label || "tanpa judul"}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <Input
          value={group.label}
          onChange={(e) => onRename(e.target.value)}
          placeholder="(tanpa judul grup)"
          aria-label="Judul grup"
          maxLength={60}
          className="h-8 max-w-72 font-medium"
        />
        <span className="flex-1 text-xs text-muted-foreground">{group.items.length} item</span>
        <ConfirmButton
          size="icon-sm"
          color="danger"
          variant="tertiary"
          aria-label={`Hapus grup ${group.label}`}
          title={`Hapus grup "${group.label || "tanpa judul"}"?`}
          description={
            group.items.length
              ? `${moduleCount} modul akan dikeluarkan dari menu (bisa ditambahkan lagi)${linkCount ? ` dan ${linkCount} link custom ikut terhapus` : ""}. Perubahan baru berlaku setelah Simpan.`
              : "Grup kosong ini akan dihapus. Perubahan baru berlaku setelah Simpan."
          }
          confirmLabel="Hapus grup"
          onConfirm={onDelete}
        >
          <Trash2 />
        </ConfirmButton>
      </div>
      <SortableContext items={group.items.map((i) => `I:${i.id}`)} strategy={verticalListSortingStrategy}>
        <ul ref={setDropRef} className={cn("min-h-12 space-y-0.5 p-2 transition-colors", isOver && "bg-[var(--surface-accent-subtle)]")}>
          {children}
          {group.items.length === 0 && (
            <li className="py-3 text-center text-xs text-muted-foreground">Grup kosong — seret item ke sini atau tambahkan dari panel kanan.</li>
          )}
        </ul>
      </SortableContext>
    </Card>
  );
}

// ─────────────── Dialog edit item ───────────────

type Draft = { groupId: string; item: MenuItem };

function ItemDialog({
  draft,
  groups,
  modules,
  onClose,
  onSave,
}: {
  draft: Draft;
  groups: MenuGroup[];
  modules: ModuleMap;
  onClose: () => void;
  onSave: (d: Draft) => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const [error, setError] = useState<string | null>(null);
  const item = d.item;
  const mod = item.kind === "module" ? modules.get(item.module) : undefined;
  const set = (patch: Partial<MenuItem>) => setD({ ...d, item: { ...item, ...patch } as MenuItem });
  const isNew = item.kind === "link" && !groups.some((g) => g.items.some((i) => i.id === item.id));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item.kind === "link") {
      if (!item.label.trim()) return setError("Label wajib diisi.");
      if (!/^\/(?!\/)/.test(item.href.trim()) && !/^https?:\/\//i.test(item.href.trim()))
        return setError("Link harus diawali / (halaman admin) atau http(s):// (situs luar).");
      onSave({ ...d, item: { ...item, label: item.label.trim(), href: item.href.trim() } });
    } else {
      onSave({ ...d, item: { ...item, label: item.label?.trim() || undefined } });
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Link baru" : `Edit item${mod ? ` · ${mod.label}` : ""}`}</DialogTitle>
          {mod && <DialogDescription>Modul {KIND_LABEL[mod.kind].toLowerCase()} → {mod.href}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mi-label">Label</Label>
            <Input
              id="mi-label"
              value={item.label ?? ""}
              placeholder={mod?.label}
              maxLength={80}
              onChange={(e) => set({ label: e.target.value })}
              autoFocus
            />
            {mod && <p className="text-xs text-muted-foreground">Kosongkan untuk memakai label bawaan.</p>}
          </div>

          {item.kind === "link" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="mi-href">URL</Label>
                <Input
                  id="mi-href"
                  value={item.href}
                  placeholder="/admin/c/news?status=DRAFT atau https://…"
                  maxLength={1024}
                  onChange={(e) => set({ href: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-3 text-sm">
                <Switch checked={item.newTab} onCheckedChange={(v) => set({ newTab: v })} />
                Buka di tab baru
              </label>
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mi-group">Grup</Label>
              <ChoiceField
                id="mi-group"
                ariaLabel="Grup"
                value={d.groupId}
                onChange={(v) => setD({ ...d, groupId: v })}
                options={groups.map((g) => ({ value: g.id, label: g.label || "(tanpa judul)" }))}
              />
            </div>
            {item.kind === "link" ? (
              <div className="space-y-1.5">
                <Label htmlFor="mi-access">Tampil untuk</Label>
                <ChoiceField
                  id="mi-access"
                  ariaLabel="Tampil untuk"
                  value={item.access}
                  onChange={(v) => set({ access: v as "all" | "admin" })}
                  options={[
                    { value: "all", label: "Semua pengguna" },
                    { value: "admin", label: "Khusus Super Admin" },
                  ]}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Akses</Label>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Siapa yang bisa melihat & mengubah modul ini diatur per role di{" "}
                  <a href="/admin/roles" target="_blank" rel="noopener" className="text-primary hover:underline">
                    Manajemen Role
                  </a>
                  .
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Ikon</Label>
            <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto rounded-[var(--border2xs)] border border-[var(--neutral100)] p-2">
              {mod && (
                <button
                  type="button"
                  onClick={() => set({ icon: undefined })}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded px-2 text-xs hover:bg-[var(--neutral50)]",
                    !item.icon && "bg-[var(--surface-accent-subtle)] text-[var(--primary600)] ring-1 ring-[var(--primary300)]",
                  )}
                >
                  <NavIcon name={mod.icon} className="size-4" /> Bawaan
                </button>
              )}
              {NAV_ICON_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  aria-label={`Ikon ${name}`}
                  aria-pressed={item.icon === name}
                  onClick={() => set({ icon: name })}
                  className={cn(
                    "flex size-8 items-center justify-center rounded text-[var(--neutral600)] hover:bg-[var(--neutral50)]",
                    item.icon === name && "bg-[var(--surface-accent-subtle)] text-[var(--primary600)] ring-1 ring-[var(--primary300)]",
                  )}
                >
                  <NavIcon name={name} className="size-4" />
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm">
            <Switch checked={item.enabled} onCheckedChange={(v) => set({ enabled: v })} />
            Aktif (tampil di sidebar)
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" color="neutral" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">{isNew ? "Tambah" : "Terapkan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────── Manager ───────────────

export function MenuManager({
  initial,
  modules: moduleList,
  isDefault,
  canEdit,
}: {
  initial: MenuConfig;
  modules: AdminModule[];
  isDefault: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [config, setConfig] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, start] = useTransition();
  const dndId = useId();
  const modules = useMemo(() => new Map(moduleList.map((m) => [m.id, m])), [moduleList]);
  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(initial), [config, initial]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const placed = new Set(config.groups.flatMap((g) => g.items.flatMap((i) => (i.kind === "module" ? [i.module] : []))));
  const unplaced = moduleList.filter((m) => !placed.has(m.id));

  const setGroups = (fn: (groups: MenuGroup[]) => MenuGroup[]) => setConfig((c) => ({ ...c, groups: fn(c.groups) }));
  const patchItem = (itemId: string, patch: Partial<MenuItem>) =>
    setGroups((gs) => gs.map((g) => ({ ...g, items: g.items.map((i) => (i.id === itemId ? ({ ...i, ...patch } as MenuItem) : i)) })));

  const removeItem = (item: MenuItem) =>
    setConfig((c) => ({
      ...c,
      groups: c.groups.map((g) => ({ ...g, items: g.items.filter((i) => i.id !== item.id) })),
      removed: item.kind === "module" ? [...c.removed.filter((r) => r !== item.module), item.module] : c.removed,
    }));

  const addModule = (m: AdminModule, groupId: string) =>
    setConfig((c) => ({
      ...c,
      groups: c.groups.map((g) =>
        g.id === groupId
          ? { ...g, items: [...g.items, { id: newId("i"), kind: "module", module: m.id, enabled: true }] }
          : g,
      ),
      removed: c.removed.filter((r) => r !== m.id),
    }));

  const addGroup = () => setGroups((gs) => [...gs, { id: newId("g"), label: "Grup baru", items: [] }]);

  const deleteGroup = (group: MenuGroup) =>
    setConfig((c) => ({
      ...c,
      groups: c.groups.filter((g) => g.id !== group.id),
      removed: [
        ...c.removed,
        ...group.items.flatMap((i) => (i.kind === "module" && !c.removed.includes(i.module) ? [i.module] : [])),
      ],
    }));

  const applyDraft = ({ groupId, item }: Draft) => {
    setGroups((gs) => {
      const from = gs.find((g) => g.items.some((i) => i.id === item.id));
      if (from && from.id === groupId) return gs.map((g) => (g.id === groupId ? { ...g, items: g.items.map((i) => (i.id === item.id ? item : i)) } : g));
      return gs.map((g) => {
        if (g.id === from?.id) return { ...g, items: g.items.filter((i) => i.id !== item.id) };
        if (g.id === groupId) return { ...g, items: [...g.items, item] };
        return g;
      });
    });
    setDraft(null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const a = String(active.id);
    const o = String(over.id);
    const groupOf = (itemId: string) => config.groups.find((g) => g.items.some((i) => i.id === itemId));

    if (a.startsWith("G:")) {
      const from = config.groups.findIndex((g) => `G:${g.id}` === a);
      const to = config.groups.findIndex((g) => `G:${g.id}` === o);
      if (from >= 0 && to >= 0) setGroups((gs) => arrayMove(gs, from, to));
      return;
    }

    const itemId = a.slice(2);
    const src = groupOf(itemId);
    if (!src) return;
    const dst = o.startsWith("I:") ? groupOf(o.slice(2)) : config.groups.find((g) => g.id === o.slice(2));
    if (!dst) return;
    const dstIndex = o.startsWith("I:") ? dst.items.findIndex((i) => i.id === o.slice(2)) : dst.items.length;

    setGroups((gs) => {
      if (src.id === dst.id) {
        const from = src.items.findIndex((i) => i.id === itemId);
        return gs.map((g) => (g.id === src.id ? { ...g, items: arrayMove(g.items, from, dstIndex === -1 ? g.items.length - 1 : dstIndex) } : g));
      }
      const moving = src.items.find((i) => i.id === itemId)!;
      return gs.map((g) => {
        if (g.id === src.id) return { ...g, items: g.items.filter((i) => i.id !== itemId) };
        if (g.id === dst.id) {
          const items = [...g.items];
          items.splice(dstIndex === -1 ? items.length : dstIndex, 0, moving);
          return { ...g, items };
        }
        return g;
      });
    });
  };

  const save = () =>
    start(async () => {
      const emptyLabel = config.groups.filter((g, i) => !g.label.trim() && i > 0).length;
      const res = await saveMenuAction(config);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Menu disimpan", emptyLabel ? { description: `${emptyLabel} grup tanpa judul akan tampil tanpa header.` } : undefined);
      router.refresh();
    });

  const reset = async () => {
    const res = await resetMenuAction();
    if (!res.ok) return void toast.error(res.error);
    toast.success("Menu dikembalikan ke bawaan");
    router.refresh();
  };

  const firstGroupId = config.groups[0]?.id;

  return (
    <div className="space-y-4">
      <StickyBar className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--neutral100)] bg-[var(--neutral0)] px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            {dirty ? (
              <span className="font-medium text-[var(--warning700)]">Ada perubahan yang belum disimpan</span>
            ) : (
              <span className="font-medium text-[var(--neutral900)]">{isDefault ? "Memakai susunan bawaan" : "Semua perubahan tersimpan"}</span>
            )}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            Seret ikon <GripVertical className="inline size-3.5" aria-hidden /> untuk memindahkan urutan grup atau item. Item juga bisa
            diseret ke grup lain.
          </p>
        </div>
        {canEdit && !isDefault && (
          <ConfirmButton
            color="neutral"
            variant="tertiary"
            title="Kembalikan menu ke bawaan?"
            description="Semua pengaturan grup, label, ikon, akses, dan link custom akan dihapus dan diganti susunan bawaan."
            confirmLabel="Reset"
            onConfirm={reset}
          >
            <RotateCcw /> Reset ke bawaan
          </ConfirmButton>
        )}
        <Button color="neutral" variant="secondary" disabled={!dirty || pending} onClick={() => setConfig(initial)}>
          <Undo2 /> Batalkan
        </Button>
        <Button onClick={save} disabled={!canEdit || !dirty || pending} title={canEdit ? undefined : "Role Anda hanya bisa melihat menu"}>
          {pending ? <Spinner size="xs" className="text-current" label="Menyimpan" /> : <Save />} Simpan menu
        </Button>
      </StickyBar>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <DndContext id={dndId} sensors={sensors} collisionDetection={collision} onDragEnd={onDragEnd}>
            <SortableContext items={config.groups.map((g) => `G:${g.id}`)} strategy={verticalListSortingStrategy}>
              {config.groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onRename={(label) => setGroups((gs) => gs.map((g) => (g.id === group.id ? { ...g, label } : g)))}
                  onDelete={() => deleteGroup(group)}
                >
                  {group.items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      modules={modules}
                      onToggle={(enabled) => patchItem(item.id, { enabled })}
                      onEdit={() => setDraft({ groupId: group.id, item })}
                      onRemove={() => removeItem(item)}
                    />
                  ))}
                </GroupCard>
              ))}
            </SortableContext>
          </DndContext>
          <Button color="neutral" variant="secondary" className="w-full border-dashed" onClick={addGroup}>
            <FolderPlus /> Tambah grup
          </Button>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-40">
          <Card className="gap-0 py-0">
            <div className="border-b border-[var(--neutral100)] px-4 py-3">
              <h2 className="text-subtitle-sm text-[var(--neutral900)]">Modul belum di menu</h2>
              <p className="text-xs text-muted-foreground">Modul yang dikeluarkan. Pilih grup untuk menambahkannya kembali.</p>
            </div>
            <ul className="max-h-96 divide-y divide-[var(--neutral100)] overflow-y-auto">
              {unplaced.length === 0 && <li className="px-4 py-6 text-center text-xs text-muted-foreground">Semua modul sudah ada di menu.</li>}
              {unplaced.map((m) => (
                <li key={m.id} className="flex items-center gap-2 px-4 py-2">
                  <NavIcon name={m.icon} className="size-4 shrink-0 text-[var(--neutral400)]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{m.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {KIND_LABEL[m.kind]}
                      {m.defaultGroup && ` · ${m.defaultGroup}`}
                    </div>
                  </div>
                  <select
                    aria-label={`Tambahkan ${m.label} ke grup`}
                    className={cn(nativeSelectClass, "h-8 w-32 shrink-0 text-xs")}
                    value=""
                    disabled={!config.groups.length}
                    onChange={(e) => e.target.value && addModule(m, e.target.value)}
                  >
                    <option value="">+ Tambah ke…</option>
                    {config.groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label || "(tanpa judul)"}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="gap-3 px-4 py-4">
            <div>
              <h2 className="text-subtitle-sm text-[var(--neutral900)]">Link custom</h2>
              <p className="text-xs text-muted-foreground">
                Pintasan ke halaman admin dengan filter tertentu (mis. berita draft) atau situs luar.
              </p>
            </div>
            <Button
              color="neutral"
              variant="secondary"
              disabled={!firstGroupId}
              onClick={() =>
                firstGroupId &&
                setDraft({
                  groupId: firstGroupId,
                  item: { id: newId("l"), kind: "link", label: "", icon: "Link", href: "", newTab: false, enabled: true, access: "all" },
                })
              }
            >
              <Link2 /> Tambah link
            </Button>
          </Card>

          <p className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
            <Plus className="mt-0.5 size-3.5 shrink-0" />
            Modul baru yang ditambahkan developer di kode otomatis muncul di grup bawaannya.
          </p>
        </aside>
      </div>

      {draft && <ItemDialog key={draft.item.id} draft={draft} groups={config.groups} modules={modules} onClose={() => setDraft(null)} onSave={applyDraft} />}
    </div>
  );
}
