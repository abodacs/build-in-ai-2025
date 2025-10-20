/**
 * WriterManager - Writer API Manager
 *
 * Extends BaseWritingManager to provide Writer-specific functionality.
 * Manages Writer instances, configuration, and operations.
 *
 * @module writer/services/WriterManager
 */

import { BaseWritingManager } from '../../shared/services';
import { WriterChromeAIService } from './ChromeAIService';
import type {
  Writer,
  WriterCreateOptions,
  WriterConfig,
  WriteOptions,
} from '../types';
import type { AvailabilityStatus } from '../../shared/types';

// ============================================================================
// WriterManager Class
// ============================================================================

/**
 * Manager for Writer API instances
 *
 * Extends BaseWritingManager with Writer-specific operations.
 * Handles instance creation, caching, and write operations.
 *
 * @example
 * ```typescript
 * const manager = new WriterManager();
 *
 * // Get or create instance
 * const instance = await manager.getInstance({
 *   tone: 'formal',
 *   format: 'markdown',
 *   length: 'medium',
 * });
 *
 * // Write content
 * const result = await manager.write('Generate a welcome message');
 *
 * // Write with streaming
 * await manager.writeStreaming(
 *   'Generate a blog post',
 *   (chunk) => console.log(chunk)
 * );
 *
 * // Cleanup
 * manager.destroy();
 * ```
 */
export class WriterManager extends BaseWritingManager<
  Writer,
  WriterCreateOptions,
  WriterConfig
