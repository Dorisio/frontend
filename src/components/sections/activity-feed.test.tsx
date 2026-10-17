/**
 * Activity Feed Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityFeed } from './activity-feed';
import type { ActivityFeedItem } from '@/types';

const mockItems: ActivityFeedItem[] = [
  {
    id: '1',
    type: 'announcement',
    creatorId: 'creator1',
    creatorName: 'Test Creator',
    title: 'New Announcement',
    description: 'This is a test announcement',
    createdAt: '2024-01-01T12:00:00Z',
  },
  {
    id: '2',
    type: 'tip',
    creatorId: 'creator2',
    creatorName: 'Tip Creator',
    title: 'Received Tip',
    amount: 50,
    isPublic: true,
    createdAt: '2024-01-01T11:00:00Z',
  },
  {
    id: '3',
    type: 'verification',
    creatorId: 'creator3',
    creatorName: 'Another Creator',
    title: 'Verified',
    description: 'Creator account verified',
    createdAt: '2024-01-01T10:00:00Z',
  },
];

describe('ActivityFeed', () => {
  it('renders activity items', () => {
    render(<ActivityFeed items={mockItems} />);

    expect(screen.getByText('Activity Feed')).toBeInTheDocument();
    expect(screen.getByText('Test Creator')).toBeInTheDocument();
    expect(screen.getByText('Tip Creator')).toBeInTheDocument();
    expect(screen.getByText('Another Creator')).toBeInTheDocument();
    expect(screen.getByText('New Announcement')).toBeInTheDocument();
    expect(screen.getByText('Received Tip')).toBeInTheDocument();
  });

  it('renders empty state when no items', () => {
    render(<ActivityFeed items={[]} />);

    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('renders ActivityFeedSkeleton when loading and items are empty', () => {
    render(<ActivityFeed items={[]} loading={true} />);

    expect(screen.getByRole('status', { name: /loading activity feed/i })).toBeInTheDocument();
    expect(screen.queryByText('No recent activity')).not.toBeInTheDocument();
  });

  it('filters items by type', () => {
    render(<ActivityFeed items={mockItems} filters={{ type: 'tip' }} />);

    expect(screen.getByText('Received Tip')).toBeInTheDocument();
    expect(screen.getByText('Tip Creator')).toBeInTheDocument();
    expect(screen.queryByText('New Announcement')).not.toBeInTheDocument();
  });

  it('shows load more button when hasMore is true', () => {
    render(<ActivityFeed items={mockItems} hasMore={true} onLoadMore={vi.fn()} />);

    expect(screen.getByText('Load More')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<ActivityFeed items={mockItems} loading={true} hasMore={true} onLoadMore={vi.fn()} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays private badge for private items', () => {
    const privateItem: ActivityFeedItem = {
      id: '1',
      type: 'tip',
      creatorId: 'creator4',
      creatorName: 'Private Creator',
      title: 'Private Tip',
      amount: 100,
      isPublic: false,
      createdAt: '2024-01-01T12:00:00Z',
    };

    render(<ActivityFeed items={[privateItem]} />);

    expect(screen.getByText('Private')).toBeInTheDocument();
  });
});
