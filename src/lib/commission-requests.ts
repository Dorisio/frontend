import type { Notification } from '@/types';
import { readStoredValue, writeStoredValue } from '@/lib/subscriptions';

export const COMMISSION_REQUESTS_STORAGE_KEY = 'dorisio:commission-requests';
export const COMMISSION_REQUESTS_CHANGED_EVENT = 'dorisio:commission-requests-changed';

export type CommissionRequestStatus =
  'pending' | 'approved' | 'declined' | 'completed' | 'cancelled';

export interface CommissionSettings {
  creatorId: string;
  /** When false, the creator's request form is closed to supporters. */
  acceptingRequests: boolean;
  /** Default commission price in whole currency units. */
  defaultPrice: number;
  currency: string;
}

export interface CommissionRequest {
  id: string;
  creatorId: string;
  creatorUserId: string;
  creatorUsername: string;
  creatorName: string;
  supporterUserId: string;
  supporterUsername: string;
  supporterName: string;
  title: string;
  description: string;
  /** Snapshotted from the creator's settings when the request was created. */
  price: number;
  currency: string;
  status: CommissionRequestStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  declinedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  /** On-chain hash of the tip that paid an approved commission. */
  paymentTxHash?: string;
}

interface CommissionNotice extends Omit<Notification, 'type'> {
  type: 'commission';
  requestId: string;
}

interface CommissionState {
  requests: CommissionRequest[];
  settings: CommissionSettings[];
  notifications: CommissionNotice[];
}

export interface CommissionStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  declined: number;
  cancelled: number;
  /** Total price of completed commissions. */
  revenue: number;
}

export interface CreateCommissionRequestInput {
  creatorId: string;
  creatorUserId: string;
  creatorUsername: string;
  creatorName: string;
  supporterUserId: string;
  supporterUsername: string;
  supporterName: string;
  title: string;
  description: string;
  price: number;
  currency: string;
}

export interface CommissionPaymentIntent {
  requestId: string;
  toUsername: string;
  amount: number;
  currency: string;
  message: string;
}

const DEFAULT_SETTINGS: Omit<CommissionSettings, 'creatorId'> = {
  acceptingRequests: true,
  defaultPrice: 25,
  currency: 'USD',
};

const EMPTY_STATE: CommissionState = {
  requests: [],
  settings: [],
  notifications: [],
};

function readState(): CommissionState {
  const stored = readStoredValue<Partial<CommissionState>>(
    COMMISSION_REQUESTS_STORAGE_KEY,
    EMPTY_STATE
  );

  return {
    requests: Array.isArray(stored.requests) ? [...stored.requests] : [],
    settings: Array.isArray(stored.settings) ? [...stored.settings] : [],
    notifications: Array.isArray(stored.notifications) ? [...stored.notifications] : [],
  };
}

function writeState(state: CommissionState): void {
  writeStoredValue(COMMISSION_REQUESTS_STORAGE_KEY, state);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(COMMISSION_REQUESTS_CHANGED_EVENT));
  }
}

