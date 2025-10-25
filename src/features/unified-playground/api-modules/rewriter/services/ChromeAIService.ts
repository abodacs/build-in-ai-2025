/**
 * Chrome AI Rewriter Service
 *
 * Low-level service for interacting with Chrome's built-in Rewriter API.
 * Handles API detection, instance creation, and error handling.
 *
 * @module rewriter/services/ChromeAIService
 */

import type {
  Rewriter,
  RewriterAPI,
  RewriterCreateOptions,
} from '../types/rewriter.types';
import type {
  AvailabilityStatus,
  AvailabilityCheckResult,
  DownloadProgress,
} from '../../shared/types';
import { normalizeAvailability } from '../../shared/utils/normalizeAvailability';

// ============================================================================
// Service
// ============================================================================

/**
 * Chrome AI Rewriter Service
 *
 * Provides low-level access to Chrome's Rewriter API with proper
 * error handling and availability checking.
 */
export class ChromeAIRewriterService {
  /**
   * Check if Rewriter API is supported
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Rewriter' in window;
  }

  /**
   * Get Rewriter API
   */
  static getAPI(): RewriterAPI {
    if (!this.isSupported()) {
      throw new Error(
        'Rewriter API is not supported in this browser. ' +
          'Requires Chrome 137+ with Rewriter API enabled via chrome://flags#rewriter-api',
      );
    }

    return (window as any).Rewriter as RewriterAPI;
  }

  /**
   * Check Rewriter availability
   *
   * @returns Availability status
   */
  static async checkAvailability(): Promise<AvailabilityStatus> {
    try {
      if (!this.isSupported()) {
        return 'no';
      }

      const api = this.getAPI();
      const status = await api.availability();

      // Normalize Chrome API status to internal AvailabilityStatus
      return normalizeAvailability(status);
    } catch {
      // Silently return 'no' on error - UI will handle messaging
      return 'no';
    }
  }

  /**
   * Create Rewriter instance
   *
   * @param options - Creation options
   * @returns Rewriter instance
   * @throws Error if creation fails
   */
  static async createInstance(
    options?: RewriterCreateOptions,
  ): Promise<Rewriter> {
    try {
      if (!this.isSupported()) {
        throw new Error(
          'Rewriter API is not supported in this browser. Please use Chrome 137+ and enable the API in chrome://flags#rewriter-api-for-gemini-nano',
        );
      }

      const api = this.getAPI();
      const instance = await api.create(options);

      return instance;
    } catch (error: any) {
      const errorMessage = error?.message?.toLowerCase() || '';

      // Enhance error messages with user-friendly guidance
      if (errorMessage.includes('user activation')) {
        throw new Error(
          'The Rewriter API requires a user interaction (like clicking a button). Please click the "Rewrite Text" button to continue.',
        );
      }

      if (errorMessage.includes('download') || errorMessage.includes('model')) {
        throw new Error(
          'AI model download required. This is a one-time process that may take a few moments. Please try again.',
        );
      }

      if (
        errorMessage.includes('not available') ||
        errorMessage.includes('not supported')
      ) {
        throw new Error(
          'Rewriter API is not available. Please enable it in Chrome Settings: chrome://flags#rewriter-api-for-gemini-nano',
        );
      }

      // Re-throw with enhanced message
      throw new Error(
        `Failed to create Rewriter: ${error?.message || 'Unknown error occurred'}`,
      );
    }
  }

