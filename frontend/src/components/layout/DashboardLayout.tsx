'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen, mobileSidebarOpen } = useUIStore();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-200 ease-in-out',
          sidebarOpen && !isMobile ? 'lg:ml-64' : 'lg:ml-20',
          isMobile && mobileSidebarOpen && 'lg:ml-64'
        )}
      >
        <Header />
        <main className="container-app py-6" id="main-content" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}