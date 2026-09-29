import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CreatorAnnouncementPanel } from './creator-announcement-panel';
import { useAnnouncementStore } from '@/stores/announcement-store';

describe('CreatorAnnouncementPanel', () => {
  const creatorId = 'creator_panel_1';

  beforeEach(() => {
    localStorage.clear();
    useAnnouncementStore.setState({ announcementsByCreator: {}, notifiedFollowers: {} });
  });

  it('creates an announcement through the form', () => {
    const onCreated = vi.fn();
    render(
      <CreatorAnnouncementPanel
        creatorId={creatorId}
        creatorName="Alice"
        onAnnouncementCreated={onCreated}
      />
    );

    fireEvent.click(screen.getByTestId('create-announcement-button'));
    fireEvent.change(screen.getByTestId('announcement-title-input'), {
      target: { value: 'Big news' },
    });
    fireEvent.change(screen.getByTestId('announcement-body-input'), {
      target: { value: 'Something important' },
    });
    fireEvent.click(screen.getByTestId('publish-announcement-button'));

    const stored = useAnnouncementStore.getState().getAnnouncementsForCreator(creatorId);
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('Big news');
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/published to your followers/i)).toBeInTheDocument();
  });

  it('attaches media when a URL is provided', () => {
    render(<CreatorAnnouncementPanel creatorId={creatorId} />);

    fireEvent.click(screen.getByTestId('create-announcement-button'));
    fireEvent.change(screen.getByTestId('announcement-title-input'), {
      target: { value: 'With media' },
    });
    fireEvent.change(screen.getByTestId('announcement-body-input'), {
      target: { value: 'Check this out' },
    });
    fireEvent.change(screen.getByTestId('announcement-media-url-input'), {
      target: { value: 'https://example.com/pic.png' },
    });
    fireEvent.click(screen.getByTestId('publish-announcement-button'));

    const stored = useAnnouncementStore.getState().getAnnouncementsForCreator(creatorId);
    expect(stored[0].media).toEqual([{ type: 'image', url: 'https://example.com/pic.png' }]);
  });

  it('pins and archives announcements from the list', () => {
    const created = useAnnouncementStore.getState().createAnnouncement(creatorId, {
      title: 'Manage me',
      body: 'body',
    });

    render(<CreatorAnnouncementPanel creatorId={creatorId} />);

    fireEvent.click(screen.getByTestId(`pin-announcement-${created.id}`));
    expect(useAnnouncementStore.getState().getPinnedAnnouncements(creatorId)).toHaveLength(1);

    fireEvent.click(screen.getByTestId(`archive-announcement-${created.id}`));
    expect(useAnnouncementStore.getState().getArchivedAnnouncements(creatorId)).toHaveLength(1);
  });

  it('shows an empty state when there are no announcements', () => {
    render(<CreatorAnnouncementPanel creatorId={creatorId} />);
    expect(screen.getByText(/no announcements yet/i)).toBeInTheDocument();
  });
});
