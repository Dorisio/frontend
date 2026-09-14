import { RenderHookResult, RenderOptions } from '@testing-library/react';
import '@testing-library/jest-dom';
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

  // Jest-DOM matchers
  interface Matchers<R = void> {
    toBeInTheDocument(): R;
    toHaveClass(className: string): R;
    toHaveAttribute(attr: string, value?: string): R;
    [key: string]: (...args: unknown[]) => R;
  }
}

export {};
