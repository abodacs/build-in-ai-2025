/**
 * Summarizer Manager
 *
 * Manages summarizer instance lifecycle, caching, and resource cleanup
 * Provides high-level interface for summarization operations
 *
 * @module SummarizerManager
 */

import type {
  Summarizer,
  SummarizerCreateOptions,
  SummarizeOptions,
  SummarizerMetrics,
  DownloadProgress,
} from '../types/summarizer.types';

import { ChromeAICompatibility } from './ChromeAICompatibility';
import { ErrorHandler } from './ErrorHandler';

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_CREATE_OPTIONS: SummarizerCreateOptions = {
  outputLanguage: 'en',
};

const DEFAULT_SUMMARIZE_OPTIONS: SummarizeOptions = {
  outputLanguage: 'en',
};

// ============================================================================
// Summarizer Manager Service
// ============================================================================

export class SummarizerManager {
  private summarizer: Summarizer | null = null;
  private currentOptions: SummarizerCreateOptions | null = null;
  private isInitializing: boolean = false;
  private metrics: SummarizerMetrics = {
    modelInitTime: null,
    summaryTimes: [],
    averageTime: 0,
    cacheHitRate: 0,
    streamingLatency: [],
  };

  // Track instance creation count for cache hit rate
  private totalSummarizations: number = 0;
  private newInstanceCreations: number = 0;

  // ============================================================================
  // Instance Management
  // ============================================================================

  /**
   * Get or create a summarizer instance
   * Reuses existing instance if options match, otherwise creates new one
   *
   * @param {SummarizerCreateOptions} options - Summarizer configuration
   * @returns {Promise<Summarizer>} Summarizer instance
   */
  async getSummarizer(
    options: SummarizerCreateOptions = DEFAULT_CREATE_OPTIONS,
  ): Promise<Summarizer> {
    // Normalize options for consistency
    const normalizedOptions =
      ChromeAICompatibility.normalizeCreateOptions(options);

    // Check if we can reuse existing instance
    if (this.summarizer && this.optionsMatch(normalizedOptions)) {
      // Cache hit - reuse existing instance
      return this.summarizer;
    }

    // Need to create new instance
    return this.createSummarizer(normalizedOptions);
  }

