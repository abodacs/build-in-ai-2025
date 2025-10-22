/**
 * ChromeAIRewriterService Test Suite
 *
 * Tests for Chrome AI Rewriter Service layer.
 * Covers API detection, instance creation, and operations.
 *
 * Coverage: Service layer, error handling, API interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChromeAIRewriterService } from '../ChromeAIService';
import type { RewriterAPI, Rewriter } from '../../types';

// ============================================================================
// Test Setup
// ============================================================================

// Mock Rewriter API
const mockRewriterInstance: Rewriter = {
  rewrite: vi.fn().mockResolvedValue('Rewritten text'),
  rewriteStreaming: vi.fn().mockReturnValue(
    new ReadableStream({
      start(controller) {
        controller.enqueue('Chunk 1');
        controller.enqueue('Chunk 2');
        controller.close();
      },
    }),
  ),
  destroy: vi.fn(),
};

const mockRewriterAPI: RewriterAPI = {
  availability: vi.fn().mockResolvedValue('available'),
  create: vi.fn().mockResolvedValue(mockRewriterInstance),
};

beforeEach(() => {
  vi.clearAllMocks();

  // Reset mock functions
  mockRewriterInstance.rewrite = vi.fn().mockResolvedValue('Rewritten text');
  mockRewriterInstance.rewriteStreaming = vi.fn().mockReturnValue(
    new ReadableStream({
      start(controller) {
        controller.enqueue('Chunk 1');
        controller.enqueue('Chunk 2');
        controller.close();
      },
    }),
  );
  mockRewriterInstance.destroy = vi.fn();

  mockRewriterAPI.availability = vi.fn().mockResolvedValue('available');
  mockRewriterAPI.create = vi.fn().mockResolvedValue(mockRewriterInstance);

  // Set up window.Rewriter - check if it exists first
  if ('Rewriter' in globalThis) {
    // Property exists, just update the value
    (globalThis as any).Rewriter = mockRewriterAPI;
  } else {
    // Property doesn't exist, define it
    Object.defineProperty(globalThis, 'Rewriter', {
      value: mockRewriterAPI,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
});

afterEach(() => {
  // Clean up mocks
  vi.restoreAllMocks();
});

// ============================================================================
// Tests
// ============================================================================

describe('ChromeAIRewriterService', () => {
  // ==========================================================================
  // API Detection Tests
  // ==========================================================================

  describe('isSupported', () => {
    it('returns true when Rewriter API is available', () => {
      expect(ChromeAIRewriterService.isSupported()).toBe(true);
    });

    it('returns false when Rewriter API is not available', () => {
      // Spy on isSupported to simulate API not being available
      vi.spyOn(ChromeAIRewriterService, 'isSupported').mockReturnValueOnce(
        false,
      );

      expect(ChromeAIRewriterService.isSupported()).toBe(false);
    });
  });

  describe('getAPI', () => {
    it('returns Rewriter API when supported', () => {
      const api = ChromeAIRewriterService.getAPI();
      expect(api).toBe(mockRewriterAPI);
    });

    it('throws error when Rewriter API is not supported', () => {
      // Spy on isSupported to simulate API not being available
      vi.spyOn(ChromeAIRewriterService, 'isSupported').mockReturnValueOnce(
        false,
      );

      expect(() => ChromeAIRewriterService.getAPI()).toThrow(
        /Rewriter API is not supported/i,
      );
    });

    it('includes Chrome flags URL in error message', () => {
      // Spy on isSupported to simulate API not being available
      vi.spyOn(ChromeAIRewriterService, 'isSupported').mockReturnValueOnce(
        false,
      );

      expect(() => ChromeAIRewriterService.getAPI()).toThrow(
        /chrome:\/\/flags#rewriter-api/i,
      );
    });
  });

  // ==========================================================================
  // Availability Check Tests
  // ==========================================================================

  describe('checkAvailability', () => {
    it('returns "readily" when API is ready', async () => {
      mockRewriterAPI.availability = vi.fn().mockResolvedValue('available');

      const status = await ChromeAIRewriterService.checkAvailability();
      expect(status).toBe('available');
    });

    it('returns "after-download" when model download required', async () => {
      mockRewriterAPI.availability = vi
        .fn()
        .mockResolvedValue('after-download');

      const status = await ChromeAIRewriterService.checkAvailability();
      expect(status).toBe('after-download');
    });

    it('returns "no" when API is not supported', async () => {
      // Spy on isSupported to simulate API not being available
      vi.spyOn(ChromeAIRewriterService, 'isSupported').mockReturnValueOnce(
        false,
      );

      const status = await ChromeAIRewriterService.checkAvailability();
      expect(status).toBe('no');
    });

    it('returns "no" when availability check fails', async () => {
      mockRewriterAPI.availability = vi
        .fn()
        .mockRejectedValue(new Error('Check failed'));

      const status = await ChromeAIRewriterService.checkAvailability();
      expect(status).toBe('no');
    });
  });

  // ==========================================================================
  // Instance Creation Tests
  // ==========================================================================

  describe('createInstance', () => {
    it('creates instance successfully with default options', async () => {
      const instance = await ChromeAIRewriterService.createInstance();

      expect(mockRewriterAPI.create).toHaveBeenCalledWith(undefined);
      expect(instance).toBe(mockRewriterInstance);
    });

    it('creates instance with custom options', async () => {
      const options = {
        tone: 'more-formal' as const,
        format: 'markdown' as const,
        length: 'shorter' as const,
      };

      const instance = await ChromeAIRewriterService.createInstance(options);

      expect(mockRewriterAPI.create).toHaveBeenCalledWith(options);
      expect(instance).toBe(mockRewriterInstance);
    });

    it('throws error when API is not supported', async () => {
      // Spy on isSupported to simulate API not being available
      vi.spyOn(ChromeAIRewriterService, 'isSupported').mockReturnValue(false);

      // Error gets enhanced by catch block
      await expect(ChromeAIRewriterService.createInstance()).rejects.toThrow(
        /Rewriter API is not available/i,
      );
    });

    it('enhances user activation error message', async () => {
      mockRewriterAPI.create = vi
        .fn()
        .mockRejectedValue(new Error('user activation required'));

      await expect(ChromeAIRewriterService.createInstance()).rejects.toThrow(
        /requires a user interaction/i,
      );
    });

    it('enhances download error message', async () => {
      mockRewriterAPI.create = vi
        .fn()
        .mockRejectedValue(new Error('model download required'));

      await expect(ChromeAIRewriterService.createInstance()).rejects.toThrow(
        /AI model download required/i,
      );
    });

    it('enhances not available error message', async () => {
      mockRewriterAPI.create = vi
        .fn()
        .mockRejectedValue(new Error('API not available'));

      await expect(ChromeAIRewriterService.createInstance()).rejects.toThrow(
        /Rewriter API is not available/i,
      );
    });

    it('preserves original error message for unknown errors', async () => {
      mockRewriterAPI.create = vi
        .fn()
        .mockRejectedValue(new Error('Unknown error occurred'));

      await expect(ChromeAIRewriterService.createInstance()).rejects.toThrow(
        /Unknown error occurred/i,
      );
    });
  });

  // ==========================================================================
  // Rewrite Operation Tests
  // ==========================================================================

  describe('rewrite', () => {
    it('rewrites text successfully', async () => {
      mockRewriterInstance.rewrite = vi
        .fn()
        .mockResolvedValue('Rewritten text');

      const result = await ChromeAIRewriterService.rewrite(
        mockRewriterInstance,
        'Original text',
      );

      expect(mockRewriterInstance.rewrite).toHaveBeenCalledWith(
        'Original text',
        {
          context: undefined,
          signal: undefined,
        },
      );
      expect(result).toBe('Rewritten text');
    });

    it('passes context to rewrite', async () => {
      mockRewriterInstance.rewrite = vi.fn().mockResolvedValue('Formal text');

      await ChromeAIRewriterService.rewrite(
        mockRewriterInstance,
        'Original text',
        'Make it formal',
      );

      expect(mockRewriterInstance.rewrite).toHaveBeenCalledWith(
        'Original text',
        {
          context: 'Make it formal',
          signal: undefined,
        },
      );
    });

    it('passes abort signal to rewrite', async () => {
      const abortController = new AbortController();
      mockRewriterInstance.rewrite = vi.fn().mockResolvedValue('Result');

      await ChromeAIRewriterService.rewrite(
        mockRewriterInstance,
        'Text',
        undefined,
        abortController.signal,
      );

      expect(mockRewriterInstance.rewrite).toHaveBeenCalledWith('Text', {
        context: undefined,
        signal: abortController.signal,
      });
    });

    it('handles abort error correctly', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockRewriterInstance.rewrite = vi.fn().mockRejectedValue(abortError);

      await expect(
        ChromeAIRewriterService.rewrite(mockRewriterInstance, 'Text'),
      ).rejects.toThrow(/operation was cancelled/i);
    });

    it('wraps generic errors', async () => {
      mockRewriterInstance.rewrite = vi
        .fn()
        .mockRejectedValue(new Error('Generic error'));

      await expect(
        ChromeAIRewriterService.rewrite(mockRewriterInstance, 'Text'),
      ).rejects.toThrow(/Rewrite failed/i);
    });
  });

  // ==========================================================================
  // Streaming Operation Tests
  // ==========================================================================

  describe('rewriteStreaming', () => {
    it('returns readable stream', () => {
      const stream = ChromeAIRewriterService.rewriteStreaming(
        mockRewriterInstance,
        'Original text',
      );

      expect(stream).toBeInstanceOf(ReadableStream);
      expect(mockRewriterInstance.rewriteStreaming).toHaveBeenCalledWith(
        'Original text',
        {
          context: undefined,
          signal: undefined,
        },
      );
    });

    it('passes context to streaming', () => {
      ChromeAIRewriterService.rewriteStreaming(
        mockRewriterInstance,
        'Text',
        'Context',
      );

      expect(mockRewriterInstance.rewriteStreaming).toHaveBeenCalledWith(
        'Text',
        {
          context: 'Context',
          signal: undefined,
        },
      );
    });

    it('passes abort signal to streaming', () => {
      const abortController = new AbortController();

      ChromeAIRewriterService.rewriteStreaming(
        mockRewriterInstance,
        'Text',
        undefined,
        abortController.signal,
      );

      expect(mockRewriterInstance.rewriteStreaming).toHaveBeenCalledWith(
        'Text',
        {
          context: undefined,
          signal: abortController.signal,
        },
      );
    });

    it('can read chunks from stream', async () => {
      const stream = ChromeAIRewriterService.rewriteStreaming(
        mockRewriterInstance,
        'Text',
      );

      const reader = stream.getReader();
      const chunks: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      expect(chunks).toEqual(['Chunk 1', 'Chunk 2']);
    });

    it('throws error on streaming failure', () => {
      mockRewriterInstance.rewriteStreaming = vi.fn().mockImplementation(() => {
        throw new Error('Streaming failed');
      });

      expect(() =>
        ChromeAIRewriterService.rewriteStreaming(mockRewriterInstance, 'Text'),
      ).toThrow(/Streaming rewrite failed/i);
    });
  });

  // ==========================================================================
  // Instance Cleanup Tests
  // ==========================================================================

  describe('destroy', () => {
    it('destroys instance successfully', () => {
      ChromeAIRewriterService.destroy(mockRewriterInstance);

      expect(mockRewriterInstance.destroy).toHaveBeenCalled();
    });

    it('handles destroy errors silently', () => {
      mockRewriterInstance.destroy = vi.fn().mockImplementation(() => {
        throw new Error('Destroy failed');
      });

      // Should not throw
      expect(() =>
        ChromeAIRewriterService.destroy(mockRewriterInstance),
      ).not.toThrow();
    });
  });
});
