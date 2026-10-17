/**
 * Formatter utilities
 * Functions for formatting display values
 */

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format large numbers with abbreviated notation
 */
export function formatNumber(num: number, decimals = 2): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(decimals) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(decimals) + 'K';
  }
  return num.toFixed(decimals);
}

/**
 * Get user's local timezone identifier (e.g. 'America/New_York', 'UTC')
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Get short timezone name/abbreviation for the user's locale (e.g. 'EST', 'GMT+1', 'UTC')
 */
export function getUserTimezoneShort(date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : getUserTimezone();
  } catch {
    return 'UTC';
  }
}

/**
 * Format date to readable string in user's local timezone (e.g. "Jan 12, 2025")
 */
export function formatDate(
  date: string | Date,
  options?: { includeTimezone?: boolean }
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const formatted = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);

  if (options?.includeTimezone) {
    return `${formatted} (${getUserTimezoneShort(d)})`;
  }
  return formatted;
}

/**
 * Format date and time in user's local timezone (e.g. "Jan 12, 2025, 3:45 PM GMT+1")
 */
export function formatDateTime(
  date: string | Date,
  options?: { includeTimezone?: boolean }
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const includeTz = options?.includeTimezone ?? true;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(includeTz ? { timeZoneName: 'short' } : {}),
  }).format(d);
}

/**
 * Format public key (show first and last 4 chars)
 */
export function formatPublicKey(publicKey: string): string {
  if (!publicKey || publicKey.length < 8) return publicKey;
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
}

/**
 * Format transaction hash
 */
export function formatTransactionHash(hash: string): string {
  if (!hash || hash.length < 8) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

/**
 * Get status badge color
 */
export function getStatusColor(
  status: 'pending' | 'confirmed' | 'failed'
): 'yellow' | 'green' | 'red' {
  switch (status) {
    case 'pending':
      return 'yellow';
    case 'confirmed':
      return 'green';
    case 'failed':
      return 'red';
    default:
      return 'yellow';
  }
}

/**
 * Get status label
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    failed: 'Failed',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}