> {
  // ==========================================================================
  // Abstract Method Implementations
  // ==========================================================================

  /**
   * Get API name
   */
  getAPIName(): string {
    return 'Writer';
  }

  /**
   * Create Writer instance
   */
  async createInstance(options: WriterCreateOptions): Promise<Writer> {
    // Validate options
    WriterChromeAIService.validateOptions(options);

    // Create instance
    return await WriterChromeAIService.createWriter(options);
  }

  /**
   * Check Writer availability
   */
  async checkAvailability(): Promise<AvailabilityStatus> {
    return await WriterChromeAIService.checkAvailability();
  }

  /**
   * Convert configuration to creation options
   */
  protected configToOptions(config: WriterConfig): WriterCreateOptions {
    const options: WriterCreateOptions = {
      tone: config.tone,
      format: config.format,
      length: config.length,
      sharedContext: config.sharedContext || undefined,
    };

    // Only include outputLanguage if explicitly set (Chrome API may not support this)
    if (config.outputLanguage) {
      options.outputLanguage = config.outputLanguage;
    }

    return options;
  }

  /**
   * Check if configuration matches current instance config
   */
  protected configMatches(config: WriterConfig): boolean {
    if (!this.config) {
      return false;
    }

    // Compare all fields including optional outputLanguage
    return (
      this.config.tone === config.tone &&
      this.config.format === config.format &&
      this.config.length === config.length &&
      this.config.outputLanguage === config.outputLanguage && // Works for undefined === undefined
      this.config.sharedContext === config.sharedContext
    );
  }

  // ==========================================================================
  // Writer-Specific Operations
  // ==========================================================================

  /**
   * Write content (non-streaming)
   *
   * @param prompt - Writing prompt
   * @param context - Optional context
   * @param signal - Optional abort signal
   * @returns Promise resolving to generated content
   *
   * @example
   * ```typescript
   * const result = await manager.write(
   *   'Write a welcome message for our new users',
   *   'For a tech startup website'
   * );
   * console.log(result);
   * ```
   */
  async write(
    prompt: string,
    context?: string,
    signal?: AbortSignal,
  ): Promise<string> {
    // NOTE: User activation check is done earlier in useWriter.ts before any async operations.
    // We don't check it here because the transient activation expires after async boundaries.

    if (!this.config) {
      throw new Error('Configuration not set. Call getInstance() first.');
    }

    const instance = await this.getInstance(this.config);

    this.setState('processing');

    try {
      const options: WriteOptions = {
        context,
        signal,
      };

      const result = await instance.write(prompt, options);

      this.setState('ready');
      this.updateMetadata({ lastUsedAt: Date.now(), usageCount: 1 });

      return result;
    } catch (error) {
      this.setState('error');

      if (signal?.aborted) {
        throw new Error('Write operation cancelled by user');
      }

      throw new Error(
        `Write failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Write content with streaming
   *
   * @param prompt - Writing prompt
   * @param onChunk - Callback for each chunk
   * @param context - Optional context
   * @param signal - Optional abort signal
   * @returns Promise resolving to complete text
   *
   * @example
   * ```typescript
   * let fullText = '';
   * const result = await manager.writeStreaming(
   *   'Write a blog post about AI',
   *   (chunk) => {
   *     fullText += chunk;
   *     console.log('Received chunk:', chunk);
   *   },
   *   'For a tech blog audience'
   * );
   * console.log('Complete text:', result);
   * ```
   */
  async writeStreaming(
    prompt: string,
    onChunk: (chunk: string) => void,
    context?: string,
    signal?: AbortSignal,
  ): Promise<string> {
    console.log('📝 WriterManager.writeStreaming called');
    console.log('  → Prompt length:', prompt.length, 'chars');
    console.log('  → Context:', context ? `${context.length} chars` : 'none');
    console.log('  → Signal provided:', !!signal);
    console.log('  → Signal aborted:', signal?.aborted);

    // NOTE: User activation check is done earlier in useWriter.ts before any async operations.
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
      const options: WriteOptions = {
        context,
        signal,
      };

      console.log('📡 Creating stream from instance.writeStreaming()...');
      console.log('  → Options:', { context: !!context, signal: !!signal });
      const stream = instance.writeStreaming(prompt, options);
      console.log('✅ Stream created, type:', typeof stream);
      console.log(
        '  → Is async iterable:',
        Symbol.asyncIterator in Object(stream),
      );

      let result = '';
      let chunkCount = 0;

      console.log('🔄 Starting to iterate over stream...');
      try {
        for await (const chunk of stream) {
          chunkCount++;
          console.log(
            `📦 WriterManager: Chunk ${chunkCount} (${chunk.length} chars)`,
          );

          if (signal?.aborted) {
            console.warn('⚠️ Signal aborted during streaming');
            throw new Error('Streaming cancelled by user');
          }

          result += chunk;
          onChunk(chunk);
        }
        console.log('✅ Stream iteration completed');
      } catch (streamError) {
        console.error('❌ Error during stream iteration:', streamError);
        throw streamError;
      }

      console.log(
        `✅ WriterManager: Streaming complete (${chunkCount} chunks, ${result.length} total chars)`,
      );
      this.setState('ready');
      this.updateMetadata({ lastUsedAt: Date.now(), usageCount: 1 });

      return result;
    } catch (error) {
      console.error('❌ WriterManager: Streaming error:', error);
      console.error('Signal aborted at error time:', signal?.aborted);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
      });

      this.setState('error');

      if (signal?.aborted) {
        throw new Error('Write operation cancelled by user');
      }

      throw new Error(
        `Streaming write failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Write with automatic streaming decision
   *
   * Automatically chooses streaming based on prompt complexity.
   *
   * @param prompt - Writing prompt
   * @param onChunk - Optional callback for streaming
   * @param context - Optional context
   * @param signal - Optional abort signal
   * @returns Promise resolving to generated content
   */
  async writeAuto(
    prompt: string,
    onChunk?: (chunk: string) => void,
    context?: string,
    signal?: AbortSignal,
  ): Promise<string> {
    // Estimate if streaming would be beneficial
    // Use streaming for longer prompts or if callback provided
    const wordCount = prompt.trim().split(/\s+/).length;
    const useStreaming = wordCount > 20 || !!onChunk;

    if (useStreaming && onChunk) {
      return this.writeStreaming(prompt, onChunk, context, signal);
    } else {
      return this.write(prompt, context, signal);
    }
  }

  /**
   * Batch write operations
   *
   * Write multiple prompts efficiently by reusing the same instance.
   *
   * @param prompts - Array of prompts to write
   * @param onProgress - Optional progress callback
   * @param context - Optional shared context
   * @returns Promise resolving to array of results
   *
   * @example
   * ```typescript
   * const results = await manager.batchWrite(
   *   [
   *     'Write a welcome message',
   *     'Write a goodbye message',
   *     'Write a thank you message',
   *   ],
   *   (completed, total) => {
   *     console.log(`Progress: ${completed}/${total}`);
   *   }
   * );
   * ```
   */
  async batchWrite(
    prompts: string[],
    onProgress?: (completed: number, total: number) => void,
    context?: string,
  ): Promise<string[]> {
    if (!this.config) {
      throw new Error('Configuration not set. Call getInstance() first.');
    }

    const instance = await this.getInstance(this.config);
    const results: string[] = [];

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      if (!prompt) continue;

      try {
        const result = await instance.write(prompt, { context });
        results.push(result);

        if (onProgress) {
          onProgress(i + 1, prompts.length);
        }
      } catch (error) {
        console.error(`Failed to write prompt ${i}:`, error);
        results.push(''); // Empty result for failed prompts
      }
    }

    this.updateMetadata({ lastUsedAt: Date.now(), usageCount: prompts.length });

    return results;
  }

  /**
   * Check if Writer API is supported
   */
  static isSupported(): boolean {
    return WriterChromeAIService.isSupported();
  }

  /**
   * Get recommended configuration for use case
   */
  static getRecommendedConfig(
    useCase:
      | 'email'
      | 'blog'
      | 'social'
      | 'documentation'
      | 'creative'
      | 'business',
  ): WriterConfig {
    const options = WriterChromeAIService.getRecommendedConfig(useCase);

    const config: WriterConfig = {
      tone: options.tone || 'neutral',
      format: options.format || 'plain-text',
      length: options.length || 'medium',
      sharedContext: '',
    };

    // Only include outputLanguage if provided
    if (options.outputLanguage) {
      config.outputLanguage = options.outputLanguage;
    }

    return config;
  }
}

// ============================================================================
// Export
// ============================================================================

export default WriterManager;
