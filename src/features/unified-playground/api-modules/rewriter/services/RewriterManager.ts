/**
 * Rewriter Manager
 *
 * High-level manager for Chrome AI Rewriter API.
 * Extends BaseWritingManager with Rewriter-specific operations.
 *
 * Features:
 * - Instance lifecycle management
 * - Configuration caching
 * - Streaming support
 * - Error handling
 * - Performance tracking integration
 *
 * @module rewriter/services/RewriterManager
 */

import { BaseWritingManager } from '../../shared/services/BaseWritingManager';
import { ChromeAIRewriterService } from './ChromeAIService';
import type { Rewriter, RewriterCreateOptions, RewriterConfig } from '../types';
import type { AvailabilityStatus } from '../../shared/types';

// ============================================================================
// Manager
// ============================================================================

/**
 * Rewriter Manager
 *
 * Manages Rewriter instance lifecycle and provides high-level operations.
 * Extends BaseWritingManager for 80% code reuse.
 */
export class RewriterManager extends BaseWritingManager<
  Rewriter,
  RewriterCreateOptions,
  RewriterConfig
> {
  /**
   * Update configuration
   */
  updateConfig(config: RewriterConfig): void {
    this.config = config;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.destroy();
  }

  /**
   * Get API name for error messages
   */
  getAPIName(): string {
    return 'Rewriter';
  }

  /**
   * Create Rewriter instance
   */
  async createInstance(options: RewriterCreateOptions): Promise<Rewriter> {
    return await ChromeAIRewriterService.createInstance(options);
  }

  /**
   * Check Rewriter availability
   */
  async checkAvailability(): Promise<AvailabilityStatus> {
    return await ChromeAIRewriterService.checkAvailability();
  }

  /**
   * Convert configuration to API options
   */
  protected configToOptions(config: RewriterConfig): RewriterCreateOptions {
    return {
      tone: config.tone,
      format: config.format,
      length: config.length,
      outputLanguage: config.outputLanguage || 'en',
      sharedContext: config.sharedContext,
    };
  }

  /**
   * Check if configuration matches current instance
   */
  protected configMatches(config: RewriterConfig): boolean {
    if (!this.config) {
      return false;
    }

    return (
      this.config.tone === config.tone &&
      this.config.format === config.format &&
      this.config.length === config.length &&
      this.config.outputLanguage === config.outputLanguage &&
      this.config.sharedContext === config.sharedContext
    );
  }

  /**
   * Destroy instance
   */
  protected destroyInstance(instance: Rewriter): void {
    ChromeAIRewriterService.destroy(instance);
  }

  // ==========================================================================
  // Rewriter Operations
  // ==========================================================================

  /**
   * Rewrite text
   *
   * @param input - Input text to rewrite
   * @param context - Optional per-operation context
   * @param signal - Optional abort signal
   * @returns Rewritten text
   */
  async rewrite(
    input: string,
    context?: string,
    signal?: AbortSignal,
  ): Promise<string> {
    const instance = await this.getInstance(this.config!);
    return await ChromeAIRewriterService.rewrite(
      instance,
      input,
      context,
      signal,
    );
  }

  /**
   * Rewrite text with streaming
   *
   * @param input - Input text to rewrite
   * @param onChunk - Chunk callback
   * @param context - Optional per-operation context
   * @param signal - Optional abort signal
   * @returns Full rewritten text
   */
  async rewriteStreaming(
    input: string,
    onChunk: (chunk: string) => void,
    context?: string,
    signal?: AbortSignal,
  ): Promise<string> {
    const instance = await this.getInstance(this.config!);
    const stream = ChromeAIRewriterService.rewriteStreaming(
      instance,
      input,
      context,
      signal,
    );

    let result = '';

    try {
      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        result += value;
        onChunk(value);
      }

      return result;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('Rewrite operation was cancelled');
      }
      throw error;
    }
  }

  /**
   * Rewrite with automatic mode selection
   *
   * Uses streaming if a callback is provided, otherwise uses standard rewrite.
   *
   * @param input - Input text
   * @param onChunk - Optional chunk callback
   * @param context - Optional context
   * @param signal - Optional abort signal
   * @returns Rewritten text
   */
  async rewriteAuto(
    input: string,
    onChunk?: (chunk: string) => void,
    context?: string,
    signal?: AbortSignal,
  ): Promise<string> {
    if (onChunk) {
      return await this.rewriteStreaming(input, onChunk, context, signal);
    } else {
      return await this.rewrite(input, context, signal);
    }
  }

  /**
   * Batch rewrite multiple texts
   *
   * @param inputs - Array of input texts
   * @param context - Optional shared context
   * @param signal - Optional abort signal
   * @returns Array of rewritten texts
   */
  async batchRewrite(
    inputs: string[],
    context?: string,
    signal?: AbortSignal,
  ): Promise<string[]> {
    const results: string[] = [];

    for (const input of inputs) {
      if (signal?.aborted) {
        throw new Error('Batch rewrite cancelled');
      }

      const result = await this.rewrite(input, context, signal);
      results.push(result);
    }

    return results;
  }
}

// ============================================================================
// Export
// ============================================================================

export default RewriterManager;
