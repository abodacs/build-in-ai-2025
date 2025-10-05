/**
 * Chunking Engine
 *
 * Handles long content that exceeds model context limits (~10,000 characters)
 * Implements recursive, sliding-window, and semantic chunking strategies
 *
 * @module ChunkingEngine
 */

import { SummarizerManager } from './SummarizerManager';
import { ErrorHandler } from './ErrorHandler';
import type {
  ChunkingStrategy,
  ChunkingResult,
  ChunkingMetadata,
  RecursiveSummaryResult,
  RecursiveSummaryMetadata,
  ChunkProgressCallback,
} from '../types/chunking.types';
import type { SummarizerCreateOptions } from '../types/summarizer.types';

// ============================================================================
// Chunking Engine Class
// ============================================================================

export class ChunkingEngine {
  private manager: SummarizerManager;
  private defaultMaxChunkSize = 10000; // ~10k characters (safe for most models)

  constructor(manager?: SummarizerManager) {
    this.manager = manager || new SummarizerManager();
  }

  // ============================================================================
  // Main Chunking Methods
  // ============================================================================

  /**
   * Chunk text based on strategy
   *
   * @param {string} text - Text to chunk
   * @param {ChunkingStrategy} strategy - Chunking strategy
   * @returns {ChunkingResult} Chunked text with metadata
   */
  chunkText(text: string, strategy: ChunkingStrategy): ChunkingResult {
    const startTime = performance.now();

    let chunks: string[];

    switch (strategy.type) {
      case 'recursive':
        chunks = this.recursiveChunk(text, strategy.maxChunkSize);
        break;

      case 'sliding-window':
        chunks = this.slidingWindowChunk(
          text,
          strategy.maxChunkSize,
          strategy.overlapSize || 500,
        );
        break;

      case 'semantic':
        chunks = this.semanticChunk(
          text,
          strategy.maxChunkSize,
          strategy.semanticSeparators || ['\n\n', '\n', '. '],
        );
        break;

      default:
        chunks = this.recursiveChunk(text, strategy.maxChunkSize);
    }

    const metadata: ChunkingMetadata = {
      originalLength: text.length,
      chunkCount: chunks.length,
      strategy: strategy.type,
      estimatedProcessingTime: this.estimateProcessingTime(chunks),
      averageChunkSize:
        chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length,
    };

    console.log(
      `[ChunkingEngine] Created ${chunks.length} chunks using ${strategy.type} strategy in ${(performance.now() - startTime).toFixed(2)}ms`,
    );

    return { chunks, metadata };
  }

  /**
   * Recursive summarization for long content
   * Summarizes chunks, then recursively summarizes summaries if needed
   *
   * @param {string} text - Text to summarize
   * @param {SummarizerCreateOptions} config - Summarizer configuration
   * @param {ChunkingStrategy} strategy - Chunking strategy
   * @param {ChunkProgressCallback} onProgress - Progress callback
   * @returns {Promise<RecursiveSummaryResult>} Summary with metadata
   */
  async recursiveSummarize(
    text: string,
    config: SummarizerCreateOptions,
    strategy: ChunkingStrategy,
    onProgress?: ChunkProgressCallback,
  ): Promise<RecursiveSummaryResult> {
    const startTime = performance.now();
    const originalWordCount = this.countWords(text);

    // Check if chunking is needed
    if (text.length <= strategy.maxChunkSize) {
      // No chunking needed - summarize directly
      const summary = await this.manager.summarize(text, {}, config);
      const finalWordCount = this.countWords(summary);

      return {
        summary,
        metadata: {
          originalWordCount,
          finalWordCount,
          compressionRatio: originalWordCount / finalWordCount,
          processingTime: performance.now() - startTime,
          chunksProcessed: 1,
          recursionLevels: 1,
        },
      };
    }

    // Chunk the text
    const { chunks } = this.chunkText(text, strategy);
    const chunkProcessingTimes: number[] = [];

    // Level 1: Summarize each chunk
    const level1Summaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkStartTime = performance.now();

      try {
        const summary = await this.manager.summarize(chunks[i], {}, config);
        level1Summaries.push(summary);

        const chunkTime = performance.now() - chunkStartTime;
        chunkProcessingTimes.push(chunkTime);

        // Report progress
        if (onProgress) {
          onProgress(i + 1, chunks.length);
        }

        console.log(
          `[ChunkingEngine] Processed chunk ${i + 1}/${chunks.length} in ${chunkTime.toFixed(2)}ms`,
        );
      } catch (error) {
        throw ErrorHandler.handleSummarizationError(error, chunks[i].length);
      }
    }

