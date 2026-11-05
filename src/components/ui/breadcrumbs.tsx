// Atlas Design System — disalin dari github.com/androsap/atlas-design-system (src/components/ui/breadcrumbs.tsx)
import { Fragment } from "react"
import Link from "next/link"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type BreadcrumbState = "default" | "hover" | "active"

export interface BreadcrumbItem {
    /** Visible text. Optional when icon is set and the crumb should read as
     * icon-only — pass label anyway; it's still used for the accessible name. */
    label: string
    href?: string
    icon?: LucideIcon
    hideLabel?: boolean
    /** Docs-only: force this item's visual state instead of deriving it from
     * real hover or its position in the trail (the same technique as
     * Chip/Switch's `focused` prop) — used to show Default/Hover/Active
     * side by side in the Variants tab. */
    forceState?: BreadcrumbState
}

export interface BreadcrumbsProps {
    items: BreadcrumbItem[]
    className?: string
}

const STATE_CLASSES: Record<BreadcrumbState, string> = {
    default: "text-[var(--neutral500)]",
    hover: "text-[var(--text-link)]",
    active: "font-medium text-[var(--neutral900)]",
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb" className={className}>
            <ol className="flex flex-wrap items-center gap-1.5 text-sm">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1
                    const state: BreadcrumbState = item.forceState ?? (isLast ? "active" : "default")
                    // The current page is never a link, regardless of forceState.
                    const isLink = !!item.href && state !== "active"
                    const Icon = item.icon

                    const content = (
                        <>
                            {Icon && <Icon size={15} className="shrink-0" aria-hidden />}
                            <span className={cn(item.hideLabel && "sr-only")}>{item.label}</span>
                        </>
                    )

                    return (
                        <Fragment key={`${item.label}-${index}`}>
                            {index > 0 && (
                                <ChevronRight size={14} className="shrink-0 text-[var(--neutral300)]" aria-hidden />
                            )}
                            <li className="flex items-center">
                                {isLink ? (
                                    <Link
                                        href={item.href!}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-sm transition-colors",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary300)]",
                                            item.forceState === "hover"
                                                ? STATE_CLASSES.hover
                                                : cn(STATE_CLASSES.default, "hover:text-[var(--text-link)]")
                                        )}
                                    >
                                        {content}
                                    </Link>
                                ) : (
                                    <span
                                        aria-current={state === "active" ? "page" : undefined}
                                        className={cn("flex items-center gap-1.5", STATE_CLASSES[state])}
                                    >
                                        {content}
                                    </span>
                                )}
                            </li>
                        </Fragment>
                    )
                })}
            </ol>
        </nav>
    )
}
