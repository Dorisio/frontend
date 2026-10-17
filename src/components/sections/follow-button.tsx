/**
 * Follow Button
 * Follow / Unfollow toggle with the creator's follower count.
 */

'use client';

import { useCreatorFollow } from '@/hooks/use-creator-follow';

interface FollowButtonProps {
  creatorId: string;
  followerId?: string | null;
  className?: string;
}

export function FollowButton({ creatorId, followerId, className = '' }: FollowButtonProps) {
  const { following, followerCount, pending, error, canFollow, toggleFollow } = useCreatorFollow(
    creatorId,
    followerId
  );

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void toggleFollow()}
          disabled={!canFollow || pending}
          aria-pressed={following}
          title={canFollow ? undefined : 'Sign in to follow this creator'}
          className={`px-4 py-2 text-sm rounded border transition disabled:opacity-50 disabled:cursor-not-allowed ${
            following
              ? 'bg-background text-foreground hover:bg-muted'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {following ? 'Unfollow' : 'Follow'}
        </button>
        <span className="text-sm text-muted-foreground" data-testid="follower-count">
          {followerCount.toLocaleString('en-US')} {followerCount === 1 ? 'follower' : 'followers'}
        </span>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
