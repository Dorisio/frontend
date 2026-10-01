/**
 * Moderation Page
 * Creator moderation dashboard for managing content and user interactions
 */

'use client';

import { ModerationDashboard } from '@/components/sections/moderation-dashboard';

export default function ModerationPage({
  params,
}: {
  params: { username: string };
}): JSX.Element {
  const username = params.username;
  return (
    <div className="container mx-auto py-8">
      <ModerationDashboard username={username} />
    </div>
  );
}
