# Dorisio Frontend API Integration Guide

This guide documents how the frontend integrates with the Dorisio backend and SDK.

## Environment

Set these variables before running the app:

| Variable                          | Purpose                                                  | Example                               |
| --------------------------------- | -------------------------------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_API_URL`             | Backend REST API base URL                                | `https://api.dorisio.dev`             |
| `NEXT_PUBLIC_STELLAR_NETWORK`     | Stellar network label shown to client code               | `testnet`                             |
| `NEXT_PUBLIC_STELLAR_HORIZON_URL` | Horizon endpoint for transaction links and network calls | `https://horizon-testnet.stellar.org` |

Local development uses `.env.example` as the source of truth for required public variables.

## Client Access Pattern

Shared API access should go through the existing SDK client helpers in `src/lib/sdk-client.ts` and domain hooks in `src/hooks`. Components should not call `fetch` directly unless they are calling a frontend-owned Next.js route.

Frontend-owned routes live under `src/app/api`. They are used when the backend SDK does not expose the exact read model needed by a page. For example, creator analytics are served by:

```txt
GET /api/creators/:username/analytics
```

Supported query parameters:

| Parameter   | Values                        | Notes                      |
| ----------- | ----------------------------- | -------------------------- |
| `range`     | `30d`, `90d`, `ytd`, `custom` | Defaults to `30d`          |
| `startDate` | `YYYY-MM-DD`                  | Required for custom ranges |
| `endDate`   | `YYYY-MM-DD`                  | Required for custom ranges |

## Authentication State

The frontend auth store persists under the `Dorisio-auth` localStorage key. Routes that require a signed-in creator should read auth state through `useAuthStore` and redirect when the current user is not allowed to view the requested resource.

## Error Handling

Hooks should normalize backend and network failures into user-facing error strings. Page components should render an alert state rather than an empty table or chart when a request fails.

Recommended hook response shape:

```ts
{
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}
```

## Export Behavior

Analytics and transaction-history data are already loaded client-side, so exports are generated in the browser:

- CSV exports use UTF-8 `text/csv`.
- Excel exports use an HTML workbook saved as `.xls`.
- PDF exports open a printable report that the user can save as PDF from the browser print dialog.

Keep export builders pure and covered by unit tests so data formatting can be verified without launching a browser.

## Test Coverage

Use these commands before changing integration behavior:

```bash
npm run test:run
npm run type-check
npm run test:e2e
```

Visual regression coverage lives in `e2e/visual-regression.spec.ts`. Update snapshots only after reviewing the rendered page in the Playwright report.
