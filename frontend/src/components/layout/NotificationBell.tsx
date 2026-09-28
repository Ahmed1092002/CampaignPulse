'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { useNotifications } from '@/hooks/useRealTime';
import { formatDate } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('notifications');

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsRead();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96" align="end" onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-2">
          <CardTitle className="text-sm">Notifications</CardTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 20).map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className={cn('p-3', !notification.isRead && 'bg-primary/5')}
                onSelect={(e) => handleMarkAsRead(notification.id, e)}
              >
                <div className="flex items-start gap-3">
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.createdAt, undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {!notification.isRead && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleMarkAsRead}>
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        {notifications.length > 20 && (
          <DropdownMenuSeparator />
        )}
        <DropdownMenuItem className="text-center text-primary">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}