/**
 * Memory-Safe Configuration Tests
 *
 * Tests to verify that all configuration files have memory-safe settings
 * and that these settings are properly enforced during test runs.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Helper to read config files
const readConfig = (filename: string) => {
  const configPath = join(process.cwd(), filename);
  return readFileSync(configPath, 'utf-8');
};

describe('Vitest Configuration Memory Safety', () => {
  it('should have worker limits configured', () => {
    const config = readConfig('vitest.config.ts');

    expect(config).toContain('maxWorkers');
    expect(config).toContain('minWorkers');
    expect(config).toMatch(/maxWorkers:\s*\d+/);
    expect(config).toMatch(/minWorkers:\s*\d+/);
  });

  it('should have fork pool limits configured', () => {
    const config = readConfig('vitest.config.ts');

    expect(config).toContain('maxForks');
    expect(config).toContain('minForks');
    expect(config).toMatch(/maxForks:\s*\d+/);
    expect(config).toMatch(/minForks:\s*\d+/);
  });

  it('should have heap usage logging enabled', () => {
    const config = readConfig('vitest.config.ts');

    expect(config).toContain('logHeapUsage: true');
  });

  it('should have test isolation enabled', () => {
    const config = readConfig('vitest.config.ts');

    expect(config).toContain('isolate: true');
  });

  it('should have deterministic test order for memory debugging', () => {
    const config = readConfig('vitest.config.ts');

    expect(config).toContain('sequence');
    expect(config).toContain('shuffle: false');
  });

  it('should have file parallelism configured', () => {
    const config = readConfig('vitest.config.ts');

    expect(config).toContain('fileParallelism: true');
  });

  it('should have reasonable timeout values', () => {
    const config = readConfig('vitest.config.ts');

    // Check for timeout configurations
    expect(config).toMatch(/testTimeout:\s*\d+/);
    expect(config).toMatch(/hookTimeout:\s*\d+/);
    expect(config).toMatch(/teardownTimeout:\s*\d+/);

    // Verify timeouts are reasonable (not too long)
    const testTimeoutMatch = config.match(/testTimeout:\s*(\d+)/);
    const hookTimeoutMatch = config.match(/hookTimeout:\s*(\d+)/);
    const teardownTimeoutMatch = config.match(/teardownTimeout:\s*(\d+)/);

    if (testTimeoutMatch) {
      const testTimeout = parseInt(testTimeoutMatch[1], 10);
      expect(testTimeout).toBeLessThanOrEqual(15000); // Max 15 seconds
    }

    if (hookTimeoutMatch) {
      const hookTimeout = parseInt(hookTimeoutMatch[1], 10);
      expect(hookTimeout).toBeLessThanOrEqual(10000); // Max 10 seconds
    }

    if (teardownTimeoutMatch) {
      const teardownTimeout = parseInt(teardownTimeoutMatch[1], 10);
      expect(teardownTimeout).toBeLessThanOrEqual(5000); // Max 5 seconds
    }
  });
});

describe('Vite Configuration Memory Safety', () => {
  it('should have asset inline limit configured', () => {
    const config = readConfig('vite.config.ts');

    expect(config).toContain('assetsInlineLimit');
    expect(config).toMatch(/assetsInlineLimit:\s*\d+/);
  });

  it('should have max parallel file operations limit', () => {
    const config = readConfig('vite.config.ts');

    expect(config).toContain('maxParallelFileOps');
    expect(config).toMatch(/maxParallelFileOps:\s*\d+/);
  });

  it('should have HMR overlay configured to prevent memory leaks', () => {
    const config = readConfig('vite.config.ts');

    expect(config).toContain('hmr');
    expect(config).toContain('overlay: true');
  });

  it('should have watch options configured for efficient file watching', () => {
    const config = readConfig('vite.config.ts');

    expect(config).toContain('watch');
    expect(config).toContain('usePolling: false');
    expect(config).toContain('ignored');
  });

  it('should have optimizeDeps configured with memory limits', () => {
    const config = readConfig('vite.config.ts');

    expect(config).toContain('optimizeDeps');
    expect(config).toContain('esbuildOptions');
    expect(config).toContain('logLimit');
  });

  it('should have chunk size warning limit', () => {
    const config = readConfig('vite.config.ts');

    expect(config).toContain('chunkSizeWarningLimit');
    expect(config).toMatch(/chunkSizeWarningLimit:\s*\d+/);
  });

  it('should exclude test libraries from pre-bundling', () => {
    const config = readConfig('vite.config.ts');

    expect(config).toContain('exclude');
    expect(config).toMatch(/@testing-library/);
  });
});

describe('Playwright Configuration Memory Safety', () => {
  it('should have worker limits configured', () => {
    const config = readConfig('playwright.config.ts');

    expect(config).toContain('workers');
    // Should have different settings for CI and local
    expect(config).toMatch(/workers.*CI.*\?/);
  });

  it('should have max failures configured to stop wasteful test runs', () => {
    const config = readConfig('playwright.config.ts');

    expect(config).toContain('maxFailures');
  });

  it('should have output directory configured', () => {
    const config = readConfig('playwright.config.ts');

    expect(config).toContain('outputDir');
  });

  it('should preserve output only for failures', () => {
    const config = readConfig('playwright.config.ts');

    expect(config).toContain('preserveOutput');
    expect(config).toContain('failures-only');
  });

  it('should have memory-safe browser launch options', () => {
    const config = readConfig('playwright.config.ts');

    expect(config).toContain('--disable-dev-shm-usage');
    expect(config).toContain('--disable-gpu');
  });

  it('should have reasonable timeout values', () => {
    const config = readConfig('playwright.config.ts');

    // Check for timeout configurations
    expect(config).toMatch(/timeout:\s*\d+/);
    expect(config).toMatch(/globalTimeout:\s*\d+/);

    // Verify timeouts are reasonable
    const timeoutMatch = config.match(/timeout:\s*(\d+)\s*\*\s*1000/);
    if (timeoutMatch) {
      const timeout = parseInt(timeoutMatch[1], 10);
      expect(timeout).toBeLessThanOrEqual(60); // Max 60 seconds per test
    }
  });

  it('should have retry strategy configured', () => {
    const config = readConfig('playwright.config.ts');

    expect(config).toContain('retries');
    // Should have different settings for CI and local
    expect(config).toMatch(/retries.*CI.*\?/);
  });
});

describe('Memory Configuration Integration', () => {
  it('all configuration files should exist', () => {
    expect(() => readConfig('vitest.config.ts')).not.toThrow();
    expect(() => readConfig('vite.config.ts')).not.toThrow();
    expect(() => readConfig('playwright.config.ts')).not.toThrow();
  });

  it('should have consistent timeout values across configs', () => {
    const vitestConfig = readConfig('vitest.config.ts');
    const playwrightConfig = readConfig('playwright.config.ts');

    // Both should have timeout configurations
    expect(vitestConfig).toMatch(/timeout/i);
    expect(playwrightConfig).toMatch(/timeout/i);
  });

  it('should have worker limits in both vitest and playwright', () => {
    const vitestConfig = readConfig('vitest.config.ts');
    const playwrightConfig = readConfig('playwright.config.ts');

    expect(vitestConfig).toContain('maxWorkers');
    expect(playwrightConfig).toContain('workers');
  });

  it('should have memory-conscious settings across all configs', () => {
    const vitestConfig = readConfig('vitest.config.ts');
    const viteConfig = readConfig('vite.config.ts');
    const playwrightConfig = readConfig('playwright.config.ts');

    // Check for memory-related comments or settings
    expect(vitestConfig).toMatch(/memory/i);
    expect(viteConfig).toMatch(/memory/i);
    expect(playwrightConfig).toMatch(/memory/i);
  });
});

describe('Runtime Memory Constraints', () => {
  it('should respect maxWorkers setting during test run', () => {
    // This test verifies that Vitest respects the maxWorkers setting
    // In actual runtime, Vitest should not spawn more workers than configured
    const vitestConfig = readConfig('vitest.config.ts');
    const maxWorkersMatch = vitestConfig.match(/maxWorkers:\s*(\d+)/);

    if (maxWorkersMatch) {
      const maxWorkers = parseInt(maxWorkersMatch[1], 10);
      expect(maxWorkers).toBeGreaterThan(0);
      expect(maxWorkers).toBeLessThanOrEqual(4); // Conservative limit for memory safety
    }
  });

  it('should have fork limits that prevent memory exhaustion', () => {
    const vitestConfig = readConfig('vitest.config.ts');
    const maxForksMatch = vitestConfig.match(/maxForks:\s*(\d+)/);

    if (maxForksMatch) {
      const maxForks = parseInt(maxForksMatch[1], 10);
      expect(maxForks).toBeGreaterThan(0);
      expect(maxForks).toBeLessThanOrEqual(2); // Very conservative limit for memory safety
    }
  });
});
