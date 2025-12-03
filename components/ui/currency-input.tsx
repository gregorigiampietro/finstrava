'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    // Format number to BRL display format
    const formatToBRL = (num: number): string => {
      return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    // Parse BRL string to number
    const parseBRL = (str: string): number => {
      // Remove everything except digits
      const digits = str.replace(/\D/g, '');
      // Convert to number with 2 decimal places
      return parseInt(digits || '0', 10) / 100;
    };

    // Initialize display value
    React.useEffect(() => {
      setDisplayValue(formatToBRL(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const numericValue = parseBRL(inputValue);

      // Update display with formatted value
      setDisplayValue(formatToBRL(numericValue));

      // Call onChange with numeric value
      onChange(numericValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Select all text on focus for easy editing
      e.target.select();
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
