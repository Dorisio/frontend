'use client';

import React, { useState } from 'react';
import { Megaphone, Pin, Archive, Image as ImageIcon, Video, Link2, Music } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useAnnouncementStore,
  type Announcement,
  type AnnouncementMedia,
} from '@/stores/announcement-store';

export interface AnnouncementFeedProps {
  creatorId: string;
  creatorName?: string;
}

function AnnouncementMediaView({ media }: { media: AnnouncementMedia }): JSX.Element {
  switch (media.type) {
    case 'image':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.url}
          alt={media.alt || 'Announcement image'}
          className="rounded-md max-h-80 w-full object-cover border"
        />
      );
    case 'video':
      return (
        <video
          src={media.url}
          controls
          className="rounded-md max-h-80 w-full border"
          data-testid="announcement-video"
        />
      );
    case 'audio':
      return <audio src={media.url} controls className="w-full" data-testid="announcement-audio" />;
    case 'link':
    default:
      return (
        <a
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary underline"
        >
          <Link2 className="h-3.5 w-3.5" />
          {media.alt || media.url}
        </a>
      );
  }
}

function mediaIcon(type: AnnouncementMedia['type']) {
  switch (type) {
    case 'image':
      return ImageIcon;
    case 'video':
      return Video;
    case 'audio':
      return Music;
    default:
      return Link2;
  }
}

export function AnnouncementFeed({ creatorId, creatorName }: AnnouncementFeedProps): JSX.Element {
  const activeAnnouncements = useAnnouncementStore((state) =>
    state.getActiveAnnouncements(creatorId)
  );
  const archivedAnnouncements = useAnnouncementStore((state) =>
    state.getArchivedAnnouncements(creatorId)
  );

  const [showArchived, setShowArchived] = useState(false);

  const pinned = activeAnnouncements.filter((a) => a.pinned);
  const rest = activeAnnouncements.filter((a) => !a.pinned);
  const visible = showArchived ? archivedAnnouncements : activeAnnouncements;

  const renderCard = (announcement: Announcement) => (
    <Card
      key={announcement.id}
      className="border border-border/80"
      data-testid={`announcement-${announcement.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{announcement.title}</CardTitle>
          {announcement.pinned && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Pin className="h-3 w-3" /> Pinned
            </Badge>
          )}
          {announcement.archived && (
            <Badge variant="secondary" className="text-xs">
              Archived
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {creatorName || announcement.creatorName || 'Creator'} ·{' '}
          {new Date(announcement.createdAt).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm whitespace-pre-wrap">{announcement.body}</p>
        {announcement.media.map((media, index) => (
          <div key={`${announcement.id}-media-${index}`} className="flex items-center gap-2">
            {React.createElement(mediaIcon(media.type), { className: 'h-4 w-4 shrink-0' })}
            <div className="flex-1">
              <AnnouncementMediaView media={media} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <section className="space-y-4" data-testid="announcement-feed" aria-label="Creator announcements">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Announcements
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowArchived((prev) => !prev)}
          data-testid="toggle-archived-announcements"
        >
          <Archive className="h-3.5 w-3.5 mr-1" />
          {showArchived ? 'Show active' : `Show archived (${archivedAnnouncements.length})`}
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground">
          <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="font-medium text-sm">
            {showArchived ? 'No archived announcements' : 'No announcements yet'}
          </p>
        </div>
      ) : showArchived ? (
        <div className="space-y-4">{visible.map(renderCard)}</div>
      ) : (
        <div className="space-y-4">
          {pinned.length > 0 && (
            <div className="space-y-4" data-testid="pinned-announcements">
              {pinned.map(renderCard)}
            </div>
          )}
          {rest.map(renderCard)}
        </div>
      )}
    </section>
  );
}
