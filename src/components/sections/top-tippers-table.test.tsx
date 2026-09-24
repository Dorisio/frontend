import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopTippersTable } from './top-tippers-table';
import type { TopTipper } from '@/types';

const sampleData: TopTipper[] = [
  { id: '1', name: 'Alice', totalAmount: 50, tipCount: 3, lastTipAt: '2026-01-05T00:00:00.000Z' },
  { id: '2', name: 'Bob', totalAmount: 200, tipCount: 10, lastTipAt: '2026-01-06T00:00:00.000Z' },
  { id: '3', name: 'Carol', totalAmount: 120, tipCount: 5, lastTipAt: '2026-01-04T00:00:00.000Z' },
];

describe('TopTippersTable', () => {
  it('renders a row for each tipper', () => {
    render(<TopTippersTable data={sampleData} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
  });

  it('sorts tippers by total amount descending', () => {
    render(<TopTippersTable data={sampleData} />);

    const table = screen.getByTestId('top-tippers-table');
    const nameCells = Array.from(table.querySelectorAll('tbody tr td:nth-child(2)')).map(
      (el) => el.textContent
    );

    expect(nameCells).toEqual(['Bob', 'Carol', 'Alice']);
  });

  it('displays rank numbers starting at 1', () => {
    render(<TopTippersTable data={sampleData} />);

    const table = screen.getByTestId('top-tippers-table');
    const rankCells = Array.from(table.querySelectorAll('tbody tr td:nth-child(1)')).map(
      (el) => el.textContent
    );

    expect(rankCells).toEqual(['#1', '#2', '#3']);
  });

  it('shows an empty state when there are no tippers', () => {
    render(<TopTippersTable data={[]} />);

    expect(screen.queryByTestId('top-tippers-table')).not.toBeInTheDocument();
    expect(screen.getByText(/no tippers for this period/i)).toBeInTheDocument();
  });
});
