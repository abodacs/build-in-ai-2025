/**
 * StreamingHandler Service
 * Handles streaming translation with progress tracking
 */

import {
  type Translator,
  type StreamingOptions,
  type ChunkMetadata,
  TranslationError,
  TranslationErrorType,
} from '../types';

/**
 * StreamingHandler manages streaming translations
 *
 * Features:
 * - Streaming translation support
 * - Progress tracking
 * - Chunk callbacks
 * - Cancellation support
 */
export class StreamingHandler {
  /**
   * Perform streaming translation
   *
   * @param translator - Translator instance
   * @param text - Text to translate
   * @param options - Streaming options
   * @returns Promise resolving to full translation
   * @throws TranslationError if streaming fails
   */
  async translateStreaming(
    translator: Translator,
    text: string,
    options: StreamingOptions = {},
  ): Promise<string> {
    try {
      const stream = translator.translateStreaming(text, {
        context: options.context,
        signal: options.signal,
      });

      let fullTranslation = '';
      let chunkCount = 0;
      const startTime = Date.now();

      for await (const chunk of stream) {
        fullTranslation = chunk; // Each chunk is the full translation so far
        chunkCount++;

        // Calculate metadata
        const metadata: ChunkMetadata = {
          totalLength: fullTranslation.length,
          chunkNumber: chunkCount,
          progress: this.estimateProgress(fullTranslation, text),
        };

        // Call chunk callback
        if (options.onChunk) {
          options.onChunk(chunk, metadata);
        }

        // Call progress callback
        if (options.onProgress) {
          options.onProgress(metadata.progress);
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(
        `Streaming translation complete: ${chunkCount} chunks in ${duration}ms`,
      );

      return fullTranslation;
    } catch (error) {
      // Handle cancellation
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TranslationError(
          'Translation was cancelled',
          TranslationErrorType.CANCELLED,
          false,
          error,
        );
      }

      // Handle other errors
      throw new TranslationError(
        `Streaming translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TranslationErrorType.TRANSLATION_FAILED,
        true,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Estimate progress based on translation length vs input length
   *
   * Note: This is a rough estimate as different languages have different
   * character counts for the same meaning
   *
   * @param translated - Current translated text
   * @param original - Original text
   * @returns Progress percentage (0-99, caps at 99 until complete)
   */
  private estimateProgress(translated: string, original: string): number {
    if (!original || original.length === 0) {
      return 0;
    }

    // Calculate ratio (translated length / original length)
    // Different languages have different expansion/compression ratios
    const ratio = translated.length / original.length;

    // Convert to percentage and cap at 99% (100% only when complete)
    const progress = Math.min(ratio * 100, 99);

    return Math.round(progress);
  }

  /**
   * Calculate streaming metrics
   *
   * @param chunks - Array of chunk timestamps
   * @param totalChars - Total characters translated
   * @returns Streaming metrics
   */
  calculateMetrics(chunks: number[], totalChars: number) {
    if (chunks.length === 0) {
      return {
        firstChunkLatency: 0,
        chunkCount: 0,
        averageChunkSize: 0,
        chunksPerSecond: 0,
      };
    }

    const firstChunkLatency = chunks[0] ?? 0;
    const lastChunkTime = chunks[chunks.length - 1] ?? 0;
    const firstChunk = chunks[0] ?? 0;
    const totalTime = lastChunkTime - firstChunk;
    const chunksPerSecond =
      totalTime > 0 ? (chunks.length / totalTime) * 1000 : 0;
    const averageChunkSize = totalChars / chunks.length;

    return {
      firstChunkLatency,
      chunkCount: chunks.length,
      averageChunkSize: Math.round(averageChunkSize),
      chunksPerSecond: Math.round(chunksPerSecond * 10) / 10,
    };
  }
}

/**
 * Global singleton instance
 */
export const streamingHandler = new StreamingHandler();
