import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  EarningsCardSkeleton,
  ProfileHeaderSkeleton,
  TransactionTableSkeleton,
} from './creator-skeletons';

describe('ProfileHeaderSkeleton (#8)', () => {
  it('is accessible as a status region announcing a loading state', () => {
    render(<ProfileHeaderSkeleton />);
    expect(screen.getByRole('status', { name: /loading creator profile/i })).toBeInTheDocument();
  });

  it('renders a circular avatar placeholder matching the real avatar size (128px / h-32 w-32)', () => {
    const { container } = render(<ProfileHeaderSkeleton />);
    const avatar = container.querySelector('.h-32.w-32.rounded-full');
    expect(avatar).toBeInTheDocument();
  });

  it('renders placeholders for name, verified badge, username, bio, two stats, and the tip button', () => {
    const { container } = render(<ProfileHeaderSkeleton />);
    // 8 skeleton blocks: name, badge, username, bio, 2x(label+value) stats, button
    const blocks = container.querySelectorAll('.animate-pulse');
    expect(blocks.length).toBeGreaterThanOrEqual(8);
  });
});

describe('EarningsCardSkeleton (#8)', () => {
  it('is accessible as a status region', () => {
    render(<EarningsCardSkeleton />);
    expect(screen.getByRole('status', { name: /loading earnings/i })).toBeInTheDocument();
  });

  it('renders a label, a large figure, and a caption placeholder', () => {
    const { container } = render(<EarningsCardSkeleton />);
    const blocks = container.querySelectorAll('.animate-pulse');
    expect(blocks).toHaveLength(3);
  });
});

describe('TransactionTableSkeleton (#8)', () => {
  it('is accessible as a status region', () => {
    render(<TransactionTableSkeleton />);
    expect(
      screen.getByRole('status', { name: /loading transaction history/i })
    ).toBeInTheDocument();
  });

  it('renders the real column headers so the skeleton matches the real table layout', () => {
    render(<TransactionTableSkeleton />);
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Tx ID')).toBeInTheDocument();
  });

  it('defaults to 5 placeholder rows', () => {
    const { container } = render(<TransactionTableSkeleton />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(5);
  });

  it('renders the requested number of placeholder rows', () => {
    const { container } = render(<TransactionTableSkeleton rows={3} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
  });

  it('renders one skeleton block per column in each row', () => {
    const { container } = render(<TransactionTableSkeleton rows={1} />);
    const cells = container.querySelectorAll('tbody tr td');
    expect(cells).toHaveLength(5);
    cells.forEach((cell) => {
      expect(cell.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });
});
