'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useAnnouncementStore, type Announcement } from '@/stores/announcement-store';

/**
 * Notifies followers about a newly published announcement.
 *
 * Uses the global toast notification system and records which followers have
 * already been notified so the same announcement is never delivered twice.
 */
export function useAnnouncementNotifications() {
  const addNotification = useAppStore((state) => state.addNotification);
  const markFollowersNotified = useAnnouncementStore((state) => state.markFollowersNotified);
  const hasFollowersBeenNotified = useAnnouncementStore(
    (state) => state.hasFollowersBeenNotified
  );

  const notifyFollowers = useCallback(
    (announcement: Announcement, followerIds: string[] = []) => {
      const pending = followerIds.filter(
        (followerId) => !hasFollowersBeenNotified(announcement.id, followerId)
      );

      if (pending.length === 0) return 0;

      addNotification({
        type: 'info',
        title: 'New announcement',
        message: `${announcement.creatorName || 'A creator you follow'} posted: ${announcement.title}`,
      });

      markFollowersNotified(announcement.id, pending);
      return pending.length;
    },
    [addNotification, hasFollowersBeenNotified, markFollowersNotified]
  );

  return { notifyFollowers };
}
