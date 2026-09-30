# Memory profiling guide

Memory leaks in a long-lived SPA (this app can stay open on a creator
dashboard for hours) show up as steadily growing heap, janky rendering, and —
on low-memory mobile devices — tab crashes. This guide covers the tooling in
this repo and the workflow for finding and fixing a leak.

See also [MEMORY_LEAK_PITFALLS.md](./MEMORY_LEAK_PITFALLS.md) for the leak
patterns we have actually hit, and
[MEMORY_MONITORING.md](./MEMORY_MONITORING.md) for dashboards and alerts.

## Tooling at a glance

| Tool | What it answers | Where |
| --- | --- | --- |
| Runtime monitor | "Is heap growing over a real session?" | `src/lib/memory-monitor.ts`, started in `src/app/providers.tsx` |
| Dev dashboard | "What does the growth curve look like right now?" | `/dev/memory` (dev builds only) |
| Memory test suite | "Did this mount/unmount/collection leak?" | `src/test/memory/*.memory.test.*` (`pnpm test:memory`) |
| Browser heap profiler | "Which route leaks across repeated visits?" | `scripts/memory-profile.mjs` (`pnpm memory:profile`) |
| CI gate | "Did this PR regress memory?" | `memory` job in `.github/workflows/ci.yml` |

No extra npm dependencies were added: the monitor uses the browser/Node heap
APIs, the profiler reuses Playwright, and the suite reuses Vitest.

## Quick start

```bash
pnpm test:memory          # deterministic leak tests + heap-growth budget (needs --expose-gc; provided)
pnpm dev                  # then open http://localhost:3000/dev/memory
pnpm memory:profile       # profile routes against a running server
pnpm memory:baseline      # promote a clean profile run to the committed baseline
pnpm memory:check         # fail if the latest profile regressed
```

## Workflow for a suspected leak

1. **Reproduce with the runtime monitor.** Open `/dev/memory`, perform the
   action that seems to leak (open/close a dashboard, paginate a feed, receive
   tips), and watch the chart. The trend line reports the slope per sample; a
   sustained positive slope is a lead, not proof (normal caching also grows).

2. **Narrow to a component or module.** Reproduce in isolation. For hooks and
   components, the memory suite is usually faster than the browser:
   mount/unmount in a loop and check that timers, listeners, and arrays are
   cleaned up.

3. **Take heap snapshots when the source isn't obvious.** In Chrome DevTools →
   Memory:
   - Snapshot 1: after the app is idle.
   - Snapshot 2: after exercising the suspect flow once.
   - Snapshot 3: after the same flow ~10 more times.
   Compare 2 → 3 ("Objects allocated between snapshot 2 and 3") and look for
   classes whose retained size still grows. Detached DOM nodes, growing
   `Array`/`Map` instances, and retained closures are the usual suspects.

4. **Fix the owner, not the symptom.** A leak is almost always a reference
   that outlives its purpose: a timer, listener, subscription, module-level
   cache, or a `useRef` holding the previous value. Remove the reference.

5. **Add a regression test** (see below) so the leak cannot silently return.

## Writing a memory test

Tests live in `src/test/memory/` and must be named `*.memory.test.ts`
or `*.memory.test.tsx`. They are excluded from the default unit run and only
execute under `pnpm test:memory` (which passes `--expose-gc`).

Two kinds of checks are worth writing:

**Structural (always deterministic, preferred).**

```tsx
it('clears its timer on unmount', () => {
  vi.useFakeTimers();
  const { unmount } = renderHook(() => useMyHook());
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
  vi.useRealTimers();
});
```

Also assert bounded collections (arrays/maps) and that listeners were removed
(`vi.spyOn(window, 'addEventListener'/'removeEventListener')`).

**Heap growth (use sparingly).** Use the helpers in
`src/test/memory/memory-test-utils.ts`:

```tsx
const result = measureHeapGrowth(() => {
  const { unmount } = render(<MyComponent />);
  unmount();
});
expect(result.growthBytes).toBeLessThan(budgetBytes);
```

These only assert when `global.gc` is available (it is under
`pnpm test:memory`) — otherwise they warn and skip, so they never fail purely
because the harness could not get a clean reading.

### Baselines

Budgets and browser baselines live in `src/test/memory/baseline.json`.
- `unit.*` drives the heap-growth test budgets.
- `browser.scenarios` is written by `pnpm memory:baseline` from a profiling
  run and read by `pnpm memory:check`.
- `browser.thresholds` are the hard ceilings applied even with no baseline.

Update the baseline only from a clean run on the `main` branch (or a commit
you trust), and mention it in the PR.

## Browser profiler details

`scripts/memory-profile.mjs` launches Chromium with
`--js-flags=--expose-gc`, navigates each route a few times, forces GC, and
records `performance.memory.usedJSHeapSize`. It writes
`benchmark-results/memory-profile.json` (git-ignored; uploaded by CI).

```bash
# against a specific deployment
MEMORY_PROFILE_URL=https://staging.dorisio.dev \
MEMORY_PROFILE_ROUTES=/,/creators,/settings \
  pnpm memory:profile
```

Caveats:
- `performance.memory` is Chromium-only. The script records `null` elsewhere.
- Sample with a forced GC (the script does) or the numbers are dominated by
  the normal saw-tooth allocation pattern.
- Treat a single run as a signal; compare trends across runs.

## CI

The `memory` job runs `pnpm test:memory` on every push/PR to `main`/`develop`
and uploads `benchmark-results/`. The suite exits non-zero when a structural
check fails or heap growth exceeds the baseline budget. The browser profiler
is not run in CI (it needs a deployed server); use it locally or against a
preview URL when investigating.

## Interpreting results

- **Negative growth** is normal — GC freed more than the flow allocated.
- **Positive slope that plateaus** is often caching (query cache, image
  cache), not a leak. Keep an eye on `gcTime` in `src/lib/query-client.ts`.
- **Monotonic growth with no plateau** across repeated identical actions is
  the signature of a leak. Bisect by commenting out the suspected
  subscription/timer and re-measuring.
