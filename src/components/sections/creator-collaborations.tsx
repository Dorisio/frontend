'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useDorisio } from 'dorisio-sdk/react';
import type { Creator } from '@/types';
import {
  createCollaborationInvite,
  COLLABORATIONS_CHANGED_EVENT,
  endCollaboration,
  getCollaborationSettings,
  getCollaborationStats,
  getCollaborationsForCreator,
  respondToCollaborationInvite,
  saveCollaborationSettings,
  type CollaborationSettings,
  type CreatorCollaboration,
} from '@/lib/collaborations';

interface CreatorCollaborationsProps {
  username: string;
  userId: string;
  userName?: string;
}

function getPartner(collaboration: CreatorCollaboration, creatorId: string) {
  return collaboration.inviterId === creatorId
    ? {
        id: collaboration.inviteeId,
        username: collaboration.inviteeUsername,
        name: collaboration.inviteeName,
        share: collaboration.inviterShare,
      }
    : {
        id: collaboration.inviterId,
        username: collaboration.inviterUsername,
        name: collaboration.inviterName,
        share: collaboration.inviteeShare,
      };
}

export function CreatorCollaborations({
  username,
  userId,
  userName,
}: CreatorCollaborationsProps): JSX.Element {
  const { client } = useDorisio();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [collaborations, setCollaborations] = useState<CreatorCollaboration[]>([]);
  const [settings, setSettings] = useState<CollaborationSettings | null>(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback((creatorId: string) => {
    setCollaborations(getCollaborationsForCreator(creatorId));
    setSettings(getCollaborationSettings(creatorId));
  }, []);

  useEffect(() => {
    let active = true;
    if (typeof client?.getCreatorProfile !== 'function') {
      return;
    }
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
      if (event.key === null || event.key === 'dorisio:collaborations') refresh(creator.id);
    };
    const handleChange = () => refresh(creator.id);
    window.addEventListener('storage', handleStorage);
    window.addEventListener(COLLABORATIONS_CHANGED_EVENT, handleChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(COLLABORATIONS_CHANGED_EVENT, handleChange);
    };
  }, [creator, refresh]);

  const stats = creator ? getCollaborationStats(creator.id) : null;
  const pendingInvites = collaborations.filter(
    (collaboration) => collaboration.inviteeId === creator?.id && collaboration.status === 'pending'
  );

  async function sendInvite(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!creator || !settings || !inviteUsername.trim()) return;
    setError(null);
    setSaving(true);
    try {
      const target = (await client.getCreatorProfile(inviteUsername.trim().replace(/^@/, ''))) as Creator;
      createCollaborationInvite({
        inviterId: creator.id,
        inviterUserId: userId,
        inviterUsername: creator.username,
        inviterName: creator.displayName || userName || creator.username,
        inviteeId: target.id,
        inviteeUserId: target.userId,
        inviteeUsername: target.username,
        inviteeName: target.displayName,
        inviterShare: settings.defaultRevenueShare,
      });
      setInviteUsername('');
      refresh(creator.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send collaboration invite.');
    } finally {
      setSaving(false);
    }
  }

  function updateSettings(patch: Partial<CollaborationSettings>): void {
    if (!creator || !settings) return;
    const nextSettings = { ...settings, ...patch };
    try {
      saveCollaborationSettings(nextSettings);
      setSettings(nextSettings);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save collaboration settings.');
    }
  }

  function respond(collaboration: CreatorCollaboration, accept: boolean): void {
    if (!creator) return;
    try {
      respondToCollaborationInvite(collaboration.id, creator.id, accept);
      refresh(creator.id);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update collaboration invite.');
    }
  }

  function complete(collaboration: CreatorCollaboration): void {
    if (!creator) return;
    try {
      endCollaboration(collaboration.id, creator.id);
      refresh(creator.id);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not complete collaboration.');
    }
  }

  return (
    <section aria-labelledby="creator-collaborations-heading" className="space-y-6">
      <div className="border-b pb-4">
        <h2 id="creator-collaborations-heading" className="text-xl font-semibold">
          Collaborations
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage guest appearances, requests, and agreed revenue shares.
        </p>
      </div>

      {stats && (
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ['Total', stats.total],
            ['Active', stats.active],
            ['Pending', stats.pending],
            ['Completed', stats.completed],
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
            <h3 className="font-semibold">Guest appearance settings</h3>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.guestAppearancesEnabled}
                onChange={(event) => updateSettings({ guestAppearancesEnabled: event.target.checked })}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">Show guest appearances on my profile</span>
                <span className="text-muted-foreground">Accepted collaborations are public.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.acceptingInvites}
                onChange={(event) => updateSettings({ acceptingInvites: event.target.checked })}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">Accept collaboration invites</span>
                <span className="text-muted-foreground">Turn off to block new requests.</span>
              </span>
            </label>
          </div>

          <form onSubmit={sendInvite} className="space-y-4">
            <h3 className="font-semibold">Invite a creator</h3>
            <label className="block space-y-1 text-sm">
              <span>Creator username</span>
              <input
                value={inviteUsername}
                onChange={(event) => setInviteUsername(event.target.value)}
                placeholder="creator username"
                autoComplete="off"
                required
                className="w-full rounded border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Your proposed share (%)</span>
              <input
                type="number"
                min="1"
                max="99"
                step="1"
                value={settings.defaultRevenueShare}
                onChange={(event) =>
                  updateSettings({ defaultRevenueShare: Number(event.target.value) })
                }
                className="w-full rounded border bg-background px-3 py-2"
              />
              <span className="text-xs text-muted-foreground">
                The invited creator receives {100 - settings.defaultRevenueShare}% if accepted.
              </span>
            </label>
            <button
              type="submit"
              disabled={saving || !creator}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? 'Sending…' : 'Send invite'}
            </button>
          </form>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {pendingInvites.length > 0 && (
        <div className="space-y-3" aria-labelledby="collaboration-requests-heading">
          <h3 id="collaboration-requests-heading" className="font-semibold">
            Incoming requests
          </h3>
          {pendingInvites.map((collaboration) => {
            const partner = getPartner(collaboration, creator!.id);
            return (
              <article key={collaboration.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3">
                <div>
                  <Link href={`/creators/${partner.username}`} className="font-medium hover:underline">
                    {partner.name} <span className="text-muted-foreground">@{partner.username}</span>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Proposed split: {collaboration.inviterShare}% / {collaboration.inviteeShare}%
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => respond(collaboration, true)} className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground">
                    Accept
                  </button>
                  <button type="button" onClick={() => respond(collaboration, false)} className="rounded border px-3 py-2 text-sm">
                    Decline
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold">Collaboration history</h3>
        {collaborations.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No collaboration requests yet.</p>
        ) : (
          collaborations.map((collaboration) => {
            const partner = getPartner(collaboration, creator!.id);
            return (
              <article key={collaboration.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3">
                <div>
                  <Link href={`/creators/${partner.username}`} className="font-medium hover:underline">
                    {partner.name} <span className="text-muted-foreground">@{partner.username}</span>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Your configured share: {partner.share}% · {new Date(collaboration.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm capitalize text-muted-foreground">{collaboration.status}</span>
                  {collaboration.status === 'accepted' && (
                    <button type="button" onClick={() => complete(collaboration)} className="rounded border px-3 py-2 text-sm">
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