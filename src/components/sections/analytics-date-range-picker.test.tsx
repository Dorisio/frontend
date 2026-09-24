import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsDateRangePicker } from './analytics-date-range-picker';

describe('AnalyticsDateRangePicker', () => {
  it('renders all three presets', () => {
    render(<AnalyticsDateRangePicker value="30d" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '30 Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '90 Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Year to Date' })).toBeInTheDocument();
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
});
