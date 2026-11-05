"use client"
// Atlas Design System — disalin dari github.com/androsap/atlas-design-system (src/components/ui/alert.tsx)

import { useState, type ReactNode } from "react"
import { X, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { NOTIFICATION_ICON, NOTIFICATION_CLASSES, type NotificationColor } from "./notification"

export type AlertColor = NotificationColor
export type AlertLayout = "stacked" | "inline"

export interface AlertProps {
    color?: AlertColor
    /** "stacked" (default): the action sits below the description — room to
     * breathe for a notice living inline in the page. "inline": the action
     * sits beside the close button in the header instead — the compact
     * shape a Toast borrows for its cramped, floating viewport. */
    layout?: AlertLayout
    icon?: LucideIcon
    title: string
    children?: ReactNode
    actionLabel?: string
    onAction?: () => void
    onDismiss?: () => void
    dismissible?: boolean
    className?: string
}

export function Alert({
    color = "neutral",
    layout = "stacked",
    icon,
    title,
    children,
    actionLabel,
    onAction,
    onDismiss,
    dismissible = true,
    className,
}: AlertProps) {
    const [dismissed, setDismissed] = useState(false)
    if (dismissed) return null

    const Icon = icon ?? NOTIFICATION_ICON[color]
    const c = NOTIFICATION_CLASSES[color]

    const closeButton = dismissible && (
        <button
            type="button"
            aria-label="Dismiss"
            onClick={() => {
                setDismissed(true)
                onDismiss?.()
            }}
            className="shrink-0 cursor-pointer rounded text-[var(--neutral400)] transition-colors hover:text-[var(--neutral700)]"
        >
            <X size={16} aria-hidden />
        </button>
    )

    const actionButton = actionLabel && (
        <button
            type="button"
            onClick={onAction}
            className={cn(
                "inline-flex shrink-0 cursor-pointer rounded-[6px] px-3.5 py-1.5 text-xs font-medium transition-colors",
                c.action
            )}
        >
            {actionLabel}
        </button>
    )

    return (
        <div
            role="alert"
            className={cn(
                "rounded-[var(--radius-md)] border border-[var(--neutral100)] bg-[var(--neutral0)] p-4 shadow-sm",
                className
            )}
        >
            <div className="flex items-start gap-3">
                <Icon size={18} className={cn("mt-0.5 shrink-0", c.icon)} aria-hidden />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                        <p className={cn("text-sm font-semibold", c.title)}>{title}</p>
                        {layout === "inline" ? (
                            <div className="flex shrink-0 items-center gap-3">
                                {actionButton}
                                {closeButton}
                            </div>
                        ) : (
                            closeButton
                        )}
                    </div>
                    {children && <p className="mt-1 text-sm text-[var(--neutral500)]">{children}</p>}
                    {layout === "stacked" && actionButton && <div className="mt-3">{actionButton}</div>}
                </div>
            </div>
        </div>
    )
}
