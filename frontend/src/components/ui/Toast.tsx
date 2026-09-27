'use client';

import { Fragment, ReactNode, useRef, useState } from 'react';
import { Portal } from './Portal';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastProps {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

function Toast({ title, description, type = 'info', duration = 5000 }: ToastProps) {
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

interface ToastContextType {
  toasts: Toast[];
  toast: (options: Omit<ToastProps, 'id'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...options, id };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, options.duration);
    
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function useToastHelpers() {
  const { toast } = useToast();
  
  return {
    success: (title: string, description?: string) => toast({ title, description, type: 'success' }),
    error: (title: string, description?: string) => toast({ title, description, type: 'error' }),
    warning: (title: string, description?: string) => toast({ title, description, type: 'warning' }),
    info: (title: string, description?: string) => toast({ title, description, type: 'info' }),
  };
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <Fragment>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[380px] lg:w-[420px]">
        {toasts.map(({ id, title, description, type, duration }) => (
          <Toast key={id} title={title} description={description} type={type} duration={duration} />
        ))}
      </div>
    </Fragment>
  );
}

import { Fragment, useCallback, useContext, useState, ReactNode } from 'react';
import { createContext, useContext } from 'react';