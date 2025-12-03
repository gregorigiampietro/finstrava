import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

const statCardVariants = cva(
    "relative overflow-hidden",
    {
        variants: {
            variant: {
                default: "",
                primary: "",
                success: "",
                warning: "",
                danger: "",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
    label: string
    value: string | number
    icon?: React.ReactNode
    trend?: number
    trendLabel?: string
    previousValue?: string
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
    ({ className, variant, label, value, icon, trend, trendLabel, previousValue, ...props }, ref) => {
        const isPositive = trend !== undefined && trend >= 0
        const isNegative = trend !== undefined && trend < 0

        const getTrendBadgeClasses = () => {
            if (isPositive) return "bg-[hsl(152,60%,92%)] text-[hsl(152,60%,35%)]"
            if (isNegative) return "bg-[hsl(0,70%,94%)] text-[hsl(0,72%,45%)]"
            return "bg-muted text-muted-foreground"
        }

        return (
            <Card ref={ref} className={cn(statCardVariants({ variant }), "p-4 sm:p-5", className)} {...props}>
                {/* Header with label and icon */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                    </span>
                    {icon && (
                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            {icon}
                        </div>
                    )}
                </div>

                {/* Value with trend badge */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                        {value}
                    </span>
                    {trend !== undefined && (
                        <span className={cn(
                            "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium",
                            getTrendBadgeClasses()
                        )}>
                            {isPositive ? (
                                <ArrowUpIcon className="w-3 h-3" />
                            ) : (
                                <ArrowDownIcon className="w-3 h-3" />
                            )}
                            {Math.abs(trend)}%
                        </span>
                    )}
                </div>

                {/* Previous value comparison */}
                {(previousValue || trendLabel) && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        {previousValue && (
                            <span className="font-medium">{previousValue}</span>
                        )}
                        {previousValue && trendLabel && " "}
                        {trendLabel}
                    </p>
                )}
            </Card>
        )
    }
)
StatCard.displayName = "StatCard"

export { StatCard, statCardVariants }
