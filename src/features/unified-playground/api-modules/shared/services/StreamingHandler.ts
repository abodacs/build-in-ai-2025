/**
 * StreamingHandler - Utilities for handling streaming API responses
 *
 * Provides common functionality for processing streaming output from
 * Writer and Rewriter APIs:
 * - Chunk processing with callbacks
 * - Progress estimation
 * - Performance tracking
 * - Cancellation support
 * - Error handling
 *
 * @module StreamingHandler
 */

import type { ChunkCallback, ChunkMetadata } from '../types/writing.types';

// ============================================================================
// StreamingHandler Class
// ============================================================================

/**
 * Handler for streaming API responses
 *
 * Processes ReadableStream<string> responses from Chrome AI APIs,
 * providing progress updates, performance tracking, and error handling.
 *
 * @example
 * ```typescript
 * const stream = writer.writeStreaming(prompt);
 * const result = await StreamingHandler.processStream(
 *   stream,
 *   (chunk, metadata) => {
 *     console.log(`Chunk ${metadata.chunkIndex}: ${chunk}`);
 *     console.log(`Progress: ${metadata.progress}%`);
 *   },
 *   abortSignal
 * );
 * ```
 */
export class StreamingHandler {
  /**
   * Process a streaming response with chunk callbacks
   *
   * Iterates through stream chunks, calling the callback for each chunk
   * with metadata about progress and performance.
   *
   * @param stream - Readable stream from API
   * @param onChunk - Callback for each chunk
   * @param signal - Optional abort signal for cancellation
   * @returns Promise resolving to complete text
   * @throws Error if streaming fails or is aborted
   */
  static async processStream(
    stream: ReadableStream<string> | AsyncIterable<string>,
    onChunk: ChunkCallback,
    signal?: AbortSignal,
  ): Promise<string> {
    let fullText = '';
    let chunkIndex = 0;
    const startTime = performance.now();
    let firstChunkTime: number | null = null;

    try {
      // Handle both ReadableStream and AsyncIterable
      const iterable = this.makeIterable(stream);

      for await (const chunk of iterable) {
        // Check for abort
        if (signal?.aborted) {
          throw new Error('Stream aborted by user');
        }

        // Track first chunk time
        if (firstChunkTime === null) {
          firstChunkTime = performance.now();
        }

        // Accumulate text
        fullText += chunk;

        // Calculate progress and performance metrics
        const elapsedTime = performance.now() - startTime;
        const progress = this.estimateProgress(fullText);
        const tokensPerSecond = this.calculateTokensPerSecond(
          fullText.length,
          elapsedTime,
        );

        const metadata: ChunkMetadata = {
          chunkIndex,
          totalLength: fullText.length,
          elapsedTime,
          progress,
          tokensPerSecond,
        };

        // Call user callback
        onChunk(chunk, metadata);

        chunkIndex++;
      }

      return fullText;
    } catch (error) {
      if (error instanceof Error && error.message.includes('abort')) {
        throw error;
      }
      throw new Error(
        `Streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Process stream with simple text callback (no metadata)
   *
   * Convenience method for cases where metadata is not needed.
   *
   * @param stream - Readable stream from API
   * @param onChunk - Simple callback for each chunk
   * @param signal - Optional abort signal
   * @returns Promise resolving to complete text
   */
  static async processStreamSimple(
    stream: ReadableStream<string> | AsyncIterable<string>,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    return this.processStream(stream, (chunk) => onChunk(chunk), signal);
  }

  /**
   * Collect entire stream without callbacks
   *
   * Useful when you just need the complete result without intermediate updates.
   *
   * @param stream - Readable stream from API
   * @param signal - Optional abort signal
   * @returns Promise resolving to complete text
   */
  static async collectStream(
    stream: ReadableStream<string> | AsyncIterable<string>,
    signal?: AbortSignal,
  ): Promise<string> {
    let fullText = '';

    try {
      const iterable = this.makeIterable(stream);

      for await (const chunk of iterable) {
        if (signal?.aborted) {
          throw new Error('Stream aborted by user');
        }
        fullText += chunk;
      }

      return fullText;
    } catch (error) {
      if (error instanceof Error && error.message.includes('abort')) {
        throw error;
      }
      throw new Error(
        `Failed to collect stream: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Convert stream to async iterable if needed
   *
   * @param stream - Stream or iterable
   * @returns Async iterable
   */
  private static makeIterable(
    stream: ReadableStream<string> | AsyncIterable<string>,
  ): AsyncIterable<string> {
    // Already iterable
    if (Symbol.asyncIterator in stream) {
      return stream as AsyncIterable<string>;
    }

    // Convert ReadableStream to async iterable
    const reader = (stream as ReadableStream<string>).getReader();

    return {
      [Symbol.asyncIterator]() {
        return {
          async next() {
            const { done, value } = await reader.read();
            if (done) {
              return { done: true, value: undefined };
            }
            return { done: false, value };
          },
          async return() {
            reader.releaseLock();
            return { done: true, value: undefined };
          },
        };
      },
    };
  }

  /**
   * Estimate progress based on content analysis
   *
   * Uses heuristics to estimate how complete the output is:
   * - Word count (assuming ~250 words for medium output)
   * - Sentence completeness
   * - Paragraph structure
   *
   * @param text - Current accumulated text
   * @returns Progress percentage (0-100)
   */
  private static estimateProgress(text: string): number {
    if (!text || text.length === 0) {
      return 0;
    }

    // Heuristic 1: Word count (assuming 250 words = 100%)
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const wordProgress = Math.min((words / 250) * 100, 100);

    // Heuristic 2: Sentence completion
    // Check if last character suggests incomplete sentence
    const lastChar = text.trimEnd().slice(-1);
    const sentenceEnders = ['.', '!', '?', '\n'];
    const isCompleteSentence = sentenceEnders.includes(lastChar);

    // Heuristic 3: Paragraph structure
    const paragraphs = text.split('\n\n').filter(Boolean).length;
    const paragraphProgress = Math.min((paragraphs / 3) * 100, 100);

    // Combine heuristics (weighted)
    let progress = wordProgress * 0.7 + paragraphProgress * 0.3;

    // Cap at 95% until stream is actually complete
    // (we can't know for sure until the stream ends)
    progress = Math.min(progress, 95);

    // Adjust down if incomplete sentence
    if (!isCompleteSentence && progress > 80) {
      progress = Math.min(progress, 90);
    }

    return Math.round(progress);
  }

  /**
   * Calculate approximate tokens per second
   *
   * Uses character count as proxy for tokens
   * (rough estimate: 1 token ≈ 4 characters)
   *
   * @param characterCount - Total characters processed
   * @param elapsedTimeMs - Elapsed time in milliseconds
   * @returns Tokens per second
   */
  private static calculateTokensPerSecond(
    characterCount: number,
    elapsedTimeMs: number,
  ): number {
    if (elapsedTimeMs === 0) return 0;

    // Estimate tokens (1 token ≈ 4 characters for English)
    const estimatedTokens = characterCount / 4;

    // Calculate per second
    const tokensPerSecond = (estimatedTokens / elapsedTimeMs) * 1000;

    return Math.round(tokensPerSecond * 10) / 10; // Round to 1 decimal
  }

  /**
   * Create an abort controller and signal pair
   *
   * Convenience method for creating cancellable streams
   *
   * @returns Abort controller
   */
  static createAbortController(): AbortController {
    return new AbortController();
  }

  /**
   * Check if error is abort-related
   *
   * @param error - Error to check
   * @returns true if error is from abort
   */
  static isAbortError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes('abort') ||
        error.name === 'AbortError' ||
        error.message.includes('cancel')
      );
    }
    return false;
  }

  /**
   * Wrap stream processing with timeout
   *
   * Automatically aborts stream if it takes too long
   *
   * @param stream - Stream to process
   * @param onChunk - Chunk callback
   * @param timeoutMs - Timeout in milliseconds
   * @returns Promise resolving to complete text
   * @throws Error if timeout reached
   */
  static async processStreamWithTimeout(
    stream: ReadableStream<string> | AsyncIterable<string>,
    onChunk: ChunkCallback,
    timeoutMs: number,
  ): Promise<string> {
    const abortController = new AbortController();

    // Set timeout
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeoutMs);

    try {
      const result = await this.processStream(
        stream,
        onChunk,
        abortController.signal,
      );
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (this.isAbortError(error)) {
        throw new Error(`Stream timed out after ${timeoutMs}ms`);
      }

      throw error;
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export default StreamingHandler;
