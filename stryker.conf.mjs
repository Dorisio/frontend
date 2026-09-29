/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
const config = {
  packageManager: 'pnpm',
  reporters: ['html', 'clear-text', 'progress', 'dashboard'],
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--loader=tsx'],
  coverageAnalysis: 'perTest',
  mutate: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
    '!src/**/*.spec.ts',
    '!src/**/*.spec.tsx',
    '!src/**/*.stories.ts',
    '!src/**/*.stories.tsx',
    '!src/**/types.ts',
    '!src/**/constants.ts',
  ],
  thresholds: {
    high: 80,
    low: 70,
    break: 60,
  },
  dashboard: {
    project: 'github.com/Dorisio/frontend',
    version: 'main',
  },
  htmlReporter: {
    fileName: 'mutation-report.html',
  },
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  buildCommand: 'pnpm build',
  tempDirName: 'stryker-tmp',
  cleanTempDir: true,
  concurrency: 4,
  timeoutMS: 60000,
  timeoutFactor: 1.5,
  maxConcurrentTestRunners: 4,
  disableTypeChecks: false,
  ignorers: ['node_modules'],
  plugins: [
    '@stryker-mutator/vitest-runner',
    '@stryker-mutator/typescript-checker',
  ],
};

export default config;