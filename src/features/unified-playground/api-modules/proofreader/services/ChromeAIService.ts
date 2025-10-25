/**
 * Chrome AI Proofreader Service
 *
 * Low-level wrapper for Chrome's built-in Proofreader API.
 * Handles direct interaction with the Chrome AI API.
 *
 * Features:
 * - API availability checking
 * - Instance creation
 * - Proofreading operations
 * - Error handling
 *
 * @module proofreader/services/ChromeAIService
 */

import type {
  Proofreader,
  ProofreaderAPI,
  ProofreaderCreateOptions,
  ProofreadOptions,
  ProofreadResult,
} from '../types';
import type { AvailabilityStatus, DownloadProgress } from '../../shared/types';
import { normalizeAvailability } from '../../shared/utils/normalizeAvailability';

// ============================================================================
// Chrome AI Service
// ============================================================================

/**
 * Chrome AI Proofreader Service
 *
 * Provides low-level access to Chrome's Proofreader API
 */
export class ChromeAIProofreaderService {
  // Download tracking properties
  private static downloadStartTime: number | null = null;
  private static downloadedBytes: number = 0;
  private static downloadSpeed: number = 0; // bytes per second

  /**
   * Check if Proofreader API is supported in current browser
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Proofreader' in window;
  }

  /**
   * Get Proofreader API reference
   * @throws Error if API is not supported
   */
  private static getAPI(): ProofreaderAPI {
    if (!this.isSupported()) {
      throw new Error(
        'Proofreader API is not supported in this browser. ' +
          'Chrome 141-145 required with chrome://flags#proofreader-api-for-gemini-nano enabled and Origin Trial enabled. ' +
          'Visit chrome://on-device-internals to check status.',
      );
    }

    return (window as any).Proofreader as ProofreaderAPI;
  }

  /**
   * Check Proofreader API availability
   *
   * Maps Chrome AI availability status to standard AvailabilityStatus
   *
   * Chrome API values:
   * - "unavailable" → "no"
   * - "downloadable" → "after-download"
   * - "downloading" → "after-download"
   * - "available" → "available"
   * - "readily" (legacy) → "available"
   *
   * @returns Availability status
   */
  static async checkAvailability(): Promise<AvailabilityStatus> {
    try {
      if (!this.isSupported()) {
        return 'no';
      }

      const api = this.getAPI();

      // Check current availability status
      const status = await api.availability({
        correctionExplanationLanguage: 'en',
      });
      console.log('[ChromeAIProofreaderService] Availability status:', status);

      // Normalize Chrome API status to internal AvailabilityStatus
      return normalizeAvailability(status);
    } catch (error: unknown) {
      console.error(
        '[ChromeAIProofreaderService] Availability check failed:',
        error,
      );
      return 'no';
    }
  }

  /**
   * Validate Proofreader create options
   *
   * @param options - Options to validate
   * @throws Error if options are invalid
   */
  static validateOptions(options: ProofreaderCreateOptions): void {
    if (options.expectedInputLanguages) {
      if (!Array.isArray(options.expectedInputLanguages)) {
        throw new Error('expectedInputLanguages must be an array');
      }

      if (options.expectedInputLanguages.length === 0) {
        throw new Error('expectedInputLanguages cannot be empty');
      }

      const validLanguages = [
        'en',
        'es',
        'fr',
        'de',
        'it',
        'pt',
        'ja',
        'ko',
        'zh',
      ];
      for (const lang of options.expectedInputLanguages) {
        if (!validLanguages.includes(lang)) {
          throw new Error(
            `Invalid language code: ${lang}. Must be one of: ${validLanguages.join(', ')}`,
          );
        }
      }
    }
  }

