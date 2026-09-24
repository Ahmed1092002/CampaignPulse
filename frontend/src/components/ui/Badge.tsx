'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary/10 text-primary',
      secondary: 'bg-secondary text-secondary-foreground',
      success: 'bg-success-500/10 text-success-600 dark:text-success-500',
      warning: 'bg-warning-500/10 text-warning-600 dark:text-warning-500',
      danger: 'bg-destructive/10 text-destructive',
      outline: 'border border-input',
    };

    return (
      <span
        ref={ref}
        className={twMerge(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    DRAFT: { label: 'Draft', variant: 'secondary' },
    PUBLISHED: { label: 'Published', variant: 'success' },
    PAUSED: { label: 'Paused', variant: 'warning' },
    ARCHIVED: { label: 'Archived', variant: 'outline' },
    NEW: { label: 'New', variant: 'primary' },
    CONTACTED: { label: 'Contacted', variant: 'secondary' },
    QUALIFIED: { label: 'Qualified', variant: 'success' },
    WON: { label: 'Won', variant: 'success' },
    LOST: { label: 'Lost', variant: 'danger' },
    PAGE_VIEW: { label: 'Page View', variant: 'primary' },
    CTA_CLICK: { label: 'CTA Click', variant: 'secondary' },
    FORM_START: { label: 'Form Start', variant: 'warning' },
    FORM_SUBMIT: { label: 'Form Submit', variant: 'success' },
  };

  const config = statusConfig[status] || { label: status, variant: 'secondary' };
  return config;
}