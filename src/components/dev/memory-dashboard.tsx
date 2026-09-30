'use client';

/**
 * Live memory dashboard (development only).
 *
 * Renders the runtime `MemoryMonitor` samples as a live strip chart plus the
 * leak trend it computes. Mounted by the development-only route at
 * /dev/memory. See docs/MEMORY_PROFILING.md and docs/MEMORY_MONITORING.md.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  getMemorySnapshot,
  startMemoryMonitor,
  type MemorySnapshot,
  type MemoryTrend,
} from '@/lib/memory-monitor';

const REFRESH_MS = 2000;

function formatBytes(bytes: number | null): string {
  if (bytes === null) return 'n/a';
  const abs = Math.abs(bytes);
  if (abs < 1024) return `${bytes}B`;
  if (abs < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

export function MemoryDashboard(): JSX.Element {
  const [samples, setSamples] = useState<MemorySnapshot[]>([]);
  const [trend, setTrend] = useState<MemoryTrend | null>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const monitor = startMemoryMonitor();
    setAvailable(getMemorySnapshot() !== null);
    setSamples(monitor.getSamples());
    setTrend(monitor.analyse());

    const interval = setInterval(() => {
      monitor.capture();
      setSamples(monitor.getSamples());
      setTrend(monitor.analyse());
    }, REFRESH_MS);

    return () => clearInterval(interval);
  }, []);

  const maxUsed = useMemo(
    () => samples.reduce((max, sample) => Math.max(max, sample.usedBytes), 0) || 1,
    [samples]
  );

  const latest = samples.length > 0 ? samples[samples.length - 1] : null;

  return (
    <div className="space-y-6" data-testid="memory-dashboard">
      {!available && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          This browser does not expose <code>performance.memory</code>. Use Chromium for heap
          metrics, or the Node-side suite via <code>pnpm test:memory</code>.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Heap used" value={formatBytes(latest?.usedBytes ?? null)} />
        <Stat label="Heap total" value={formatBytes(latest?.totalBytes ?? null)} />
        <Stat label="Heap limit" value={formatBytes(latest?.limitBytes ?? null)} />
        <Stat
          label="Samples"
          value={String(samples.length)}
          tone={trend?.leakSuspected ? 'danger' : 'default'}
        />
      </div>

      <div className="rounded border p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-semibold">Heap over time</h2>
          {trend && (
            <span
              className={
                trend.leakSuspected
                  ? 'text-sm font-medium text-destructive'
                  : 'text-sm text-muted-foreground'
              }
            >
              {trend.leakSuspected ? 'Possible leak' : 'Within budget'} ·{' '}
              {formatBytes(Math.round(trend.slopeBytesPerSample))}/sample
            </span>
          )}
        </div>

        {samples.length === 0 ? (
          <p className="text-sm text-muted-foreground">Collecting samples…</p>
        ) : (
          <div className="flex h-32 items-end gap-1" role="img" aria-label="Heap usage samples">
            {samples.map((sample, index) => (
              <div
                key={`${sample.timestamp}-${index}`}
                className={
                  trend?.leakSuspected
                    ? 'flex-1 rounded-t bg-destructive/70'
                    : 'flex-1 rounded-t bg-primary/70'
                }
                style={{ height: `${Math.max(4, (sample.usedBytes / maxUsed) * 100)}%` }}
                title={`${formatBytes(sample.usedBytes)} @ ${new Date(
                  sample.timestamp
                ).toLocaleTimeString()}`}
              />
            ))}
          </div>
        )}
      </div>

      {trend && (
        <p className="text-sm text-muted-foreground" data-testid="memory-trend-reason">
          {trend.reason}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Sampling every {REFRESH_MS / 1000}s. Programmatic access:{' '}
        <code>window.__dorisioMemory.snapshot()</code>.
      </p>
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  tone?: 'default' | 'danger';
}

function Stat({ label, value, tone = 'default' }: StatProps): JSX.Element {
  return (
    <div className="rounded border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={tone === 'danger' ? 'text-lg font-bold text-destructive' : 'text-lg font-bold'}>
        {value}
      </p>
    </div>
  );
}
