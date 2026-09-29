import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AnnouncementFeed } from './announcement-feed';
import { useAnnouncementStore } from '@/stores/announcement-store';

describe('AnnouncementFeed', () => {
  const creatorId = 'creator_feed_1';

  beforeEach(() => {
    localStorage.clear();
    useAnnouncementStore.setState({ announcementsByCreator: {}, notifiedFollowers: {} });
  });

  it('renders active announcements for followers', () => {
    useAnnouncementStore.getState().createAnnouncement(creatorId, {
      title: 'Welcome followers',
      body: 'Thanks for following!',
    });

    render(<AnnouncementFeed creatorId={creatorId} creatorName="Alice" />);

    expect(screen.getByTestId('announcement-feed')).toBeInTheDocument();
    expect(screen.getByText('Welcome followers')).toBeInTheDocument();
    expect(screen.getByText('Thanks for following!')).toBeInTheDocument();
  });

  it('renders pinned announcements in a dedicated section', () => {
    useAnnouncementStore.getState().createAnnouncement(creatorId, {
      title: 'Pinned post',
      body: 'Important',
      pinned: true,
    });
    useAnnouncementStore.getState().createAnnouncement(creatorId, {
      title: 'Regular post',
      body: 'Normal',
    });

    render(<AnnouncementFeed creatorId={creatorId} />);

    const pinnedSection = screen.getByTestId('pinned-announcements');
    expect(pinnedSection).toHaveTextContent('Pinned post');
    expect(pinnedSection).not.toHaveTextContent('Regular post');
  });

  it('renders media attachments', () => {
    useAnnouncementStore.getState().createAnnouncement(creatorId, {
      title: 'Media post',
      body: 'Look',
      media: [
        { type: 'image', url: 'https://example.com/a.png', alt: 'Poster' },
        { type: 'video', url: 'https://example.com/b.mp4' },
      ],
    });

    render(<AnnouncementFeed creatorId={creatorId} />);

    expect(screen.getByAltText('Poster')).toBeInTheDocument();
    expect(screen.getByTestId('announcement-video')).toBeInTheDocument();
  });

  it('toggles between active and archived announcements', () => {
    const store = useAnnouncementStore.getState();
    const archived = store.createAnnouncement(creatorId, {
      title: 'Archived post',
      body: 'Old',
    });
    store.createAnnouncement(creatorId, { title: 'Active post', body: 'New' });
    store.archiveAnnouncement(creatorId, archived.id);

    render(<AnnouncementFeed creatorId={creatorId} />);

    expect(screen.getByText('Active post')).toBeInTheDocument();
    expect(screen.queryByText('Archived post')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('toggle-archived-announcements'));

    expect(screen.getByText('Archived post')).toBeInTheDocument();
    expect(screen.queryByText('Active post')).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no announcements', () => {
    render(<AnnouncementFeed creatorId={creatorId} />);
    expect(screen.getByText(/no announcements yet/i)).toBeInTheDocument();
  });
});
