import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-md border border-input bg-card px-3 py-2.5 text-[15px] text-foreground transition-colors outline-none placeholder:text-muted-foreground/70 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
