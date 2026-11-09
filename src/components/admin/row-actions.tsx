"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteCollectionAction } from "@/server/actions/content";
import { invalidateRefOptions } from "./form/ref-options";

/** Tombol ikon Edit + Hapus (dengan konfirmasi) di ujung kanan row tabel koleksi. Server tetap memeriksa izin. */
export function CollectionRowActions({
  type,
  id,
  name,
  singular,
  canUpdate,
  canDelete,
}: {
  type: string;
  id: string;
  name: string;
  singular: string;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const editLabel = canUpdate ? "Edit" : "Lihat";

  return (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild color="neutral" variant="tertiary" size="icon-sm" aria-label={`${editLabel} ${name}`}>
            <Link href={`/admin/c/${type}/${id}`}>{canUpdate ? <Pencil /> : <Eye />}</Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{editLabel}</TooltipContent>
      </Tooltip>

      {canDelete && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                color="danger"
                variant="tertiary"
                size="icon-sm"
                aria-label={`Hapus ${name}`}
                onClick={() => setOpen(true)}
              >
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Hapus</TooltipContent>
          </Tooltip>

          <AlertDialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus {singular.toLowerCase()}?</AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="font-medium text-foreground">“{name}”</span> akan dihapus permanen dan tidak bisa
                  dikembalikan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
                <Button
                  color="danger"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await deleteCollectionAction(type, id);
                      if (!res.ok) return void toast.error(res.error);
                      invalidateRefOptions(type);
                      toast.success(`${singular} dihapus`);
                      setOpen(false);
                      router.refresh();
                    })
                  }
                >
                  {pending && <Spinner size="xs" className="text-current" label="Memproses" />}
                  Hapus
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
