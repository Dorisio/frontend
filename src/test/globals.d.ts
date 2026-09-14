import { RenderHookResult } from '@testing-library/react';
import '@testing-library/jest-dom';

declare global {
  // Vitest globals
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function test(name: string, fn: () => void | Promise<void>): void;
  function vi(value: any): any;
  function expect(value: any): Matchers<any>;

  // React Testing Library hook rendering
  function renderHook<TProps, TResult>(
    render: (initialProps: TProps) => TResult,
    options?: any
  ): RenderHookResult<TResult, TProps>;
  function renderHook<TResult>(
    render: () => TResult,
    options?: any
  ): RenderHookResult<TResult, undefined>;

  // Jest-DOM matchers
  interface Matchers<R = void> {
    toBeInTheDocument(): R;
    toHaveClass(className: string): R;
    toHaveAttribute(attr: string, value?: string): R;
    [key: string]: any;
  }
}

export {};
