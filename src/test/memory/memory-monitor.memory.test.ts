import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MemoryMonitor,
  detectMemoryLeakTrend,
  getMemorySnapshot,
  DEFAULT_LEAK_SLOPE_BYTES_PER_SAMPLE,
  MIN_LEAK_GROWTH_BYTES,
  type MemorySnapshot,
} from '@/lib/memory-monitor';

function snap(usedBytes: number, timestamp = 0): MemorySnapshot {
  return {
    timestamp,
    usedBytes,
    totalBytes: null,
    limitBytes: null,
    rssBytes: null,
    source: 'node',
  };
}

describe('getMemorySnapshot', () => {
  it('returns a heap reading in a Node test process', () => {
    const snapshot = getMemorySnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot?.source).toBe('node');
    expect(snapshot?.usedBytes).toBeGreaterThan(0);
  });
});

describe('detectMemoryLeakTrend', () => {
  it('does not flag a flat series', () => {
    const samples = Array.from({ length: 20 }, () => snap(50 * 1024 * 1024));
    const trend = detectMemoryLeakTrend(samples);
    expect(trend.leakSuspected).toBe(false);
    expect(Math.abs(trend.slopeBytesPerSample)).toBeLessThan(1);
  });

  it('flags sustained growth above the slope and growth budgets', () => {
    const step = DEFAULT_LEAK_SLOPE_BYTES_PER_SAMPLE * 2;
    const samples = Array.from({ length: 12 }, (_, i) => snap(10 * 1024 * 1024 + i * step));
    const trend = detectMemoryLeakTrend(samples);
    expect(trend.leakSuspected).toBe(true);
    expect(trend.growthBytes).toBeGreaterThanOrEqual(MIN_LEAK_GROWTH_BYTES);
    expect(trend.reason).toContain('Heap grows');
  });

  it('ignores growth below the minimum sample count', () => {
    const step = DEFAULT_LEAK_SLOPE_BYTES_PER_SAMPLE * 4;
    const samples = Array.from({ length: 3 }, (_, i) => snap(10 * 1024 * 1024 + i * step));
    expect(detectMemoryLeakTrend(samples).leakSuspected).toBe(false);
  });

  it('ignores a series that grows steeply but not enough in absolute terms', () => {
    // 6 samples rising 500KB each = 2.5MB total, slope above the per-sample
    // budget but below MIN_LEAK_GROWTH_BYTES once the per-sample minimum is
    // raised out of the way.
    const samples = Array.from({ length: 6 }, (_, i) => snap(1_000 + i * 500 * 1024));
    const trend = detectMemoryLeakTrend(samples, { minGrowthBytes: 10 * 1024 * 1024 });
    expect(trend.leakSuspected).toBe(false);
  });

  it('handles an empty series without throwing', () => {
    const trend = detectMemoryLeakTrend([]);
    expect(trend.sampleCount).toBe(0);
    expect(trend.leakSuspected).toBe(false);
  });
});

describe('MemoryMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('captures immediately on start and then on each interval', () => {
    let value = 0;
    const monitor = new MemoryMonitor({
      intervalMs: 1000,
      sample: () => snap((value += 1024)),
    });

    monitor.start();
    expect(monitor.getSamples()).toHaveLength(1);

    vi.advanceTimersByTime(3000);
    expect(monitor.getSamples()).toHaveLength(4);
    expect(monitor.latest?.usedBytes).toBe(4 * 1024);

    monitor.stop();
    vi.advanceTimersByTime(5000);
    expect(monitor.getSamples()).toHaveLength(4);
    expect(monitor.isRunning).toBe(false);
  });

  it('bounds buffered samples with a ring buffer', () => {
    let value = 0;
    const monitor = new MemoryMonitor({
      intervalMs: 1000,
      maxSamples: 3,
      sample: () => snap((value += 1)),
    });

    for (let i = 0; i < 6; i++) monitor.capture();

    expect(monitor.getSamples()).toHaveLength(3);
    expect(monitor.latest?.usedBytes).toBe(6);
    // Oldest samples were dropped, newest retained.
    expect(monitor.getSamples()[0].usedBytes).toBe(4);
  });

  it('invokes onLeak when the trend crosses the threshold', () => {
    const onLeak = vi.fn();
    const step = DEFAULT_LEAK_SLOPE_BYTES_PER_SAMPLE * 2;
    let value = 5 * 1024 * 1024;
    const monitor = new MemoryMonitor({
      leakSlopeBytesPerSample: DEFAULT_LEAK_SLOPE_BYTES_PER_SAMPLE,
      onLeak,
      sample: () => snap((value += step)),
    });

    for (let i = 0; i < 8; i++) monitor.capture();

    expect(onLeak).toHaveBeenCalled();
    expect(monitor.analyse().leakSuspected).toBe(true);
  });

  it('is not running before start and can be reset', () => {
    const monitor = new MemoryMonitor({ sample: () => snap(1) });
    expect(monitor.isRunning).toBe(false);
    expect(monitor.latest).toBeNull();

    monitor.capture();
    expect(monitor.getSamples()).toHaveLength(1);
    monitor.reset();
    expect(monitor.getSamples()).toHaveLength(0);
  });
});
