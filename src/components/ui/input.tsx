import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Kelas field Atlas (Input "md" — github.com/androsap/atlas-design-system, src/components/ui/input.tsx).
 * Dipakai juga untuk <select> native & textarea agar seluruh field seragam.
 * Label, helper text, dan pesan error dirender oleh FieldShell di form engine.
 */
export const atlasFieldClasses = cn(
    "w-full min-w-0 rounded-[var(--border2xs)] border border-[var(--neutral200)] bg-[var(--neutral0)] text-sm text-[var(--neutral900)] transition-colors outline-none",
    "placeholder:text-[var(--neutral400)]",
    "focus-visible:border-[var(--primary600)] focus-visible:ring-1 focus-visible:ring-[var(--primary600)]",
    "aria-invalid:border-[var(--danger500)] aria-invalid:focus-visible:ring-[var(--danger500)]",
    "disabled:cursor-not-allowed disabled:border-[var(--neutral100)] disabled:bg-[var(--neutral50)] disabled:text-[var(--neutral300)]",
    "read-only:border-[var(--neutral100)] read-only:bg-[var(--neutral25)]"
)

export type InputSize = "sm" | "md" | "lg"

const SIZE_CLASSES: Record<InputSize, string> = {
    sm: "h-8 px-2.5",
    md: "h-9 px-3",
    lg: "h-11 px-3.5 text-base",
}

function Input({
    className,
    type,
    size = "md",
    ...props
}: Omit<React.ComponentProps<"input">, "size"> & { size?: InputSize }) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                atlasFieldClasses,
                SIZE_CLASSES[size],
                "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium",
                className
            )}
            {...props}
        />
    )
}

export { Input }
