export const ALLOWED_MIME = [
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/gif",
  "image/avif",
  "video/mp4",
  "application/pdf",
];

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function isImage(mime: string | null | undefined) {
  return !!mime && mime.startsWith("image/");
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
