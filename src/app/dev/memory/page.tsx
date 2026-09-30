/**
 * Development-only memory dashboard.
 *
 * Renders the live runtime heap monitor (src/lib/memory-monitor.ts) so a
 * developer can watch a session for sustained growth while reproducing a leak.
 * Not available in production builds.
 *
 * Visit http://localhost:3000/dev/memory with `pnpm dev`.
 */

import { notFound } from 'next/navigation';
import { MemoryDashboard } from '@/components/dev/memory-dashboard';

export const dynamic = 'force-dynamic';

export default function DevMemoryPage(): JSX.Element {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Memory monitor</h1>
          <p className="text-muted-foreground">
            Live JS heap samples and leak trend for this tab. Development only.
          </p>
        </div>
        <MemoryDashboard />
      </div>
    </main>
  );
}
