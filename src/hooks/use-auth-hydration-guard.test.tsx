/**
 * Verifies the hydration-guard *pattern* that `src/app/providers.tsx` uses
 * around `useAuthHydration`: don't render children until hydration
 * completes, and sync the restored token once it does.
 *
 * This renders a minimal stand-in provider built from the real
 * `useAuthHydration` hook (with the auth store mocked) rather than
 * `Providers` itself, because `Providers` imports the `dorisio-sdk`
 * package directly and that package does not resolve to a real, buildable
 * module in this environment (see final report). The gating logic under
 * test here is the same logic `Providers` delegates to.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuthHydration } from './use-auth-hydration';

interface MockAuthState {
  hasHydrated: boolean;
  token: string | null;
}

let mockState: MockAuthState = { hasHydrated: false, token: null };

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: MockAuthState) => unknown) => selector(mockState),
}));

function TestGuardedProvider({
  children,
  onTokenRestored,
}: {
  children: React.ReactNode;
  onTokenRestored: (token: string | null) => void;
}): JSX.Element {
  const { hasHydrated } = useAuthHydration(onTokenRestored);

  if (!hasHydrated) {
    return <div data-testid="hydration-loader">Loading…</div>;
  }

  return <>{children}</>;
}

describe('hydration guard pattern (as used by Providers)', () => {
  beforeEach(() => {
    mockState = { hasHydrated: false, token: null };
  });

  it('renders a loading state instead of children before hydration completes', () => {
    mockState = { hasHydrated: false, token: null };

    render(
      <TestGuardedProvider onTokenRestored={vi.fn()}>
        <div data-testid="app-content">App content</div>
      </TestGuardedProvider>
    );

    expect(screen.getByTestId('hydration-loader')).toBeInTheDocument();
    expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
  });

  it('renders children once hydration completes', () => {
    mockState = { hasHydrated: true, token: null };

    render(
      <TestGuardedProvider onTokenRestored={vi.fn()}>
        <div data-testid="app-content">App content</div>
      </TestGuardedProvider>
    );

    expect(screen.getByTestId('app-content')).toBeInTheDocument();
    expect(screen.queryByTestId('hydration-loader')).not.toBeInTheDocument();
  });

  it('syncs the restored token exactly once hydration completes', () => {
    const onTokenRestored = vi.fn();
    mockState = { hasHydrated: true, token: 'session-token' };

    render(
      <TestGuardedProvider onTokenRestored={onTokenRestored}>
        <div>App content</div>
      </TestGuardedProvider>
    );

    expect(onTokenRestored).toHaveBeenCalledWith('session-token');
  });
});
