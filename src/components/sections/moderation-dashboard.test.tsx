/**
 * Moderation Dashboard Component Tests
 */

import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { ModerationDashboard } from './moderation-dashboard';
import type { ModerationItem } from '@/types';

const mockItems: ModerationItem[] = [
  {
    id: '1',
    type: 'comment',
    content: 'Great content!',
    authorId: 'user1',
    authorName: 'Fan123',
    creatorId: 'creator1',
    status: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'tip_message',
    content: 'Inappropriate content',
    authorId: 'user2',
    authorName: 'SpamUser',
    creatorId: 'creator1',
    status: 'pending',
    createdAt: new Date().toISOString(),
    reportCount: 2,
    isReported: true,
  },
];

describe('ModerationDashboard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: mockItems, blockedUsers: [], actionLogs: [], total: mockItems.length }),
    }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders moderation dashboard', () => {
    render(<ModerationDashboard username="creator1" />);

    expect(screen.getByText('Content Moderation')).toBeInTheDocument();
    expect(screen.getByText('Total Items')).toBeInTheDocument();
  });

  it('displays content items', () => {
    render(<ModerationDashboard username="creator1" />);

    expect(screen.getByText('Content Items')).toBeInTheDocument();
  });

  it('filters by status', () => {
    render(<ModerationDashboard username="creator1" />);

    // Filter selection should be available
    const statusFilter = screen.getByText('All Status');
    expect(statusFilter).toBeInTheDocument();
  });

  it('filters by type', () => {
    render(<ModerationDashboard username="creator1" />);

    const typeFilter = screen.getByText('All Types');
    expect(typeFilter).toBeInTheDocument();
  });

  it('shows blocked users tab', () => {
    render(<ModerationDashboard username="creator1" />);

    expect(screen.getByText('Blocked Users')).toBeInTheDocument();
  });

  it('shows action history tab', () => {
    render(<ModerationDashboard username="creator1" />);

    expect(screen.getByText('Action History')).toBeInTheDocument();
  });

  it('displays stats cards', () => {
    render(<ModerationDashboard username="creator1" />);

    expect(screen.getByText('Total Items')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
    expect(screen.getByText('Blocked Users')).toBeInTheDocument();
  });
});
