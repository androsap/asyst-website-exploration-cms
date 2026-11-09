"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Bar `position: sticky` di bawah header admin (tinggi 64px).
 * Saat menempel, muncul bayangan halus HANYA di sisi bawah (gradasi yang memudar ke kiri/kanan),
 * bukan box-shadow penuh yang membuat bar terlihat seperti kotak timbul.
 */
export function StickyBar({
  offset = 64,
  className,
  children,
}: {
  /** Jarak dari atas viewport saat menempel (px) — default tinggi header admin. */
  offset?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      setStuck(el.getBoundingClientRect().top <= offset + 0.5 && window.scrollY > 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
  }, [offset]);

  return (
    <div ref={ref} data-stuck={stuck || undefined} className={cn("sticky z-20", className)} style={{ top: offset }}>
      {children}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-full h-4 bg-gradient-to-b from-[rgb(15_23_42/0.07)] via-[rgb(15_23_42/0.025)] to-transparent opacity-0 transition-opacity duration-300",
          "[mask-image:linear-gradient(to_right,transparent,black_48px,black_calc(100%-48px),transparent)]",
          stuck && "opacity-100",
        )}
      />
    </div>
  );
}
