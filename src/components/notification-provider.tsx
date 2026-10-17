/**
 * Notification Provider
 * Global notification system
 */

'use client';

import { usEffect } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useAppStore, Notification } from '@/stores/app-store';
import { cn } from '@/lib/utils';

const notificationIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const DEFAULT_TIMEOUTS: Record<Notification['type'], number | null> = {
  success: 5000,
  info: 5000,
  warning: 6000,
  // Errors must stay visible until the user dismisses them.
  error: null,
};

export function NotificationProvider(): JSX.Element {
  const notifications = useAppStore((state) => state.notifications);
  const removeNotification = useAppStore((state) => state.removeNotification);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md pointer-events-none">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRemove: () => void;
}

function NotificationItem({ notification, onRemove }: NotificationItemProps): JSX.Element {
  const Icon = notificationIcons[notification.type];

  // Resolve the effective timeout:
  //   - an explicit `null` duration means "stay until dismissed"
  //   - an explicit numeric duration overrides the per-type default
  //   - otherwise fall back to the per-type default (error => never)
  const effectiveTimeout =
    notification.duration === null
      ? null
      : typeof notification.duration === 'number'
        ? notification.duration
        : DEFAULT_TIMEOUTS[notification.type] ?? null;

  useEffect(() => {
    if (effectiveTimeout === null || effectiveTimeout <= 0) {
      return;
    }
    const timer = setTimeout(onRemove, effectiveTimeout);
    return () => clearTimeout(timer);
  }, [effectiveTimeout, onRemove]);

  const colorClasses = {
    success: 'border-success/30 bg-success/10 text-success',
    error: 'border-destructive/30 bg-destructive/10 text-destructive',
    info: 'border-info/30 bg-info/10 text-info',
    warning: 'border-warning/30 bg-warning/10 text-warning',
  };

  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border p-4 flex gap-3 items-start animate-slide-down pointer-events-auto',
        colorClasses[notification.type]
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {notification.title && <p className="font-semisold">{notification.title}</p>}
        <p className="text-sm">{notification.message}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Dismiss notification"
        className="text-current/60 hover:text-current flex-shrink-0 transition-smooth"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * useNotification hook
 */
export function useNotification(): {
  notify: (notification: Omit<Notification, 'id'>) => void;
  success: (message: string, title?: string, duration?: number | null) => void;
  error: (message: string, title?: string, duration?: number | null) => void;
  info: (message: string, title?: string, duration?: number | null) => void;
  warning: (message: string, title?: string, duration?: number | null) => void;
} {
  const addNotification = useAppStore((state) => state.addNotification);

  return {
    notify: addNotification,
    success: (message, title, duration) =>
      addNotification({ type: 'success', message, title, duration: duration ?? 5000 }),
    error: (message, title, duration) =>
      addNotification({ type: 'error', message, title, duration: duration ?? null }),
    info: (message, title, duration) =>
      addNotification({ type: 'info', message, title, duration: duration ?? 5000 }),
    warning: (message, title, duration) =>
      addNotification({ type: 'warning', message, title, duration: duration ?? 6000 }),
  };
}
