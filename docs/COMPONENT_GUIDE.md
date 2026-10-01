# Dorisio component guide

This is the component catalogue and usage guide for the frontend. Prefer these primitives over one-off markup so keyboard behaviour, focus styles, theme tokens, and responsive layout stay consistent.

For breakpoints, mobile-first grids, touch targets, and device testing, see the [mobile-first and responsive layout guide](MOBILE_FIRST_RESPONSIVE_GUIDE.md).

## Quick examples

```tsx
import { Button, Card, CardContent, Input, Label } from '@/components/ui';

<Card>
  <CardContent className="space-y-3">
    <Label htmlFor="amount">Tip amount</Label>
    <Input id="amount" inputMode="decimal" aria-describedby="amount-help" />
    <p id="amount-help" className="text-sm text-muted-foreground">Enter a USDC amount.</p>
    <Button type="submit">Send tip</Button>
  </CardContent>
</Card>
```

## UI primitives

| Component | Main props/variants | Usage and accessibility |
| --- | --- | --- |
| `Button` | `variant`: default, destructive, outline, secondary, ghost, link; `size`: default, sm, lg, icon | Use a real button for actions. Provide an accessible name for icon-only buttons and disable while submitting. |
| `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter` | Standard `className` and HTML attributes | Use for grouped content; keep heading hierarchy meaningful. |
| `Input` | Native input props plus `className` | Always pair with `Label`; provide `type`, autocomplete, and an error description where needed. |
| `Label` | Native label props | Use `htmlFor` with the matching control `id`. |
| `Modal` | Open/close state and title/content slots | Trap focus, provide a labelled title, close on Escape, and return focus to the trigger. |
| `Badge` | `variant`: default, secondary, destructive, outline, success, warning | Status only; do not communicate important state by colour alone. |

## Shared and feature components

`Avatar` provides image/fallback rendering; supply meaningful `alt` text. `LoadingSpinner`, `Skeleton`, `CreatorSkeletons`, and `EmptyState` cover loading and no-data states. `ErrorMessage` and `ErrorBoundary` provide safe failure UI. `CreatorVerificationBadge`, `SupporterBadge`, and `SubscriberBadge` expose status with text and ARIA labels. `CreatorBio`, `CreatorPortfolio`, `CreatorSearchBar`, `CreatorFacetSidebar`, `DorisioButton`, `WalletManager`, and `WalletSelector` are the reusable creator/discovery and payment sections.

Analytics sections include `AnalyticsDateRangePicker`, `AnalyticsSummaryCards`, `EarningsTrendChart`, `TipSourceBreakdown`, `TopTippersTable`, `SupporterLeaderboard`, and `TransactionFilterBar`. Subscription sections include `SubscriptionTiers`, `SubscriptionManagement`, and `SubscriptionSettings`.

## Do and don't

* Do use theme tokens (`bg-background`, `text-foreground`, `border-border`) and responsive Tailwind classes.
* Do keep interactive controls keyboard reachable, visibly focused, and labelled.
* Do use `Button` for actions and `Link` for navigation.
* Don't put a clickable `div` where a button or link is appropriate.
* Don't use colour, placeholder text, or an icon as the only error/status signal.
* Don't put secrets, raw wallet credentials, or personal data into client-rendered props.

## Adding a component

1. Define a typed props interface and a small single-purpose API.
2. Add a focused test covering the default state, interaction, and accessibility label.
3. Use the shared primitives and theme tokens.
4. Document public props, variants, keyboard behaviour, and a short example here.
5. Run `npm run lint`, `npm run type-check`, and the relevant Vitest test before opening a PR.

## Performance benchmarking

Component render performance is measured automatically so slow components and regressions are caught before they reach production.

The benchmark suite lives in `benchmarks/components/` and runs with Vitest's `bench` mode via `@vitest/bench`. Each benchmark mounts a component with realistic props and records median render time and operations per second.

```tsx\nimport { bench } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '@/components/ui';

bench('Button render', () => {
  render(<Button>Send tip</Button>);
});
```

Run the benchmarks locally with `npm run bench`. The CI pipeline runs the same suite on every pull request and compares results against the committed baseline in `benchmarks/baseline.json`.

### Baseline metrics

Baseline median render times (identifier in `benchmarks/baseline.json`):

| Component | Baseline median render (ms) | Threshold (ms) |
| --- | --- | --- |
| `Button` | 0.15 | 0.50 |
| `Badge` | 0.10 | 0.40 |
| `Input` | 0.18 | 0.50 |
| `Label` | 0.08 | 0.30 |
| `Card` | 0.22 | 0.60 |
| `Avatar` | 0.25 | 0.60 |
| `LoadingSpinner` | 0.12 | 0.40 |
| `Skeleton` | 0.14 | 0.40 |
| `EmptyState` | 0.30 | 0.80 |
| `ErrorMessage` | 0.20 | 0.60 |
| `CreatorBio` | 0.40 | 1.00 |
| `CreatorSearchBar` | 0.45 | 1.20 |
| `AnalyticsSummaryCards` | 0.60 | 1.50 |
| `TopTippersTable` | 0.80 | 2.00 |
| `SubscriptionTiers` | 0.70 | 1.80 |

Thresholds are defined in `benchmarks/thresholds.json`. A benchmark fails the CI gate when its median render time exceeds the threshold or regresses more than 20% over the committed baseline.

### Performance dashboard

Benchmark results are uploaded as a CI artifact and published to the performance dashboard at `/performance/components`. The dashboard shows the latest median render time per component, the delta against the baseline, and the trend across recent commits so slow components are identified at a glance.
