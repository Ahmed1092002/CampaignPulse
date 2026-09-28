'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/DropdownMenu';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationBell } from './NotificationBell';
import { Menu, Bell, Moon, Sun, Monitor, Globe, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { locales, localeNames, isRTL } from '@/lib/i18n/config';
import { useTranslations } from 'next-intl';

export function Header() {
  const pathname = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen, theme, setTheme, locale, setLocale } = useUIStore();
  const { user, logout, currentWorkspace, workspaces, switchWorkspace } = useAuthStore();
  const t = useTranslations('common');
  const isRTL = locale === 'ar';

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleWorkspaceChange = (workspaceId: string) => {
    switchWorkspace(workspaceId);
    setUserMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur-sm border-b">
      <div className="container-app h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Open menu"
            aria-expanded={mobileSidebarOpen}
            aria-controls="mobile-sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link href="/dashboard" className="hidden lg:flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-semibold text-lg">CampaignPulse</span>
          </Link>

          {currentWorkspace && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors">
                  <span className="truncate max-w-[150px]">{currentWorkspace.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.workspace.id}
                    onClick={() => handleWorkspaceChange(ws.workspace.id)}
                    className={ws.workspace.id === currentWorkspace.id ? 'bg-primary/10 text-primary' : ''}
                  >
                    {ws.workspace.name}
                    {ws.workspace.id === currentWorkspace.id && <span className="ml-auto text-xs text-primary">Active</span>}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {}}>Create new workspace</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />

            <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Language">
                <Globe className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Language</DropdownMenuLabel>
              {locales.map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={locale === loc ? 'bg-primary/10 text-primary' : ''}
                >
                  {localeNames[loc]}
                  {isRTL(loc) && <span className="ml-auto text-xs">RTL</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-accent transition-colors" aria-label="User menu">
                <Avatar
                  src={user?.avatarUrl}
                  fallback={`${user?.firstName} ${user?.lastName}`}
                  size="sm"
                  alt={user?.email}
                />
                <span className="hidden sm:block text-sm font-medium truncate max-w-[120px]">
                  {user?.firstName} {user?.lastName}
                </span>
                <ChevronDown className="hidden sm:block h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {}} icon={<User className="h-4 w-4" />}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}} icon={<Settings className="h-4 w-4" />}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} icon={<LogOut className="h-4 w-4" />} className="text-destructive focus:text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}