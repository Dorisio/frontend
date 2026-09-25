# E2E Tests

Playwright covers the critical signup, tip creation, analytics, and wallet settings flows across desktop Chrome, desktop Firefox, mobile Chrome, and mobile Safari projects.

Run locally with:

```bash
pnpm test:e2e
```

Debug the last HTML report with:

```bash
pnpm test:e2e:report
```

The suite starts the Next.js dev server through `playwright.config.ts`, records screenshots/videos/traces on failure, and mocks backend analytics responses with Playwright route interception.
