import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        success:
          "border-transparent bg-success text-success-foreground",
        warning:
          "border-transparent bg-warning text-warning-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        info:
          "border-transparent bg-info text-info-foreground",
        outline:
          "text-foreground border-border",
        // Pastel variants - softer colors
        "primary-pastel":
          "border-transparent bg-primary/10 text-primary",
        "success-pastel":
          "border-transparent bg-[hsl(152,60%,92%)] text-[hsl(152,60%,35%)]",
        "warning-pastel":
          "border-transparent bg-[hsl(38,90%,92%)] text-[hsl(38,70%,35%)]",
        "destructive-pastel":
          "border-transparent bg-[hsl(0,70%,94%)] text-[hsl(0,72%,45%)]",
        "info-pastel":
          "border-transparent bg-[hsl(217,90%,94%)] text-[hsl(217,91%,50%)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
