/**
 * ChromeAILanguageDetectorService Tests
 *
 * Unit tests for Chrome AI Language Detector service wrapper.
 * Tests API integration, error handling, and result processing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChromeAILanguageDetectorService } from '../ChromeAIService';

describe('ChromeAILanguageDetectorService', () => {
  let mockDetector: any;
  let mockLanguageDetectorAPI: any;

  beforeEach(() => {
    // Mock detector instance
    mockDetector = {
      detect: vi.fn(),
    };

    // Mock LanguageDetector API
    mockLanguageDetectorAPI = {
      create: vi.fn().mockResolvedValue(mockDetector),
      capabilities: vi.fn().mockResolvedValue({
        available: 'readily',
        defaultTopK: 3,
        defaultThreshold: 0.5,
      }),
    };

    // Set up global mock
    (globalThis as any).LanguageDetector = mockLanguageDetectorAPI;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should return readily when API is available', async () => {
      const result = await ChromeAILanguageDetectorService.checkAvailability();
      expect(result).toBe('readily');
    });

    it('should return no when LanguageDetector is not defined', async () => {
      delete (globalThis as any).LanguageDetector;
      const result = await ChromeAILanguageDetectorService.checkAvailability();
      expect(result).toBe('no');
    });

    it('should return after-download when capabilities indicate download needed', async () => {
      mockLanguageDetectorAPI.capabilities.mockResolvedValue({
        available: 'after-download',
      });
      const result = await ChromeAILanguageDetectorService.checkAvailability();
      expect(result).toBe('after-download');
    });
  });

  describe('createInstance', () => {
    it('should create detector instance', async () => {
      const detector = await ChromeAILanguageDetectorService.createInstance();

      expect(mockLanguageDetectorAPI.create).toHaveBeenCalled();
      expect(detector).toBe(mockDetector);
    });

    it('should throw error when API is not available', async () => {
      delete (globalThis as any).LanguageDetector;

      await expect(
        ChromeAILanguageDetectorService.createInstance(),
      ).rejects.toThrow('Language Detector API is not available');
    });

    it('should handle creation errors', async () => {
      mockLanguageDetectorAPI.create.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(
        ChromeAILanguageDetectorService.createInstance(),
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('detect', () => {
    it('should detect language from text', async () => {
      const mockResults = [
        { detectedLanguage: 'en', confidence: 0.95 },
        { detectedLanguage: 'es', confidence: 0.03 },
        { detectedLanguage: 'fr', confidence: 0.02 },
      ];

      mockDetector.detect.mockResolvedValue(mockResults);

      const result = await ChromeAILanguageDetectorService.detect(
        mockDetector,
        'Hello world',
      );

      expect(mockDetector.detect).toHaveBeenCalledWith('Hello world');
      expect(result).toEqual(mockResults);
    });

    it('should handle empty text', async () => {
      mockDetector.detect.mockResolvedValue([]);

      const result = await ChromeAILanguageDetectorService.detect(
        mockDetector,
        '',
      );

      expect(result).toEqual([]);
    });

    it('should handle detection errors', async () => {
      mockDetector.detect.mockRejectedValue(new Error('Detection failed'));

      await expect(
        ChromeAILanguageDetectorService.detect(mockDetector, 'test'),
      ).rejects.toThrow('Detection failed');
    });

    it('should handle abort signal', async () => {
      const abortController = new AbortController();
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      mockDetector.detect.mockRejectedValue(abortError);

      await expect(
        ChromeAILanguageDetectorService.detect(
          mockDetector,
          'test',
          abortController.signal,
        ),
      ).rejects.toThrow('Aborted');
    });

    it('should handle multiple candidates', async () => {
      const mockResults = [
        { detectedLanguage: 'de', confidence: 0.85 },
        { detectedLanguage: 'nl', confidence: 0.1 },
        { detectedLanguage: 'en', confidence: 0.05 },
      ];

      mockDetector.detect.mockResolvedValue(mockResults);

      const result = await ChromeAILanguageDetectorService.detect(
        mockDetector,
        'Guten Tag',
      );

      expect(result).toHaveLength(3);
      expect(result[0].confidence).toBeGreaterThan(result[1].confidence);
    });

    it('should handle very long text', async () => {
      const longText = 'word '.repeat(10000);
      mockDetector.detect.mockResolvedValue([
        { detectedLanguage: 'en', confidence: 0.99 },
      ]);

      const result = await ChromeAILanguageDetectorService.detect(
        mockDetector,
        longText,
      );

      expect(mockDetector.detect).toHaveBeenCalledWith(longText);
      expect(result).toHaveLength(1);
    });

    it('should handle non-ASCII text', async () => {
      const japaneseText = 'こんにちは世界';
      mockDetector.detect.mockResolvedValue([
        { detectedLanguage: 'ja', confidence: 0.98 },
      ]);

      const result = await ChromeAILanguageDetectorService.detect(
        mockDetector,
        japaneseText,
      );

      expect(result[0].detectedLanguage).toBe('ja');
    });

    it('should handle mixed language text', async () => {
      const mixedText = 'Hello こんにちは Bonjour';
      mockDetector.detect.mockResolvedValue([
        { detectedLanguage: 'en', confidence: 0.45 },
        { detectedLanguage: 'ja', confidence: 0.35 },
        { detectedLanguage: 'fr', confidence: 0.2 },
      ]);

      const result = await ChromeAILanguageDetectorService.detect(
        mockDetector,
        mixedText,
      );

      expect(result).toHaveLength(3);
    });

    it('should handle low confidence results', async () => {
      mockDetector.detect.mockResolvedValue([
        { detectedLanguage: 'unknown', confidence: 0.15 },
      ]);

      const result = await ChromeAILanguageDetectorService.detect(
        mockDetector,
        '12345',
      );

      expect(result[0].confidence).toBeLessThan(0.5);
    });
  });

  describe('getCapabilities', () => {
    it('should return capabilities', async () => {
      const caps = await ChromeAILanguageDetectorService.getCapabilities();

      expect(mockLanguageDetectorAPI.capabilities).toHaveBeenCalled();
      expect(caps).toEqual({
        available: 'readily',
        defaultTopK: 3,
        defaultThreshold: 0.5,
      });
    });

    it('should handle missing capabilities', async () => {
      mockLanguageDetectorAPI.capabilities.mockResolvedValue(null);

      const caps = await ChromeAILanguageDetectorService.getCapabilities();
      expect(caps).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null detector instance', async () => {
      await expect(
        ChromeAILanguageDetectorService.detect(null as any, 'test'),
      ).rejects.toThrow();
    });

    it('should handle special characters', async () => {
      mockDetector.detect.mockResolvedValue([
        { detectedLanguage: 'en', confidence: 0.7 },
      ]);

      const result = await ChromeAILanguageDetectorService.detect(
        mockDetector,
        '@#$%^&*()',
      );

      expect(mockDetector.detect).toHaveBeenCalledWith('@#$%^&*()');
    });

    it('should handle whitespace only', async () => {
      mockDetector.detect.mockResolvedValue([]);

      const result = await ChromeAILanguageDetectorService.detect(
        mockDetector,
        '   \n\t   ',
      );

      expect(result).toEqual([]);
    });
  });
});
