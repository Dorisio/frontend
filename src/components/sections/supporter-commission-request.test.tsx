import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import type { Creator } from '@/types';

const { createTip, mockUser } = vi.hoisted(() => ({
  createTip: vi.fn(),
  mockUser: { id: 'user-b', username: 'beta', name: 'Beta Supporter' },
}));

vi.mock('@/hooks/use-create-tip', () => ({
  useCreateTip: () => ({ createTip, loading: false }),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: mockUser }),
}));

import { SupporterCommissionRequest } from './supporter-commission-request';
import {
  COMMISSION_REQUESTS_STORAGE_KEY,
  createCommissionRequest,
  getCommissionRequestsForCreator,
  respondToCommissionRequest,
  type CreateCommissionRequestInput,
} from '@/lib/commission-requests';

const creator = {
  id: 'creator-a',
  userId: 'user-a',
  username: 'alpha',
  displayName: 'Alpha Creator',
  verified: true,
  isPublic: true,
  totalEarnings: 0,
  pendingBalance: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
} as Creator;

const fixedDate = new Date('2026-09-01T12:00:00.000Z');

function seedRequest(overrides: Partial<CreateCommissionRequestInput> = {}) {
  return createCommissionRequest(
    {
      creatorId: 'creator-a',
      creatorUserId: 'user-a',
      creatorUsername: 'alpha',
      creatorName: 'Alpha Creator',
      supporterUserId: 'user-b',
      supporterUsername: 'beta',
      supporterName: 'Beta Supporter',
      title: 'Custom shout-out',
      description: 'A birthday message.',
      price: 40,
      currency: 'USD',
      ...overrides,
    },
    fixedDate
  );
}

beforeEach(() => {
  window.localStorage.removeItem(COMMISSION_REQUESTS_STORAGE_KEY);
  createTip.mockReset();
});

describe('SupporterCommissionRequest', () => {
  it('submits a request with the creator commission price attached', async () => {
    render(<SupporterCommissionRequest creator={creator} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Podcast intro' } });
    fireEvent.change(screen.getByLabelText('Details'), {
      target: { value: 'A 30s intro for my podcast.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }));

    const [stored] = getCommissionRequestsForCreator('creator-a');
    expect(stored.title).toBe('Podcast intro');
    expect(stored.price).toBe(25); // default commission price
    expect(stored.status).toBe('pending');
  });

  it('pays an approved request through the tip flow and marks it completed', async () => {
    const request = seedRequest();
    respondToCommissionRequest(request.id, 'user-a', true, fixedDate);
    createTip.mockResolvedValue({ transactionHash: 'hash-pay', status: 'confirmed' });

    render(<SupporterCommissionRequest creator={creator} />);

    fireEvent.click(await screen.findByRole('button', { name: /Pay USD 40/ }));

    await waitFor(() => {
      expect(createTip).toHaveBeenCalledWith({
        creatorId: 'creator-a',
        amount: 40,
        message: 'Commission: Custom shout-out',
      });
    });

    await waitFor(() => {
      expect(getCommissionRequestsForCreator('creator-a')[0].status).toBe('completed');
    });
    expect(getCommissionRequestsForCreator('creator-a')[0].paymentTxHash).toBe('hash-pay');
  });
});
