"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

// Visual Atlas Switch (color "primary"): track off neutral200 / on primary500,
// thumb putih shadow-sm, fokus ring primary300. Tetap memakai Radix Switch
// (checked/onCheckedChange) agar kompatibel dengan Controller react-hook-form.
const TRACK: Record<"sm" | "md", string> = { sm: "h-5 w-9", md: "h-6 w-11" }
const THUMB: Record<"sm" | "md", string> = {
    sm: "size-4 data-[state=checked]:translate-x-4",
    md: "size-5 data-[state=checked]:translate-x-5",
}

function Switch({
    className,
    size = "md",
    ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & { size?: "sm" | "md" }) {
    return (
        <SwitchPrimitive.Root
            data-slot="switch"
            className={cn(
                "peer relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors outline-none",
                "bg-[var(--neutral200)] data-[state=checked]:bg-[var(--primary500)]",
                "focus-visible:ring-2 focus-visible:ring-[var(--primary300)] focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-40",
                TRACK[size],
                className
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                data-slot="switch-thumb"
                className={cn(
                    "pointer-events-none block translate-x-0 rounded-full bg-[var(--neutral0)] shadow-sm transition-transform",
                    THUMB[size]
                )}
            />
        </SwitchPrimitive.Root>
    )
}

export { Switch }
