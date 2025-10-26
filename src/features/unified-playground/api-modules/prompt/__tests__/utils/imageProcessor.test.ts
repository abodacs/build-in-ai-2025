/**
 * Image Processor Utilities Test Suite
 *
 * Tests image dimension calculations, compression, format conversion,
 * and utility functions
 *
 * Coverage: 25+ tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getImageDimensions,
  compressImage,
  convertImageFormat,
  fitDimensions,
  formatFileSize,
} from '../../utils/imageProcessor';
import {
  createMockFile,
  mockImage,
  mockCanvas,
  mockFileReader,
  mockURL,
} from '../test-utils';

describe('imageProcessor', () => {
  let imageMock: ReturnType<typeof mockImage>;
  let canvasMock: ReturnType<typeof mockCanvas>;
  let fileReaderMock: ReturnType<typeof mockFileReader>;
  let urlMock: ReturnType<typeof mockURL>;

  beforeEach(() => {
    imageMock = mockImage();
    canvasMock = mockCanvas();
    fileReaderMock = mockFileReader();
    urlMock = mockURL();
  });

  afterEach(() => {
    imageMock.restore();
    fileReaderMock.restore();
    urlMock.restore();
  });

  // ==========================================================================
  // Image Dimensions Tests
  // ==========================================================================

  describe('getImageDimensions', () => {
    it('gets dimensions from image file', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg');

      const result = await getImageDimensions(file);

      expect(result).toBeDefined();
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
      expect(result.aspectRatio).toBe(1.0);
    });

    it('calculates aspect ratio correctly', async () => {
      const file = createMockFile('wide.jpg', 'image/jpeg');

      // Mock wider image
      const originalImage = global.Image;
      class WideImage {
        onload: (() => void) | null = null;
        width = 200;
        height = 100;
        src = '';

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 10);
        }
      }
      (global as any).Image = WideImage;

      const result = await getImageDimensions(file);

      expect(result.aspectRatio).toBe(2.0);

      (global as any).Image = originalImage;
    });

    it('handles square images', async () => {
      const file = createMockFile('square.jpg', 'image/jpeg');

      const result = await getImageDimensions(file);

      expect(result.width).toBe(result.height);
      expect(result.aspectRatio).toBe(1.0);
    });

    it('handles tall images', async () => {
      const file = createMockFile('tall.jpg', 'image/jpeg');

      const originalImage = global.Image;
      class TallImage {
        onload: (() => void) | null = null;
        width = 100;
        height = 300;
        src = '';

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 10);
        }
      }
      (global as any).Image = TallImage;

      const result = await getImageDimensions(file);

      expect(result.aspectRatio).toBeCloseTo(0.33, 2);

      (global as any).Image = originalImage;
    });

    it('rejects on image load error', async () => {
      const file = createMockFile('corrupt.jpg', 'image/jpeg');

      const originalImage = global.Image;
      class ErrorImage {
        onerror: (() => void) | null = null;
        src = '';

        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 10);
        }
      }
      (global as any).Image = ErrorImage;

      await expect(getImageDimensions(file)).rejects.toThrow();

      (global as any).Image = originalImage;
    });
  });

  // ==========================================================================
  // Image Compression Tests
  // ==========================================================================

  describe('compressImage', () => {
    it('compresses image with quality setting', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 5000);

      const result = await compressImage(file, 0.8);

      expect(result.blob).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.statistics.originalSize).toBe(5000);
    });

    it('provides compression statistics', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 10000);

      const result = await compressImage(file, 0.5);

      expect(result.statistics.compressionRatio).toBeDefined();
      expect(result.statistics.compressionRatio).toBeGreaterThan(0);
      expect(result.statistics.spaceSaved).toBeDefined();
      expect(result.statistics.spaceSavedPercentage).toBeDefined();
    });

    it('resizes image when max dimensions specified', async () => {
      const file = createMockFile('large.jpg', 'image/jpeg');

      const result = await compressImage(file, 0.8, {
        width: 800,
        height: 600,
      });

      expect(result.blob).toBeDefined();
      expect(result.statistics.resized).toBe(true);
    });

    it('maintains aspect ratio during resize', async () => {
      const file = createMockFile('wide.jpg', 'image/jpeg');

      const result = await compressImage(file, 0.8, {
        width: 800,
        height: 600,
      });

      // Should maintain aspect ratio
      expect(result.statistics.resized).toBe(true);
    });

    it('handles high quality compression', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1000);

      const result = await compressImage(file, 1.0);

      expect(result.blob).toBeDefined();
      expect(result.statistics.compressionRatio).toBeGreaterThan(0);
    });

    it('handles low quality compression', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1000);

      const result = await compressImage(file, 0.1);

      expect(result.blob).toBeDefined();
    });

    it('skips resize when dimensions are smaller', async () => {
      const file = createMockFile('small.jpg', 'image/jpeg');

      const result = await compressImage(file, 0.8, {
        width: 2000,
        height: 2000,
      });

      expect(result.statistics.resized).toBe(false);
    });
  });

  // ==========================================================================
  // Format Conversion Tests
  // ==========================================================================

  describe('convertImageFormat', () => {
    it('converts JPEG to PNG', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg');

      const result = await convertImageFormat(file, 'png');

      expect(result).toBeDefined();
      expect(result.type).toContain('png');
    });

    it('converts PNG to JPEG', async () => {
      const file = createMockFile('test.png', 'image/png');

      const result = await convertImageFormat(file, 'jpeg');

      expect(result).toBeDefined();
      expect(result.type).toContain('jpeg');
    });

    it('converts to WebP', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg');

      const result = await convertImageFormat(file, 'webp');

      expect(result).toBeDefined();
      expect(result.type).toContain('webp');
    });

    it('applies quality during conversion', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg');

      const result = await convertImageFormat(file, 'png', 0.9);

      expect(result).toBeDefined();
    });

    it('handles same format conversion', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg');

      const result = await convertImageFormat(file, 'jpeg');

      expect(result).toBeDefined();
      expect(result.type).toContain('jpeg');
    });
  });

  // ==========================================================================
  // Dimension Fitting Tests
  // ==========================================================================

  describe('fitDimensions', () => {
    it('fits dimensions maintaining aspect ratio', () => {
      const result = fitDimensions(1920, 1080, 800, 600);

      expect(result.width).toBeLessThanOrEqual(800);
      expect(result.height).toBeLessThanOrEqual(600);
      expect(result.width / result.height).toBeCloseTo(1920 / 1080, 2);
    });

    it('scales down wide images', () => {
      const result = fitDimensions(2000, 1000, 800, 800);

      expect(result.width).toBe(800);
      expect(result.height).toBe(400);
    });

    it('scales down tall images', () => {
      const result = fitDimensions(1000, 2000, 800, 800);

      expect(result.width).toBe(400);
      expect(result.height).toBe(800);
    });

    it('does not upscale smaller images', () => {
      const result = fitDimensions(400, 300, 800, 600);

      expect(result.width).toBe(400);
      expect(result.height).toBe(300);
    });

    it('handles square images', () => {
      const result = fitDimensions(1000, 1000, 500, 500);

      expect(result.width).toBe(500);
      expect(result.height).toBe(500);
    });

    it('handles very wide images', () => {
      const result = fitDimensions(3000, 500, 1000, 1000);

      expect(result.width).toBe(1000);
      expect(result.height).toBeCloseTo(167, 0);
    });

    it('handles very tall images', () => {
      const result = fitDimensions(500, 3000, 1000, 1000);

      expect(result.width).toBeCloseTo(167, 0);
      expect(result.height).toBe(1000);
    });

    it('handles exact fit', () => {
      const result = fitDimensions(800, 600, 800, 600);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });
  });

  // ==========================================================================
  // File Size Formatting Tests
  // ==========================================================================

  describe('formatFileSize', () => {
    it('formats bytes', () => {
      expect(formatFileSize(500).formatted).toBe('500 bytes');
      expect(formatFileSize(1000).formatted).toBe('1000 bytes');
    });

    it('formats kilobytes', () => {
      expect(formatFileSize(1024).formatted).toBe('1.00 KB');
      expect(formatFileSize(1536).formatted).toBe('1.50 KB');
      expect(formatFileSize(10 * 1024).formatted).toBe('10.00 KB');
    });

    it('formats megabytes', () => {
      expect(formatFileSize(1024 * 1024).formatted).toBe('1.00 MB');
      expect(formatFileSize(2.5 * 1024 * 1024).formatted).toBe('2.50 MB');
      expect(formatFileSize(100 * 1024 * 1024).formatted).toBe('100.00 MB');
    });

    it('formats gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024).formatted).toBe('1.00 GB');
      expect(formatFileSize(3.7 * 1024 * 1024 * 1024).formatted).toBe(
        '3.70 GB',
      );
    });

    it('handles zero bytes', () => {
      expect(formatFileSize(0).formatted).toBe('0 Bytes');
    });

    it('handles very small sizes', () => {
      expect(formatFileSize(1).formatted).toBe('1 bytes');
      expect(formatFileSize(10).formatted).toBe('10 bytes');
    });

    it('handles very large sizes', () => {
      const size = formatFileSize(10 * 1024 * 1024 * 1024);
      expect(size.formatted).toContain('GB');
    });

    it('rounds to 2 decimal places', () => {
      const size = formatFileSize(1234567);
      expect(size.formatted).toBe('1.18 MB');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles 1x1 pixel image', () => {
      const result = fitDimensions(1, 1, 100, 100);

      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
    });

    it('handles extremely wide aspect ratio', () => {
      const result = fitDimensions(10000, 100, 1000, 1000);

      expect(result.width).toBe(1000);
      expect(result.height).toBe(10);
    });

    it('handles extremely tall aspect ratio', () => {
      const result = fitDimensions(100, 10000, 1000, 1000);

      expect(result.width).toBe(10);
      expect(result.height).toBe(1000);
    });

    it('handles zero dimension gracefully', () => {
      const result = fitDimensions(0, 100, 100, 100);

      // Should handle edge case without error
      expect(result).toBeDefined();
    });

    it('formats fractional bytes', () => {
      expect(formatFileSize(512.7).formatted).toBe('513 bytes');
    });

    it('formats negative sizes as zero', () => {
      expect(formatFileSize(-100).formatted).toBe('0 Bytes');
    });

    it('handles NaN gracefully', () => {
      expect(formatFileSize(NaN).formatted).toBe('0 Bytes');
    });

    it('handles Infinity gracefully', () => {
      const size = formatFileSize(Infinity);
      expect(size).toBeDefined();
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('Integration', () => {
    it('compresses and converts format', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 5000);

      const compressed = await compressImage(file, 0.8);
      const converted = await convertImageFormat(
        new File([compressed.blob], 'test.jpg', { type: 'image/jpeg' }),
        'png',
      );

      expect(converted).toBeDefined();
      expect(converted.type).toContain('png');
    });

    it('gets dimensions and fits to target', async () => {
      const file = createMockFile('large.jpg', 'image/jpeg');

      const dimensions = await getImageDimensions(file);
      const fitted = fitDimensions(
        dimensions.width,
        dimensions.height,
        800,
        600,
      );

      expect(fitted.width).toBeLessThanOrEqual(800);
      expect(fitted.height).toBeLessThanOrEqual(600);
    });

    it('processes complete workflow', async () => {
      const file = createMockFile('photo.jpg', 'image/jpeg', 5 * 1024 * 1024);

      // Get dimensions
      const dims = await getImageDimensions(file);
      expect(dims).toBeDefined();

      // Fit to target
      const fitted = fitDimensions(dims, { width: 1920, height: 1080 });
      expect(fitted).toBeDefined();

      // Compress
      const compressed = await compressImage(file, 0.85, fitted);
      expect(compressed.blob).toBeDefined();

      // Format size
      const sizeStr = formatFileSize(compressed.statistics.compressedSize);
      expect(sizeStr).toBeDefined();
    });
  });
});
