'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import posthog from 'posthog-js';

type FeatureFlagsContextValue = { ready: boolean; revision: number };

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  ready: false,
  revision: 0,
});

/** Initializes PostHog flags once and keeps the current visitor identity in sync. */
export function FeatureFlagsProvider({
  children,
  distinctId,
}: {
  children: ReactNode;
  distinctId?: string;
}): JSX.Element {
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  useEffect(() => {
    if (!apiKey) return;

    if (!posthog.__loaded) {
      posthog.init(apiKey, {
        api_host: host,
        defaults: '2025-05-24',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
      });
    }

    const updateFlags = (): void => {
      setReady(true);
      setRevision((current) => current + 1);
    };
    posthog.onFeatureFlags(updateFlags);
    if (distinctId) {
      posthog.identify(distinctId);
    } else if (posthog.__loaded) {
      posthog.reset();
    }
  }, [apiKey, host, distinctId]);

  const value = useMemo(() => ({ ready, revision }), [ready, revision]);
  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

/** Returns a boolean rollout or experiment variant. Missing flags use the safe fallback. */
export function useFeatureFlag(key: string, fallback: boolean | string = false): boolean | string {
  const { revision } = useContext(FeatureFlagsContext);
  void revision;
  const value = posthog.getFeatureFlag(key);
  return resolveFeatureFlag(value, fallback);
}

export function resolveFeatureFlag(
  value: boolean | string | undefined | null,
  fallback: boolean | string
): boolean | string {
  return value === undefined || value === null ? fallback : value;
}

/** Record an experiment event so PostHog can compare variant outcomes. */
export function captureFeatureEvent(
  event: string,
  properties: Record<string, string | number | boolean> = {}
): void {
  if (posthog.__loaded) posthog.capture(event, properties);
}
