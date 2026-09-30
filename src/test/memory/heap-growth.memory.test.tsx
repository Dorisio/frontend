import { describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';
import { createRoot } from 'react-dom/client';
import { NotificationProvider } from '@/components/notification-provider';
import { useAppStore } from '@/stores/app-store';
import { measureHeapGrowth, describeHeapGrowth, type HeapGrowthResult } from './memory-test-utils';
import baseline from './baseline.json';

/**
 * End-to-end leak check: mount/unmount a component that schedules a timer on
 * every render, thousands of times, and measure retained heap after forced GC.
 *
 * Deliberately uses a single reused `createRoot` container rather than
 * `@testing-library/react`'s `render()`: RTL allocates and retains a fresh
 * container per call, which shows up as ~75KB/cycle of harness overhead and
 * would swamp the signal. With one container, a leak in app code (a timer or
 * closure that outlives unmount) is the only thing that grows the heap.
 *
 * Budgets live in ./baseline.json. The assertion is skipped when the harness
 * could not force a GC (run via `pnpm test:memory`, which passes --expose-gc).
 */
describe('mount/unmount heap growth', () => {
  it('retains a bounded amount of heap across repeated mounts', () => {
    useAppStore.setState({
      notifications: [{ id: 'n1', type: 'info', message: 'hello', duration: 5000 }],
    });

    const container = document.createElement('div');
    document.body.appendChild(container);

    let result: HeapGrowthResult;
    try {
      result = measureHeapGrowth(
        () => {
          const root = createRoot(container);
          act(() => {
            root.render(<NotificationProvider />);
          });
          act(() => {
            root.unmount();
          });
        },
        {
          warmupCycles: baseline.unit.warmupCycles,
          measureCycles: baseline.unit.measureCycles,
        }
      );
    } finally {
      container.remove();
      useAppStore.setState({ notifications: [] });
    }

    if (!result.gcAvailable) {
      console.warn(
        '[memory] global.gc is unavailable; skipping heap-growth assertion. ' +
          'Run with `pnpm test:memory`.'
      );
      return;
    }

    expect(result.growthBytes, describeHeapGrowth(result)).toBeLessThan(
      baseline.unit.maxRetainedGrowthBytes
    );
    expect(result.growthRatio, describeHeapGrowth(result)).toBeLessThan(
      baseline.unit.maxGrowthRatio
    );
  });
});
