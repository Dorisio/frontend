import { readStoredValue, writeStoredValue } from '@/lib/subscriptions';

export const COMMISSIONS_STORAGE_KEY = 'dorisio:commissions';
export const COMMISSIONS_CHANGED_EVENT = 'dorisio:commissions-changed';
export const MAX_COMMISSION_PRICE = 100000;

export type CommissionStatus = 'pending' | 'approved' | 'declined' | 'completed';

export type CommissionPaymentStatus = 'unpaid' | 'paid';

export interface CreatorCommission {
  id: string;
  creatorId: string;
  creatorUserId: string;
  creatorUsername: string;
  creatorName: string;
  supporterId: string;
  supporterUserId: string;
  supporterUsername: string;
  supporterName: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  status: CommissionStatus;
  paymentStatus: CommissionPaymentStatus;
  transactionHash?: string;
  declineReason?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  declinedAt?: string;
  paidAt?: string;
  completedAt?: string;
}

export interface CommissionStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  declined: number;
  paidAmount: number;
}

interface CommissionState {
  commissions: CreatorCommission[];
}

const EMPTY_STATE: CommissionState = { commissions: [] };

function readState(): CommissionState {
  const stored = readStoredValue<Partial<CommissionState>>(COMMISSIONS_STORAGE_KEY, EMPTY_STATE);
  return {
    commissions: Array.isArray(stored.commissions) ? [...stored.commissions] : [],
  };
}

function writeState(state: CommissionState): void {
  writeStoredValue(COMMISSIONS_STORAGE_KEY, state);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(COMMISSIONS_CHANGED_EVENT));
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

export interface CreateCommissionInput {
  creatorId: string;
  creatorUserId: string;
  creatorUsername: string;
  creatorName: string;
  supporterId: string;
  supporterUserId: string;
  supporterUsername: string;
  supporterName: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
}

export function createCommissionRequest(
  input: CreateCommissionInput,
  now = new Date()
): CreatorCommission {
  const price = Number(input.price);
  if (!input.creatorId || !input.supporterId || input.creatorId === input.supporterId) {
    throw new Error('Choose a creator to commission.');
  }
  if (!input.title.trim()) {
    throw new Error('Add a short title for your commission.');
  }
  if (!input.description.trim()) {
    throw new Error('Describe the content you would like created.');
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Commission price must be greater than zero.');
  }
  if (price > MAX_COMMISSION_PRICE) {
    throw new Error(`Commission price must not exceed ${MAX_COMMISSION_PRICE}.`);
  }

  return updateState((state) => {
    const createdAt = now.toISOString();
    const commission: CreatorCommission = {
      id: createId('commission'),
      creatorId: input.creatorId,
      creatorUserId: input.creatorUserId,
      creatorUsername: input.creatorUsername,
      creatorName: input.creatorName,
      supporterId: input.supporterId,
      supporterUserId: input.supporterUserId,
      supporterUsername: input.supporterUsername,
      supporterName: input.supporterName,
      title: input.title.trim(),
      description: input.description.trim(),
      price,
      currency: input.currency ?? 'USD',
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt,
      updatedAt: createdAt,
    };
    state.commissions.unshift(commission);
    return [state, commission];
  });
}

function findCommission(state: CommissionState, commissionId: string): CreatorCommission | undefined {
  return state.commissions.find((commission) => commission.id === commissionId);
}

export function respondToCommissionRequest(
  commissionId: string,
  creatorId: string,
  approve: boolean,
  options: { declineReason?: string } = {},
  now = new Date()
): CreatorCommission {
  return updateState((state) => {
    const commission = findCommission(state, commissionId);
    if (!commission || commission.creatorId !== creatorId || commission.status !== 'pending') {
      throw new Error('This commission request is no longer available.');
    }

    const updatedAt = now.toISOString();
    commission.status = approve ? 'approved' : 'declined';
    commission.updatedAt = updatedAt;
    if (approve) {
      commission.approvedAt = updatedAt;
    } else {
      commission.declinedAt = updatedAt;
      commission.declineReason = options.declineReason?.trim() || undefined;
    }
    return [state, commission];
  });
}

export function payCommission(
  commissionId: string,
  supporterId: string,
  now = new Date()
): CreatorCommission {
  return updateState((state) => {
    const commission = findCommission(state, commissionId);
    if (
      !commission ||
      commission.supporterId !== supporterId ||
      commission.status !== 'approved' ||
      commission.paymentStatus === 'paid'
    ) {
      throw new Error('This commission is not awaiting payment.');
    }

    const paidAt = now.toISOString();
    commission.paymentStatus = 'paid';
    commission.paidAt = paidAt;
    commission.transactionHash = `mock-commission-${commission.id}`;
    commission.updatedAt = paidAt;
    return [state, commission];
  });
}

export function completeCommission(
  commissionId: string,
  creatorId: string,
  now = new Date()
): CreatorCommission {
  return updateState((state) => {
    const commission = findCommission(state, commissionId);
    if (
      !commission ||
      commission.creatorId !== creatorId ||
      commission.status !== 'approved' ||
      commission.paymentStatus !== 'paid'
    ) {
      throw new Error('This commission cannot be marked complete yet.');
    }

    const completedAt = now.toISOString();
    commission.status = 'completed';
    commission.completedAt = completedAt;
    commission.updatedAt = completedAt;
    return [state, commission];
  });
}

export function cancelCommission(
  commissionId: string,
  supporterId: string,
  now = new Date()
): CreatorCommission {
  return updateState((state) => {
    const commission = findCommission(state, commissionId);
    if (
      !commission ||
      commission.supporterId !== supporterId ||
      commission.status !== 'pending'
    ) {
      throw new Error('This commission can no longer be cancelled.');
    }

    const cancelledAt = now.toISOString();
    commission.status = 'declined';
    commission.declineReason = 'Cancelled by supporter';
    commission.updatedAt = cancelledAt;
    commission.declinedAt = cancelledAt;
    return [state, commission];
  });
}

export function getCommissionsForCreator(creatorId: string): CreatorCommission[] {
  return readState().commissions.filter((commission) => commission.creatorId === creatorId);
}

export function getCommissionsForSupporter(supporterId: string): CreatorCommission[] {
  return readState().commissions.filter((commission) => commission.supporterId === supporterId);
}

export function getCommissionById(commissionId: string): CreatorCommission | undefined {
  return findCommission(readState(), commissionId);
}

export function getCommissionStats(commissions: CreatorCommission[]): CommissionStats {
  return commissions.reduce<CommissionStats>(
    (stats, commission) => {
      stats.total += 1;
      if (commission.status === 'pending') stats.pending += 1;
      if (commission.status === 'approved') stats.approved += 1;
      if (commission.status === 'completed') stats.completed += 1;
      if (commission.status === 'declined') stats.declined += 1;
      if (commission.paymentStatus === 'paid') stats.paidAmount += commission.price;
      return stats;
    },
    { total: 0, pending: 0, approved: 0, completed: 0, declined: 0, paidAmount: 0 }
  );
}

export function clearCommissions(): void {
  updateState((state) => {
    state.commissions = [];
    return [state, undefined];
  });
}
