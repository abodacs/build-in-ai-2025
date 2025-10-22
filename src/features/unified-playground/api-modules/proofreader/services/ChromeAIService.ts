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

// ============================================================================
// Chrome AI Service
// ============================================================================

/**
 * Chrome AI Proofreader Service
 *
 * Provides low-level access to Chrome's Proofreader API
 */
export class ChromeAIProofreaderService {
  /**
   * Check if Proofreader API is supported in current browser
   */
  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Proofreader' in window &&
      (window as any).Proofreader !== undefined
    );
  }

  /**
   * Get Proofreader API reference
   * @throws Error if API is not supported
   */
  private static getAPI(): ProofreaderAPI {
    if (!this.isSupported()) {
      throw new Error(
        'Proofreader API is not supported in this browser. ' +
          'Chrome 141-145 required with Origin Trial enabled. ' +
          'Visit chrome://on-device-internals to check status.',
      );
    }

    return (window as any).Proofreader as ProofreaderAPI;
  }

  /**
   * Check Proofreader API availability
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

      // Normalize 'readily' to 'available' for consistency
      return (status as any) === 'readily' ? 'available' : status;
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
   * Create Proofreader instance
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
      const availability = await api.availability();

      if (availability === 'no') {
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

      // Create instance
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
    const rawAvailability = await api.availability();
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
      throw new Error('Proofreader API not available on this device');
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

      // Create Proofreader instance with monitor to track download
      const options: ProofreaderCreateOptions = {
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
        .then((proofreader: unknown) => {
          // Use setTimeout to ensure the final progress update is processed
          setTimeout(() => {
            // Download complete - model is ready
            onProgress({
              loaded: downloadedBytes || 22 * 1024 * 1024,
              total: 22 * 1024 * 1024,
              percentage: 100,
              timeRemaining: 0,
            });

            // Clean up the proofreader instance
            if (
              proofreader &&
              typeof proofreader === 'object' &&
              'destroy' in proofreader
            ) {
              (proofreader as { destroy: () => void }).destroy();
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
        return 'Proofreader API is not supported in this browser. Chrome 141-145 required.';
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
