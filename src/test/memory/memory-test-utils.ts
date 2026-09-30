/**
 * Shared helpers for the memory test suite.
 *
 * The suite is intentionally split into two kinds of checks:
 *  1. Deterministic structural checks (are timers/listeners/collections
 *     bounded?) that always run, using fake timers where useful.
 *  2. Heap-growth checks that force GC and compare `process.memoryUsage()`.
 *     These only assert when `global.gc` is available (the suite runs with
 *     `--expose-gc`; see vitest.memory.config.ts) so they never fail purely
 *     because the harness could not get a stable reading.
 */

type GcHost = { gc?: () => void };

/** True when the process was started with `--expose-gc`. */
export function isGcAvailable(): boolean {
  return typeof (globalThis as GcHost).gc === 'function';
}

/** Force a GC if available. Returns whether a GC actually ran. */
export function forceGc(): boolean {
  const gc = (globalThis as GcHost).gc;
  if (typeof gc !== 'function') return false;
  gc();
  return true;
}

/** Current V8 heap usage in bytes. */
export function measureHeapUsed(): number {
  return process.memoryUsage().heapUsed;
}

export interface HeapGrowthResult {
  warmupCycles: number;
  measureCycles: number;
  beforeBytes: number;
  afterBytes: number;
  growthBytes: number;
  growthRatio: number;
  gcAvailable: boolean;
}

export interface HeapGrowthOptions {
  /** Iterations run before the baseline reading, to warm JIT/caches. */
  warmupCycles?: number;
  /** Measured iterations. */
  measureCycles?: number;
}

/**
 * Run `run()` repeatedly and report the retained heap growth across the
 * measured window. GC is forced before each reading; without `global.gc` the
 * reading is still produced but callers should not assert on it.
 */
export function measureHeapGrowth(
  run: () => void,
  options: HeapGrowthOptions = {}
): HeapGrowthResult {
  const { warmupCycles = 200, measureCycles = 1000 } = options;
  const gcAvailable = forceGc();

  for (let i = 0; i < warmupCycles; i++) run();
  forceGc();
  const beforeBytes = measureHeapUsed();

  for (let i = 0; i < measureCycles; i++) run();
  forceGc();
  const afterBytes = measureHeapUsed();

  const growthBytes = afterBytes - beforeBytes;
  const growthRatio = beforeBytes > 0 ? afterBytes / beforeBytes : 1;

  return {
    warmupCycles,
    measureCycles,
    beforeBytes,
    afterBytes,
    growthBytes,
    growthRatio,
    gcAvailable,
  };
}

export function formatBytes(bytes: number): string {
  const sign = bytes < 0 ? '-' : '';
  const abs = Math.abs(bytes);
  if (abs < 1024) return `${sign}${abs}B`;
  if (abs < 1024 * 1024) return `${sign}${(abs / 1024).toFixed(1)}KB`;
  return `${sign}${(abs / (1024 * 1024)).toFixed(2)}MB`;
}

/** Format a heap-growth result for failure messages. */
export function describeHeapGrowth(result: HeapGrowthResult): string {
  return (
    `heap ${formatBytes(result.beforeBytes)} -> ${formatBytes(result.afterBytes)} ` +
    `(+${formatBytes(result.growthBytes)}, ${result.growthRatio.toFixed(2)}x) over ` +
    `${result.measureCycles} cycles`
  );
}
