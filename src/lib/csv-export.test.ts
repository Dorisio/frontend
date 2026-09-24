import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildAnalyticsCsv, buildAnalyticsCsvBlob, downloadAnalyticsCsv } from './csv-export';
import type { CreatorAnalytics } from '@/types';

const sampleAnalytics: CreatorAnalytics = {
  range: '30d',
  startDate: '2026-01-01',
  endDate: '2026-01-03',
  summary: { totalEarnings: 45, earningsThisMonth: 45, earningsThisWeek: 45, totalTips: 5 },
  earningsTrend: [
    { date: '2026-01-01', amount: 10 },
    { date: '2026-01-02', amount: 20.5 },
    { date: '2026-01-03', amount: 14.5 },
  ],
  sourceBreakdown: [{ source: 'Profile page', amount: 45, count: 5 }],
  topTippers: [],
};

describe('buildAnalyticsCsv', () => {
  it('produces a header row followed by one row per earnings trend point', () => {
    const csv = buildAnalyticsCsv(sampleAnalytics);
    const rows = csv.split('\n');

    expect(rows[0]).toBe('date,earnings');
    expect(rows).toHaveLength(4); // header + 3 data rows
    expect(rows[1]).toBe('2026-01-01,10');
    expect(rows[2]).toBe('2026-01-02,20.5');
    expect(rows[3]).toBe('2026-01-03,14.5');
  });

  it('produces just the header row when there is no earnings data', () => {
    const csv = buildAnalyticsCsv({ ...sampleAnalytics, earningsTrend: [] });

    expect(csv).toBe('date,earnings');
  });

  it('escapes fields containing commas or quotes', () => {
    const csv = buildAnalyticsCsv({
      ...sampleAnalytics,
      earningsTrend: [{ date: 'contains,comma', amount: 1 }],
    });

    expect(csv).toContain('"contains,comma",1');
  });
});

describe('buildAnalyticsCsvBlob', () => {
  it('produces a CSV Blob with the expected content type and parsed content', async () => {
    const blob = buildAnalyticsCsvBlob(sampleAnalytics);

    expect(blob.type).toBe('text/csv;charset=utf-8;');

    const text = await blob.text();
    const rows = text.split('\n');
    expect(rows[0]).toBe('date,earnings');
    expect(rows[1]).toBe('2026-01-01,10');
  });
});

describe('downloadAnalyticsCsv', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('triggers a download with the given filename via a temporary anchor', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadAnalyticsCsv(sampleAnalytics, 'my-analytics.csv');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('sets the anchor download attribute to the given filename', () => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });

    let capturedFilename = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      capturedFilename = this.download;
    });

    downloadAnalyticsCsv(sampleAnalytics, 'dorisio-analytics-alice-30d.csv');

    expect(capturedFilename).toBe('dorisio-analytics-alice-30d.csv');
  });
});
