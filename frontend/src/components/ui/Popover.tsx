'use client';

import { Fragment, ReactNode, useRef, useState, useEffect, useContext, createContext } from 'react';
import { Portal } from './Portal';
import { cn } from '@/lib/utils';

interface PopoverContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  controlled: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PopoverContext = createContext<PopoverContextType | null>(null);

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

  const handleOpenChange = (newOpen: boolean) => {
    if (controlled) {
      onOpenChange?.(newOpen);
    } else {
      setIsOpen(newOpen);
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
    <PopoverContext.Provider value={{ isOpen, setIsOpen: handleOpenChange, triggerRef, contentRef, controlled, onOpenChange }}>
      <Fragment>
        <span ref={triggerRef} className="inline-block">
          {typeof children === 'function' ? children({ isOpen, open: handleOpenChange, close: () => handleOpenChange(false) }) : children}
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
              {typeof children === 'function' ? null : children}
            </div>
          </Portal>
        )}
      </Fragment>
    </PopoverContext.Provider>
  );
}

function usePopoverContext() {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('Popover compound components must be used within Popover');
  }
  return context;
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  asChild?: boolean;
}

export function PopoverTrigger({ children, className, asChild, ...props }: PopoverTriggerProps) {
  const { isOpen, setIsOpen, triggerRef } = usePopoverContext();

  const child = React.Children.only(children);
  
  if (asChild) {
    return React.cloneElement(child as React.ReactElement<any>, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        setIsOpen(!isOpen);
        child.props.onClick?.(e);
      },
      ...props,
    });
  }

  return (
    <button
      ref={triggerRef}
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {children}
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
  const { isOpen, contentRef } = usePopoverContext();

  if (!isOpen) return null;

  return (
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
        {children}
      </div>
    </Portal>
  );
}