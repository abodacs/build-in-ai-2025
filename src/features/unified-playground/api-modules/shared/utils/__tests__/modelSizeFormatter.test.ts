/**
 * Model Size Formatter Tests
 *
 * Comprehensive test suite for model size formatting utilities
 *
 * @module shared/utils/__tests__/modelSizeFormatter
 */

import { describe, it, expect } from 'vitest';
import {
  formatModelSize,
  formatProgress,
  formatSpeed,
  estimateTimeRemaining,
  formatDuration,
  isValidProgress,
} from '../modelSizeFormatter';

// ============================================================================
// Test Suite
// ============================================================================

describe('modelSizeFormatter', () => {
  // ==========================================================================
  // formatModelSize Tests
  // ==========================================================================

  describe('formatModelSize', () => {
    it('should format bytes correctly', () => {
      expect(formatModelSize(0)).toBe('0 B');
      expect(formatModelSize(500)).toBe('500 B');
      expect(formatModelSize(1023)).toBe('1023 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatModelSize(1024)).toBe('1.00 KB');
      expect(formatModelSize(1536)).toBe('1.50 KB');
      expect(formatModelSize(10240)).toBe('10.00 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatModelSize(1048576)).toBe('1.00 MB');
      expect(formatModelSize(1572864)).toBe('1.50 MB');
      expect(formatModelSize(10485760)).toBe('10.00 MB');
      expect(formatModelSize(524288000)).toBe('500.00 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatModelSize(1073741824)).toBe('1.00 GB');
      expect(formatModelSize(1610612736)).toBe('1.50 GB');
      expect(formatModelSize(10737418240)).toBe('10.00 GB');
      expect(formatModelSize(23622320128)).toBe('22.00 GB');
    });

    it('should respect decimal places parameter', () => {
      expect(formatModelSize(1536, 0)).toBe('2 KB');
      expect(formatModelSize(1536, 1)).toBe('1.5 KB');
      expect(formatModelSize(1536, 3)).toBe('1.500 KB');
    });

    it('should handle negative numbers', () => {
      expect(formatModelSize(-100)).toBe('Invalid');
    });

    it('should handle large numbers', () => {
      expect(formatModelSize(1099511627776)).toBe('1024.00 GB');
    });
  });

  // ==========================================================================
  // formatProgress Tests
  // ==========================================================================

  describe('formatProgress', () => {
    it('should format progress percentage correctly', () => {
      expect(formatProgress(0, 1024)).toBe('0.0%');
      expect(formatProgress(512, 1024)).toBe('50.0%');
      expect(formatProgress(1024, 1024)).toBe('100.0%');
    });

    it('should format partial progress correctly', () => {
      expect(formatProgress(256, 1024)).toBe('25.0%');
      expect(formatProgress(768, 1024)).toBe('75.0%');
      expect(formatProgress(333, 1000)).toBe('33.3%');
    });

    it('should handle zero total', () => {
      expect(formatProgress(100, 0)).toBe('0.0%');
    });

    it('should handle loaded > total', () => {
      expect(formatProgress(2048, 1024)).toBe('200.0%');
    });

    it('should round to one decimal place', () => {
      expect(formatProgress(333, 999)).toBe('33.3%');
      expect(formatProgress(666, 999)).toBe('66.7%');
    });
  });

  // ==========================================================================
  // formatSpeed Tests
  // ==========================================================================

  describe('formatSpeed', () => {
    it('should format speed in bytes/s', () => {
      expect(formatSpeed(500)).toBe('500 B/s');
      expect(formatSpeed(1023)).toBe('1023 B/s');
    });

    it('should format speed in KB/s', () => {
      expect(formatSpeed(1024)).toBe('1.0 KB/s');
      expect(formatSpeed(10240)).toBe('10.0 KB/s');
    });

    it('should format speed in MB/s', () => {
      expect(formatSpeed(1048576)).toBe('1.0 MB/s');
      expect(formatSpeed(10485760)).toBe('10.0 MB/s');
    });

    it('should format speed in GB/s', () => {
      expect(formatSpeed(1073741824)).toBe('1.0 GB/s');
      expect(formatSpeed(10737418240)).toBe('10.0 GB/s');
    });

    it('should respect decimal places parameter', () => {
      expect(formatSpeed(1572864, 0)).toBe('2 MB/s');
      expect(formatSpeed(1572864, 2)).toBe('1.50 MB/s');
      expect(formatSpeed(1572864, 3)).toBe('1.500 MB/s');
    });

    it('should handle zero speed', () => {
      expect(formatSpeed(0)).toBe('0 B/s');
    });
  });

  // ==========================================================================
  // estimateTimeRemaining Tests
  // ==========================================================================

  describe('estimateTimeRemaining', () => {
    it('should calculate time remaining correctly', () => {
      expect(estimateTimeRemaining(1048576, 524288)).toBe(2);
      expect(estimateTimeRemaining(10485760, 1048576)).toBe(10);
      expect(estimateTimeRemaining(1000, 100)).toBe(10);
    });

    it('should round up to nearest second', () => {
      expect(estimateTimeRemaining(1000, 333)).toBe(4);
      expect(estimateTimeRemaining(999, 1000)).toBe(1);
    });

    it('should handle zero speed', () => {
      expect(estimateTimeRemaining(1000, 0)).toBe(0);
    });

    it('should handle zero remaining', () => {
      expect(estimateTimeRemaining(0, 1000)).toBe(0);
    });

    it('should handle large numbers', () => {
      expect(estimateTimeRemaining(1073741824, 1048576)).toBe(1024);
    });
  });

  // ==========================================================================
  // formatDuration Tests
  // ==========================================================================

  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(59)).toBe('59s');
    });

    it('should format minutes and seconds correctly', () => {
      expect(formatDuration(60)).toBe('1m 0s');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(150)).toBe('2m 30s');
      expect(formatDuration(3599)).toBe('59m 59s');
    });

    it('should format hours and minutes correctly', () => {
      expect(formatDuration(3600)).toBe('1h 0m');
      expect(formatDuration(5400)).toBe('1h 30m');
      expect(formatDuration(7200)).toBe('2h 0m');
    });

    it('should not show seconds when hours are present', () => {
      expect(formatDuration(3661)).toBe('1h 1m');
      expect(formatDuration(3659)).toBe('1h 0m');
    });

    it('should handle large durations', () => {
      expect(formatDuration(36000)).toBe('10h 0m');
      expect(formatDuration(86400)).toBe('24h 0m');
    });
  });

  // ==========================================================================
  // isValidProgress Tests
  // ==========================================================================

  describe('isValidProgress', () => {
    it('should validate correct progress values', () => {
      expect(isValidProgress(0, 1024)).toBe(true);
      expect(isValidProgress(512, 1024)).toBe(true);
      expect(isValidProgress(1024, 1024)).toBe(true);
    });

    it('should reject negative loaded', () => {
      expect(isValidProgress(-1, 1024)).toBe(false);
      expect(isValidProgress(-100, 1024)).toBe(false);
    });

    it('should reject negative total', () => {
      expect(isValidProgress(0, -1)).toBe(false);
      expect(isValidProgress(512, -1024)).toBe(false);
    });

    it('should reject zero total', () => {
      expect(isValidProgress(0, 0)).toBe(false);
      expect(isValidProgress(100, 0)).toBe(false);
    });

    it('should reject loaded > total', () => {
      expect(isValidProgress(2048, 1024)).toBe(false);
      expect(isValidProgress(1025, 1024)).toBe(false);
    });

    it('should reject non-number values', () => {
      expect(isValidProgress(NaN, 1024)).toBe(false);
      expect(isValidProgress(512, NaN)).toBe(false);
      expect(isValidProgress('500' as any, 1024)).toBe(false);
      expect(isValidProgress(512, '1024' as any)).toBe(false);
    });

    it('should accept loaded === total', () => {
      expect(isValidProgress(1024, 1024)).toBe(true);
      expect(isValidProgress(0, 1024)).toBe(true);
    });
  });

  // ==========================================================================
  // Edge Cases and Special Values
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle very small numbers', () => {
      expect(formatModelSize(1)).toBe('1 B');
      expect(formatModelSize(0.5)).toBe('0 B');
    });

    it('should handle very large numbers', () => {
      expect(formatModelSize(Number.MAX_SAFE_INTEGER)).toContain('GB');
    });

    it('should handle decimal bytes gracefully', () => {
      expect(formatModelSize(1024.5)).toBe('1.00 KB');
      expect(formatModelSize(1536.7)).toBe('1.50 KB');
    });

    it('should format progress for edge percentages', () => {
      expect(formatProgress(1, 100)).toBe('1.0%');
      expect(formatProgress(99, 100)).toBe('99.0%');
      expect(formatProgress(1, 1000000)).toBe('0.0%');
    });

    it('should handle speed calculations with decimals', () => {
      expect(formatSpeed(1536.5, 2)).toBe('1.50 KB/s');
    });

    it('should estimate time with fractional speeds', () => {
      expect(estimateTimeRemaining(1000, 333.33)).toBe(4);
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('Integration Scenarios', () => {
    it('should format typical model download progress', () => {
      const loaded = 5368709120; // 5 GB
      const total = 23622320128; // 22 GB
      const percentage = (loaded / total) * 100;
      const speed = 10485760; // 10 MB/s

      expect(formatModelSize(loaded)).toBe('5.00 GB');
      expect(formatModelSize(total)).toBe('22.00 GB');
      expect(formatProgress(loaded, total)).toBe('22.7%');
      expect(formatSpeed(speed)).toBe('10.0 MB/s');
      expect(isValidProgress(loaded, total)).toBe(true);

      const remaining = total - loaded;
      const timeRemaining = estimateTimeRemaining(remaining, speed);
      expect(formatDuration(timeRemaining)).toContain('m');
    });

    it('should format complete download', () => {
      const size = 23622320128; // 22 GB

      expect(formatModelSize(size)).toBe('22.00 GB');
      expect(formatProgress(size, size)).toBe('100.0%');
      expect(isValidProgress(size, size)).toBe(true);
    });

    it('should format starting download', () => {
      const loaded = 0;
      const total = 23622320128;

      expect(formatModelSize(loaded)).toBe('0 B');
      expect(formatProgress(loaded, total)).toBe('0.0%');
      expect(isValidProgress(loaded, total)).toBe(true);
    });
  });
});
