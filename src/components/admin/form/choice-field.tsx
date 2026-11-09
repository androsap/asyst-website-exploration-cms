"use client";

import { cn } from "@/lib/utils";
import { nativeSelectClass } from "./field-shell";

/** Opsi kurang dari ini → radio button; selebihnya → selectbox. */
export const RADIO_MAX_OPTIONS = 7;

export type ChoiceOption = { value: string; label: string; hint?: string; disabled?: boolean };

type Props = {
  id?: string;
  /** Nama grup radio (wajib unik per form). Default: id. */
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: ChoiceOption[];
  /**
   * Opsi "kosong" (value ""), mis. "Tidak ada". Di mode select tampil sebagai opsi pertama,
   * di mode radio sebagai radio pertama. Tidak dihitung ke batas jumlah opsi.
   */
  emptyLabel?: string;
  disabled?: boolean;
  /** Label untuk pembaca layar (bila tidak ada <label htmlFor>). */
  ariaLabel?: string;
  className?: string;
  selectClassName?: string;
  /** Paksa susunan radio. Default: vertikal bila ada hint, selain itu berjajar. */
  layout?: "row" | "column";
};

// Lingkaran radio: ring + celah putih + titik saat terpilih.
const radioClass = cn(
  "size-[18px] shrink-0 cursor-pointer appearance-none rounded-full border-2 border-[var(--neutral300)] bg-[var(--neutral0)] transition-colors",
  "checked:border-[var(--primary500)] checked:bg-[var(--primary500)] checked:shadow-[inset_0_0_0_3px_var(--neutral0)]",
  "focus-visible:outline-none disabled:cursor-not-allowed",
);

// Pill per opsi; terpilih = border & teks primary di atas latar primary50.
const pillClass = (selected: boolean, off: boolean, withHint: boolean) =>
  cn(
    "flex items-center gap-2.5 rounded-full border text-sm transition-colors select-none",
    withHint ? "min-h-10 py-2 pr-5 pl-3.5" : "h-10 px-4",
    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--primary300)] has-[:focus-visible]:ring-offset-1",
    selected
      ? "border-[var(--primary500)] bg-[var(--primary50)] text-[var(--primary600)]"
      : "border-[var(--neutral200)] bg-[var(--neutral0)] text-[var(--neutral500)]",
    off ? "cursor-not-allowed opacity-50" : cn("cursor-pointer", !selected && "hover:border-[var(--neutral300)] hover:text-[var(--neutral700)]"),
  );

/** Pilihan tunggal: radio button bila opsi < 7, selectbox bila lebih. */
export function ChoiceField({
  id,
  name,
  value,
  onChange,
  options,
  emptyLabel,
  disabled,
  ariaLabel,
  className,
  selectClassName,
  layout,
}: Props) {
  if (options.length >= RADIO_MAX_OPTIONS) {
    return (
      <select
        id={id}
        aria-label={ariaLabel}
        className={cn(nativeSelectClass, selectClassName)}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {emptyLabel !== undefined ? (
          <option value="">{emptyLabel}</option>
        ) : (
          value === "" && (
            <option value="" disabled hidden>
              — Pilih —
            </option>
          )
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
            {o.hint ? ` — ${o.hint}` : ""}
          </option>
        ))}
      </select>
    );
  }

  const group = name ?? id ?? "choice";
  const all: ChoiceOption[] = emptyLabel !== undefined ? [{ value: "", label: emptyLabel }, ...options] : options;
  const column = layout === "column";
  const withHint = all.some((o) => o.hint);

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(column ? "flex flex-col items-stretch gap-2" : "flex flex-wrap gap-2", className)}
    >
      {all.map((o) => {
        const off = Boolean(disabled || o.disabled);
        const selected = value === o.value;
        return (
          <label key={o.value || "__empty"} className={pillClass(selected, off, withHint)}>
            <input
              type="radio"
              name={group}
              value={o.value}
              checked={selected}
              disabled={off}
              onChange={() => onChange(o.value)}
              className={radioClass}
            />
            <span className="leading-5">
              <span>{o.label}</span>
              {o.hint && <span className={cn("block text-xs leading-4",selected ? "text-[var(--primary500)]" : "text-[var(--neutral400)]")}>{o.hint}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
