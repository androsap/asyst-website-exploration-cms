"use client";

import { useEffect, useMemo } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { schemaFor, type Fields } from "@/content/fields";

export function useContentForm(fields: Fields, defaultValues: Record<string, unknown>) {
  const schema = useMemo(() => schemaFor(fields), [fields]);
  const form = useForm<FieldValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // Peringatkan bila meninggalkan halaman dengan perubahan belum disimpan.
  const dirty = form.formState.isDirty;
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  return form;
}

/** Terapkan error dari server ke field form. */
export function applyServerErrors(
  form: ReturnType<typeof useContentForm>,
  fieldErrors: Record<string, string> | undefined,
  message: string,
) {
  const entries = Object.entries(fieldErrors ?? {});
  for (const [path, msg] of entries) form.setError(path, { type: "server", message: msg });
  toast.error(message);
  if (entries.length) scrollToFirstError();
}

export function scrollToFirstError() {
  requestAnimationFrame(() => {
    const el = document.querySelector("[aria-invalid='true'], .text-destructive.font-medium");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export function onInvalid() {
  toast.error("Periksa kembali isian yang ditandai merah.");
  scrollToFirstError();
}
