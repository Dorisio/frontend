import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Memory tests live in a dedicated suite (vitest.memory.config.ts) because
    // they run with --expose-gc and are allowed to be slower; keep them out of
    // the default unit run so it stays fast and deterministic.
    exclude: [...configDefaults.exclude, '**/*.memory.test.ts', '**/*.memory.test.tsx'],
    benchmark: {
      include: ['src/**/*.bench.ts', 'src/**/*.bench.tsx'],
      reporters: ['default', 'json'],
      outputFile: './benchmark-results/results.json',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}) as any;
