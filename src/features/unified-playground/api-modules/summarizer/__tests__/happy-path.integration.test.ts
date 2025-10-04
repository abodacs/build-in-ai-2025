/**
 * Happy Path Integration Tests
 *
 * Tests standard workflows and expected user journeys
 * All tests should pass under normal conditions
 *
 * Coverage Target: 100% of happy paths
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

describe('Happy Path Integration Tests', () => {
  let mockSummarizer: Partial<Summarizer>;
  let mockSummarizerClass: any;

  beforeEach(() => {
    // Create mock summarizer
    mockSummarizer = {
      summarize: vi.fn().mockResolvedValue('This is a concise summary.'),
      summarizeStreaming: vi.fn(),
      destroy: vi.fn(),
    };

    mockSummarizerClass = {
      create: vi.fn().mockResolvedValue(mockSummarizer),
      availability: vi.fn().mockResolvedValue('readily'),
    };

    (global.self as any).Summarizer = mockSummarizerClass;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Basic Summarization Workflows
  // ============================================================================

  describe('Basic Summarization', () => {
    it('should summarize short text without chunking', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const text = 'This is a short text that does not need chunking. It is simple.';
      const config: SummarizerCreateOptions = {
        type: 'tldr',
        format: 'plain-text',
        length: 'short',
      };

      // Act
      const result = await manager.summarize(text, {}, config);

      // Assert
      expect(result).toBe('This is a concise summary.');
      expect(mockSummarizerClass.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tldr',
          format: 'plain-text',
          length: 'short',
        })
      );
      expect(mockSummarizer.summarize).toHaveBeenCalledWith(text, {});
    });

    it('should summarize medium text successfully', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const text = 'Lorem ipsum dolor sit amet. '.repeat(50); // ~1400 chars

      // Act
      const result = await manager.summarize(text, {}, { type: 'tldr' });

      // Assert
      expect(result).toBeTruthy();
      expect(mockSummarizer.summarize).toHaveBeenCalled();
    });

    it('should include context when provided', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const text = 'Technical documentation about AI models.';
      const options: SummarizeOptions = {
        context: 'This is for developers learning about AI',
      };

      // Act
      await manager.summarize(text, options, { type: 'tldr' });

      // Assert
      expect(mockSummarizer.summarize).toHaveBeenCalledWith(text, options);
    });
  });

  // ============================================================================
  // All Summary Types
  // ============================================================================

  describe('Summary Types', () => {
    const text = 'Sample text for summarization testing.';

    it('should generate tl;dr summary', async () => {
      // Arrange
      const manager = new SummarizerManager();
      (mockSummarizer.summarize as any).mockResolvedValue('TL;DR: Brief summary');

      // Act
      const result = await manager.summarize(text, {}, { type: 'tldr' });

      // Assert
      expect(result).toContain('summary');
      expect(mockSummarizerClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'tldr' })
      );
    });

    it('should generate key-points summary', async () => {
      // Arrange
      const manager = new SummarizerManager();
      (mockSummarizer.summarize as any).mockResolvedValue('• Point 1\n• Point 2');

      // Act
      const result = await manager.summarize(text, {}, { type: 'key-points' });

      // Assert
      expect(result).toBeTruthy();
      expect(mockSummarizerClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'key-points' })
      );
    });

    it('should generate teaser summary', async () => {
      // Arrange
      const manager = new SummarizerManager();
      (mockSummarizer.summarize as any).mockResolvedValue('Intriguing teaser...');

      // Act
      const result = await manager.summarize(text, {}, { type: 'teaser' });

      // Assert
      expect(result).toBeTruthy();
      expect(mockSummarizerClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'teaser' })
      );
    });

    it('should generate headline summary', async () => {
      // Arrange
      const manager = new SummarizerManager();
      (mockSummarizer.summarize as any).mockResolvedValue('Catchy Headline');

      // Act
      const result = await manager.summarize(text, {}, { type: 'headline' });

      // Assert
      expect(result).toBeTruthy();
      expect(mockSummarizerClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'headline' })
      );
    });
  });

  // ============================================================================
  // All Length Options
  // ============================================================================

  describe('Summary Lengths', () => {
    const text = 'Content to be summarized with different lengths.';

    it('should generate short summary', async () => {
      // Arrange
      const manager = new SummarizerManager();

      // Act
      const result = await manager.summarize(text, {}, {
        type: 'tldr',
        length: 'short',
      });

      // Assert
      expect(result).toBeTruthy();
      expect(mockSummarizerClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ length: 'short' })
      );
    });

    it('should generate medium summary', async () => {
      // Arrange
      const manager = new SummarizerManager();

      // Act
      const result = await manager.summarize(text, {}, {
        type: 'tldr',
        length: 'medium',
      });

      // Assert
      expect(result).toBeTruthy();
      expect(mockSummarizerClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ length: 'medium' })
      );
    });

    it('should generate long summary', async () => {
      // Arrange
      const manager = new SummarizerManager();

      // Act
      const result = await manager.summarize(text, {}, {
        type: 'tldr',
        length: 'long',
      });

      // Assert
      expect(result).toBeTruthy();
      expect(mockSummarizerClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ length: 'long' })
      );
    });
  });

  // ============================================================================
  // Format Options
  // ============================================================================

  describe('Output Formats', () => {
    const text = 'Content with formatting.';

    it('should generate plain-text summary', async () => {
      // Arrange
      const manager = new SummarizerManager();

      // Act
      const result = await manager.summarize(text, {}, {
        type: 'tldr',
        format: 'plain-text',
      });

      // Assert
      expect(result).toBeTruthy();
      expect(mockSummarizerClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'plain-text' })
      );
    });

    it('should generate markdown summary', async () => {
      // Arrange
      const manager = new SummarizerManager();
      (mockSummarizer.summarize as any).mockResolvedValue('# Summary\n\n**Bold** text');

      // Act
      const result = await manager.summarize(text, {}, {
        type: 'tldr',
        format: 'markdown',
      });

      // Assert
      expect(result).toBeTruthy();
      expect(mockSummarizerClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'markdown' })
      );
    });
  });

  // ============================================================================
  // Output Languages
  // ============================================================================

  describe('Output Languages', () => {
    const text = 'Multilingual content.';

    it('should generate English summary', async () => {
      // Arrange
      const manager = new SummarizerManager();

      // Act
      const result = await manager.summarize(text, {}, {
        type: 'tldr',
        outputLanguage: 'en',
      });

      // Assert
      expect(result).toBeTruthy();
      expect(mockSummarizerClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ outputLanguage: 'en' })
      );
    });

    it('should generate Spanish summary', async () => {
      // Arrange
      const manager = new SummarizerManager();
      (mockSummarizer.summarize as any).mockResolvedValue('Resumen breve');

      // Act
      const result = await manager.summarize(text, {}, {
        type: 'tldr',
        outputLanguage: 'es',
      });

      // Assert
      expect(result).toBeTruthy();
      expect(mockSummarizerClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ outputLanguage: 'es' })
      );
    });

    it('should generate Japanese summary', async () => {
      // Arrange
      const manager = new SummarizerManager();
      (mockSummarizer.summarize as any).mockResolvedValue('要約テキスト');

      // Act
      const result = await manager.summarize(text, {}, {
        type: 'tldr',
        outputLanguage: 'ja',
      });

      // Assert
      expect(result).toBeTruthy();
      expect(mockSummarizerClass.create).toHaveBeenCalledWith(
        expect.objectContaining({ outputLanguage: 'ja' })
      );
    });
  });

  // ============================================================================
  // Long Text with Chunking
  // ============================================================================

  describe('Long Text Processing', () => {
    it('should handle long text with automatic chunking', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const chunkingEngine = new ChunkingEngine(manager);
      const longText = 'Paragraph content. '.repeat(1000); // ~20k chars

      (mockSummarizer.summarize as any).mockImplementation((text: string) => {
        return Promise.resolve(`Summary of ${text.substring(0, 20)}...`);
      });

      // Act
      const result = await chunkingEngine.recursiveSummarize(
        longText,
        { type: 'tldr' },
        { type: 'recursive', maxChunkSize: 5000 }
      );

      // Assert
      expect(result.summary).toBeTruthy();
      expect(result.metadata.chunksProcessed).toBeGreaterThan(1);
      expect(result.metadata.compressionRatio).toBeGreaterThan(0);
    });

    it('should process chunks with progress tracking', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const chunkingEngine = new ChunkingEngine(manager);
      const longText = 'Content. '.repeat(2000); // ~18k chars
      const progressUpdates: number[] = [];

      (mockSummarizer.summarize as any).mockResolvedValue('Chunk summary');

      // Act
      await chunkingEngine.recursiveSummarize(
        longText,
        { type: 'tldr' },
        { type: 'recursive', maxChunkSize: 5000 },
        (current, total) => {
          progressUpdates.push((current / total) * 100);
        }
      );

      // Assert
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBeLessThanOrEqual(100);
    });
  });

  // ============================================================================
  // Streaming Summarization
  // ============================================================================

  describe('Streaming Summarization', () => {
    it('should stream summary chunks progressively', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue('First chunk. ');
          controller.enqueue('Second chunk. ');
          controller.enqueue('Final chunk.');
          controller.close();
        },
      });

      (mockSummarizer.summarizeStreaming as any).mockReturnValue(mockStream);

      // Act
      const chunks: string[] = [];
      const stream = await manager.summarizeStreaming(
        'Text to summarize',
        {},
        { type: 'tldr' }
      );

      const reader = stream.getReader();
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) chunks.push(value);
      }

      // Assert
      expect(chunks.length).toBe(3);
      expect(chunks.join('')).toContain('First chunk');
      expect(chunks.join('')).toContain('Final chunk');
    });
  });

  // ============================================================================
  // Cache Usage
  // ============================================================================

  describe('Caching Behavior', () => {
    it('should reuse cached instance for identical config', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const config: SummarizerCreateOptions = {
        type: 'tldr',
        format: 'plain-text',
        length: 'medium',
      };

      // Act
      await manager.summarize('Text 1', {}, config);
      await manager.summarize('Text 2', {}, config);
      await manager.summarize('Text 3', {}, config);

      // Assert
      expect(mockSummarizerClass.create).toHaveBeenCalledTimes(1); // Only created once
      expect(mockSummarizer.summarize).toHaveBeenCalledTimes(3); // Used 3 times
    });

    it('should track cache hit metrics', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const config = { type: 'tldr' as const };

      // Act
      await manager.getSummarizer(config);
      await manager.getSummarizer(config);
      await manager.getSummarizer(config);

      // Assert
      const metrics = manager.getMetrics();
      expect(mockSummarizerClass.create).toHaveBeenCalledTimes(1);
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // Resource Cleanup
  // ============================================================================

  describe('Resource Management', () => {
    it('should cleanup resources properly', async () => {
      // Arrange
      const manager = new SummarizerManager();
      await manager.getSummarizer({ type: 'tldr' });
      await manager.summarize('Test', {}, { type: 'tldr' });

      // Act
      manager.destroy();

      // Assert
      expect(mockSummarizer.destroy).toHaveBeenCalled();
    });

    it('should handle multiple sequential operations', async () => {
      // Arrange
      const manager = new SummarizerManager();

      // Act
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(await manager.summarize(`Text ${i}`, {}, { type: 'tldr' }));
      }

      // Assert
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeTruthy();
      });
    });
  });

  // ============================================================================
  // Complete User Journey
  // ============================================================================

  describe('Complete User Journeys', () => {
    it('should complete typical user workflow', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const userText = `
        Chrome Built-in AI provides powerful summarization capabilities.
        Developers can use these APIs to enhance their applications.
        The Summarizer API supports multiple types and formats.
      `;

      // Act - Complete workflow
      // 1. Create summarizer
      const summarizer = await manager.getSummarizer({
        type: 'key-points',
        format: 'markdown',
        length: 'medium',
      });

      // 2. Summarize text
      const summary = await manager.summarize(
        userText,
        { context: 'Technical documentation' },
        { type: 'key-points', format: 'markdown', length: 'medium' }
      );

      // 3. Get metrics
      const metrics = manager.getMetrics();

      // 4. Cleanup
      manager.destroy();

      // Assert
      expect(summarizer).toBeDefined();
      expect(summary).toBeTruthy();
      expect(metrics).toBeDefined();
      expect(mockSummarizer.destroy).toHaveBeenCalled();
    });

    it('should handle document processing workflow', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const chunkingEngine = new ChunkingEngine(manager);
      const document = 'Section content. '.repeat(500); // ~10k chars

      (mockSummarizer.summarize as any).mockResolvedValue('Section summary');

      // Act - Document processing
      // 1. Recommend strategy
      const strategy = chunkingEngine.getRecommendedStrategy(document);

      // 2. Chunk text
      const chunked = chunkingEngine.chunkText(document, strategy);

      // 3. Recursive summarize
      const result = await chunkingEngine.recursiveSummarize(
        document,
        { type: 'tldr' },
        strategy
      );

      // Assert
      expect(strategy).toBeDefined();
      expect(chunked.chunks.length).toBeGreaterThan(0);
      expect(result.summary).toBeTruthy();
      expect(result.metadata.recursionLevels).toBeGreaterThan(0);
    });
  });
});