function createId(prefix: string): string {
  const randomId = globalThis.crypto?.randomUUID?.();
  return `${prefix}-${randomId ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

function updateState<T>(update: (state: CommissionState) => [CommissionState, T]): T {
  const [state, result] = update(readState());
  writeState(state);
  return result;
}

function addNotice(
  state: CommissionState,
  userId: string,
  requestId: string,
  title: string,
  message: string,
  createdAt: string
): void {
  state.notifications.unshift({
    id: createId('commission-notice'),
    userId,
    type: 'commission',
    title,
    message,
    read: false,
    createdAt,
    requestId,
  });
}

function isValidPrice(price: number): boolean {
  return Number.isFinite(price) && price > 0;
}

export function getCommissionSettings(creatorId: string): CommissionSettings {
  return (
    readState().settings.find((settings) => settings.creatorId === creatorId) ?? {
      creatorId,
      ...DEFAULT_SETTINGS,
    }
  );
}

export function saveCommissionSettings(settings: CommissionSettings): CommissionSettings {
  if (!settings.creatorId) {
    throw new Error('A creator is required to save commission settings.');
  }
  if (!isValidPrice(settings.defaultPrice)) {
    throw new Error('Set a commission price greater than 0.');
  }
  if (!settings.currency) {
    throw new Error('Choose a commission currency.');
  }

  return updateState((state) => {
    state.settings = [
      ...state.settings.filter((item) => item.creatorId !== settings.creatorId),
      settings,
    ];
    return [state, settings];
  });
}

export function createCommissionRequest(
  input: CreateCommissionRequestInput,
  now = new Date()
): CommissionRequest {
  if (!input.creatorId || !input.creatorUserId || !input.supporterUserId) {
    throw new Error('A creator and a supporter are required.');
  }
  if (input.creatorUserId === input.supporterUserId) {
    throw new Error('You cannot request a commission from yourself.');
  }
  if (!input.title.trim()) {
    throw new Error('Add a title for the request.');
  }
  if (!input.description.trim()) {
    throw new Error('Describe the custom content you want.');
  }
  if (!isValidPrice(input.price)) {
    throw new Error('The commission price must be greater than 0.');
  }

  return updateState((state) => {
    const settings = state.settings.find((item) => item.creatorId === input.creatorId);
    if (settings && !settings.acceptingRequests) {
      throw new Error('This creator is not accepting commission requests.');
    }

    const hasOpenRequest = state.requests.some(
      (request) =>
        request.creatorId === input.creatorId &&
        request.supporterUserId === input.supporterUserId &&
        (request.status === 'pending' || request.status === 'approved')
    );
    if (hasOpenRequest) {
      throw new Error('You already have an open commission request with this creator.');
    }

    const createdAt = now.toISOString();
    const request: CommissionRequest = {
      ...input,
      title: input.title.trim(),
      description: input.description.trim(),
      id: createId('commission-request'),
      status: 'pending',
      createdAt,
      updatedAt: createdAt,
    };
    state.requests.unshift(request);
    addNotice(
      state,
      input.creatorUserId,
      request.id,
      'New commission request',
      `@${input.supporterUsername} requested “${request.title}”.`,
      createdAt
    );
    return [state, request];
  });
}

export function respondToCommissionRequest(
  requestId: string,
  creatorUserId: string,
  approve: boolean,
  now = new Date()
): CommissionRequest {
  return updateState((state) => {
    const request = state.requests.find((item) => item.id === requestId);
    if (!request || request.creatorUserId !== creatorUserId || request.status !== 'pending') {
      throw new Error('This commission request is no longer available.');
    }

    const updatedAt = now.toISOString();
    request.status = approve ? 'approved' : 'declined';
    request.updatedAt = updatedAt;
    if (approve) request.approvedAt = updatedAt;
    else request.declinedAt = updatedAt;

    addNotice(
      state,
      request.supporterUserId,
      request.id,
      approve ? 'Commission approved' : 'Commission declined',
      `@${request.creatorUsername} ${approve ? 'approved' : 'declined'} your request “${request.title}”.`,
      updatedAt
    );
    return [state, request];
  });
}

export function cancelCommissionRequest(
  requestId: string,
  supporterUserId: string,
  now = new Date()
): CommissionRequest {
  return updateState((state) => {
    const request = state.requests.find((item) => item.id === requestId);
    if (
      !request ||
      request.supporterUserId !== supporterUserId ||
      (request.status !== 'pending' && request.status !== 'approved')
    ) {
      throw new Error('This commission request cannot be cancelled.');
    }

    const cancelledAt = now.toISOString();
    request.status = 'cancelled';
    request.updatedAt = cancelledAt;
    request.cancelledAt = cancelledAt;
    addNotice(
      state,
      request.creatorUserId,
      request.id,
      'Commission cancelled',
      `@${request.supporterUsername} cancelled the request “${request.title}”.`,
      cancelledAt
    );
    return [state, request];
  });
}

/**
 * Builds the payload for the existing tip flow so the supporter can pay an
 * approved commission. The actual on-chain submission is delegated to the
 * Dorisio SDK (`client.createTip`), keeping this module UI/domain-only.
 */
export function createCommissionPaymentIntent(
  requestId: string,
  supporterUserId: string
): CommissionPaymentIntent {
  const request = readState().requests.find((item) => item.id === requestId);
  if (!request || request.supporterUserId !== supporterUserId) {
    throw new Error('This commission request is not available to pay.');
  }
  if (request.status !== 'approved') {
    throw new Error('Only an approved commission can be paid.');
  }
  return {
    requestId: request.id,
    toUsername: request.creatorUsername,
    amount: request.price,
    currency: request.currency,
    message: `Commission: ${request.title}`,
  };
}

export function confirmCommissionPayment(
  requestId: string,
  actorUserId: string,
  transactionHash: string,
  now = new Date()
): CommissionRequest {
  if (!transactionHash.trim()) {
    throw new Error('A transaction hash is required to confirm payment.');
  }
  return updateState((state) => {
    const request = state.requests.find((item) => item.id === requestId);
    const isParticipant =
      request && (request.supporterUserId === actorUserId || request.creatorUserId === actorUserId);
    if (!isParticipant || request.status !== 'approved') {
      throw new Error('Only an approved commission can be paid.');
    }

    const completedAt = now.toISOString();
    request.status = 'completed';
    request.paymentTxHash = transactionHash;
    request.updatedAt = completedAt;
    request.completedAt = completedAt;
    addNotice(
      state,
      request.creatorUserId,
      request.id,
      'Commission paid',
      `@${request.supporterUsername} paid ${request.currency} ${request.price} for “${request.title}”.`,
      completedAt
    );
    return [state, request];
  });
}

export function getCommissionRequestsForCreator(creatorId: string): CommissionRequest[] {
  return readState().requests.filter((request) => request.creatorId === creatorId);
}

export function getCommissionRequestsForSupporter(supporterUserId: string): CommissionRequest[] {
  return readState().requests.filter((request) => request.supporterUserId === supporterUserId);
}

export function getCommissionStats(creatorId: string): CommissionStats {
  return getCommissionRequestsForCreator(creatorId).reduce<CommissionStats>(
    (stats, request) => {
      stats.total += 1;
      if (request.status === 'pending') stats.pending += 1;
      if (request.status === 'approved') stats.approved += 1;
      if (request.status === 'declined') stats.declined += 1;
      if (request.status === 'cancelled') stats.cancelled += 1;
      if (request.status === 'completed') {
        stats.completed += 1;
        stats.revenue += request.price;
      }
      return stats;
    },
    { total: 0, pending: 0, approved: 0, completed: 0, declined: 0, cancelled: 0, revenue: 0 }
  );
}

export function getCommissionNotifications(userId: string): CommissionNotice[] {
  return readState().notifications.filter((notification) => notification.userId === userId);
}

export function markCommissionNotificationRead(notificationId: string): void {
  updateState((state) => {
    const notification = state.notifications.find((item) => item.id === notificationId);
    if (notification) notification.read = true;
    return [state, undefined];
  });
}

export function markAllCommissionNotificationsRead(userId: string): void {
  updateState((state) => {
    state.notifications.forEach((notification) => {
      if (notification.userId === userId) notification.read = true;
    });
    return [state, undefined];
  });
}
