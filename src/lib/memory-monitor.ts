/**
 * Runtime memory monitor
 *
 * Samples the JavaScript heap periodically and flags sustained growth that is
 * consistent with a leak. This is intentionally dependency-free (no new
 * packages) and safe on the server: `getMemorySnapshot()` returns `null`
 * wherever a heap API is unavailable, and the monitor simply no-ops.
 *
 * Two consumer paths:
 *  - `startMemoryMonitor()` is called once at app boot (see
 *    `src/app/providers.tsx`) and reports suspicious trends to Sentry and,
 *    in development, the console.
 *  - `window.__dorisioMemory` (installed by the monitor) exposes a tiny
 *    devtools/debug surface for manual checks.
 *
 * The pure helpers (`getMemorySnapshot`, `detectMemoryLeakTrend`) are exported
 * separately so tests can exercise the leak heuristic without timers.
 *
 * Docs: docs/MEMORY_PROFILING.md, docs/MEMORY_LEAK_PITFALLS.md.
 */

import { recordMemoryMetric } from './monitoring';

export interface MemorySnapshot {
  /** Epoch milliseconds when the sample was taken. */
  timestamp: number;
  /** Heap currently in use, in bytes. */
  usedBytes: number;
  /** Committed heap, in bytes (null when unavailable). */
  totalBytes: number | null;
  /** Heap size limit, in bytes (browser only). */
  limitBytes: number | null;
  /** Resident set size, in bytes (Node only). */
  rssBytes: number | null;
  source: 'browser' | 'node';
}

export interface MemoryTrend {
  sampleCount: number;
  /** Difference between the last and first sample, in bytes. */
  growthBytes: number;
  /** Linear-regression slope, in bytes per sample. */
  slopeBytesPerSample: number;
  /** True when growth looks sustained rather than noise. */
  leakSuspected: boolean;
  /** Human-readable explanation, useful in logs and dashboards. */
  reason: string;
}

export interface MemoryMonitorOptions {
  /** Sampling interval. Defaults to 15s. */
  intervalMs?: number;
  /** Ring-buffer size. Defaults to 120 samples (~30 min at 15s). */
  maxSamples?: number;
  /** Slope above which growth is considered a leak, in bytes/sample. */
  leakSlopeBytesPerSample?: number;
  /** Called once per sample (after it is buffered). */
  onSample?: (snapshot: MemorySnapshot, monitor: MemoryMonitor) => void;
  /** Called when the trend crosses the leak threshold. */
  onLeak?: (trend: MemoryTrend, monitor: MemoryMonitor) => void;
  /** Injectable sampler/clock for tests. */
  sample?: () => MemorySnapshot | null;
  now?: () => number;
}

export const DEFAULT_MEMORY_SAMPLE_INTERVAL_MS = 15_000;
export const DEFAULT_MEMORY_MAX_SAMPLES = 120;
/** ~256 KB of growth per sample is treated as a leak when sustained. */
export const DEFAULT_LEAK_SLOPE_BYTES_PER_SAMPLE = 256 * 1024;
/** Minimum number of samples before a leak is declared. */
export const MIN_LEAK_SAMPLES = 5;
/** Minimum absolute growth before a leak is declared. */
export const MIN_LEAK_GROWTH_BYTES = 1024 * 1024;

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Capture a heap snapshot from whichever runtime we are in.
 * Returns `null` when no heap API is exposed (SSR, Firefox, Safari, ...).
 */
export function getMemorySnapshot(now: () => number = Date.now): MemorySnapshot | null {
  if (typeof globalThis === 'undefined') return null;

  const performanceMemory = (globalThis as { performance?: { memory?: PerformanceMemory } })
    .performance?.memory;
  if (
    performanceMemory &&
    typeof performanceMemory.usedJSHeapSize === 'number' &&
    Number.isFinite(performanceMemory.usedJSHeapSize)
  ) {
    return {
      timestamp: now(),
      usedBytes: performanceMemory.usedJSHeapSize,
      totalBytes: Number.isFinite(performanceMemory.totalJSHeapSize)
        ? performanceMemory.totalJSHeapSize
        : null,
      limitBytes: Number.isFinite(performanceMemory.jsHeapSizeLimit)
        ? performanceMemory.jsHeapSizeLimit
        : null,
      rssBytes: null,
      source: 'browser',
    };
  }

  const processRef = (globalThis as { process?: { memoryUsage?: () => NodeJS.MemoryUsage } })
    .process;
  if (processRef?.memoryUsage) {
    const usage = processRef.memoryUsage();
    if (Number.isFinite(usage.heapUsed)) {
      return {
        timestamp: now(),
        usedBytes: usage.heapUsed,
        totalBytes: Number.isFinite(usage.heapTotal) ? usage.heapTotal : null,
        limitBytes: null,
        rssBytes: Number.isFinite(usage.rss) ? usage.rss : null,
        source: 'node',
      };
    }
  }

  return null;
}

