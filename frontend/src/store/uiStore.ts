import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Locale } from '@/lib/i18n/config';

interface UIState {
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  locale: Locale;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
  }>;
  modals: Record<string, boolean>;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLocale: (locale: Locale) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => string;
  removeNotification: (id: string) => void;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      mobileSidebarOpen: false,
      theme: 'system',
      locale: 'en',
      notifications: [],
      modals: {},

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

      setTheme: (theme) => {
        const root = document.documentElement;
        if (theme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', prefersDark);
        } else {
          root.classList.toggle('dark', theme === 'dark');
        }
        set({ theme });
      },

      setLocale: (locale) => {
        set({ locale });
        document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = locale;
      },

      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification = { ...notification, id };
        set((state) => ({ notifications: [...state.notifications, newNotification] }));
        
        const duration = notification.duration ?? 5000;
        setTimeout(() => {
          get().removeNotification(id);
        }, duration);
        
        return id;
      },

      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),

      openModal: (id) => set((state) => ({ modals: { ...state.modals, [id]: true } })),
      closeModal: (id) => set((state) => {
        const { [id]: _, ...rest } = state.modals;
        return { modals: rest };
      }),
      closeAllModals: () => set({ modals: {} }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        locale: state.locale,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  const { theme, locale } = useUIStore.getState();
  const root = document.documentElement;
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
  
  root.dir = locale === 'ar' ? 'rtl' : 'ltr';
  root.lang = locale;
}