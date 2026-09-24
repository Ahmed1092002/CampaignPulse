'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, checked, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const refCallback = (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate]);

    return (
      <div className="relative flex items-center">
        <input
          type="checkbox"
          ref={refCallback}
          className={cn(
            'peer h-4 w-4 shrink-0 rounded-sm border border-input bg-background text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
            className
          )}
          checked={checked}
          {...props}
        />
        <span className={cn('absolute inset-0 flex items-center justify-center text-[13px]')}>
          <Check className={cn('h-4 w-4 text-primary-foreground', 'peer-data-[state=unchecked]:hidden')} />
        </span>
      </div>
    );
  }
);

import { useRef, useEffect } from 'react';

Checkbox.displayName = 'Checkbox';