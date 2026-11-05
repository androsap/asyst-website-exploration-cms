import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/admin";
  const expired = sp.expired !== undefined;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--neutral25)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-[var(--borderXs)] bg-[var(--primary500)] font-display text-lg font-bold text-white">
            A
          </div>
          <h1 className="font-display text-heading-sm text-[var(--neutral900)]">ASYST CMS</h1>
          <p className="mt-1 text-body-sm text-[var(--neutral500)]">Kelola konten website PT Aero Systems Indonesia</p>
        </div>
        {expired && (
          <Alert color="warning" title="Sesi berakhir" dismissible={false} className="mb-4">
            Akun Anda tidak aktif lagi atau sesi sudah tidak berlaku. Silakan masuk kembali.
          </Alert>
        )}
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
