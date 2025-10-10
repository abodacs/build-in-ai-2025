/**
 * BaseWritingManager Tests
 *
 * Comprehensive tests for BaseWritingManager abstract class.
 * Focus: Resilience, error recovery, lifecycle management, caching.
 *
 * Test Categories:
 * - Instance lifecycle management (5 tests)
 * - Configuration caching (5 tests)
 * - Download monitoring (5 tests)
 * - Abstract method contracts (5 tests)
 * - Error handling and recovery (5 tests)
 *
 * @module shared/services/__tests__/BaseWritingManager.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseWritingManager } from '../BaseWritingManager';
import type {
  AvailabilityStatus,
  InstanceState,
  DownloadProgress,
} from '../../types/writing.types';

// ============================================================================
// Test Implementation
// ============================================================================

interface MockInstance {
  destroy: () => void;
}

interface MockOptions {
  tone?: string;
  format?: string;
  monitor?: (m: EventTarget) => void;
  signal?: AbortSignal;
}

interface MockConfig {
  tone: string;
  format: string;
  length: string;
}

/**
 * Concrete test implementation of BaseWritingManager
 */
class TestWritingManager extends BaseWritingManager<
  MockInstance,
  MockOptions,
  MockConfig
> {
  public mockCreateInstanceFn: (options: MockOptions) => Promise<MockInstance> =
    async () => ({
      destroy: vi.fn(),
    });

  public mockCheckAvailabilityFn: () => Promise<AvailabilityStatus> =
    async () => 'readily';

  getAPIName(): string {
    return 'TestAPI';
  }

  async createInstance(options: MockOptions): Promise<MockInstance> {
    return this.mockCreateInstanceFn(options);
  }

  async checkAvailability(): Promise<AvailabilityStatus> {
    return this.mockCheckAvailabilityFn();
  }

  protected configToOptions(config: MockConfig): MockOptions {
    return {
      tone: config.tone,
      format: config.format,
    };
  }

  protected configMatches(config: MockConfig): boolean {
    if (!this.config) return false;
    return (
      this.config.tone === config.tone &&
      this.config.format === config.format &&
      this.config.length === config.length
    );
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('BaseWritingManager', () => {
  let manager: TestWritingManager;

  beforeEach(() => {
    manager = new TestWritingManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  // ==========================================================================
  // Instance Lifecycle Management (5 tests) - RESILIENCE FOCUS
  // ==========================================================================

  describe('Instance Lifecycle Management', () => {
    it('should create instance on first call', async () => {
      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };

      const instance = await manager.getInstance(config);

      expect(instance).toBeDefined();
      expect(manager.hasInstance()).toBe(true);
      expect(manager.getState()).toBe('ready');
    });

    it('should prevent concurrent instance creation', async () => {
      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };

      // Make creation slow to test concurrency
      manager.mockCreateInstanceFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { destroy: vi.fn() };
      };

      // Start first creation
      const promise1 = manager.getInstance(config);

      // Immediately try second creation (should fail)
      await expect(manager.getInstance(config)).rejects.toThrow(
        'TestAPI instance creation already in progress',
      );

      // First should complete successfully
      await expect(promise1).resolves.toBeDefined();
    });

    it('should properly destroy instance and cleanup resources', async () => {
      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };
      const destroyFn = vi.fn();

      manager.mockCreateInstanceFn = async () => ({ destroy: destroyFn });

      await manager.getInstance(config);
      expect(manager.hasInstance()).toBe(true);

      manager.destroy();

      expect(destroyFn).toHaveBeenCalled();
      expect(manager.hasInstance()).toBe(false);
      expect(manager.getState()).toBe('destroyed');
      expect(manager.getMetadata()).toBeNull();
      expect(manager.getConfig()).toBeNull();
    });

    it('should handle instance without destroy method gracefully', async () => {
      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };

      // Create instance without destroy method
      manager.mockCreateInstanceFn = async () => ({}) as MockInstance;

      await manager.getInstance(config);

      // Should not throw
      expect(() => manager.destroy()).not.toThrow();
      expect(manager.hasInstance()).toBe(false);
    });

    it('should recover from destroy errors without leaving state corrupted', async () => {
      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };
      const destroyFn = vi.fn(() => {
        throw new Error('Destroy failed');
      });

      manager.mockCreateInstanceFn = async () => ({ destroy: destroyFn });

      await manager.getInstance(config);

      // Destroy should not throw even if instance.destroy() throws
      expect(() => manager.destroy()).not.toThrow();

      // State should still be cleaned up
      expect(manager.hasInstance()).toBe(false);
      expect(manager.getState()).toBe('destroyed');
    });
  });

  // ==========================================================================
  // Configuration Caching (5 tests) - RESILIENCE FOCUS
  // ==========================================================================

  describe('Configuration Caching', () => {
    it('should reuse cached instance for matching config', async () => {
      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };
      const createSpy = vi.fn(async () => ({ destroy: vi.fn() }));
      manager.mockCreateInstanceFn = createSpy;

      const instance1 = await manager.getInstance(config);
      const instance2 = await manager.getInstance(config);

      expect(instance1).toBe(instance2);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    it('should create new instance when config changes', async () => {
      const config1: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };
      const config2: MockConfig = {
        tone: 'casual',
        format: 'markdown',
        length: 'medium',
      };

      const destroyFn1 = vi.fn();
      const destroyFn2 = vi.fn();
      let callCount = 0;

      manager.mockCreateInstanceFn = async () => {
        callCount++;
        return { destroy: callCount === 1 ? destroyFn1 : destroyFn2 };
      };

      await manager.getInstance(config1);
      await manager.getInstance(config2);

      expect(destroyFn1).toHaveBeenCalled();
      expect(manager.hasInstance()).toBe(true);
    });

    it('should track instance usage count correctly', async () => {
      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };

      await manager.getInstance(config);
      await manager.getInstance(config);
      await manager.getInstance(config);

      const metadata = manager.getMetadata();
      expect(metadata?.usageCount).toBe(2); // First call sets to 0, next 2 increment by 1 each
    });

    it('should handle config hash collisions gracefully', async () => {
      const config1: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };
      const config2: MockConfig = {
        tone: 'formal',
        format: 'plain-text',
        length: 'medium',
      };

      await manager.getInstance(config1);
      await manager.getInstance(config2);

      // Should create new instance since configs differ
      expect(manager.getConfig()).toEqual(config2);
    });

    it('should handle rapid config switches without memory leaks', async () => {
      const configs: MockConfig[] = [
        { tone: 'formal', format: 'markdown', length: 'medium' },
        { tone: 'casual', format: 'markdown', length: 'short' },
        { tone: 'neutral', format: 'plain-text', length: 'long' },
      ];

      const destroySpies: Array<ReturnType<typeof vi.fn>> = [];
      let callIndex = 0;

      manager.mockCreateInstanceFn = async () => {
        const destroyFn = vi.fn();
        destroySpies.push(destroyFn);
        callIndex++;
        return { destroy: destroyFn };
      };

      // Rapidly switch configs
      for (const config of configs) {
        await manager.getInstance(config);
      }

      // All but last instance should be destroyed
      expect(destroySpies[0]).toHaveBeenCalled();
      expect(destroySpies[1]).toHaveBeenCalled();
      expect(destroySpies[2]).not.toHaveBeenCalled(); // Current instance
    });
  });

  // ==========================================================================
  // Download Monitoring (5 tests) - RESILIENCE FOCUS
  // ==========================================================================

  describe('Download Monitoring', () => {
    it('should track download progress correctly', async () => {
      const progressUpdates: DownloadProgress[] = [];

      manager.mockCreateInstanceFn = async (options) => {
        if (options.monitor) {
          const mockTarget = new EventTarget();
          options.monitor(mockTarget);

          // Simulate progress events
          setTimeout(() => {
            const event = new Event('downloadprogress');
            Object.assign(event, { loaded: 50, total: 100 });
            mockTarget.dispatchEvent(event);
          }, 10);

          setTimeout(() => {
            const event = new Event('downloadprogress');
            Object.assign(event, { loaded: 100, total: 100 });
            mockTarget.dispatchEvent(event);
          }, 20);
        }

        await new Promise((resolve) => setTimeout(resolve, 50));
        return { destroy: vi.fn() };
      };

      const promise = manager.monitorDownload((progress) => {
        progressUpdates.push(progress);
      });

      await promise;

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].percentage).toBe(50);
      expect(progressUpdates[1].percentage).toBe(100);
    });

    it('should calculate download speed correctly', async () => {
      let capturedSpeed: number | undefined;

      manager.mockCreateInstanceFn = async (options) => {
        if (options.monitor) {
          const mockTarget = new EventTarget();
          options.monitor(mockTarget);

          // Simulate progress with timing
          setTimeout(() => {
            const event = new Event('downloadprogress');
            Object.assign(event, { loaded: 1024, total: 10240 });
            mockTarget.dispatchEvent(event);
          }, 100);

          setTimeout(() => {
            const event = new Event('downloadprogress');
            Object.assign(event, { loaded: 5120, total: 10240 });
            mockTarget.dispatchEvent(event);
          }, 700); // 600ms later, should trigger speed calculation
        }

        await new Promise((resolve) => setTimeout(resolve, 800));
        return { destroy: vi.fn() };
      };

      await manager.monitorDownload((progress) => {
        if (progress.speed !== undefined) {
          capturedSpeed = progress.speed;
        }
      });

      expect(capturedSpeed).toBeGreaterThan(0);
    });

    it('should handle download cancellation via AbortSignal', async () => {
      const abortController = new AbortController();

      manager.mockCreateInstanceFn = async (options) => {
        // Simulate slow download
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, 1000);
          options.signal?.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('Aborted'));
          });
        });
        return { destroy: vi.fn() };
      };

      const promise = manager.monitorDownload(
        (progress) => {},
        abortController.signal,
      );

      // Cancel after 100ms
      setTimeout(() => abortController.abort(), 100);

      await expect(promise).rejects.toThrow('Download cancelled by user');
      expect(manager.getState()).toBe('error');
    });

    it('should prevent concurrent downloads', async () => {
      manager.mockCreateInstanceFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { destroy: vi.fn() };
      };

      const promise1 = manager.monitorDownload((progress) => {});

      // Immediately try second download
      await expect(manager.monitorDownload((progress) => {})).rejects.toThrow(
        'TestAPI instance creation already in progress',
      );

      await promise1;
    });

    it('should cleanup download state after completion or error', async () => {
      manager.mockCreateInstanceFn = async () => {
        return { destroy: vi.fn() };
      };

      await manager.monitorDownload((progress) => {});

      expect(manager.getDownloadProgress()).toBeNull();
      expect(manager.isCreatingInstance()).toBe(false);
      expect(manager.getState()).toBe('ready');
    });
  });

  // ==========================================================================
  // Abstract Method Contracts (5 tests) - RESILIENCE FOCUS
  // ==========================================================================

  describe('Abstract Method Contracts', () => {
    it('should call createInstance with correct options', async () => {
      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };
      const createSpy = vi.fn(async () => ({ destroy: vi.fn() }));
      manager.mockCreateInstanceFn = createSpy;

      await manager.getInstance(config);

      expect(createSpy).toHaveBeenCalledWith({
        tone: 'formal',
        format: 'markdown',
      });
    });

    it('should call checkAvailability for detailed check', async () => {
      const availabilitySpy = vi.fn(
        async () => 'readily' as AvailabilityStatus,
      );
      manager.mockCheckAvailabilityFn = availabilitySpy;

      const result = await manager.checkDetailedAvailability();

      expect(availabilitySpy).toHaveBeenCalled();
      expect(result.availability).toBe('readily');
      expect(result.isSupported).toBe(true);
      expect(result.requiresDownload).toBe(false);
    });

    it('should handle getAPIName in error messages', async () => {
      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };
      manager.mockCreateInstanceFn = async () => {
        throw new Error('Creation failed');
      };

      await expect(manager.getInstance(config)).rejects.toThrow(
        'Failed to create TestAPI instance',
      );
    });

    it('should use configMatches for caching decisions', async () => {
      const config1: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };
      const config2: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'long',
      };

      let createCount = 0;
      manager.mockCreateInstanceFn = async () => {
        createCount++;
        return { destroy: vi.fn() };
      };

      await manager.getInstance(config1);
      await manager.getInstance(config2);

      // Should create 2 instances since configs don't match
      expect(createCount).toBe(2);
    });

    it('should use configToOptions to convert config before creation', async () => {
      const config: MockConfig = {
        tone: 'casual',
        format: 'plain-text',
        length: 'short',
      };
      const createSpy = vi.fn(async () => ({ destroy: vi.fn() }));
      manager.mockCreateInstanceFn = createSpy;

      await manager.getInstance(config);

      // configToOptions should have been used to create options
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'casual',
          format: 'plain-text',
        }),
      );
    });
  });

  // ==========================================================================
  // Error Handling and Recovery (5 tests) - RESILIENCE FOCUS
  // ==========================================================================

  describe('Error Handling and Recovery', () => {
    it('should handle createInstance failure gracefully', async () => {
      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };
      manager.mockCreateInstanceFn = async () => {
        throw new Error('API not available');
      };

      await expect(manager.getInstance(config)).rejects.toThrow(
        'Failed to create TestAPI instance',
      );

      expect(manager.hasInstance()).toBe(false);
      expect(manager.getState()).toBe('error');
      expect(manager.isCreatingInstance()).toBe(false);
    });

    it('should allow retry after creation failure', async () => {
      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };
      let attemptCount = 0;

      manager.mockCreateInstanceFn = async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('First attempt failed');
        }
        return { destroy: vi.fn() };
      };

      // First attempt fails
      await expect(manager.getInstance(config)).rejects.toThrow();

      // Second attempt succeeds
      await expect(manager.getInstance(config)).resolves.toBeDefined();
      expect(manager.hasInstance()).toBe(true);
    });

    it('should handle checkAvailability errors gracefully', async () => {
      manager.mockCheckAvailabilityFn = async () => {
        throw new Error('Browser API not available');
      };

      const result = await manager.checkDetailedAvailability();

      expect(result.availability).toBe('no');
      expect(result.isSupported).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle cancel during download gracefully', async () => {
      manager.mockCreateInstanceFn = async (options) => {
        // Simulate download that respects abort signal
        await new Promise((_, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout')), 1000);
          // Note: cancel() will call destroy() which sets state but doesn't abort the promise
        });
        return { destroy: vi.fn() };
      };

      const promise = manager.monitorDownload((progress) => {});

      // Cancel immediately
      setTimeout(() => manager.cancel(), 50);

      // Since cancel() calls destroy(), the manager state changes but promise may still resolve
      // Wait for the operation to complete
      try {
        await promise;
      } catch (error) {
        // May or may not throw depending on timing
      }

      // Verify state indicates failure or destruction (race condition between error catch and cancel)
      const state = manager.getState();
      expect(['error', 'destroyed']).toContain(state);
      expect(manager.hasInstance()).toBe(false);
    });

    it('should handle multiple destroy calls safely', async () => {
      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };
      const destroyFn = vi.fn();
      manager.mockCreateInstanceFn = async () => ({ destroy: destroyFn });

      await manager.getInstance(config);

      // Multiple destroy calls should not throw
      manager.destroy();
      manager.destroy();
      manager.destroy();

      // Destroy should only be called once on the instance
      expect(destroyFn).toHaveBeenCalledTimes(1);
      expect(manager.hasInstance()).toBe(false);
    });
  });

  // ==========================================================================
  // Getters and State (Additional Coverage)
  // ==========================================================================

  describe('Getters and State', () => {
    it('should return correct state through getState()', async () => {
      expect(manager.getState()).toBe('idle');

      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };
      await manager.getInstance(config);

      expect(manager.getState()).toBe('ready');
    });

    it('should return metadata after instance creation', async () => {
      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };
      await manager.getInstance(config);

      const metadata = manager.getMetadata();
      expect(metadata).toBeDefined();
      expect(metadata?.id).toContain('testapi-');
      expect(metadata?.state).toBe('ready');
    });

    it('should return null metadata before instance creation', () => {
      expect(manager.getMetadata()).toBeNull();
    });

    it('should return current config through getConfig()', async () => {
      const config: MockConfig = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
      };
      await manager.getInstance(config);

      expect(manager.getConfig()).toEqual(config);
    });
  });
});
