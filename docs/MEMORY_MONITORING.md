# Memory monitoring & dashboards

This page describes what memory data we collect in production, where it is
rendered, and how to alert on it. It complements
[MEMORY_PROFILING.md](./MEMORY_PROFILING.md) (local workflow) and
[MEMORY_LEAK_PITFALLS.md](./MEMORY_LEAK_PITFALLS.md) (what tends to leak).

## What is collected

The runtime monitor (`src/lib/memory-monitor.ts`) is started once at app boot
in `src/app/providers.tsx`. It samples the JS heap every
`NEXT_PUBLIC_MEMORY_SAMPLE_MS` (default 15s, 120-sample ring buffer ≈ 30min)
and computes a least-squares growth slope.

When a trend crosses the budget it calls
`recordMemoryMetric('js.heap.used', bytes, {...})`
(`src/lib/monitoring.ts`), which sends a Sentry measurement and a breadcrumb:

| Field | Meaning |
| --- | --- |
| measurement `js.heap.used` | heap used, in bytes |
| `leakSuspected` | always `true` for reported leaks |
| `slopeBytesPerSample` | regression slope at report time |
| `growthBytes` | last − first over the buffered window |
| `sampleCount` | samples in the window |

Sampling is disabled when `NEXT_PUBLIC_MEMORY_MONITOR=off` (useful in
environments without an `NEXT_PUBLIC_SENTRY_DSN`, where `recordMemoryMetric`
is a no-op anyway).

### Browser console / devtools

Even without Sentry, the monitor exposes:

```js
window.__dorisioMemory.snapshot() // MemorySnapshot
window.__dorisioMemory.samples()  // buffered samples
window.__dorisioMemory.trend()    // { leakSuspected, slopeBytesPerSample, ... }
window.__dorisioMemory.start()    // / stop()
```

## Development dashboard

Run `pnpm dev` and open **<http://localhost:3000/dev/memory>** (never
available in production builds). It shows:

- current heap used / total / limit,
- a live strip chart of the buffered samples,
- the leak trend and its plain-language reason.

This is the fastest way to see whether a flow you are reproducing actually
grows the heap.

## Sentry dashboard

Create a dashboard named **Frontend memory** with the following widgets. All
queries use the `js.heap.used` measurement emitted above.

1. **Heap used over time (p50 / p95)** — line chart, `measurements:js.heap.used`,
   1h interval. A flat band is healthy; a staircase is a leak.
2. **Leak reports** — table of events where `leakSuspected:true`, grouped by
   `release` and `url`, so a regression can be pinned to a deploy and route.
3. **Slope distribution** — bar chart of `slopeBytesPerSample`, bucketed;
   watch the p95 over time.
4. **Sample coverage** — count of sessions reporting any `js.heap.used`; if it
   drops, the monitor was disabled or broke.

### Alerts

- **Leak reports spike**: alert when the count of `leakSuspected:true` events
  exceeds 5 in 10 minutes on a single release.
- **Slope p95**: alert when p95 `slopeBytesPerSample` exceeds
  `2 × DEFAULT_LEAK_SLOPE_BYTES_PER_SAMPLE` (≈512KB/sample) for 30 minutes.
- **Heap limit proximity**: on low-memory devices, alert when
  `js.heap.used` exceeds 80% of `limitBytes` in a session.

Tune thresholds in Sentry only after reproducing a real regression locally —
`performance.memory` is Chromium-only and noisy by nature.

## CI dashboards / artifacts

- The `memory` job in `.github/workflows/ci.yml` runs the suite and uploads
  `benchmark-results/` (including `memory-results.json` when the JSON reporter
  runs). Compare `memory-results.json` across runs to see test-level growth.
- Unit budgets and browser baselines live in
  `src/test/memory/baseline.json`; treat changes to it as reviewable signal.

## Baseline governance

1. Run `pnpm memory:profile` against a clean build (ideally `main`).
2. Confirm the numbers look like a normal session, not a hot reload.
3. `pnpm memory:baseline` to record them; commit `baseline.json` with a note in
   the PR explaining the change.
4. `pnpm memory:check` locally before pushing a run that you expect to be
   within budget.
