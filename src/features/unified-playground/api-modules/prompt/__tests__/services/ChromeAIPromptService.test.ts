/**
 * ChromeAIPromptService Test Suite
 *
 * Tests the low-level Chrome AI LanguageModel API wrapper
 *
 * Coverage: 25+ tests (happy path, edge cases, error handling)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChromeAIPromptService } from '../../services/ChromeAIPromptService';
import {
  setupLanguageModelAPIMock,
  cleanupLanguageModelAPIMock,
  createMockLanguageModel,
  MOCK_ERRORS,
  waitFor,
  createStreamingCallback,
} from '../test-utils';

describe('ChromeAIPromptService', () => {
  let mockAPI: ReturnType<typeof setupLanguageModelAPIMock>;

  beforeEach(() => {
    mockAPI = setupLanguageModelAPIMock();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupLanguageModelAPIMock();
  });

  // ==========================================================================
  // API Availability Tests
  // ==========================================================================

  describe('isSupported', () => {
    it('returns true when LanguageModel API is available', () => {
      expect(ChromeAIPromptService.isSupported()).toBe(true);
    });

    it('returns false when LanguageModel API is not available', () => {
      delete (global as any).LanguageModel;
      expect(ChromeAIPromptService.isSupported()).toBe(false);
    });
  });

  describe('checkAvailability', () => {
    it('returns readily when model is available', async () => {
      mockAPI.availability.mockResolvedValue('available');

      const result = await ChromeAIPromptService.checkAvailability();

      expect(result).toBe('available');
      expect(mockAPI.availability).toHaveBeenCalled();
    });

    it('returns after-download when model needs download', async () => {
      mockAPI.availability.mockResolvedValue('after-download');

      const result = await ChromeAIPromptService.checkAvailability();

      expect(result).toBe('after-download');
    });

    it('returns no when API is not supported', async () => {
      mockAPI.availability.mockResolvedValue('no');

      const result = await ChromeAIPromptService.checkAvailability();

      expect(result).toBe('no');
    });

    it('returns no when API is not available', async () => {
      delete (global as any).LanguageModel;

      const result = await ChromeAIPromptService.checkAvailability();

      expect(result).toBe('no');
    });
  });

  // ==========================================================================
  // Instance Creation Tests
  // ==========================================================================

  describe('createInstance', () => {
    it('creates instance with default options', async () => {
      const instance = await ChromeAIPromptService.createInstance();

      expect(instance).toBeDefined();
      expect(mockAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedInputs: [{ type: 'image' }],
          expectedOutputs: [{ type: 'text', languages: ['en'] }],
          temperature: 0.8,
          topK: 8,
        }),
      );
    });

    it('creates instance with custom system prompt', async () => {
      const options = { systemPrompt: 'You are a coding assistant' };

      await ChromeAIPromptService.createInstance(options);

      expect(mockAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: 'You are a coding assistant',
        }),
      );
    });

    it('creates instance with temperature', async () => {
      const options = { temperature: 0.9 };

      await ChromeAIPromptService.createInstance(options);

      expect(mockAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9,
        }),
      );
    });

    it('creates instance with topK', async () => {
      const options = { topK: 10 };

      await ChromeAIPromptService.createInstance(options);

      expect(mockAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          topK: 10,
        }),
      );
    });

    it('creates instance with all options', async () => {
      const options = {
        systemPrompt: 'Test',
        temperature: 0.8,
        topK: 5,
        maxTokens: 2048,
      };

      await ChromeAIPromptService.createInstance(options);

      expect(mockAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...options,
          expectedInputs: [{ type: 'image' }],
          expectedOutputs: [{ type: 'text', languages: ['en'] }],
        }),
      );
    });

    it('throws error when API is not supported', async () => {
      // Clean up all references to LanguageModel
      cleanupLanguageModelAPIMock();
      delete (global as any).LanguageModel;
      delete (window as any).LanguageModel;
      delete (globalThis as any).LanguageModel;

      await expect(ChromeAIPromptService.createInstance()).rejects.toThrow(
        /AI model download required|LanguageModel API is not supported/,
      );
    });
  });

  describe('createInstanceWithMonitoring', () => {
    it('creates instance with download progress callback', async () => {
      const onProgress = vi.fn();

      mockAPI.create.mockImplementation(async (opts: any) => {
        if (opts.monitor) {
          const mockMonitor = {
            addEventListener: vi.fn((event, callback) => {
              setTimeout(() => callback({ loaded: 5000, total: 10000 }), 10);
              setTimeout(() => callback({ loaded: 10000, total: 10000 }), 20);
            }),
          };
          opts.monitor(mockMonitor);
        }
        return createMockLanguageModel();
      });

      await ChromeAIPromptService.createInstanceWithMonitoring({}, onProgress);
      await waitFor(50);

      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(5000, 10000);
      expect(onProgress).toHaveBeenCalledWith(10000, 10000);
    });

    it('handles monitoring without callback', async () => {
      const instance = await ChromeAIPromptService.createInstanceWithMonitoring(
        {},
      );

      expect(instance).toBeDefined();
    });
  });

  // ==========================================================================
  // Validation Tests
  // ==========================================================================

  describe('validateOptions', () => {
    it('passes valid options', () => {
      const options = {
        systemPrompt: 'Test',
        temperature: 0.7,
        topK: 3,
        maxTokens: 2048,
      };

      expect(() =>
        ChromeAIPromptService.validateOptions(options),
      ).not.toThrow();
    });

    it('throws error for temperature < 0', () => {
      const options = { temperature: -0.1 };

      expect(() => ChromeAIPromptService.validateOptions(options)).toThrow(
        'Invalid temperature',
      );
    });

    it('throws error for temperature > 2', () => {
      const options = { temperature: 2.1 };

      expect(() => ChromeAIPromptService.validateOptions(options)).toThrow(
        'Invalid temperature',
      );
    });

    it('throws error for topK < 1', () => {
      const options = { topK: 0 };

      expect(() => ChromeAIPromptService.validateOptions(options)).toThrow(
        'Invalid topK',
      );
    });

    it('throws error for maxTokens < 1', () => {
      const options = { maxTokens: 0 };

      expect(() => ChromeAIPromptService.validateOptions(options)).toThrow(
        'Invalid maxTokens',
      );
    });

    it('allows boundary values', () => {
      const options = {
        temperature: 0,
        topK: 1,
        maxTokens: 1,
      };

      expect(() =>
        ChromeAIPromptService.validateOptions(options),
      ).not.toThrow();
    });

    it('allows maximum boundary values', () => {
      const options = {
        temperature: 2,
        topK: 128,
        maxTokens: 4096,
      };

      expect(() =>
        ChromeAIPromptService.validateOptions(options),
      ).not.toThrow();
    });
  });

  describe('validatePrompt', () => {
    it('passes non-empty prompt', () => {
      expect(() => ChromeAIPromptService.validatePrompt('Hello')).not.toThrow();
    });

    it('throws error for empty prompt', () => {
      expect(() => ChromeAIPromptService.validatePrompt('')).toThrow(
        'Prompt cannot be empty',
      );
    });

    it('throws error for whitespace-only prompt', () => {
      expect(() => ChromeAIPromptService.validatePrompt('   ')).toThrow(
        'Prompt cannot be empty',
      );
    });

    it('allows prompts with newlines', () => {
      expect(() =>
        ChromeAIPromptService.validatePrompt('Line 1\nLine 2'),
      ).not.toThrow();
    });
  });

  // ==========================================================================
  // Prompt Execution Tests
  // ==========================================================================

  describe('prompt', () => {
    it('executes non-streaming prompt', async () => {
      const instance = createMockLanguageModel();
      instance.prompt = vi.fn().mockResolvedValue('Test response');

      const result = await ChromeAIPromptService.prompt(
        instance,
        'Test prompt',
      );

      expect(result).toBe('Test response');
      expect(instance.prompt).toHaveBeenCalledWith('Test prompt', undefined);
    });

    it('passes prompt options', async () => {
      const instance = createMockLanguageModel();
      const options = { signal: new AbortController().signal };

      await ChromeAIPromptService.prompt(instance, 'Test', options);

      expect(instance.prompt).toHaveBeenCalledWith('Test', options);
    });

    it('handles abort signal', async () => {
      const instance = createMockLanguageModel();
      const controller = new AbortController();
      instance.prompt = vi.fn().mockRejectedValue(MOCK_ERRORS.abortError);

      const promise = ChromeAIPromptService.prompt(instance, 'Test', {
        signal: controller.signal,
      });

      controller.abort();

      await expect(promise).rejects.toThrow('cancelled');
    });

    it('handles API errors', async () => {
      const instance = createMockLanguageModel();
      instance.prompt = vi.fn().mockRejectedValue(new Error('API error'));

      await expect(
        ChromeAIPromptService.prompt(instance, 'Test'),
      ).rejects.toThrow('API error');
    });
  });

  describe('promptStreaming', () => {
    it('streams response chunks', async () => {
      const instance = createMockLanguageModel();
      const stream = ChromeAIPromptService.promptStreaming(instance, 'Test');

      const chunks: string[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Mock ', 'streaming ', 'response']);
    });

    it('passes prompt options to streaming', async () => {
      const instance = createMockLanguageModel();
      const options = { signal: new AbortController().signal };

      const stream = ChromeAIPromptService.promptStreaming(
        instance,
        'Test',
        options,
      );

      // Consume stream
      for await (const chunk of stream) {
        // Just consume
      }

      expect(instance.promptStreaming).toHaveBeenCalledWith('Test', options);
    });

    it('handles streaming errors', async () => {
      const instance = createMockLanguageModel();
      instance.promptStreaming = vi.fn(async function* () {
        yield 'test';
        throw MOCK_ERRORS.streamingFailedError;
      });

      const stream = ChromeAIPromptService.promptStreaming(instance, 'Test');

      await expect(async () => {
        for await (const chunk of stream) {
          // Should throw
        }
      }).rejects.toThrow('Streaming failed');
    });
  });

  describe('promptStreamingWithCallback', () => {
    it('calls callback for each chunk', async () => {
      const instance = createMockLanguageModel();
      const { callback, chunks } = createStreamingCallback();

      const result = await ChromeAIPromptService.promptStreamingWithCallback(
        instance,
        'Test',
        callback,
      );

      expect(callback).toHaveBeenCalledTimes(3);
      expect(chunks).toEqual(['Mock ', 'streaming ', 'response']);
      expect(result).toBe('Mock streaming response');
    });

    it('accumulates complete response', async () => {
      const instance = createMockLanguageModel();

      const result = await ChromeAIPromptService.promptStreamingWithCallback(
        instance,
        'Test',
        () => {},
      );

      expect(result).toBe('Mock streaming response');
    });

    it('handles callback errors', async () => {
      const instance = createMockLanguageModel();
      const callback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      await expect(
        ChromeAIPromptService.promptStreamingWithCallback(
          instance,
          'Test',
          callback,
        ),
      ).rejects.toThrow('Callback error');
    });
  });

  // ==========================================================================
  // Token Management Tests
  // ==========================================================================

  describe('countTokens', () => {
    it('counts tokens in prompt', async () => {
      const instance = createMockLanguageModel();
      instance.countPromptTokens = vi.fn().mockResolvedValue(42);

      const result = await ChromeAIPromptService.countTokens(
        instance,
        'Test prompt',
      );

      expect(result).toBe(42);
      expect(instance.countPromptTokens).toHaveBeenCalledWith('Test prompt');
    });

    it('returns null when token counting is not available', async () => {
      const instance = createMockLanguageModel();
      delete (instance as any).countPromptTokens;

      const result = await ChromeAIPromptService.countTokens(instance, 'Test');

      expect(result).toBeNull();
    });

    it('handles token counting errors', async () => {
      const instance = createMockLanguageModel();
      instance.countPromptTokens = vi
        .fn()
        .mockRejectedValue(new Error('Count failed'));

      const result = await ChromeAIPromptService.countTokens(instance, 'Test');

      expect(result).toBeNull();
    });
  });

  describe('getTokenUsage', () => {
    it('returns token usage info', () => {
      const instance = createMockLanguageModel();
      instance.maxTokens = 4096;
      instance.tokensSoFar = 1024;
      instance.tokensLeft = 3072;

      const result = ChromeAIPromptService.getTokenUsage(instance);

      expect(result).toEqual({
        maxTokens: 4096,
        tokensSoFar: 1024,
        tokensLeft: 3072,
        inputQuota: 6144, // From mock
        inputUsage: 0, // From mock
      });
    });

    it('returns null when properties are not available', () => {
      const instance = createMockLanguageModel();
      delete (instance as any).maxTokens;

      const result = ChromeAIPromptService.getTokenUsage(instance);

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // Instance Management Tests
  // ==========================================================================

  describe('clone', () => {
    it('clones existing instance', async () => {
      const instance = createMockLanguageModel();

      const clone = await ChromeAIPromptService.clone(instance);

      expect(clone).toBeDefined();
      expect(instance.clone).toHaveBeenCalled();
    });

    it('returns null when cloning is not supported', async () => {
      const instance = createMockLanguageModel();
      delete (instance as any).clone;

      const clone = await ChromeAIPromptService.clone(instance);

      expect(clone).toBeNull();
    });

    it('handles clone errors', async () => {
      const instance = createMockLanguageModel();
      instance.clone = vi.fn().mockRejectedValue(new Error('Clone failed'));

      const result = await ChromeAIPromptService.clone(instance);

      expect(result).toBeNull();
    });
  });

  describe('destroy', () => {
    it('destroys instance', () => {
      const instance = createMockLanguageModel();

      ChromeAIPromptService.destroy(instance);

      expect(instance.destroy).toHaveBeenCalled();
    });

    it('handles missing destroy method', () => {
      const instance = createMockLanguageModel();
      delete (instance as any).destroy;

      expect(() => ChromeAIPromptService.destroy(instance)).not.toThrow();
    });
  });

  // ==========================================================================
  // Configuration Helper Tests
  // ==========================================================================

  describe('getRecommendedConfig', () => {
    it('returns config for general use case', () => {
      const config = ChromeAIPromptService.getRecommendedConfig('general');

      expect(config).toHaveProperty('systemPrompt');
      expect(config).toHaveProperty('temperature');
      expect(config).toHaveProperty('topK');
    });

    it('returns creative config', () => {
      const config = ChromeAIPromptService.getRecommendedConfig('creative');

      expect(config.temperature).toBeGreaterThan(0.7);
    });

    it('returns precise config', () => {
      const config = ChromeAIPromptService.getRecommendedConfig('precise');

      expect(config.temperature).toBeLessThan(0.5);
    });

    it('returns code config', () => {
      const config = ChromeAIPromptService.getRecommendedConfig('code');

      expect(config.systemPrompt).toContain('code');
    });

    it('returns chat config', () => {
      const config = ChromeAIPromptService.getRecommendedConfig('chat');

      expect(config.systemPrompt).toContain('conversation');
    });

    it('returns analysis config', () => {
      const config = ChromeAIPromptService.getRecommendedConfig('analysis');

      expect(config.systemPrompt).toContain('analytical');
    });
  });

  // ==========================================================================
  // Token Measurement Tests (Chrome AI Native APIs)
  // ==========================================================================

  describe('Token Measurement', () => {
    it('measureInputUsage with string input', async () => {
      const instance = createMockLanguageModel();
      const input = 'Test prompt for measurement';

      const result = await ChromeAIPromptService.measureInputUsage(
        instance,
        input,
      );

      expect(result).toBe(Math.ceil(input.length / 4)); // Mock returns based on length
      expect(instance.measureInputUsage).toHaveBeenCalledWith(input, {
        signal: undefined,
      });
    });

    it('measureInputUsage with message array', async () => {
      const instance = createMockLanguageModel();
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      const result = await ChromeAIPromptService.measureInputUsage(
        instance,
        messages,
      );

      expect(result).toBeGreaterThan(0);
      expect(instance.measureInputUsage).toHaveBeenCalledWith(messages, {
        signal: undefined,
      });
    });

    it('addQuotaOverflowListener registers callback', () => {
      const instance = createMockLanguageModel();
      const callback = vi.fn();

      const success = ChromeAIPromptService.addQuotaOverflowListener(
        instance,
        callback,
      );

      expect(success).toBe(true);
      expect(instance.addEventListener).toHaveBeenCalledWith(
        'quotaoverflow',
        callback,
      );
    });

    it('removeQuotaOverflowListener unregisters callback', () => {
      const instance = createMockLanguageModel();
      const callback = vi.fn();

      const success = ChromeAIPromptService.removeQuotaOverflowListener(
        instance,
        callback,
      );

      expect(success).toBe(true);
      expect(instance.removeEventListener).toHaveBeenCalledWith(
        'quotaoverflow',
        callback,
      );
    });
  });
});
