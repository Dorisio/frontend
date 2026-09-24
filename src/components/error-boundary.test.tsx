import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './error-boundary';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A component that unconditionally throws during render. */
function BombComponent({ message = 'Test render error' }: { message?: string }): JSX.Element {
  throw new Error(message);
}

/**
 * A component that can be toggled between throwing and not throwing via a
 * prop, letting us test the retry / reset flow.
 */
function ConditionalBomb({ shouldThrow }: { shouldThrow: boolean }): JSX.Element {
  if (shouldThrow) {
    throw new Error('Conditional error');
  }
  return <div data-testid="safe-content">Safe content</div>;
}

// Suppress React's expected error output so test output stays clean.
function suppressConsoleError() {
  return vi.spyOn(console, 'error').mockImplementation(() => {});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── Normal render ─────────────────────────────────────────────────────────

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Hello</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  // ── Error catching ────────────────────────────────────────────────────────

  it('catches a render error and shows the default fallback UI', () => {
    const spy = suppressConsoleError();

    render(
      <ErrorBoundary>
        <BombComponent message="Something exploded" />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Something exploded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    spy.mockRestore();
  });

  it('does not render children after an error has been caught', () => {
    const spy = suppressConsoleError();

    render(
      <ErrorBoundary>
        <BombComponent />
      </ErrorBoundary>
    );

    // The child never successfully rendered, so its content must not be present.
    expect(screen.queryByTestId('safe-content')).not.toBeInTheDocument();

    spy.mockRestore();
  });

  // ── Console logging ───────────────────────────────────────────────────────

  it('logs the error to console.error in non-production environments', () => {
    const spy = suppressConsoleError();

    render(
      <ErrorBoundary>
        <BombComponent message="Logged error" />
      </ErrorBoundary>
    );

    // componentDidCatch logs two messages: the error and the component stack.
    const calls = spy.mock.calls.map((args) => String(args[0]));
    expect(calls.some((msg) => msg.includes('[ErrorBoundary] Caught an error:'))).toBe(true);

    spy.mockRestore();
  });

  // ── Retry behaviour ───────────────────────────────────────────────────────

  it('resets boundary state and re-renders children when the retry button is clicked', async () => {
    const user = userEvent.setup();
    const spy = suppressConsoleError();

    /**
     * We need a stateful wrapper so we can change the `shouldThrow` prop after
     * the boundary resets, simulating the "error gone, retry works" scenario.
     */
    let setShouldThrow!: (v: boolean) => void;

    function Wrapper(): JSX.Element {
      const [shouldThrow, setThrow] = require('react').useState(true);
      setShouldThrow = setThrow;
      return (
        <ErrorBoundary>
          <ConditionalBomb shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }

    render(<Wrapper />);

    // Boundary should have caught the error.
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fix the underlying issue, then click retry.
    setShouldThrow(false);
    await user.click(screen.getByRole('button', { name: /try again/i }));

    // After reset, children render successfully.
    expect(screen.getByTestId('safe-content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    spy.mockRestore();
  });

  // ── Custom fallback ───────────────────────────────────────────────────────

  it('renders the custom fallback when the fallback prop is provided', () => {
    const spy = suppressConsoleError();

    render(
      <ErrorBoundary
        fallback={(error, reset) => (
          <div data-testid="custom-fallback">
            <p data-testid="custom-message">{error.message}</p>
            <button onClick={reset} data-testid="custom-reset">
              Retry
            </button>
          </div>
        )}
      >
        <BombComponent message="Custom fallback error" />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('custom-message').textContent).toBe('Custom fallback error');
    // Default fallback must NOT be shown.
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();

    spy.mockRestore();
  });

  it('custom fallback reset callback resets the boundary', async () => {
    const user = userEvent.setup();
    const spy = suppressConsoleError();

    let setError!: (v: boolean) => void;

    function Wrapper(): JSX.Element {
      const [shouldThrow, setThrow] = require('react').useState(true);
      setError = setThrow;
      return (
        <ErrorBoundary
          fallback={(_err, reset) => (
            <button data-testid="custom-retry" onClick={reset}>
              Custom retry
            </button>
          )}
        >
          <ConditionalBomb shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }

    render(<Wrapper />);
    expect(screen.getByTestId('custom-retry')).toBeInTheDocument();

    setError(false);
    await user.click(screen.getByTestId('custom-retry'));

    expect(screen.getByTestId('safe-content')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-retry')).not.toBeInTheDocument();

    spy.mockRestore();
  });

  // ── Error message fallback ────────────────────────────────────────────────

  it('shows a generic message when the error has no message', () => {
    const spy = suppressConsoleError();

    function EmptyMessageBomb(): JSX.Element {
      throw new Error('');
    }

    render(
      <ErrorBoundary>
        <EmptyMessageBomb />
      </ErrorBoundary>
    );

    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();

    spy.mockRestore();
  });
});
