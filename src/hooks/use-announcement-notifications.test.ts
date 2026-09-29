import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnnouncementNotifications } from './use-announcement-notifications';
import { useAnnouncementStore } from '@/stores/announcement-store';
import { useAppStore } from '@/stores/app-store';

describe('useAnnouncementNotifications', () => {
  const creatorId = 'creator_notify_1';

  beforeEach(() => {
    localStorage.clear();
    useAnnouncementStore.setState({ announcementsByCreator: {}, notifiedFollowers: {} });
    useAppStore.setState({ notifications: [] });
  });

  it('notifies followers once per announcement', () => {
    const announcement = useAnnouncementStore.getState().createAnnouncement(creatorId, {
      title: 'Live tonight',
      body: 'Join the stream',
      creatorName: 'Alice',
    });

    const { result } = renderHook(() => useAnnouncementNotifications());

    let notified = 0;
    act(() => {
      notified = result.current.notifyFollowers(announcement, ['f1', 'f2']);
    });

    expect(notified).toBe(2);
    expect(useAppStore.getState().notifications).toHaveLength(1);
    expect(useAppStore.getState().notifications[0].message).toContain('Live tonight');

    // Second call should not re-notify the same followers.
    act(() => {
      notified = result.current.notifyFollowers(announcement, ['f1', 'f2']);
    });

    expect(notified).toBe(0);
    expect(useAppStore.getState().notifications).toHaveLength(1);
  });

  it('notifies only followers who have not been notified yet', () => {
    const announcement = useAnnouncementStore.getState().createAnnouncement(creatorId, {
      title: 'Update',
      body: 'body',
    });

    const { result } = renderHook(() => useAnnouncementNotifications());

    act(() => {
      result.current.notifyFollowers(announcement, ['f1']);
    });
    act(() => {
      result.current.notifyFollowers(announcement, ['f1', 'f2']);
    });

    expect(useAnnouncementStore.getState().notifiedFollowers[announcement.id]).toEqual([
      'f1',
      'f2',
    ]);
    expect(useAppStore.getState().notifications).toHaveLength(2);
  });
});
