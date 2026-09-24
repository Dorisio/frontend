/**
 * CSV export
 *
 * Client-side CSV generation for the creator analytics dashboard's export
 * button. Builds a CSV Blob and triggers a browser download - no backend
 * endpoint needed since the data is already loaded client-side.
 */

import type { CreatorAnalytics } from '@/types';

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields: Array<string | number>): string {
  return fields.map(escapeCsvField).join(',');
}

/**
 * Builds a CSV document for the given analytics data, covering the earnings
 * trend (one row per day). Kept to a single table (rather than one CSV per
 * chart) so the export is one file with a clear header row.
 */
export function buildAnalyticsCsv(analytics: CreatorAnalytics): string {
  const lines: string[] = [];

  lines.push(toCsvRow(['date', 'earnings']));
  for (const point of analytics.earningsTrend) {
    lines.push(toCsvRow([point.date, point.amount]));
  }

  return lines.join('\n');
}

/** Builds a downloadable CSV Blob for the given analytics data. */
export function buildAnalyticsCsvBlob(analytics: CreatorAnalytics): Blob {
  return new Blob([buildAnalyticsCsv(analytics)], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Triggers a browser download of the given analytics data as a CSV file.
 * Uses a temporary anchor + object URL, the standard client-side download
 * pattern (no backend endpoint involved).
 */
export function downloadAnalyticsCsv(analytics: CreatorAnalytics, filename: string): void {
  const blob = buildAnalyticsCsvBlob(analytics);
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
}
