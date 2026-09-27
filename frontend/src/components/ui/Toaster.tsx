'use client';

import { Fragment, ReactNode, useRef, useState } from 'react';
import { Portal } from './Portal';
import { cn } from '@/lib/utils';
import { ChevronDown, Check, X } from 'lucide-react';

interface ToastProps {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function Toast({ title, description, type = 'info', duration = 5000 }: ToastProps) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const colors = {
    success: 'border-green-500/50 bg-green-500/10',
    error: 'border-red-500/50 bg-red-500/10',
    warning: 'border-yellow-500/50 bg-yellow-500/10',
    info: 'border-blue-500/50 bg-blue-500/10',
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-up ${colors[type]}`}>
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';