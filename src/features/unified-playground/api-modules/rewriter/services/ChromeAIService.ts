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
import type { AvailabilityStatus } from '../../shared/types';

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

      return status;
    } catch (error) {
      console.error('Failed to check Rewriter availability:', error);
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
        throw new Error('Rewriter API is not supported in this browser');
      }

      const api = this.getAPI();
      const instance = await api.create(options);

      return instance;
    } catch (error: any) {
      // Enhance error messages
      if (error?.message?.includes('user activation')) {
        throw new Error(
          'Rewriter API requires user activation. Please click a button to create the instance.',
        );
      }

      if (error?.message?.includes('download')) {
        throw new Error(
          'Model download required. This may take a few moments on first use.',
        );
      }

      if (error?.message?.includes('not available')) {
        throw new Error(
          'Rewriter API is not available. Please enable it in chrome://flags#rewriter-api',
        );
      }

      // Re-throw with original message if no specific handling
      throw new Error(
        `Failed to create Rewriter instance: ${error?.message || 'Unknown error'}`,
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
    } catch (error) {
      console.warn('Failed to destroy Rewriter instance:', error);
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export default ChromeAIRewriterService;
