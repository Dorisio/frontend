/**
 * App Store
 * Manages general app state
 */

import { create } from 'zustand';

interface AppStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

/**
 * Hard cap on retained toasts. Without it, a long-lived tab accumulates every
 * notification ever shown, since each one is only removed when its timer fires
 * or the user dismisses it. Oldest entries are evicted first.
 */
export const MAX_NOTIFICATIONS = 50;

export const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: true,
  theme: 'system',
  notifications: [],

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setTheme: (theme) => set({ theme }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: Math.random().toString(36).slice(2),
        },
      ].slice(-MAX_NOTIFICATIONS),
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
