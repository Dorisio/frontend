import { describe, it, expect, beforeEach } from 'vitest';
import { useAnnouncementStore, sortAnnouncements, type Announcement } from './announcement-store';

describe('useAnnouncementStore', () => {
  const creatorId = 'creator_announce_1';

  beforeEach(() => {
    localStorage.clear();
    useAnnouncementStore.setState({
      announcementsByCreator: {},
      notifiedFollowers: {},
    });
  });

  it('creates an announcement with defaults', () => {
    const created = useAnnouncementStore.getState().createAnnouncement(creatorId, {
      title: '  New album  ',
      body: '  Drops Friday  ',
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('New album');
    expect(created.body).toBe('Drops Friday');
    expect(created.pinned).toBe(false);
    expect(created.archived).toBe(false);
    expect(created.media).toEqual([]);

    const list = useAnnouncementStore.getState().getAnnouncementsForCreator(creatorId);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(created.id);
  });

  it('supports media attachments on announcements', () => {
    const created = useAnnouncementStore.getState().createAnnouncement(creatorId, {
      title: 'Tour dates',
      body: 'See you on the road',
      media: [
        { type: 'image', url: 'https://example.com/poster.png' },
        { type: 'video', url: 'https://example.com/teaser.mp4' },
      ],
    });

    expect(created.media).toHaveLength(2);
    expect(created.media[0].type).toBe('image');
    expect(created.media[1].type).toBe('video');
  });

  it('pins and unpins announcements', () => {
    const store = useAnnouncementStore.getState();
    const created = store.createAnnouncement(creatorId, { title: 'Important', body: 'Read me' });

    store.pinAnnouncement(creatorId, created.id);
    expect(useAnnouncementStore.getState().getPinnedAnnouncements(creatorId)).toHaveLength(1);

    useAnnouncementStore.getState().pinAnnouncement(creatorId, created.id, false);
    expect(useAnnouncementStore.getState().getPinnedAnnouncements(creatorId)).toHaveLength(0);
  });

  it('archives and unarchives announcements', () => {
    const store = useAnnouncementStore.getState();
    const created = store.createAnnouncement(creatorId, { title: 'Old news', body: 'Archive me' });

    store.archiveAnnouncement(creatorId, created.id);

    expect(useAnnouncementStore.getState().getActiveAnnouncements(creatorId)).toHaveLength(0);
    const archived = useAnnouncementStore.getState().getArchivedAnnouncements(creatorId);
    expect(archived).toHaveLength(1);
    expect(archived[0].archivedAt).toBeDefined();

    useAnnouncementStore.getState().archiveAnnouncement(creatorId, created.id, false);
    expect(useAnnouncementStore.getState().getActiveAnnouncements(creatorId)).toHaveLength(1);
    expect(useAnnouncementStore.getState().getArchivedAnnouncements(creatorId)).toHaveLength(0);
  });

  it('excludes archived announcements unless explicitly requested', () => {
    const store = useAnnouncementStore.getState();
    const a = store.createAnnouncement(creatorId, { title: 'A', body: 'a' });
    store.createAnnouncement(creatorId, { title: 'B', body: 'b' });
    store.archiveAnnouncement(creatorId, a.id);

    expect(useAnnouncementStore.getState().getAnnouncementsForCreator(creatorId)).toHaveLength(1);
    expect(
      useAnnouncementStore
        .getState()
        .getAnnouncementsForCreator(creatorId, { includeArchived: true })
    ).toHaveLength(2);
  });

  it('updates and deletes announcements', () => {
    const store = useAnnouncementStore.getState();
    const created = store.createAnnouncement(creatorId, { title: 'Draft', body: 'body' });

    store.updateAnnouncement(creatorId, created.id, { title: 'Final' });
    expect(useAnnouncementStore.getState().getAnnouncementsForCreator(creatorId)[0].title).toBe(
      'Final'
    );

    useAnnouncementStore.getState().deleteAnnouncement(creatorId, created.id);
    expect(useAnnouncementStore.getState().getAnnouncementsForCreator(creatorId)).toHaveLength(0);
  });

  it('tracks which followers have been notified', () => {
    const store = useAnnouncementStore.getState();
    const created = store.createAnnouncement(creatorId, { title: 'Hi', body: 'there' });

    expect(store.hasFollowersBeenNotified(created.id, 'follower_1')).toBe(false);

    store.markFollowersNotified(created.id, ['follower_1', 'follower_2']);
    expect(useAnnouncementStore.getState().hasFollowersBeenNotified(created.id, 'follower_1')).toBe(
      true
    );
    expect(useAnnouncementStore.getState().hasFollowersBeenNotified(created.id, 'follower_3')).toBe(
      false
    );

    // Marking again should not duplicate entries.
    useAnnouncementStore.getState().markFollowersNotified(created.id, ['follower_1']);
    expect(useAnnouncementStore.getState().notifiedFollowers[created.id]).toEqual([
      'follower_1',
      'follower_2',
    ]);
  });

  it('sorts pinned announcements first, then newest first', () => {
    const base: Announcement = {
      id: 'a',
      creatorId,
      title: 'A',
      body: 'a',
      media: [],
      pinned: false,
      archived: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    const sorted = sortAnnouncements([
      { ...base, id: 'old', createdAt: '2024-01-01T00:00:00.000Z' },
      { ...base, id: 'new', createdAt: '2024-03-01T00:00:00.000Z' },
      { ...base, id: 'pinned', pinned: true, createdAt: '2023-01-01T00:00:00.000Z' },
    ]);

    expect(sorted.map((item) => item.id)).toEqual(['pinned', 'new', 'old']);
  });
});
