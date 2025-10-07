/**
 * Performance Metrics Utilities
 *
 * Utilities for tracking and analyzing translation performance
 * @module utils/performanceMetrics
 */

import { type PerformanceMetrics } from '../types';

/**
 * Performance tracker for translation operations
 */
export class PerformanceTracker {
  private startTime: number = 0;
  private endTime: number = 0;
  private textLength: number = 0;

  /**
   * Start tracking
   */
  start(textLength: number): void {
    this.startTime = performance.now();
    this.textLength = textLength;
  }

  /**
   * Stop tracking and get metrics
   */
  stop(cacheHit: boolean = false): PerformanceMetrics {
    this.endTime = performance.now();
    const latency = this.endTime - this.startTime;
    const throughput = this.textLength / (latency / 1000); // chars per second

    return {
      translationLatency: latency,
      throughput,
      cacheHit,
    };
  }

  /**
   * Get current elapsed time
   */
  elapsed(): number {
    return performance.now() - this.startTime;
  }
}

/**
 * Calculate translation quality score
 * This is a placeholder - real quality assessment would use Chrome AI
 */
export function calculateQualityScore(
  original: string,
  translated: string,
): number {
  // Simple heuristic: check if translation length is reasonable
  const ratio = translated.length / (original.length || 1);

  // Good translations are typically 0.7 to 1.5x the original length
  if (ratio >= 0.7 && ratio <= 1.5) {
    return 0.9; // High quality
  } else if (ratio >= 0.5 && ratio <= 2.0) {
    return 0.7; // Medium quality
  } else {
    return 0.5; // Low quality (suspicious)
  }
}

/**
 * Format latency for display
 */
export function formatLatency(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

/**
 * Format throughput for display
 */
export function formatThroughput(charsPerSecond: number): string {
  if (charsPerSecond < 1000) {
    return `${Math.round(charsPerSecond)} chars/s`;
  } else {
    return `${(charsPerSecond / 1000).toFixed(1)}k chars/s`;
  }
}

/**
 * Get performance rating
 */
export function getPerformanceRating(
  latency: number,
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (latency < 500) return 'excellent';
  if (latency < 1500) return 'good';
  if (latency < 3000) return 'fair';
  return 'poor';
}

/**
 * Calculate cache effectiveness
 */
export function calculateCacheEffectiveness(
  hits: number,
  misses: number,
): {
  hitRate: number;
  missRate: number;
  effectiveness: 'high' | 'medium' | 'low';
} {
  const total = hits + misses;
  if (total === 0) {
    return { hitRate: 0, missRate: 0, effectiveness: 'low' };
  }

  const hitRate = hits / total;
  const missRate = misses / total;

  let effectiveness: 'high' | 'medium' | 'low';
  if (hitRate >= 0.7) {
    effectiveness = 'high';
  } else if (hitRate >= 0.4) {
    effectiveness = 'medium';
  } else {
    effectiveness = 'low';
  }

  return { hitRate, missRate, effectiveness };
}

/**
 * Estimate translation time based on text length
 */
export function estimateTranslationTime(textLength: number): number {
  // Rough estimate: ~500 chars per second
  const baseTime = (textLength / 500) * 1000;

  // Add overhead for model loading, etc.
  const overhead = 200;

  return baseTime + overhead;
}

/**
 * Create performance summary
 */
export function createPerformanceSummary(metrics: PerformanceMetrics): string {
  const latency = formatLatency(metrics.translationLatency);
  const throughput = formatThroughput(metrics.throughput);
  const rating = getPerformanceRating(metrics.translationLatency);
  const cacheStatus = metrics.cacheHit
    ? '✅ Cache Hit'
    : '⏳ Fresh Translation';

  return `${latency} • ${throughput} • ${rating} • ${cacheStatus}`;
}
