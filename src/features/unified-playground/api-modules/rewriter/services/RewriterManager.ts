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
   * Destroy manager and cleanup resources
   */
  destroy(): void {
    if (this.instance) {
      this.destroyInstance(this.instance);
      this.instance = null;
    }
    this.config = null;
    this.setState('idle');
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
    // Validate options
    ChromeAIRewriterService.validateOptions(options);

    // Create instance
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
    console.log('📝 RewriterManager.rewriteStreaming called');
    console.log('  → Input length:', input.length, 'chars');
    console.log('  → Context:', context ? `${context.length} chars` : 'none');
    console.log('  → Signal provided:', !!signal);
    console.log('  → Signal aborted:', signal?.aborted);

    // NOTE: User activation check is done earlier in useRewriter.ts before any async operations.
    // We don't check it here because the transient activation expires after async boundaries.
    // If the activation check failed early, we wouldn't have reached this point.

    if (!this.config) {
      console.error('❌ No configuration set');
      throw new Error('Configuration not set. Call getInstance() first.');
    }

    console.log('🔧 Getting instance with config:', this.config);
    const instanceStart = Date.now();
    const instance = await this.getInstance(this.config);
    const instanceDuration = Date.now() - instanceStart;
    console.log(`✅ Instance obtained in ${instanceDuration}ms`);

    // Check signal again after getInstance (may take time)
    if (signal?.aborted) {
      console.error('❌ Signal already aborted after getInstance');
      throw new Error('Operation cancelled before streaming started');
    }

    console.log('🎯 Setting state to processing...');
    this.setState('processing');

    try {
      console.log('📡 Creating stream from instance.rewriteStreaming()...');
      const stream = ChromeAIRewriterService.rewriteStreaming(
        instance,
        input,
        context,
        signal,
      );
      console.log('✅ Stream created');

      let result = '';
      let chunkCount = 0;

      console.log('🔄 Starting to iterate over stream...');
      try {
        const reader = stream.getReader();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          chunkCount++;
          console.log(
            `📦 RewriterManager: Chunk ${chunkCount} (${value.length} chars)`,
          );

          if (signal?.aborted) {
            console.warn('⚠️ Signal aborted during streaming');
            throw new Error('Streaming cancelled by user');
          }

          result += value;
          onChunk(value);
        }
        console.log('✅ Stream iteration completed');
      } catch (streamError) {
        console.error('❌ Error during stream iteration:', streamError);
        throw streamError;
      }

      console.log(
        `✅ RewriterManager: Streaming complete (${chunkCount} chunks, ${result.length} total chars)`,
      );
      this.setState('ready');
      this.updateMetadata({ lastUsedAt: Date.now(), usageCount: 1 });

      return result;
    } catch (error: any) {
      console.error('❌ RewriterManager: Streaming error:', error);
      console.error('Signal aborted at error time:', signal?.aborted);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
      });

      this.setState('error');

      if (signal?.aborted || error?.name === 'AbortError') {
        throw new Error('Rewrite operation cancelled by user');
      }

      throw new Error(
        `Streaming rewrite failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
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

  /**
   * Check if Rewriter API is supported
   */
  static isSupported(): boolean {
    return ChromeAIRewriterService.isSupported();
  }

  /**
   * Get recommended configuration for use case
   */
  static getRecommendedConfig(
    useCase:
      | 'email-professional'
      | 'email-casual'
      | 'blog'
      | 'social'
      | 'documentation'
      | 'simplify'
      | 'formal',
  ): RewriterConfig {
    const options = ChromeAIRewriterService.getRecommendedConfig(useCase);

    const config: RewriterConfig = {
      tone: options.tone || 'as-is',
      format: options.format || 'as-is',
      length: options.length || 'as-is',
      outputLanguage: options.outputLanguage || 'en',
      sharedContext: '',
    };

    return config;
  }
}

// ============================================================================
// Export
// ============================================================================

export default RewriterManager;
