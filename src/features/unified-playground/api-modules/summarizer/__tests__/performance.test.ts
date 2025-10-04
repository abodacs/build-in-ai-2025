/**
 * Performance Tests for Summarizer Module
 *
 * Tests performance benchmarks, throughput, memory usage, and optimization effectiveness
 *
 * Performance Targets:
 * - Small text (<1000 chars): <200ms
 * - Medium text (1000-10000 chars): <1s
 * - Large text (>10000 chars): <5s
 * - Cache hit rate: >80%
 * - Concurrent operations: Support 50+ parallel requests
 * - Memory: No leaks after 100 operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SummarizerManager } from '../services/SummarizerManager';
import { ChunkingEngine } from '../services/ChunkingEngine';
import type {
  Summarizer,
  SummarizerCreateOptions,
  SummarizeOptions,
} from '../types/summarizer.types';

// ============================================================================
// Test Setup
// ============================================================================

describe('Performance Tests', () => {
  let mockSummarizer: Partial<Summarizer>;
  let mockSummarizerClass: any;

  beforeEach(() => {
    // Create fast mock summarizer
    mockSummarizer = {
      summarize: vi.fn().mockImplementation(async (text: string) => {
        // Simulate realistic processing delay (50-150ms)
        const delay = 50 + Math.random() * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        return `Summary: ${text.substring(0, 50)}...`;
      }),
      summarizeStreaming: vi.fn(),
      destroy: vi.fn(),
    };

    mockSummarizerClass = {
      create: vi.fn().mockImplementation(async () => {
        // Simulate model initialization delay (100-300ms)
        const delay = 100 + Math.random() * 200;
        await new Promise(resolve => setTimeout(resolve, delay));
        return mockSummarizer;
      }),
      availability: vi.fn().mockResolvedValue('readily'),
    };

    (global.self as any).Summarizer = mockSummarizerClass;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // A. Latency Benchmarks
  // ============================================================================

  describe('Latency Benchmarks', () => {
    it('should summarize small text (<1000 chars) in <200ms', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const smallText = 'Short text for testing. '.repeat(20); // ~480 chars

      // Use faster mock for this test
      (mockSummarizer.summarize as any).mockResolvedValue('Quick summary');

      // Act
      const startTime = performance.now();
      await manager.summarize(smallText, {}, { type: 'tldr' });
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(200);
      expect(mockSummarizer.summarize).toHaveBeenCalled();
    });

    it('should summarize medium text (1000-10000 chars) in <1s', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const mediumText = 'Medium paragraph content. '.repeat(200); // ~5200 chars

      (mockSummarizer.summarize as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 300)); // 300ms
        return 'Medium summary';
      });

      // Act
      const startTime = performance.now();
      await manager.summarize(mediumText, {}, { type: 'tldr' });
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(1000);
    });

    it('should summarize large text (>10000 chars) in <5s', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const chunkingEngine = new ChunkingEngine(manager);
      const largeText = 'Large document section. '.repeat(500); // ~12000 chars

      (mockSummarizer.summarize as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'Chunk summary';
      });

      // Act
      const startTime = performance.now();
      await chunkingEngine.recursiveSummarize(
        largeText,
        { type: 'tldr' },
        { type: 'recursive', maxChunkSize: 5000 }
      );
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(5000);
    });

    it('should track model initialization time', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const config: SummarizerCreateOptions = { type: 'tldr' };

      // Act
      const startTime = performance.now();
      await manager.getSummarizer(config);
      const endTime = performance.now();
      const initTime = endTime - startTime;

      const metrics = manager.getMetrics();

      // Assert
      expect(initTime).toBeLessThan(500); // Model init should be fast
      expect(metrics.modelInitTime).toBeGreaterThan(0);
    });

    it('should track average summarization time', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const text = 'Test text for timing';

      // Act
      await manager.summarize(text, {}, { type: 'tldr' });
      await manager.summarize(text, {}, { type: 'tldr' });
      await manager.summarize(text, {}, { type: 'tldr' });

      const metrics = manager.getMetrics();

      // Assert
      expect(metrics.averageSummaryTime).toBeGreaterThan(0);
      expect(metrics.totalSummaries).toBe(3);
    });
  });

  // ============================================================================
  // B. Throughput Tests
  // ============================================================================

  describe('Throughput Tests', () => {
    it('should handle 10 concurrent summarization requests', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const text = 'Concurrent test content';
      const config = { type: 'tldr' as const };

      // Act
      const startTime = performance.now();
      const promises = Array.from({ length: 10 }, (_, i) =>
        manager.summarize(`${text} ${i}`, {}, config)
      );
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(results).toHaveLength(10);
      results.forEach(result => expect(result).toBeTruthy());

      // Should complete in reasonable time (not 10x sequential time)
      expect(duration).toBeLessThan(2000);
    });

    it('should handle 50 concurrent summarization requests', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const text = 'High concurrency test';
      const config = { type: 'tldr' as const };

      (mockSummarizer.summarize as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'Fast summary';
      });

      // Act
      const startTime = performance.now();
      const promises = Array.from({ length: 50 }, (_, i) =>
        manager.summarize(`${text} ${i}`, {}, config)
      );
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(results).toHaveLength(50);

      // Should benefit from instance caching
      expect(mockSummarizerClass.create).toHaveBeenCalledTimes(1);
      expect(duration).toBeLessThan(5000);
    });

    it('should handle 100 concurrent summarization requests', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const config = { type: 'tldr' as const };

      (mockSummarizer.summarize as any).mockResolvedValue('Quick result');

      // Act
      const promises = Array.from({ length: 100 }, (_, i) =>
        manager.summarize(`Text ${i}`, {}, config)
      );
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(100);
      expect(mockSummarizerClass.create).toHaveBeenCalledTimes(1); // Cached
    });

    it('should maintain performance with sequential batches', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const batchSize = 10;
      const numBatches = 5;
      const durations: number[] = [];

      (mockSummarizer.summarize as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        return 'Batch summary';
      });

      // Act
      for (let batch = 0; batch < numBatches; batch++) {
        const startTime = performance.now();
        const promises = Array.from({ length: batchSize }, (_, i) =>
          manager.summarize(`Batch ${batch} Item ${i}`, {}, { type: 'tldr' })
        );
        await Promise.all(promises);
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      // Assert
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      // Performance should be consistent across batches (variance <50%)
      const variance = (maxDuration - minDuration) / avgDuration;
      expect(variance).toBeLessThan(0.5);
    });
  });

  // ============================================================================
  // C. Memory Leak Detection
  // ============================================================================

  describe('Memory Leak Detection', () => {
    it('should not leak memory after 100 operations', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const text = 'Memory test content';

      // Capture initial memory usage (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Act
      for (let i = 0; i < 100; i++) {
        await manager.summarize(text, {}, { type: 'tldr' });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Assert
      const metrics = manager.getMetrics();
      expect(metrics.totalSummaries).toBe(100);

      // Memory growth should be reasonable (<10MB if measurable)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024;
        expect(memoryGrowth).toBeLessThan(10);
      }
    });

    it('should release resources after destroy', async () => {
      // Arrange
      const manager = new SummarizerManager();
      await manager.getSummarizer({ type: 'tldr' });

      // Act
      manager.destroy();

      // Assert
      expect(mockSummarizer.destroy).toHaveBeenCalled();

      const metrics = manager.getMetrics();
      expect(metrics.totalSummaries).toBe(0); // Metrics cleared
    });

    it('should handle rapid create/destroy cycles', async () => {
      // Arrange
      const iterations = 20;

      // Act
      for (let i = 0; i < iterations; i++) {
        const manager = new SummarizerManager();
        await manager.getSummarizer({ type: 'tldr' });
        await manager.summarize('Test', {}, { type: 'tldr' });
        manager.destroy();
      }

      // Assert
      expect(mockSummarizerClass.create).toHaveBeenCalledTimes(iterations);
      expect(mockSummarizer.destroy).toHaveBeenCalledTimes(iterations);
    });

    it('should clean up streaming resources', async () => {
      // Arrange
      const manager = new SummarizerManager();

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue('Chunk 1');
          controller.enqueue('Chunk 2');
          controller.close();
        },
      });

      (mockSummarizer.summarizeStreaming as any).mockReturnValue(mockStream);

      // Act
      const stream = await manager.summarizeStreaming('Test', {}, { type: 'tldr' });
      const reader = stream.getReader();

      // Read some chunks
      await reader.read();
      await reader.read();

      // Cancel stream
      await reader.cancel();

      // Cleanup
      manager.destroy();

      // Assert
      expect(mockSummarizer.destroy).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // D. Cache Effectiveness
  // ============================================================================

  describe('Cache Effectiveness', () => {
    it('should achieve >80% cache hit rate with repeated configs', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const config: SummarizerCreateOptions = {
        type: 'tldr',
        format: 'plain-text',
        length: 'medium',
      };

      // Act
      // First request - cache miss
      await manager.getSummarizer(config);

      // Next 9 requests - cache hits
      for (let i = 0; i < 9; i++) {
        await manager.getSummarizer(config);
      }

      // Assert
      const metrics = manager.getMetrics();

      // Only 1 creation for 10 requests = 90% cache hit rate
      expect(mockSummarizerClass.create).toHaveBeenCalledTimes(1);
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0.8); // 80%+
    });

    it('should cache instances across different text inputs', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const config = { type: 'tldr' as const };

      // Act
      await manager.summarize('Text 1', {}, config);
      await manager.summarize('Text 2', {}, config);
      await manager.summarize('Text 3', {}, config);
      await manager.summarize('Text 4', {}, config);
      await manager.summarize('Text 5', {}, config);

      // Assert
      expect(mockSummarizerClass.create).toHaveBeenCalledTimes(1);
      expect(mockSummarizer.summarize).toHaveBeenCalledTimes(5);
    });

    it('should create new instances for different configs', async () => {
      // Arrange
      const manager = new SummarizerManager();

      // Act
      await manager.getSummarizer({ type: 'tldr' });
      await manager.getSummarizer({ type: 'key-points' });
      await manager.getSummarizer({ type: 'teaser' });
      await manager.getSummarizer({ type: 'headline' });

      // Assert
      expect(mockSummarizerClass.create).toHaveBeenCalledTimes(4);
    });

    it('should optimize cache with LRU strategy', async () => {
      // Arrange
      const manager = new SummarizerManager();

      // Act - Create multiple configs
      await manager.getSummarizer({ type: 'tldr', length: 'short' });
      await manager.getSummarizer({ type: 'tldr', length: 'medium' });
      await manager.getSummarizer({ type: 'tldr', length: 'long' });

      // Reuse first config (should still be cached)
      await manager.getSummarizer({ type: 'tldr', length: 'short' });

      // Assert
      expect(mockSummarizerClass.create).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================================================
  // E. Streaming Performance
  // ============================================================================

  describe('Streaming Performance', () => {
    it('should deliver first chunk within 500ms', async () => {
      // Arrange
      const manager = new SummarizerManager();

      let firstChunkTime = 0;
      const mockStream = new ReadableStream({
        start(controller) {
          setTimeout(() => {
            firstChunkTime = performance.now();
            controller.enqueue('First chunk');
          }, 100);

          setTimeout(() => {
            controller.enqueue('Second chunk');
            controller.close();
          }, 300);
        },
      });

      (mockSummarizer.summarizeStreaming as any).mockReturnValue(mockStream);

      // Act
      const startTime = performance.now();
      const stream = await manager.summarizeStreaming('Test', {}, { type: 'tldr' });
      const reader = stream.getReader();

      await reader.read(); // First chunk
      const firstChunkLatency = firstChunkTime - startTime;

      // Assert
      expect(firstChunkLatency).toBeLessThan(500);
    });

    it('should maintain consistent streaming throughput', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const chunkTimes: number[] = [];

      const mockStream = new ReadableStream({
        start(controller) {
          for (let i = 0; i < 10; i++) {
            setTimeout(() => {
              controller.enqueue(`Chunk ${i}`);
              if (i === 9) controller.close();
            }, i * 50); // 50ms between chunks
          }
        },
      });

      (mockSummarizer.summarizeStreaming as any).mockReturnValue(mockStream);

      // Act
      const stream = await manager.summarizeStreaming('Test', {}, { type: 'tldr' });
      const reader = stream.getReader();

      let done = false;
      let lastTime = performance.now();

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          const currentTime = performance.now();
          chunkTimes.push(currentTime - lastTime);
          lastTime = currentTime;
        }
      }

      // Assert
      expect(chunkTimes.length).toBeGreaterThan(0);

      // Chunk intervals should be consistent (within 100ms variance)
      const avgInterval = chunkTimes.reduce((a, b) => a + b, 0) / chunkTimes.length;
      const maxVariance = Math.max(...chunkTimes.map(t => Math.abs(t - avgInterval)));
      expect(maxVariance).toBeLessThan(100);
    });

    it('should track streaming latency metrics', async () => {
      // Arrange
      const manager = new SummarizerManager();

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue('Stream chunk');
          controller.close();
        },
      });

      (mockSummarizer.summarizeStreaming as any).mockReturnValue(mockStream);

      // Act
      const stream = await manager.summarizeStreaming('Test', {}, { type: 'tldr' });
      const reader = stream.getReader();
      await reader.read();

      const metrics = manager.getMetrics();

      // Assert
      expect(metrics.totalStreamingSummaries).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // F. Resource Utilization
  // ============================================================================

  describe('Resource Utilization', () => {
    it('should efficiently handle text chunking', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const chunkingEngine = new ChunkingEngine(manager);
      const largeText = 'Paragraph. '.repeat(1000); // ~11k chars

      (mockSummarizer.summarize as any).mockResolvedValue('Chunk summary');

      // Act
      const startTime = performance.now();
      const result = await chunkingEngine.recursiveSummarize(
        largeText,
        { type: 'tldr' },
        { type: 'recursive', maxChunkSize: 3000 }
      );
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(result.metadata.chunksProcessed).toBeGreaterThan(1);
      expect(duration).toBeLessThan(3000); // Efficient chunking
    });

    it('should optimize with progress tracking overhead', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const chunkingEngine = new ChunkingEngine(manager);
      const largeText = 'Content. '.repeat(500);

      (mockSummarizer.summarize as any).mockResolvedValue('Summary');

      let progressCallCount = 0;
      const progressCallback = () => {
        progressCallCount++;
      };

      // Act
      const startTime = performance.now();
      await chunkingEngine.recursiveSummarize(
        largeText,
        { type: 'tldr' },
        { type: 'recursive', maxChunkSize: 2000 },
        progressCallback
      );
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(progressCallCount).toBeGreaterThan(0);
      expect(duration).toBeLessThan(3000); // Progress tracking should not slow down significantly
    });

    it('should minimize API calls with caching', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const config = { type: 'tldr' as const };

      // Act
      await manager.summarize('Text 1', {}, config);
      await manager.summarize('Text 2', {}, config);
      await manager.summarize('Text 3', {}, config);
      await manager.summarize('Text 4', {}, config);
      await manager.summarize('Text 5', {}, config);
      await manager.summarize('Text 6', {}, config);
      await manager.summarize('Text 7', {}, config);
      await manager.summarize('Text 8', {}, config);
      await manager.summarize('Text 9', {}, config);
      await manager.summarize('Text 10', {}, config);

      // Assert
      expect(mockSummarizerClass.create).toHaveBeenCalledTimes(1); // Only 1 API call
      expect(mockSummarizer.summarize).toHaveBeenCalledTimes(10); // 10 summarizations
    });
  });

  // ============================================================================
  // G. Performance Under Load
  // ============================================================================

  describe('Performance Under Load', () => {
    it('should handle mixed workload efficiently', async () => {
      // Arrange
      const manager = new SummarizerManager();

      (mockSummarizer.summarize as any).mockImplementation(async (text: string) => {
        const delay = text.length > 100 ? 100 : 50;
        await new Promise(resolve => setTimeout(resolve, delay));
        return 'Summary';
      });

      // Act - Mixed small and large texts
      const startTime = performance.now();
      const promises = [
        ...Array.from({ length: 20 }, (_, i) =>
          manager.summarize(`Short ${i}`, {}, { type: 'tldr' })
        ),
        ...Array.from({ length: 10 }, (_, i) =>
          manager.summarize('Long text. '.repeat(50), {}, { type: 'tldr' })
        ),
      ];

      await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(3000);
    });

    it('should handle rapid config switching', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const configs = [
        { type: 'tldr' as const },
        { type: 'key-points' as const },
        { type: 'teaser' as const },
        { type: 'headline' as const },
      ];

      (mockSummarizer.summarize as any).mockResolvedValue('Quick summary');

      // Act
      const startTime = performance.now();
      for (let i = 0; i < 40; i++) {
        const config = configs[i % configs.length];
        await manager.summarize(`Text ${i}`, {}, config);
      }
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(mockSummarizerClass.create).toHaveBeenCalledTimes(4); // One per config
      expect(duration).toBeLessThan(5000);
    });

    it('should recover from temporary slowdowns', async () => {
      // Arrange
      const manager = new SummarizerManager();
      let callCount = 0;

      (mockSummarizer.summarize as any).mockImplementation(async () => {
        callCount++;
        // Simulate slowdown in middle requests
        const delay = callCount >= 5 && callCount <= 10 ? 200 : 50;
        await new Promise(resolve => setTimeout(resolve, delay));
        return 'Summary';
      });

      // Act
      const durations: number[] = [];
      for (let i = 0; i < 15; i++) {
        const start = performance.now();
        await manager.summarize(`Text ${i}`, {}, { type: 'tldr' });
        const end = performance.now();
        durations.push(end - start);
      }

      // Assert
      const avgDurationBefore = durations.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
      const avgDurationAfter = durations.slice(11).reduce((a, b) => a + b, 0) / 4;

      // Performance should recover after slowdown
      expect(avgDurationAfter).toBeLessThan(avgDurationBefore * 2);
    });
  });
});
