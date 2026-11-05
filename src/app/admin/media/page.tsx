import type { Metadata } from "next";
import { MediaLibrary } from "./media-library";

export const metadata: Metadata = { title: "Media" };

export default function MediaPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-title-md text-[var(--neutral900)]">Media</h1>
        <p className="text-sm text-muted-foreground">Upload gambar/file, isi alt text Indonesia & English. Media yang masih dipakai tidak bisa dihapus.</p>
      </div>
      <MediaLibrary />
    </div>
  );
}
