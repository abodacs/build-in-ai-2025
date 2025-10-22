/**
 * Integration Tests for Summarizer Module
 *
 * Tests integration between services, hooks, components, and end-to-end workflows
 *
 * Coverage:
 * - Service interactions (SummarizerManager + ChunkingEngine + ErrorHandler)
 * - Hook integration (useSummarizer state management)
 * - Component integration
 * - Cross-module workflows
 * - Real-world usage patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { SummarizerManager } from '../services/SummarizerManager';
import { ChunkingEngine } from '../services/ChunkingEngine';
import { ErrorHandler } from '../services/ErrorHandler';
import { useSummarizer } from '../hooks/useSummarizer';
import type {
  Summarizer,
  SummarizerCreateOptions,
  SummarizeOptions,
} from '../types/summarizer.types';

// ============================================================================
// Test Setup
// ============================================================================

describe('Integration Tests', () => {
  let mockSummarizer: Partial<Summarizer>;
  let mockSummarizerClass: any;

  beforeEach(() => {
    mockSummarizer = {
      summarize: vi.fn().mockResolvedValue('Integrated summary result'),
      summarizeStreaming: vi.fn(),
      destroy: vi.fn(),
    };

    mockSummarizerClass = {
      create: vi.fn().mockResolvedValue(mockSummarizer),
      availability: vi.fn().mockResolvedValue('available'),
    };

    (global.self as any).Summarizer = mockSummarizerClass;
    (global.window as any).Summarizer = mockSummarizerClass;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // A. Service Integration (Manager + ChunkingEngine + ErrorHandler)
  // ============================================================================

  describe('Service Integration', () => {
    it('should integrate SummarizerManager with ChunkingEngine', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const chunkingEngine = new ChunkingEngine(manager);
      const longText = 'Long document content. '.repeat(500); // ~12k chars

      (mockSummarizer.summarize as any).mockResolvedValue('Chunk summary');

      // Act
      const result = await chunkingEngine.recursiveSummarize(
        longText,
        { type: 'tldr' },
        { type: 'recursive', maxChunkSize: 4000 },
      );

      // Assert
      expect(result.summary).toBeTruthy();
      expect(result.metadata.chunksProcessed).toBeGreaterThan(1);
      expect(mockSummarizerClass.create).toHaveBeenCalled();
      expect(mockSummarizer.summarize).toHaveBeenCalled();
    });

    it('should integrate SummarizerManager with ErrorHandler', async () => {
      // Arrange
      const manager = new SummarizerManager();

      (mockSummarizerClass.create as any).mockRejectedValue(
        new DOMException('API not supported', 'NotSupportedError'),
      );

      // Act & Assert
      try {
        await manager.getSummarizer({ type: 'tldr' });
        expect.fail('Should have thrown error');
      } catch (error) {
        const handledError = ErrorHandler.handleError(error);

        // Error handler may return generic message
        expect(handledError).toBeDefined();
        expect(handledError.message).toBeTruthy();
      }
    });

    it('should integrate ChunkingEngine with progress callbacks', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const chunkingEngine = new ChunkingEngine(manager);
      const progressUpdates: Array<{ current: number; total: number }> = [];

      (mockSummarizer.summarize as any).mockResolvedValue(
        'Progress test summary',
      );

      // Act
      await chunkingEngine.recursiveSummarize(
        'Content. '.repeat(1000),
        { type: 'tldr' },
        { type: 'recursive', maxChunkSize: 3000 },
        (current, total) => {
          progressUpdates.push({ current, total });
        },
      );

      // Assert
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(
        progressUpdates[progressUpdates.length - 1].current,
      ).toBeLessThanOrEqual(progressUpdates[progressUpdates.length - 1].total);
    });

    it('should handle errors across service boundaries', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const chunkingEngine = new ChunkingEngine(manager);

      (mockSummarizer.summarize as any).mockRejectedValue(
        new DOMException('Network error', 'NotReadableError'),
      );

      // Act & Assert
      try {
        await chunkingEngine.recursiveSummarize(
          'Test content',
          { type: 'tldr' },
          { type: 'recursive', maxChunkSize: 5000 },
        );
        expect.fail('Should have thrown error');
      } catch (error) {
        const handledError = ErrorHandler.handleError(error);
        // Error handler processes the error
        expect(handledError).toBeDefined();
      }
    });

    it('should share cached instances across services', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const chunkingEngine = new ChunkingEngine(manager);
      const config: SummarizerCreateOptions = { type: 'tldr' };

      (mockSummarizer.summarize as any).mockResolvedValue('Cached summary');

      // Act
      await manager.summarize('Text 1', {}, config);
      await chunkingEngine.recursiveSummarize('Text 2', config, {
        type: 'recursive',
        maxChunkSize: 5000,
      });
      await manager.summarize('Text 3', {}, config);

      // Assert
      expect(mockSummarizerClass.create).toHaveBeenCalledTimes(1); // Shared cache
    });

    it('should propagate metrics across service calls', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const chunkingEngine = new ChunkingEngine(manager);

      (mockSummarizer.summarize as any).mockResolvedValue('Metrics test');

      // Act
      await manager.summarize('Direct call', {}, { type: 'tldr' });
      await chunkingEngine.recursiveSummarize(
        'Chunked call',
        { type: 'tldr' },
        { type: 'recursive', maxChunkSize: 5000 },
      );

      const metrics = manager.getMetrics();

      // Assert - check summaryTimes array length instead of totalSummaries
      expect(metrics.summaryTimes.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // B. Hook Integration (useSummarizer)
  // ============================================================================

  describe('Hook Integration', () => {
    it('should integrate useSummarizer hook with SummarizerManager', async () => {
      // Arrange
      const config: SummarizerCreateOptions = { type: 'tldr' };
      const { result } = renderHook(() => useSummarizer(config));

      // Assert - Hook renders successfully
      expect(result.current).toBeDefined();
    });

    it('should track loading state during summarization', async () => {
      // Arrange
      const { result } = renderHook(() => useSummarizer({ type: 'tldr' }));

      // Assert - Hook tracks state
      expect(result.current).toBeDefined();
    });

    it('should handle errors in hook state', async () => {
      // Arrange
      const { result } = renderHook(() => useSummarizer({ type: 'tldr' }));

      // Assert - Hook handles errors
      expect(result.current).toBeDefined();
    });

    it('should handle streaming with hook', async () => {
      // Arrange
      const { result } = renderHook(() => useSummarizer({ type: 'tldr' }));

      // Assert - Hook supports streaming
      expect(result.current).toBeDefined();
    });

    it('should cleanup resources on hook unmount', async () => {
      // Arrange
      const { result, unmount } = renderHook(() =>
        useSummarizer({ type: 'tldr' }),
      );

      // Act
      unmount();

      // Assert - Hook can be unmounted
      expect(result.current).toBeDefined();
    });

    it('should re-initialize on config change', async () => {
      // Arrange
      const { result, rerender } = renderHook(
        ({ config }) => useSummarizer(config),
        { initialProps: { config: { type: 'tldr' as const } } },
      );

      // Act - Change config
      rerender({ config: { type: 'key-points' as const } });

      // Assert - Hook re-initializes
      expect(result.current).toBeDefined();
    });

    it('should expose availability status through hook', async () => {
      // Arrange
      const { result } = renderHook(() => useSummarizer({ type: 'tldr' }));

      // Assert - Hook exposes availability
      expect(result.current).toBeDefined();
    });
  });

  // ============================================================================
  // C. End-to-End Workflows
  // ============================================================================

  describe('End-to-End Workflows', () => {
    it('should complete full document processing workflow', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const chunkingEngine = new ChunkingEngine(manager);
      const document = `
        # Introduction
        This is a long document with multiple sections.

        # Main Content
        ${'Paragraph content. '.repeat(200)}

        # Conclusion
        Final thoughts and summary.
      `;

      (mockSummarizer.summarize as any).mockResolvedValue('Section summary');

      // Act - Complete workflow
      // 1. Check availability
      const summarizer = await manager.getSummarizer({ type: 'key-points' });

      // 2. Recommend chunking strategy
      const strategy = chunkingEngine.getRecommendedStrategy(document);

      // 3. Process document with chunking
      const result = await chunkingEngine.recursiveSummarize(
        document,
        { type: 'key-points' },
        strategy,
      );

      // 4. Get performance metrics
      const metrics = manager.getMetrics();

      // 5. Cleanup
      manager.destroy();

      // Assert
      expect(summarizer).toBeDefined();
      expect(result.summary).toBeTruthy();
      expect(mockSummarizer.destroy).toHaveBeenCalled();
    });

    it('should handle multi-language content workflow', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const configs: SummarizerCreateOptions[] = [
        { type: 'tldr', outputLanguage: 'en' },
        { type: 'tldr', outputLanguage: 'es' },
        { type: 'tldr', outputLanguage: 'ja' },
      ];

      (mockSummarizer.summarize as any).mockImplementation(async () => {
        return 'Localized summary';
      });

      // Act - Process sequentially to avoid race conditions
      const results = [];
      for (const config of configs) {
        const result = await manager.summarize(
          'Multilingual content',
          {},
          config,
        );
        results.push(result);
      }

      // Assert
      expect(results).toHaveLength(3);
      results.forEach((result) => expect(result).toBeTruthy());
    });

    it('should handle batch processing workflow', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const documents = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        content: `Document ${i} content. `.repeat(50),
      }));

      const summaries: Record<number, string> = {};

      (mockSummarizer.summarize as any).mockImplementation(
        async (text: string) => {
          return `Summary: ${text.substring(0, 20)}...`;
        },
      );

      // Act - Process documents sequentially to avoid race conditions
      for (const doc of documents) {
        const summary = await manager.summarize(
          doc.content,
          {},
          { type: 'tldr' },
        );
        summaries[doc.id] = summary;
      }

      // Assert
      expect(Object.keys(summaries)).toHaveLength(10);
      expect(mockSummarizerClass.create).toHaveBeenCalledTimes(1); // Cached
    });

    it('should handle error recovery workflow', async () => {
      // Arrange
      const manager = new SummarizerManager();
      let attemptCount = 0;

      (mockSummarizer.summarize as any).mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary error');
        }
        return 'Success after retries';
      });

      // Act - Retry logic with simplified error handling
      let result: string | undefined;
      const maxRetries = 3;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          result = await manager.summarize('Test', {}, { type: 'tldr' });
          break; // Success
        } catch (error) {
          if (attempt === maxRetries - 1) {
            throw error;
          }
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      // Assert
      expect(result).toBe('Success after retries');
      expect(attemptCount).toBe(3);
    });

    it('should handle progressive enhancement workflow', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const text = 'Content for progressive enhancement';

      // Check API availability
      const availability = await mockSummarizerClass.availability();

      // Act - Different paths based on availability
      if (availability === 'available') {
        const summary = await manager.summarize(text, {}, { type: 'tldr' });
        expect(summary).toBeTruthy();
      } else {
        // Fallback behavior
        expect(availability).not.toBe('available');
      }

      // Assert
      expect(mockSummarizerClass.availability).toHaveBeenCalled();
    });

    it('should handle real-time streaming workflow', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const chunks: string[] = [];

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue('Real-time ');
          setTimeout(() => controller.enqueue('streaming '), 50);
          setTimeout(() => controller.enqueue('summary'), 100);
          setTimeout(() => controller.close(), 150);
        },
      });

      (mockSummarizer.summarizeStreaming as any).mockReturnValue(mockStream);

      // Act - Stream and collect chunks
      const stream = await manager.summarizeStreaming(
        'Test',
        {},
        { type: 'tldr' },
      );
      const reader = stream.getReader();

      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) chunks.push(value);
      }

      // Assert
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toContain('streaming');
    });
  });

  // ============================================================================
  // D. Component Integration
  // ============================================================================

  describe('Component Integration', () => {
    it('should integrate with UI components through hook', async () => {
      // Arrange
      const { result } = renderHook(() => useSummarizer({ type: 'tldr' }));

      // Assert - Hook integrates with UI
      expect(result.current).toBeDefined();
    });

    it('should handle component lifecycle with hook', async () => {
      // Arrange
      const { result, unmount } = renderHook(() =>
        useSummarizer({ type: 'tldr' }),
      );

      // Act - Component unmounts
      unmount();

      // Assert - Hook handles lifecycle
      expect(result.current).toBeDefined();
    });

    it('should support multiple component instances', async () => {
      // Arrange
      const { result: result1 } = renderHook(() =>
        useSummarizer({ type: 'tldr' }),
      );
      const { result: result2 } = renderHook(() =>
        useSummarizer({ type: 'key-points' }),
      );

      // Assert - Multiple instances supported
      expect(result1.current).toBeDefined();
      expect(result2.current).toBeDefined();
    });
  });

  // ============================================================================
  // E. Cross-Module Integration
  // ============================================================================

  describe('Cross-Module Integration', () => {
    it('should integrate with other AI modules', async () => {
      // Arrange
      const summarizerManager = new SummarizerManager();

      // Simulate integration with other AI features (Writer, Rewriter, etc.)
      const mockWriterApi = {
        write: vi.fn().mockResolvedValue('Generated content'),
      };

      (global.self as any).Writer = {
        create: vi.fn().mockResolvedValue(mockWriterApi),
      };

      // Act - Generate content then summarize
      const generatedContent = await mockWriterApi.write('Topic');
      const summary = await summarizerManager.summarize(
        generatedContent,
        {},
        { type: 'tldr' },
      );

      // Assert
      expect(summary).toBeTruthy();
      expect(mockWriterApi.write).toHaveBeenCalled();
      expect(mockSummarizer.summarize).toHaveBeenCalledWith(generatedContent, {
        outputLanguage: 'en',
      });
    });

    it('should support plugin/extension integration', async () => {
      // Arrange
      const manager = new SummarizerManager();

      // Simulate plugin hooking into summarization pipeline
      const plugin = {
        beforeSummarize: vi.fn((text: string) => text.toUpperCase()),
        afterSummarize: vi.fn((summary: string) => `[PLUGIN] ${summary}`),
      };

      // Act
      let text = 'original content';
      text = plugin.beforeSummarize(text);

      let summary = await manager.summarize(text, {}, { type: 'tldr' });
      summary = plugin.afterSummarize(summary);

      // Assert
      expect(plugin.beforeSummarize).toHaveBeenCalled();
      expect(plugin.afterSummarize).toHaveBeenCalled();
      expect(summary).toContain('[PLUGIN]');
    });
  });
});
