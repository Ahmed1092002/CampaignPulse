'use client';

import { Fragment, ReactNode, useRef, useState, useEffect } from 'react';
import { Portal } from './Portal';
import { cn } from '@/lib/utils';
import { ChevronDown, Check, X } from 'lucide-react';

interface DropdownMenuProps {
  trigger: ReactNode;
  content: ReactNode;
  align?: 'start' | 'end' | 'center';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}

export function DropdownMenu({ trigger, content, align = 'start', side = 'bottom', sideOffset = 4 }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const toggle = () => setIsOpen(!isOpen);

  return (
    <Fragment>
      <span ref={triggerRef} onClick={toggle} className="inline-block">
        {trigger}
      </span>
      {isOpen && (
        <Portal>
          <div
            ref={contentRef}
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
            {content}
          </div>
        </Portal>
      )}
    </Fragment>
  );
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  inset?: boolean;
  shortcut?: string;
  icon?: ReactNode;
}

export function DropdownMenuItem({ children, onClick, disabled, destructive, inset, shortcut, icon }: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        destructive && 'text-destructive focus:text-destructive',
        inset && 'pl-8'
      )}
      role="menuitem"
      aria-disabled={disabled}
    >
      {icon && <span className="mr-2 h-4 w-4" aria-hidden="true">{icon}</span>}
      {children}
      {shortcut && <span className="ml-auto text-xs text-muted-foreground">{shortcut}</span>}
    </button>
  );
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <div className={cn('-mx-1 my-1 h-px bg-border', className)} role="separator" />;
}

interface DropdownMenuLabelProps {
  children: ReactNode;
  className?: string;
  inset?: boolean;
}

export function DropdownMenuLabel({ children, className, inset }: DropdownMenuLabelProps) {
  return (
    <div className={cn('px-2 py-1.5 text-sm font-semibold text-muted-foreground', inset && 'pl-8', className)}>
      {children}
    </div>
  );
}

interface DropdownMenuCheckboxItemProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}

export function DropdownMenuCheckboxItem({ checked, onCheckedChange, children, disabled }: DropdownMenuCheckboxItemProps) {
  return (
    <button
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
      )}
      role="menuitemcheckbox"
      aria-checked={checked}
      aria-disabled={disabled}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked ? <Check className="h-4 w-4" /> : null}
      </span>
      {children}
    </button>
  );
}

interface DropdownMenuRadioItemProps {
  value: string;
  checked: boolean;
  onValueChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}

export function DropdownMenuRadioItem({ value, checked, onValueChange, children, disabled }: DropdownMenuRadioItemProps) {
  return (
    <button
      onClick={() => !disabled && onValueChange(value)}
      disabled={disabled}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
      )}
      role="menuitemradio"
      aria-checked={checked}
      aria-disabled={disabled}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked ? <span className="h-2 w-2 rounded-full bg-current" /> : null}
      </span>
      {children}
    </button>
  );
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function DropdownMenuTrigger({ children, className, ...props }: DropdownMenuTriggerProps) {
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

interface DropdownMenuContentProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end' | 'center';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}

export function DropdownMenuContent({ children, className, align = 'end', side = 'bottom', sideOffset = 4 }: DropdownMenuContentProps) {
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