    // Combine level 1 summaries
    const combinedSummaries = level1Summaries.join('\n\n');

    // Check if we need another level of recursion
    let finalSummary: string;
    let recursionLevels = 1;

    if (combinedSummaries.length > strategy.maxChunkSize) {
      // Need another level - recursively summarize the summaries
      console.log(
        `[ChunkingEngine] Combined summaries exceed limit (${combinedSummaries.length} chars), applying recursion...`,
      );

      const recursiveResult = await this.recursiveSummarize(
        combinedSummaries,
        config,
        strategy,
        onProgress,
      );

      finalSummary = recursiveResult.summary;
      recursionLevels = recursiveResult.metadata.recursionLevels + 1;
    } else {
      // Final summarization
      finalSummary = await this.manager.summarize(
        combinedSummaries,
        {},
        config,
      );
      recursionLevels = 2;
    }

    const finalWordCount = this.countWords(finalSummary);

    const metadata: RecursiveSummaryMetadata = {
      originalWordCount,
      finalWordCount,
      compressionRatio: originalWordCount / finalWordCount,
      processingTime: performance.now() - startTime,
      chunksProcessed: chunks.length,
      recursionLevels,
      chunkProcessingTimes,
    };

    console.log(
      `[ChunkingEngine] Recursive summarization complete: ${chunks.length} chunks, ${recursionLevels} levels, ${(performance.now() - startTime).toFixed(0)}ms`,
    );

