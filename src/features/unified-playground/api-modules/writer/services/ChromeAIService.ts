/**
 * Chrome AI Service - Writer API
 *
 * Service layer for interacting with Chrome's built-in Writer API.
 * Provides availability checking, instance creation, and error handling.
 *
 * @module writer/services/ChromeAIService
 */

import type { Writer, WriterCreateOptions } from '../types';
import type { AvailabilityCheckResult } from '../../shared/types';

// ============================================================================
// Chrome AI Service
// ============================================================================

/**
 * Service for Chrome AI Writer API integration
 *
 * Provides methods to check availability, create instances,
 * and interact with the Chrome built-in Writer API.
 *
 * @example
 * ```typescript
 * // Check if Writer API is supported
 * if (!WriterChromeAIService.isSupported()) {
 *   console.error('Writer API not supported');
 *   return;
 * }
 *
 * // Check availability
 * const result = await WriterChromeAIService.checkAvailability();
 * if (result.availability === 'readily') {
 *   const writer = await WriterChromeAIService.createWriter();
 * }
 * ```
 */
export class WriterChromeAIService {
  /**
   * Check if Writer API is supported in current environment
   *
   * @returns true if Writer API is available
   */
  static isSupported(): boolean {
    return 'Writer' in self || 'Writer' in window;
  }

  /**
   * Get Writer API reference
   *
   * @returns Writer API or null if not available
   */
  static getWriterAPI(): typeof Writer | null {
    if ('Writer' in self) {
      return (self as any).Writer;
    }
    if ('Writer' in window) {
      return (window as any).Writer;
    }
    return null;
  }

