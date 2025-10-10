/**
 * PerformanceTracker - Performance Monitoring Utility
 *
 * Tracks and calculates performance metrics for Writer and Rewriter operations.
 * Provides accurate timing, throughput, and quality measurements.
 *
 * Features:
 * - High-precision timing
 * - Token/second calculation
 * - First chunk latency tracking
 * - Quality estimation
 * - Multiple concurrent trackers
 *
 * @module PerformanceTracker
 */

import type { PerformanceMetrics, PerformanceTrackerState } from '../types';

// ============================================================================
// PerformanceTracker Class
// ============================================================================

/**
 * Performance tracker for API operations
 *
 * Tracks timing and throughput metrics for operations.
 * Can be used for both streaming and non-streaming operations.
 *
 * @example
 * ```typescript
 * // Non-streaming operation
 * const tracker = new PerformanceTracker();
 * tracker.start();
 *
 * const result = await writer.write(prompt);
 *
 * tracker.end(result);
 * const metrics = tracker.getMetrics();
 * console.log(`Duration: ${metrics.duration}ms`);
 *
 * // Streaming operation
 * const tracker = new PerformanceTracker();
 * tracker.start();
 *
 * const stream = writer.writeStreaming(prompt);
 * for await (const chunk of stream) {
 *   if (!tracker.hasFirstChunk()) {
 *     tracker.markFirstChunk();
 *   }
 *   tracker.addChunk(chunk);
 * }
 *
 * tracker.end();
 * const metrics = tracker.getMetrics();
 * ```
 */
export class PerformanceTracker {
  private state: PerformanceTrackerState;

  constructor() {
    this.state = {
      startTime: 0,
      endTime: undefined,
      firstChunkTime: undefined,
      chunkCount: 0,
      outputLength: 0,
    };
  }

  /**
   * Start tracking
   */
  start(): void {
    this.state = {
      startTime: performance.now(),
      endTime: undefined,
      firstChunkTime: undefined,
      chunkCount: 0,
      outputLength: 0,
    };
  }

  /**
   * Mark first chunk received (for streaming)
   */
  markFirstChunk(): void {
    if (!this.state.firstChunkTime) {
      this.state.firstChunkTime = performance.now();
    }
  }

  /**
   * Add chunk to tracking (for streaming)
   *
   * @param chunk - Text chunk received
   */
  addChunk(chunk: string): void {
    // Mark first chunk if not already marked
    if (!this.state.firstChunkTime) {
      this.markFirstChunk();
    }

    this.state.chunkCount++;
    this.state.outputLength += chunk.length;
  }

  /**
   * End tracking
   *
   * @param output - Optional final output (for non-streaming)
   */
  end(output?: string): void {
    this.state.endTime = performance.now();

    // If output provided, calculate length
    if (output) {
      this.state.outputLength = output.length;
    }
  }

  /**
   * Check if first chunk has been received
   */
  hasFirstChunk(): boolean {
    return this.state.firstChunkTime !== undefined;
  }

  /**
   * Check if tracking has ended
   */
  hasEnded(): boolean {
    return this.state.endTime !== undefined;
  }

  /**
   * Get current metrics
   *
   * @returns Performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const duration = this.state.endTime
      ? this.state.endTime - this.state.startTime
      : performance.now() - this.state.startTime;

    const firstChunkLatency =
      this.state.firstChunkTime !== undefined
        ? this.state.firstChunkTime - this.state.startTime
        : undefined;

    // Calculate words from output length
    // Rough estimate: 1 word ≈ 5 characters
    const estimatedWords = Math.round(this.state.outputLength / 5);

    // Calculate tokens per second
    // Rough estimate: 1 token ≈ 4 characters
    const estimatedTokens = this.state.outputLength / 4;
    const tokensPerSecond =
      duration > 0 ? (estimatedTokens / duration) * 1000 : 0;

    // Estimate quality based on performance
    let quality: 'high' | 'medium' | 'low' | undefined;
    if (this.state.endTime) {
      // Quality based on tokens per second
      if (tokensPerSecond > 30) {
        quality = 'high';
      } else if (tokensPerSecond > 15) {
        quality = 'medium';
      } else if (tokensPerSecond > 0) {
        quality = 'low';
      }
    }

    return {
      duration: Math.round(duration),
      words: estimatedWords > 0 ? estimatedWords : undefined,
      characters:
        this.state.outputLength > 0 ? this.state.outputLength : undefined,
      quality,
      tokensPerSecond: tokensPerSecond > 0 ? tokensPerSecond : undefined,
      firstChunkLatency,
      totalChunks:
        this.state.chunkCount > 0 ? this.state.chunkCount : undefined,
    };
  }

  /**
   * Reset tracker to initial state
   */
  reset(): void {
    this.state = {
      startTime: 0,
      endTime: undefined,
      firstChunkTime: undefined,
      chunkCount: 0,
      outputLength: 0,
    };
  }

  /**
   * Get raw state (for debugging)
   */
  getState(): PerformanceTrackerState {
    return { ...this.state };
  }
}

// ============================================================================
// Static Helper Functions
// ============================================================================

/**
 * Track a simple operation
 *
 * Convenience function for tracking non-streaming operations.
 *
 * @param operation - Async operation to track
 * @returns Promise resolving to [result, metrics]
 *
 * @example
 * ```typescript
 * const [result, metrics] = await trackOperation(async () => {
 *   return await writer.write(prompt);
 * });
 *
 * console.log(`Duration: ${metrics.duration}ms`);
 * console.log(`Result: ${result}`);
 * ```
 */
export async function trackOperation<T>(
  operation: () => Promise<T>,
): Promise<[T, PerformanceMetrics]> {
  const tracker = new PerformanceTracker();
  tracker.start();

  try {
    const result = await operation();

    // Calculate output length if result is a string
    const output = typeof result === 'string' ? result : undefined;
    tracker.end(output);

    return [result, tracker.getMetrics()];
  } catch (error) {
    tracker.end();
    throw error;
  }
}

/**
 * Create a performance tracker wrapper function
 *
 * Returns a function that automatically tracks performance.
 *
 * @param fn - Function to wrap
 * @returns Wrapped function with tracking
 *
 * @example
 * ```typescript
 * const trackedWrite = withPerformanceTracking(async (prompt: string) => {
 *   return await writer.write(prompt);
 * });
 *
 * const [result, metrics] = await trackedWrite('Hello');
 * ```
 */
export function withPerformanceTracking<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<[TResult, PerformanceMetrics]> {
  return async (...args: TArgs) => {
    return trackOperation(() => fn(...args));
  };
}

// ============================================================================
// Export
// ============================================================================

export default PerformanceTracker;
