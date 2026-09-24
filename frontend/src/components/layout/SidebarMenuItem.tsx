'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarMenuItemProps {
  item: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: Array<{ name: string; href: string; icon: React.ComponentType<{ className?: string }> }>;
  };
  pathname: string;
  sidebarOpen: boolean;
  isMobile: boolean;
}

export function SidebarMenuItem({ item, pathname, sidebarOpen, isMobile }: SidebarMenuItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = pathname === item.href || (item.children && item.children.some(child => pathname.startsWith(child.href)));
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren && sidebarOpen) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  if (hasChildren) {
    return (
      <div className="group">
        <button
          onClick={handleClick}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            !sidebarOpen && !isMobile && 'justify-center'
          )}
          aria-expanded={isOpen}
          aria-controls={isOpen ? `${item.name}-submenu` : undefined}
        >
          <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          {sidebarOpen && !isMobile && <span>{item.name}</span>}
          {sidebarOpen && !isMobile && (
            <span className={cn('ml-auto transition-transform', isOpen && 'rotate-180')}>
              <ChevronDown className="h-4 w-4" />
            </span>
          )}
        </button>
        {sidebarOpen && !isMobile && isOpen && (
          <ul id={`${item.name}-submenu`} className="mt-1 ml-10 space-y-1 animate-slide-down" role="menu">
            {item.children!.map((child) => {
              const ChildIcon = child.icon;
              const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
              return (
                <li key={child.name} role="none">
                  <Link
                    href={child.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      childActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                    role="menuitem"
                    aria-current={childActive ? 'page' : undefined}
                  >
                    <ChildIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span>{child.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {!sidebarOpen && !isMobile && isOpen && (
          <div className="absolute left-full top-0 w-48 bg-card border rounded-lg shadow-lg p-2 animate-scale-in z-50" role="menu">
            {item.children!.map((child) => {
              const ChildIcon = child.icon;
              const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    childActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  role="menuitem"
                  aria-current={childActive ? 'page' : undefined}
                >
                  <ChildIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>{child.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        !sidebarOpen && !isMobile && 'justify-center'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      {sidebarOpen && !isMobile && <span>{item.name}</span>}
    </Link>
  );
}