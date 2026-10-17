'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDorisio } from 'dorisio-sdk/react';
import { readStoredValue, writeStoredValue } from '@/lib/subscriptions';

export const CREATOR_FOLLOWS_KEY = 'dorisio_creator_follows';

interface FollowState {
  following: boolean;
  followerCount: number;
}

interface FollowResponse {
  following?: boolean;
  followerCount?: number;
}

type StoredFollows = Record<string, FollowState>;

function storageKey(followerId: string, creatorId: string): string {
  return `${followerId}:${creatorId}`;
}

function readStored(followerId: string, creatorId: string): FollowState | null {
  return (
    readStoredValue<StoredFollows>(CREATOR_FOLLOWS_KEY, {})[storageKey(followerId, creatorId)] ??
    null
  );
}

function writeStored(followerId: string, creatorId: string, state: FollowState): void {
  const all = readStoredValue<StoredFollows>(CREATOR_FOLLOWS_KEY, {});
  writeStoredValue(CREATOR_FOLLOWS_KEY, { ...all, [storageKey(followerId, creatorId)]: state });
}

export interface UseCreatorFollowResult {
  following: boolean;
  followerCount: number;
  pending: boolean;
  error: string | null;
  canFollow: boolean;
  toggleFollow: () => Promise<void>;
}

/**
 * Follow state for one creator, via the SDK client.
 * The last known state is kept in localStorage so the button and count are
 * right immediately after a reload, then replaced by the server's answer.
 */
export function useCreatorFollow(
  creatorId: string | null | undefined,
  followerId: string | null | undefined
): UseCreatorFollowResult {
  const { client } = useDorisio();
  const [state, setState] = useState<FollowState>({ following: false, followerCount: 0 });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  // Held in a ref so a client that is re-created on render never re-triggers the status fetch.
  const clientRef = useRef(client);
  clientRef.current = client;

  const path = creatorId ? `/creators/${encodeURIComponent(creatorId)}/follow` : '';

  useEffect(() => {
    if (!creatorId) return;
    const stored = followerId ? readStored(followerId, creatorId) : null;
    setState(stored ?? { following: false, followerCount: 0 });
    setError(null);

    let cancelled = false;
    (async () => {
      try {
        const response = await clientRef.current.request<FollowResponse>('GET', path);
        if (cancelled || !response?.success || !response.data) return;
        const next: FollowState = {
          following: followerId ? Boolean(response.data.following) : false,
          followerCount:
            typeof response.data.followerCount === 'number'
              ? response.data.followerCount
              : (stored?.followerCount ?? 0),
        };
        setState(next);
        if (followerId) writeStored(followerId, creatorId, next);
      } catch {
        // Keep the stored state; the status check is best-effort.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [creatorId, followerId, path]);

  const toggleFollow = useCallback(async (): Promise<void> => {
    if (!creatorId || !followerId || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);

    const previous = state;
    const nextFollowing = !previous.following;
    const optimistic: FollowState = {
      following: nextFollowing,
      followerCount: Math.max(0, previous.followerCount + (nextFollowing ? 1 : -1)),
    };
    setState(optimistic);

    try {
      const response = await clientRef.current.request<FollowResponse>(
        nextFollowing ? 'POST' : 'DELETE',
        path
      );
      if (!response?.success) {
        throw new Error(nextFollowing ? 'Failed to follow creator' : 'Failed to unfollow creator');
      }
      const confirmed: FollowState = {
        following: nextFollowing,
        followerCount:
          typeof response.data?.followerCount === 'number'
            ? response.data.followerCount
            : optimistic.followerCount,
      };
      setState(confirmed);
      writeStored(followerId, creatorId, confirmed);
    } catch (err) {
      setState(previous);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, [creatorId, followerId, path, state]);

  return {
    following: state.following,
    followerCount: state.followerCount,
    pending,
    error,
    canFollow: Boolean(followerId && creatorId),
    toggleFollow,
  };
}
