import { describe, expect, it } from 'vitest';
import { createQueryClient } from './query-client';

describe('query client cache policy', () => {
  it('uses longer cache windows for analytics and creator data', () => {
    const client = createQueryClient();
    expect(client.getQueryDefaults(['creatorAnalytics'])?.staleTime).toBe(5 * 60 * 1000);
    expect(client.getQueryDefaults(['transactionHistory'])?.staleTime).toBe(2 * 60 * 1000);
    expect(client.getQueryDefaults(['creators'])?.staleTime).toBe(10 * 60 * 1000);
  });
});