  /**
   * Format bytes to human-readable size
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Create Proofreader instance
   *
   * Handles downloadable state by attaching a monitor to track download progress.
   * According to Chrome AI documentation:
   * - If availability() returns "downloadable", listen for download progress
   * - User activation is required to trigger download
   *
   * @param options - Creation options
   * @returns Proofreader instance
   * @throws Error if creation fails
   */
  static async createInstance(
    options: ProofreaderCreateOptions = {},
  ): Promise<Proofreader> {
    try {
      // Validate options
      this.validateOptions(options);

      // Get API
      const api = this.getAPI();

      // Check availability first
      const rawAvailability = await api.availability({
        correctionExplanationLanguage:
          options.correctionExplanationLanguage || 'en',
      });

      console.log(
        '[ChromeAIProofreaderService] Raw availability:',
        rawAvailability,
      );

      if (rawAvailability === 'unavailable') {
        throw new Error(
          'Proofreader API is not available. ' +
            'This could be due to: \n' +
            '1. Chrome version < 141 (Origin Trial period: Chrome 141-145)\n' +
            '2. Origin Trial not enabled for your domain\n' +
            '3. Insufficient storage space (22GB+ required)\n' +
            '4. Unsupported platform (mobile devices not supported)\n' +
            'Check chrome://on-device-internals for details.',
        );
      }

      // If downloadable or downloading, add monitor to track download progress
      if (
        rawAvailability === 'downloadable' ||
        rawAvailability === 'downloading'
      ) {
        console.log(
          '[ChromeAIProofreaderService] Model needs to be downloaded. Attaching monitor...',
        );

        // Check for user activation (required to trigger download)
        if (
          typeof navigator !== 'undefined' &&
          'userActivation' in navigator &&
          !(navigator as Navigator & { userActivation?: { isActive: boolean } })
            .userActivation?.isActive
        ) {
          console.warn(
            '[ChromeAIProofreaderService] User activation required for model download',
          );
          throw new Error(
            'Model download requires user interaction (e.g., button click). Please try again after clicking a button.',
          );
        }

        // Add monitor if not already provided
        if (!options.monitor) {
          options = {
            ...options,
            monitor(m: EventTarget) {
              console.log(
                '[ChromeAIProofreaderService] Download monitor attached',
              );

              m.addEventListener('downloadprogress', (e: Event) => {
                const customEvent = e as { loaded?: number; total?: number };
                const loaded = customEvent.loaded || 0;
                const total = customEvent.total || 22 * 1024 * 1024 * 1024;
                const percentage = ((loaded / total) * 100).toFixed(1);

                console.log(
                  `[ChromeAIProofreaderService] Download progress: ${percentage}% (${ChromeAIProofreaderService.formatBytes(loaded)} / ${ChromeAIProofreaderService.formatBytes(total)})`,
                );
              });

              m.addEventListener('downloadcomplete', () => {
                console.log('[ChromeAIProofreaderService] Download complete!');
              });

              m.addEventListener('downloaderror', (e: Event) => {
                const errorEvent = e as { detail?: { message?: string } };
                console.error(
                  '[ChromeAIProofreaderService] Download error:',
                  errorEvent.detail?.message || 'Unknown error',
                );
              });
            },
          };
        }
      }

      // Create instance (will trigger download if needed)
      console.log(
        '[ChromeAIProofreaderService] Creating Proofreader instance...',
        options,
      );
      const instance = await api.create(options);

      console.log(
        '[ChromeAIProofreaderService] Proofreader instance created successfully',
      );

      return instance;
    } catch (error: unknown) {
      // Enhanced error handling
      if (error instanceof Error) {
        // Don't wrap our own errors
        if (error.message.includes('Proofreader API')) {
          throw error;
        }

        // Wrap browser errors with more context
        throw new Error(
          `Failed to create Proofreader instance: ${error.message}\n` +
            'Ensure you have Chrome 141-145 with Origin Trial enabled.',
        );
      }

      throw new Error(
        'Failed to create Proofreader instance: Unknown error occurred',
      );
    }
  }

