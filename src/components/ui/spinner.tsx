// Atlas Design System — disalin dari github.com/androsap/atlas-design-system (src/components/ui/spinner.tsx)
import { cn } from "@/lib/utils"

export type SpinnerColor = "neutral" | "info" | "danger"
export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl"

export interface SpinnerProps {
    color?: SpinnerColor
    size?: SpinnerSize
    /** Accessible name — what's actually loading. */
    label?: string
    className?: string
}

const SIZE_PX: Record<SpinnerSize, number> = { xs: 16, sm: 20, md: 24, lg: 32, xl: 40 }
const STROKE_WIDTH: Record<SpinnerSize, number> = { xs: 2, sm: 2, md: 2.5, lg: 3, xl: 3.5 }

// Color lives on the wrapper (not the <svg>) so a caller can override it —
// e.g. className="text-white" for a spinner inside a filled button — via
// cn()'s twMerge, which drops the earlier text-color utility for the later
// one. The <svg> just inherits it through currentColor.
const COLOR_CLASSES: Record<SpinnerColor, string> = {
    neutral: "text-[var(--neutral900)]",
    info: "text-[var(--info500)]",
    danger: "text-[var(--danger500)]",
}

export function Spinner({ color = "neutral", size = "md", label = "Loading", className }: SpinnerProps) {
    const px = SIZE_PX[size]
    const stroke = STROKE_WIDTH[size]
    const radius = (px - stroke) / 2
    const circumference = 2 * Math.PI * radius
    const dash = circumference * 0.75 // ~75% arc, ~25% gap

    return (
        <span role="status" aria-label={label} className={cn("inline-flex shrink-0", COLOR_CLASSES[color], className)}>
            <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} className="animate-spin" aria-hidden>
                <circle
                    cx={px / 2}
                    cy={px / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                />
            </svg>
        </span>
    )
}
