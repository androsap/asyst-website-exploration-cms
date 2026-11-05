"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react"

// Toast bergaya Atlas Alert/Toast (src/components/ui/toast.tsx + notification.ts):
// surface putih, border neutral100, shadow besar, ikon & judul berwarna per status,
// posisi kanan bawah. Tetap memakai sonner agar API `toast.success()` dll. tidak berubah.
const Toaster = (props: ToasterProps) => (
    <Sonner
        position="bottom-right"
        gap={8}
        icons={{
            success: <CheckCircle2 size={18} className="text-[var(--success500)]" />,
            info: <Info size={18} className="text-[var(--info500)]" />,
            warning: <AlertTriangle size={18} className="text-[var(--warning500)]" />,
            error: <XCircle size={18} className="text-[var(--danger500)]" />,
            loading: <Loader2 size={18} className="animate-spin text-[var(--neutral500)]" />,
        }}
        toastOptions={{
            unstyled: true,
            classNames: {
                toast:
                    "flex w-[360px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-[var(--border2xs)] border border-[var(--neutral100)] bg-[var(--neutral0)] p-4 shadow-xl",
                icon: "mt-0.5 shrink-0",
                content: "min-w-0 flex-1",
                title: "text-sm font-semibold text-[var(--neutral900)]",
                description: "mt-1 text-sm text-[var(--neutral500)]",
                success: "[&_[data-title]]:text-[var(--success600)]",
                info: "[&_[data-title]]:text-[var(--info600)]",
                warning: "[&_[data-title]]:text-[var(--warning600)]",
                error: "[&_[data-title]]:text-[var(--danger600)]",
                actionButton:
                    "rounded-[6px] bg-[var(--neutral900)] px-3 py-1.5 text-xs font-medium text-[var(--neutral0)] hover:bg-[var(--neutral800)]",
                closeButton: "text-[var(--neutral400)] hover:text-[var(--neutral700)]",
            },
        }}
        {...props}
    />
)

export { Toaster }
