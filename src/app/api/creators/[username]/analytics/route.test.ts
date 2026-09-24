import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

function makeRequest(username: string, range?: string): NextRequest {
  const url = new URL(`http://localhost/api/creators/${username}/analytics`);
  if (range) url.searchParams.set('range', range);
  return new NextRequest(url);
}

describe('GET /api/creators/[username]/analytics', () => {
  it('returns analytics matching the CreatorAnalytics shape', async () => {
    const response = await GET(makeRequest('alice', '30d'), { params: { username: 'alice' } });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.range).toBe('30d');
    expect(body.summary).toEqual(
      expect.objectContaining({
        totalEarnings: expect.any(Number),
        earningsThisMonth: expect.any(Number),
        earningsThisWeek: expect.any(Number),
        totalTips: expect.any(Number),
      })
    );
    expect(Array.isArray(body.earningsTrend)).toBe(true);
    expect(Array.isArray(body.sourceBreakdown)).toBe(true);
    expect(Array.isArray(body.topTippers)).toBe(true);
  });

  it('returns 30 days of earnings trend data for the 30d range', async () => {
    const response = await GET(makeRequest('alice', '30d'), { params: { username: 'alice' } });
    const body = await response.json();

    expect(body.earningsTrend).toHaveLength(30);
  });

  it('returns 90 days of earnings trend data for the 90d range', async () => {
    const response = await GET(makeRequest('alice', '90d'), { params: { username: 'alice' } });
    const body = await response.json();

    expect(body.earningsTrend).toHaveLength(90);
  });

  it('defaults to the 30d range when no range is given', async () => {
    const response = await GET(makeRequest('alice'), { params: { username: 'alice' } });
    const body = await response.json();

    expect(body.range).toBe('30d');
  });

  it('falls back to the 30d range for an invalid range value', async () => {
    const response = await GET(makeRequest('alice', 'invalid'), {
      params: { username: 'alice' },
    });
    const body = await response.json();

    expect(body.range).toBe('30d');
  });

  it('returns deterministic data for the same username and range', async () => {
    const response1 = await GET(makeRequest('alice', '30d'), { params: { username: 'alice' } });
    const response2 = await GET(makeRequest('alice', '30d'), { params: { username: 'alice' } });

    const body1 = await response1.json();
    const body2 = await response2.json();

    expect(body1.earningsTrend).toEqual(body2.earningsTrend);
    expect(body1.topTippers).toEqual(body2.topTippers);
  });

  it('returns different data for different usernames', async () => {
    const response1 = await GET(makeRequest('alice', '30d'), { params: { username: 'alice' } });
    const response2 = await GET(makeRequest('bob', '30d'), { params: { username: 'bob' } });

    const body1 = await response1.json();
    const body2 = await response2.json();

    expect(body1.earningsTrend).not.toEqual(body2.earningsTrend);
  });

  it('returns 400 when username is empty', async () => {
    const response = await GET(makeRequest(''), { params: { username: '' } });
    expect(response.status).toBe(400);
  });
});
