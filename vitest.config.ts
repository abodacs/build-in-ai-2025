import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: false, // Disable CSS processing in tests

    // Performance optimizations
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        // Memory-safe: Limit max forks to prevent excessive memory usage
        maxForks: 1,
        minForks: 1,
      },
    },
    maxConcurrency: 5,
    // Memory-safe: Limit concurrent worker processes
    maxWorkers: 1,
    minWorkers: 1,

    // Memory monitoring
    logHeapUsage: true,

    // Timeouts for faster test execution
    testTimeout: 10000, // 10 seconds max per test
    hookTimeout: 5000, // 5 seconds for hooks
    teardownTimeout: 3000, // 3 seconds for cleanup

    // Reduce output noise for faster runs
    reporters: process.env.CI ? ['default', 'json'] : ['default'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/.next/**',
        'coverage/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Test file patterns
    include: [
      '**/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}',
      '**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'coverage/**',
      '**/e2e/**', // Exclude E2E tests from unit test runs
    ],

    // Memory-safe: Isolate tests to prevent memory leaks and state pollution
    // Set to true to prevent test interference with coverage and ensure clean state
    isolate: true,

    // Memory-safe: Ensure proper cleanup between test files
    sequence: {
      shuffle: false, // Deterministic test order for debugging memory issues
    },

    // Memory-safe: Limit file parallelism to prevent memory spikes
    fileParallelism: true,
  },
  resolve: {
    alias: {
      '@/tests': path.resolve(__dirname, './tests'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
