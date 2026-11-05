"use client";

import { useState } from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { ArrowDown, ArrowUp, Check, ChevronDown, Copy, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { labelOf, LANGS, type Lang } from "@/lib/i18n";
import { slugify } from "@/lib/slug";
import { ICON_GROUPS } from "@/content/icons";
import {
  blockFields,
  defaultsFor,
  type ArrayField,
  type BlocksField,
  type Field,
  type Fields,
  type ObjectField,
  type RefField,
} from "@/content/fields";
import { MediaPickerDialog } from "../media/media-picker";
import { MediaThumb } from "../media/media-browser";
import { putMedia, useMediaItems } from "../media/use-media";
import { join, useEditLang } from "./context";
import { FieldShell, nativeSelectClass, useFieldError } from "./field-shell";
import { RichTextEditor } from "./rich-text";
import { useRefOptions } from "./ref-options";

export function FieldsRenderer({ fields, prefix = "" }: { fields: Fields; prefix?: string }) {
  return (
    <div className="space-y-5">
      {Object.entries(fields).map(([key, field]) => (
        <FieldSwitch key={key} name={join(prefix, key)} field={field} prefix={prefix} />
      ))}
    </div>
  );
}

function FieldSwitch({ name, field, prefix }: { name: string; field: Field; prefix: string }) {
  const { control } = useFormContext();
  const watched = useWatch({ control, name: field.showIf ? join(prefix, field.showIf.field) : "__none__", disabled: !field.showIf });
  if (field.showIf) {
    const eq = field.showIf.equals;
    if (!(Array.isArray(eq) ? eq.includes(watched) : watched === eq)) return null;
  }
  return <FieldInput name={name} field={field} />;
}

export function FieldInput({ name, field }: { name: string; field: Field }) {
  switch (field.kind) {
    case "text":
      return <TextInput name={name} field={field} />;
    case "ltext":
      return field.rich ? <LRichInput name={name} field={field} /> : <LTextInput name={name} field={field} />;
    case "llist":
      return <LListInput name={name} field={field} />;
    case "list":
      return <ListInput name={name} field={field} />;
    case "number":
      return <NumberInput name={name} field={field} />;
    case "bool":
      return <BoolInput name={name} field={field} />;
    case "date":
    case "datetime":
      return <DateInput name={name} field={field} />;
    case "select":
      return <SelectInput name={name} field={field} />;
    case "multiselect":
      return <MultiSelectInput name={name} field={field} />;
    case "icon":
      return <IconInput name={name} field={field} />;
    case "media":
      return <MediaInput name={name} field={field} />;
    case "mediaList":
      return <MediaListInput name={name} field={field} />;
    case "ref":
      return field.multiple ? <RefMultiInput name={name} field={field} /> : <RefSingleInput name={name} field={field} />;
    case "object":
      return <ObjectInput name={name} field={field} />;
    case "array":
      return <ArrayInput name={name} field={field} />;
    case "blocks":
      return <BlocksInput name={name} field={field} />;
    case "json":
      return <JsonInput name={name} field={field} />;
  }
}

// ─────────────── Teks ───────────────

function TextInput({ name, field }: { name: string; field: Extract<Field, { kind: "text" }> }) {
  const { register, setValue, getValues } = useFormContext();
  const invalid = !!useFieldError(name);
  const isSlug = field.format === "slug";
  return (
    <FieldShell name={name} label={field.label} required={field.required} help={field.help}>
      <div className="flex gap-2">
        {field.multiline ? (
          <Textarea id={name} rows={3} placeholder={field.placeholder} aria-invalid={invalid} {...register(name)} />
        ) : (
          <Input
            id={name}
            placeholder={field.placeholder}
            aria-invalid={invalid}
            type={field.format === "email" ? "email" : field.format === "url" ? "url" : "text"}
            className={isSlug ? "font-mono text-xs" : undefined}
            {...register(name)}
          />
        )}
        {isSlug && (
          <Button
            type="button"
            color="neutral" variant="secondary"
            onClick={() => {
              const values = getValues();
              const src = values.title ?? values.name ?? values.label ?? values.menuLabel;
              const text = typeof src === "string" ? src : src?.en || src?.id || "";
              setValue(name, slugify(text), { shouldDirty: true });
            }}
          >
            Buat dari judul
          </Button>
        )}
      </div>
    </FieldShell>
  );
}

/** Tampilkan input untuk kedua bahasa, sembunyikan yang tidak aktif (nilai tetap terdaftar). */
function LangPanes({ render }: { render: (lang: Lang) => React.ReactNode }) {
  const active = useEditLang();
  return (
    <>
      {LANGS.map((lang) => (
        <div key={lang} className={lang === active ? undefined : "hidden"}>
          {render(lang)}
        </div>
      ))}
    </>
  );
}

function OtherLangHint({ name }: { name: string }) {
  const active = useEditLang();
  const other: Lang = active === "id" ? "en" : "id";
  const { control } = useFormContext();
  const otherValue = useWatch({ control, name: `${name}.${other}` });
  const value = useWatch({ control, name: `${name}.${active}` });
  const empty = (v: unknown) => (Array.isArray(v) ? v.length === 0 : !v || String(v).replace(/<p><\/p>/g, "").trim() === "");
  if (!empty(value) || empty(otherValue)) return null;
  return (
    <p className="text-xs text-[var(--warning700)]">
      Versi {active === "id" ? "Indonesia" : "English"} kosong — situs akan memakai versi {other === "id" ? "Indonesia" : "English"}.
    </p>
  );
}

function LTextInput({ name, field }: { name: string; field: Extract<Field, { kind: "ltext" }> }) {
  const { register } = useFormContext();
  const invalid = !!useFieldError(name);
  const lang = useEditLang();
  return (
    <FieldShell name={name} label={field.label} required={field.required} help={field.help} lang={lang}>
      <LangPanes
        render={(l) =>
          field.multiline ? (
            <Textarea
              id={l === lang ? name : undefined}
              rows={field.rich ? 6 : 3}
              placeholder={field.placeholder}
              aria-invalid={invalid}
              {...register(`${name}.${l}`)}
            />
          ) : (
            <Input id={l === lang ? name : undefined} placeholder={field.placeholder} aria-invalid={invalid} {...register(`${name}.${l}`)} />
          )
        }
      />
      <OtherLangHint name={name} />
    </FieldShell>
  );
}

function LRichInput({ name, field }: { name: string; field: Extract<Field, { kind: "ltext" }> }) {
  const { control } = useFormContext();
  const invalid = !!useFieldError(name);
  const lang = useEditLang();
  return (
    <FieldShell name={name} label={field.label} required={field.required} help={field.help} lang={lang}>
      <LangPanes
        render={(l) => (
          <Controller
            control={control}
            name={`${name}.${l}`}
            render={({ field: f }) => (
              <RichTextEditor id={l === lang ? name : undefined} value={f.value ?? ""} onChange={f.onChange} invalid={invalid} />
            )}
          />
        )}
      />
      <OtherLangHint name={name} />
    </FieldShell>
  );
}

/** Textarea "satu item per baris" ↔ string[] */
function LinesTextarea({ id, value, onChange, invalid, placeholder }: {
  id?: string;
  value: string[] | undefined;
  onChange: (v: string[]) => void;
  invalid?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState(() => (value ?? []).join("\n"));
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    // Sinkronkan bila nilai berubah dari luar (reset form), tanpa mengganggu baris kosong saat mengetik.
    setLastValue(value);
    if ((value ?? []).join("\n") !== text.split("\n").filter((s) => s.trim() !== "").join("\n")) setText((value ?? []).join("\n"));
  }
  return (
    <Textarea
      id={id}
      rows={Math.min(10, Math.max(3, (value?.length ?? 0) + 1))}
      value={text}
      aria-invalid={invalid}
      placeholder={placeholder ?? "Satu item per baris"}
      onChange={(e) => {
        setText(e.target.value);
        const next = e.target.value.split("\n").filter((s) => s.trim() !== "");
        setLastValue(next);
        onChange(next);
      }}
    />
  );
}

function LListInput({ name, field }: { name: string; field: Extract<Field, { kind: "llist" }> }) {
  const { control } = useFormContext();
  const invalid = !!useFieldError(name);
  const lang = useEditLang();
  return (
    <FieldShell name={name} label={field.label} required={field.required} help={field.help ?? "Satu item per baris."} lang={lang}>
      <LangPanes
        render={(l) => (
          <Controller
            control={control}
            name={`${name}.${l}`}
            render={({ field: f }) => (
              <LinesTextarea id={l === lang ? name : undefined} value={f.value} onChange={f.onChange} invalid={invalid} />
            )}
          />
        )}
      />
      <OtherLangHint name={name} />
    </FieldShell>
  );
}

function ListInput({ name, field }: { name: string; field: Extract<Field, { kind: "list" }> }) {
  const { control } = useFormContext();
  const invalid = !!useFieldError(name);
  return (
    <FieldShell name={name} label={field.label} required={field.required} help={field.help ?? "Satu item per baris."}>
      <Controller
        control={control}
        name={name}
        render={({ field: f }) => <LinesTextarea id={name} value={f.value} onChange={f.onChange} invalid={invalid} />}
      />
    </FieldShell>
  );
}

// ─────────────── Skalar ───────────────

function NumberInput({ name, field }: { name: string; field: Extract<Field, { kind: "number" }> }) {
  const { register } = useFormContext();
  return (
    <FieldShell name={name} label={field.label} required={field.required} help={field.help}>
      <Input
        id={name}
        type="number"
        min={field.min}
        max={field.max}
        className="max-w-48"
        {...register(name, { setValueAs: (v) => (v === "" || v == null ? null : Number(v)) })}
      />
    </FieldShell>
  );
}

function BoolInput({ name, field }: { name: string; field: Extract<Field, { kind: "bool" }> }) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: f }) => (
        <label className="flex items-start gap-3 text-sm">
          <Switch id={name} checked={!!f.value} onCheckedChange={f.onChange} className="mt-0.5" />
          <span>
            <span className="font-medium">{field.label}</span>
            {field.help && <span className="block text-xs text-muted-foreground">{field.help}</span>}
          </span>
        </label>
      )}
    />
  );
}

function toLocalInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DateTimeLocalInput({ id, value, onChange }: { id?: string; value: string; onChange: (iso: string) => void }) {
  return (
    <Input
      id={id}
      type="datetime-local"
      value={toLocalInput(value)}
      onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")}
    />
  );
}

function DateInput({ name, field }: { name: string; field: Extract<Field, { kind: "date" | "datetime" }> }) {
  const { control, register } = useFormContext();
  return (
    <FieldShell name={name} label={field.label} required={field.required} help={field.help}>
      <div className="max-w-64">
        {field.kind === "date" ? (
          <Input id={name} type="date" {...register(name)} />
        ) : (
          <Controller
            control={control}
            name={name}
            render={({ field: f }) => <DateTimeLocalInput id={name} value={f.value ?? ""} onChange={f.onChange} />}
          />
        )}
      </div>
    </FieldShell>
  );
}

function SelectInput({ name, field }: { name: string; field: Extract<Field, { kind: "select" }> }) {
  const { register } = useFormContext();
  return (
    <FieldShell name={name} label={field.label} required={field.required} help={field.help}>
      <select id={name} className={cn(nativeSelectClass, "max-w-md")} {...register(name)}>
        {!field.required || !field.default ? <option value="">— Pilih —</option> : null}
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function MultiSelectInput({ name, field }: { name: string; field: Extract<Field, { kind: "multiselect" }> }) {
  const { control } = useFormContext();
  return (
    <FieldShell name={name} label={field.label} required={field.required} help={field.help}>
      <Controller
        control={control}
        name={name}
        render={({ field: f }) => {
          const value: string[] = f.value ?? [];
          return (
            <div className="flex flex-wrap gap-2">
              {field.options.map((o) => {
                const on = value.includes(o.value);
                return (
                  <Chip
                    key={o.value}
                    color="primary"
                    variant="fill"
                    size="sm"
                    selected={on}
                    leadingIcon={on ? Check : undefined}
                    onSelectedChange={(sel) => f.onChange(sel ? [...value, o.value] : value.filter((v) => v !== o.value))}
                  >
                    {o.label}
                  </Chip>
                );
              })}
            </div>
          );
        }}
      />
    </FieldShell>
  );
}

function IconInput({ name, field }: { name: string; field: Extract<Field, { kind: "icon" }> }) {
  const { register } = useFormContext();
  return (
    <FieldShell name={name} label={field.label} required={field.required} help={field.help ?? "Kunci ikon; frontend memetakan ke komponen."}>
      <select id={name} className={cn(nativeSelectClass, "max-w-md font-mono text-xs")} {...register(name)}>
        <option value="">— Tanpa ikon —</option>
        {ICON_GROUPS.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.keys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </FieldShell>
  );
}

function JsonInput({ name, field }: { name: string; field: Extract<Field, { kind: "json" }> }) {
  const { control } = useFormContext();
  return (
    <FieldShell name={name} label={field.label} help={field.help}>
      <Controller
        control={control}
        name={name}
        render={({ field: f }) => <JsonTextarea value={f.value} onChange={f.onChange} />}
      />
    </FieldShell>
  );
}

function JsonTextarea({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const [text, setText] = useState(() => (value == null ? "" : JSON.stringify(value, null, 2)));
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Textarea
        rows={12}
        className="font-mono text-xs"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (!e.target.value.trim()) {
            setError(null);
            onChange(null);
            return;
          }
          try {
            onChange(JSON.parse(e.target.value));
            setError(null);
          } catch {
            setError("JSON belum valid");
          }
        }}
      />
      {error && <p className="text-xs text-[var(--warning700)]">{error}</p>}
    </>
  );
}

// ─────────────── Media ───────────────

function MediaInput({ name, field }: { name: string; field: Extract<Field, { kind: "media" }> }) {
  const { control } = useFormContext();
  const [open, setOpen] = useState(false);
  return (
    <FieldShell name={name} label={field.label} required={field.required} help={field.help}>
      <Controller
        control={control}
        name={name}
        render={({ field: f }) => (
          <>
            <MediaValue id={f.value} onPick={() => setOpen(true)} onClear={() => f.onChange(null)} />
            <MediaPickerDialog
              open={open}
              onOpenChange={setOpen}
              onSelect={(m) => {
                putMedia(m);
                f.onChange(m.id);
              }}
            />
          </>
        )}
      />
    </FieldShell>
  );
}

function MediaValue({ id, onPick, onClear }: { id: string | null; onPick: () => void; onClear: () => void }) {
  const items = useMediaItems([id]);
  const item = id ? items[id] : undefined;
  if (!id)
    return (
      <button
        type="button"
        onClick={onPick}
        className="flex h-24 w-40 flex-col items-center justify-center gap-1 rounded-[var(--borderXs)] border border-[var(--neutral200)] bg-[var(--neutral0)] text-caption-md text-[var(--neutral500)] transition-colors hover:border-[var(--primary500)] hover:bg-[var(--primary50)] hover:text-[var(--primary600)]"
      >
        <ImagePlus className="size-5" />
        Pilih / upload
      </button>
    );
  return (
    <div className="flex items-start gap-3">
      <button type="button" onClick={onPick} className="rounded-[var(--borderXs)] border border-[var(--neutral200)] bg-[var(--neutral0)] p-1 transition-colors hover:border-[var(--primary500)]">
        <MediaThumb item={item} className="h-24 w-40" />
      </button>
      <div className="space-y-1 text-xs">
        <p className="max-w-56 truncate font-medium">{item?.filename ?? "…"}</p>
        {item && !item.alt.id && !item.alt.en && <p className="text-[var(--warning700)]">Alt text belum diisi</p>}
        <div className="flex gap-1">
          <Button type="button" size="xs" color="neutral" variant="secondary" onClick={onPick}>
            Ganti
          </Button>
          <Button type="button" size="xs" color="neutral" variant="tertiary" onClick={onClear}>
            <X /> Hapus
          </Button>
        </div>
      </div>
    </div>
  );
}

function MediaListInput({ name, field }: { name: string; field: Extract<Field, { kind: "mediaList" }> }) {
  const { control } = useFormContext();
  const [open, setOpen] = useState(false);
  return (
    <FieldShell name={name} label={field.label} required={field.required} help={field.help}>
      <Controller
        control={control}
        name={name}
        render={({ field: f }) => {
          const ids: string[] = f.value ?? [];
          return (
            <>
              <MediaListValue
                ids={ids}
                onChange={f.onChange}
                onAdd={() => setOpen(true)}
              />
              <MediaPickerDialog
                open={open}
                onOpenChange={setOpen}
                onSelect={(m) => {
                  putMedia(m);
                  f.onChange([...ids, m.id]);
                }}
              />
            </>
          );
        }}
      />
    </FieldShell>
  );
}

function MediaListValue({ ids, onChange, onAdd }: { ids: string[]; onChange: (v: string[]) => void; onAdd: () => void }) {
  const items = useMediaItems(ids);
  const move = (i: number, d: number) => {
    const next = [...ids];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {ids.map((id, i) => (
        <div key={`${id}-${i}`} className="group relative rounded-lg border p-1">
          <MediaThumb item={items[id]} className="h-20 w-28" />
          <div className="absolute inset-x-1 bottom-1 hidden justify-between rounded bg-background/90 p-0.5 group-hover:flex">
            <Button type="button" size="icon-xs" color="neutral" variant="tertiary" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Geser kiri">
              <ArrowUp className="-rotate-90" />
            </Button>
            <Button type="button" size="icon-xs" color="neutral" variant="tertiary" onClick={() => onChange(ids.filter((_, j) => j !== i))} aria-label="Hapus">
              <X />
            </Button>
            <Button type="button" size="icon-xs" color="neutral" variant="tertiary" disabled={i === ids.length - 1} onClick={() => move(i, 1)} aria-label="Geser kanan">
              <ArrowDown className="-rotate-90" />
            </Button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="flex h-[88px] w-[120px] flex-col items-center justify-center gap-1 rounded-[var(--borderXs)] border border-[var(--neutral200)] bg-[var(--neutral0)] text-caption-md text-[var(--neutral500)] transition-colors hover:border-[var(--primary500)] hover:bg-[var(--primary50)] hover:text-[var(--primary600)]"
      >
        <ImagePlus className="size-5" /> Tambah
      </button>
    </div>
  );
}

// ─────────────── Relasi ───────────────

function RefSingleInput({ name, field }: { name: string; field: RefField }) {
  const { control } = useFormContext();
  const { options, error } = useRefOptions(field.target, field.vocabulary);
  return (
    <FieldShell name={name} label={field.label} required={field.required} help={error ?? field.help}>
      <Controller
        control={control}
        name={name}
        render={({ field: f }) => (
          <select
            id={name}
            className={cn(nativeSelectClass, "max-w-md")}
            value={f.value ?? ""}
            onChange={(e) => f.onChange(e.target.value || null)}
            disabled={!options}
          >
            <option value="">{options ? "— Tidak ada —" : "Memuat…"}</option>
            {options?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
                {o.hint ? ` (${o.hint})` : ""}
              </option>
            ))}
          </select>
        )}
      />
    </FieldShell>
  );
}

function RefMultiInput({ name, field }: { name: string; field: RefField }) {
  const { control } = useFormContext();
  const { options, error } = useRefOptions(field.target, field.vocabulary);
  const byId = new Map((options ?? []).map((o) => [o.id, o]));
  return (
    <FieldShell name={name} label={field.label} required={field.required} help={error ?? field.help}>
      <Controller
        control={control}
        name={name}
        render={({ field: f }) => {
          const ids: string[] = f.value ?? [];
          const move = (i: number, d: number) => {
            const next = [...ids];
            const [x] = next.splice(i, 1);
            next.splice(i + d, 0, x);
            f.onChange(next);
          };
          return (
            <div className="space-y-2">
              {ids.length > 0 && (
                <ul className="divide-y rounded-lg border">
                  {ids.map((id, i) => (
                    <li key={id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                      <span className="w-5 text-xs text-muted-foreground">{i + 1}.</span>
                      <span className="flex-1 truncate">{byId.get(id)?.label ?? (options ? "(data dihapus)" : "…")}</span>
                      <Button type="button" size="icon-xs" color="neutral" variant="tertiary" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Naik">
                        <ArrowUp />
                      </Button>
                      <Button type="button" size="icon-xs" color="neutral" variant="tertiary" disabled={i === ids.length - 1} onClick={() => move(i, 1)} aria-label="Turun">
                        <ArrowDown />
                      </Button>
                      <Button type="button" size="icon-xs" color="neutral" variant="tertiary" onClick={() => f.onChange(ids.filter((x) => x !== id))} aria-label="Hapus">
                        <X />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <select
                className={cn(nativeSelectClass, "max-w-md")}
                value=""
                disabled={!options}
                onChange={(e) => e.target.value && f.onChange([...ids, e.target.value])}
              >
                <option value="">{options ? "+ Tambahkan…" : "Memuat…"}</option>
                {options
                  ?.filter((o) => !ids.includes(o.id))
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                      {o.hint ? ` (${o.hint})` : ""}
                    </option>
                  ))}
              </select>
            </div>
          );
        }}
      />
    </FieldShell>
  );
}

// ─────────────── Struktur ───────────────

function Section({
  title,
  subtitle,
  actions,
  defaultOpen = true,
  invalid,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  defaultOpen?: boolean;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("rounded-[var(--border2xs)] border border-[var(--neutral100)] bg-[var(--neutral0)]", invalid && "border-[var(--danger300)]")}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", !open && "-rotate-90")} />
          <span className="truncate text-subtitle-sm text-[var(--neutral900)]">{title}</span>
          {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
        </button>
        {actions}
      </div>
      {/* Konten disembunyikan dengan CSS agar input tetap ter-mount (nilai & validasi tetap jalan). */}
      <div className={cn("border-t px-4 py-4", !open && "hidden")}>{children}</div>
    </div>
  );
}

function hasNestedError(errors: unknown, name: string) {
  let cur: unknown = errors;
  for (const part of name.split(".")) {
    if (!cur || typeof cur !== "object") return false;
    cur = (cur as Record<string, unknown>)[part];
  }
  return !!cur;
}

function ObjectInput({ name, field }: { name: string; field: ObjectField }) {
  const { control, setValue, formState } = useFormContext();
  const value = useWatch({ control, name });
  const enabled = value != null;
  const invalid = hasNestedError(formState.errors, name);

  if (field.nullable) {
    return (
      <Section
        title={field.label}
        subtitle={!enabled ? "nonaktif" : undefined}
        invalid={invalid}
        defaultOpen={enabled}
        actions={
          <Switch
            checked={enabled}
            aria-label={`Aktifkan ${field.label}`}
            onCheckedChange={(on) => setValue(name, on ? defaultsFor(field.fields) : null, { shouldDirty: true })}
          />
        }
      >
        {field.help && <p className="mb-4 text-xs text-muted-foreground">{field.help}</p>}
        {enabled ? (
          <FieldsRenderer fields={field.fields} prefix={name} />
        ) : (
          <p className="text-sm text-muted-foreground">Aktifkan untuk mengisi bagian ini.</p>
        )}
      </Section>
    );
  }
  return (
    <Section title={field.label} invalid={invalid}>
      {field.help && <p className="mb-4 text-xs text-muted-foreground">{field.help}</p>}
      <FieldsRenderer fields={field.fields} prefix={name} />
    </Section>
  );
}

function ItemTitle({ name, itemLabel, fallback }: { name: string; itemLabel?: string; fallback: string }) {
  const { control } = useFormContext();
  const v = useWatch({ control, name: itemLabel ? `${name}.${itemLabel}` : "__none__", disabled: !itemLabel });
  const text = labelOf(v);
  return <>{text || fallback}</>;
}

function ItemActions({
  index,
  count,
  move,
  remove,
  duplicate,
}: {
  index: number;
  count: number;
  move: (from: number, to: number) => void;
  remove: (i: number) => void;
  duplicate: (i: number) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Button type="button" size="icon-xs" color="neutral" variant="tertiary" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label="Naik">
        <ArrowUp />
      </Button>
      <Button type="button" size="icon-xs" color="neutral" variant="tertiary" disabled={index === count - 1} onClick={() => move(index, index + 1)} aria-label="Turun">
        <ArrowDown />
      </Button>
      <Button type="button" size="icon-xs" color="neutral" variant="tertiary" onClick={() => duplicate(index)} aria-label="Duplikat">
        <Copy />
      </Button>
      <Button
        type="button"
        size="icon-xs"
        color="danger" variant="tertiary"
        onClick={() => window.confirm("Hapus item ini?") && remove(index)}
        aria-label="Hapus"
      >
        <Trash2 />
      </Button>
    </div>
  );
}

function ArrayInput({ name, field }: { name: string; field: ArrayField }) {
  const { control, getValues, formState } = useFormContext();
  const { fields: items, append, remove, move, insert } = useFieldArray({ control, name, keyName: "_key" });
  const error = useFieldError(name);
  const invalid = hasNestedError(formState.errors, name);
  return (
    <Section title={field.label} subtitle={`${items.length} item`} invalid={invalid}>
      {field.help && <p className="mb-3 text-xs text-muted-foreground">{field.help}</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <Section
            key={item._key}
            defaultOpen={items.length <= 2}
            invalid={hasNestedError(formState.errors, `${name}.${i}`)}
            title={<ItemTitle name={`${name}.${i}`} itemLabel={field.itemLabel} fallback={`Item ${i + 1}`} />}
            subtitle={`#${i + 1}`}
            actions={
              <ItemActions
                index={i}
                count={items.length}
                move={move}
                remove={remove}
                duplicate={(idx) => insert(idx + 1, structuredClone(getValues(`${name}.${idx}`)))}
              />
            }
          >
            <FieldsRenderer fields={field.fields} prefix={`${name}.${i}`} />
          </Section>
        ))}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-destructive">{error}</p>}
      <Button
        type="button"
        color="neutral" variant="secondary"
        size="sm"
        className="mt-3"
        disabled={field.max != null && items.length >= field.max}
        onClick={() => append(defaultsFor(field.fields))}
      >
        <Plus /> Tambah item
      </Button>
    </Section>
  );
}

function BlocksInput({ name, field }: { name: string; field: BlocksField }) {
  const { control, getValues, formState } = useFormContext();
  const { fields: items, append, remove, move, insert } = useFieldArray({ control, name, keyName: "_key" });
  const types = Object.entries(field.blocks);
  return (
    <Section title={field.label} subtitle={`${items.length} blok`} invalid={hasNestedError(formState.errors, name)}>
      {field.help && <p className="mb-3 text-xs text-muted-foreground">{field.help}</p>}
      <div className="space-y-2">
        {items.map((item, i) => {
          const type = (item as unknown as { type: string }).type;
          const def = field.blocks[type];
          if (!def) return null;
          return (
            <Section
              key={item._key}
              defaultOpen={false}
              invalid={hasNestedError(formState.errors, `${name}.${i}`)}
              title={
                <span className="flex items-center gap-2">
                  <Badge color="primary" variant="light" size="sm">{def.label}</Badge>
                  <ItemTitle name={`${name}.${i}`} itemLabel="title" fallback="" />
                </span>
              }
              subtitle={`#${i + 1}`}
              actions={
                <ItemActions
                  index={i}
                  count={items.length}
                  move={move}
                  remove={remove}
                  duplicate={(idx) => insert(idx + 1, structuredClone(getValues(`${name}.${idx}`)))}
                />
              }
            >
              <FieldsRenderer fields={blockFields(def)} prefix={`${name}.${i}`} />
            </Section>
          );
        })}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" color="neutral" variant="secondary" size="sm" className="mt-3">
            <Plus /> Tambah blok
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-80 w-64 overflow-y-auto" align="start">
          {types.map(([type, def]) => (
            <DropdownMenuItem key={type} onSelect={() => append({ type, ...defaultsFor(blockFields(def)) })}>
              <span className="font-medium">{def.label}</span>
              {def.description && <span className="ml-auto text-xs text-muted-foreground">{def.description}</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Section>
  );
}
