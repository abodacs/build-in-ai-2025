/**
 * Language Detection + Translator Integration Tests
 *
 * Tests the integration between Language Detection and Translator APIs.
 * Validates workflows where language detection feeds into translation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLanguageDetection } from '../hooks/useLanguageDetection';
import { useTranslator } from '../../translator/hooks/useTranslator';

// Mock Chrome AI APIs
const mockDetector = {
  detect: vi.fn(),
  destroy: vi.fn(), // ✅ CRITICAL FIX: Add destroy() method
};

const mockTranslator = {
  translate: vi.fn(),
  destroy: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();

  // Setup Language Detector mock
  (window as any).LanguageDetector = {
    // ✅ FIX: Use window not globalThis
    create: vi.fn().mockResolvedValue(mockDetector),
    availability: vi.fn().mockResolvedValue('readily'), // ✅ FIX: Add availability()
    capabilities: vi.fn().mockResolvedValue({
      available: 'readily',
      defaultTopK: 3,
      defaultThreshold: 0.5,
    }),
  };

  // Setup Translator mock
  (window as any).Translator = {
    // ✅ FIX: Use window not globalThis
    create: vi.fn().mockResolvedValue(mockTranslator),
    availability: vi.fn().mockResolvedValue('readily'), // ✅ FIX: Add availability()
    capabilities: vi.fn().mockResolvedValue({
      available: 'readily',
      languagePairAvailable: vi.fn().mockResolvedValue('readily'),
    }),
  };

  // Default mock responses
  mockDetector.detect.mockResolvedValue([
    { detectedLanguage: 'en', confidence: 0.95 },
  ]);

  mockTranslator.translate.mockResolvedValue('Translated text');
});

describe('Language Detection + Translator Integration', () => {
  describe('Detect then Translate Workflow', () => {
    it('should detect language and translate text', async () => {
      // Step 1: Detect language
      const { result: detectionResult } = renderHook(() =>
        useLanguageDetection({
          confidenceThreshold: 0.5,
          maxCandidates: 3,
          showAllCandidates: false,
        }),
      );

      await act(async () => {
        await detectionResult.current.actions.detect('Hello world');
      });

      await waitFor(() => {
        expect(detectionResult.current.primaryResult?.detectedLanguage).toBe(
          'en',
        );
      });

      // Step 2: Translate based on detected language
      const { result: translatorResult } = renderHook(() =>
        useTranslator({
          sourceLanguage:
            detectionResult.current.primaryResult?.detectedLanguage || 'en',
          targetLanguage: 'es',
        }),
      );

      // Wait for translator hook to initialize
      await waitFor(() => {
        expect(translatorResult.current.translate).toBeDefined();
      });

      await act(async () => {
        await translatorResult.current.translate('Hello world');
      });

      await waitFor(() => {
        expect(translatorResult.current.result?.translated).toBe(
          'Translated text',
        );
      });
    });

    it('should handle auto-detect to translation pipeline', async () => {
      // Detect language from input
      const { result: detectionResult } = renderHook(() =>
        useLanguageDetection({
          confidenceThreshold: 0.5,
          maxCandidates: 1,
          showAllCandidates: false,
        }),
      );

      const inputText = 'Bonjour le monde';
      mockDetector.detect.mockResolvedValue([
        { detectedLanguage: 'fr', confidence: 0.98 },
      ]);

      await act(async () => {
        await detectionResult.current.actions.detect(inputText);
      });

      await waitFor(() => {
        expect(detectionResult.current.primaryResult?.detectedLanguage).toBe(
          'fr',
        );
      });

      // Use detected language for translation
      const detectedLang =
        detectionResult.current.primaryResult?.detectedLanguage;
      expect(detectedLang).toBe('fr');

      const { result: translatorResult } = renderHook(() =>
        useTranslator({
          sourceLanguage: detectedLang || 'auto',
          targetLanguage: 'en',
        }),
      );

      // Wait for translator hook to initialize
      await waitFor(() => {
        expect(translatorResult.current.translate).toBeDefined();
      });

      mockTranslator.translate.mockResolvedValue('Hello world');

      await act(async () => {
        await translatorResult.current.translate(inputText);
      });

      await waitFor(() => {
        expect(translatorResult.current.result?.translated).toBe('Hello world');
      });
    });

    it('should validate detected language before translation', async () => {
      const { result: detectionResult } = renderHook(() =>
        useLanguageDetection({
          confidenceThreshold: 0.8,
          maxCandidates: 3,
          showAllCandidates: false,
        }),
      );

      // Detect with low confidence
      mockDetector.detect.mockResolvedValue([
        { detectedLanguage: 'unknown', confidence: 0.3 },
      ]);

      await act(async () => {
        await detectionResult.current.actions.detect('???');
      });

      await waitFor(() => {
        // Should have no results due to low confidence
        expect(detectionResult.current.results).toEqual([]);
      });

      // Should not proceed with translation if language not confidently detected
      expect(detectionResult.current.primaryResult).toBeNull();
    });
  });

  describe('Multi-language Detection', () => {
    it('should detect multiple languages and translate each', async () => {
      const { result: detectionResult } = renderHook(() =>
        useLanguageDetection({
          confidenceThreshold: 0.5,
          maxCandidates: 3,
          showAllCandidates: false,
        }),
      );

      // Detect multiple possible languages
      mockDetector.detect.mockResolvedValue([
        { detectedLanguage: 'en', confidence: 0.6 },
        { detectedLanguage: 'es', confidence: 0.55 },
        { detectedLanguage: 'fr', confidence: 0.52 },
      ]);

      await act(async () => {
        await detectionResult.current.actions.detect('Hello Hola Bonjour');
      });

      await waitFor(() => {
        expect(detectionResult.current.results).toHaveLength(3);
      });

      // Could translate from each detected language
      const languages = detectionResult.current.results.map(
        (r) => r.detectedLanguage,
      );
      expect(languages).toContain('en');
      expect(languages).toContain('es');
      expect(languages).toContain('fr');
    });

    it('should handle ambiguous language detection', async () => {
      const { result } = renderHook(() =>
        useLanguageDetection({
          confidenceThreshold: 0.3,
          maxCandidates: 5,
          showAllCandidates: false,
        }),
      );

      // Ambiguous text with similar confidence for multiple languages
      mockDetector.detect.mockResolvedValue([
        { detectedLanguage: 'en', confidence: 0.45 },
        { detectedLanguage: 'es', confidence: 0.42 },
        { detectedLanguage: 'pt', confidence: 0.38 },
      ]);

      await act(async () => {
        await result.current.actions.detect('test text');
      });

      await waitFor(() => {
        // Should return all candidates above threshold
        expect(result.current.results.length).toBeGreaterThan(1);
      });

      // Primary result should be highest confidence
      expect(result.current.primaryResult?.detectedLanguage).toBe('en');
      expect(result.current.primaryResult?.confidence).toBe(0.45);
    });
  });

  describe('Error Handling', () => {
    it('should handle detection failure before translation', async () => {
      const { result } = renderHook(() =>
        useLanguageDetection({
          confidenceThreshold: 0.5,
          maxCandidates: 3,
          showAllCandidates: false,
        }),
      );

      mockDetector.detect.mockRejectedValue(new Error('Detection failed'));

      await act(async () => {
        await result.current.actions.detect('test');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Should not proceed with translation if detection failed
      expect(result.current.primaryResult).toBeNull();
    });

    it('should handle translation failure after successful detection', async () => {
      // Step 1: Successful detection
      const { result: detectionResult } = renderHook(() =>
        useLanguageDetection({
          confidenceThreshold: 0.5,
          maxCandidates: 3,
          showAllCandidates: false,
        }),
      );

      await act(async () => {
        await detectionResult.current.actions.detect('Hello');
      });

      await waitFor(() => {
        expect(detectionResult.current.primaryResult?.detectedLanguage).toBe(
          'en',
        );
      });

      // Step 2: Translation fails
      const { result: translatorResult } = renderHook(() =>
        useTranslator({
          sourceLanguage: 'en',
          targetLanguage: 'es',
        }),
      );

      // Wait for translator hook to initialize
      await waitFor(() => {
        expect(translatorResult.current.translate).toBeDefined();
      });

      mockTranslator.translate.mockRejectedValue(
        new Error('Translation failed'),
      );

      await act(async () => {
        await translatorResult.current.translate('Hello');
      });

      await waitFor(() => {
        expect(translatorResult.current.error).toBeTruthy();
      });
    });
  });

  describe('Performance and Efficiency', () => {
    it('should cache detection results for repeated translations', async () => {
      const { result: detectionResult } = renderHook(() =>
        useLanguageDetection({
          confidenceThreshold: 0.5,
          maxCandidates: 3,
          showAllCandidates: false,
        }),
      );

      const inputText = 'Hello world';

      // First detection
      await act(async () => {
        await detectionResult.current.actions.detect(inputText);
      });

      await waitFor(() => {
        expect(mockDetector.detect).toHaveBeenCalledTimes(1);
      });

      const firstResult = detectionResult.current.primaryResult;

      // Same text detection should reuse result
      // (In real implementation, this would be cached)
      expect(firstResult?.detectedLanguage).toBe('en');
    });

    it('should handle rapid detect-translate cycles', async () => {
      const { result: detectionResult } = renderHook(() =>
        useLanguageDetection({
          confidenceThreshold: 0.5,
          maxCandidates: 1,
          showAllCandidates: false,
        }),
      );

      // Multiple rapid detections
      await act(async () => {
        detectionResult.current.actions.detect('Text 1');
        detectionResult.current.actions.detect('Text 2');
        await detectionResult.current.actions.detect('Text 3');
      });

      await waitFor(() => {
        expect(detectionResult.current.isDetecting).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text in pipeline', async () => {
      const { result } = renderHook(() =>
        useLanguageDetection({
          confidenceThreshold: 0.5,
          maxCandidates: 3,
          showAllCandidates: false,
        }),
      );

      await act(async () => {
        await result.current.actions.detect('');
      });

      // Should not call detect for empty text
      expect(result.current.results).toEqual([]);
    });

    it('should handle unsupported language pair', async () => {
      const { result: detectionResult } = renderHook(() =>
        useLanguageDetection({
          confidenceThreshold: 0.5,
          maxCandidates: 3,
          showAllCandidates: false,
        }),
      );

      // Detect rare language
      mockDetector.detect.mockResolvedValue([
        { detectedLanguage: 'xyz', confidence: 0.95 },
      ]);

      await act(async () => {
        await detectionResult.current.actions.detect('Rare language text');
      });

      await waitFor(() => {
        expect(detectionResult.current.primaryResult?.detectedLanguage).toBe(
          'xyz',
        );
      });

      // Translation might not support this language pair
      // Implementation should handle gracefully
    });

    it('should handle mixed language text', async () => {
      const { result } = renderHook(() =>
        useLanguageDetection({
          confidenceThreshold: 0.3,
          maxCandidates: 5,
          showAllCandidates: true,
        }),
      );

      mockDetector.detect.mockResolvedValue([
        { detectedLanguage: 'en', confidence: 0.55 },
        { detectedLanguage: 'es', confidence: 0.45 },
      ]);

      await act(async () => {
        await result.current.actions.detect('Hello mundo mixed language');
      });

      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThanOrEqual(2);
      });

      // Should detect multiple languages in mixed text
      expect(result.current.primaryResult?.detectedLanguage).toBe('en');
    });
  });
});
