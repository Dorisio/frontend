import { afterEach, describe, expect, it } from 'vitest';
import {
  COMMISSIONS_STORAGE_KEY,
  cancelCommission,
  completeCommission,
  createCommissionRequest,
  getCommissionStats,
  getCommissionsForCreator,
  getCommissionsForSupporter,
  payCommission,
  respondToCommissionRequest,
} from './commissions';

const fixedDate = new Date('2026-09-01T12:00:00.000Z');

function request() {
  return createCommissionRequest(
    {
      creatorId: 'creator-a',
      creatorUserId: 'user-a',
      creatorUsername: 'alpha',
      creatorName: 'Alpha Creator',
      supporterId: 'supporter-b',
      supporterUserId: 'user-b',
      supporterUsername: 'beta',
      supporterName: 'Beta Supporter',
      title: 'Custom illustration',
      description: 'A portrait of my character in your style.',
      price: 75,
    },
    fixedDate
  );
}

afterEach(() => {
  window.localStorage.removeItem(COMMISSIONS_STORAGE_KEY);
});

describe('creator commission requests', () => {
  it('creates a pending request with attached pricing visible to both parties', () => {
    const commission = request();

    expect(commission.status).toBe('pending');
    expect(commission.paymentStatus).toBe('unpaid');
    expect(commission.price).toBe(75);
    expect(getCommissionsForCreator('creator-a')).toHaveLength(1);
    expect(getCommissionsForSupporter('supporter-b')).toHaveLength(1);
    expect(getCommissionStats(getCommissionsForCreator('creator-a'))).toMatchObject({
      total: 1,
      pending: 1,
      approved: 0,
      completed: 0,
      paidAmount: 0,
    });
  });

  it('runs the full approve -> pay -> complete flow with status tracking', () => {
    const commission = request();

    const approved = respondToCommissionRequest(
      commission.id,
      'creator-a',
      true,
      {},
      new Date('2026-09-02T12:00:00.000Z')
    );
    expect(approved.status).toBe('approved');
    expect(approved.approvedAt).toBe('2026-09-02T12:00:00.000Z');

    const paid = payCommission(commission.id, 'supporter-b', new Date('2026-09-03T12:00:00.000Z'));
    expect(paid.paymentStatus).toBe('paid');
    expect(paid.paidAt).toBe('2026-09-03T12:00:00.000Z');
    expect(paid.transactionHash).toMatch(/^mock-commission-/);

    const completed = completeCommission(
      commission.id,
      'creator-a',
      new Date('2026-09-04T12:00:00.000Z')
    );
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBe('2026-09-04T12:00:00.000Z');
    expect(getCommissionStats(getCommissionsForCreator('creator-a'))).toMatchObject({
      total: 1,
      approved: 0,
      completed: 1,
      paidAmount: 75,
    });
  });

  it('declines a request with an optional reason', () => {
    const commission = request();

    const declined = respondToCommissionRequest(commission.id, 'creator-a', false, {
      declineReason: 'Fully booked this month',
    });

    expect(declined.status).toBe('declined');
    expect(declined.declineReason).toBe('Fully booked this month');
    expect(declined.declinedAt).toBeTruthy();
    expect(getCommissionStats(getCommissionsForSupporter('supporter-b'))).toMatchObject({
      declined: 1,
      paidAmount: 0,
    });
  });

  it('allows a supporter to cancel a pending request', () => {
    const commission = request();
    const cancelled = cancelCommission(commission.id, 'supporter-b');

    expect(cancelled.status).toBe('declined');
    expect(cancelled.declineReason).toBe('Cancelled by supporter');
    expect(() => cancelCommission(commission.id, 'supporter-b')).toThrow('no longer be cancelled');
  });

  it('rejects invalid request input', () => {
    const base = {
      creatorId: 'creator-a',
      creatorUserId: 'user-a',
      creatorUsername: 'alpha',
      creatorName: 'Alpha Creator',
      supporterId: 'supporter-b',
      supporterUserId: 'user-b',
      supporterUsername: 'beta',
      supporterName: 'Beta Supporter',
      title: 'Custom illustration',
      description: 'A portrait of my character.',
      price: 75,
    };

    expect(() => createCommissionRequest({ ...base, title: '  ' })).toThrow('short title');
    expect(() => createCommissionRequest({ ...base, description: '' })).toThrow('Describe the content');
    expect(() => createCommissionRequest({ ...base, price: 0 })).toThrow('greater than zero');
    expect(() => createCommissionRequest({ ...base, price: 100001 })).toThrow('must not exceed');
    expect(() =>
      createCommissionRequest({ ...base, supporterId: 'creator-a' })
    ).toThrow('Choose a creator');
  });

  it('enforces the approval, payment and completion workflow order and actors', () => {
    const commission = request();

    expect(() => payCommission(commission.id, 'supporter-b')).toThrow('not awaiting payment');
    expect(() => completeCommission(commission.id, 'creator-a')).toThrow('cannot be marked complete');
    expect(() => respondToCommissionRequest(commission.id, 'supporter-b', true)).toThrow(
      'no longer available'
    );

    respondToCommissionRequest(commission.id, 'creator-a', true);

    expect(() => completeCommission(commission.id, 'creator-a')).toThrow('cannot be marked complete');
    expect(() => payCommission(commission.id, 'creator-a')).toThrow('not awaiting payment');

    payCommission(commission.id, 'supporter-b');
    expect(() => completeCommission(commission.id, 'supporter-b')).toThrow(
      'cannot be marked complete'
    );

    expect(() => payCommission(commission.id, 'supporter-b')).toThrow('not awaiting payment');
  });
});
