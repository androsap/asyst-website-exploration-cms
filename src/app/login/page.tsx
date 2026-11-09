import type { Metadata } from "next";
import Image from "next/image";
import { Alert } from "@/components/ui/alert";
import { LoginForm } from "./login-form";
import { LaptopMockup } from "./laptop-mockup";
import heroImage from "../../../public/login/workspace.webp";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/admin";
  const expired = sp.expired !== undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--neutral50)] p-4 sm:p-8">
      <div className="relative grid w-full max-w-[1120px] overflow-hidden rounded-[28px] bg-[var(--neutral0)] shadow-[0_32px_80px_-24px_rgb(15_23_42/0.18)] lg:min-h-[640px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ── Kiri: brand + form ── */}
        <section className="relative z-10 flex flex-col px-6 py-8 sm:px-12 sm:py-10 lg:pr-4 lg:pl-16">
          <header className="flex items-center gap-3">
            <Image src="/login/logo-asyst.png" alt="" width={36} height={36} className="size-9" priority />
            <span className="font-display text-base font-bold text-[var(--neutral900)]">Asyst CMS</span>
          </header>

          <div className="flex flex-1 flex-col justify-center py-12 lg:max-w-[360px]">
            <p className="text-xs font-semibold tracking-[0.12em] text-[var(--neutral400)] uppercase">Panel Admin</p>
            <h1 className="mt-3 font-display text-[34px] leading-[1.15] font-bold tracking-[-0.02em] text-[var(--neutral900)] sm:text-[42px]">
              Masuk ke akun Anda<span className="text-[var(--primary500)]">.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[var(--neutral500)]">
              Kelola konten website ASYST, dari produk hingga berita, dalam satu tempat.
            </p>

            {expired && (
              <Alert color="warning" title="Sesi berakhir" dismissible={false} className="mt-8">
                Akun Anda tidak aktif lagi atau sesi sudah tidak berlaku. Silakan masuk kembali.
              </Alert>
            )}

            <div className="mt-10">
              <LoginForm callbackUrl={callbackUrl} />
            </div>
          </div>

          <p className="text-xs text-[var(--neutral400)]">© {new Date().getFullYear()} PT Aero Systems Indonesia</p>
        </section>

        {/* ── Kanan: foto area kerja dengan tepi organik + laptop yang "timbul" keluar bingkai ── */}
        <section aria-hidden className="relative hidden lg:block">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            placeholder="blur"
            sizes="(min-width: 1024px) 560px, 0px"
            className="object-cover object-[62%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgb(15_23_42/0.45)] via-[rgb(15_23_42/0.1)] to-transparent" />
          {/* Lapisan putih bergelombang yang "memotong" foto + garis lengkung biru di tepinya */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
            <defs>
              <linearGradient id="login-arc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary100)" />
                <stop offset="55%" stopColor="var(--primary400)" />
                <stop offset="100%" stopColor="var(--primary600)" />
              </linearGradient>
            </defs>
            <path
              d="M0 0 H46 C34 9 31 20 41 30 C52 41 54 51 42 61 C27 73 15 84 11 100 H0 Z"
              fill="var(--neutral0)"
            />
            <path
              d="M46 0 C34 9 31 20 41 30 C52 41 54 51 42 61 C27 73 15 84 11 100"
              fill="none"
              stroke="url(#login-arc)"
              strokeWidth="6"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <LaptopMockup className="absolute top-1/2 left-[4%] z-10 w-[86%] -translate-y-1/2" />
          <Image
            src="/login/logo-asyst-white.webp"
            alt=""
            width={282}
            height={122}
            className="absolute right-10 bottom-10 h-auto w-24 drop-shadow-[0_2px_8px_rgb(0_0_0/0.35)]"
          />
        </section>
      </div>
    </main>
  );
}
