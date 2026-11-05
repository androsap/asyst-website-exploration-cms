"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Save } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { reorderAction } from "@/server/actions/content";

export type SortableRow = { id: string; label: string; hint?: string; thumb?: string | null };

function Row({ row, index }: { row: SortableRow; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-3 border-b bg-card px-3 py-2 last:border-b-0", isDragging && "relative z-10 shadow-lg")}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label={`Geser ${row.label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="w-6 text-xs text-muted-foreground">{index + 1}</span>
      {row.thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.thumb} alt="" className="h-8 w-12 rounded bg-muted object-contain" />
      )}
      <span className="flex-1 truncate text-sm">{row.label}</span>
      {row.hint && <span className="text-xs text-muted-foreground">{row.hint}</span>}
    </li>
  );
}

export function SortableList({ type, rows: initial }: { type: string; rows: SortableRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setRows((r) => {
      const from = r.findIndex((x) => x.id === e.active.id);
      const to = r.findIndex((x) => x.id === e.over!.id);
      return arrayMove(r, from, to);
    });
    setDirty(true);
  };

  const save = () =>
    start(async () => {
      const res = await reorderAction(
        type,
        rows.map((r) => r.id),
      );
      if (!res.ok) return void toast.error(res.error);
      toast.success("Urutan disimpan");
      setDirty(false);
      router.refresh();
    });

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <ul className="overflow-hidden rounded-lg border">
            {rows.map((row, i) => (
              <Row key={row.id} row={row} index={i} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <Button onClick={save} disabled={!dirty || pending}>
        {pending ? <Spinner size="xs" className="text-current" label="Memproses" /> : <Save />} Simpan urutan
      </Button>
    </div>
  );
}
