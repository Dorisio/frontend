'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  cancelCommission,
  COMMISSIONS_CHANGED_EVENT,
  COMMISSIONS_STORAGE_KEY,
  completeCommission,
  createCommissionRequest,
  getCommissionStats,
  getCommissionsForCreator,
  getCommissionsForSupporter,
  payCommission,
  respondToCommissionRequest,
  type CreatorCommission,
} from '@/lib/commissions';

export interface CommissionRequestsProps {
  /** The creator the request relates to (profile owner). */
  creatorId: string;
  creatorUserId: string;
  creatorUsername: string;
  creatorName: string;
  /** The signed-in user acting in the UI. */
  viewerId: string;
  viewerUserId: string;
  viewerUsername: string;
  viewerName: string;
  role: 'supporter' | 'creator';
}

const STATUS_STYLES: Record<CreatorCommission['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  declined: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
};

function StatusBadge({ status }: { status: CreatorCommission['status'] }): JSX.Element {
  return (
    <span className={`inline-block rounded px-2 py-1 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

export function CommissionRequests({
  creatorId,
  creatorUserId,
  creatorUsername,
  creatorName,
  viewerId,
  viewerUserId,
  viewerUsername,
  viewerName,
  role,
}: CommissionRequestsProps): JSX.Element {
  const [commissions, setCommissions] = useState<CreatorCommission[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [declineReasons, setDeclineReasons] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    setCommissions(
      role === 'creator' ? getCommissionsForCreator(creatorId) : getCommissionsForSupporter(viewerId)
    );
  }, [creatorId, role, viewerId]);

  useEffect(() => {
    refresh();
    const handleChange = () => refresh();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === COMMISSIONS_STORAGE_KEY) refresh();
    };
    window.addEventListener(COMMISSIONS_CHANGED_EVENT, handleChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(COMMISSIONS_CHANGED_EVENT, handleChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refresh]);

  const stats = getCommissionStats(commissions);
  const pendingIncoming = commissions.filter(
    (commission) => commission.status === 'pending' && commission.creatorId === creatorId
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const created = createCommissionRequest({
        creatorId,
        creatorUserId,
        creatorUsername,
        creatorName,
        supporterId: viewerId,
        supporterUserId: viewerUserId,
        supporterUsername: viewerUsername,
        supporterName: viewerName,
        title,
        description,
        price: Number(price),
      });
      setTitle('');
      setDescription('');
      setPrice('');
      setNotice(`Request sent to @${creatorUsername}. You will be notified once reviewed.`);
      void created;
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send commission request.');
    } finally {
      setSaving(false);
    }
  }

  function runAction(action: () => void, fallback: string): void {
    setError(null);
    setNotice(null);
    try {
      action();
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : fallback);
    }
  }

  return (
    <section aria-labelledby="commission-requests-heading" className="space-y-6">
      <div className="border-b pb-4">
        <h2 id="commission-requests-heading" className="text-xl font-semibold">
          {role === 'creator' ? 'Commission requests' : 'Request custom content'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {role === 'creator'
            ? 'Review, approve, and track custom content commissions from your supporters.'
            : `Commission ${creatorName} for personalised content. Agree a price and track progress.`}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Total', stats.total],
          ['Pending', stats.pending],
          ['Approved', stats.approved],
          ['Completed', stats.completed],
        ].map(([label, value]) => (
          <div key={label} className="border-b pb-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {role === 'supporter' && (
        <form
          onSubmit={handleSubmit}
          data-testid="commission-request-form"
          className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-2"
        >
          <h3 className="font-semibold md:col-span-2">Commission details</h3>
          <label className="block space-y-1 text-sm md:col-span-2">
            <span>Title</span>
            <input
              data-testid="commission-title-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Custom portrait"
              maxLength={120}
              className="w-full rounded border bg-background px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm md:col-span-2">
            <span>What would you like created?</span>
            <textarea
              data-testid="commission-description-input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Describe the content, style, and any deadlines."
              className="w-full rounded border bg-background px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Your offer (USD)</span>
            <input
              data-testid="commission-price-input"
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="50"
              className="w-full rounded border bg-background px-3 py-2"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              data-testid="commission-submit-button"
              disabled={saving}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? 'Sending…' : 'Send commission request'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-green-700">
          {notice}
        </p>
      )}

      {role === 'creator' && pendingIncoming.length > 0 && (
        <div className="space-y-3" aria-labelledby="commission-incoming-heading">
          <h3 id="commission-incoming-heading" className="font-semibold">
            Incoming requests
          </h3>
          {pendingIncoming.map((commission) => (
            <article
              key={commission.id}
              className="space-y-3 rounded-lg border p-4"
              data-testid={`commission-incoming-${commission.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium">{commission.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    From{' '}
                    <Link href={`/creators/${commission.supporterUsername}`} className="hover:underline">
                      @{commission.supporterUsername}
                    </Link>{' '}
                    · {formatCurrency(commission.price, commission.currency)} ·{' '}
                    {formatDate(commission.createdAt)}
                  </p>
                </div>
                <StatusBadge status={commission.status} />
              </div>
              <p className="text-sm">{commission.description}</p>
              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Optional decline reason</span>
                <input
                  data-testid={`commission-decline-reason-${commission.id}`}
                  value={declineReasons[commission.id] ?? ''}
                  onChange={(event) =>
                    setDeclineReasons((reasons) => ({
                      ...reasons,
                      [commission.id]: event.target.value,
                    }))
                  }
                  placeholder="Let the supporter know why"
                  className="w-full rounded border bg-background px-3 py-2"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid={`commission-approve-${commission.id}`}
                  onClick={() =>
                    runAction(
                      () => respondToCommissionRequest(commission.id, creatorId, true),
                      'Could not approve commission request.'
                    )
                  }
                  className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
                >
                  Approve
                </button>
                <button
                  type="button"
                  data-testid={`commission-decline-${commission.id}`}
                  onClick={() =>
                    runAction(
                      () =>
                        respondToCommissionRequest(commission.id, creatorId, false, {
                          declineReason: declineReasons[commission.id],
                        }),
                      'Could not decline commission request.'
                    )
                  }
                  className="rounded border px-3 py-2 text-sm"
                >
                  Decline
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold">
          {role === 'creator' ? 'Commission history' : 'Your commission requests'}
        </h3>
        {commissions.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground" data-testid="commission-empty-state">
            {role === 'creator'
              ? 'No commission requests yet.'
              : 'You have not requested any commissions yet.'}
          </p>
        ) : (
          commissions.map((commission) => {
            const counterparty =
              role === 'creator'
                ? { username: commission.supporterUsername, name: commission.supporterName }
                : { username: commission.creatorUsername, name: commission.creatorName };
            const canPay =
              role === 'supporter' &&
              commission.status === 'approved' &&
              commission.paymentStatus === 'unpaid';
            const canCancel = role === 'supporter' && commission.status === 'pending';
            const canComplete =
              role === 'creator' &&
              commission.status === 'approved' &&
              commission.paymentStatus === 'paid';

            return (
              <article
                key={commission.id}
                className="flex flex-wrap items-start justify-between gap-3 border-b py-3"
                data-testid={`commission-row-${commission.id}`}
              >
                <div className="min-w-0">
                  <h4 className="font-medium">{commission.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {role === 'creator' ? 'From ' : 'With '}
                    <Link href={`/creators/${counterparty.username}`} className="hover:underline">
                      {counterparty.name}
                    </Link>{' '}
                    · {formatCurrency(commission.price, commission.currency)} ·{' '}
                    {formatDate(commission.createdAt)}
                  </p>
                  {commission.declineReason && (
                    <p className="text-sm text-red-600">{commission.declineReason}</p>
                  )}
                  {commission.paymentStatus === 'paid' && (
                    <p className="text-xs text-muted-foreground">
                      Paid {commission.transactionHash}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={commission.status} />
                  <span className="text-xs capitalize text-muted-foreground">
                    {commission.paymentStatus}
                  </span>
                  {canPay && (
                    <button
                      type="button"
                      data-testid={`commission-pay-${commission.id}`}
                      onClick={() =>
                        runAction(
                          () => payCommission(commission.id, viewerId),
                          'Could not process commission payment.'
                        )
                      }
                      className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
                    >
                      Pay {formatCurrency(commission.price, commission.currency)}
                    </button>
                  )}
                  {canCancel && (
                    <button
                      type="button"
                      data-testid={`commission-cancel-${commission.id}`}
                      onClick={() =>
                        runAction(
                          () => cancelCommission(commission.id, viewerId),
                          'Could not cancel commission request.'
                        )
                      }
                      className="rounded border px-3 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                  {canComplete && (
                    <button
                      type="button"
                      data-testid={`commission-complete-${commission.id}`}
                      onClick={() =>
                        runAction(
                          () => completeCommission(commission.id, creatorId),
                          'Could not complete commission.'
                        )
                      }
                      className="rounded border px-3 py-2 text-sm"
                    >
                      Mark complete
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
