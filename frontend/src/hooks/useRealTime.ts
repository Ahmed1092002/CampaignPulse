import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

interface RealTimeEvents {
  'notification:new': (notification: Notification) => void;
  'lead:created': (lead: any) => void;
  'lead:updated': (lead: any) => void;
  'campaign:published': (campaign: any) => void;
  'analytics:update': (data: any) => void;
}

export function useRealTime() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { workspaceId, accessToken } = useAuthStore();

  useEffect(() => {
    if (!workspaceId || !accessToken) return;

    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`, {
      auth: { token: accessToken },
      query: { workspaceId },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Real-time connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Real-time disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Real-time connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [workspaceId, accessToken]);

  const on = useCallback(<K extends keyof RealTimeEvents>(event: K, handler: RealTimeEvents[K]) => {
    socket?.on(event, handler);
    return () => socket?.off(event, handler);
  }, [socket]);

  const off = useCallback(<K extends keyof RealTimeEvents>(event: K, handler?: RealTimeEvents[K]) => {
    socket?.off(event, handler);
  }, [socket]);

  const emit = useCallback((event: string, data: any) => {
    socket?.emit(event, data);
  }, [socket]);

  return { socket, isConnected, on, off, emit };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { on, off } = useRealTime();

  useEffect(() => {
    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const workspaceId = useAuthStore.getState().workspaceId;
        if (workspaceId) {
          const response = await api.notification.getAll(workspaceId, { limit: 50 });
          setNotifications(response.data?.logs || []);
          setUnreadCount(response.data?.logs?.filter((n: Notification) => !n.isRead).length || 0);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();

    const unsubscribe = on('notification:new', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      // Show toast notification
      // You can integrate with your toast library here
    });

    return () => {
      unsubscribe();
    };
  }, [on]);

  const markAsRead = async (id: string) => {
    try {
      const workspaceId = useAuthStore.getState().workspaceId;
      if (workspaceId) {
        await api.notification.markAsRead(workspaceId, id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const workspaceId = useAuthStore.getState().workspaceId;
      if (workspaceId) {
        await api.notification.markAllAsRead(workspaceId);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}

export function useRealTimeLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const { on, off } = useRealTime();

  useEffect(() => {
    const unsubscribeCreated = on('lead:created', (lead: any) => {
      setLeads(prev => [lead, ...prev]);
    });

    const unsubscribeUpdated = on('lead:updated', (lead: any) => {
      setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [on]);

  return { leads };
}

export function useRealTimeAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const { on, off } = useRealTime();

  useEffect(() => {
    const unsubscribe = on('analytics:update', (data: any) => {
      setAnalytics(data);
    });

    return () => unsubscribe();
  }, [on]);

  return { analytics };
}