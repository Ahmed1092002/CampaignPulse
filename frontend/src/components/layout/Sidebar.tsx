'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { SidebarMenuItem } from './SidebarMenuItem';
import { Logo } from './Logo';
import { ChevronLeft, ChevronRight, LayoutDashboard, Users, BarChart2, Settings, FileText, Target, Zap, Shield } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/campaigns', icon: Target },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  { name: 'Settings', href: '/settings', icon: Settings, children: [
    { name: 'Team', href: '/settings/team', icon: Users },
    { name: 'Workspace', href: '/settings/workspace', icon: Shield },
    { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, mobileSidebarOpen, setMobileSidebarOpen, locale } = useUIStore();
  const { currentWorkspace, user } = useAuthStore();
  const isRTL = locale === 'ar';

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  if (isMobile && !mobileSidebarOpen) {
    return null;
  }

  return (
    <>
      {isMobile && mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-card border-r transition-all duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'w-64' : 'w-20',
          isMobile && mobileSidebarOpen ? 'w-64 translate-x-0' : isMobile ? '-translate-x-full' : '',
          isRTL && 'left-auto right-0'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              {sidebarOpen && !isMobile && <span className="font-semibold text-lg">CampaignPulse</span>}
            </Link>
            {!isMobile && (
              <button
                onClick={() => useUIStore.getState().setSidebarOpen(!sidebarOpen)}
                className={cn('p-2 rounded-lg hover:bg-accent transition-colors', isRTL && 'rotate-180')}
                aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                aria-expanded={sidebarOpen}
              >
                {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </button>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
            {navigation.map((item) => (
              <SidebarMenuItem
                key={item.name}
                item={item}
                pathname={pathname}
                sidebarOpen={sidebarOpen && !isMobile}
                isMobile={isMobile}
              />
            ))}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              {sidebarOpen && !isMobile && (
                <div className="flex items-center gap-2">
                  <Link href="/settings/profile" className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Profile settings">
                    <Settings className="h-5 w-5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}