  /**
   * Proofread text
   *
   * @param instance - Proofreader instance
   * @param input - Text to proofread
   * @param context - Optional context
   * @param signal - Optional abort signal
   * @returns Proofread result with corrections
   */
  static async proofread(
    instance: Proofreader,
    input: string,
    context?: string,
    signal?: AbortSignal,
  ): Promise<ProofreadResult> {
    try {
      // Validate input
      if (!input || typeof input !== 'string') {
        throw new Error('Input must be a non-empty string');
      }

      if (input.trim().length === 0) {
        throw new Error('Input cannot be empty or whitespace only');
      }

      // Check if aborted
      if (signal?.aborted) {
        throw new Error('Proofread operation cancelled');
      }

      // Prepare options
      const options: ProofreadOptions = {
        context,
        signal,
      };

      // Execute proofread
      const result = await instance.proofread(input, options);

      console.log(
        `[ChromeAIProofreaderService] Found ${result.corrections?.length || 0} corrections`,
      );

      return result;
    } catch (error: unknown) {
      // Handle abort error
      if (
        signal?.aborted ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        throw new Error('Proofread operation cancelled by user');
      }

      if (error instanceof Error) {
        throw new Error(`Proofreading failed: ${error.message}`);
      }

      throw new Error('Proofreading failed: Unknown error occurred');
    }
  }

  /**
   * Destroy Proofreader instance
   *
   * @param instance - Instance to destroy
   */
  static destroy(instance: Proofreader): void {
    try {
      instance.destroy();
      console.log(
        '[ChromeAIProofreaderService] Proofreader instance destroyed',
      );
    } catch (error: unknown) {
      console.error(
        '[ChromeAIProofreaderService] Error destroying instance:',
        error,
      );
    }
  }

