'use client';

import { useState, useEffect, useRef } from 'react';
import type { Notification, NotificationType } from '@/types';
import { useDorisio } from 'dorisio-sdk/react';
import {
  COLLABORATIONS_CHANGED_EVENT,
  getCollaborationNotifications,
  markAllCollaborationNotificationsRead,
  markCollaborationNotificationRead,
} from '@/lib/collaborations';

const COLLABORATION_NOTICE_PREFIX = 'collaboration-notice-';
const DEFAULT_AUTO_DISMISS_MS = 5000;
const AUTO_DISMISS_TYPES = new Set<NotificationType>(['info', 'success']);

export function useNotifications(userId?: string) {
  const { client } = useDorisio();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const sdkNotificationsRef = useRef<Notification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearDismissTimer = (id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  };

  const scheduleDismiss = (notification: Notification) => {
    clearDismissTimer(notification.id);
    if (!AUTO_DISMISS_TYPES.has(notification.type)) return;
    const timeout =
      typeof notification.autoDismissMs === 'number'
        ? notification.autoDismissMs
        : DEFAULT_AUTO_DISMISS_MS;
    if (timeout <= 0) return;
    const timer = setTimeout(() => {
      timersRef.current.delete(notification.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      setUnreadCount((prev) => Math.max(0, prev - (notification.read ? 0 : 1)));
    }, timeout);
    timersRef.current.set(notification.id, timer);
  };

  const syncDismissTimers = (next: Notification[]) => {
    const nextIds = new Set(next.map((n) => n.id));
    for (const id of Array.from(timersRef.current.keys())) {
      if (!nextIds.has(id)) clearDismissTimer(id);
    }
    for (const notification of next) {
      if (!timersRef.current.has(notification.id)) scheduleDismiss(notification);
    }
  };

  useEffect(() => {
    async function fetchNotifications() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const data = await client.getNotifications(userId);
        sdkNotificationsRef.current = data;
        const collaborationNotifications = getCollaborationNotifications(userId);
        const combined = [...collaborationNotifications, ...data].sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        );
        setNotifications(combined);
        setUnreadCount(combined.filter((notification) => !notification.read).length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        sdkNotificationsRef.current = [];
        const collaborationNotifications = getCollaborationNotifications(userId);
        setNotifications(collaborationNotifications);
        setUnreadCount(collaborationNotifications.filter((notification) => !notification.read).length);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();

    function refreshCollaborationNotifications(): void {
      if (!userId) return;
      const combined = [...getCollaborationNotifications(userId), ...sdkNotificationsRef.current].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
      setNotifications(combined);
      setUnreadCount(combined.filter((notification) => !notification.read).length);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'dorisio:collaborations') {
        refreshCollaborationNotifications();
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener(COLLABORATIONS_CHANGED_EVENT, refreshCollaborationNotifications);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(COLLABORATIONS_CHANGED_EVENT, refreshCollaborationNotifications);
    };
  }, [userId, client]);

  useEffect(() => {
    syncDismissTimers(notifications);
  }, [notifications]);

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) clearTimeout(timer);
      timersRef.current.clear();
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    if (notificationId.startsWith(COLLABORATION_NOTICE_PREFIX)) {
      markCollaborationNotificationRead(notificationId);
      return;
    }

    try {
      await client.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (userId) markAllCollaborationNotificationsRead(userId);
    try {
      await client.markAllNotificationsAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const dismissNotification = (notificationId: string) => {
    clearDismissTimer(notificationId);
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === notificationId);
      if (target && !target.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  };

  const filterByType = (type: NotificationType) => {
    return notifications.filter((n) => n.type === type);
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    filterByType,
  };
}