  /**
   * Check Writer API availability
   *
   * Calls the Writer.availability() method to determine if the API
   * can be used immediately, requires download, or is not available.
   *
   * @returns Promise resolving to availability status
   * @throws Error if API not supported
   */
  static async checkAvailability(): Promise<
    'no' | 'after-download' | 'readily'
  > {
    const WriterAPI = this.getWriterAPI();

    if (!WriterAPI) {
      throw new Error(
        'Writer API not supported. Requires Chrome 137+ with Writer API enabled.',
      );
    }

    try {
      const availability = await WriterAPI.availability();
      return availability;
    } catch (error) {
      console.error('Writer availability check failed:', error);
      throw new Error(
        `Failed to check Writer availability: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Check detailed availability information
   *
   * @returns Promise resolving to detailed availability info
   */
  static async checkDetailedAvailability(): Promise<AvailabilityCheckResult> {
    try {
      const availability = await this.checkAvailability();

      return {
        availability,
        isSupported: true,
        requiresDownload: availability === 'after-download',
        requirements: {
          minChromeVersion: 128,
          requiredFlags: ['writer-api'],
          other: [
            'User activation required for instance creation',
            'Model download may be required on first use',
          ],
        },
      };
    } catch (error) {
      return {
        availability: 'no',
        isSupported: false,
        requiresDownload: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a Writer instance
   *
   * Note: This requires user activation (must be called from user gesture).
   *
   * @param options - Creation options
   * @returns Promise resolving to Writer instance
   * @throws Error if creation fails
   *
   * @example
   * ```typescript
   * // Must be called from user interaction (e.g., button click)
   * button.addEventListener('click', async () => {
   *   const writer = await WriterChromeAIService.createWriter({
   *     tone: 'formal',
   *     format: 'markdown',
   *     length: 'medium',
   *   });
   *
   *   const result = await writer.write('Generate a welcome message');
   *   console.log(result);
   * });
   * ```
   */
  static async createWriter(options?: WriterCreateOptions): Promise<Writer> {
    const WriterAPI = this.getWriterAPI();

    if (!WriterAPI) {
      throw new Error(
        'Writer API not supported. Requires Chrome 137+ with Writer API enabled.',
      );
    }

    try {
      const writer = await WriterAPI.create(options);
      return writer;
    } catch (error) {
      // Handle specific error cases
      if (error instanceof Error) {
        // User activation required
        if (
          error.message.includes('user activation') ||
          error.message.includes('gesture')
        ) {
          throw new Error(
            'User activation required. Writer.create() must be called from a user gesture (e.g., button click).',
          );
        }

        // Model download required
        if (
          error.message.includes('download') ||
          error.message.includes('model')
        ) {
          throw new Error(
            'Model download required. Use the monitor callback to track download progress.',
          );
        }
      }

      // Generic error
      throw new Error(
        `Failed to create Writer instance: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Create Writer with download monitoring
   *
   * @param options - Creation options with monitor
   * @param onProgress - Progress callback
   * @returns Promise resolving to Writer instance
   */
  static async createWriterWithMonitoring(
    options: WriterCreateOptions,
    onProgress: (loaded: number, total: number) => void,
  ): Promise<Writer> {
    const optionsWithMonitor: WriterCreateOptions = {
      ...options,
      monitor: (m: EventTarget) => {
        m.addEventListener('downloadprogress', (e: Event) => {
          const event = e as unknown as { loaded: number; total: number };
          onProgress(event.loaded, event.total);
        });
      },
    };

    return this.createWriter(optionsWithMonitor);
  }

  /**
   * Validate Writer configuration
   *
   * Checks if the provided configuration is valid.
   *
   * @param options - Options to validate
   * @returns true if valid
   * @throws Error if invalid
   */
  static validateOptions(options: WriterCreateOptions): boolean {
    // Validate tone
    if (
      options.tone &&
      !['formal', 'neutral', 'casual'].includes(options.tone)
    ) {
      throw new Error(
        `Invalid tone: ${options.tone}. Must be 'formal', 'neutral', or 'casual'.`,
      );
    }

    // Validate format
    if (
      options.format &&
      !['markdown', 'plain-text'].includes(options.format)
    ) {
      throw new Error(
        `Invalid format: ${options.format}. Must be 'markdown' or 'plain-text'.`,
      );
    }

    // Validate length
    if (
      options.length &&
      !['short', 'medium', 'long'].includes(options.length)
    ) {
      throw new Error(
        `Invalid length: ${options.length}. Must be 'short', 'medium', or 'long'.`,
      );
    }

    // Validate outputLanguage
    if (
      options.outputLanguage &&
      !['en', 'es', 'ja'].includes(options.outputLanguage)
    ) {
      throw new Error(
        `Invalid outputLanguage: ${options.outputLanguage}. Must be 'en', 'es', or 'ja'.`,
      );
    }

    return true;
  }

  /**
   * Get recommended configuration for use case
   *
   * @param useCase - Type of content being generated
   * @returns Recommended configuration
   */
  static getRecommendedConfig(
    useCase:
      | 'email'
      | 'blog'
      | 'social'
      | 'documentation'
      | 'creative'
      | 'business',
  ): WriterCreateOptions {
    const configs: Record<string, WriterCreateOptions> = {
      email: {
        tone: 'formal',
        format: 'plain-text',
        length: 'short',
        outputLanguage: 'en',
      },
      blog: {
        tone: 'casual',
        format: 'markdown',
        length: 'long',
        outputLanguage: 'en',
      },
      social: {
        tone: 'casual',
        format: 'plain-text',
        length: 'short',
        outputLanguage: 'en',
      },
      documentation: {
        tone: 'neutral',
        format: 'markdown',
        length: 'long',
        outputLanguage: 'en',
      },
      creative: {
        tone: 'casual',
        format: 'markdown',
        length: 'medium',
        outputLanguage: 'en',
      },
      business: {
        tone: 'formal',
        format: 'plain-text',
        length: 'medium',
        outputLanguage: 'en',
      },
    };

    return (
      configs[useCase] || {
        tone: 'neutral',
        format: 'plain-text',
        length: 'medium',
        outputLanguage: 'en',
      }
    );
  }
}

// ============================================================================
// Export
// ============================================================================

export default WriterChromeAIService;
