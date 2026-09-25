import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsDateRangePicker } from './analytics-date-range-picker';

describe('AnalyticsDateRangePicker', () => {
  it('renders all date range presets', () => {
    render(<AnalyticsDateRangePicker value="30d" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '30 Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '90 Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Year to Date' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
  });

  it('marks the current value as pressed', () => {
    render(<AnalyticsDateRangePicker value="90d" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '90 Days' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: '30 Days' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('calls onChange with the selected preset', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<AnalyticsDateRangePicker value="30d" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Year to Date' }));

    expect(onChange).toHaveBeenCalledWith('ytd');
  });

  it('shows custom date inputs when custom is selected', () => {
    render(
      <AnalyticsDateRangePicker
        value="custom"
        startDate="2026-01-01"
        endDate="2026-01-31"
        onChange={vi.fn()}
        onCustomDateChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Analytics start date')).toHaveValue('2026-01-01');
    expect(screen.getByLabelText('Analytics end date')).toHaveValue('2026-01-31');
  });
});
