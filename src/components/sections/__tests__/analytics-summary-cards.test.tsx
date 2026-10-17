/**
 * Tests for AnalyticsSummaryCards component
 * Covers normal state, zero/empty states, and edge calculations
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsSummaryCards } from '../analytics-summary-cards';

describe('AnalyticsSummaryCards', () => {
  describe('normal state with analytics data', () => {
    it('displays the formatted currency totals for all summary categories', () => {
      render(
        <AnalyticsSummaryCards
          summary={{
            totalEarnings: 15420.75,
            earningsThisMonth: 3450.5,
            earningsThisWeek: 890.25,
            totalTips: 120,
          }}
        />
      );

      const totalCard = screen.getByTestId('summary-total-earnings');
      expect(totalCard).toHaveTextContent('Total Earnings');
      expect(totalCard).toHaveTextContent('$15,420.75');

      const monthCard = screen.getByTestId('summary-earnings-month');
      expect(monthCard).toHaveTextContent('This Month');
      expect(monthCard).toHaveTextContent('$3,450.50');

      const weekCard = screen.getByTestId('summary-earnings-week');
      expect(weekCard).toHaveTextContent('This Week');
      expect(weekCard).toHaveTextContent('$890.25');
    });
  });

  describe('empty / zero state', () => {
    it('renders zero values correctly as $0.00 without omitting any card', () => {
      render(
        <AnalyticsSummaryCards
          summary={{
            totalEarnings: 0,
            earningsThisMonth: 0,
            earningsThisWeek: 0,
            totalTips: 0,
          }}
        />
      );

      expect(screen.getByTestId('summary-total-earnings')).toHaveTextContent('$0.00');
      expect(screen.getByTestId('summary-earnings-month')).toHaveTextContent('$0.00');
      expect(screen.getByTestId('summary-earnings-week')).toHaveTextContent('$0.00');
    });
  });

  describe('edge and boundary values', () => {
    it('formats large numbers and rounding with cents correctly', () => {
      render(
        <AnalyticsSummaryCards
          summary={{
            totalEarnings: 1000000,
            earningsThisMonth: 99.999,
            earningsThisWeek: 0.05,
            totalTips: 5000,
          }}
        />
      );

      expect(screen.getByTestId('summary-total-earnings')).toHaveTextContent('$1,000,000.00');
      expect(screen.getByTestId('summary-earnings-month')).toHaveTextContent('$100.00');
      expect(screen.getByTestId('summary-earnings-week')).toHaveTextContent('$0.05');
    });
  });
});
