'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
import { Portal } from './Portal';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  name?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  disabled,
  required,
  error,
  label,
  name,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (triggerRef.current?.contains(event.target as Node) || contentRef.current?.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div ref={selectRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[placeholder]:text-muted-foreground',
          className
        )}
        onClick={handleTriggerClick}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        id={name}
      >
        <span className="truncate">
          {value ? options.find(o => o.value === value)?.label : placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 opacity-50', isOpen && 'rotate-180')} aria-hidden="true" />
      </button>

      {isOpen && (
        <Portal>
          <div
            ref={contentRef}
            className={cn(
              'fixed z-50 min-w-[8rem] origin-top-right rounded-md border bg-popover p-1 text-popover-foreground shadow-lg animate-scale-in',
              side === 'bottom' && 'top-full mt-1',
              side === 'top' && 'bottom-full mb-1',
              side === 'left' && 'right-full mr-1',
              side === 'right' && 'left-full ml-1',
              align === 'start' && 'left-0',
              align === 'end' && 'right-0',
              align === 'center' && 'left-1/2 -translate-x-1/2'
            )}
            style={{ marginTop: side === 'bottom' ? 4 : side === 'top' ? -4 : 0 }}
            role="listbox"
            aria-orientation="vertical"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onValueChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                  'focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  value === option.value && 'bg-primary text-primary-foreground'
                )}
                role="option"
                aria-selected={value === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Portal>
      )}
    </div>
  );
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  name?: string;
  align?: 'start' | 'end' | 'center';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}

import { Fragment, ReactNode, useRef, useState, useEffect } from 'react';
import { Portal } from './Portal';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';