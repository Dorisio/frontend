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

  it('keeps column headers sticky above the scrolling body', () => {
    render(<TopTippersTable data={sampleData} />);

    const headers = screen.getAllByRole('columnheader');
    expect(headers.length).toBeGreaterThan(0);
    headers.forEach((th) => {
      expect(th).toHaveClass('sticky', 'top-0', 'z-10');
      expect(th).toHaveClass('bg-muted');
    });
    // The wrapper must scroll vertically for sticky headers to take effect.
    expect(screen.getByTestId('top-tippers-table')).toHaveClass('overflow-y-auto', 'overflow-x-auto', 'max-h-96');
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

  // The reflow itself is verified in a real browser
  // (e2e/mobile-responsive.spec.ts). These assertions cover the hooks that
  // layout depends on: the reflow class, the scoped scroll region, and the
  // `data-label` that becomes the column name once the rows are stacked.
  describe('responsive markup (#168)', () => {
    it('opts into the responsive reflow class', () => {
      render(<TopTippersTable data={sampleData} />);

      const table = screen.getByTestId('top-tippers-table').querySelector('table');
      expect(table).toHaveClass('responsive-table');
    });

    it('scopes horizontal scrolling to the table so the page never scrolls sideways', () => {
      render(<TopTippersTable data={sampleData} />);

      expect(screen.getByTestId('top-tippers-table')).toHaveClass('overflow-x-auto');
    });

    it('names every column on every cell so none of them is dropped on mobile', () => {
      render(<TopTippersTable data={sampleData} />);

      const root = screen.getByTestId('top-tippers-table');
      const headerLabels = Array.from(root.querySelectorAll('thead th')).map(
        (cell) => cell.textContent
      );
      const firstRowLabels = Array.from(
        root.querySelectorAll('tbody tr:first-child td')
      ).map((cell) => cell.getAttribute('data-label'));

      expect(headerLabels).toEqual([
        'Rank',
        'Tipper',
        'Total Tipped',
        'Tips',
        'Last Tip',
        'Latest Message',
      ]);
      expect(firstRowLabels).toEqual(headerLabels);
    });

    it('describes the table contents for assistive technology', () => {
      render(<TopTippersTable data={sampleData} />);

      expect(
        screen.getByText(/top tippers for this period, ranked by total amount tipped/i)
      ).toBeInTheDocument();
    });
  });
});
