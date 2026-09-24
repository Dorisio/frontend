import { RenderHookResult, RenderOptions } from '@testing-library/react';
import '@testing-library/jest-dom';
// Augments vitest's `Assertion`/`AsymmetricMatchersContaining` interfaces with
// the full jest-dom matcher set (toBeInTheDocument, toHaveClass,
// toHaveAttribute, toBeDisabled, toHaveTextContent, etc.) via jest-dom's own
// officially published vitest type augmentation, rather than hand-listing a
// partial subset here.
import '@testing-library/jest-dom/vitest';
import { MockedFunction, Assertion } from 'vitest';

declare global {
  // Vitest globals
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function test(name: string, fn: () => void | Promise<void>): void;
  function vi(): { fn: () => MockedFunction<unknown> } & Record<string, unknown>;
  function expect<T>(value: T): Assertion<T>;

  // React Testing Library hook rendering
  function renderHook<TProps, TResult>(
    render: (initialProps: TProps) => TResult,
    options?: RenderOptions
  ): RenderHookResult<TResult, TProps>;
  function renderHook<TResult>(
    render: () => TResult,
    options?: RenderOptions
  ): RenderHookResult<TResult, undefined>;
}

export {};