  /**
   * Download Proofreader model with progress tracking
   *
   * Creates a Proofreader instance which triggers the model download if needed.
   *
   * @param onProgress - Progress callback
   * @returns Promise that resolves when download completes
   */
  static async downloadModel(
    onProgress: (progress: DownloadProgress) => void,
  ): Promise<void> {
    const api = this.getAPI();

    // Check availability first
    const rawAvailability = await api.availability({
      correctionExplanationLanguage: 'en',
    });
    console.log(
      '[ChromeAIProofreaderService] Raw availability:',
      rawAvailability,
    );

    // Check if model is already available (handles both 'available' and legacy 'readily')
    if (
      rawAvailability === 'available' ||
      (rawAvailability as any) === 'readily'
    ) {
      console.log(
        '[ChromeAIProofreaderService] Model already available, no download needed',
      );
      // Model is already ready, just complete immediately
      onProgress({
        loaded: 22 * 1024 * 1024 * 1024,
        total: 22 * 1024 * 1024 * 1024,
        percentage: 100,
        timeRemaining: 0,
      });
      return;
    }

    if (rawAvailability === 'unavailable') {
      throw new Error('Proofreader API not available on this device');
    }

    // Check for user activation (required for model download)
    if (
      typeof navigator !== 'undefined' &&
      'userActivation' in navigator &&
      !(navigator as Navigator & { userActivation?: { isActive: boolean } })
        .userActivation?.isActive
    ) {
      console.warn(
        '[ChromeAIProofreaderService] User activation required for model download',
      );
      throw new Error(
        'Model download requires user interaction (e.g., button click)',
      );
    }

    console.log('[ChromeAIProofreaderService] Starting model download...');

    return new Promise((resolve, reject) => {
      this.downloadStartTime = Date.now();
      this.downloadedBytes = 0;

      // Create Proofreader instance with monitor to track download
      const options: ProofreaderCreateOptions = {
        expectedInputLanguages: ['en'],
        correctionExplanationLanguage: 'en',
        monitor(m: EventTarget) {
          console.log('[ChromeAIProofreaderService] Monitor callback invoked');
          // Download progress event
          m.addEventListener('downloadprogress', (e: Event) => {
            const customEvent = e as { loaded?: number; total?: number };
            console.log('[ChromeAIProofreaderService] Download progress:', {
              loaded: customEvent.loaded,
              total: customEvent.total,
            });

            const loaded = customEvent.loaded || 0;
            const total = customEvent.total || 22 * 1024 * 1024 * 1024; // Default 22GB

            // Calculate download speed
            const elapsed =
              Date.now() -
              (ChromeAIProofreaderService.downloadStartTime || Date.now());
            if (elapsed > 0) {
              ChromeAIProofreaderService.downloadSpeed =
                (loaded / elapsed) * 1000; // bytes per second
            }

            // Update downloaded bytes
            ChromeAIProofreaderService.downloadedBytes = loaded;

            const progress: DownloadProgress = {
              loaded,
              total,
              percentage: (loaded / total) * 100,
              speed: ChromeAIProofreaderService.downloadSpeed,
              timeRemaining: ChromeAIProofreaderService.calculateTimeRemaining(
                loaded,
                total,
              ),
            };

            onProgress(progress);
          });
        },
      };

      console.log(
        '[ChromeAIProofreaderService] Calling Proofreader.create with options:',
        {
          expectedInputLanguages: options.expectedInputLanguages,
          includeCorrectionTypes: options.includeCorrectionTypes,
          includeCorrectionExplanations: options.includeCorrectionExplanations,
          correctionExplanationLanguage: options.correctionExplanationLanguage,
          hasMonitor: !!options.monitor,
        },
      );

      // Create a timeout promise that rejects after 5 minutes (300 seconds)
      // Model download is ~22GB and can take several minutes on slower connections
      const DOWNLOAD_TIMEOUT = 5 * 60 * 1000; // 5 minutes
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              'Model download timed out after 5 minutes. Please check your internet connection and try again. If the download started, it may still be running in the background - try refreshing the page in a few minutes.',
            ),
          );
        }, DOWNLOAD_TIMEOUT);
      });

      // Race between create and timeout
      Promise.race([api.create(options), timeoutPromise])
        .then((proofreader: unknown) => {
          console.log(
            '[ChromeAIProofreaderService] Proofreader created successfully',
          );
          console.log(
            '[ChromeAIProofreaderService] Final downloaded bytes:',
            ChromeAIProofreaderService.downloadedBytes,
          );

          // Use setTimeout to ensure the final progress update is processed
          setTimeout(() => {
            // Download complete - model is ready
            onProgress({
              loaded:
                ChromeAIProofreaderService.downloadedBytes ||
                22 * 1024 * 1024 * 1024,
              total: 22 * 1024 * 1024 * 1024,
              percentage: 100,
              timeRemaining: 0,
            });

            // Clean up the proofreader instance
            if (
              proofreader &&
              typeof proofreader === 'object' &&
              'destroy' in proofreader
            ) {
              console.log(
                '[ChromeAIProofreaderService] Destroying proofreader instance',
              );
              (proofreader as { destroy: () => void }).destroy();
            }

            console.log('[ChromeAIProofreaderService] Resolving promise');
            resolve();
          }, 100);
        })
        .catch((error: unknown) => {
          console.error('[ChromeAIProofreaderService] Download failed:', error);
          if (error instanceof Error) {
            console.error('[ChromeAIProofreaderService] Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack,
            });
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
   * Calculate estimated time remaining for download
   *
   * @param loaded - Bytes downloaded
   * @param total - Total bytes
   * @returns Estimated seconds remaining
   */
  private static calculateTimeRemaining(loaded: number, total: number): number {
    if (loaded === 0 || this.downloadSpeed === 0) {
      return 0;
    }

    const remaining = total - loaded;
    const timeRemaining = remaining / this.downloadSpeed; // seconds

    return Math.round(timeRemaining);
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
        supported: isChromeOrEdge && chromeVersion >= 141,
        version: chromeVersion,
        requiredVersion: 141,
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
   * Get error user message
   *
   * @param error - Error object
   * @returns User-friendly error message
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // API not supported
      if (error.message.includes('not supported')) {
        return 'Proofreader API is not supported in this browser. Chrome 141-145 required with chrome://flags#proofreader-api-for-gemini-nano enabled.';
      }

      // API not available
      if (error.message.includes('not available')) {
        return 'Proofreader API is not available. Check chrome://on-device-internals for details.';
      }

      // Model download required
      if (error.message.includes('after-download')) {
        return 'Proofreader model needs to be downloaded. This requires 22GB+ storage and unmetered connection.';
      }

      // Cancelled
      if (error.message.includes('cancelled') || error.name === 'AbortError') {
        return 'Proofreading was cancelled.';
      }

      // Invalid input
      if (error.message.includes('Input')) {
        return error.message;
      }

      // Generic error with message
      return `Proofreading error: ${error.message}`;
    }

    return 'An unexpected error occurred during proofreading';
  }
}

// ============================================================================
// Export
// ============================================================================

export default ChromeAIProofreaderService;
