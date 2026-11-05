"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { FileText, Search, Trash2, Upload } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatBytes, isImage } from "@/lib/media";
import { deleteMediaAction, listMediaAction, updateMediaAction, type MediaItem } from "@/server/actions/media";
import { useAdminConfig } from "../form/context";
import { ConfirmButton } from "../confirm-button";
import { putMedia } from "./use-media";
import { uploadMediaFile } from "./upload";

export function MediaThumb({ item, className }: { item?: MediaItem; className?: string }) {
  if (!item) return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
  if (isImage(item.mimeType))
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.url} alt={item.alt.id || item.alt.en || item.filename} className={cn("rounded-md bg-muted object-contain", className)} />;
  return (
    <div className={cn("flex flex-col items-center justify-center gap-1 rounded-md bg-muted text-xs text-muted-foreground", className)}>
      <FileText className="size-6" />
      <span className="max-w-full truncate px-1">{item.filename}</span>
    </div>
  );
}

export function MediaBrowser({
  imagesOnly,
  onSelect,
  selectLabel = "Pilih",
}: {
  imagesOnly?: boolean;
  onSelect?: (item: MediaItem) => void;
  selectLabel?: string;
}) {
  const { blobEnabled } = useAdminConfig();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: MediaItem[]; totalPages: number; total: number } | null>(null);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await listMediaAction({ q, page, imagesOnly });
    if (res.ok) {
      res.data.items.forEach(putMedia);
      setData(res.data);
    } else toast.error(res.error);
  }, [q, page, imagesOnly]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading((n) => n + list.length);
    let last: MediaItem | null = null;
    for (const file of list) {
      try {
        last = await uploadMediaFile(file, blobEnabled);
        putMedia(last);
        toast.success(`${file.name} terunggah`);
      } catch (e) {
        toast.error(`${file.name}: ${(e as Error).message}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    setPage(1);
    await load();
    if (last) setSelected(last);
  };

  return (
    <div
      className="grid gap-4 md:grid-cols-[1fr_280px]"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        void handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="min-w-0 space-y-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--neutral400)]" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama file…"
            className="pl-9"
          />
        </div>
        {/* Dropzone bergaya Atlas Uploader */}
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-[var(--borderSm)] border px-6 py-6 text-center transition-colors",
            dragOver
              ? "border-[var(--primary500)] bg-[var(--primary50)]"
              : "border-[var(--neutral200)] bg-[var(--neutral0)] hover:border-[var(--neutral300)]",
            uploading > 0 && "pointer-events-none opacity-60",
          )}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            className="sr-only"
            accept={imagesOnly ? "image/*" : undefined}
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {uploading > 0 ? (
            <Spinner size="sm" color="info" label="Mengunggah" />
          ) : (
            <Upload size={20} className={dragOver ? "text-[var(--primary500)]" : "text-[var(--neutral500)]"} aria-hidden />
          )}
          <p className={cn("mt-3 text-subtitle-sm", dragOver ? "text-[var(--primary600)]" : "text-[var(--neutral900)]")}>
            {uploading > 0 ? `Mengunggah ${uploading} file…` : "Seret file ke sini atau klik untuk upload"}
          </p>
          <p className="mt-1 text-caption-md text-[var(--neutral400)]">
            Maks 20 MB · {blobEnabled ? "disimpan di Vercel Blob" : "mode lokal: public/uploads"}
          </p>
        </label>
        {!data ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Spinner size="xs" className="text-current" label="Memproses" />
          </div>
        ) : data.items.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-[var(--borderXs)] border border-[var(--neutral100)] bg-[var(--neutral25)] text-body-sm text-[var(--neutral500)]">
            Belum ada media.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {data.items.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m)}
                onDoubleClick={() => onSelect?.(m)}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-[var(--border2xs)] border border-[var(--neutral100)] bg-[var(--neutral25)] p-1 text-left transition-colors hover:border-[var(--neutral300)]",
                  selected?.id === m.id && "border-[var(--primary500)] ring-1 ring-[var(--primary500)]",
                )}
              >
                <MediaThumb item={m} className="size-full" />
                {!m.alt.id && !m.alt.en && isImage(m.mimeType) && (
                  <Badge color="warning" variant="light" size="sm" className="absolute top-1 right-1">alt?</Badge>
                )}
              </button>
            ))}
          </div>
        )}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{data.total} file</span>
            <div className="flex gap-1">
              <Button type="button" color="neutral" variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Sebelumnya
              </Button>
              <span className="px-2 py-1">
                {page}/{data.totalPages}
              </span>
              <Button type="button" color="neutral" variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[var(--borderXs)] border border-[var(--neutral100)] bg-[var(--neutral0)] p-3 shadow-sm">
        {selected ? (
          <MediaDetail
            key={selected.id}
            item={selected}
            onSaved={(m) => {
              putMedia(m);
              setSelected(m);
              void load();
            }}
            onDeleted={() => {
              setSelected(null);
              void load();
            }}
            onSelect={onSelect}
            selectLabel={selectLabel}
          />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Pilih media untuk melihat detail & mengisi alt text.</p>
        )}
      </div>
    </div>
  );
}

function MediaDetail({
  item,
  onSaved,
  onDeleted,
  onSelect,
  selectLabel,
}: {
  item: MediaItem;
  onSaved: (m: MediaItem) => void;
  onDeleted: () => void;
  onSelect?: (m: MediaItem) => void;
  selectLabel: string;
}) {
  const [alt, setAlt] = useState(item.alt);
  const [caption, setCaption] = useState(item.caption ?? { id: "", en: "" });
  const [pending, start] = useTransition();
  const dirty =
    JSON.stringify(alt) !== JSON.stringify(item.alt) || JSON.stringify(caption) !== JSON.stringify(item.caption ?? { id: "", en: "" });

  const save = () =>
    start(async () => {
      const res = await updateMediaAction(item.id, { alt, caption });
      if (res.ok) {
        toast.success("Alt text disimpan");
        onSaved(res.data);
      } else toast.error(res.error);
    });

  return (
    <div className="space-y-3 text-sm">
      <MediaThumb item={item} className="aspect-video w-full" />
      <div className="space-y-0.5 text-xs text-muted-foreground">
        <p className="truncate font-medium text-foreground" title={item.filename}>
          {item.filename}
        </p>
        <p>
          {item.mimeType} · {formatBytes(item.size)}
          {item.width ? ` · ${item.width}×${item.height}` : ""}
        </p>
        <a href={item.url} target="_blank" rel="noreferrer" className="block truncate text-primary hover:underline">
          {item.url}
        </a>
      </div>
      <div className="space-y-1.5">
        <Label>Alt text (Indonesia)</Label>
        <Input value={alt.id} onChange={(e) => setAlt({ ...alt, id: e.target.value })} placeholder="Deskripsi gambar" />
      </div>
      <div className="space-y-1.5">
        <Label>Alt text (English)</Label>
        <Input value={alt.en} onChange={(e) => setAlt({ ...alt, en: e.target.value })} placeholder="Image description" />
      </div>
      <div className="space-y-1.5">
        <Label>Caption (ID / EN)</Label>
        <Input value={caption.id} onChange={(e) => setCaption({ ...caption, id: e.target.value })} placeholder="Keterangan" />
        <Input value={caption.en} onChange={(e) => setCaption({ ...caption, en: e.target.value })} placeholder="Caption" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" color="neutral" variant="secondary" onClick={save} disabled={!dirty || pending}>
          {pending && <Spinner size="xs" className="text-current" label="Memproses" />}
          Simpan alt
        </Button>
        {onSelect && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (dirty) save();
              onSelect({ ...item, alt, caption });
            }}
          >
            {selectLabel}
          </Button>
        )}
        <ConfirmButton
          size="sm"
          color="danger" variant="tertiary"
          title="Hapus media?"
          description="File akan dihapus permanen. Media yang masih dipakai konten tidak bisa dihapus."
          onConfirm={async () => {
            const res = await deleteMediaAction(item.id);
            if (res.ok) {
              toast.success("Media dihapus");
              onDeleted();
            } else toast.error(res.error);
          }}
        >
          <Trash2 /> Hapus
        </ConfirmButton>
      </div>
    </div>
  );
}
