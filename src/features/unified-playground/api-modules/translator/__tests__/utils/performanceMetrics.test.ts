/**
 * Performance Metrics Utilities Test Suite
 *
 * Tests performance tracking and metric calculation utilities
 *
 * Coverage: 6 tests (4 happy path + 2 edge cases)
 */

import { describe, it, expect } from 'vitest';
import {
  PerformanceTracker,
  calculateQualityScore,
  formatLatency,
  formatThroughput,
  getPerformanceRating,
  calculateCacheEffectiveness,
} from '../../utils/performanceMetrics';

describe('Performance Metrics', () => {
  // ==========================================================================
  // Happy Path Tests (4 tests)
  // ==========================================================================

  describe('Happy Path', () => {
    it('tracks translation performance with PerformanceTracker', async () => {
      // Arrange
      const tracker = new PerformanceTracker();
      const text = 'Hello, world!';

      // Act
      tracker.start(text.length);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const metrics = tracker.stop(false);

      // Assert
      expect(metrics.translationLatency).toBeGreaterThan(0);
      expect(metrics.throughput).toBeGreaterThan(0);
      expect(metrics.cacheHit).toBe(false);
    });

    it('calculates quality score based on length ratio', () => {
      // Act
      const goodQuality = calculateQualityScore('Hello world', 'Hola mundo'); // Similar length
      const mediumQuality = calculateQualityScore('Hello', 'Bonjour le monde'); // Longer translation
      const lowQuality = calculateQualityScore('Hello world', 'Hi'); // Much shorter

      // Assert
      expect(goodQuality).toBeGreaterThanOrEqual(0.7);
      expect(mediumQuality).toBeGreaterThanOrEqual(0.5);
      expect(lowQuality).toBeGreaterThanOrEqual(0);
    });

    it('formats latency for display', () => {
      // Act
      const ms = formatLatency(250);
      const seconds = formatLatency(1500);

      // Assert
      expect(ms).toBe('250ms');
      expect(seconds).toBe('1.50s');
    });

    it('formats throughput for display', () => {
      // Act
      const low = formatThroughput(350);
      const high = formatThroughput(2500);

      // Assert
      expect(low).toBe('350 chars/s');
      expect(high).toBe('2.5k chars/s');
    });
  });

  // ==========================================================================
  // Edge Cases (2 tests)
  // ==========================================================================

  describe('Edge Cases', () => {
    it('returns correct performance rating', () => {
      // Act & Assert
      expect(getPerformanceRating(200)).toBe('excellent');
      expect(getPerformanceRating(800)).toBe('good');
      expect(getPerformanceRating(2000)).toBe('fair');
      expect(getPerformanceRating(5000)).toBe('poor');
    });

    it('calculates cache effectiveness', () => {
      // Act
      const high = calculateCacheEffectiveness(80, 20);
      const medium = calculateCacheEffectiveness(50, 50);
      const low = calculateCacheEffectiveness(20, 80);
      const noData = calculateCacheEffectiveness(0, 0);

      // Assert
      expect(high.hitRate).toBe(0.8);
      expect(high.effectiveness).toBe('high');

      expect(medium.hitRate).toBe(0.5);
      expect(medium.effectiveness).toBe('medium');

      expect(low.hitRate).toBe(0.2);
      expect(low.effectiveness).toBe('low');

      expect(noData.hitRate).toBe(0);
      expect(noData.effectiveness).toBe('low');
    });
  });
});
