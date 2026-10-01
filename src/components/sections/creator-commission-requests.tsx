'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useDorisio } from 'dorisio-sdk/react';
import type { Creator } from '@/types';
import {
  COMMISSION_REQUESTS_CHANGED_EVENT,
  COMMISSION_REQUESTS_STORAGE_KEY,
  confirmCommissionPayment,
  getCommissionRequestsForCreator,
  getCommissionSettings,
  getCommissionStats,
  respondToCommissionRequest,
  saveCommissionSettings,
  type CommissionRequest,
  type CommissionSettings,
} from '@/lib/commission-requests';

interface CreatorCommissionRequestsProps {
  username: string;
  userId: string;
  userName?: string;
}

export function CreatorCommissionRequests({
  username,
  userId,
}: CreatorCommissionRequestsProps): JSX.Element {
  const { client } = useDorisio();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [requests, setRequests] = useState<CommissionRequest[]>([]);
  const [settings, setSettings] = useState<CommissionSettings | null>(null);
  const [txHashes, setTxHashes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback((creatorId: string) => {
    setRequests(getCommissionRequestsForCreator(creatorId));
    setSettings(getCommissionSettings(creatorId));
  }, []);

  useEffect(() => {
    let active = true;
    client
      .getCreatorProfile(username)
      .then((profile) => {
        if (!active) return;
        const currentCreator = profile as Creator;
        setCreator(currentCreator);
        refresh(currentCreator.id);
      })
      .catch(() => {
        if (active) setError('Creator profile could not be loaded.');
      });

    return () => {
      active = false;
    };
  }, [client, username, refresh]);

  useEffect(() => {
    if (!creator) return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === COMMISSION_REQUESTS_STORAGE_KEY) refresh(creator.id);
    };
    const handleChange = () => refresh(creator.id);
    window.addEventListener('storage', handleStorage);
    window.addEventListener(COMMISSION_REQUESTS_CHANGED_EVENT, handleChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(COMMISSION_REQUESTS_CHANGED_EVENT, handleChange);
    };
  }, [creator, refresh]);

  const stats = creator ? getCommissionStats(creator.id) : null;
  const pending = requests.filter((item) => item.status === 'pending');
  const approved = requests.filter((item) => item.status === 'approved');

  function updateSettings(patch: Partial<CommissionSettings>): void {
    if (!creator || !settings) return;
    const nextSettings = { ...settings, ...patch };
    try {
      saveCommissionSettings(nextSettings);
      setSettings(nextSettings);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save commission settings.');
    }
  }

  function respond(request: CommissionRequest, approve: boolean): void {
    try {
      respondToCommissionRequest(request.id, userId, approve);
      if (creator) refresh(creator.id);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update commission request.');
    }
  }

  function recordPayment(request: CommissionRequest): void {
    try {
      confirmCommissionPayment(request.id, userId, txHashes[request.id] ?? '');
      if (creator) refresh(creator.id);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not record commission payment.');
    }
  }

  return (
    <section aria-labelledby="creator-commissions-heading" className="space-y-6">
      <div className="border-b pb-4">
        <h2 id="creator-commissions-heading" className="text-xl font-semibold">
          Commissions
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review custom-content requests, set your commission price, and track payments.
        </p>
      </div>

      {stats && (
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            ['Total', stats.total],
            ['Pending', stats.pending],
            ['Approved', stats.approved],
            ['Completed', stats.completed],
            ['Revenue', `$${stats.revenue}`],
          ].map(([label, value]) => (
            <div key={label} className="border-b pb-3">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {settings && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold">Commission settings</h3>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.acceptingRequests}
                onChange={(event) => updateSettings({ acceptingRequests: event.target.checked })}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">Accept commission requests</span>
                <span className="text-muted-foreground">Turn off to close your request form.</span>
              </span>
            </label>
            <label className="block space-y-1 text-sm">
              <span>Default commission price ($)</span>
              <input
                type="number"
                min="1"
                step="1"
                value={settings.defaultPrice}
                onChange={(event) => updateSettings({ defaultPrice: Number(event.target.value) })}
                className="w-full rounded border bg-background px-3 py-2"
              />
              <span className="text-xs text-muted-foreground">
                Attached to every new request supporters make.
              </span>
            </label>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {pending.length > 0 && (
        <div className="space-y-3" aria-labelledby="commission-pending-heading">
          <h3 id="commission-pending-heading" className="font-semibold">
            Incoming requests
          </h3>
          {pending.map((request) => (
            <article
              key={request.id}
              className="flex flex-wrap items-start justify-between gap-3 border-b py-3"
            >
              <div>
                <p className="font-medium">{request.title}</p>
                <p className="text-sm text-muted-foreground">{request.description}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  From{' '}
                  <Link href={`/creators/${request.supporterUsername}`} className="hover:underline">
                    @{request.supporterUsername}
                  </Link>{' '}
                  · {request.currency} {request.price}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => respond(request, true)}
                  className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => respond(request, false)}
                  className="rounded border px-3 py-2 text-sm"
                >
                  Decline
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <div className="space-y-3" aria-labelledby="commission-approved-heading">
          <h3 id="commission-approved-heading" className="font-semibold">
            Awaiting payment
          </h3>
          {approved.map((request) => (
            <article
              key={request.id}
              className="flex flex-wrap items-end justify-between gap-3 border-b py-3"
            >
              <div>
                <p className="font-medium">{request.title}</p>
                <p className="text-sm text-muted-foreground">
                  @{request.supporterUsername} · {request.currency} {request.price}
                </p>
              </div>
              <div className="flex items-end gap-2">
                <label className="block space-y-1 text-sm">
                  <span>Payment transaction hash</span>
                  <input
                    value={txHashes[request.id] ?? ''}
                    onChange={(event) =>
                      setTxHashes((current) => ({ ...current, [request.id]: event.target.value }))
                    }
                    placeholder="stellar tx hash"
                    className="w-64 rounded border bg-background px-3 py-2"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => recordPayment(request)}
                  className="rounded border px-3 py-2 text-sm"
                >
                  Record payment
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold">Commission history</h3>
        {requests.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No commission requests yet.</p>
        ) : (
          requests.map((request) => (
            <article
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b py-3"
            >
              <div>
                <p className="font-medium">{request.title}</p>
                <p className="text-sm text-muted-foreground">
                  @{request.supporterUsername} · {request.currency} {request.price} ·{' '}
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-sm capitalize text-muted-foreground">{request.status}</span>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default CreatorCommissionRequests;
