import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsSummaryCards } from './analytics-summary-cards';

describe('AnalyticsSummaryCards', () => {
  it('displays the correct totals computed from the summary data', () => {
    render(
      <AnalyticsSummaryCards
        summary={{
          totalEarnings: 1234.56,
          earningsThisMonth: 456.78,
          earningsThisWeek: 89.1,
          totalTips: 42,
        }}
      />
    );

    expect(screen.getByTestId('summary-total-earnings')).toHaveTextContent('$1,234.56');
    expect(screen.getByTestId('summary-earnings-month')).toHaveTextContent('$456.78');
    expect(screen.getByTestId('summary-earnings-week')).toHaveTextContent('$89.10');
  });

  it('renders zero values correctly rather than omitting the card', () => {
    render(
      <AnalyticsSummaryCards
        summary={{ totalEarnings: 0, earningsThisMonth: 0, earningsThisWeek: 0, totalTips: 0 }}
      />
    );

    expect(screen.getByTestId('summary-total-earnings')).toHaveTextContent('$0.00');
  });
});
