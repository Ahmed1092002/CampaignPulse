'use client';

import { ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const setTheme = useUIStore(state => state.setTheme);
  const setLocale = useUIStore(state => state.setLocale);
  const theme = useUIStore(state => state.theme);
  const locale = useUIStore(state => state.locale);

  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          gcTime: 1000 * 60 * 30, // 30 minutes
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    })
  );

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  useEffect(() => {
    setLocale(locale);
  }, [locale, setLocale]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

import { useState } from 'react';