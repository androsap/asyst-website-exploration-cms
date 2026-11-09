"use client";

import { useId } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Area drag-and-drop untuk daftar di form. `ids` harus stabil per item;
 * `onMove(from, to)` dipanggil saat item dilepas di posisi baru.
 * DndContext bersarang (mis. array di dalam blok) aman — tiap area terisolasi.
 */
export function SortableArea({
  ids,
  onMove,
  layout = "vertical",
  children,
}: {
  ids: string[];
  onMove: (from: number, to: number) => void;
  layout?: "vertical" | "grid";
  children: React.ReactNode;
}) {
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = ids.indexOf(String(e.active.id));
    const to = ids.indexOf(String(e.over.id));
    if (from >= 0 && to >= 0) onMove(from, to);
  };
  return (
    <DndContext id={id} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

export type SortableHandle = { attributes: DraggableAttributes; listeners: DraggableSyntheticListeners };

/** Hook item: pasang `ref` & `style` di elemen terluar, `handle` ke <DragHandle>. */
export function useSortableItem(id: string) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return {
    ref: setNodeRef,
    style: { transform: CSS.Translate.toString(transform), transition } as React.CSSProperties,
    isDragging,
    handle: { attributes, listeners } satisfies SortableHandle,
  };
}

/** Ikon ⠿ untuk menyeret item. */
export function DragHandle({ handle, label, className }: { handle: SortableHandle; label: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title="Seret untuk memindahkan"
      className={cn(
        "flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-[var(--neutral400)] transition-colors hover:bg-[var(--neutral50)] hover:text-[var(--neutral700)] active:cursor-grabbing",
        className,
      )}
      {...handle.attributes}
      {...handle.listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );
}
