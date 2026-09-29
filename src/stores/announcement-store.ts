/**
 * Creator Announcement / Bulletin Store
 *
 * Manages creator announcements (bulletins) broadcast to followers, including
 * media attachments, pinning, archiving, and per-follower read/notification
 * tracking. Persisted to localStorage via zustand's persist middleware.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AnnouncementMediaType = 'image' | 'video' | 'audio' | 'link';

export interface AnnouncementMedia {
  type: AnnouncementMediaType;
  url: string;
  alt?: string;
}

export interface Announcement {
  id: string;
  creatorId: string;
  creatorName?: string;
  title: string;
  body: string;
  media: AnnouncementMedia[];
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  media?: AnnouncementMedia[];
  pinned?: boolean;
  creatorName?: string;
}

export interface AnnouncementStore {
  /** Announcements by creator ID */
  announcementsByCreator: Record<string, Announcement[]>;
  /** Follower IDs that have been notified about a given announcement ID */
  notifiedFollowers: Record<string, string[]>;

  // Creator management
  createAnnouncement: (creatorId: string, input: CreateAnnouncementInput) => Announcement;
  updateAnnouncement: (
    creatorId: string,
    announcementId: string,
    updates: Partial<Omit<Announcement, 'id' | 'creatorId' | 'createdAt'>>
  ) => void;
  deleteAnnouncement: (creatorId: string, announcementId: string) => void;
  pinAnnouncement: (creatorId: string, announcementId: string, pinned?: boolean) => void;
  archiveAnnouncement: (creatorId: string, announcementId: string, archived?: boolean) => void;

  // Follower reads
  getAnnouncementsForCreator: (creatorId: string, options?: { includeArchived?: boolean }) => Announcement[];
  getActiveAnnouncements: (creatorId: string) => Announcement[];
  getArchivedAnnouncements: (creatorId: string) => Announcement[];
  getPinnedAnnouncements: (creatorId: string) => Announcement[];

  // Notification tracking
  markFollowersNotified: (announcementId: string, followerIds: string[]) => void;
  hasFollowersBeenNotified: (announcementId: string, followerId: string) => boolean;
}

/**
 * Sorts announcements so pinned items come first, then newest first.
 */
export function sortAnnouncements(announcements: Announcement[]): Announcement[] {
  return [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export const useAnnouncementStore = create<AnnouncementStore>()(
  persist(
    (set, get) => ({
      announcementsByCreator: {},
      notifiedFollowers: {},

      createAnnouncement: (creatorId, input) => {
        const now = new Date().toISOString();
        const id = `announcement_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const announcement: Announcement = {
          id,
          creatorId,
          creatorName: input.creatorName,
          title: input.title.trim(),
          body: input.body.trim(),
          media: input.media ?? [],
          pinned: input.pinned ?? false,
          archived: false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          const existing = state.announcementsByCreator[creatorId] || [];
          return {
            announcementsByCreator: {
              ...state.announcementsByCreator,
              [creatorId]: [announcement, ...existing],
            },
          };
        });

        return announcement;
      },

      updateAnnouncement: (creatorId, announcementId, updates) => {
        set((state) => {
          const list = state.announcementsByCreator[creatorId] || [];
          const updated = list.map((item) =>
            item.id === announcementId
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item
          );
          return {
            announcementsByCreator: {
              ...state.announcementsByCreator,
              [creatorId]: updated,
            },
          };
        });
      },

      deleteAnnouncement: (creatorId, announcementId) => {
        set((state) => {
          const list = state.announcementsByCreator[creatorId] || [];
          return {
            announcementsByCreator: {
              ...state.announcementsByCreator,
              [creatorId]: list.filter((item) => item.id !== announcementId),
            },
          };
        });
      },

      pinAnnouncement: (creatorId, announcementId, pinned = true) => {
        get().updateAnnouncement(creatorId, announcementId, { pinned });
      },

      archiveAnnouncement: (creatorId, announcementId, archived = true) => {
        get().updateAnnouncement(creatorId, announcementId, {
          archived,
          archivedAt: archived ? new Date().toISOString() : undefined,
        });
      },

      getAnnouncementsForCreator: (creatorId, options) => {
        const list = get().announcementsByCreator[creatorId] || [];
        const filtered = options?.includeArchived
          ? list
          : list.filter((item) => !item.archived);
        return sortAnnouncements(filtered);
      },

      getActiveAnnouncements: (creatorId) => {
        const list = get().announcementsByCreator[creatorId] || [];
        return sortAnnouncements(list.filter((item) => !item.archived));
      },

      getArchivedAnnouncements: (creatorId) => {
        const list = get().announcementsByCreator[creatorId] || [];
        return sortAnnouncements(list.filter((item) => item.archived));
      },

      getPinnedAnnouncements: (creatorId) => {
        const list = get().announcementsByCreator[creatorId] || [];
        return sortAnnouncements(list.filter((item) => item.pinned && !item.archived));
      },

      markFollowersNotified: (announcementId, followerIds) => {
        set((state) => {
          const existing = state.notifiedFollowers[announcementId] || [];
          const merged = Array.from(new Set([...existing, ...followerIds]));
          return {
            notifiedFollowers: {
              ...state.notifiedFollowers,
              [announcementId]: merged,
            },
          };
        });
      },

      hasFollowersBeenNotified: (announcementId, followerId) => {
        const notified = get().notifiedFollowers[announcementId] || [];
        return notified.includes(followerId);
      },
    }),
    {
      name: 'dorisio-announcements',
    }
  )
);
