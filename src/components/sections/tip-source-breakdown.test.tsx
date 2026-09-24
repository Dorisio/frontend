import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TipSourceBreakdown } from './tip-source-breakdown';
import type { TipSourceBreakdownEntry } from '@/types';

const sampleData: TipSourceBreakdownEntry[] = [
  { source: 'Profile page', amount: 100, count: 10 },
  { source: 'Embed widget', amount: 50, count: 5 },
  { source: 'Shared link', amount: 25, count: 3 },
];

describe('TipSourceBreakdown', () => {
  it('renders an SVG pie chart when given data', () => {
    render(<TipSourceBreakdown data={sampleData} />);

    const wrapper = screen.getByTestId('tip-source-breakdown-chart');
    expect(wrapper.querySelector('svg')).toBeTruthy();
    expect(wrapper.querySelectorAll('.recharts-pie-sector').length).toBe(sampleData.length);
  });

  it('renders a legend entry for each source', () => {
    render(<TipSourceBreakdown data={sampleData} />);

    expect(screen.getByText('Profile page')).toBeInTheDocument();
    expect(screen.getByText('Embed widget')).toBeInTheDocument();
    expect(screen.getByText('Shared link')).toBeInTheDocument();
  });

  it('shows an empty state instead of a chart when there is no data', () => {
    render(<TipSourceBreakdown data={[]} />);

    expect(screen.queryByTestId('tip-source-breakdown-chart')).not.toBeInTheDocument();
    expect(screen.getByText(/no tips for this period/i)).toBeInTheDocument();
  });

  it('shows an empty state when all amounts are zero', () => {
    render(
      <TipSourceBreakdown
        data={[
          { source: 'Profile page', amount: 0, count: 0 },
          { source: 'Embed widget', amount: 0, count: 0 },
        ]}
      />
    );

    expect(screen.getByText(/no tips for this period/i)).toBeInTheDocument();
  });
});
