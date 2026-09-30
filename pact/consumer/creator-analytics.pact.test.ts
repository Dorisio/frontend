/**
 * Consumer contract tests for the creator analytics third-party API integration.
 *
 * These tests define the expectations the Dorisio frontend has of the
 * analytics provider. They generate a Pact contract file that the
 * provider verifies against its actual API.
 */

import path from 'path';
import { Pact, PactV3, Matchers } from '@pact/core';

const config = require('../pact.config');

const { like, term, integer, decimal, boolean, eachLike } = Matchers;

describe('Creator Analytics API Contract', () => {
  const provider = new Pact<PactV3>({
    consumer: config.consumer.name,
    provider: config.provider.name,
    dir: config.consumer.pactDir,
    logLevel: config.consumer.logLevel,
  });

  const authToken = 'test-token';

  function withAuth(interaction: PactV3.InteractionRequest) {
    return {
      ...interaction,
      headers: {
        ...interaction.headers,
        Authorization: term(`Bearer ${authToken}`, 'Bearer <token>'),
        Accept: 'application/json',
      },
    };
  }

  afterAll(() => provider.finalize());

  describe('GET events /analytics/creators/:creatorId/events', () => {
    const expectedBody = {
      data: eachLike({
        id: term('evt_123', /^evt_[A-Za-z0-9]+$/),
        type: term('tip_received', /^[a-z_]+$/),
        amount: decimal(100.5),
        currency: term('USD', /^[A-Z]{3}$/),
        creatorId: term('creator-123', /^[A-Za-z0-9-]+$/),
        timestamp: term('2024-01-01T00:00:00.000Z', 'iso-datetime'),
      }),
      pagination: {
        cursor: term('eyJ0b2tlbjo1YmFzNjQ=', 'eyJ.*'),
        hasMore: boolean(false),
        limit: integer(20),
      },
    };

    const interaction = withAuth({
      state: 'events exist for the creator',
      upon receiving: {
        method: 'GET',
        path: '/analytics/creators/creator-123/events',
        query: { limit: '20' },
      },
      will respond with: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: expectedBody,
      },
    });

    const interactionWithParams = withAuth({
      state: 'events exist for the creator',
      upon receiving: {
        method: 'GET',
        path: '/analytics/creators/creator-123/events',
        query: { limit: '20', cursor: 'eyJ0b2tlbjo1YmFzdjQ=' },
      },
      will respond with: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: expectedBody,
      },
    });

    const notFound = withAuth({
      state: 'the creator does not exist',
      upon receiving: {
        method: 'GET',
        path: '/analytics/creators/creator-123/events',
        query: { limit: '20' },
      },
      will respond with: {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: term('NOT_FOUND', '^[A-Z_]+$'),
          message: like('Creator not found'),
        },
      },
    });

    it('returns a page of events for a creator', async () => {
      await provider
        .addInteraction(interaction)
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/analytics/creators/creator-123/events?limit=20`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                Accept: 'application/json',
              },
            },
          );
          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body.data).toHaveLength(1);
          expect(body.data[0].amount).toBeGreaterThan(0);
          expect(body.pagination.hasMore).toBe(false);
        });
    });

    it('supports cursor-based pagination', async () => {
      await provider
        .addInteraction(interactionWithParams)
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/analytics/creators/creator-123/events?limit=20&cursor=eyJ0b2tlbjo1YmFzdjQ=",
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                Accept: 'application/json',
              },
            },
          );
          expect(response.status).toBe(200);
        });
    });

    it('returns 404 when the creator does not exist', async () => {
      await provider
        .addInteraction(notFound)
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/analytics/creators/creator-123/events?limit=20`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                Accept: 'application/json',
              },
            },
          );
          expect(response.status).toBe(404);
          const body = await response.json();
          expect(body.error).toBe('NOT_FOUND');
        });
    });
  });

  describe('GET metrics /analytics/creators/:creatorId/metrics', () => {
    const expectedBody = {
      creatorId: term('creator-123', '^[A-Za-z0-9-]+$/),
      totalTips: decimal(1234.56),
      tipCount: integer(42),
      uniqueSupporters: integer(30),
      periodStart: term('2024-01-01T00:00:00.000Z', 'iso-datetime'),
      periodEnd: term('2024-01-31T23:59:59.000Z', 'iso-datetime'),
    };

    const interaction = withAuth({
      state: 'metrics exist for the creator',
      upon receiving: {
        method: 'GET',
        path: '/analytics/creators/creator-123/metrics',
        query: { from: '2024-01-01', to: '2024-01-31' },
      },
      will respond with: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: expectedBody,
      },
    });

    it('returns aggregated metrics for a creator', async () => {
      await provider
        .addInteraction(interaction)
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/analytics/creators/creator-123/metrics?from=2024-01-01&to=2024-01-31`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                Accept: 'application/json',
              },
            },
          );
          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body.tipCount).toBeGreaterThan(0);
          expect(body.totalTips).toBeGreaterThan(0);
        });
    });
  });
});
