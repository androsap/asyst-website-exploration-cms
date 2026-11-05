import * as React from "react"
import { cn } from "@/lib/utils"
import { atlasFieldClasses } from "./input"

// Atlas Textarea: padding px-3 py-2.5, gaya border/fokus sama dengan Input.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(atlasFieldClasses, "flex min-h-20 px-3 py-2.5 leading-5", className)}
            {...props}
        />
    )
}

export { Textarea }
