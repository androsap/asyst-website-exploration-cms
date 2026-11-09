"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { nativeSelectClass } from "./form/field-shell";
import { RADIO_MAX_OPTIONS } from "./form/choice-field";

type Filter = { field: string; label: string; options: { value: string; label: string }[] };

export function ListToolbar({ hasStatus, filters = [] }: { hasStatus?: boolean; filters?: Filter[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => update({ q: q.trim() || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const status = params.get("status") ?? "";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari…" className="pl-8" />
      </div>
      {hasStatus && (
        <div className="flex rounded-lg border p-0.5 text-sm">
          {[
            ["", "Semua"],
            ["PUBLISHED", "Terbit"],
            ["DRAFT", "Draft"],
            ["ARCHIVED", "Arsip"],
          ].map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => update({ status: v || null })}
              className={cn("rounded-md px-2.5 py-1", status === v ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {filters.map((flt) =>
        flt.options.length < RADIO_MAX_OPTIONS ? (
          <div key={flt.field} role="radiogroup" aria-label={flt.label} className="flex flex-wrap items-center rounded-lg border p-0.5 text-sm">
            <span className="px-2 text-xs text-muted-foreground">{flt.label}</span>
            {[{ value: "", label: "Semua" }, ...flt.options].map((o) => {
              const active = (params.get(flt.field) ?? "") === o.value;
              return (
                <button
                  key={o.value || "__all"}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => update({ [flt.field]: o.value || null })}
                  className={cn("rounded-md px-2.5 py-1", active ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        ) : (
        <select
          key={flt.field}
          aria-label={flt.label}
          className={cn(nativeSelectClass, "w-auto")}
          value={params.get(flt.field) ?? ""}
          onChange={(e) => update({ [flt.field]: e.target.value || null })}
        >
          <option value="">{flt.label}: semua</option>
          {flt.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        ),
      )}
    </div>
  );
}
