"use client";

import { useActionState, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { loginAction } from "@/server/actions/auth";

type Errors = { email?: string; password?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): Errors {
  const errors: Errors = {};
  if (!email.trim()) errors.email = "Email wajib diisi.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "Format email tidak valid, contoh: nama@asyst.co.id";
  if (!password) errors.password = "Password wajib diisi.";
  return errors;
}

/** Field dengan label di atas kotak (kiri) + ikon di kanan dalam kotak (gaya halaman login). */
function LoginField({
  id,
  label,
  icon,
  error,
  ...props
}: ComponentProps<"input"> & { id: string; label: string; icon: ReactNode; error?: string }) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm leading-5 font-medium text-[var(--neutral900)]">
        {label}
        {props.required && (
          <span aria-hidden className="ml-0.5 text-[var(--danger500)]">
            *
          </span>
        )}
      </label>
      <div
        className={cn(
          "relative flex items-center gap-2 rounded-[14px] border border-transparent bg-[var(--neutral50)] pr-3 transition-[background-color,border-color,box-shadow]",
          "focus-within:border-[var(--primary500)] focus-within:bg-[var(--neutral0)] focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary500)_12%,transparent)]",
          error &&
            "border-[var(--danger500)] focus-within:border-[var(--danger500)] focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--danger500)_12%,transparent)]",
        )}
      >
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="login-input h-12 w-full min-w-0 flex-1 bg-transparent px-4 text-sm font-medium text-[var(--neutral900)] outline-none placeholder:text-[var(--neutral300)]"
          {...props}
        />
        {/* Wadah ikon berukuran sama agar ikon email & password sejajar. */}
        <div className="flex size-8 shrink-0 items-center justify-center">{icon}</div>
      </div>
      {/* Ruang pesan error selalu disediakan agar layout tidak naik-turun saat pesan muncul/hilang. */}
      <p id={errorId} role="alert" className="mt-1.5 min-h-4 px-1 text-xs leading-4 text-[var(--danger500)]">
        {error}
      </p>
    </div>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(values.email, values.password);
  const visible: Errors = {
    email: touched.email || submitted ? errors.email : undefined,
    password: touched.password || submitted ? errors.password : undefined,
  };

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    // Baca langsung dari form agar nilai autofill browser ikut tervalidasi.
    const fd = new FormData(e.currentTarget);
    const current = validate(String(fd.get("email") ?? ""), String(fd.get("password") ?? ""));
    if (current.email || current.password) {
      e.preventDefault();
      e.currentTarget.querySelector<HTMLInputElement>(current.email ? "#email" : "#password")?.focus();
    }
  }

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="space-y-2">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <LoginField
        id="email"
        name="email"
        type="email"
        required
        inputMode="email"
        label="Email"
        placeholder="nama@asyst.co.id"
        autoComplete="username"
        autoFocus
        value={values.email}
        onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
        error={visible.email}
        icon={<Mail aria-hidden className="size-[18px] text-[var(--neutral400)]" />}
      />

      <LoginField
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        required
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        value={values.password}
        onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
        error={visible.password}
        icon={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={showPassword}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-[var(--neutral400)] transition-colors hover:bg-[var(--neutral100)] hover:text-[var(--neutral700)] focus-visible:outline-2 focus-visible:outline-[var(--primary500)]"
          >
            {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        }
      />

      {state?.error && (
        <Alert color="danger" title="Gagal masuk" dismissible={false}>
          {state.error}
        </Alert>
      )}

      <div className="pt-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--primary500)] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_color-mix(in_srgb,var(--primary500)_70%,transparent)] transition-colors hover:bg-[var(--primary600)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary500)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending && <Spinner size="xs" className="text-current" label="Memproses" />}
          Masuk
        </button>
      </div>
    </form>
  );
}
