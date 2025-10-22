/**
 * Chrome AI Service - Writer API
 *
 * Service layer for interacting with Chrome's built-in Writer API.
 * Provides availability checking, instance creation, and error handling.
 *
 * @module writer/services/ChromeAIService
 */

import type { Writer, WriterCreateOptions } from '../types';
import type {
  AvailabilityCheckResult,
  DownloadProgress,
} from '../../shared/types';

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
 * if (result.availability === 'available') {
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
    return 'Writer' in window;
  }

  /**
   * Get Writer API reference
   *
   * @returns Writer API or null if not available
   */
  static getWriterAPI(): typeof Writer | null {
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
    'no' | 'after-download' | 'available'
  > {
    const WriterAPI = this.getWriterAPI();

    if (!WriterAPI) {
      throw new Error(
        'Writer API not supported. Requires Chrome 137+ with chrome://flags#writer-api-for-gemini-nano enabled.',
      );
    }

    try {
      const availability = await WriterAPI.availability();
      // Normalize 'readily' to 'available' for consistency
      return (availability as any) === 'readily' ? 'available' : availability;
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
          minChromeVersion: 137,
          requiredFlags: ['writer-api-for-gemini-nano'],
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
        'Writer API not supported. Requires Chrome 137+ with chrome://flags#writer-api-for-gemini-nano enabled.',
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
   * Download Writer model with progress tracking
   *
   * Creates a Writer instance which triggers the model download if needed.
   *
   * @param onProgress - Progress callback
   * @returns Promise that resolves when download completes
   */
  static async downloadModel(
    onProgress: (progress: DownloadProgress) => void,
  ): Promise<void> {
    const WriterAPI = this.getWriterAPI();

    if (!WriterAPI) {
      throw new Error('Writer API not available');
    }

    // Check availability first
    const rawAvailability = await WriterAPI.availability();
    // Normalize 'readily' to 'available' for consistency
    const availability =
      (rawAvailability as any) === 'readily' ? 'available' : rawAvailability;

    if (availability === 'available') {
      // Model is already ready, just complete immediately
      onProgress({
        loaded: 22 * 1024 * 1024,
        total: 22 * 1024 * 1024,
        percentage: 100,
        timeRemaining: 0,
      });
      return;
    }

    if (availability === 'no') {
      throw new Error('Writer API not available on this device');
    }

    // Check for user activation (required for model download)
    if (
      typeof navigator !== 'undefined' &&
      'userActivation' in navigator &&
      !(navigator as Navigator & { userActivation?: { isActive: boolean } })
        .userActivation?.isActive
    ) {
      throw new Error(
        'Model download requires user interaction (e.g., button click)',
      );
    }

    return new Promise((resolve, reject) => {
      const downloadStartTime = Date.now();
      let downloadedBytes = 0;

      // Create Writer instance with monitor to track download
      const options: WriterCreateOptions = {
        tone: 'neutral',
        format: 'plain-text',
        length: 'medium',
        outputLanguage: 'en',
        sharedContext: '',
        monitor(m: EventTarget) {
          m.addEventListener('downloadprogress', (e: Event) => {
            const customEvent = e as { loaded?: number; total?: number };
            const loaded = customEvent.loaded || 0;
            const total = customEvent.total || 22 * 1024 * 1024; // Default 22MB

            downloadedBytes = loaded;

            // Calculate download speed and time remaining
            const elapsed = Date.now() - downloadStartTime;
            const downloadSpeed = elapsed > 0 ? (loaded / elapsed) * 1000 : 0;
            const remaining = total - loaded;
            const timeRemaining =
              downloadSpeed > 0 ? Math.round(remaining / downloadSpeed) : 0;

            const progress: DownloadProgress = {
              loaded,
              total,
              percentage: (loaded / total) * 100,
              timeRemaining,
            };

            onProgress(progress);
          });
        },
      };

      WriterAPI.create(options)
        .then((writer: unknown) => {
          // Use setTimeout to ensure the final progress update is processed
          setTimeout(() => {
            // Download complete - model is ready
            onProgress({
              loaded: downloadedBytes || 22 * 1024 * 1024,
              total: 22 * 1024 * 1024,
              percentage: 100,
              timeRemaining: 0,
            });

            // Clean up the Writer instance
            if (writer && typeof writer === 'object' && 'destroy' in writer) {
              (writer as { destroy: () => void }).destroy();
            }

            resolve();
          }, 100);
        })
        .catch((error: unknown) => {
          if (error instanceof Error) {
            reject(
              new Error(
                `Model download failed: ${error.message || 'Unknown error'}`,
              ),
            );
          } else {
            reject(new Error('Model download failed: Unknown error'));
          }
        });
    });
  }

  /**
   * Check if system meets requirements
   *
   * @returns Requirements check results
   */
  static async checkSystemRequirements() {
    const userAgent = navigator.userAgent;
    const isChromeOrEdge = /Chrome|Edg/.test(userAgent);

    // Extract Chrome version
    let chromeVersion = 0;
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match?.[1]) {
      chromeVersion = parseInt(match[1], 10);
    }

    // Check storage (estimate only)
    let storageEstimate = null;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        storageEstimate = await navigator.storage.estimate();
      } catch (error) {
        console.warn('Could not estimate storage:', error);
      }
    }

    return {
      browser: {
        supported: isChromeOrEdge && chromeVersion >= 137,
        version: chromeVersion,
        requiredVersion: 137,
      },
      storage: storageEstimate
        ? {
            available: storageEstimate.quota
              ? storageEstimate.quota - (storageEstimate.usage || 0)
              : 0,
            required: 22 * 1024 * 1024, // 22MB
            sufficient: true,
          }
        : null,
      online: navigator.onLine,
    };
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
