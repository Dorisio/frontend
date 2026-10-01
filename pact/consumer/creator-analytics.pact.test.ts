/**
 * Consumer contract tests for the creator analytics third-party API integration.
 *
 * These tests define the expectations the Dorisio frontend has of the
 * analytics provider. They generate a Pact contract file that the
 * provider verifies against its actual API.
 */

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import type { V3Interaction, V3Request } from '@pact-foundation/pact/src/v3/types';

const config = require('../pact.config');

const { like, regex, datetime, integer, decimal, boolean, eachLike } = MatchersV3;

const ISO_DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSX";

describe('Creator Analytics API Contract', () => {
  const provider = new PactV3({
    consumer: config.consumer.name,
    provider: config.provider.name,
    dir: config.consumer.pactDir,
    logLevel: config.consumer.logLevel,
  });

  const authToken = 'test-token';

  /** Adds the Authorization/Accept headers every request in this contract sends. */
  function withAuth(request: V3Request): V3Request {
    return {
      ...request,
      headers: {
        ...request.headers,
        Authorization: regex(/^Bearer .+$/, `Bearer ${authToken}`),
        Accept: 'application/json',
      },
    };
  }

  describe('GET events /analytics/creators/:creatorId/events', () => {
    const expectedBody = {
      data: eachLike({
        id: regex(/^evt_[A-Za-z0-9]+$/, 'evt_123'),
        type: regex(/^[a-z_]+$/, 'tip_received'),
        amount: decimal(100.5),
        currency: regex(/^[A-Z]{3}$/, 'USD'),
        creatorId: regex(/^[A-Za-z0-9-]+$/, 'creator-123'),
        timestamp: datetime(ISO_DATETIME_FORMAT, '2024-01-01T00:00:00.000Z'),
      }),
      pagination: {
        cursor: regex(/^[A-Za-z0-9=]+$/, 'eyJ0b2tlbjo1YmFzNjQ='),
        hasMore: boolean(false),
        limit: integer(20),
      },
    };

    const interaction: V3Interaction = {
      states: [{ description: 'events exist for the creator' }],
      uponReceiving: 'a request for a page of creator events',
      withRequest: withAuth({
        method: 'GET',
        path: '/analytics/creators/creator-123/events',
        query: { limit: '20' },
      }),
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: expectedBody,
      },
    };

    const interactionWithParams: V3Interaction = {
      states: [{ description: 'events exist for the creator' }],
      uponReceiving: 'a request for a cursor-paginated page of creator events',
      withRequest: withAuth({
        method: 'GET',
        path: '/analytics/creators/creator-123/events',
        query: { limit: '20', cursor: 'eyJ0b2tlbjo1YmFzdjQ=' },
      }),
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: expectedBody,
      },
    };

    const notFound: V3Interaction = {
      states: [{ description: 'the creator does not exist' }],
      uponReceiving: 'a request for events of a creator that does not exist',
      withRequest: withAuth({
        method: 'GET',
        path: '/analytics/creators/creator-123/events',
        query: { limit: '20' },
      }),
      willRespondWith: {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: regex(/^[A-Z_]+$/, 'NOT_FOUND'),
          message: like('Creator not found'),
        },
      },
    };

    it('returns a page of events for a creator', async () => {
      await provider.addInteraction(interaction).executeTest(async (mockServer) => {
        const response = await fetch(
          `${mockServer.url}/analytics/creators/creator-123/events?limit=20`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept: 'application/json',
            },
          }
        );
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.data).toHaveLength(1);
        expect(body.data[0].amount).toBeGreaterThan(0);
        expect(body.pagination.hasMore).toBe(false);
      });
    });

    it('supports cursor-based pagination', async () => {
      await provider.addInteraction(interactionWithParams).executeTest(async (mockServer) => {
        const response = await fetch(
          `${mockServer.url}/analytics/creators/creator-123/events?limit=20&cursor=eyJ0b2tlbjo1YmFzdjQ=`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept: 'application/json',
            },
          }
        );
        expect(response.status).toBe(200);
      });
    });

    it('returns 404 when the creator does not exist', async () => {
      await provider.addInteraction(notFound).executeTest(async (mockServer) => {
        const response = await fetch(
          `${mockServer.url}/analytics/creators/creator-123/events?limit=20`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept: 'application/json',
            },
          }
        );
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.error).toBe('NOT_FOUND');
      });
    });
  });

  describe('GET metrics /analytics/creators/:creatorId/metrics', () => {
    const expectedBody = {
      creatorId: regex(/^[A-Za-z0-9-]+$/, 'creator-123'),
      totalTips: decimal(1234.56),
      tipCount: integer(42),
      uniqueSupporters: integer(30),
      periodStart: datetime(ISO_DATETIME_FORMAT, '2024-01-01T00:00:00.000Z'),
      periodEnd: datetime(ISO_DATETIME_FORMAT, '2024-01-31T23:59:59.000Z'),
    };

    const interaction: V3Interaction = {
      states: [{ description: 'metrics exist for the creator' }],
      uponReceiving: 'a request for aggregated creator metrics',
      withRequest: withAuth({
        method: 'GET',
        path: '/analytics/creators/creator-123/metrics',
        query: { from: '2024-01-01', to: '2024-01-31' },
      }),
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: expectedBody,
      },
    };

    it('returns aggregated metrics for a creator', async () => {
      await provider.addInteraction(interaction).executeTest(async (mockServer) => {
        const response = await fetch(
          `${mockServer.url}/analytics/creators/creator-123/metrics?from=2024-01-01&to=2024-01-31`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept: 'application/json',
            },
          }
        );
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.tipCount).toBeGreaterThan(0);
        expect(body.totalTips).toBeGreaterThan(0);
      });
    });
  });
});
