import { Badge, type BadgeColor } from "@/components/ui/badge";

const STYLES: Record<string, { label: string; color: BadgeColor }> = {
  DRAFT: { label: "Draft", color: "neutral" },
  PUBLISHED: { label: "Terbit", color: "success" },
  SCHEDULED: { label: "Terjadwal", color: "info" },
  ARCHIVED: { label: "Arsip", color: "warning" },
  NEW: { label: "Baru", color: "info" },
  IN_PROGRESS: { label: "Diproses", color: "warning" },
  CLOSED: { label: "Selesai", color: "neutral" },
};

function isFuture(date: string | Date) {
  return new Date(date).getTime() > Date.now();
}

/** Status konten memakai Atlas Badge varian "light" (warna semantik). */
export function StatusBadge({ status, publishedAt }: { status: string; publishedAt?: string | Date | null }) {
  const scheduled = status === "PUBLISHED" && !!publishedAt && isFuture(publishedAt);
  const s = STYLES[scheduled ? "SCHEDULED" : status] ?? { label: status, color: "neutral" as const };
  return (
    <Badge color={s.color} variant="light" size="sm">
      {s.label}
    </Badge>
  );
}
