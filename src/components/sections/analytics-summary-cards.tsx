/**
 * Analytics Summary Cards
 * Total / this-month / this-week earnings summary tiles for the creator
 * analytics dashboard.
 */

import { Card } from '@/components/ui/card';
import type { CreatorAnalyticsSummary } from '@/types';
import { formatCurrency } from '@/utils/formatters';

export interface AnalyticsSummaryCardsProps {
  summary: CreatorAnalyticsSummary;
}

export function AnalyticsSummaryCards({ summary }: AnalyticsSummaryCardsProps): JSX.Element {
  const cards = [
    { label: 'Total Earnings', value: summary.totalEarnings, testId: 'summary-total-earnings' },
    { label: 'This Month', value: summary.earningsThisMonth, testId: 'summary-earnings-month' },
    { label: 'This Week', value: summary.earningsThisWeek, testId: 'summary-earnings-week' },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-6 space-y-2" data-testid={card.testId}>
          <h3 className="text-sm font-medium text-muted-foreground">{card.label}</h3>
          <p className="text-3xl font-bold">{formatCurrency(card.value)}</p>
        </Card>
      ))}
    </section>
  );
}
