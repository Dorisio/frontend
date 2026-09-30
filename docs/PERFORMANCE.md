# Lighthouse performance gates

Every pull request runs Lighthouse against the homepage and creator discovery page. The configuration uses three runs to reduce noise and fails the job when the minimum performance, accessibility, SEO, or Core Web Vitals budgets in `lighthouserc.cjs` are exceeded.

Reports are uploaded to Lighthouse's temporary public storage for review in the Actions log. They are intentionally temporary and contain no application secrets. To investigate a regression, compare the failing assertion and median run with the previous successful workflow; do not lower a budget without documenting the product reason in the PR.

> Runtime **memory** performance is monitored separately: see [MEMORY_PROFILING.md](./MEMORY_PROFILING.md), [MEMORY_LEAK_PITFALLS.md](./MEMORY_LEAK_PITFALLS.md) and [MEMORY_MONITORING.md](./MEMORY_MONITORING.md).

Run locally with a production build:

```bash
npm run build
npx @lhci/cli@0.14.0 autorun --config=lighthouserc.cjs
```
