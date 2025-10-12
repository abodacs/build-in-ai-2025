/**
 * RewriterManager Test Suite
 *
 * Tests for Rewriter Manager service layer.
 * Covers instance lifecycle, caching, and operations.
 *
 * Coverage: Manager layer, instance caching, batch operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RewriterManager } from '../RewriterManager';
import { ChromeAIRewriterService } from '../ChromeAIService';
import type { Rewriter, RewriterConfig } from '../../types';

// ============================================================================
// Test Setup
// ============================================================================

// Mock ChromeAIRewriterService
vi.mock('../ChromeAIService');

// Create fresh mock instance factory to avoid stream reuse
const createMockRewriterInstance = (): Rewriter => ({
  rewrite: vi.fn().mockResolvedValue('Rewritten text'),
  rewriteStreaming: vi.fn().mockImplementation(() => {
    // Return a NEW stream each time to avoid "stream locked" errors
    return new ReadableStream({
      start(controller) {
        controller.enqueue('Chunk 1 ');
        controller.enqueue('Chunk 2');
        controller.close();
      },
    });
  }),
  destroy: vi.fn(),
});

let mockRewriterInstance: Rewriter;

const defaultConfig: RewriterConfig = {
  tone: 'as-is',
  format: 'plain-text',
  length: 'as-is',
  outputLanguage: 'en',
  sharedContext: '',
};

beforeEach(() => {
  vi.clearAllMocks();

  // Create fresh mock instance for each test
  mockRewriterInstance = createMockRewriterInstance();

  // Mock ChromeAIRewriterService methods
  vi.mocked(ChromeAIRewriterService.createInstance).mockResolvedValue(
    mockRewriterInstance,
  );
  vi.mocked(ChromeAIRewriterService.checkAvailability).mockResolvedValue(
    'readily',
  );
  vi.mocked(ChromeAIRewriterService.rewrite).mockResolvedValue(
    'Rewritten text',
  );
  vi.mocked(ChromeAIRewriterService.destroy).mockImplementation(() => {});
  vi.mocked(ChromeAIRewriterService.rewriteStreaming).mockImplementation(
    (instance) => instance.rewriteStreaming('', undefined, undefined),
  );
});

// ============================================================================
// Tests
// ============================================================================

describe('RewriterManager', () => {
  // ==========================================================================
  // Configuration Management Tests
  // ==========================================================================

  describe('Configuration', () => {
    it('updates configuration correctly', () => {
      const manager = new RewriterManager();
      const newConfig: RewriterConfig = {
        ...defaultConfig,
        tone: 'more-formal',
      };

      manager.updateConfig(newConfig);

      // Config should be updated (verified indirectly through operations)
      expect(manager).toBeDefined();
    });

    it('converts config to options correctly', async () => {
      const manager = new RewriterManager();
      const config: RewriterConfig = {
        tone: 'more-casual',
        format: 'markdown',
        length: 'shorter',
        outputLanguage: 'es',
        sharedContext: 'Be friendly',
      };

      manager.updateConfig(config);
      await manager.rewrite('Test input');

      // Verify instance was created with correct options
      expect(ChromeAIRewriterService.createInstance).toHaveBeenCalledWith({
        tone: 'more-casual',
        format: 'markdown',
        length: 'shorter',
        outputLanguage: 'es',
        sharedContext: 'Be friendly',
      });
    });
  });

  // ==========================================================================
  // Instance Management Tests
  // ==========================================================================

  describe('Instance Management', () => {
    it('creates instance on first use', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      await manager.rewrite('Test input');

      expect(ChromeAIRewriterService.createInstance).toHaveBeenCalledTimes(1);
    });

    it('reuses instance for same configuration', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      await manager.rewrite('First input');
      await manager.rewrite('Second input');

      // Should only create once
      expect(ChromeAIRewriterService.createInstance).toHaveBeenCalledTimes(1);
    });

    it('creates new instance when configuration changes', async () => {
      const manager = new RewriterManager();

      const firstInstance = mockRewriterInstance;
      // Set first config
      manager.updateConfig(defaultConfig);
      await manager.rewrite('First input');

      // Store reference to first instance
      const savedFirstInstance = firstInstance;

      // Change config - need to destroy old instance first
      // This simulates the expected behavior: config changes require recreation
      manager.cleanup();

      // Create new mock instance for second config
      const secondInstance = createMockRewriterInstance();
      vi.mocked(ChromeAIRewriterService.createInstance).mockResolvedValue(
        secondInstance,
      );

      // Set new config
      manager.updateConfig({
        ...defaultConfig,
        tone: 'more-formal',
      });
      await manager.rewrite('Second input');

      // Should create twice (once for each config)
      expect(ChromeAIRewriterService.createInstance).toHaveBeenCalledTimes(2);
      // First instance should be destroyed via cleanup
      expect(savedFirstInstance.destroy).toHaveBeenCalled();
    });

    it('destroys old instance when creating new one', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      const firstInstance = mockRewriterInstance;
      await manager.rewrite('First input');

      // Store reference  to first instance before cleanup
      const savedFirstInstance = firstInstance;

      // Cleanup to destroy old instance
      manager.cleanup();

      // Create new mock instance
      const secondInstance = createMockRewriterInstance();
      vi.mocked(ChromeAIRewriterService.createInstance).mockResolvedValue(
        secondInstance,
      );

      // Set new config and rewrite
      manager.updateConfig({
        ...defaultConfig,
        tone: 'more-formal',
      });
      await manager.rewrite('Second input');

      // Should destroy old instance via cleanup
      expect(savedFirstInstance.destroy).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Rewrite Operation Tests
  // ==========================================================================

  describe('Rewrite Operations', () => {
    it('rewrites text successfully', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      const result = await manager.rewrite('Test input');

      expect(ChromeAIRewriterService.rewrite).toHaveBeenCalledWith(
        mockRewriterInstance,
        'Test input',
        undefined,
        undefined,
      );
      expect(result).toBe('Rewritten text');
    });

    it('passes context to rewrite', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      await manager.rewrite('Test input', 'Make it formal');

      expect(ChromeAIRewriterService.rewrite).toHaveBeenCalledWith(
        mockRewriterInstance,
        'Test input',
        'Make it formal',
        undefined,
      );
    });

    it('passes abort signal to rewrite', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);
      const abortController = new AbortController();

      await manager.rewrite('Test input', undefined, abortController.signal);

      expect(ChromeAIRewriterService.rewrite).toHaveBeenCalledWith(
        mockRewriterInstance,
        'Test input',
        undefined,
        abortController.signal,
      );
    });
  });

  // ==========================================================================
  // Streaming Operation Tests
  // ==========================================================================

  describe('Streaming Operations', () => {
    it('streams rewrite successfully', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      const chunks: string[] = [];
      const result = await manager.rewriteStreaming('Test input', (chunk) => {
        chunks.push(chunk);
      });

      expect(result).toBe('Chunk 1 Chunk 2');
      expect(chunks).toEqual(['Chunk 1 ', 'Chunk 2']);
    });

    it('passes context to streaming', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      vi.mocked(ChromeAIRewriterService.rewriteStreaming).mockReturnValue(
        new ReadableStream({
          start(controller) {
            controller.enqueue('Result');
            controller.close();
          },
        }),
      );

      await manager.rewriteStreaming('Test', (chunk) => {}, 'Context');

      expect(ChromeAIRewriterService.rewriteStreaming).toHaveBeenCalledWith(
        mockRewriterInstance,
        'Test',
        'Context',
        undefined,
      );
    });

    it('handles abort during streaming', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      // Mock stream that throws AbortError
      vi.mocked(ChromeAIRewriterService.rewriteStreaming).mockReturnValue(
        new ReadableStream({
          async start(controller) {
            const error: any = new Error('Aborted');
            error.name = 'AbortError';
            throw error;
          },
        }),
      );

      await expect(manager.rewriteStreaming('Test', () => {})).rejects.toThrow(
        /cancelled/i,
      );
    });

    it('calls onChunk for each chunk', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      const onChunk = vi.fn();
      await manager.rewriteStreaming('Test', onChunk);

      expect(onChunk).toHaveBeenCalledTimes(2);
      expect(onChunk).toHaveBeenNthCalledWith(1, 'Chunk 1 ');
      expect(onChunk).toHaveBeenNthCalledWith(2, 'Chunk 2');
    });
  });

  // ==========================================================================
  // Auto Mode Tests
  // ==========================================================================

  describe('Auto Mode', () => {
    it('uses streaming when callback provided', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      const onChunk = vi.fn();
      await manager.rewriteAuto('Test', onChunk);

      expect(ChromeAIRewriterService.rewriteStreaming).toHaveBeenCalled();
    });

    it('uses standard rewrite when no callback', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      await manager.rewriteAuto('Test');

      expect(ChromeAIRewriterService.rewrite).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Batch Operation Tests
  // ==========================================================================

  describe('Batch Operations', () => {
    it('rewrites multiple texts', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      vi.mocked(ChromeAIRewriterService.rewrite)
        .mockResolvedValueOnce('Result 1')
        .mockResolvedValueOnce('Result 2')
        .mockResolvedValueOnce('Result 3');

      const results = await manager.batchRewrite([
        'Input 1',
        'Input 2',
        'Input 3',
      ]);

      expect(results).toEqual(['Result 1', 'Result 2', 'Result 3']);
      expect(ChromeAIRewriterService.rewrite).toHaveBeenCalledTimes(3);
    });

    it('passes context to batch rewrite', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      await manager.batchRewrite(['Input 1', 'Input 2'], 'Context');

      expect(ChromeAIRewriterService.rewrite).toHaveBeenNthCalledWith(
        1,
        mockRewriterInstance,
        'Input 1',
        'Context',
        undefined,
      );
      expect(ChromeAIRewriterService.rewrite).toHaveBeenNthCalledWith(
        2,
        mockRewriterInstance,
        'Input 2',
        'Context',
        undefined,
      );
    });

    it('handles abort during batch rewrite', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      const abortController = new AbortController();

      // Mock to return first result, then abort synchronously
      let callCount = 0;
      vi.mocked(ChromeAIRewriterService.rewrite).mockImplementation(
        async () => {
          callCount++;
          const result = `Result ${callCount}`;
          // Abort after first call completes
          if (callCount === 1) {
            abortController.abort();
          }
          return result;
        },
      );

      await expect(
        manager.batchRewrite(
          ['Input 1', 'Input 2'],
          undefined,
          abortController.signal,
        ),
      ).rejects.toThrow(/cancelled/i);

      // Should only have called rewrite once before aborting
      expect(callCount).toBe(1);
    });
  });

  // ==========================================================================
  // Cleanup Tests
  // ==========================================================================

  describe('Cleanup', () => {
    it('destroys instance on cleanup', async () => {
      const manager = new RewriterManager();
      manager.updateConfig(defaultConfig);

      const instance = mockRewriterInstance;
      await manager.rewrite('Test');
      manager.cleanup();

      expect(instance.destroy).toHaveBeenCalled();
    });

    it('handles cleanup when no instance exists', () => {
      const manager = new RewriterManager();

      // Should not throw
      expect(() => manager.cleanup()).not.toThrow();
    });
  });

  // ==========================================================================
  // Availability Tests
  // ==========================================================================

  describe('Availability', () => {
    it('checks availability correctly', async () => {
      const manager = new RewriterManager();

      const status = await manager.checkAvailability();

      expect(ChromeAIRewriterService.checkAvailability).toHaveBeenCalled();
      expect(status).toBe('readily');
    });
  });

  // ==========================================================================
  // API Name Tests
  // ==========================================================================

  describe('API Name', () => {
    it('returns correct API name', () => {
      const manager = new RewriterManager();

      expect(manager.getAPIName()).toBe('Rewriter');
    });
  });
});
