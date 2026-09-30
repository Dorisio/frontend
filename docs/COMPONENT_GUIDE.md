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
