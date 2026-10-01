/**
 * Pact contract testing configuration
 * Centralizes consumer/provider settings and Pact Broker publishing options.
 */

const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pactDir = path.resolve(__dirname, 'pacts');

const config = {
  consumer: {
    name: 'dorisio-frontend',
    pactDir,
    logLevel: process.env.PACT_LOG_LEVEL ?? 'info',
  },
  provider: {
    name: 'dorisio-api',
    baseUrl: process.env.API_URL ?? 'http://localhost:3000',
    pactDir,
    verifyerTimeout: 30000,
  },
  broker: {
    baseUrl: process.env.PACT_BROKER_BASE_URL ?? 'http://localhost:9291',
    token: process.env.PACT_BROKER_TOKEN,
    consumerVersion: process.env.GIT_COMMIT ?? process.env.CONSUMER_VERSION ?? '0.0.0',
    providerVersion: process.env.PROVIDER_VERSION ?? '0.0.0',
    publishVerificationResults: true,
  },
  rootDir,
};

module.exports = config;