  /**
   * Create a new summarizer instance
   * Destroys existing instance if present
   *
   * @param {SummarizerCreateOptions} options - Summarizer configuration
   * @returns {Promise<Summarizer>} New summarizer instance
   */
  async createSummarizer(
    options: SummarizerCreateOptions = DEFAULT_CREATE_OPTIONS,
  ): Promise<Summarizer> {
    // Prevent concurrent initialization
    if (this.isInitializing) {
      throw new Error('Summarizer initialization already in progress');
    }

    this.isInitializing = true;

    try {
      // Destroy existing instance first
      this.destroy();

      // Normalize options
      const normalizedOptions =
        ChromeAICompatibility.normalizeCreateOptions(options);

      // Get the API
      const SummarizerAPI = ChromeAICompatibility.getSummarizerAPI();

      if (!SummarizerAPI) {
        throw ErrorHandler.handleError(
          new Error('Summarizer API not available'),
        );
      }

      // Check for user activation (required for model creation/download)
      // Chrome requires user interaction to create AI model instances
      if (
        typeof navigator !== 'undefined' &&
        'userActivation' in navigator &&
        !(navigator as Navigator & { userActivation?: { isActive: boolean } })
          .userActivation?.isActive
      ) {
        console.warn(
          '[SummarizerManager] User activation required for model creation',
        );
        throw new Error(
          'Model creation requires user interaction (e.g., button click)',
        );
      }

      // Track initialization time
      const startTime = performance.now();

      // Create new instance
      this.summarizer = await SummarizerAPI.create(normalizedOptions);
      this.currentOptions = normalizedOptions;

      // Record metrics
      const initTime = performance.now() - startTime;
      this.metrics.modelInitTime = initTime;
      this.newInstanceCreations++;

      // Update cache hit rate
      this.updateCacheHitRate();

      console.log(
        `[SummarizerManager] Created new instance in ${initTime.toFixed(2)}ms`,
      );

      return this.summarizer;
    } catch (error) {
      throw ErrorHandler.handleError(error);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Create summarizer with download progress monitoring
   *
   * @param {SummarizerCreateOptions} options - Summarizer configuration
   * @param {function} onProgress - Progress callback
   * @returns {Promise<Summarizer>} New summarizer instance
   */
  async createWithDownload(
    options: SummarizerCreateOptions,
    onProgress: (progress: DownloadProgress) => void,
  ): Promise<Summarizer> {
    // Prevent concurrent initialization
    if (this.isInitializing) {
      throw new Error('Summarizer initialization already in progress');
    }

    this.isInitializing = true;

    try {
      // Destroy existing instance first
      this.destroy();

      // Normalize options
      const normalizedOptions =
        ChromeAICompatibility.normalizeCreateOptions(options);

      // Get the API
      const SummarizerAPI = ChromeAICompatibility.getSummarizerAPI();

      if (!SummarizerAPI) {
        throw ErrorHandler.handleError(
          new Error('Summarizer API not available'),
        );
      }

      // Check for user activation (required for model download)
      // Chrome requires user interaction to download AI models
      if (
        typeof navigator !== 'undefined' &&
        'userActivation' in navigator &&
        !(navigator as Navigator & { userActivation?: { isActive: boolean } })
          .userActivation?.isActive
      ) {
        console.warn(
          '[SummarizerManager] User activation required for model download',
        );
        throw new Error(
          'Model download requires user interaction (e.g., button click)',
        );
      }

      // Track initialization time
      const startTime = performance.now();

      // Create with download monitoring
      return new Promise((resolve, reject) => {
        SummarizerAPI.create({
          ...normalizedOptions,
          monitor: (m: EventTarget) => {
            // Forward download progress
            m.addEventListener('downloadprogress', (e: Event) => {
              const customEvent = e as { loaded?: number; total?: number };
              const progress: DownloadProgress = {
                loaded: customEvent.loaded || 0,
                total: customEvent.total || 22 * 1024 * 1024,
                percentage:
                  ((customEvent.loaded || 0) /
                    (customEvent.total || 22 * 1024 * 1024)) *
                  100,
              };
              onProgress(progress);
            });

            // Handle download complete
            m.addEventListener('downloadcomplete', async () => {
              try {
                // Wait for the promise to resolve
                const summarizer =
                  await SummarizerAPI.create(normalizedOptions);

                this.summarizer = summarizer;
                this.currentOptions = normalizedOptions;

                // Record metrics
                const initTime = performance.now() - startTime;
                this.metrics.modelInitTime = initTime;
                this.newInstanceCreations++;
                this.updateCacheHitRate();

                console.log(
                  `[SummarizerManager] Created instance with download in ${initTime.toFixed(2)}ms`,
                );

                resolve(summarizer);
              } catch (error) {
                reject(ErrorHandler.handleError(error));
              }
            });

            // Handle download error
            m.addEventListener('downloaderror', (e: Event) => {
              reject(ErrorHandler.handleDownloadError(e));
            });
          },
        })
          .then((summarizer) => {
            // If download wasn't needed (model already available)
            if (this.summarizer === null) {
              this.summarizer = summarizer;
              this.currentOptions = normalizedOptions;

              const initTime = performance.now() - startTime;
              this.metrics.modelInitTime = initTime;
              this.newInstanceCreations++;
              this.updateCacheHitRate();

              resolve(summarizer);
            }
          })
          .catch((error) => {
            reject(ErrorHandler.handleError(error));
          });
      });
    } finally {
      this.isInitializing = false;
    }
  }

  // ============================================================================
  // Summarization Operations
  // ============================================================================

  /**
   * Summarize text using the current or a new summarizer instance
   *
   * @param {string} text - Text to summarize
   * @param {SummarizeOptions} summarizeOptions - Summarization options
   * @param {SummarizerCreateOptions} createOptions - Summarizer creation options (if needed)
   * @returns {Promise<string>} Summary text
   */
  async summarize(
    text: string,
    summarizeOptions: SummarizeOptions = DEFAULT_SUMMARIZE_OPTIONS,
    createOptions: SummarizerCreateOptions = DEFAULT_CREATE_OPTIONS,
  ): Promise<string> {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw ErrorHandler.handleSummarizationError(new Error('Empty text'), 0);
    }

    try {
      // Get or create summarizer
      const summarizer = await this.getSummarizer(createOptions);

      // Normalize summarize options (ensures outputLanguage is set)
      const normalizedSummarizeOptions =
        ChromeAICompatibility.normalizeSummarizeOptions(summarizeOptions);

      // Track summarization time
      const startTime = performance.now();

      // Perform summarization
      const summary = await summarizer.summarize(
        text,
        normalizedSummarizeOptions,
      );

      // Record metrics
      const summaryTime = performance.now() - startTime;
      this.metrics.summaryTimes.push(summaryTime);
      this.totalSummarizations++;
      this.updateAverageTime();

      console.log(
        `[SummarizerManager] Summarized in ${summaryTime.toFixed(2)}ms`,
      );

      return summary;
    } catch (error) {
      throw ErrorHandler.handleSummarizationError(error, text.length);
    }
  }

  /**
   * Summarize with streaming support
   *
   * @param {string} text - Text to summarize
   * @param {SummarizeOptions} summarizeOptions - Summarization options
   * @param {SummarizerCreateOptions} createOptions - Summarizer creation options (if needed)
   * @returns {Promise<ReadableStream<string>>} Stream of summary chunks
   */
  async summarizeStreaming(
    text: string,
    summarizeOptions: SummarizeOptions = DEFAULT_SUMMARIZE_OPTIONS,
    createOptions: SummarizerCreateOptions = DEFAULT_CREATE_OPTIONS,
  ): Promise<ReadableStream<string>> {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw ErrorHandler.handleSummarizationError(new Error('Empty text'), 0);
    }

    try {
      // Get or create summarizer
      const summarizer = await this.getSummarizer(createOptions);

      // Normalize summarize options (ensures outputLanguage is set)
      const normalizedSummarizeOptions =
        ChromeAICompatibility.normalizeSummarizeOptions(summarizeOptions);

      // Check if streaming is supported
      if (!('summarizeStreaming' in summarizer)) {
        throw new Error('Streaming not supported by this summarizer instance');
      }

      // Track streaming metrics
      const startTime = performance.now();
      let lastChunkTime = startTime;

      // Perform streaming summarization
      const stream = (
        summarizer as {
          summarizeStreaming: (
            text: string,
            options: SummarizeOptions,
          ) => ReadableStream<string>;
        }
      ).summarizeStreaming(text, normalizedSummarizeOptions);

      // Wrap stream to track latency
      const metricsRef = this.metrics; // Capture metrics ref for closure
      const trackedStream = new ReadableStream({
        async start(controller) {
          const reader = stream.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                controller.close();
                break;
              }

              // Track chunk latency
              const now = performance.now();
              const latency = now - lastChunkTime;
              lastChunkTime = now;

              // Store latency metric
              if (latency > 0) {
                // Access metrics through captured reference
                metricsRef.streamingLatency.push(latency);
              }

              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          } finally {
            reader.releaseLock();
          }
        },
      });

