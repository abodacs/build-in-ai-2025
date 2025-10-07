/**
 * BatchProcessor Service
 * Handles batch translation with progress tracking and error isolation
 */

import {
  type Translator,
  type BatchItem,
  type BatchResult,
  type BatchTranslationOptions,
  TranslationError,
  TranslationErrorType,
} from '../types';

/**
 * BatchProcessor manages batch translation operations
 *
 * Features:
 * - Concurrent batch processing
 * - Progress tracking
 * - Error isolation (one failure doesn't stop batch)
 * - Configurable concurrency
 */
export class BatchProcessor {
  /**
   * Process a batch of translations
   *
   * @param translator - Translator instance
   * @param options - Batch translation options
   * @returns Promise resolving to array of batch results
   */
  async processBatch(
    translator: Translator,
    options: BatchTranslationOptions,
  ): Promise<BatchResult[]> {
    const { items, onProgress, concurrency = 5, signal } = options;
    const results: BatchResult[] = [];
    let completed = 0;

    // Process in batches with concurrency limit
    for (let i = 0; i < items.length; i += concurrency) {
      // Check for cancellation
      if (signal?.aborted) {
        throw new TranslationError(
          'Batch translation was cancelled',
          TranslationErrorType.CANCELLED,
          false,
        );
      }

      const batch = items.slice(i, i + concurrency);

      // Process batch items in parallel
      const batchPromises = batch.map(async (item) => {
        const startTime = Date.now();

        try {
          const translation = await translator.translate(item.text, {
            context: item.context,
            signal,
          });

          const endTime = Date.now();
          const latency = endTime - startTime;

          completed++;
          if (onProgress) {
            onProgress(completed, items.length);
          }

          return {
            id: item.id,
            original: item.text,
            translated: translation,
            sourceLanguage: options.sourceLanguage,
            targetLanguage: options.targetLanguage,
            success: true,
            performance: {
              translationLatency: latency,
              throughput: (item.text.length / latency) * 1000,
              cacheHit: false,
            },
          } as BatchResult;
        } catch (error) {
          completed++;
          if (onProgress) {
            onProgress(completed, items.length);
          }

          return {
            id: item.id,
            original: item.text,
            translated: '',
            sourceLanguage: options.sourceLanguage,
            targetLanguage: options.targetLanguage,
            success: false,
            error:
              error instanceof Error ? error.message : 'Translation failed',
          } as BatchResult;
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get batch statistics
   *
   * @param results - Batch results
   * @returns Batch statistics
   */
  getStatistics(results: BatchResult[]) {
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalChars = results.reduce((sum, r) => sum + r.original.length, 0);

    const successfulResults = results.filter((r) => r.success && r.performance);
    const avgLatency =
      successfulResults.length > 0
        ? successfulResults.reduce(
            (sum, r) => sum + (r.performance?.translationLatency || 0),
            0,
          ) / successfulResults.length
        : 0;

    const avgThroughput =
      successfulResults.length > 0
        ? successfulResults.reduce(
            (sum, r) => sum + (r.performance?.throughput || 0),
            0,
          ) / successfulResults.length
        : 0;

    return {
      total: results.length,
      successful,
      failed,
      successRate: (successful / results.length) * 100,
      totalChars,
      averageLatency: Math.round(avgLatency),
      averageThroughput: Math.round(avgThroughput),
    };
  }

  /**
   * Export batch results to CSV
   *
   * @param results - Batch results
   * @returns CSV string
   */
  exportToCSV(results: BatchResult[]): string {
    const headers = [
      'ID',
      'Original',
      'Translation',
      'Source Language',
      'Target Language',
      'Success',
      'Error',
      'Latency (ms)',
    ];

    const rows = results.map((result) => [
      result.id,
      `"${result.original.replace(/"/g, '""')}"`, // Escape quotes
      `"${result.translated.replace(/"/g, '""')}"`,
      result.sourceLanguage,
      result.targetLanguage,
      result.success ? 'Yes' : 'No',
      result.error || '',
      result.performance?.translationLatency || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    return csv;
  }

  /**
   * Export batch results to JSON
   *
   * @param results - Batch results
   * @returns JSON string
   */
  exportToJSON(results: BatchResult[]): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        total: results.length,
        results,
        statistics: this.getStatistics(results),
      },
      null,
      2,
    );
  }

  /**
   * Retry failed translations
   *
   * @param translator - Translator instance
   * @param results - Previous batch results
   * @param options - Batch options
   * @returns Promise resolving to updated results
   */
  async retryFailed(
    translator: Translator,
    results: BatchResult[],
    options: Omit<BatchTranslationOptions, 'items'>,
  ): Promise<BatchResult[]> {
    // Get failed items
    const failedItems: BatchItem[] = results
      .filter((r) => !r.success)
      .map((r) => ({
        id: r.id,
        text: r.original,
      }));

    if (failedItems.length === 0) {
      return results;
    }

    // Retry failed items
    const retryResults = await this.processBatch(translator, {
      ...options,
      items: failedItems,
    });

    // Merge results
    const mergedResults = results.map((original) => {
      if (original.success) {
        return original;
      }

      const retry = retryResults.find((r) => r.id === original.id);
      return retry || original;
    });

    return mergedResults;
  }
}

/**
 * Global singleton instance
 */
export const batchProcessor = new BatchProcessor();
