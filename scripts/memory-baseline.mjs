#!/usr/bin/env node
/**
 * Promote a `pnpm memory:profile` run into the committed memory baseline.
 *
 * Copies each route's heap numbers from benchmark-results/memory-profile.json
 * into src/test/memory/baseline.json (under `browser.scenarios`) and stamps the
 * update time. Thresholds are preserved; only scenario measurements change.
 *
 * Usage:
 *   pnpm dev & pnpm memory:profile && pnpm memory:baseline
 */

'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROFILE_FILE = path.join(ROOT, 'benchmark-results', 'memory-profile.json');
const BASELINE_FILE = path.join(ROOT, 'src', 'test', 'memory', 'baseline.json');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

const profile = readJson(PROFILE_FILE);
if (!profile || !profile.routes) {
  console.error(`[memory] No profile found at ${path.relative(ROOT, PROFILE_FILE)}.`);
  console.error('[memory] Run `pnpm memory:profile` first.');
  process.exit(1);
}

const baseline = readJson(BASELINE_FILE);
if (!baseline) {
  console.error(`[memory] Could not read ${path.relative(ROOT, BASELINE_FILE)}.`);
  process.exit(1);
}

const scenarios = {};
for (const [route, result] of Object.entries(profile.routes)) {
  if (typeof result?.heapUsedBytes !== 'number') continue;
  scenarios[route] = {
    heapUsedBytes: result.heapUsedBytes,
    growthBytes: result.growthBytes ?? 0,
    recordedAt: new Date().toISOString(),
  };
}

if (Object.keys(scenarios).length === 0) {
  console.error('[memory] The profile contained no usable heap measurements.');
  console.error('[memory] Chromium must expose performance.memory (it does by default).');
  process.exit(1);
}

baseline.version = baseline.version || 1;
baseline.updatedAt = new Date().toISOString().slice(0, 10);
baseline.browser = baseline.browser || {};
baseline.browser.scenarios = { ...(baseline.browser.scenarios || {}), ...scenarios };

fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2) + '\n');

console.log(`[memory] baseline updated with ${Object.keys(scenarios).length} scenario(s):`);
for (const [route, scenario] of Object.entries(scenarios)) {
  console.log(
    `[memory]   ${route}: heap ${scenario.heapUsedBytes} bytes, growth ${scenario.growthBytes} bytes`
  );
}
