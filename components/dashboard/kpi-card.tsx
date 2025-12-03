'use client';

import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  previousValue,
  change,
  changeLabel,
  icon,
  variant = 'default',
  size = 'md',
  loading = false,
}: KPICardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  const variantStyles = {
    default: 'bg-card',
    success: 'bg-emerald-50 dark:bg-emerald-950/20',
    warning: 'bg-amber-50 dark:bg-amber-950/20',
    danger: 'bg-red-50 dark:bg-red-950/20',
  };

  const iconContainerStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
    danger: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
  };

  const sizeStyles = {
    sm: {
      container: 'p-3',
      title: 'text-xs',
      value: 'text-lg font-semibold',
      icon: 'h-8 w-8',
      iconSize: 'h-4 w-4',
    },
    md: {
      container: 'p-4',
      title: 'text-sm',
      value: 'text-2xl font-bold',
      icon: 'h-10 w-10',
      iconSize: 'h-5 w-5',
    },
    lg: {
      container: 'p-5',
      title: 'text-sm',
      value: 'text-3xl font-bold',
      icon: 'h-12 w-12',
      iconSize: 'h-6 w-6',
    },
  };

  if (loading) {
    return (
      <div className={cn(
        'rounded-xl border',
        variantStyles[variant],
        sizeStyles[size].container
      )}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/2 mb-2" />
          <div className="h-8 bg-muted rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border transition-shadow hover:shadow-md',
      variantStyles[variant],
      sizeStyles[size].container
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-muted-foreground font-medium truncate',
            sizeStyles[size].title
          )}>
            {title}
          </p>
          <p className={cn(
            'text-foreground mt-1 truncate',
            sizeStyles[size].value
          )}>
            {value}
          </p>

          {(change !== undefined || previousValue) && (
            <div className="flex items-center gap-2 mt-2">
              {change !== undefined && (
                <span className={cn(
                  'inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5',
                  isPositive && 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/50',
                  isNegative && 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/50',
                  isNeutral && 'text-muted-foreground bg-muted'
                )}>
                  {isPositive && <ArrowUp className="h-3 w-3 mr-0.5" />}
                  {isNegative && <ArrowDown className="h-3 w-3 mr-0.5" />}
                  {isNeutral && <Minus className="h-3 w-3 mr-0.5" />}
                  {Math.abs(change).toFixed(1)}%
                </span>
              )}
              {changeLabel && (
                <span className="text-xs text-muted-foreground truncate">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className={cn(
            'rounded-xl flex items-center justify-center shrink-0',
            iconContainerStyles[variant],
            sizeStyles[size].icon
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
