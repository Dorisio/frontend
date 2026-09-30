# Contract Testing

This project uses [Pact](https://docs.pact.io/)+for+consumer-driven+contract+testing+of+third-party+API+integrations.+Contracts+catch+breaking+changes+in+the+Dorisio+API+before+they+reach+production.

## Why contract testing

- Faster than full E-2E and more reliable than mock-only tests.
- Validates the expectations the frontend has of the API.
- Catches breaking changes early in CI.
- Publishes contract changes to the Pact Broker for auditing.

## Directory layout

```
pact/
├── pact.config.js
                # Shared consumer/provider/broker config

├── consumer/
                # Consumer contract tests (generate Pact files)
│   └── creator-analytics.pact.test.ts

└── provider/
                # Provider verification against the real API
    └── verify-provider.ts
```

## Running contract tests

Consumer tests generate the Pact contract files. They do not require a running backend:

```bash
npm run test:contract:consumer
```

Provider verification replays the contracts against a running API:

```bash
API_URL=http://localhost:3000 npm run test:contract:provider
```

Publish contracts to the Pact Broker:

```bash
export PACT_BROKER_BASE_URL="https://your-broker.example"
export PACT_BROKER_TOKEN="<your-token>"
export GIT_COMMIT="$(git rev-parse HEAD)"
npm run test:contract:publish
```

## CI integration

The contract workflow runs on every pull request and on main:

1. **Consumer tests** generate Pact files and fail the build on contract changes.
2. **Publish** the new contract to the broker with the commit SHA as the version.
3. **Provider verification** replays the contracts against the API and publishes results.
4. **Can-deploy** checks the broker for successful verification before releasing.

## Adding a new contract

1. Create a consumer test in `pact/consumer/` using the `Pact` class.
2. Define interactions with `upon receiving` and `will respond with`.
3. Run `npm run test:contract:consumer` to generate the Pact file.
4. Add a `stateHandler` in `pact/provider/verify-provider.ts` for any new provider state.
5. Run `npm run test:contract:provider` against the API.

## Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `API_URL` | Base URL of the provider API | `http://localhost:3000` |
| `PACT_BROKER_BASE_URL` | Pact Broker base URL | `http://localhost:9291` |
| `PACT_BROKER_TOKEN` | Pact Broker API token | (none) |
| `PACT_PROVIDER_TOKEN` | Bearer token used during verification | `test-token` |
| `PACT_CONSUMER_TAG` | Consumer version tag to verify | `main` |
| `GIT_COMMIT` | Consumer version published to the broker | `0.0.0` |

## Troubleshooting

- Provider verification fails with `404`. Ensure the `stateHandler` seeds the expected data.
- Pact files are not generated. Check the `pact/consumer` directory and the `PACT_LOG_LEVEL` env variable.
- Publish fails with `401`. Verify `PACT_BROKER_TOKEN` is set and valid.
