'use client';

import { ImgHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  ({ className, fallback, size = 'md', src, alt, ...props }, ref) => {
    const [imageError, setImageError] = useState(false);

    if (imageError || !src) {
      const initials = fallback
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      return (
        <div
          ref={ref}
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium',
            sizeClasses[size],
            className
          )}
          aria-label={alt || fallback}
        >
          {initials || '?'}
        </div>
      );
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt || fallback || ''}
        className={cn('inline-flex rounded-full object-cover', sizeClasses[size], className)}
        onError={() => setImageError(true)}
        {...props}
      />
    );
  }
);
Avatar.displayName = 'Avatar';