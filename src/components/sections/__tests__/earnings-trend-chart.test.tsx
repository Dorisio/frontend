/**
 * Tests for EarningsTrendChart component
 * Covers normal state with data, empty state, and edge/error states
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EarningsTrendChart } from '../earnings-trend-chart';
import type { EarningsTrendPoint } from '@/types';

const sampleData: EarningsTrendPoint[] = [
  { date: '2026-01-01', amount: 15.5 },
  { date: '2026-01-02', amount: 30.0 },
  { date: '2026-01-03', amount: 45.75 },
];

describe('EarningsTrendChart', () => {
  describe('normal state with sample data', () => {
    it('renders the SVG line chart and responsive container with sample data', () => {
      render(<EarningsTrendChart data={sampleData} />);

      const wrapper = screen.getByTestId('earnings-trend-chart');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper.querySelector('svg')).toBeTruthy();
      expect(wrapper.querySelector('.recharts-line')).toBeTruthy();
    });

    it('renders chart curve and points for provided data points', () => {
      render(<EarningsTrendChart data={sampleData} />);

      const wrapper = screen.getByTestId('earnings-trend-chart');
      const dotsAndCurves = wrapper.querySelectorAll(
        '.recharts-line-dots > *, .recharts-line-curve'
      );
      expect(dotsAndCurves.length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('renders empty message when data is an empty array', () => {
      render(<EarningsTrendChart data={[]} />);

      expect(screen.queryByTestId('earnings-trend-chart')).not.toBeInTheDocument();
      expect(screen.getByText(/no earnings data for this period/i)).toBeInTheDocument();
    });
  });

  describe('edge and boundary states', () => {
    it('renders correctly with a single data point', () => {
      const singlePoint: EarningsTrendPoint[] = [{ date: '2026-01-01', amount: 100 }];
      render(<EarningsTrendChart data={singlePoint} />);

      const wrapper = screen.getByTestId('earnings-trend-chart');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper.querySelector('.recharts-line')).toBeTruthy();
    });

    it('handles zero amount values across all dates', () => {
      const zeroData: EarningsTrendPoint[] = [
        { date: '2026-01-01', amount: 0 },
        { date: '2026-01-02', amount: 0 },
      ];
      render(<EarningsTrendChart data={zeroData} />);

      const wrapper = screen.getByTestId('earnings-trend-chart');
      expect(wrapper).toBeInTheDocument();
    });

    it('handles high amount values', () => {
      const largeData: EarningsTrendPoint[] = [
        { date: '2026-01-01', amount: 1_000_000 },
        { date: '2026-01-02', amount: 5_500_000 },
      ];
      render(<EarningsTrendChart data={largeData} />);

      const wrapper = screen.getByTestId('earnings-trend-chart');
      expect(wrapper).toBeInTheDocument();
    });
  });
});
