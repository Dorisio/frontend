'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Creator } from '@/types';
import { useAuthStore } from '@/stores/auth-store';
import { useCreateTip } from '@/hooks/use-create-tip';
import {
  COMMISSION_REQUESTS_CHANGED_EVENT,
  COMMISSION_REQUESTS_STORAGE_KEY,
  confirmCommissionPayment,
  createCommissionPaymentIntent,
  createCommissionRequest,
  getCommissionRequestsForSupporter,
  getCommissionSettings,
  type CommissionRequest,
  type CommissionSettings,
} from '@/lib/commission-requests';

interface SupporterCommissionRequestProps {
  creator: Creator;
}

export function SupporterCommissionRequest({
  creator,
}: SupporterCommissionRequestProps): JSX.Element {
  const user = useAuthStore((state) => state.user);
  const { createTip, loading: paying } = useCreateTip();
  const [settings, setSettings] = useState<CommissionSettings | null>(null);
  const [requests, setRequests] = useState<CommissionRequest[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSettings(getCommissionSettings(creator.id));
    if (user) {
      setRequests(
        getCommissionRequestsForSupporter(user.id).filter(
          (request) => request.creatorId === creator.id
        )
      );
    } else {
      setRequests([]);
    }
  }, [creator.id, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === COMMISSION_REQUESTS_STORAGE_KEY) refresh();
    };
    const handleChange = () => refresh();
    window.addEventListener('storage', handleStorage);
    window.addEventListener(COMMISSION_REQUESTS_CHANGED_EVENT, handleChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(COMMISSION_REQUESTS_CHANGED_EVENT, handleChange);
    };
  }, [refresh]);

  function submit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!user || !settings) return;
    setError(null);
    setMessage(null);
    try {
      createCommissionRequest({
        creatorId: creator.id,
        creatorUserId: creator.userId,
        creatorUsername: creator.username,
        creatorName: creator.displayName,
        supporterUserId: user.id,
        supporterUsername: user.username,
        supporterName: user.name,
        title,
        description,
        price: settings.defaultPrice,
        currency: settings.currency,
      });
      setTitle('');
      setDescription('');
      setMessage('Request sent. You will be notified when it is reviewed.');
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send commission request.');
    }
  }

  async function pay(request: CommissionRequest): Promise<void> {
    if (!user) return;
    setError(null);
    setMessage(null);
    try {
      const intent = createCommissionPaymentIntent(request.id, user.id);
      const result = await createTip({
        creatorId: creator.id,
        amount: intent.amount,
        message: intent.message,
      });
      const hash = result.transactionHash ?? result.id ?? '';
      confirmCommissionPayment(request.id, user.id, hash);
      setMessage('Payment sent. The creator will be notified once it confirms.');
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not pay for this commission.');
    }
  }

  return (
    <section aria-labelledby="supporter-commission-heading" className="space-y-4">
      <div className="border-b pb-4">
        <h2 id="supporter-commission-heading" className="text-xl font-semibold">
          Request a commission
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask {creator.displayName} for custom content. Requests are reviewed before payment.
        </p>
      </div>

      {!user ? (
        <p className="text-sm text-muted-foreground">Sign in to request a commission.</p>
      ) : settings && !settings.acceptingRequests ? (
        <p className="text-sm text-muted-foreground">
          {creator.displayName} is not accepting commission requests right now.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What do you want?"
              required
              className="w-full rounded border bg-background px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Details</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the custom content, deadline, and any specifics."
              required
              rows={3}
              className="w-full rounded border bg-background px-3 py-2"
            />
          </label>
          {settings && (
            <p className="text-sm text-muted-foreground">
              Commission price: {settings.currency} {settings.defaultPrice}
            </p>
          )}
          <button
            type="submit"
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Send request
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <div className="space-y-3">
        <h3 className="font-semibold">Your requests</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">You have no commission requests yet.</p>
        ) : (
          requests.map((request) => (
            <article
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b py-3"
            >
              <div>
                <p className="font-medium">{request.title}</p>
                <p className="text-sm text-muted-foreground">
                  {request.currency} {request.price} ·{' '}
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm capitalize text-muted-foreground">{request.status}</span>
                {request.status === 'approved' && (
                  <button
                    type="button"
                    onClick={() => void pay(request)}
                    disabled={paying}
                    className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
                  >
                    {paying ? 'Paying…' : `Pay ${request.currency} ${request.price}`}
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default SupporterCommissionRequest;
