# Feature flags and experiments

Dorisio uses PostHog for remotely managed feature flags, percentage rollouts,
experiment variants, and flag evaluation analytics. The browser SDK is optional;
without a project key, flag checks use their explicit fallback values and tip
flows continue to work.

## Configure PostHog

1. Create a PostHog project and copy its **Project API key** and host (US or EU).
2. Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` in the local
   environment and deployment environment. The project key is public by design;
   never put a personal API key or service-role secret in a `NEXT_PUBLIC_*`
   variable.
3. Create a feature flag in PostHog. Use boolean flags for on/off rollout or
   multivariate flags for experiment variants. PostHog's flag dashboard controls
   the target groups and rollout percentage, so a change takes effect without a
   frontend deploy.
4. Use `useFeatureFlag('scheduled_tips', true)` in client components. Boolean
   flags return `true` or `false`; multivariate flags return the configured
   variant key. The second argument is the safe fallback used when PostHog is
   not configured or has no decision for the visitor.

The provider identifies signed-in users by their stable account id and resets
the anonymous identity on sign-out. Do not send wallet addresses, transaction
hashes, message contents, or other payment details as flag properties. The tip
flow emits `tip_succeeded` and `tip_failed` events with only the amount and a
short error description; PostHog automatically associates evaluated flag
variants with those events for experiment analysis.

## Roll out safely

Start a flag at 0%, expose it to internal/test accounts, then increase the
percentage in steps while monitoring errors and `tip_failed` events. Keep the
fallback safe for an unavailable flag service. Once a feature is fully rolled
out, remove the flag and its old code path in a later change to avoid permanent
flag debt.
