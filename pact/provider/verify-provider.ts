/**
 * Provider verification for the Dorisio API against consumer contracts.
 *
 * Runs every interaction defined in the consumer Pact files against the
 * real provider and publishes the results to the Pact Broker.
 *
 * The real `@pact-foundation/pact` v3 Verifier has no JS-level request
 * filter or state-handler hooks (those were removed from the library's
 * public API) - it drives everything through `VerifierOptions`. Provider
 * state setup is done by having the verifier POST `{ state, params }` to
 * `providerStatesSetupUrl`, so this file stands up a tiny local HTTP
 * server for that during the run and points the verifier at it. Static
 * auth headers for every verification request go through
 * `customProviderHeaders`, since there's no dynamic per-request filter.
 */

import http from 'http';
import type { AddressInfo } from 'net';
import { Verifier } from '@pact-foundation/pact';

const config = require('../pact.config');

type StateHandler = () => Promise<void>;

const stateHandlers: Record<string, StateHandler> = {
  'events exist for the creator': () => seedCreatorEvents('creator-123'),
  'metrics exist for the creator': () => seedCreatorMetrics('creator-123'),
  'the creator does not exist': () => removeCreator('creator-123'),
};

/**
 * Starts a local HTTP server implementing Pact's provider-states-setup
 * contract: POST / with `{ "state": "..." }`, run the matching handler,
 * respond 200 on success. Returns the server and its base URL; caller is
 * responsible for closing it.
 */
function startStateSetupServer(): Promise<{ server: http.Server; url: string }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.method !== 'POST') {
        res.writeHead(405).end();
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        void (async () => {
          try {
            const { state } = JSON.parse(body || '{}') as { state?: string };
            const handler = state ? stateHandlers[state] : undefined;

            if (!handler) {
              res.writeHead(400, { 'Content-Type': 'application/json' }).end(
                JSON.stringify({ error: `No state handler registered for "${state}"` })
              );
              return;
            }

            await handler();
            res.writeHead(200, { 'Content-Type': 'application/json' }).end('{}');
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' }).end(
              JSON.stringify({ error: error instanceof Error ? error.message : String(error) })
            );
          }
        })();
      });
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

async function main(): Promise<void> {
  const { server, url: providerStatesSetupUrl } = await startStateSetupServer();

  const verifier = new Verifier({
    provider: config.provider.name,
    providerBaseUrl: config.provider.baseUrl,
    pactUrls: [config.provider.pactDir],
    pactBrokerUrl: config.broker.baseUrl,
    pactBrokerToken: config.broker.token,
    consumerVersionSelectors: [
      {
        tag: process.env.PACT_CONSUMER_TAG ?? 'main',
        latest: true,
      },
    ],
    providerVersion: config.broker.providerVersion,
    publishVerificationResult: config.broker.publishVerificationResults,
    timeout: config.provider.verifierTimeout,
    providerStatesSetupUrl,
    customProviderHeaders: [
      `Authorization: Bearer ${process.env.PACT_PROVIDER_TOKEN ?? 'test-token'}`,
    ],
  });

  try {
    const output = await verifier.verifyProvider();
    console.log(output);
  } finally {
    server.close();
  }
}

async function seedCreatorEvents(creatorId: string): Promise<void> {
  const res = await fetch(`${config.provider.baseUrl}/test/seed/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creatorId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to seed events for ${creatorId}: ${res.status}`);
  }
}

async function seedCreatorMetrics(creatorId: string): Promise<void> {
  const res = await fetch(`${config.provider.baseUrl}/test/seed/metrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creatorId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to seed metrics for ${creatorId}: ${res.status}`);
  }
}

async function removeCreator(creatorId: string): Promise<void> {
  const res = await fetch(`${config.provider.baseUrl}/test/seed/creators/${creatorId}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to remove creator ${creatorId}: ${res.status}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
