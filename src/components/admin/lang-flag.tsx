import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Bendera bahasa sebagai SVG inline — emoji bendera (🇮🇩/🇬🇧) tidak dirender
 * di Windows (hanya tampil huruf "ID"/"GB"), jadi pakai SVG agar konsisten.
 */
export function LangFlag({ lang, className }: { lang: Lang; className?: string }) {
  const cls = cn("inline-block h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/10", className);

  if (lang === "id") {
    return (
      <svg viewBox="0 0 3 2" className={cls} aria-hidden="true">
        <rect width="3" height="1" fill="#E70011" />
        <rect y="1" width="3" height="1" fill="#FFFFFF" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 60 30" className={cls} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <clipPath id="lang-flag-gb-s">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id="lang-flag-gb-t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#lang-flag-gb-s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#lang-flag-gb-t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}
