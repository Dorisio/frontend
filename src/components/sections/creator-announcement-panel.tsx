'use client';

import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Pin,
  PinOff,
  Archive,
  RotateCcw,
  Trash2,
  Image as ImageIcon,
  Video,
  Link2,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSafeTimeout } from '@/hooks/use-timeout';
import {
  useAnnouncementStore,
  type Announcement,
  type AnnouncementMedia,
  type AnnouncementMediaType,
} from '@/stores/announcement-store';

export interface CreatorAnnouncementPanelProps {
  creatorId: string;
  creatorName?: string;
  /** Called after a new announcement is published, e.g. to notify followers. */
  onAnnouncementCreated?: (announcement: Announcement) => void;
}

const MEDIA_OPTIONS: { value: AnnouncementMediaType; label: string; icon: typeof ImageIcon }[] = [
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'link', label: 'Link', icon: Link2 },
];

export function CreatorAnnouncementPanel({
  creatorId,
  creatorName,
  onAnnouncementCreated,
}: CreatorAnnouncementPanelProps): JSX.Element {
  const announcements = useAnnouncementStore((state) =>
    state.getAnnouncementsForCreator(creatorId, { includeArchived: true })
  );
  const createAnnouncement = useAnnouncementStore((state) => state.createAnnouncement);
  const pinAnnouncement = useAnnouncementStore((state) => state.pinAnnouncement);
  const archiveAnnouncement = useAnnouncementStore((state) => state.archiveAnnouncement);
  const deleteAnnouncement = useAnnouncementStore((state) => state.deleteAnnouncement);
  const { schedule } = useSafeTimeout();

  const [isOpenForm, setIsOpenForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<AnnouncementMediaType>('image');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const media: AnnouncementMedia[] = mediaUrl.trim()
      ? [{ type: mediaType, url: mediaUrl.trim() }]
      : [];

    const created = createAnnouncement(creatorId, {
      title,
      body,
      media,
      pinned,
      creatorName,
    });

    onAnnouncementCreated?.(created);

    setTitle('');
    setBody('');
    setMediaUrl('');
    setPinned(false);
    setIsOpenForm(false);
    setSuccessMessage('Announcement published to your followers!');
    schedule(() => setSuccessMessage(null), 4000);
  };

  return (
    <Card className="border border-border/80 shadow-sm" data-testid="creator-announcement-panel">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Announcements & Bulletin
          </CardTitle>
          <CardDescription>
            Broadcast important updates to your followers. Pin key posts and archive old ones.
          </CardDescription>
        </div>

        <Button
          onClick={() => setIsOpenForm(!isOpenForm)}
          className="flex items-center gap-1.5"
          data-testid="create-announcement-button"
        >
          <Plus className="h-4 w-4" />
          {isOpenForm ? 'Cancel' : 'New Announcement'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {isOpenForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-4 rounded-lg bg-card/50 border border-primary/20"
            data-testid="announcement-form"
          >
            <h3 className="font-semibold text-base">New Announcement</h3>

            <div className="space-y-1.5">
              <Label htmlFor="announcement-title">Title *</Label>
              <Input
                id="announcement-title"
                placeholder="e.g. New album drops next Friday!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                data-testid="announcement-title-input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="announcement-body">Message *</Label>
              <textarea
                id="announcement-body"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Share the details with your followers..."
                rows={4}
                value={body}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
                required
                data-testid="announcement-body-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="announcement-media-type">Media Type</Label>
                <select
                  id="announcement-media-type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as AnnouncementMediaType)}
                  data-testid="announcement-media-type-select"
                >
                  {MEDIA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="announcement-media-url">Media URL (optional)</Label>
                <Input
                  id="announcement-media-url"
                  placeholder="https://..."
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  data-testid="announcement-media-url-input"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                data-testid="announcement-pinned-checkbox"
              />
              Pin this announcement to the top of the feed
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpenForm(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="publish-announcement-button">
                Publish Announcement
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Your Announcements ({announcements.length})
          </h4>

          {announcements.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground">
              <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-sm">No announcements yet</p>
              <p className="text-xs mt-1">
                Click &quot;New Announcement&quot; to broadcast an update to your followers.
              </p>
            </div>
          ) : (
            <ul className="space-y-3" data-testid="creator-announcement-list">
              {announcements.map((announcement) => (
                <li
                  key={announcement.id}
                  className="p-4 rounded-lg border bg-card/40 space-y-2"
                  data-testid={`creator-announcement-${announcement.id}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{announcement.title}</span>
                    {announcement.pinned && (
                      <Badge variant="outline" className="text-xs">
                        Pinned
                      </Badge>
                    )}
                    {announcement.archived && (
                      <Badge variant="secondary" className="text-xs">
                        Archived
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {announcement.body}
                  </p>
                  {announcement.media.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {announcement.media.length} media attachment
                      {announcement.media.length > 1 ? 's' : ''}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        pinAnnouncement(creatorId, announcement.id, !announcement.pinned)
                      }
                      data-testid={`pin-announcement-${announcement.id}`}
                    >
                      {announcement.pinned ? (
                        <>
                          <PinOff className="h-3.5 w-3.5 mr-1" /> Unpin
                        </>
                      ) : (
                        <>
                          <Pin className="h-3.5 w-3.5 mr-1" /> Pin
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        archiveAnnouncement(creatorId, announcement.id, !announcement.archived)
                      }
                      data-testid={`archive-announcement-${announcement.id}`}
                    >
                      {announcement.archived ? (
                        <>
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Unarchive
                        </>
                      ) : (
                        <>
                          <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteAnnouncement(creatorId, announcement.id)}
                      data-testid={`delete-announcement-${announcement.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
