'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'text', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-muted',
        variant === 'text' && 'h-4 w-full',
        variant === 'circular' && 'h-10 w-10 rounded-full',
        variant === 'rectangular' && 'h-16 w-full rounded-lg',
        className
      )}
      {...props}
    />
  );
}