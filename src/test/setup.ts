import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup, renderHook as rtlRenderHook } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend vitest matchers with jest-dom matchers
expect.extend(matchers);

// The vitest `Assertion` type augmentation for these matchers lives in
// src/test/globals.d.ts (via `@testing-library/jest-dom/vitest`), covering
// the full jest-dom matcher set rather than a hand-picked subset here.

// Expose renderHook globally for vitest globals mode
if (typeof globalThis !== 'undefined') {
  const global = globalThis as typeof globalThis & { renderHook: typeof rtlRenderHook };
  global.renderHook = rtlRenderHook;
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

// happy-dom reports a 0x0 layout size for every element (no real layout
// engine), so recharts' `ResponsiveContainer` (used by the analytics
// dashboard charts) never measures a usable size and renders nothing.
// Give every element a stand-in, non-zero bounding rect so chart
// components under test actually render their SVG content.
HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 600,
  height: 300,
  top: 0,
  left: 0,
  bottom: 300,
  right: 600,
  x: 0,
  y: 0,
  toJSON: () => {},
}));