    return { summary: finalSummary, metadata };
  }

  // ============================================================================
  // Chunking Strategies
  // ============================================================================

  /**
   * Recursive chunking - splits text hierarchically
   *
   * @param {string} text - Text to chunk
   * @param {number} maxSize - Maximum chunk size
   * @returns {string[]} Chunks
   */
  private recursiveChunk(text: string, maxSize: number): string[] {
    if (text.length <= maxSize) {
      return [text];
    }

    const chunks: string[] = [];
    const separators = ['\n\n', '\n', '. ', ' '];

    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= maxSize) {
        chunks.push(remaining);
        break;
      }

      // Try to find a good split point
      let splitIndex = -1;
      const splitText = remaining.substring(0, maxSize);

      for (const separator of separators) {
        const lastIndex = splitText.lastIndexOf(separator);
        if (lastIndex > maxSize * 0.5) {
          // Found a good split point (at least 50% into the chunk)
          splitIndex = lastIndex + separator.length;
          break;
        }
      }

      // If no good split point found, hard split at maxSize
      if (splitIndex === -1) {
        splitIndex = maxSize;
      }

      chunks.push(remaining.substring(0, splitIndex).trim());
      remaining = remaining.substring(splitIndex).trim();
    }

    return chunks;
  }

  /**
   * Sliding window chunking - creates overlapping chunks
   *
   * @param {string} text - Text to chunk
   * @param {number} maxSize - Maximum chunk size
   * @param {number} overlapSize - Overlap between chunks
   * @returns {string[]} Chunks
   */
  private slidingWindowChunk(
    text: string,
    maxSize: number,
    overlapSize: number,
  ): string[] {
    if (text.length <= maxSize) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + maxSize, text.length);
      const chunk = text.substring(start, end);

      // Try to end at a natural boundary
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('. ');
        const lastNewline = chunk.lastIndexOf('\n');
        const boundary = Math.max(lastPeriod, lastNewline);

        if (boundary > maxSize * 0.7) {
          chunks.push(chunk.substring(0, boundary + 1).trim());
          start += boundary + 1 - overlapSize;
        } else {
          chunks.push(chunk.trim());
          start += maxSize - overlapSize;
        }
      } else {
        chunks.push(chunk.trim());
        break;
      }
    }

    return chunks;
  }

  /**
   * Semantic chunking - splits at natural boundaries
   *
   * @param {string} text - Text to chunk
   * @param {number} maxSize - Maximum chunk size
   * @param {string[]} separators - Separator patterns (in priority order)
   * @returns {string[]} Chunks
   */
  private semanticChunk(
    text: string,
    maxSize: number,
    separators: string[],
  ): string[] {
    if (text.length <= maxSize) {
      return [text];
    }

    // Find the best separator that splits the text
    let bestChunks: string[] = [];

    for (const separator of separators) {
      const segments = text.split(separator);

      // Skip if separator doesn't actually split the text
      if (segments.length <= 1) {
        continue;
      }

      const chunks: string[] = [];
      let currentChunk = '';

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const testChunk = currentChunk
          ? currentChunk + separator + segment
          : segment;

        if (testChunk.length <= maxSize) {
          currentChunk = testChunk;
        } else {
          // Current chunk is full, save it
          if (currentChunk) {
            chunks.push(currentChunk.trim());
          }

          // Start new chunk with current segment
          currentChunk = segment;

          // If segment itself is too large, need to split it with next separator
          if (segment.length > maxSize) {
            // Mark that we need to try next separator or fall back
            currentChunk = segment;
          }
        }
      }

      // Add remaining chunk
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      // Filter empty chunks
      const validChunks = chunks.filter((chunk) => chunk.length > 0);

      // Check if this separator worked well
      const hasOversized = validChunks.some((chunk) => chunk.length > maxSize);

      if (!hasOversized && validChunks.length > 0) {
        // This separator worked well, use these chunks
        return validChunks;
      }

      // Keep track of best attempt so far
      if (validChunks.length > bestChunks.length) {
        bestChunks = validChunks;
      }
    }

    // If we got here, no separator worked perfectly
    // Fall back to recursive chunking if we have oversized chunks
    const oversizedChunks = bestChunks.filter(
      (chunk) => chunk.length > maxSize,
    );
    if (oversizedChunks.length > 0 || bestChunks.length === 0) {
      return this.recursiveChunk(text, maxSize);
    }

    return bestChunks;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Estimate processing time for chunks
   *
   * @param {string[]} chunks - Chunks to estimate
   * @returns {number} Estimated time in milliseconds
   */
  private estimateProcessingTime(chunks: string[]): number {
    // Rough estimate: 100ms per 1000 characters + 500ms overhead per chunk
    const totalChars = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const charTime = (totalChars / 1000) * 100;
    const overheadTime = chunks.length * 500;

    return charTime + overheadTime;
  }

  /**
   * Count words in text
   *
   * @param {string} text - Text to count
   * @returns {number} Word count
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  /**
   * Validate chunking strategy
   *
   * @param {ChunkingStrategy} strategy - Strategy to validate
   * @returns {boolean} True if valid
   */
  validateStrategy(strategy: ChunkingStrategy): boolean {
    if (
      !strategy.type ||
      !['recursive', 'sliding-window', 'semantic'].includes(strategy.type)
    ) {
      return false;
    }

    if (!strategy.maxChunkSize || strategy.maxChunkSize <= 0) {
      return false;
    }

    if (strategy.type === 'sliding-window') {
      if (
        strategy.overlapSize &&
        strategy.overlapSize >= strategy.maxChunkSize
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get recommended strategy for text
   *
   * @param {string} text - Text to analyze
   * @returns {ChunkingStrategy} Recommended strategy
   */
  getRecommendedStrategy(text: string): ChunkingStrategy {
    const length = text.length;

    // Check for clear sections (markdown headers or labeled sections)
    const hasSections =
      /^#{1,6}\s+/m.test(text) || /^[A-Z][^.!?]*:$/m.test(text);

    // Check for structure (paragraphs) - need significant paragraph breaks
    const paragraphBreaks = (text.match(/\n\n/g) || []).length;
    const hasParagraphs = paragraphBreaks > 5;

    // If text has clear structure, use semantic chunking regardless of length
    if (hasSections || hasParagraphs) {
      return {
        type: 'semantic',
        maxChunkSize: this.defaultMaxChunkSize,
        semanticSeparators: ['\n\n', '\n', '. ', '! ', '? '],
      };
    }

    // Short text without structure - no special chunking needed
    if (length <= this.defaultMaxChunkSize) {
      return {
        type: 'recursive',
        maxChunkSize: this.defaultMaxChunkSize,
      };
    }

    // Continuous text - use sliding window for better context preservation
    if (length > this.defaultMaxChunkSize * 3) {
      return {
        type: 'sliding-window',
        maxChunkSize: this.defaultMaxChunkSize,
        overlapSize: 1000,
      };
    }

    // Default to recursive
    return {
      type: 'recursive',
      maxChunkSize: this.defaultMaxChunkSize,
    };
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Clean up resources
   */
  cleanup() {
    this.manager.cleanup();
  }
}

// ============================================================================
// Export
// ============================================================================

export default ChunkingEngine;
