'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
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
  const triggerRef = useRef<HTMLElement>(null);
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
    <>
      <span ref={triggerRef} onClick={handleTriggerClick} className="inline-block">
        {isOpen ? children : Array.isArray(children) ? children[0] : children}
      </span>
      {isOpen && (
        <Portal>
          <div
            ref={contentRef}
            className={cn(
              'fixed z-50 min-w-[8rem] origin-top-right rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg animate-scale-in',
              className
            )}
            style={{ 
              top: triggerRef.current?.getBoundingClientRect().bottom ? `${triggerRef.current.getBoundingClientRect().bottom + 5}px` : 0,
              left: triggerRef.current?.getBoundingClientRect().left ? `${triggerRef.current.getBoundingClientRect().left}px` : 0,
            }}
            role="menu"
            aria-orientation="vertical"
          >
            {Array.isArray(children) ? children[1] : null}
          </div>
        </Portal>
      )}
    </>
  );
}

interface PopoverTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export function PopoverTrigger({ children, asChild = false }: PopoverTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { onClick: undefined });
  }
  return <>{children}</>;
}

interface PopoverContentProps {
  children: ReactNode;
  className?: string;
  sideOffset?: number;
  align?: 'start' | 'end' | 'center';
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function PopoverContent({ children, className, sideOffset = 4, align = 'end', side = 'bottom' }: PopoverContentProps) {
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
        align === 'center' && 'left-1/2 -translate-x-1/2',
        className
      )}
      style={{ marginTop: side === 'bottom' ? sideOffset : side === 'top' ? -sideOffset : 0 }}
      role="menu"
      aria-orientation="vertical"
    >
      {children}
    </div>
  );
}

import React from 'react';