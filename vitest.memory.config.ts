import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Dedicated config for the memory suite (src/test/memory/**\/*.memory.test.*).
 *
 * Two deliberate differences from the default vitest config:
 *  - `execArgv: ['--expose-gc']` so `global.gc()` is available. Tests force a
 *    GC before measuring, which turns noisy heap readings into a usable signal.
 *  - a JSON reporter writing `benchmark-results/memory-results.json`, uploaded
 *    by the CI memory job and comparable against src/test/memory/baseline.json.
 *
 * Run with: pnpm test:memory
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/memory/**/*.memory.test.ts', 'src/test/memory/**/*.memory.test.tsx'],
    // Vitest 4+ moved pool options to the top level. `--expose-gc` makes
    // `global.gc()` available so heap measurements can be stabilised.
    pool: 'forks',
    execArgv: ['--expose-gc'],
    reporters: ['default', 'json'],
    outputFile: './benchmark-results/memory-results.json',
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}) as any;
