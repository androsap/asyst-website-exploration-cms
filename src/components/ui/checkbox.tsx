"use client"
// Atlas Design System — disalin dari github.com/androsap/atlas-design-system (src/components/ui/checkbox.tsx)

import { cn } from "@/lib/utils"
import { forwardRef, InputHTMLAttributes, useEffect, useId, useRef } from "react"
import { Check, Minus } from "lucide-react"
import { mergeRefs } from "@/lib/merge-refs"

export type CheckboxColor = "primary" | "danger" | "neutral"
export type CheckboxSize = "sm" | "md"

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "color"> {
    color?: CheckboxColor
    size?: CheckboxSize
    label?: string
    helperText?: string
    /** Visual "some but not all" state — sets the real DOM .indeterminate
     * property (there's no HTML attribute for it) via a ref effect. */
    indeterminate?: boolean
    /** Force the focused visual state, independent of real DOM focus. */
    focused?: boolean
}

const BOX_SIZE: Record<CheckboxSize, string> = { sm: "h-4 w-4", md: "h-5 w-5" }
const ICON_SIZE: Record<CheckboxSize, number> = { sm: 11, md: 13 }

const COLOR_CLASSES: Record<CheckboxColor, string> = {
    primary: cn(
        "border-[var(--neutral300)]",
        "peer-checked:border-[var(--primary500)] peer-checked:bg-[var(--primary500)]",
        "peer-indeterminate:border-[var(--primary500)] peer-indeterminate:bg-[var(--primary500)]",
        "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--primary300)]"
    ),
    danger: cn(
        "border-[var(--danger300)]",
        "peer-checked:border-[var(--danger500)] peer-checked:bg-[var(--danger500)]",
        "peer-indeterminate:border-[var(--danger500)] peer-indeterminate:bg-[var(--danger500)]",
        "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--danger300)]"
    ),
    neutral: cn(
        "border-[var(--neutral300)]",
        "peer-checked:border-[var(--neutral900)] peer-checked:bg-[var(--neutral900)]",
        "peer-indeterminate:border-[var(--neutral900)] peer-indeterminate:bg-[var(--neutral900)]",
        "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--neutral400)]"
    ),
}

// The Primary/Danger fills (primary500/danger500) are raw brand/status
// colors that stay put across themes, so white always contrasts. Neutral's
// fill (--neutral900) is a semantic value that inverts in dark mode —
// white-on-white otherwise — so its icon uses --background, which
// inverts right alongside it and stays the opposite end of the scale.
const ICON_COLOR_CLASSES: Record<CheckboxColor, string> = {
    primary: "text-white",
    danger: "text-white",
    neutral: "text-[var(--neutral0)]",
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
    {
        color = "primary",
        size = "md",
        label,
        helperText,
        indeterminate = false,
        focused = false,
        className,
        id,
        disabled,
        ...props
    },
    ref
) {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const innerRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (innerRef.current) innerRef.current.indeterminate = indeterminate
    }, [indeterminate])

    const iconSize = ICON_SIZE[size]

    return (
        <div className={cn("flex gap-2.5", className)}>
            <span
                className={cn(
                    "relative mt-0.5 inline-flex shrink-0",
                    BOX_SIZE[size],
                    disabled && "opacity-40"
                )}
            >
                <input
                    ref={mergeRefs(ref, innerRef)}
                    type="checkbox"
                    id={inputId}
                    disabled={disabled}
                    className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none disabled:cursor-not-allowed"
                    {...props}
                />
                <span
                    className={cn(
                        "pointer-events-none absolute inset-0 rounded-[5px] border-2 bg-[var(--neutral0)] transition-colors",
                        COLOR_CLASSES[color],
                        focused && "ring-2 ring-[var(--primary300)]"
                    )}
                />
                {/* Siblings of the input (not nested inside the box span
                    above) — peer-* only matches direct siblings. */}
                <Check
                    size={iconSize}
                    strokeWidth={3}
                    className={cn(
                        "pointer-events-none absolute inset-0 m-auto hidden peer-checked:block",
                        ICON_COLOR_CLASSES[color]
                    )}
                />
                <Minus
                    size={iconSize}
                    strokeWidth={3}
                    className={cn(
                        "pointer-events-none absolute inset-0 m-auto hidden peer-indeterminate:block",
                        ICON_COLOR_CLASSES[color]
                    )}
                />
            </span>
            {(label || helperText) && (
                <label htmlFor={inputId} className={cn("flex flex-col", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
                    {label && (
                        <span className={cn("text-sm font-medium", disabled ? "text-[var(--neutral300)]" : "text-[var(--neutral900)]")}>
                            {label}
                        </span>
                    )}
                    {helperText && (
                        <span className={cn("text-xs", disabled ? "text-[var(--neutral300)]" : color === "danger" ? "text-[var(--danger500)]" : "text-[var(--neutral400)]")}>
                            {helperText}
                        </span>
                    )}
                </label>
            )}
        </div>
    )
})
