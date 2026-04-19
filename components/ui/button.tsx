import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-brand-foreground hover:bg-brand/90 active:bg-brand/95",
        outline:
          "border-border bg-background text-foreground hover:bg-paper-soft hover:border-foreground/30",
        secondary:
          "bg-secondary text-foreground hover:bg-secondary/70",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-paper-soft",
        destructive:
          "bg-destructive text-brand-foreground hover:bg-destructive/90",
        link:
          "text-brand underline-offset-4 hover:underline px-0 h-auto",
      },
      size: {
        default: "h-10 gap-2 px-4",
        xs: "h-7 gap-1 rounded px-2 text-xs",
        sm: "h-8 gap-1.5 rounded px-3 text-[13px]",
        lg: "h-11 gap-2 px-5 text-[15px]",
        icon: "size-10",
        "icon-xs": "size-7 rounded",
        "icon-sm": "size-8 rounded",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
