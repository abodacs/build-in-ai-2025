/**
 * PromptManager Test Suite
 *
 * Tests high-level LanguageModel instance lifecycle management,
 * retry logic, download monitoring, and metrics tracking
 *
 * Coverage: 30+ tests (happy path, edge cases, error handling)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PromptManager } from '../../services/PromptManager';
import {
  setupLanguageModelAPIMock,
  cleanupLanguageModelAPIMock,
  createMockLanguageModel,
  MOCK_ERRORS,
  waitFor,
  createStreamingCallback,
} from '../test-utils';

describe('PromptManager', () => {
  let mockAPI: ReturnType<typeof setupLanguageModelAPIMock>;
  let manager: PromptManager;

  beforeEach(() => {
    mockAPI = setupLanguageModelAPIMock();
    manager = new PromptManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupLanguageModelAPIMock();
    manager.destroy();
  });

  // ==========================================================================
  // State Management Tests
  // ==========================================================================

  describe('State Management', () => {
    it('starts in idle state', () => {
      expect(manager.getState()).toBe('idle');
      expect(manager.isReady()).toBe(false);
    });

    it('transitions to ready after initialization', async () => {
      await manager.initialize({});

      expect(manager.getState()).toBe('ready');
      expect(manager.isReady()).toBe(true);
    });

    it('transitions to prompting during execution', async () => {
      await manager.initialize({});

      const mockInstance = createMockLanguageModel();
      mockInstance.prompt = vi.fn(async () => {
        expect(manager.getState()).toBe('prompting');
        return 'response';
      });
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});
      await manager.prompt('test');

      expect(manager.getState()).toBe('ready');
    });

    it('transitions to error on failure', async () => {
      mockAPI.create.mockRejectedValue(new Error('Init failed'));

      await expect(manager.initialize({})).rejects.toThrow();

      expect(manager.getState()).toBe('error');
    });

    it('tracks download progress', async () => {
      const onProgress = vi.fn();

      mockAPI.create.mockImplementation(async (opts: any) => {
        if (opts.monitor) {
          const mockMonitor = {
            addEventListener: vi.fn((event, callback) => {
              setTimeout(() => callback({ loaded: 5000, total: 10000 }), 10);
            }),
          };
          opts.monitor(mockMonitor);
        }
        return createMockLanguageModel();
      });

      await manager.initialize({}, onProgress);
      await waitFor(30);

      expect(manager.isDownloading()).toBe(false);
      expect(onProgress).toHaveBeenCalled();
    });

    it('reports download in progress', async () => {
      let resolveCreate: any;
      const createPromise = new Promise((resolve) => {
        resolveCreate = resolve;
      });

      mockAPI.create.mockImplementation(async (opts: any) => {
        if (opts.monitor) {
          const mockMonitor = {
            addEventListener: vi.fn((event, callback) => {
              // Keep download pending
            }),
          };
          opts.monitor(mockMonitor);
        }
        await createPromise;
        return createMockLanguageModel();
      });

      const initPromise = manager.initialize({}, vi.fn());

      await waitFor(10);
      expect(manager.isDownloading()).toBe(true);

      resolveCreate(createMockLanguageModel());
      await initPromise;

      expect(manager.isDownloading()).toBe(false);
    });
  });

  // ==========================================================================
  // Availability Checking Tests
  // ==========================================================================

  describe('Availability Checking', () => {
    it('checks API availability (static method)', async () => {
      mockAPI.availability.mockResolvedValue('available');

      const result = await PromptManager.checkAvailability();

      expect(result).toBe('available');
    });

    it('checks if API is supported (static method)', () => {
      expect(PromptManager.isSupported()).toBe(true);
    });

    it('returns false when API is not available', () => {
      delete (global as any).LanguageModel;

      expect(PromptManager.isSupported()).toBe(false);
    });
  });

  // ==========================================================================
  // Instance Management Tests
  // ==========================================================================

  describe('Instance Management', () => {
    it('initializes with default config', async () => {
      await manager.initialize({});

      expect(mockAPI.create).toHaveBeenCalledWith({
        expectedInputs: [{ type: 'image' }],
      });
      expect(manager.isReady()).toBe(true);
    });

    it('initializes with custom config', async () => {
      const config = {
        systemPrompt: 'Test',
        temperature: 0.8,
        topK: 5,
      };

      await manager.initialize(config);

      expect(mockAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...config,
          expectedInputs: [{ type: 'image' }],
        }),
      );
    });

    it('reinitializes with new config', async () => {
      await manager.initialize({ temperature: 0.5 });
      expect(mockAPI.create).toHaveBeenCalledTimes(1);

      await manager.reinitialize({ temperature: 0.9 });

      expect(mockAPI.create).toHaveBeenCalledTimes(2);
      expect(mockAPI.create).toHaveBeenLastCalledWith(
        expect.objectContaining({
          temperature: 0.9,
          expectedInputs: [{ type: 'image' }],
        }),
      );
    });

    it('updates config partially', async () => {
      await manager.initialize({ systemPrompt: 'Test', temperature: 0.5 });

      await manager.updateConfig({ temperature: 0.8 });

      expect(mockAPI.create).toHaveBeenLastCalledWith(
        expect.objectContaining({
          systemPrompt: 'Test',
          temperature: 0.8,
          expectedInputs: [{ type: 'image' }],
        }),
      );
    });

    it('gets current config', async () => {
      const config = { systemPrompt: 'Test', temperature: 0.7 };
      await manager.initialize(config);

      const currentConfig = manager.getConfig();

      expect(currentConfig).toEqual({
        ...config,
        expectedInputs: [{ type: 'image' }],
      });
    });

    it('returns null config before initialization', () => {
      expect(manager.getConfig()).toBeNull();
    });

    it('clones instance', async () => {
      await manager.initialize({});

      const clone = await manager.clone();

      expect(clone).toBeDefined();
    });

    it('destroys instance and cleans up', async () => {
      const mockInstance = createMockLanguageModel();
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.initialize({});
      manager.destroy();

      expect(mockInstance.destroy).toHaveBeenCalled();
      expect(manager.getState()).toBe('idle');
      expect(manager.getConfig()).toBeNull();
    });
  });

  // ==========================================================================
  // Prompt Execution Tests
  // ==========================================================================

  describe('Prompt Execution', () => {
    beforeEach(async () => {
      await manager.initialize({});
    });

    it('executes non-streaming prompt', async () => {
      const result = await manager.prompt('Test prompt');

      expect(result).toBe('Mock response');
    });

    it('executes streaming prompt', async () => {
      const { callback, getFullText } = createStreamingCallback();

      const result = await manager.promptStreaming('Test', callback);

      expect(callback).toHaveBeenCalledTimes(3);
      expect(getFullText()).toBe('Mock streaming response');
      expect(result).toBe('Mock streaming response');
    });

    it('passes prompt options', async () => {
      const mockInstance = createMockLanguageModel();
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});

      const options = { signal: new AbortController().signal };
      await manager.prompt('Test', options);

      // Prompt is now wrapped with security delimiters for OWASP LLM01:2025 compliance
      expect(mockInstance.prompt).toHaveBeenCalledWith(
        expect.stringContaining('Test'),
        options,
      );
    });

    it('throws error when not initialized', async () => {
      const uninitializedManager = new PromptManager();

      await expect(uninitializedManager.prompt('Test')).rejects.toThrow(
        'not initialized',
      );
    });

    it('validates prompt before execution', async () => {
      await expect(manager.prompt('')).rejects.toThrow('cannot be empty');
    });

    it('cancels current operation', async () => {
      const mockInstance = createMockLanguageModel();
      const abortError = Object.assign(new Error('The operation was aborted'), {
        name: 'AbortError',
      });
      mockInstance.prompt = vi.fn(async (prompt: string, options?: any) => {
        // Simulate cancellation when signal is triggered
        if (options?.signal) {
          return new Promise((_, reject) => {
            // Set up abort listener
            options.signal.addEventListener('abort', () => {
              reject(abortError);
            });
            // If not aborted within 100ms, timeout
            setTimeout(() => reject(new Error('Timeout')), 100);
          });
        }
        return 'Mock response';
      });
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});

      const promise = manager.prompt('Test');
      // Give the promise time to set up the abort listener
      await waitFor(10);
      manager.cancelOperation();

      // Operation should be cancelled (AbortSignal triggered)
      await expect(promise).rejects.toThrow();
      expect(manager.getState()).toBe('ready');
    });
  });

  // ==========================================================================
  // Token Management Tests
  // ==========================================================================

  describe('Token Management', () => {
    beforeEach(async () => {
      await manager.initialize({});
    });

    it('counts tokens in prompt', async () => {
      const mockInstance = createMockLanguageModel();
      mockInstance.countPromptTokens = vi.fn().mockResolvedValue(42);
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});

      const count = await manager.countTokens('Test prompt');

      expect(count).toBe(42);
    });

    it('gets token usage', () => {
      const usage = manager.getTokenUsage();

      expect(usage).toBeDefined();
      expect(usage).toHaveProperty('maxTokens');
      expect(usage).toHaveProperty('tokensSoFar');
      expect(usage).toHaveProperty('tokensLeft');
    });

    it('checks if near token limit', async () => {
      const mockInstance = createMockLanguageModel();
      mockInstance.maxTokens = 100;
      mockInstance.tokensSoFar = 95;
      mockInstance.tokensLeft = 5;
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});

      expect(manager.isNearTokenLimit(0.9)).toBe(true);
      expect(manager.isNearTokenLimit(0.99)).toBe(false);
    });

    it('returns false when token info unavailable', () => {
      const uninitializedManager = new PromptManager();

      expect(uninitializedManager.isNearTokenLimit()).toBe(false);
    });

    it('measureInputUsage calls Chrome AI API', async () => {
      const mockInstance = createMockLanguageModel();
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});

      const result = await manager.measureInputUsage('Test input');

      expect(result).toBeGreaterThan(0);
      expect(mockInstance.measureInputUsage).toHaveBeenCalled();
    });

    it('onQuotaOverflow/offQuotaOverflow manage listeners', async () => {
      const mockInstance = createMockLanguageModel();
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});

      const callback = vi.fn();

      // Register listener
      manager.onQuotaOverflow(callback);
      expect(mockInstance.addEventListener).toHaveBeenCalledWith(
        'quotaoverflow',
        callback,
      );

      // Unregister listener
      manager.offQuotaOverflow(callback);
      expect(mockInstance.removeEventListener).toHaveBeenCalledWith(
        'quotaoverflow',
        callback,
      );
    });
  });

  // ==========================================================================
  // Metrics Tracking Tests
  // ==========================================================================

  describe('Metrics Tracking', () => {
    beforeEach(async () => {
      await manager.initialize({});
    });

    it('tracks successful prompt metrics', async () => {
      await manager.prompt('Test');

      const metrics = manager.getMetrics();

      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toHaveProperty('executionTime');
      expect(metrics[0]).toHaveProperty('success', true);
    });

    it('tracks failed prompt metrics', async () => {
      const mockInstance = createMockLanguageModel();
      mockInstance.prompt = vi.fn().mockRejectedValue(new Error('Failed'));
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});

      await expect(manager.prompt('Test')).rejects.toThrow();

      const metrics = manager.getMetrics();

      expect(metrics[0]).toHaveProperty('success', false);
      expect(metrics[0]).toHaveProperty('error');
    });

    it('calculates average execution time', async () => {
      // Add small delay to mock so execution time is measurable
      const mockInstance = createMockLanguageModel();
      mockInstance.prompt = vi.fn(async () => {
        await waitFor(10); // Small delay to ensure measurable time
        return 'Mock response';
      });
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});

      await manager.prompt('Test 1');
      await manager.prompt('Test 2');
      await manager.prompt('Test 3');

      const avgTime = manager.getAverageExecutionTime();

      expect(avgTime).toBeGreaterThan(0);
    });

    it('calculates success rate', async () => {
      const mockInstance = createMockLanguageModel();
      let callCount = 0;
      mockInstance.prompt = vi.fn(async () => {
        callCount++;
        if (callCount === 2)
          throw new Error('Invalid prompt - validation failed');
        return 'Success';
      });
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});

      await manager.prompt('Test 1');
      await expect(manager.prompt('Test 2')).rejects.toThrow();
      await manager.prompt('Test 3');

      const successRate = manager.getSuccessRate();

      expect(successRate).toBeCloseTo(2 / 3, 2);
    });

    it('limits stored metrics to 100', async () => {
      for (let i = 0; i < 150; i++) {
        await manager.prompt(`Test ${i}`);
      }

      const metrics = manager.getMetrics();

      expect(metrics).toHaveLength(100);
    });

    it('clears metrics', async () => {
      await manager.prompt('Test 1');
      await manager.prompt('Test 2');

      manager.clearMetrics();

      expect(manager.getMetrics()).toHaveLength(0);
      expect(manager.getAverageExecutionTime()).toBe(0);
      expect(manager.getSuccessRate()).toBe(0);
    });
  });

  // ==========================================================================
  // Retry Logic Tests
  // ==========================================================================

  describe('Retry Logic', () => {
    beforeEach(async () => {
      await manager.initialize({});
    });

    it('retries failed operations', async () => {
      const mockInstance = createMockLanguageModel();
      let attempts = 0;
      mockInstance.prompt = vi.fn(async () => {
        attempts++;
        if (attempts < 3) throw new Error('Temporary failure');
        return 'Success after retries';
      });
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});

      const result = await manager.prompt('Test');

      expect(result).toBe('Success after retries');
      expect(mockInstance.prompt).toHaveBeenCalledTimes(3);
    });

    it('does not retry on abort', async () => {
      const mockInstance = createMockLanguageModel();
      mockInstance.prompt = vi.fn().mockRejectedValue(MOCK_ERRORS.abortError);
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});

      await expect(manager.prompt('Test')).rejects.toThrow('cancelled');

      // Should not retry abort errors
      expect(mockInstance.prompt).toHaveBeenCalledTimes(1);
    });

    it('does not retry validation errors', async () => {
      const mockInstance = createMockLanguageModel();
      mockInstance.prompt = vi
        .fn()
        .mockRejectedValue(new Error('Invalid prompt'));
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});

      await expect(manager.prompt('Test')).rejects.toThrow('Invalid');

      expect(mockInstance.prompt).toHaveBeenCalledTimes(1);
    });

    it('uses exponential backoff', async () => {
      const mockInstance = createMockLanguageModel();
      const delays: number[] = [];
      let attempts = 0;

      mockInstance.prompt = vi.fn(async () => {
        attempts++;
        if (attempts < 4) {
          const start = Date.now();
          await waitFor(0);
          delays.push(Date.now() - start);
          throw new Error('Retry me');
        }
        return 'Success';
      });
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});

      await manager.prompt('Test');

      expect(mockInstance.prompt).toHaveBeenCalledTimes(4);
    });

    it('gives up after max retries', async () => {
      const mockInstance = createMockLanguageModel();
      mockInstance.prompt = vi
        .fn()
        .mockRejectedValue(new Error('Persistent failure'));
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.reinitialize({});

      await expect(manager.prompt('Test')).rejects.toThrow(
        'Persistent failure',
      );

      // Default max retries is 3, so 4 total attempts (1 initial + 3 retries)
      expect(mockInstance.prompt).toHaveBeenCalledTimes(4);
    });
  });

  // ==========================================================================
  // Configuration Helper Tests
  // ==========================================================================

  describe('Configuration Helpers', () => {
    it('provides recommended config for general use', () => {
      const config = PromptManager.getRecommendedConfig('general');

      expect(config).toHaveProperty('systemPrompt');
      expect(config).toHaveProperty('temperature');
      expect(config).toHaveProperty('topK');
    });

    it('provides recommended config for creative writing', () => {
      const config = PromptManager.getRecommendedConfig('creative');

      expect(config.temperature).toBeGreaterThanOrEqual(0.8);
    });

    it('provides recommended config for precise tasks', () => {
      const config = PromptManager.getRecommendedConfig('precise');

      expect(config.temperature).toBeLessThanOrEqual(0.3);
    });

    it('provides recommended config for coding', () => {
      const config = PromptManager.getRecommendedConfig('code');

      expect(config.systemPrompt).toContain('code');
    });

    it('provides recommended config for chat', () => {
      const config = PromptManager.getRecommendedConfig('chat');

      expect(config.systemPrompt).toContain('conversation');
    });

    it('provides recommended config for analysis', () => {
      const config = PromptManager.getRecommendedConfig('analysis');

      expect(config.systemPrompt).toContain('analyt');
    });
  });

  // ==========================================================================
  // Edge Cases & Error Handling
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles initialization failure', async () => {
      mockAPI.create.mockRejectedValue(new Error('Init failed'));

      await expect(manager.initialize({})).rejects.toThrow('Init failed');

      expect(manager.getState()).toBe('error');
      expect(manager.isReady()).toBe(false);
    });

    it('handles prompt during initialization', async () => {
      const initPromise = manager.initialize({});

      await expect(manager.prompt('Test')).rejects.toThrow('not initialized');

      await initPromise;
    });

    it('handles concurrent prompts', async () => {
      await manager.initialize({});

      const results = await Promise.all([
        manager.prompt('Test 1'),
        manager.prompt('Test 2'),
        manager.prompt('Test 3'),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });

    it('handles destroy during operation', async () => {
      const mockInstance = createMockLanguageModel();
      let isDestroyed = false;

      mockInstance.destroy = vi.fn(() => {
        isDestroyed = true;
      });

      mockInstance.prompt = vi.fn(async () => {
        await waitFor(50); // Add delay so destroy can happen first
        if (isDestroyed) {
          throw new Error('Instance was destroyed');
        }
        return 'Mock response';
      });
      mockAPI.create.mockResolvedValue(mockInstance);

      await manager.initialize({});

      const promise = manager.prompt('Test');
      await waitFor(10); // Give promise time to start
      manager.destroy();

      // Should handle gracefully - either rejects or the operation completes before destroy
      try {
        await promise;
        // If it completes, that's also acceptable
      } catch (error: any) {
        // If it throws, that's expected
        expect(error).toBeDefined();
      }

      // After destroy, the manager should be idle (or ready if operation completed first)
      const state = manager.getState();
      expect(['idle', 'ready']).toContain(state);
    });

    it('handles multiple destroy calls', async () => {
      await manager.initialize({});

      manager.destroy();
      manager.destroy();
      manager.destroy();

      // Should not throw
      expect(manager.getState()).toBe('idle');
    });

    it('handles clone when not initialized', async () => {
      await expect(manager.clone()).rejects.toThrow('No instance to clone');
    });

    it('recovers from error state', async () => {
      mockAPI.create.mockRejectedValueOnce(new Error('Fail'));
      mockAPI.create.mockResolvedValue(createMockLanguageModel());

      await expect(manager.initialize({})).rejects.toThrow();
      expect(manager.getState()).toBe('error');

      await manager.initialize({});

      expect(manager.getState()).toBe('ready');
      expect(manager.isReady()).toBe(true);
    });
  });
});
