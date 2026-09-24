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
  onChange: (range: AnalyticsDateRangePreset) => void;
}

const PRESETS: Array<{ value: AnalyticsDateRangePreset; label: string }> = [
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'ytd', label: 'Year to Date' },
];

export function AnalyticsDateRangePicker({
  value,
  onChange,
}: AnalyticsDateRangePickerProps): JSX.Element {
  return (
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
  );
}
