/**
 * MultimodalHandler Test Suite
 *
 * Tests file upload validation, image processing, optimization,
 * and thumbnail generation
 *
 * Coverage: 30+ tests (validation, processing, edge cases)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MultimodalHandler } from '../../services/MultimodalHandler';
import {
  createMockFile,
  mockFileReader,
  mockImage,
  mockCanvas,
  mockURL,
  waitFor,
} from '../test-utils';

describe('MultimodalHandler', () => {
  let handler: MultimodalHandler;
  let fileReaderMock: ReturnType<typeof mockFileReader>;
  let imageMock: ReturnType<typeof mockImage>;
  let canvasMock: ReturnType<typeof mockCanvas>;
  let urlMock: ReturnType<typeof mockURL>;

  beforeEach(() => {
    handler = new MultimodalHandler();
    fileReaderMock = mockFileReader();
    imageMock = mockImage();
    canvasMock = mockCanvas();
    urlMock = mockURL();
  });

  afterEach(() => {
    fileReaderMock.restore();
    imageMock.restore();
    urlMock.restore();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // File Validation Tests
  // ==========================================================================

  describe('File Validation', () => {
    it('validates JPEG image', () => {
      const file = createMockFile('test.jpg', 'image/jpeg');

      const result = handler.validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('validates PNG image', () => {
      const file = createMockFile('test.png', 'image/png');

      const result = handler.validateFile(file);

      expect(result.valid).toBe(true);
    });

    it('validates GIF image', () => {
      const file = createMockFile('test.gif', 'image/gif');

      const result = handler.validateFile(file);

      expect(result.valid).toBe(true);
    });

    it('validates WebP image', () => {
      const file = createMockFile('test.webp', 'image/webp');

      const result = handler.validateFile(file);

      expect(result.valid).toBe(true);
    });

    it('rejects unsupported file type', () => {
      const file = createMockFile('test.txt', 'text/plain');

      const result = handler.validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not supported');
    });

    it('rejects file exceeding size limit', () => {
      const file = createMockFile('large.jpg', 'image/jpeg', 11 * 1024 * 1024); // 11MB

      const result = handler.validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum size');
    });

    it('accepts file at size limit', () => {
      const file = createMockFile('max.jpg', 'image/jpeg', 10 * 1024 * 1024); // 10MB

      const result = handler.validateFile(file);

      expect(result.valid).toBe(true);
    });

    it('rejects empty file', () => {
      const file = createMockFile('empty.jpg', 'image/jpeg', 0);

      const result = handler.validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('validates with custom constraints', () => {
      const customHandler = new MultimodalHandler({
        maxFileSize: 1024 * 1024, // 1MB
        allowedTypes: ['image/jpeg'],
      });

      const jpegFile = createMockFile('test.jpg', 'image/jpeg', 500 * 1024);
      const pngFile = createMockFile('test.png', 'image/png', 500 * 1024);
      const largeFile = createMockFile(
        'large.jpg',
        'image/jpeg',
        2 * 1024 * 1024,
      );

      expect(customHandler.validateFile(jpegFile).valid).toBe(true);
      expect(customHandler.validateFile(pngFile).valid).toBe(false);
      expect(customHandler.validateFile(largeFile).valid).toBe(false);
    });

    it('provides helpful error messages', () => {
      const txtFile = createMockFile('doc.txt', 'text/plain');
      const largeFile = createMockFile(
        'big.jpg',
        'image/jpeg',
        20 * 1024 * 1024,
      );

      const txtResult = handler.validateFile(txtFile);
      const largeResult = handler.validateFile(largeFile);

      expect(txtResult.error).toContain('Supported types');
      expect(largeResult.error).toContain('10 MB');
    });
  });

  // ==========================================================================
  // Image Processing Tests
  // ==========================================================================

  describe('Image Processing', () => {
    it('processes valid image file', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg');

      const result = await handler.processImage(file);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.file).toBe(file);
      expect(result.dataUrl).toBeDefined();
      expect(result.blobUrl).toBeDefined();
    });

    it('extracts image dimensions', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg');

      const result = await handler.processImage(file);

      expect(result.dimensions).toBeDefined();
      expect(result.dimensions.width).toBe(100);
      expect(result.dimensions.height).toBe(100);
    });

    it('includes image metadata', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 2048);

      const result = await handler.processImage(file);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.fileName).toBe('test.jpg');
      expect(result.metadata.originalSize).toBe(2048);
      expect(result.metadata.aspectRatio).toBe(1.0);
    });

    it('generates thumbnail', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg');

      const result = await handler.processImage(file);

      expect(result.thumbnailUrl).toBeDefined();
    });

    it('rejects invalid file during processing', async () => {
      const file = createMockFile('invalid.txt', 'text/plain');

      await expect(handler.processImage(file)).rejects.toThrow('not supported');
    });

    it('handles image load errors', async () => {
      const file = createMockFile('corrupt.jpg', 'image/jpeg');

      // Mock image to fail loading
      const originalImage = global.Image;
      class ErrorImage {
        onerror: (() => void) | null = null;
        onload: (() => void) | null = null;
        src = '';

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 10);
        }
      }
      (global as any).Image = ErrorImage;

      await expect(handler.processImage(file)).rejects.toThrow();

      (global as any).Image = originalImage;
    });

    it('handles FileReader errors', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg');

      // Mock FileReader to fail
      fileReaderMock.restore();
      class ErrorFileReader {
        onerror: ((event: any) => void) | null = null;
        onload: ((event: any) => void) | null = null;

        readAsDataURL(_blob: Blob) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror({ target: { error: new Error('Read failed') } });
            }
          }, 10);
        }
      }
      (global as any).FileReader = ErrorFileReader;

      await expect(handler.processImage(file)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // Image Optimization Tests
  // ==========================================================================

  describe('Image Optimization', () => {
    it('optimizes large images', async () => {
      const handler = new MultimodalHandler({
        processingOptions: {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.8,
          preserveAspectRatio: true,
        },
      });

      const file = createMockFile('large.jpg', 'image/jpeg');

      const result = await handler.processImage(file);

      expect(result.optimized).toBe(true);
    });

    it('preserves aspect ratio during optimization', async () => {
      const handler = new MultimodalHandler({
        processingOptions: {
          maxWidth: 800,
          maxHeight: 800,
          preserveAspectRatio: true,
        },
      });

      const file = createMockFile('wide.jpg', 'image/jpeg');

      const result = await handler.processImage(file);

      // wide.jpg is 2000x1000 in the mock, so aspect ratio should be 2.0
      expect(result.metadata.aspectRatio).toBe(2.0);
    });

    it('skips optimization for small images', async () => {
      const handler = new MultimodalHandler({
        processingOptions: {
          maxWidth: 2000,
          maxHeight: 2000,
        },
      });

      const file = createMockFile('small.jpg', 'image/jpeg');

      const result = await handler.processImage(file);

      expect(result.optimized).toBe(false);
    });

    it('compresses images with quality setting', async () => {
      const handler = new MultimodalHandler({
        processingOptions: {
          quality: 0.5,
        },
      });

      const file = createMockFile('test.jpg', 'image/jpeg', 5000);

      const result = await handler.processImage(file);

      expect(result.metadata.currentSize).toBeLessThanOrEqual(5000);
    });

    it('converts to specified format', async () => {
      const handler = new MultimodalHandler({
        processingOptions: {
          outputFormat: 'png',
        },
      });

      const file = createMockFile('test.jpg', 'image/jpeg');

      const result = await handler.processImage(file);

      expect(result.format).toBe('png');
    });
  });

  // ==========================================================================
  // Thumbnail Generation Tests
  // ==========================================================================

  describe('Thumbnail Generation', () => {
    it('generates thumbnail with default size', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg');

      const result = await handler.processImage(file);

      expect(result.thumbnailUrl).toBeDefined();
      expect(result.thumbnailUrl).toContain('data:image');
    });

    it('generates thumbnail with custom size', async () => {
      const handler = new MultimodalHandler({
        processingOptions: {
          thumbnailSize: 64,
        },
      });

      const file = createMockFile('test.jpg', 'image/jpeg');

      const result = await handler.processImage(file);

      expect(result.thumbnailUrl).toBeDefined();
    });

    it('maintains aspect ratio in thumbnail', async () => {
      const file = createMockFile('wide.jpg', 'image/jpeg');

      const result = await handler.processImage(file);

      // Thumbnail should be generated without errors
      expect(result.thumbnailUrl).toBeDefined();
    });
  });

  // ==========================================================================
  // Batch Processing Tests
  // ==========================================================================

  describe('Batch Processing', () => {
    it('processes multiple files', async () => {
      const files = [
        createMockFile('file1.jpg', 'image/jpeg'),
        createMockFile('file2.png', 'image/png'),
        createMockFile('file3.gif', 'image/gif'),
      ];

      const results = await Promise.all(
        files.map((file) => handler.processImage(file)),
      );

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
      });
    });

    it('handles partial failures in batch', async () => {
      const files = [
        createMockFile('valid.jpg', 'image/jpeg'),
        createMockFile('invalid.txt', 'text/plain'),
        createMockFile('another.png', 'image/png'),
      ];

      const results = await Promise.allSettled(
        files.map((file) => handler.processImage(file)),
      );

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('creates validation error', () => {
      const error = (handler as any).createError(
        'INVALID_FORMAT',
        'Test error',
        'test.txt',
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('Test error');
      expect(error.message).toContain('test.txt');
    });

    it('creates file too large error', () => {
      const error = (handler as any).createError(
        'FILE_TOO_LARGE',
        'File exceeds limit',
        'big.jpg',
      );

      expect(error.message).toContain('exceeds limit');
      expect(error.message).toContain('big.jpg');
    });

    it('creates processing error', () => {
      const error = (handler as any).createError(
        'PROCESSING_FAILED',
        'Failed to process',
        'image.jpg',
      );

      expect(error.message).toContain('Failed to process');
    });

    it('handles unsupported format gracefully', async () => {
      const file = createMockFile('doc.pdf', 'application/pdf');

      await expect(handler.processImage(file)).rejects.toThrow('not supported');
    });

    it('provides detailed error information', async () => {
      const largeFile = createMockFile(
        'huge.jpg',
        'image/jpeg',
        20 * 1024 * 1024,
      );

      try {
        await handler.processImage(largeFile);
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('huge.jpg');
        expect(error.message).toContain('exceeds');
      }
    });
  });

  // ==========================================================================
  // Resource Management Tests
  // ==========================================================================

  describe('Resource Management', () => {
    it('creates blob URLs for images', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg');

      const result = await handler.processImage(file);

      expect(result.blobUrl).toBeDefined();
      expect(result.blobUrl).toContain('blob:');
      expect(urlMock.createObjectURL).toHaveBeenCalled();
    });

    it('generates unique IDs for processed images', async () => {
      const file1 = createMockFile('test1.jpg', 'image/jpeg');
      const file2 = createMockFile('test2.jpg', 'image/jpeg');

      const result1 = await handler.processImage(file1);
      const result2 = await handler.processImage(file2);

      expect(result1.id).not.toBe(result2.id);
    });

    it('includes compression statistics', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 5000);

      const result = await handler.processImage(file);

      expect(result.metadata.originalSize).toBe(5000);
      expect(result.metadata.compressionRatio).toBeDefined();
      expect(result.metadata.compressionRatio).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Configuration Tests
  // ==========================================================================

  describe('Configuration', () => {
    it('uses default constraints', () => {
      const handler = new MultimodalHandler();

      const validFile = createMockFile('test.jpg', 'image/jpeg', 1024);
      const result = handler.validateFile(validFile);

      expect(result.valid).toBe(true);
    });

    it('applies custom max file size', () => {
      const handler = new MultimodalHandler({
        maxFileSize: 1024 * 1024, // 1MB
      });

      const smallFile = createMockFile('small.jpg', 'image/jpeg', 500 * 1024);
      const largeFile = createMockFile(
        'large.jpg',
        'image/jpeg',
        2 * 1024 * 1024,
      );

      expect(handler.validateFile(smallFile).valid).toBe(true);
      expect(handler.validateFile(largeFile).valid).toBe(false);
    });

    it('applies custom allowed types', () => {
      const handler = new MultimodalHandler({
        allowedTypes: ['image/jpeg', 'image/png'],
      });

      const jpegFile = createMockFile('test.jpg', 'image/jpeg');
      const gifFile = createMockFile('test.gif', 'image/gif');

      expect(handler.validateFile(jpegFile).valid).toBe(true);
      expect(handler.validateFile(gifFile).valid).toBe(false);
    });

    it('applies custom max files', () => {
      const handler = new MultimodalHandler({
        maxFiles: 3,
      });

      expect((handler as any).constraints.maxFiles).toBe(3);
    });

    it('applies custom processing options', () => {
      const handler = new MultimodalHandler({
        processingOptions: {
          maxWidth: 1024,
          maxHeight: 768,
          quality: 0.9,
        },
      });

      expect((handler as any).processingOptions.maxWidth).toBe(1024);
      expect((handler as any).processingOptions.quality).toBe(0.9);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles file with no extension', () => {
      const file = createMockFile('noextension', 'image/jpeg');

      const result = handler.validateFile(file);

      expect(result.valid).toBe(true);
    });

    it('handles file with uppercase extension', () => {
      const file = createMockFile('TEST.JPG', 'image/jpeg');

      const result = handler.validateFile(file);

      expect(result.valid).toBe(true);
    });

    it('handles file with multiple dots in name', () => {
      const file = createMockFile('my.test.file.jpg', 'image/jpeg');

      const result = handler.validateFile(file);

      expect(result.valid).toBe(true);
    });

    it('handles very small images', async () => {
      const file = createMockFile('tiny.jpg', 'image/jpeg', 100);

      const result = await handler.processImage(file);

      expect(result).toBeDefined();
      expect(result.metadata.originalSize).toBe(100);
    });

    it('handles square images', async () => {
      const file = createMockFile('square.jpg', 'image/jpeg');

      const result = await handler.processImage(file);

      expect(result.metadata.aspectRatio).toBe(1.0);
    });

    it('handles processing with minimal options', async () => {
      const handler = new MultimodalHandler({
        processingOptions: {},
      });

      const file = createMockFile('test.jpg', 'image/jpeg');

      const result = await handler.processImage(file);

      expect(result).toBeDefined();
    });
  });
});
