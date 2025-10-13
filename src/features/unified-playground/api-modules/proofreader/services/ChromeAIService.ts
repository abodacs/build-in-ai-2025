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
import type { AvailabilityStatus } from '../../shared/types';

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

      return status;
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
