"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MediaItem } from "@/server/actions/media";
import { MediaBrowser } from "./media-browser";

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  imagesOnly = true,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (item: MediaItem) => void;
  imagesOnly?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Pilih media</DialogTitle>
          <DialogDescription>Upload file baru atau pilih dari library. Isi alt text ID & EN sebelum memilih.</DialogDescription>
        </DialogHeader>
        {open && (
          <MediaBrowser
            imagesOnly={imagesOnly}
            onSelect={(m) => {
              onSelect(m);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
