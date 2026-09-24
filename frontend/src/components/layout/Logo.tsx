'use client';

import { cn } from '@/lib/utils';
import { Zap, Target } from 'lucide-react';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl blur-xl" />
        <div className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
          <Target className="h-6 w-6 text-primary-foreground" />
          <Zap className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400" />
        </div>
      </div>
    </div>
  );
}