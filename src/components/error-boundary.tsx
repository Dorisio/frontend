'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  /** Content to render when no error is present. */
  children: ReactNode;
  /**
   * Optional custom fallback UI. When provided it receives the caught error
   * and a `reset` callback that clears the error state so the children are
   * re-rendered.
   */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

/**
 * ErrorBoundary — catches render-phase errors thrown by any descendant
 * component and shows a user-friendly fallback instead of a blank page.
 *
 * Must be a class component because React's error-boundary contract requires
 * the static `getDerivedStateFromError` lifecycle and `componentDidCatch`.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <SomePage />
 * </ErrorBoundary>
 * ```
 *
 * Custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={(error, reset) => <MyFallback error={error} onRetry={reset} />}>
 *   <SomePage />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  /** Update state so the fallback UI is rendered on the next paint. */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /** Log error details in development for easier debugging. */
  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary] Caught an error:', error);
      console.error('[ErrorBoundary] Component stack:', info.componentStack);
    }
  }

  /** Reset boundary state so children are re-rendered. */
  reset(): void {
    this.setState({ hasError: false, error: null });
  }

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.reset);
      }

      return <DefaultErrorFallback error={error} onRetry={this.reset} />;
    }

    return children;
  }
}

// ---------------------------------------------------------------------------
// Default fallback UI
// ---------------------------------------------------------------------------

interface DefaultErrorFallbackProps {
  error: Error;
  onRetry: () => void;
}

/**
 * DefaultErrorFallback — a user-friendly error screen shown when no custom
 * `fallback` prop is supplied. Never exposes raw stack traces to the user.
 */
function DefaultErrorFallback({ error, onRetry }: DefaultErrorFallbackProps): JSX.Element {
  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center"
    >
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <svg
          className="h-8 w-8 text-red-600 dark:text-red-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Something went wrong
        </h2>
        <p className="max-w-sm text-sm text-gray-600 dark:text-gray-400">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
      </div>

      {/* Retry button */}
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
        Try again
      </button>
    </div>
  );
}
