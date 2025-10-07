/**
 * TranslatorManager Service
 * Manages translator instance lifecycle and model downloads
 */

import {
  type Translator,
  type TranslatorCreateOptions,
  type AvailabilityStatus,
  type DownloadProgressEvent,
  TranslationError,
  TranslationErrorType,
} from '../types';

/**
 * Download progress callback
 */
export type DownloadProgressCallback = (
  progress: number,
  loaded: number,
  total: number,
) => void;

/**
 * TranslatorManager manages the lifecycle of translator instances
 *
 * Features:
 * - Instance creation with download monitoring
 * - Availability checking
 * - Resource cleanup
 * - Instance caching by language pair
 */
export class TranslatorManager {
  private translators: Map<string, Translator> = new Map();
  private downloadCallbacks: Map<string, DownloadProgressCallback> = new Map();

  /**
   * Create a translator instance for a language pair
   *
   * @param options - Translator creation options
   * @returns Promise resolving to Translator instance
   * @throws TranslationError if creation fails
   */
  async create(options: TranslatorCreateOptions): Promise<Translator> {
    const key = this.getKey(options.sourceLanguage, options.targetLanguage);

    // Check if already exists in cache
    if (this.translators.has(key)) {
      return this.translators.get(key)!;
    }

    try {
      // Check API availability
      if (!('Translator' in window)) {
        throw new TranslationError(
          'Translator API is not available in this browser',
          TranslationErrorType.API_UNAVAILABLE,
          false,
        );
      }

      // Create translator with download monitoring
      const translator = await window.Translator.create({
        sourceLanguage: options.sourceLanguage,
        targetLanguage: options.targetLanguage,
        signal: options.signal,
        monitor: (m) => {
          m.addEventListener('downloadprogress', ((
            e: DownloadProgressEvent,
          ) => {
            const progress = (e.loaded / e.total) * 100;

            // Call options callback
            if (options.monitor) {
              options.monitor(m);
            }

            // Call stored callback if exists
            const callback = this.downloadCallbacks.get(key);
            if (callback) {
              callback(progress, e.loaded, e.total);
            }
          }) as EventListener);
        },
      });

      // Cache the translator
      this.translators.set(key, translator);

      return translator;
    } catch (error) {
      if (error instanceof TranslationError) {
        throw error;
      }

      // Handle abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TranslationError(
          'Translator creation was cancelled',
          TranslationErrorType.CANCELLED,
          true,
          error,
        );
      }

      // Generic error
      throw new TranslationError(
        `Failed to create translator: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TranslationErrorType.UNKNOWN,
        true,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Check availability of a language pair
   *
   * @param sourceLanguage - Source language code
   * @param targetLanguage - Target language code
   * @returns Promise resolving to availability status
   */
  async checkAvailability(
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<AvailabilityStatus> {
    try {
      // Check if API exists
      if (!('Translator' in window)) {
        return 'no';
      }

      // Check language pair availability
      const availability = await window.Translator.availability({
        sourceLanguage,
        targetLanguage,
      });

      return availability;
    } catch (error) {
      console.error('Failed to check availability:', error);
      return 'no';
    }
  }

  /**
   * Destroy a translator instance and free resources
   *
   * @param sourceLanguage - Source language code
   * @param targetLanguage - Target language code
   */
  destroy(sourceLanguage: string, targetLanguage: string): void {
    const key = this.getKey(sourceLanguage, targetLanguage);
    const translator = this.translators.get(key);

    if (translator) {
      try {
        translator.destroy();
      } catch (error) {
        console.error('Error destroying translator:', error);
      }

      this.translators.delete(key);
      this.downloadCallbacks.delete(key);
    }
  }

  /**
   * Destroy all cached translator instances
   */
  destroyAll(): void {
    for (const [key, translator] of this.translators.entries()) {
      try {
        translator.destroy();
      } catch (error) {
        console.error(`Error destroying translator ${key}:`, error);
      }
    }

    this.translators.clear();
    this.downloadCallbacks.clear();
  }

  /**
   * Get a cached translator instance
   *
   * @param sourceLanguage - Source language code
   * @param targetLanguage - Target language code
   * @returns Translator instance or null if not found
   */
  get(sourceLanguage: string, targetLanguage: string): Translator | null {
    const key = this.getKey(sourceLanguage, targetLanguage);
    return this.translators.get(key) || null;
  }

  /**
   * Check if a translator instance exists in cache
   *
   * @param sourceLanguage - Source language code
   * @param targetLanguage - Target language code
   * @returns True if translator exists in cache
   */
  has(sourceLanguage: string, targetLanguage: string): boolean {
    const key = this.getKey(sourceLanguage, targetLanguage);
    return this.translators.has(key);
  }

  /**
   * Register a download progress callback for a language pair
   *
   * @param sourceLanguage - Source language code
   * @param targetLanguage - Target language code
   * @param callback - Download progress callback
   */
  onDownloadProgress(
    sourceLanguage: string,
    targetLanguage: string,
    callback: DownloadProgressCallback,
  ): void {
    const key = this.getKey(sourceLanguage, targetLanguage);
    this.downloadCallbacks.set(key, callback);
  }

  /**
   * Get the number of cached translator instances
   *
   * @returns Number of cached translators
   */
  get size(): number {
    return this.translators.size;
  }

  /**
   * Get all cached language pairs
   *
   * @returns Array of language pair keys
   */
  getLanguagePairs(): string[] {
    return Array.from(this.translators.keys());
  }

  /**
   * Generate cache key for language pair
   *
   * @param source - Source language code
   * @param target - Target language code
   * @returns Cache key
   */
  private getKey(source: string, target: string): string {
    return `${source}-${target}`;
  }
}

/**
 * Global singleton instance
 */
export const translatorManager = new TranslatorManager();
