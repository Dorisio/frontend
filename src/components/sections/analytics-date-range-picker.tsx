/**
 * Analytics Date Range Picker
 * Preset date-range selector (30 days / 90 days / year-to-date) for the
 * creator analytics dashboard.
 */

'use client';

import type { AnalyticsDateRangePreset } from '@/types';
import { cn } from '@/lib/utils';

export interface AnalyticsDateRangePickerProps {
  value: AnalyticsDateRangePreset;
  startDate?: string;
  endDate?: string;
  onChange: (range: AnalyticsDateRangePreset) => void;
  onCustomDateChange?: (field: 'startDate' | 'endDate', value: string) => void;
}

const PRESETS: Array<{ value: AnalyticsDateRangePreset; label: string }> = [
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'custom', label: 'Custom' },
];

export function AnalyticsDateRangePicker({
  value,
  startDate,
  endDate,
  onChange,
  onCustomDateChange,
}: AnalyticsDateRangePickerProps): JSX.Element {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div
        role="group"
        aria-label="Date range"
        className="inline-flex rounded-lg border p-1 gap-1"
      >
        {PRESETS.map((preset) => (
          <button
          key={preset.value}
          type="button"
          aria-pressed={value === preset.value}
          onClick={() => onChange(preset.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition',
            value === preset.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {preset.label}
          </button>
        ))}
      </div>
      {value === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            aria-label="Analytics start date"
            type="date"
            value={startDate || ''}
            onChange={(event) => onCustomDateChange?.('startDate', event.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          />
          <input
            aria-label="Analytics end date"
            type="date"
            value={endDate || ''}
            onChange={(event) => onCustomDateChange?.('endDate', event.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </div>
      )}
    </div>
  );
}
