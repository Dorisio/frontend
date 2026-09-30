import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

const { client } = vi.hoisted(() => {
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
  };
  return { client: { getCreatorProfile: vi.fn().mockResolvedValue(creator) } };
});

vi.mock('dorisio-sdk/react', () => ({
  useDorisio: () => ({ client }),
}));

import { CreatorCommissionRequests } from './creator-commission-requests';
import {
  COMMISSION_REQUESTS_STORAGE_KEY,
  createCommissionRequest,
  getCommissionRequestsForCreator,
  getCommissionSettings,
  type CreateCommissionRequestInput,
} from '@/lib/commission-requests';

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
      description: 'A short birthday message.',
      price: 40,
      currency: 'USD',
      ...overrides,
    },
    fixedDate
  );
}

beforeEach(() => {
  window.localStorage.removeItem(COMMISSION_REQUESTS_STORAGE_KEY);
});

describe('CreatorCommissionRequests', () => {
  it('lists incoming requests and approves one', async () => {
    seedRequest();
    render(<CreatorCommissionRequests username="alpha" userId="user-a" />);

    const approve = await screen.findByRole('button', { name: 'Approve' });
    expect(screen.getByText('Incoming requests')).toBeInTheDocument();

    fireEvent.click(approve);

    expect(getCommissionRequestsForCreator('creator-a')[0].status).toBe('approved');
    expect(await screen.findByText('Awaiting payment')).toBeInTheDocument();
  });

  it('saves the accept-requests setting', async () => {
    render(<CreatorCommissionRequests username="alpha" userId="user-a" />);

    const checkbox = await screen.findByRole('checkbox', {
      name: /accept commission requests/i,
    });
    fireEvent.click(checkbox);

    expect(getCommissionSettings('creator-a').acceptingRequests).toBe(false);
  });

  it('records an on-chain payment for an approved request', async () => {
    const created = seedRequest();
    render(<CreatorCommissionRequests username="alpha" userId="user-a" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));

    const hashInput = await screen.findByPlaceholderText('stellar tx hash');
    fireEvent.change(hashInput, { target: { value: 'tx-abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record payment' }));

    const stored = getCommissionRequestsForCreator('creator-a').find(
      (item) => item.id === created.id
    );
    expect(stored?.status).toBe('completed');
    expect(stored?.paymentTxHash).toBe('tx-abc');
  });
});
