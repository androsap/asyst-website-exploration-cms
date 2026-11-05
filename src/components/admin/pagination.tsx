import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  total,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{total} data</span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button asChild={page > 1} color="neutral" variant="secondary" size="sm" disabled={page <= 1}>
            {page > 1 ? (
              <Link href={href(page - 1)}>
                <ChevronLeft /> Sebelumnya
              </Link>
            ) : (
              <span>
                <ChevronLeft /> Sebelumnya
              </span>
            )}
          </Button>
          <span className="px-2">
            Hal. {page} / {totalPages}
          </span>
          <Button asChild={page < totalPages} color="neutral" variant="secondary" size="sm" disabled={page >= totalPages}>
            {page < totalPages ? (
              <Link href={href(page + 1)}>
                Berikutnya <ChevronRight />
              </Link>
            ) : (
              <span>
                Berikutnya <ChevronRight />
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
