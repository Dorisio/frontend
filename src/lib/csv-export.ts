/**
 * Analytics export
 *
 * Client-side report generation for the creator analytics dashboard's export
 * actions. No backend endpoint is needed because the data is already loaded
 * client-side.
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

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

export function buildAnalyticsExcelHtml(analytics: CreatorAnalytics): string {
  const trendRows = analytics.earningsTrend
    .map(
      (point) => `<tr><td>${escapeHtml(point.date)}</td><td>${escapeHtml(point.amount)}</td></tr>`
    )
    .join('');
  const sourceRows = analytics.sourceBreakdown
    .map(
      (entry) =>
        `<tr><td>${escapeHtml(entry.source)}</td><td>${escapeHtml(entry.amount)}</td><td>${escapeHtml(entry.count)}</td></tr>`
    )
    .join('');
  const tipperRows = analytics.topTippers
    .map(
      (tipper) =>
        `<tr><td>${escapeHtml(tipper.name)}</td><td>${escapeHtml(tipper.totalAmount)}</td><td>${escapeHtml(tipper.tipCount)}</td><td>${escapeHtml(tipper.lastTipAt)}</td></tr>`
    )
    .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, sans-serif; }
      table { border-collapse: collapse; margin-bottom: 24px; }
      th, td { border: 1px solid #d0d7de; padding: 6px 8px; text-align: left; }
      th { background: #f6f8fa; }
    </style>
  </head>
  <body>
    <h1>Dorisio Creator Analytics</h1>
    <table>
      <thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Total earnings</td><td>${escapeHtml(analytics.summary.totalEarnings)}</td></tr>
        <tr><td>This month</td><td>${escapeHtml(analytics.summary.earningsThisMonth)}</td></tr>
        <tr><td>This week</td><td>${escapeHtml(analytics.summary.earningsThisWeek)}</td></tr>
        <tr><td>Total tips</td><td>${escapeHtml(analytics.summary.totalTips)}</td></tr>
      </tbody>
    </table>
    <table>
      <thead><tr><th>Date</th><th>Earnings</th></tr></thead>
      <tbody>${trendRows}</tbody>
    </table>
    <table>
      <thead><tr><th>Source</th><th>Amount</th><th>Count</th></tr></thead>
      <tbody>${sourceRows}</tbody>
    </table>
    <table>
      <thead><tr><th>Tipper</th><th>Total Amount</th><th>Tip Count</th><th>Last Tip</th></tr></thead>
      <tbody>${tipperRows}</tbody>
    </table>
  </body>
</html>`;
}

export function buildAnalyticsPrintableHtml(analytics: CreatorAnalytics, title: string): string {
  return buildAnalyticsExcelHtml(analytics).replace(
    '<h1>Dorisio Creator Analytics</h1>',
    `<h1>${escapeHtml(title)}</h1>`
  );
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

export function downloadAnalyticsExcel(analytics: CreatorAnalytics, filename: string): void {
  const blob = new Blob([buildAnalyticsExcelHtml(analytics)], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
}

export function printAnalyticsPdf(analytics: CreatorAnalytics, title: string): void {
  const reportWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!reportWindow) return;

  reportWindow.document.open();
  reportWindow.document.write(buildAnalyticsPrintableHtml(analytics, title));
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
}
