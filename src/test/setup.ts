import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup, renderHook as rtlRenderHook } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend vitest matchers with jest-dom matchers
expect.extend(matchers);

// Augment vitest's Assertion type to include jest-dom matchers
declare module 'vitest' {
  interface Assertion {
    toBeInTheDocument(): this;
    toHaveClass(className: string | RegExp): this;
    toHaveAttribute(attr: string, value?: string | RegExp): this;
  }
}

// Expose renderHook globally for vitest globals mode
if (typeof globalThis !== 'undefined') {
  (globalThis as any).renderHook = rtlRenderHook;
}

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor(public callback: IntersectionObserverCallback) {}
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});
