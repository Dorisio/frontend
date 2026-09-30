#!/usr/bin/env node
/**
 * Browser heap profiler for Dorisio.
 *
 * Drives a running build with Chromium (via the already-installed
 * `@playwright/test`), navigates each route several times, forces GC where
 * possible, and records `performance.memory.usedJSHeapSize` after each pass.
 * Per-route growth (last minus first) is what the threshold gate checks.
 *
 * Chrome-only APIs are used deliberately: `performance.memory` and
 * `window.gc` (with `--js-flags=--expose-gc`) are the only way to get a
 * comparable number without a heap-snapshot diff.
 *
 * Usage:
 *   pnpm dev                       # in one terminal
 *   pnpm memory:profile            # in another
 *
 *   node scripts/memory-profile.mjs \
 *     --base-url=http://localhost:3000 \
 *     --routes=/,/creators \
 *     --iterations=5
 *
 * Output: benchmark-results/memory-profile.json
 */

'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'benchmark-results');
const OUT_FILE = path.join(OUT_DIR, 'memory-profile.json');

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.MEMORY_PROFILE_URL || 'http://localhost:3000',
    routes: (process.env.MEMORY_PROFILE_ROUTES || '/,/creators').split(','),
    iterations: Number(process.env.MEMORY_PROFILE_ITERATIONS || 3),
  };

  for (const raw of argv) {
    const [flag, value] = raw.split('=');
    if (flag === '--base-url' && value) args.baseUrl = value;
    else if (flag === '--routes' && value) args.routes = value.split(',');
    else if (flag === '--iterations' && value) args.iterations = Number(value);
  }

  args.routes = args.routes.map((r) => r.trim()).filter(Boolean);
  if (!Number.isFinite(args.iterations) || args.iterations < 1) args.iterations = 3;

  return args;
}

async function loadChromium() {
  try {
    const playwright = await import('@playwright/test');
    return playwright.chromium;
  } catch (err) {
    console.error('[memory] Could not load @playwright/test.');
    console.error('[memory] Install dependencies and Playwright browsers first:');
    console.error('[memory]   pnpm install');
    console.error('[memory]   pnpm exec playwright install chromium');
    console.error(`[memory] ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

/** Read usedJSHeapSize, forcing GC if the flag is enabled. */
async function readHeapBytes(page) {
  return page.evaluate(() => {
    const gc = window.gc;
    if (typeof gc === 'function') gc();
    const memory = window.performance && window.performance.memory;
    return memory ? Math.round(memory.usedJSHeapSize) : null;
  });
}

async function profileRoute(page, baseUrl, route, iterations) {
  const url = new URL(route, baseUrl).toString();
  const samples = [];

  for (let i = 0; i < iterations; i++) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(500);
    const bytes = await readHeapBytes(page);
    if (typeof bytes === 'number' && bytes > 0) samples.push(bytes);
  }

  if (samples.length === 0) {
    return { route, samples, heapUsedBytes: null, growthBytes: null };
  }

  const first = samples[0];
  const last = samples[samples.length - 1];
  return {
    route,
    samples,
    heapUsedBytes: last,
    growthBytes: last - first,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const chromium = await loadChromium();

  const browser = await chromium.launch({
    headless: true,
    args: ['--js-flags=--expose-gc', '--enable-precise-memory-info'],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {};
  try {
    for (const route of args.routes) {
      process.stdout.write(`[memory] profiling ${route} ... `);
      const result = await profileRoute(page, args.baseUrl, route, args.iterations);
      results[route] = result;
      if (result.heapUsedBytes === null) {
        console.log('unavailable (performance.memory not exposed)');
      } else {
        console.log(
          `heap ${result.heapUsedBytes} bytes, growth ${result.growthBytes} bytes`
        );
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl: args.baseUrl,
        iterations: args.iterations,
        routes: results,
      },
      null,
      2
    ) + '\n'
  );

  console.log(`[memory] wrote ${path.relative(ROOT, OUT_FILE)}`);
  console.log('[memory] compare against the baseline with `pnpm memory:check`.');
}

main().catch((err) => {
  console.error(`[memory] profiling failed: ${err instanceof Error ? err.message : String(err)}`);
  console.error('[memory] Is the dev/prod server running at the configured base URL?');
  process.exit(1);
});
