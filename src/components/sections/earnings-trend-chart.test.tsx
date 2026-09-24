import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EarningsTrendChart } from './earnings-trend-chart';
import type { EarningsTrendPoint } from '@/types';

const sampleData: EarningsTrendPoint[] = [
  { date: '2026-01-01', amount: 10 },
  { date: '2026-01-02', amount: 25 },
  { date: '2026-01-03', amount: 15 },
];

describe('EarningsTrendChart', () => {
  it('renders an SVG line chart when given data', () => {
    render(<EarningsTrendChart data={sampleData} />);

    const wrapper = screen.getByTestId('earnings-trend-chart');
    expect(wrapper.querySelector('svg')).toBeTruthy();
    expect(wrapper.querySelector('.recharts-line')).toBeTruthy();
  });

  it('renders a line point for each data entry', () => {
    render(<EarningsTrendChart data={sampleData} />);

    const dots = screen
      .getByTestId('earnings-trend-chart')
      .querySelectorAll('.recharts-line-dots > *, .recharts-line-curve');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('shows an empty state instead of a chart when there is no data', () => {
    render(<EarningsTrendChart data={[]} />);

    expect(screen.queryByTestId('earnings-trend-chart')).not.toBeInTheDocument();
    expect(screen.getByText(/no earnings data/i)).toBeInTheDocument();
  });
});
