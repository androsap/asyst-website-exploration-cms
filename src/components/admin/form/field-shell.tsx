"use client";

import { get, useFormContext } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { atlasFieldClasses } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function useFieldError(name: string): string | undefined {
  const {
    formState: { errors },
  } = useFormContext();
  const e = get(errors, name) as { message?: unknown; root?: { message?: string } } | undefined;
  if (!e) return undefined;
  if (typeof e.message === "string" && e.message) return e.message;
  // Error pada root array (mis. "minimal satu item").
  if (e.root?.message) return e.root.message;
  return undefined;
}

/** Label + helper text + error dengan anatomi field Atlas (label 14/500, helper 12 neutral400, error danger500). */
export function FieldShell({
  name,
  label,
  required,
  help,
  lang,
  className,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  help?: string;
  lang?: "id" | "en";
  className?: string;
  children: React.ReactNode;
}) {
  const error = useFieldError(name);
  return (
    <div className={cn("flex flex-col gap-1.5", className)} data-field={name}>
      <label htmlFor={name} className="flex items-center gap-1.5 text-label-md text-[var(--neutral900)]">
        <span>{label}</span>
        {required && <span className="text-[var(--danger500)]">*</span>}
        {lang && (
          <Badge color="primary" variant="light" size="sm" className="uppercase">
            {lang}
          </Badge>
        )}
      </label>
      {children}
      {help && !error && <p className="text-caption-md text-[var(--neutral400)]">{help}</p>}
      {error && <p className="text-caption-md font-medium text-[var(--danger500)]">{error}</p>}
    </div>
  );
}

/** <select> native bergaya Atlas Input/Dropdown (chevron dari .atlas-select di globals.css). */
export const nativeSelectClass = cn(atlasFieldClasses, "atlas-select h-9 cursor-pointer appearance-none pr-9 pl-3");
