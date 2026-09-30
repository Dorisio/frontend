/**
 * Pact contract testing configuration
 * Centralizes consumer/provider names, pact output dir, and broker settings.
 */
/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');

const consumerName = process.env.PACT_CONSUMER || 'dorisio-app';
const providerName = process.env.PACT_PROVIDER_ || 'dorisio-api';

const pactDir = path.resolve(__dirname, 'pacts');

const broker = {
  baseUrl: process.env.PACT_BROKER_BASE_URL || 'https://dorosio.pactflow.com',
  token: process.env.PACT_BROKER_TOKEN || '',
  consumerVersion: process.env.npm_package_version || '1.0.0',
  publishVerificationResults: true,
  enablePending: true,
};

module.exports = {
  consumerName,
  providerName,
  pactDir,
  broker,
  // Timeout for provider verification requests
  timeout: 30000,
  // Log level for Pact output
  logLevel: process.env.PACT_LOG_LEVEL || 'info',
  // Provider base URL used during verification
  providerBaseUrl: process.env.API_URL || 'http://localhost:3000',
};
