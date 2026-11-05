import * as React from "react"
import { Slot } from "radix-ui"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Atlas Button (github.com/androsap/atlas-design-system → src/components/ui/button.tsx).
// Tambahan untuk CMS: `asChild` (mis. membungkus <Link>), ukuran `xs` dan ukuran
// tombol ikon persegi (`icon-*`). Warna & state identik dengan Atlas.

export type ButtonColor = "brand" | "neutral" | "danger" | "warning" | "success"
export type ButtonVariant = "primary" | "secondary" | "tertiary"
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon-xs" | "icon-sm" | "icon" | "icon-lg"

type ButtonProps = Omit<React.ComponentProps<"button">, "color"> & {
    color?: ButtonColor
    variant?: ButtonVariant
    size?: ButtonSize
    leadingIcon?: LucideIcon
    trailingIcon?: LucideIcon
    asChild?: boolean
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
    xs: "h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
    sm: "h-8 gap-1.5 px-3 text-sm [&_svg:not([class*='size-'])]:size-3.5",
    md: "h-9 gap-1.5 px-4 text-sm [&_svg:not([class*='size-'])]:size-4",
    lg: "h-10 gap-2 px-5 text-base [&_svg:not([class*='size-'])]:size-[18px]",
    "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
    "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
    icon: "size-9 [&_svg:not([class*='size-'])]:size-4",
    "icon-lg": "size-10 [&_svg:not([class*='size-'])]:size-[18px]",
}

const ICON_SIZE: Record<ButtonSize, number> = {
    xs: 12, sm: 14, md: 16, lg: 18, "icon-xs": 12, "icon-sm": 14, icon: 16, "icon-lg": 18,
}

const COLOR_VARIANT_CLASSES: Record<ButtonColor, Record<ButtonVariant, string>> = {
    brand: {
        primary:
            "bg-[var(--primary500)] text-white hover:bg-[var(--primary600)] active:bg-[var(--primary700)] focus-visible:ring-[var(--primary300)]",
        secondary:
            "border border-[var(--primary500)] text-[var(--primary600)] hover:bg-[var(--primary50)] active:bg-[var(--primary100)] focus-visible:ring-[var(--primary300)]",
        tertiary:
            "text-[var(--primary600)] hover:bg-[var(--primary50)] active:bg-[var(--primary100)] focus-visible:ring-[var(--primary300)]",
    },
    neutral: {
        primary:
            "bg-[var(--neutral900)] text-[var(--neutral0)] hover:bg-[var(--neutral800)] active:bg-[var(--neutral950)] focus-visible:ring-[var(--neutral400)]",
        secondary:
            "border border-[var(--neutral300)] bg-[var(--neutral0)] text-[var(--neutral900)] hover:bg-[var(--neutral50)] active:bg-[var(--neutral100)] focus-visible:ring-[var(--neutral400)]",
        tertiary:
            "text-[var(--neutral900)] hover:bg-[var(--neutral50)] active:bg-[var(--neutral100)] focus-visible:ring-[var(--neutral400)]",
    },
    danger: {
        primary:
            "bg-[var(--danger500)] text-white hover:bg-[var(--danger600)] active:bg-[var(--danger700)] focus-visible:ring-[var(--danger300)]",
        secondary:
            "border border-[var(--danger500)] text-[var(--danger600)] hover:bg-[var(--danger50)] active:bg-[var(--danger100)] focus-visible:ring-[var(--danger300)]",
        tertiary:
            "text-[var(--danger600)] hover:bg-[var(--danger50)] active:bg-[var(--danger100)] focus-visible:ring-[var(--danger300)]",
    },
    warning: {
        primary:
            "bg-[var(--warning500)] text-white hover:bg-[var(--warning600)] active:bg-[var(--warning700)] focus-visible:ring-[var(--warning300)]",
        secondary:
            "border border-[var(--warning500)] text-[var(--warning600)] hover:bg-[var(--warning50)] active:bg-[var(--warning100)] focus-visible:ring-[var(--warning300)]",
        tertiary:
            "text-[var(--warning600)] hover:bg-[var(--warning50)] active:bg-[var(--warning100)] focus-visible:ring-[var(--warning300)]",
    },
    success: {
        primary:
            "bg-[var(--success500)] text-white hover:bg-[var(--success600)] active:bg-[var(--success700)] focus-visible:ring-[var(--success300)]",
        secondary:
            "border border-[var(--success500)] text-[var(--success600)] hover:bg-[var(--success50)] active:bg-[var(--success100)] focus-visible:ring-[var(--success300)]",
        tertiary:
            "text-[var(--success600)] hover:bg-[var(--success50)] active:bg-[var(--success100)] focus-visible:ring-[var(--success300)]",
    },
}

export function buttonClasses({
    color = "brand",
    variant = "primary",
    size = "md",
}: { color?: ButtonColor; variant?: ButtonVariant; size?: ButtonSize } = {}) {
    return cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[var(--border2xs)] font-medium whitespace-nowrap transition-colors select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        COLOR_VARIANT_CLASSES[color][variant],
        SIZE_CLASSES[size]
    )
}

function Button({
    color = "brand",
    variant = "primary",
    size = "md",
    leadingIcon: LeadingIcon,
    trailingIcon: TrailingIcon,
    asChild = false,
    className,
    children,
    ...props
}: ButtonProps) {
    const classes = cn(buttonClasses({ color, variant, size }), className)
    if (asChild) {
        return (
            <Slot.Root data-slot="button" className={classes} {...props}>
                {children}
            </Slot.Root>
        )
    }
    const iconSize = ICON_SIZE[size]
    return (
        <button data-slot="button" className={classes} {...props}>
            {LeadingIcon && <LeadingIcon size={iconSize} aria-hidden />}
            {children}
            {TrailingIcon && <TrailingIcon size={iconSize} aria-hidden />}
        </button>
    )
}

export { Button }