  /**
   * Rewrite text
   *
   * @param instance - Rewriter instance
   * @param input - Input text
   * @param context - Optional context
   * @param signal - Optional abort signal
   * @returns Rewritten text
   */
  static async rewrite(
    instance: Rewriter,
    input: string,
    context?: string,
    signal?: AbortSignal,
  ): Promise<string> {
    try {
      const result = await instance.rewrite(input, {
        context,
        signal,
      });

      return result;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('Rewrite operation was cancelled');
      }

      throw new Error(`Rewrite failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Rewrite text with streaming
   *
   * @param instance - Rewriter instance
   * @param input - Input text
   * @param context - Optional context
   * @param signal - Optional abort signal
   * @returns ReadableStream of text chunks
   */
  static rewriteStreaming(
    instance: Rewriter,
    input: string,
    context?: string,
    signal?: AbortSignal,
  ): ReadableStream<string> {
    try {
      return instance.rewriteStreaming(input, {
        context,
        signal,
      });
    } catch (error: any) {
      throw new Error(
        `Streaming rewrite failed: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Destroy Rewriter instance
   *
   * @param instance - Rewriter instance to destroy
   */
  static destroy(instance: Rewriter): void {
    try {
      instance.destroy();
    } catch {
      // Silently fail - instance cleanup is not critical
      // Error bubbled if needed via error boundaries
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
          requiredFlags: ['rewriter-api'],
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
   * Create Rewriter with download monitoring
   *
   * @param options - Creation options with monitor
   * @param onProgress - Progress callback
   * @returns Promise resolving to Rewriter instance
   */
  static async createInstanceWithMonitoring(
    options: RewriterCreateOptions,
    onProgress: (loaded: number, total: number) => void,
  ): Promise<Rewriter> {
    const optionsWithMonitor: RewriterCreateOptions = {
      ...options,
      monitor: (m: EventTarget) => {
        m.addEventListener('downloadprogress', (e: Event) => {
          const event = e as unknown as { loaded: number; total: number };
          onProgress(event.loaded, event.total);
        });
      },
    };

    return this.createInstance(optionsWithMonitor);
  }

  /**
   * Validate Rewriter configuration
   *
   * Checks if the provided configuration is valid.
   *
   * @param options - Options to validate
   * @returns true if valid
   * @throws Error if invalid
   */
  static validateOptions(options: RewriterCreateOptions): boolean {
    // Validate tone
    if (
      options.tone &&
      !['more-formal', 'more-casual', 'as-is'].includes(options.tone)
    ) {
      throw new Error(
        `Invalid tone: ${options.tone}. Must be one of: 'more-formal', 'more-casual', 'as-is'.`,
      );
    }

    // Validate format
    if (
      options.format &&
      !['markdown', 'plain-text', 'as-is'].includes(options.format)
    ) {
      throw new Error(
        `Invalid format: ${options.format}. Must be 'markdown', 'plain-text', or 'as-is'.`,
      );
    }

    // Validate length
    if (
      options.length &&
      !['shorter', 'longer', 'as-is'].includes(options.length)
    ) {
      throw new Error(
        `Invalid length: ${options.length}. Must be 'shorter', 'longer', or 'as-is'.`,
      );
    }

    // outputLanguage validation would depend on supported languages
    // For now, just check it's a string if provided
    if (options.outputLanguage && typeof options.outputLanguage !== 'string') {
      throw new Error(
        `Invalid outputLanguage: must be a valid BCP-47 language tag (e.g., 'en', 'es', 'fr').`,
      );
    }

    return true;
  }

  /**
   * Download Rewriter model with progress tracking
   *
   * Creates a Rewriter instance which triggers the model download if needed.
   *
   * @param onProgress - Progress callback
   * @returns Promise that resolves when download completes
   */
  static async downloadModel(
    onProgress: (progress: DownloadProgress) => void,
  ): Promise<void> {
    const api = this.getAPI();

    // Check availability first
    const rawAvailability = await api.availability();

    // Check if model is already available (handles both 'available' and legacy 'readily')
    if (
      rawAvailability === 'available' ||
      (rawAvailability as any) === 'readily'
    ) {
      // Model is already ready, just complete immediately
      onProgress({
        loaded: 22 * 1024 * 1024,
        total: 22 * 1024 * 1024,
        percentage: 100,
        timeRemaining: 0,
      });
      return;
    }

    // Check if unavailable (handle both Chrome API and internal values)
    const availStr = String(rawAvailability);
    if (availStr === 'unavailable' || availStr === 'no') {
      throw new Error('Rewriter API not available on this device');
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

      // Create Rewriter instance with monitor to track download
      const options: RewriterCreateOptions = {
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

      api
        .create(options)
        .then((rewriter: unknown) => {
          // Use setTimeout to ensure the final progress update is processed
          setTimeout(() => {
            // Download complete - model is ready
            onProgress({
              loaded: downloadedBytes || 22 * 1024 * 1024,
              total: 22 * 1024 * 1024,
              percentage: 100,
              timeRemaining: 0,
            });

            // Clean up the rewriter instance
            if (
              rewriter &&
              typeof rewriter === 'object' &&
              'destroy' in rewriter
            ) {
              (rewriter as { destroy: () => void }).destroy();
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
   * @param useCase - Type of content being rewritten
   * @returns Recommended configuration
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
  ): RewriterCreateOptions {
    const configs: Record<string, RewriterCreateOptions> = {
      'email-professional': {
        tone: 'more-formal',
        format: 'plain-text',
        length: 'as-is',
        outputLanguage: 'en',
      },
      'email-casual': {
        tone: 'more-casual',
        format: 'plain-text',
        length: 'as-is',
        outputLanguage: 'en',
      },
      blog: {
        tone: 'more-casual',
        format: 'markdown',
        length: 'as-is',
        outputLanguage: 'en',
      },
      social: {
        tone: 'more-casual',
        format: 'plain-text',
        length: 'shorter',
        outputLanguage: 'en',
      },
      documentation: {
        tone: 'more-formal',
        format: 'markdown',
        length: 'as-is',
        outputLanguage: 'en',
      },
      simplify: {
        tone: 'more-casual',
        format: 'plain-text',
        length: 'shorter',
        outputLanguage: 'en',
      },
      formal: {
        tone: 'more-formal',
        format: 'plain-text',
        length: 'as-is',
        outputLanguage: 'en',
      },
    };

    return (
      configs[useCase] || {
        tone: 'as-is',
        format: 'as-is',
        length: 'as-is',
        outputLanguage: 'en',
      }
    );
  }
}

// ============================================================================
// Export
// ============================================================================

export default ChromeAIRewriterService;