/**
 * Analyse a series of samples for sustained growth.
 *
 * Uses ordinary least-squares slope rather than a simple first/last delta so a
 * single GC saw-tooth trough at either end does not produce a false positive.
 */
export function detectMemoryLeakTrend(
  samples: MemorySnapshot[],
  options: {
    leakSlopeBytesPerSample?: number;
    minSamples?: number;
    minGrowthBytes?: number;
  } = {}
): MemoryTrend {
  const leakSlope = options.leakSlopeBytesPerSample ?? DEFAULT_LEAK_SLOPE_BYTES_PER_SAMPLE;
  const minSamples = options.minSamples ?? MIN_LEAK_SAMPLES;
  const minGrowth = options.minGrowthBytes ?? MIN_LEAK_GROWTH_BYTES;

  const sampleCount = samples.length;
  if (sampleCount < 2) {
    return {
      sampleCount,
      growthBytes: 0,
      slopeBytesPerSample: 0,
      leakSuspected: false,
      reason: 'Not enough samples to analyse.',
    };
  }

  const n = sampleCount;
  const meanX = (n - 1) / 2;
  const meanY = samples.reduce((sum, s) => sum + s.usedBytes, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - meanX;
    numerator += dx * (samples[i].usedBytes - meanY);
    denominator += dx * dx;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const growthBytes = samples[n - 1].usedBytes - samples[0].usedBytes;
  const leakSuspected = sampleCount >= minSamples && slope >= leakSlope && growthBytes >= minGrowth;

  return {
    sampleCount,
    growthBytes,
    slopeBytesPerSample: slope,
    leakSuspected,
    reason: leakSuspected
      ? `Heap grows ~${formatBytes(slope)}/sample across ${sampleCount} samples ` +
        `(total +${formatBytes(growthBytes)}).`
      : `Heap growth within budget (~${formatBytes(slope)}/sample).`,
  };
}

export class MemoryMonitor {
  private samples: MemorySnapshot[] = [];
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private readonly intervalMs: number;
  private readonly maxSamples: number;
  private readonly leakSlopeBytesPerSample: number;
  private readonly sampleFn: () => MemorySnapshot | null;
  private readonly now: () => number;
  private readonly onSample?: MemoryMonitorOptions['onSample'];
  private readonly onLeak?: MemoryMonitorOptions['onLeak'];

  constructor(options: MemoryMonitorOptions = {}) {
    this.intervalMs = options.intervalMs ?? getConfiguredIntervalMs();
    this.maxSamples = options.maxSamples ?? DEFAULT_MEMORY_MAX_SAMPLES;
    this.leakSlopeBytesPerSample =
      options.leakSlopeBytesPerSample ?? DEFAULT_LEAK_SLOPE_BYTES_PER_SAMPLE;
    this.now = options.now ?? Date.now;
    this.sampleFn = options.sample ?? (() => getMemorySnapshot(this.now));
    this.onSample = options.onSample;
    this.onLeak = options.onLeak;
  }

  get isRunning(): boolean {
    return this.intervalHandle !== null;
  }

  get latest(): MemorySnapshot | null {
    return this.samples.length > 0 ? this.samples[this.samples.length - 1] : null;
  }

  /** Snapshot of the buffered samples (copy, so callers cannot mutate state). */
  getSamples(): MemorySnapshot[] {
    return [...this.samples];
  }

  /** Force a single sample outside the normal interval. */
  capture(): MemorySnapshot | null {
    const snapshot = this.sampleFn();
    if (!snapshot) return null;

    this.samples.push(snapshot);
    if (this.samples.length > this.maxSamples) {
      this.samples.splice(0, this.samples.length - this.maxSamples);
    }

    this.onSample?.(snapshot, this);

    const trend = this.analyse();
    if (trend.leakSuspected) {
      this.onLeak?.(trend, this);
    }
    return snapshot;
  }

  /** Current trend over the buffered samples. */
  analyse(): MemoryTrend {
    return detectMemoryLeakTrend(this.samples, {
      leakSlopeBytesPerSample: this.leakSlopeBytesPerSample,
    });
  }

  start(): this {
    if (this.isRunning) return this;
    // Sample once immediately so short-lived sessions still produce data.
    this.capture();
    this.intervalHandle = setInterval(() => this.capture(), this.intervalMs);
    // Do not hold the Node event loop open for the monitor alone.
    if (typeof this.intervalHandle === 'object' && this.intervalHandle !== null) {
      (this.intervalHandle as { unref?: () => void }).unref?.();
    }
    return this;
  }

  stop(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  reset(): void {
    this.samples = [];
  }
}

function getConfiguredIntervalMs(): number {
  const raw = process.env.NEXT_PUBLIC_MEMORY_SAMPLE_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MEMORY_SAMPLE_INTERVAL_MS;
}

/** The default, app-wide monitor instance. */
let defaultMonitor: MemoryMonitor | null = null;

function defaultOnLeak(trend: MemoryTrend, monitor: MemoryMonitor): void {
  const latest = monitor.latest;
  if (!latest) return;

  recordMemoryMetric('js.heap.used', latest.usedBytes, {
    leakSuspected: true,
    slopeBytesPerSample: Math.round(trend.slopeBytesPerSample),
    growthBytes: Math.round(trend.growthBytes),
    sampleCount: trend.sampleCount,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[memory] Possible leak detected: ${trend.reason}`);
  }
}

/**
 * Start the app-wide monitor. Safe to call multiple times: subsequent calls
 * return the already-running instance. Disabled when
 * `NEXT_PUBLIC_MEMORY_MONITOR=off`.
 */
export function startMemoryMonitor(options: MemoryMonitorOptions = {}): MemoryMonitor {
  if (process.env.NEXT_PUBLIC_MEMORY_MONITOR === 'off') {
    if (!defaultMonitor) defaultMonitor = new MemoryMonitor(options);
    return defaultMonitor;
  }

  if (!defaultMonitor) {
    defaultMonitor = new MemoryMonitor({ onLeak: defaultOnLeak, ...options });
  }
  if (!defaultMonitor.isRunning) {
    defaultMonitor.start();
    installMemoryDevtools(defaultMonitor);
  }
  return defaultMonitor;
}

/** Stop the app-wide monitor and drop buffered samples. */
export function stopMemoryMonitor(): void {
  defaultMonitor?.stop();
  defaultMonitor?.reset();
}

/** Access the app-wide monitor (may be null before `startMemoryMonitor`). */
export function getMemoryMonitor(): MemoryMonitor | null {
  return defaultMonitor;
}

export interface MemoryDevtoolsApi {
  /** Capture and return a fresh snapshot. */
  snapshot: () => MemorySnapshot | null;
  /** All buffered samples. */
  samples: () => MemorySnapshot[];
  /** Current leak trend. */
  trend: () => MemoryTrend;
  /** Start/stop sampling. */
  start: () => void;
  stop: () => void;
}

/** Install `window.__dorisioMemory` for manual inspection from devtools. */
export function installMemoryDevtools(monitor: MemoryMonitor): void {
  if (typeof window === 'undefined') return;
  const api: MemoryDevtoolsApi = {
    snapshot: () => monitor.capture(),
    samples: () => monitor.getSamples(),
    trend: () => monitor.analyse(),
    start: () => monitor.start(),
    stop: () => monitor.stop(),
  };
  (window as unknown as { __dorisioMemory?: MemoryDevtoolsApi }).__dorisioMemory = api;
}

function formatBytes(bytes: number): string {
  const sign = bytes < 0 ? '-' : '';
  const abs = Math.abs(bytes);
  if (abs < 1024) return `${sign}${abs}B`;
  if (abs < 1024 * 1024) return `${sign}${(abs / 1024).toFixed(1)}KB`;
  return `${sign}${(abs / (1024 * 1024)).toFixed(2)}MB`;
}
