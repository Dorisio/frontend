# Common memory leak causes

A frontend leak is a reference that outlives its purpose. This page lists the
patterns we have actually hit in this codebase, how each one looks, and the
fix. When reviewing a PR, scan for these.

## 1. Untracked timers

A bare `setTimeout` keeps its callback (and everything the closure references —
state values, arrays, DOM nodes) alive until it fires, and calls `setState`
after unmount. Components that show a transient banner do this on every action.

```tsx
// ❌ leaks: timer survives unmount, closure retains component state
setSuccessMessage('Saved!');
setTimeout(() => setSuccessMessage(null), 4000);
```

Use `useSafeTimeout` (`src/hooks/use-timeout.ts`), which tracks every handle
and clears them on unmount:

```tsx
// ✅ tracked and cleared on unmount
const { schedule } = useSafeTimeout();
setSuccessMessage('Saved!');
schedule(() => setSuccessMessage(null), 4000);
```

The API is also useful for imperative code paths where an effect cleanup is
awkward. If a timer is scheduled inside an effect, a plain `setTimeout` with a
matching `clearTimeout` in the cleanup is equally correct — but it must be
cleared on **every** path, including dependency changes.

## 2. Event listeners and subscriptions never removed

Every `addEventListener` needs a `removeEventListener` in the effect cleanup.
Same for `IntersectionObserver`, `ResizeObserver`, `PerformanceObserver`, and
`BroadcastChannel.onmessage`.

```tsx
useEffect(() => {
  const handle = () => refresh();
  window.addEventListener('storage', handle);
  return () => window.removeEventListener('storage', handle); // don't forget
}, [refresh]);
```

`initSessionSync` (`src/lib/session-sync.ts`) and
`initPerformanceMonitoring` (`src/lib/performance.ts`) both return a cleanup
function — always wire it into the effect.

## 3. WebSocket handlers on reconnect

Realtime hooks reconnect with backoff. Each attempt creates a new socket and
attaches `open`/`message`/`error`/`close` handlers. If a reconnect timer is not
cleared on unmount, or a handler updates state after teardown, the old socket
graph stays reachable.

```tsx
// ✅ from src/hooks/use-realtime-notifications.ts
return () => {
  closedByClientRef.current = true;
  if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
  socketRef.current?.close();
  socketRef.current = null;
};
```

Guidelines:
- Store the socket and the reconnect timeout in refs and clear both in the
  cleanup.
- Guard against scheduling a reconnect after the client closed the connection
  (`closedByClientRef` above).
- Prefer one connection per hook instance; don't leave a previous socket open
  when `creatorId`/`userId` changes.

## 4. Unbounded arrays and maps

State and module-level collections that only ever grow are permanent leaks for
the lifetime of the tab (or the module). Real examples and their caps:

- Realtime tip notifications — `MAX_RETAINED_NOTIFICATIONS` (100)
  in `src/hooks/use-realtime-notifications.ts`.
- Realtime activity items — `MAX_RETAINED_ACTIVITY_ITEMS` (100)
  in `src/hooks/use-activity-feed-realtime.ts`.
- Polled tips — `MAX_TIPS` (200) in `src/hooks/use-realtime-tips.ts`.
- Toasts — `MAX_NOTIFICATIONS` (50) in `src/stores/app-store.ts`.
- Request dedup map — `MAX_PENDING_ENTRIES` (200) in
  `src/lib/request-deduplicator.ts`.

```ts
// ✅ newest-first, bounded
setNotifications((prev) => [tip, ...prev].slice(0, MAX_RETAINED_NOTIFICATIONS));
```

Rule of thumb: any `useState<T[]>` fed by a stream/realtime source, and any
module-level `Map`/`Set`/cache, needs an explicit cap or eviction policy.

## 5. Module-level caches

A module-level `Map` lives as long as the page. If keys are unbounded (user
ids, request fingerprints, session ids) it is an unbounded cache. Either bound
it (see the deduplicator) or scope it to a hook/store so it is torn down with
the consumer. `src/lib/request-deduplicator.ts` also tracks its cleanup timers
so `clearDedupedRequests()` leaves nothing behind.

## 6. Closures that retain large objects

A callback that closes over a large object keeps it alive even if the callback
is the only reference. Common in timers/listeners registered once with a stale
value.

```ts
// ❌ retains the whole `transactions` array for 4s per call
setTimeout(() => setCount(transactions.length), 4000);
```

Extract only what the callback needs (`const count = transactions.length`)
before registering it. This is especially relevant for the realtime hooks,
which prepend to arrays on every message.

## 7. Stale `useRef` values

Refs holding the *previous* value (e.g. `prevItemsRef.current = items`) keep
that value alive across renders. If it is a large list, that is a second full
copy in memory. Only keep a previous value if a feature genuinely needs to
diff against it, and clear it when idle.

## 8. React Query cache growth

`QueryClient` caches every query key it has ever seen until `gcTime` elapses
(defaults in `src/lib/query-client.ts`: 10 min globally, up to 30 min for
analytics). Infinite-scroll feeds with per-page keys can hold many pages. If a
route's heap plateaus only after minutes, this is a candidate — check the
`gcTime` overrides and whether keys are being created per-request instead of
per-entity.

## 9. Detached DOM nodes

Holding a DOM node in a ref/closure after its element is removed keeps the
whole subtree in memory. React normally handles this, but manual
`document.createElement`/`container.appendChild` (modals, tooltips, chart
libs like recharts) can leave detached subtrees referenced. Verify with the
DevTools snapshot filter "Detached".

## 10. Third-party subscriptions

Charting and animation libraries keep internal observers. `recharts`
`ResponsiveContainer` and `framer-motion` should be mounted/unmounted through
React so their cleanup runs — do not render them imperatively. The
`memory` CI job's heap-growth test mounts/unmounts components exactly to catch
regressions here.

## Reviewer checklist

- [ ] Every `setTimeout`/`setInterval` is cleared (prefer `useSafeTimeout`).
- [ ] Every `addEventListener`/`observe`/`subscribe` is paired with its removal
      in the effect cleanup.
- [ ] Streamed/realtime state has an explicit cap.
- [ ] Module-level collections have an eviction policy or a dedicated test.
- [ ] Refs do not hold previous copies of large arrays/objects without reason.
- [ ] A regression test exists for any leak fix (see
      [MEMORY_PROFILING.md](./MEMORY_PROFILING.md#writing-a-memory-test)).
