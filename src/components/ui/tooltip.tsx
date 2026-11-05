"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

// Atlas Tooltip (varian "dark" default, "light" bordered).
export type TooltipVariant = "dark" | "light"

const VARIANT: Record<TooltipVariant, { box: string; arrow: string }> = {
    dark: { box: "border border-transparent bg-[var(--neutral900)] text-[var(--neutral0)]", arrow: "fill-[var(--neutral900)]" },
    light: { box: "border border-[var(--neutral100)] bg-[var(--neutral0)] text-[var(--neutral900)]", arrow: "fill-[var(--neutral0)]" },
}

function TooltipProvider({ delayDuration = 200, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
    return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
    return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
    className,
    sideOffset = 8,
    variant = "dark",
    children,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & { variant?: TooltipVariant }) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                data-slot="tooltip-content"
                sideOffset={sideOffset}
                className={cn(
                    "z-50 max-w-[260px] rounded-[var(--border2xs)] px-3.5 py-2.5 text-sm font-medium shadow-lg",
                    "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
                    VARIANT[variant].box,
                    className
                )}
                {...props}
            >
                {children}
                <TooltipPrimitive.Arrow width={14} height={7} className={VARIANT[variant].arrow} />
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
