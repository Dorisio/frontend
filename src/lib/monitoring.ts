/**
 * Error monitoring
 *
 * Thin, typed wrapper around Sentry so the rest of the app never depends on
 * Sentry directly and behaves identically when monitoring is not configured
 * (local/dev without a DSN). Sentry itself is configured in the
 * `sentry.{client,server,edge}.config.ts` files.
 */

import * as Sentry from '@sentry/nextjs';

export interface MonitoringUser {
  id?: string;
  email?: string;
  username?: string;
}

export interface MonitoringBreadcrumb {
  category?: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  data?: Record<string, unknown>;
}

/** Resolve the DSN from the public (client) or server environment. */
export function getMonitoringDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || undefined;
}

/** True when a Sentry DSN is configured and errors should be reported. */
export function isMonitoringEnabled(): boolean {
  return Boolean(getMonitoringDsn());
}

/**
 * Report an exception. Non-`Error` values are normalized so callers can pass
 * anything they caught without wrapping it first.
 */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  const normalized = error instanceof Error ? error : new Error(String(error));

  if (!isMonitoringEnabled()) {
    return;
  }

  Sentry.captureException(normalized, context ? { extra: context } : undefined);
}

/**
 * Attach the signed-in user to subsequent error reports. Pass `null` on
 * sign-out to clear the context.
 */
export function setMonitoringUser(user: MonitoringUser | null): void {
  if (!isMonitoringEnabled()) {
    return;
  }

  Sentry.setUser(user ? { id: user.id, email: user.email, username: user.username } : null);
}

/** Record a breadcrumb so errors carry the user actions leading up to them. */
export function addMonitoringBreadcrumb(breadcrumb: MonitoringBreadcrumb): void {
  if (!isMonitoringEnabled()) {
    return;
  }

  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level ?? 'info',
    data: breadcrumb.data,
  });
}

export function recordPerformanceMetric(name: string, value: number, rating: string): void {
  if (!isMonitoringEnabled()) return;
  Sentry.setMeasurement(name, value, 'millisecond');
  Sentry.addBreadcrumb({ category: 'web-vitals', message: `${name}: ${value}`, data: { rating } });
}
