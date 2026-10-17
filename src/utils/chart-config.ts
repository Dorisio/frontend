/**
 * Shared Recharts configuration for the Dorisio analytics dashboard.
 *
 * Centralises colours, tooltip styles, axis tick styles, and the
 * categorical palette so every chart renders with a consistent look
 * without duplicating inline object literals across components.
 */

import type { CSSProperties } from 'react';

/** Categorical palette — fixed order so a source always maps to the same colour. */
export const CHART_COLORS: readonly string[] = [
  '#ffbf1f',
  '#22c55e',
  '#3b82f6',
  '#ef4444',
  '#a855f7',
  '#14b8a6',
] as const;

/** Inline style applied to the Recharts `<Tooltip>` content box. */
export const TOOLTIP_CONTENT_STYLE: CSSProperties = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  color: '#ffffff',
};

/** SVG text style used for `<XAxis>` and `<YAxis>` ticks. */
export const AXIS_TICK_STYLE: { fontSize: number; fill: string } = {
  fontSize: 12,
  fill: '#888888',
};

/** `wrapperStyle` for Recharts `<Legend>`. */
export const LEGEND_WRAPPER_STYLE: CSSProperties = {
  fontSize: 12,
  color: '#888888',
};

/** Stroke colour for `<CartesianGrid>` lines. */
export const GRID_STROKE = '#2a2a2a';

/** Stroke colour for the primary data series (e.g. earnings line). */
export const PRIMARY_SERIES_COLOR = '#ffbf1f';
