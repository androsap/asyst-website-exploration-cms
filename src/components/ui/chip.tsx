"use client"
// Atlas Design System — disalin dari github.com/androsap/atlas-design-system (src/components/ui/chip.tsx)


import { forwardRef, useId, useState, type ButtonHTMLAttributes, type ReactNode } from "react"
import { X, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type ChipColor = "neutral" | "primary" | "success" | "warning" | "danger"
export type ChipVariant = "fill" | "outline"
export type ChipSize = "sm" | "md" | "lg"

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color" | "onSelect"> {
    color?: ChipColor
    variant?: ChipVariant
    size?: ChipSize
    selected?: boolean
    defaultSelected?: boolean
    onSelectedChange?: (selected: boolean) => void
    leadingIcon?: LucideIcon
    trailingIcon?: LucideIcon
    /** Renders a real, independently-clickable remove button in the
     * trailing slot instead of trailingIcon — the classic removable-tag
     * use case. When set, the chip itself is a non-interactive label (a
     * <button> can't nest another <button>), not a toggle. */
    onRemove?: () => void
    /** Docs-only: force the focus-visible ring without real keyboard focus. */
    focused?: boolean
}

const SIZE_CLASSES: Record<ChipSize, string> = {
    sm: "h-7 gap-1 px-2.5 text-xs",
    md: "h-9 gap-1.5 px-3 text-sm",
    lg: "h-11 gap-2 px-4 text-sm",
}

const ICON_SIZE: Record<ChipSize, number> = { sm: 12, md: 14, lg: 16 }

// Unselected stays a subtle, colored hint in every variant — "fill" vs
// "outline" only changes how *selected* commits to the color. The focus
// ring is always --primary300 regardless of color, matching how a
// browser's own focus outline stays one consistent color across a page.
const CHIP_COLORS: Record<ChipColor, { unselected: string; fillSelected: string; outlineSelected: string }> = {
    neutral: {
        unselected: "border-[var(--neutral200)] bg-[var(--neutral50)] text-[var(--neutral700)] hover:bg-[var(--neutral100)]",
        fillSelected:
            "border-transparent bg-[var(--neutral900)] text-[var(--neutral0)] hover:bg-[var(--neutral800)]",
        outlineSelected: "border-[var(--neutral400)] bg-[var(--neutral0)] text-[var(--neutral900)] hover:bg-[var(--neutral50)]",
    },
    primary: {
        unselected: "border-[var(--primary200)] bg-[var(--primary50)] text-[var(--primary700)] hover:bg-[var(--primary100)]",
        fillSelected: "border-transparent bg-[var(--primary500)] text-white hover:bg-[var(--primary600)]",
        outlineSelected: "border-[var(--primary500)] bg-[var(--neutral0)] text-[var(--primary600)] hover:bg-[var(--primary50)]",
    },
    success: {
        unselected: "border-[var(--success200)] bg-[var(--success50)] text-[var(--success700)] hover:bg-[var(--success100)]",
        fillSelected: "border-transparent bg-[var(--success500)] text-white hover:bg-[var(--success600)]",
        outlineSelected: "border-[var(--success500)] bg-[var(--neutral0)] text-[var(--success600)] hover:bg-[var(--success50)]",
    },
    warning: {
        unselected: "border-[var(--warning200)] bg-[var(--warning50)] text-[var(--warning700)] hover:bg-[var(--warning100)]",
        fillSelected: "border-transparent bg-[var(--warning500)] text-white hover:bg-[var(--warning600)]",
        outlineSelected: "border-[var(--warning500)] bg-[var(--neutral0)] text-[var(--warning600)] hover:bg-[var(--warning50)]",
    },
    danger: {
        unselected: "border-[var(--danger200)] bg-[var(--danger50)] text-[var(--danger700)] hover:bg-[var(--danger100)]",
        fillSelected: "border-transparent bg-[var(--danger500)] text-white hover:bg-[var(--danger600)]",
        outlineSelected: "border-[var(--danger500)] bg-[var(--neutral0)] text-[var(--danger600)] hover:bg-[var(--danger50)]",
    },
}

const BASE_CLASSES =
    "inline-flex items-center justify-center rounded-full border font-medium transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary300)] focus-visible:ring-offset-2 " +
    "disabled:pointer-events-none disabled:opacity-40"

function chipStateClasses(color: ChipColor, variant: ChipVariant, selected: boolean) {
    const c = CHIP_COLORS[color]
    if (!selected) return c.unselected
    return variant === "fill" ? c.fillSelected : c.outlineSelected
}

function ChipBody({
    size,
    LeadingIcon,
    TrailingIcon,
    children,
}: {
    size: ChipSize
    LeadingIcon?: LucideIcon
    TrailingIcon?: LucideIcon
    children: ReactNode
}) {
    const iconSize = ICON_SIZE[size]
    return (
        <>
            {LeadingIcon && <LeadingIcon size={iconSize} className="shrink-0" aria-hidden />}
            <span className="truncate">{children}</span>
            {TrailingIcon && <TrailingIcon size={iconSize} className="shrink-0" aria-hidden />}
        </>
    )
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
    {
        color = "neutral",
        variant = "fill",
        size = "md",
        selected,
        defaultSelected = false,
        onSelectedChange,
        leadingIcon,
        trailingIcon,
        onRemove,
        focused = false,
        disabled,
        className,
        children,
        onClick,
        ...props
    },
    ref
) {
    const [uncontrolledSelected, setUncontrolledSelected] = useState(defaultSelected)
    const isSelected = selected ?? uncontrolledSelected
    const removeId = useId()

    const classes = cn(
        BASE_CLASSES,
        SIZE_CLASSES[size],
        chipStateClasses(color, variant, isSelected),
        focused && "ring-2 ring-[var(--primary300)] ring-offset-2",
        className
    )

    // Removable ("input") chip: a non-interactive label with its own real,
    // independently-clickable remove button — can't be a toggle <button>
    // itself, since a <button> can't contain another <button>.
    if (onRemove) {
        return (
            <span className={classes}>
                <ChipBody size={size} LeadingIcon={leadingIcon}>
                    {children}
                </ChipBody>
                <button
                    type="button"
                    id={removeId}
                    aria-label={`Remove ${typeof children === "string" ? children : "item"}`}
                    onClick={onRemove}
                    disabled={disabled}
                    className={cn(
                        "-mr-1 ml-0.5 shrink-0 cursor-pointer rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary300)]",
                        "disabled:pointer-events-none"
                    )}
                >
                    <X size={ICON_SIZE[size]} aria-hidden />
                </button>
            </span>
        )
    }

    // Selectable ("filter") chip: a real toggle button.
    return (
        <button
            ref={ref}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled}
            className={cn(classes, "cursor-pointer")}
            onClick={(e) => {
                if (selected === undefined) setUncontrolledSelected((prev) => !prev)
                onSelectedChange?.(!isSelected)
                onClick?.(e)
            }}
            {...props}
        >
            <ChipBody size={size} LeadingIcon={leadingIcon} TrailingIcon={trailingIcon}>
                {children}
            </ChipBody>
        </button>
    )
})
