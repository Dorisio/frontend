/**
 * Provider verification for the Dorisio API against consumer contracts.
 *
 * Runs every interaction defined in the consumer Pact files against the
* real provider and publishes the results to the Pact Broker.
 */

import { Verifier } from '@pact/core';

const config = require('../pact.config');

const options = {
  provider: config.provider.name,
  providerBaseUrl: config.provider.baseUrl,
  pactDirs: [config.provider.pactDir],
  pactBrokerUrl: config.broker.baseUrl,
  pactBrokerToken: config.broker.token,
  consumerVersionSelectors: [
    {
      tag: process.env.PACT_CONSUMER_TAG ?? 'main',
      latest: true,
    },
  ],
  providerVersion: config.broker.providerVersion,
  publishVerificationResults: config.broker.publishVerificationResults,
  timeout: config.provider.verifierTimeout,
  verbose: true,
} as const;

async function main(t: string): Promise<void> {
  const verifier = new Verifier(options);

  // Authenticate all verification requests with a valid token.
  verifier.addRequestFilter((req): any => {
    req.headers = {
      ...req.headers,
      Authorization: `Bearer ${process.env.PACT_PROVIDER_TOKEN ?? 'test-token'}`,
    };
    return req;
  });

  // Provide provider state for each interaction.
  verifier.stateHandler('events exist for the creator', async () => {
    await seedCreatorEvents('creator-123');
  });
  verifier.stateHandler('metrics exist for the creator', async () => {
    await seedCreatorMetrics('creator-123');
  });
  verifier.stateHandler('the creator does not exist', async () => {
    await removeCreator('creator-123');
  });

  try {
    const output = await verifier.verify();
    t(output);
  } finally {
    await verifier.finalize();
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