      this.totalSummarizations++;
      this.updateCacheHitRate();

      return trackedStream;
    } catch (error) {
      throw ErrorHandler.handleSummarizationError(error, text.length);
    }
  }

  // ============================================================================
  // Metrics and Analytics
  // ============================================================================

  /**
   * Get current performance metrics
   *
   * @returns {SummarizerMetrics} Performance metrics
   */
  getMetrics(): SummarizerMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      modelInitTime: null,
      summaryTimes: [],
      averageTime: 0,
      cacheHitRate: 0,
      streamingLatency: [],
    };
    this.totalSummarizations = 0;
    this.newInstanceCreations = 0;

    console.log('[SummarizerManager] Metrics reset');
  }

  /**
   * Update average summarization time
   */
  private updateAverageTime() {
    if (this.metrics.summaryTimes.length === 0) {
      this.metrics.averageTime = 0;
      return;
    }

    const total = this.metrics.summaryTimes.reduce(
      (sum, time) => sum + time,
      0,
    );
    this.metrics.averageTime = total / this.metrics.summaryTimes.length;
  }

  /**
   * Update cache hit rate
   * Cache hit = reusing existing instance
   * Cache miss = creating new instance
   */
  private updateCacheHitRate() {
    if (this.totalSummarizations === 0) {
      this.metrics.cacheHitRate = 0;
      return;
    }

    const cacheHits = this.totalSummarizations - this.newInstanceCreations;
    this.metrics.cacheHitRate = cacheHits / this.totalSummarizations;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if options match current instance options
   *
   * @param {SummarizerCreateOptions} options - Options to compare
   * @returns {boolean} True if options match
   */
  private optionsMatch(options: SummarizerCreateOptions): boolean {
    if (!this.currentOptions) return false;

    return (
      (options.type || 'tldr') === (this.currentOptions.type || 'tldr') &&
      (options.format || 'plain-text') ===
        (this.currentOptions.format || 'plain-text') &&
      (options.length || 'medium') ===
        (this.currentOptions.length || 'medium') &&
      (options.sharedContext || '') ===
        (this.currentOptions.sharedContext || '')
    );
  }

  /**
   * Check if a summarizer instance is currently available
   *
   * @returns {boolean} True if instance exists
   */
  hasInstance(): boolean {
    return this.summarizer !== null;
  }

  /**
   * Get current summarizer options
   *
   * @returns {SummarizerCreateOptions | null} Current options or null
   */
  getCurrentOptions(): SummarizerCreateOptions | null {
    return this.currentOptions ? { ...this.currentOptions } : null;
  }

  /**
   * Check if currently initializing
   *
   * @returns {boolean} True if initializing
   */
  getIsInitializing(): boolean {
    return this.isInitializing;
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Destroy the current summarizer instance
   * Releases resources and cleans up
   */
  destroy() {
    if (this.summarizer && 'destroy' in this.summarizer) {
      try {
        this.summarizer.destroy();
        console.log('[SummarizerManager] Instance destroyed');
      } catch (error) {
        console.error('[SummarizerManager] Error destroying instance:', error);
      }
    }

    this.summarizer = null;
    this.currentOptions = null;
  }

  /**
   * Complete cleanup including metrics
   * Call this when component unmounts
   */
  cleanup() {
    this.destroy();
    this.resetMetrics();
    console.log('[SummarizerManager] Complete cleanup');
  }
}

export default SummarizerManager;
