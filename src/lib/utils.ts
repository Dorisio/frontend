/**
 * Utility Functions
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format currency (USDC)
 */
export function formatCurrency(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Truncate text
 */
export function truncate(text: string, length = 50): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export {
  formatDate,
  formatDateTime,
  getUserTimezone,
  getUserTimezoneShort,
} from '@/utils/formatters';

/**
 * Relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = then - now;
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffSecs) < 60) {
    return rtf.format(diffSecs, 'second');
  } else if (Math.abs(diffMins) < 60) {
    return rtf.format(diffMins, 'minute');
  } else if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  } else {
    return rtf.format(diffDays, 'day');
  }
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Stellar public key
 */
export function isValidStellarPublicKey(key: string): boolean {
  // Stellar public keys start with 'G' and are 56 characters
  return key.length === 56 && key.startsWith('G');
}

/**
 * Copy text to clipboard with a fallback for browsers that don't
 * support the async Clipboard API (non-secure contexts, older engines).
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback: temporary textarea + execCommand('copy')
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2);
}
