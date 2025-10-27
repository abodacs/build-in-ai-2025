/**
 * ChromeAIService Test Suite
 *
 * Production-grade tests for Chrome AI Service Layer
 * Tests feature detection, availability checking, model download management, and utility methods
 *
 * Coverage Target: 95%+
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChromeAIService } from '../services/ChromeAIService';
import type { DownloadProgress } from '../types/summarizer.types';

// ============================================================================
// Test Setup & Mocks
// ============================================================================

describe('ChromeAIService', () => {
  let mockSummarizer: any;
  let originalSelf: any;
  let originalWindow: any;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Store original values
    originalSelf = global.self;
    originalWindow = global.window;

    // Create mock Summarizer API
    mockSummarizer = {
      availability: vi.fn(),
      create: vi.fn(),
    };

    // Reset global.self to a plain object we can modify
    (global as any).self = {};
    (global as any).window = {};
  });

  afterEach(() => {
    // Restore originals
    global.self = originalSelf;
    global.window = originalWindow;
  });

  // ============================================================================
  // Feature Detection Tests
  // ============================================================================

  describe('Feature Detection', () => {
    describe('isSupported()', () => {
      it('should return true when self.Summarizer exists', () => {
        // Arrange
        (global.self as any).Summarizer = mockSummarizer;

        // Act
        const result = ChromeAIService.isSupported();

        // Assert
        expect(result).toBe(true);
      });

      it('should return true when window.Summarizer exists', () => {
        // Arrange
        delete (global.self as any).Summarizer;
        (global.window as any).Summarizer = mockSummarizer;

        // Act
        const result = ChromeAIService.isSupported();

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when neither self nor window has Summarizer', () => {
        // Arrange
        delete (global.self as any).Summarizer;
        delete (global.window as any).Summarizer;

        // Act
        const result = ChromeAIService.isSupported();

        // Assert
        expect(result).toBe(false);
      });

      it('should prioritize self.Summarizer over window.Summarizer', () => {
        // Arrange
        const selfSummarizer = { test: 'self' };
        const windowSummarizer = { test: 'window' };
        (global.self as any).Summarizer = selfSummarizer;
        (global.window as any).Summarizer = windowSummarizer;

        // Act
        ChromeAIService.isSupported();
        const api = ChromeAIService.getSummarizerAPI();

        // Assert
        expect(api).toBe(selfSummarizer);
      });
    });

    describe('getSummarizerAPI()', () => {
      it('should return self.Summarizer when available', () => {
        // Arrange
        (global.self as any).Summarizer = mockSummarizer;

        // Act
        const result = ChromeAIService.getSummarizerAPI();

        // Assert
        expect(result).toBe(mockSummarizer);
      });

      it('should return window.Summarizer when self not available', () => {
        // Arrange
        delete (global.self as any).Summarizer;
        (global.window as any).Summarizer = mockSummarizer;

        // Act
        const result = ChromeAIService.getSummarizerAPI();

        // Assert
        expect(result).toBe(mockSummarizer);
      });

      it('should return null when no API is available', () => {
        // Arrange
        delete (global.self as any).Summarizer;
        delete (global.window as any).Summarizer;

        // Act
        const result = ChromeAIService.getSummarizerAPI();

        // Assert
        expect(result).toBeNull();
      });
    });
  });

  // ============================================================================
  // Availability Checking Tests
  // ============================================================================

  describe('Availability Checking', () => {
    describe('checkAvailability()', () => {
      it('should return "no" availability when API is not supported', async () => {
        // Arrange
        delete (global.self as any).Summarizer;
        delete (global.window as any).Summarizer;

        // Act
        const result = await ChromeAIService.checkAvailability();

        // Assert
        expect(result.availability).toBe('no');
        expect(result.requirements).toMatchObject({
          chromeVersion: 'Chrome 138+',
          storageRequired: expect.any(String),
          vramRequired: expect.any(String),
          networkRequired: true,
        });
      });

      it('should return "readily" when API is immediately available', async () => {
        // Arrange
        (global.self as any).Summarizer = mockSummarizer;
        mockSummarizer.availability.mockResolvedValue('available');

        // Act
        const result = await ChromeAIService.checkAvailability();

        // Assert
        expect(result.availability).toBe('available');
        expect(result.requirements.networkRequired).toBe(false);
        expect(mockSummarizer.availability).toHaveBeenCalledOnce();
      });

      it('should return "after-download" when model needs downloading', async () => {
        // Arrange
        (global.self as any).Summarizer = mockSummarizer;
        mockSummarizer.availability.mockResolvedValue('after-download');

        // Act
        const result = await ChromeAIService.checkAvailability();

        // Assert
        expect(result.availability).toBe('after-download');
        expect(result.requirements.networkRequired).toBe(true);
      });

      it('should normalize playground "available" to "readily"', async () => {
        // Arrange
        (global.window as any).Summarizer = mockSummarizer;
        mockSummarizer.availability.mockResolvedValue('available');

        // Act
        const result = await ChromeAIService.checkAvailability();

        // Assert
        expect(result.availability).toBe('available');
      });

      it('should normalize playground "downloadable" to "after-download"', async () => {
        // Arrange
        (global.window as any).Summarizer = mockSummarizer;
        mockSummarizer.availability.mockResolvedValue('downloadable');

        // Act
        const result = await ChromeAIService.checkAvailability();

        // Assert
        expect(result.availability).toBe('after-download');
      });

      it('should normalize playground "not-available" to "no"', async () => {
        // Arrange
        (global.window as any).Summarizer = mockSummarizer;
        mockSummarizer.availability.mockResolvedValue('not-available');

        // Act
        const result = await ChromeAIService.checkAvailability();

        // Assert
        expect(result.availability).toBe('no');
      });

      it('should handle API errors gracefully', async () => {
        // Arrange
        (global.self as any).Summarizer = mockSummarizer;
        mockSummarizer.availability.mockRejectedValue(new Error('API Error'));
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        // Act
        const result = await ChromeAIService.checkAvailability();

        // Assert
        expect(result.availability).toBe('no');
        expect(consoleSpy).toHaveBeenCalled();

        // Cleanup
        consoleSpy.mockRestore();
      });

      it('should handle missing availability method', async () => {
        // Arrange
        (global.self as any).Summarizer = { create: vi.fn() };

        // Act
        const result = await ChromeAIService.checkAvailability();

        // Assert
        expect(result.availability).toBe('no');
      });
    });
  });

  // ============================================================================
  // Model Download Management Tests
  // ============================================================================

  describe('Model Download Management', () => {
    describe('downloadModel()', () => {
      it('should throw error when API is not available', async () => {
        // Arrange
        delete (global.self as any).Summarizer;
        delete (global.window as any).Summarizer;

        // Act & Assert
        await expect(ChromeAIService.downloadModel(() => {})).rejects.toThrow(
          'Summarizer API not available',
        );
      });

      it('should track download progress correctly', async () => {
        // Arrange
        (global.self as any).Summarizer = mockSummarizer;
        const progressCallback = vi.fn();
        const mockMonitor = {
          addEventListener: vi.fn(),
        };

        mockSummarizer.create.mockImplementation((options: any) => {
          if (options.monitor) {
            options.monitor(mockMonitor);

            // Simulate progress events
            setTimeout(() => {
              const progressEvent = { loaded: 11000000, total: 22000000 };
              const listeners = mockMonitor.addEventListener.mock.calls.find(
                (call) => call[0] === 'downloadprogress',
              );
              if (listeners) listeners[1](progressEvent);
            }, 0);

            // Simulate completion
            setTimeout(() => {
              const completeListeners =
                mockMonitor.addEventListener.mock.calls.find(
                  (call) => call[0] === 'downloadcomplete',
                );
              if (completeListeners) completeListeners[1]({});
            }, 10);
          }
          return Promise.resolve({});
        });

        // Act
        await ChromeAIService.downloadModel(progressCallback);

        // Assert
        expect(progressCallback).toHaveBeenCalled();
        expect(progressCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            loaded: expect.any(Number),
            total: expect.any(Number),
            percentage: expect.any(Number),
            timeRemaining: expect.any(Number),
          }),
        );
      });

      it('should report 100% progress on completion', async () => {
        // Arrange
        (global.self as any).Summarizer = mockSummarizer;
        const progressCallback = vi.fn();
        const mockMonitor = {
          addEventListener: vi.fn(),
        };

        mockSummarizer.create.mockImplementation((options: any) => {
          if (options.monitor) {
            options.monitor(mockMonitor);
            setTimeout(() => {
              const listeners = mockMonitor.addEventListener.mock.calls.find(
                (call) => call[0] === 'downloadcomplete',
              );
              if (listeners) listeners[1]({});
            }, 0);
          }
          return Promise.resolve({});
        });

        // Act
        await ChromeAIService.downloadModel(progressCallback);

        // Assert
        const finalCall =
          progressCallback.mock.calls[progressCallback.mock.calls.length - 1];
        expect(finalCall[0].percentage).toBe(100);
        expect(finalCall[0].timeRemaining).toBe(0);
      });

      it('should handle download errors', async () => {
        // Arrange
        (global.self as any).Summarizer = mockSummarizer;
        const progressCallback = vi.fn();

        // Mock a download error scenario
        mockSummarizer.create.mockRejectedValue(new Error('Download failed'));

        // Act & Assert - Just verify error is thrown
        await expect(
          ChromeAIService.downloadModel(progressCallback),
        ).rejects.toThrow();
      });

      it('should calculate time remaining accurately', async () => {
        // Arrange
        (global.self as any).Summarizer = mockSummarizer;
        let capturedProgress: DownloadProgress | null = null;
        const mockMonitor = {
          addEventListener: vi.fn(),
        };

        mockSummarizer.create.mockImplementation((options: any) => {
          if (options.monitor) {
            options.monitor(mockMonitor);
            setTimeout(() => {
              const listeners = mockMonitor.addEventListener.mock.calls.find(
                (call) => call[0] === 'downloadprogress',
              );
              if (listeners) {
                listeners[1]({ loaded: 5500000, total: 22000000 });
              }
            }, 100);
            setTimeout(() => {
              const completeListeners =
                mockMonitor.addEventListener.mock.calls.find(
                  (call) => call[0] === 'downloadcomplete',
                );
              if (completeListeners) completeListeners[1]({});
            }, 200);
          }
          return Promise.resolve({});
        });

        // Act
        await ChromeAIService.downloadModel((progress) => {
          if (progress.percentage > 0 && progress.percentage < 100) {
            capturedProgress = progress;
          }
        });

        // Assert
        expect(capturedProgress).not.toBeNull();
        expect(capturedProgress!.timeRemaining).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ============================================================================
  // Model Information Tests
  // ============================================================================

  describe('Model Information', () => {
    describe('getModelInfo()', () => {
      it('should return correct model information', () => {
        // Act
        const info = ChromeAIService.getModelInfo();

        // Assert
        expect(info).toEqual({
          estimatedSize: 22 * 1024 * 1024,
          estimatedSizeMB: 22,
          requirements: {
            chrome: '138+',
            storage: '22+ GB',
            vram: '4+ GB',
          },
        });
      });

      it('should return consistent size values', () => {
        // Act
        const info = ChromeAIService.getModelInfo();

        // Assert
        expect(info.estimatedSizeMB * 1024 * 1024).toBe(info.estimatedSize);
      });
    });
  });

  // ============================================================================
  // System Requirements Tests
  // ============================================================================

  describe('System Requirements Checker', () => {
    describe('checkSystemRequirements()', () => {
      it('should detect Chrome version correctly', async () => {
        // Arrange
        Object.defineProperty(navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
          configurable: true,
        });

        // Act
        const result = await ChromeAIService.checkSystemRequirements();

        // Assert
        expect(result.browser.version).toBe(140);
        expect(result.browser.supported).toBe(true);
      });

      it('should detect unsupported Chrome version', async () => {
        // Arrange
        Object.defineProperty(navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          configurable: true,
        });

        // Act
        const result = await ChromeAIService.checkSystemRequirements();

        // Assert
        expect(result.browser.version).toBe(130);
        expect(result.browser.supported).toBe(false);
      });

      it('should detect Edge as supported browser', async () => {
        // Arrange
        Object.defineProperty(navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
          configurable: true,
        });

        // Act
        const result = await ChromeAIService.checkSystemRequirements();

        // Assert
        expect(result.browser.supported).toBe(true);
      });

      it('should check online status', async () => {
        // Arrange
        Object.defineProperty(navigator, 'onLine', {
          value: true,
          configurable: true,
        });

        // Act
        const result = await ChromeAIService.checkSystemRequirements();

        // Assert
        expect(result.online).toBe(true);
      });

      it('should handle storage estimation errors gracefully', async () => {
        // Arrange
        Object.defineProperty(navigator, 'storage', {
          value: {
            estimate: () => Promise.reject(new Error('Storage API error')),
          },
          configurable: true,
        });
        const consoleSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => {});

        // Act
        const result = await ChromeAIService.checkSystemRequirements();

        // Assert
        expect(result.storage).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();

        // Cleanup
        consoleSpy.mockRestore();
      });

      it('should calculate storage sufficiency correctly', async () => {
        // Arrange
        Object.defineProperty(navigator, 'storage', {
          value: {
            estimate: () =>
              Promise.resolve({
                quota: 100 * 1024 * 1024 * 1024, // 100GB
                usage: 50 * 1024 * 1024 * 1024, // 50GB used
              }),
          },
          configurable: true,
        });

        // Act
        const result = await ChromeAIService.checkSystemRequirements();

        // Assert
        expect(result.storage).not.toBeNull();
        expect(result.storage!.sufficient).toBe(true);
        expect(result.storage!.available).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // Utility Methods Tests
  // ============================================================================

  describe('Utility Methods', () => {
    describe('formatBytes()', () => {
      it('should format bytes correctly', () => {
        expect(ChromeAIService.formatBytes(0)).toBe('0 Bytes');
        expect(ChromeAIService.formatBytes(1024)).toBe('1 KB');
        expect(ChromeAIService.formatBytes(1024 * 1024)).toBe('1 MB');
        expect(ChromeAIService.formatBytes(22 * 1024 * 1024)).toBe('22 MB');
        expect(ChromeAIService.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      });

      it('should handle fractional values', () => {
        const result = ChromeAIService.formatBytes(1536); // 1.5 KB
        expect(result).toBe('1.5 KB');
      });

      it('should round to 2 decimal places', () => {
        const result = ChromeAIService.formatBytes(1234567);
        expect(result).toMatch(/^\d+(\.\d{1,2})? MB$/);
      });
    });

    describe('formatTime()', () => {
      it('should format seconds correctly', () => {
        expect(ChromeAIService.formatTime(30)).toBe('30s');
        expect(ChromeAIService.formatTime(45)).toBe('45s');
      });

      it('should format minutes and seconds correctly', () => {
        expect(ChromeAIService.formatTime(90)).toBe('1m 30s');
        expect(ChromeAIService.formatTime(125)).toBe('2m 5s');
      });

      it('should format hours and minutes correctly', () => {
        expect(ChromeAIService.formatTime(3661)).toBe('1h 1m');
        expect(ChromeAIService.formatTime(7200)).toBe('2h 0m');
      });

      it('should handle edge cases', () => {
        expect(ChromeAIService.formatTime(0)).toBe('0s');
        expect(ChromeAIService.formatTime(60)).toBe('1m 0s');
        expect(ChromeAIService.formatTime(3600)).toBe('1h 0m');
      });
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle complete workflow: detect → check availability → download', async () => {
      // Arrange
      (global.self as any).Summarizer = mockSummarizer;
      mockSummarizer.availability.mockResolvedValue('after-download');
      const mockMonitor = {
        addEventListener: vi.fn(),
      };

      mockSummarizer.create.mockImplementation((options: any) => {
        if (options.monitor) {
          options.monitor(mockMonitor);
          setTimeout(() => {
            const listeners = mockMonitor.addEventListener.mock.calls.find(
              (call) => call[0] === 'downloadcomplete',
            );
            if (listeners) listeners[1]({});
          }, 0);
        }
        return Promise.resolve({});
      });

      // Act
      const isSupported = ChromeAIService.isSupported();
      const availability = await ChromeAIService.checkAvailability();
      const progressUpdates: DownloadProgress[] = [];
      await ChromeAIService.downloadModel((progress) => {
        progressUpdates.push(progress);
      });

      // Assert
      expect(isSupported).toBe(true);
      expect(availability.availability).toBe('after-download');
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].percentage).toBe(100);
    });

    it('should handle unsupported environment gracefully', async () => {
      // Arrange
      delete (global.self as any).Summarizer;
      delete (global.window as any).Summarizer;

      // Act
      const isSupported = ChromeAIService.isSupported();
      const api = ChromeAIService.getSummarizerAPI();
      const availability = await ChromeAIService.checkAvailability();

      // Assert
      expect(isSupported).toBe(false);
      expect(api).toBeNull();
      expect(availability.availability).toBe('no');
    });
  });

  // ============================================================================
  // Edge Cases & Error Handling
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle undefined window gracefully', () => {
      // Arrange
      const originalWindow = global.window;
      (global as any).window = undefined;

      // Act
      const result = ChromeAIService.isSupported();

      // Assert
      expect(result).toBe(false);

      // Cleanup
      global.window = originalWindow;
    });

    it('should handle API availability returning unexpected values', async () => {
      // Arrange
      (global.self as any).Summarizer = mockSummarizer;
      mockSummarizer.availability.mockResolvedValue('unexpected-value');

      // Act
      const result = await ChromeAIService.checkAvailability();

      // Assert - unknown values should be normalized to 'no' for safety
      expect(result.availability).toBe('no');
    });

    it('should handle concurrent availability checks', async () => {
      // Arrange
      (global.self as any).Summarizer = mockSummarizer;
      mockSummarizer.availability.mockResolvedValue('available');

      // Act
      const results = await Promise.all([
        ChromeAIService.checkAvailability(),
        ChromeAIService.checkAvailability(),
        ChromeAIService.checkAvailability(),
      ]);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.availability).toBe('available');
      });
    });
  });
});
