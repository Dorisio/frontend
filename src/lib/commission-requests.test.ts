import { afterEach, describe, expect, it } from 'vitest';
import {
  COMMISSION_REQUESTS_STORAGE_KEY,
  cancelCommissionRequest,
  confirmCommissionPayment,
  createCommissionPaymentIntent,
  createCommissionRequest,
  getCommissionNotifications,
  getCommissionRequestsForCreator,
  getCommissionRequestsForSupporter,
  getCommissionSettings,
  getCommissionStats,
  markAllCommissionNotificationsRead,
  markCommissionNotificationRead,
  respondToCommissionRequest,
  saveCommissionSettings,
} from './commission-requests';

const fixedDate = new Date('2026-09-01T12:00:00.000Z');
const approvedDate = new Date('2026-09-02T12:00:00.000Z');
const paidDate = new Date('2026-09-03T12:00:00.000Z');

function request(overrides: Partial<Parameters<typeof createCommissionRequest>[0]> = {}) {
  return createCommissionRequest(
    {
      creatorId: 'creator-a',
      creatorUserId: 'user-a',
      creatorUsername: 'alpha',
      creatorName: 'Alpha Creator',
      supporterUserId: 'user-b',
      supporterUsername: 'beta',
      supporterName: 'Beta Supporter',
      title: 'Custom video shout-out',
      description: 'A 60-second birthday shout-out for my friend.',
      price: 40,
      currency: 'USD',
      ...overrides,
    },
    fixedDate
  );
}

afterEach(() => {
  window.localStorage.removeItem(COMMISSION_REQUESTS_STORAGE_KEY);
});

describe('creator commission requests', () => {
  it('creates a pending request with the attached price and notifies the creator', () => {
    const created = request();

    expect(created.status).toBe('pending');
    expect(created.price).toBe(40);
    expect(created.currency).toBe('USD');
    expect(created.createdAt).toBe(fixedDate.toISOString());
    expect(getCommissionRequestsForCreator('creator-a')).toHaveLength(1);
    expect(getCommissionRequestsForSupporter('user-b')).toHaveLength(1);
    expect(getCommissionNotifications('user-a')).toMatchObject([
      { type: 'commission', title: 'New commission request', read: false },
    ]);
  });

  it('tracks the full pending -> approved -> paid lifecycle and creator revenue', () => {
    const created = request();

    const approved = respondToCommissionRequest(created.id, 'user-a', true, approvedDate);
    expect(approved.status).toBe('approved');
    expect(approved.approvedAt).toBe(approvedDate.toISOString());
    expect(getCommissionNotifications('user-b')).toMatchObject([
      { title: 'Commission approved', read: false },
    ]);

    const intent = createCommissionPaymentIntent(created.id, 'user-b');
    expect(intent).toMatchObject({
      requestId: created.id,
      toUsername: 'alpha',
      amount: 40,
      currency: 'USD',
    });

    const paid = confirmCommissionPayment(created.id, 'user-b', 'tx-hash-123', paidDate);
    expect(paid.status).toBe('completed');
    expect(paid.paymentTxHash).toBe('tx-hash-123');
    expect(paid.completedAt).toBe(paidDate.toISOString());
    expect(getCommissionStats('creator-a')).toMatchObject({
      total: 1,
      pending: 0,
      approved: 0,
      completed: 1,
      revenue: 40,
    });
    expect(getCommissionNotifications('user-a')).toMatchObject([
      { title: 'Commission paid', read: false },
      { title: 'New commission request', read: false },
    ]);
  });

  it('lets the creator decline and the supporter cancel, recording both outcomes', () => {
    const declined = request();
    const declinedResult = respondToCommissionRequest(declined.id, 'user-a', false, approvedDate);
    expect(declinedResult.status).toBe('declined');
    expect(declinedResult.declinedAt).toBe(approvedDate.toISOString());

    window.localStorage.removeItem(COMMISSION_REQUESTS_STORAGE_KEY);

    const cancelled = request();
    const cancelledResult = cancelCommissionRequest(cancelled.id, 'user-b', paidDate);
    expect(cancelledResult.status).toBe('cancelled');
    expect(cancelledResult.cancelledAt).toBe(paidDate.toISOString());
    expect(getCommissionStats('creator-a').cancelled).toBe(1);
  });

  it('honours the creator accept-requests setting and the default commission price', () => {
    saveCommissionSettings({
      creatorId: 'creator-a',
      acceptingRequests: false,
      defaultPrice: 55,
      currency: 'USD',
    });

    expect(getCommissionSettings('creator-a')).toMatchObject({
      acceptingRequests: false,
      defaultPrice: 55,
    });
    expect(() => request()).toThrow('not accepting commission requests');
  });

  it('rejects invalid requests, duplicate open requests, and unauthorized transitions', () => {
    expect(() => request({ title: '   ' })).toThrow('Add a title');
    expect(() => request({ description: '' })).toThrow('Describe the custom content');
    expect(() => request({ price: 0 })).toThrow('greater than 0');
    expect(() => request({ supporterUserId: 'user-a', supporterUsername: 'alpha' })).toThrow(
      'cannot request a commission from yourself'
    );

    const created = request();
    expect(() => request()).toThrow('already have an open commission request');

    // Wrong creator cannot approve.
    expect(() => respondToCommissionRequest(created.id, 'user-z', true)).toThrow(
      'no longer available'
    );
    // Only approved requests can be paid.
    expect(() => createCommissionPaymentIntent(created.id, 'user-b')).toThrow(
      'Only an approved commission can be paid'
    );
  });

  it('marks commission notifications as read', () => {
    request();
    const [notification] = getCommissionNotifications('user-a');

    markCommissionNotificationRead(notification.id);
    expect(getCommissionNotifications('user-a')[0].read).toBe(true);

    request({ title: 'Second request', supporterUserId: 'user-c', supporterUsername: 'gamma' });
    markAllCommissionNotificationsRead('user-a');
    expect(getCommissionNotifications('user-a').every((item) => item.read)).toBe(true);
  });
});
