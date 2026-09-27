'use client';

import { Fragment, ReactNode, useRef, useState, useEffect } from 'react';
import { Portal } from './Portal';
import { cn } from '@/lib/utils';

interface PopoverProps {
  children: ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export function Popover({ children, className, open, onOpenChange, defaultOpen = false }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const controlled = open !== undefined;

  useEffect(() => {
    if (controlled) {
      setIsOpen(open);
    }
  }, [open, controlled]);

  const handleTriggerClick = () => {
    if (controlled) {
      onOpenChange?.(!isOpen);
    } else {
      setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (triggerRef.current?.contains(event.target as Node) || contentRef.current?.contains(event.target as Node)) {
        return;
      }
      if (!controlled) setIsOpen(false);
      onOpenChange?.(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, controlled, onOpenChange]);

  return (
    <Fragment>
      <span ref={triggerRef} onClick={handleTriggerClick} className="inline-block">
        {children}
      </span>
      {isOpen && (
        <Portal>
          <div
            ref={contentRef}
            className={cn(
              'fixed z-50 min-w-[8rem] origin-top-right rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg animate-scale-in',
              className
            )}
            role="menu"
            aria-orientation="vertical"
          >
            {content}
          </div>
        </Portal>
      )}
    </Fragment>
  );
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function PopoverTrigger({ children, className, ...props }: PopoverTriggerProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

interface PopoverContentProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end' | 'center';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}

export function PopoverContent({ children, className, align = 'end', side = 'bottom', sideOffset = 4 }: PopoverContentProps) {
  return (
    <div
      className={cn(
        'fixed z-50 min-w-[8rem] origin-top-right rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg animate-scale-in',
        side === 'bottom' && 'top-full mt-1',
        side === 'top' && 'bottom-full mb-1',
        side === 'left' && 'right-full mr-1',
        side === 'right' && 'left-full ml-1',
        align === 'start' && 'left-0',
        align === 'end' && 'right-0',
        align === 'center' && 'left-1/2 -translate-x-1/2'
      )}
      style={{ marginTop: side === 'bottom' ? sideOffset : side === 'top' ? -sideOffset : 0 }}
      role="menu"
      aria-orientation="vertical"
    >
      {children}
    </div>
  );
}

export const DropdownMenuGroup = ({ children }: { children: ReactNode }) => <Fragment>{children}</Fragment>;

import { ChevronDown } from 'lucide-react';