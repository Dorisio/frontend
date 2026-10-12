import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkeletonList, SkeletonListItem } from '@/components/shared/skeleton';
import { TopTippersTable } from '@/components/sections/top-tippers-table';
import { ActivityFeed } from '@/components/sections/activity-feed';
import {
  TopTippersTableSkeleton,
  ActivityFeedSkeleton,
  TransactionTableSkeleton,
} from '@/components/shared/creator-skeletons';
import type { TopTipper, ActivityFeedItem } from '@/types';

describe('Loading Skeleton Screens (#163)', () => {
  describe('Reusable SkeletonList and SkeletonListItem', () => {
    it('renders a list of skeleton items with status role', () => {
      render(<SkeletonList count={3} />);
      const list = screen.getByRole('status', { name: /loading items/i });
      expect(list).toBeInTheDocument();
      expect(list.children).toHaveLength(3);
    });

    it('supports disabling avatar in skeleton list items', () => {
      const { container } = render(<SkeletonListItem hasAvatar={false} />);
      expect(container.querySelector('.rounded-full')).not.toBeInTheDocument();
    });
  });

  describe('ActivityFeed loading behavior', () => {
    const sampleItems: ActivityFeedItem[] = [
      {
        id: 'act-1',
        type: 'tip',
        creatorId: 'c1',
        creatorName: 'Alice',
        title: 'Tipped 20 XLM',
        amount: 20,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];

    it('shows skeleton while loading is true and data is empty', () => {
      render(<ActivityFeed items={[]} loading={true} />);
      expect(screen.getByRole('status', { name: /loading activity feed/i })).toBeInTheDocument();
      expect(screen.queryByText('No recent activity')).not.toBeInTheDocument();
    });

    it('removes skeleton and renders data when items arrive', () => {
      const { rerender } = render(<ActivityFeed items={[]} loading={true} />);
      expect(screen.getByRole('status', { name: /loading activity feed/i })).toBeInTheDocument();

      // Data arrives, loading completes
      rerender(<ActivityFeed items={sampleItems} loading={false} />);
      expect(screen.queryByRole('status', { name: /loading activity feed/i })).not.toBeInTheDocument();
      expect(screen.getByText('Tipped 20 XLM')).toBeInTheDocument();
    });
  });

  describe('TopTippersTable loading behavior', () => {
    const sampleTippers: TopTipper[] = [
      {
        id: 'tip-1',
        name: 'Bob',
        totalAmount: 150,
        tipCount: 5,
        lastTipAt: '2026-01-02T00:00:00Z',
      },
    ];

    it('shows skeleton during data fetch', () => {
      render(<TopTippersTable data={[]} loading={true} />);
      expect(screen.getByRole('status', { name: /loading top tippers/i })).toBeInTheDocument();
      expect(screen.queryByText(/no tippers for this period/i)).not.toBeInTheDocument();
    });

    it('removes skeleton and displays rows once data arrives', () => {
      const { rerender } = render(<TopTippersTable data={[]} loading={true} />);
      expect(screen.getByRole('status', { name: /loading top tippers/i })).toBeInTheDocument();

      rerender(<TopTippersTable data={sampleTippers} loading={false} />);
      expect(screen.queryByRole('status', { name: /loading top tippers/i })).not.toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  describe('TransactionTableSkeleton layout matching', () => {
    it('visually resembles transaction table layout with all columns', () => {
      render(<TransactionTableSkeleton rows={4} />);
      expect(screen.getByRole('status', { name: /loading transaction history/i })).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('From')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Tx ID')).toBeInTheDocument();
    });
  });
});
