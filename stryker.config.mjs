// @ts-check
/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
const config = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.ts',
  },

  // Only mutate source files, not tests
  mutate: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
    '!src/**/*.spec.ts',
    '!src/**/*.spec.tsx',
    '!src/**/__tests__/**',
    '!src/testing/**',
    '!src/main.tsx',
    '!src/**/*.d.ts',
    '!src/**/*.config.ts',
  ],

  // Focus on critical areas first (adjust based on your priorities)
  mutate: [
    // Core business logic
    'src/services/**/*.ts',
    'src/stores/**/*.ts',
    'src/hooks/**/*.ts',
    'src/utils/**/*.ts',
    // Critical features
    'src/features/**/services/**/*.ts',
    'src/features/**/hooks/**/*.ts',
    // Exclude UI components initially (they're harder to mutation test)
    '!src/components/**',
    '!src/features/**/components/**',
    // Exclude test files
    '!**/*.test.ts',
    '!**/*.test.tsx',
    '!**/__tests__/**',
  ],

  // Coverage thresholds - start conservative
  thresholds: {
    high: 80,  // 80%+ mutation score is excellent
    low: 60,   // 60%+ is acceptable
    break: 50, // Fail build if below 50%
  },

  // Reporters
  reporters: ['html', 'clear-text', 'progress', 'json'],
  htmlReporter: {
    fileName: 'mutation-report/mutation-report.html',
  },
  jsonReporter: {
    fileName: 'mutation-report/mutation-report.json',
  },

  // Performance settings
  concurrency: 4,
  timeoutMS: 60000, // 60 seconds per test
  timeoutFactor: 1.5,

  // Ignore specific mutators if they create too much noise
  // Uncomment to customize:
  // mutator: {
  //   excludedMutations: [
  //     'StringLiteral', // Often not meaningful
  //     'BlockStatement', // Can be noisy
  //   ],
  // },

  // Incremental mode - only test changed files
  incremental: true,
  incrementalFile: '.stryker-tmp/incremental.json',

  // Ignore patterns
  ignorePatterns: [
    'node_modules',
    'dist',
    'coverage',
    '.stryker-tmp',
    'mutation-report',
  ],

  // Disable static mutants (they're always killed)
  disableTypeChecks: false,

  // Comment out to test everything (very slow):
  // coverageAnalysis: 'perTest',

  // Use 'all' for faster initial analysis
  coverageAnalysis: 'all',
};

export default config;
