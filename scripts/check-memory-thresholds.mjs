#!/usr/bin/env node
/**
 * Memory threshold gate.
 *
 * Reads benchmark-results/memory-profile.json (produced by `pnpm memory:profile`)
 * and fails when either:
 *   - a route's per-run heap growth exceeds `browser.thresholds.maxGrowthBytes`
 *     or `maxGrowthRatio`, or
 *   - a route regresses beyond the recorded scenario in
 *     src/test/memory/baseline.json.
 *
 * Relative regression (growth vs. baseline growth) is the primary signal; the
 * absolute threshold catches first-run blow-ups where no baseline exists yet.
 *
 * Usage: node scripts/check-memory-thresholds.mjs [profile.json]
 */

'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_PROFILE = path.join(ROOT, 'benchmark-results', 'memory-profile.json');
const BASELINE_FILE = path.join(ROOT, 'src', 'test', 'memory', 'baseline.json');

const profilePath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_PROFILE;

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

function formatBytes(bytes) {
  const sign = bytes < 0 ? '-' : '';
  const abs = Math.abs(bytes);
  if (abs < 1024) return `${sign}${abs}B`;
  if (abs < 1024 * 1024) return `${sign}${(abs / 1024).toFixed(1)}KB`;
  return `${sign}${(abs / (1024 * 1024)).toFixed(2)}MB`;
}

const profile = readJson(profilePath);
if (!profile || !profile.routes) {
  console.error(`[memory] Profile not found at ${profilePath}`);
  console.error('[memory] Run `pnpm memory:profile` first to generate it.');
  process.exit(1);
}

const baseline = readJson(BASELINE_FILE) || {};
const thresholds = baseline.browser?.thresholds || {};
const maxGrowthBytes = thresholds.maxGrowthBytes ?? 3 * 1024 * 1024;
const maxGrowthRatio = thresholds.maxGrowthRatio ?? 1.25;

const failures = [];
console.log('[memory] Browser heap profile:');

for (const [route, result] of Object.entries(profile.routes)) {
  if (typeof result?.heapUsedBytes !== 'number') {
    console.log(`[memory]   ${route}: no measurement (skipped)`);
    continue;
  }

  const growthBytes = result.growthBytes ?? 0;
  const parts = [
    `${route}: heap ${formatBytes(result.heapUsedBytes)}`,
    `growth ${formatBytes(growthBytes)}`,
  ];

  if (growthBytes > maxGrowthBytes) {
    failures.push(
      `${route} grew ${formatBytes(growthBytes)} across ${result.samples?.length ?? '?'} ` +
        `runs (> ${formatBytes(maxGrowthBytes)})`
    );
  }

  const scenario = baseline.browser?.scenarios?.[route];
  if (typeof scenario?.growthBytes === 'number' && scenario.growthBytes > 0) {
    const ratio = growthBytes / scenario.growthBytes;
    parts.push(`baseline ${formatBytes(scenario.growthBytes)} (${ratio.toFixed(2)}x)`);
    if (ratio > maxGrowthRatio) {
      failures.push(
        `${route} growth regressed to ${formatBytes(growthBytes)}, ${ratio.toFixed(2)}x the ` +
          `baseline ${formatBytes(scenario.growthBytes)}`
      );
    }
  } else {
    parts.push('no baseline scenario recorded');
  }

  console.log(`[memory]   ${parts.join(' | ')}`);
}

if (failures.length > 0) {
  console.error('');
  console.error('[memory] Memory gate failed:');
  for (const failure of failures) console.error(`[memory]   - ${failure}`);
  process.exit(1);
}

console.log('');
console.log('[memory] All routes within memory budgets.');
