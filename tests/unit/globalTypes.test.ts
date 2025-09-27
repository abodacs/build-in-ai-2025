/**
 * Global Types and Availability Unit Tests
 * Tests for Chrome AI type definitions and availability detection (Epic 1)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isSummarizerSupported,
  isRewriterSupported,
  isWriterSupported,
  isLanguageModelSupported,
  isProofreaderSupported,
  isTranslatorSupported,
  isLanguageDetectorSupported,
  isChromeAISupported,
  getAllSupportedAPIs,
  isAIServiceError,
  AIErrorCode,
  AIError
} from '@/types/global';
import { setupChromeAIMocks, cleanupChromeAIMocks } from '../utils/chromeAiMocks';

describe('Chrome AI Type System and Availability (Epic 1)', () => {
  beforeEach(() => {
    cleanupChromeAIMocks();
  });

  afterEach(() => {
    cleanupChromeAIMocks();
  });

  describe('Individual API Availability Detection', () => {
    const apiTests = [
      { name: 'isSummarizerSupported', global: 'Summarizer', fn: isSummarizerSupported },
      { name: 'isRewriterSupported', global: 'Rewriter', fn: isRewriterSupported },
      { name: 'isWriterSupported', global: 'Writer', fn: isWriterSupported },
      { name: 'isLanguageModelSupported', global: 'LanguageModel', fn: isLanguageModelSupported },
      { name: 'isProofreaderSupported', global: 'Proofreader', fn: isProofreaderSupported },
      { name: 'isTranslatorSupported', global: 'Translator', fn: isTranslatorSupported },
      { name: 'isLanguageDetectorSupported', global: 'LanguageDetector', fn: isLanguageDetectorSupported }
    ];

    apiTests.forEach(({ name, global, fn }) => {
      describe(name, () => {
        it(`should detect ${global} availability when present`, () => {
          setupChromeAIMocks([global]);
          expect(fn()).toBe(true);
        });

        it(`should return false when ${global} is undefined`, () => {
          cleanupChromeAIMocks();
          expect(fn()).toBe(false);
        });

        it(`should return false when ${global} is null`, () => {
          (globalThis as any)[global] = null;
          expect(fn()).toBe(false);
        });

        it(`should return false when globalThis is undefined`, () => {
          // Temporarily override globalThis for this test
          const originalGlobalThis = globalThis;
          (global as any).globalThis = undefined;

          expect(fn()).toBe(false);

          // Restore globalThis
          (global as any).globalThis = originalGlobalThis;
        });

        it(`should handle ${global} being a non-function value`, () => {
          (globalThis as any)[global] = "not a function";
          expect(fn()).toBe(true); // The check only verifies existence, not type
        });

        it(`should handle ${global} being an object without create method`, () => {
          (globalThis as any)[global] = { someOtherMethod: () => {} };
          expect(fn()).toBe(true); // The availability check only verifies object existence
        });
      });
    });
  });

  describe('Overall Chrome AI Support Detection', () => {
    describe('isChromeAISupported', () => {
      it('should return true if any API is available', () => {
        setupChromeAIMocks(['Summarizer']);
        expect(isChromeAISupported()).toBe(true);
      });

      it('should return true if multiple APIs are available', () => {
        setupChromeAIMocks(['Summarizer', 'Translator', 'Writer']);
        expect(isChromeAISupported()).toBe(true);
      });

      it('should return false if no APIs are available', () => {
        cleanupChromeAIMocks();
        expect(isChromeAISupported()).toBe(false);
      });

      it('should return true if only one API is available', () => {
        setupChromeAIMocks(['LanguageDetector']);
        expect(isChromeAISupported()).toBe(true);
      });

      it('should handle mixed availability correctly', () => {
        // Some APIs available, some not
        setupChromeAIMocks(['Summarizer', 'Writer']);
        expect(isChromeAISupported()).toBe(true);
      });
    });

    describe('getAllSupportedAPIs', () => {
      it('should return array of available API names', () => {
        setupChromeAIMocks(['Summarizer', 'Translator', 'Writer']);
        const supported = getAllSupportedAPIs();

        expect(supported).toEqual(expect.arrayContaining(['Summarizer', 'Translator', 'Writer']));
        expect(supported).toHaveLength(3);
      });

      it('should return empty array when no APIs available', () => {
        cleanupChromeAIMocks();
        const supported = getAllSupportedAPIs();

        expect(supported).toEqual([]);
        expect(supported).toHaveLength(0);
      });

      it('should return single API when only one available', () => {
        setupChromeAIMocks(['LanguageModel']);
        const supported = getAllSupportedAPIs();

        expect(supported).toEqual(['LanguageModel']);
        expect(supported).toHaveLength(1);
      });

      it('should return all APIs when all are available', () => {
        setupChromeAIMocks(['Summarizer', 'Rewriter', 'Writer', 'LanguageModel', 'Proofreader', 'Translator', 'LanguageDetector']);
        const supported = getAllSupportedAPIs();

        expect(supported).toHaveLength(7);
        expect(supported).toEqual(expect.arrayContaining([
          'Summarizer', 'Rewriter', 'Writer', 'LanguageModel',
          'Proofreader', 'Translator', 'LanguageDetector'
        ]));
      });

      it('should handle partial availability correctly', () => {
        setupChromeAIMocks(['Summarizer', 'LanguageModel', 'LanguageDetector']);
        const supported = getAllSupportedAPIs();

        expect(supported).toHaveLength(3);
        expect(supported).toEqual(expect.arrayContaining(['Summarizer', 'LanguageModel', 'LanguageDetector']));
        expect(supported).not.toContain('Translator');
        expect(supported).not.toContain('Writer');
      });
    });
  });

  describe('Error Handling Types', () => {
    describe('AIError class', () => {
      it('should create AIError with message and code', () => {
        const error = new AIError('Test error', AIErrorCode.API_UNAVAILABLE);

        expect(error.message).toBe('Test error');
        expect(error.code).toBe(AIErrorCode.API_UNAVAILABLE);
        expect(error.name).toBe('AIError');
        expect(error.apiName).toBeUndefined();
      });

      it('should create AIError with message, code, and API name', () => {
        const error = new AIError('Test error', AIErrorCode.MODEL_NOT_READY, 'Summarizer');

        expect(error.message).toBe('Test error');
        expect(error.code).toBe(AIErrorCode.MODEL_NOT_READY);
        expect(error.apiName).toBe('Summarizer');
        expect(error.name).toBe('AIError');
      });

      it('should inherit from Error class', () => {
        const error = new AIError('Test error', AIErrorCode.PROCESSING_ERROR);

        expect(error instanceof Error).toBe(true);
        expect(error instanceof AIError).toBe(true);
      });

      it('should handle all error code types', () => {
        const errorCodes = Object.values(AIErrorCode);

        errorCodes.forEach(code => {
          const error = new AIError(`Error for ${code}`, code);
          expect(error.code).toBe(code);
        });
      });
    });

    describe('AIErrorCode enum', () => {
      it('should have all expected error codes', () => {
        const expectedCodes = [
          'API_UNAVAILABLE',
          'MODEL_NOT_READY',
          'RATE_LIMITED',
          'CONTENT_TOO_LONG',
          'PROCESSING_ERROR',
          'NETWORK_ERROR',
          'UNKNOWN_ERROR'
        ];

        expectedCodes.forEach(code => {
          expect(AIErrorCode[code as keyof typeof AIErrorCode]).toBeDefined();
        });
      });

      it('should have unique values for each error code', () => {
        const values = Object.values(AIErrorCode);
        const uniqueValues = [...new Set(values)];

        expect(values.length).toBe(uniqueValues.length);
      });
    });

    describe('isAIServiceError type guard', () => {
      it('should identify valid AIServiceError objects', () => {
        const validError = {
          code: AIErrorCode.API_UNAVAILABLE,
          message: 'Test error',
          apiName: 'Summarizer'
        };

        expect(isAIServiceError(validError)).toBe(true);
      });

      it('should identify valid minimal AIServiceError objects', () => {
        const validError = {
          code: AIErrorCode.PROCESSING_ERROR,
          message: 'Test error'
        };

        expect(isAIServiceError(validError)).toBe(true);
      });

      it('should reject objects missing code property', () => {
        const invalidError = {
          message: 'Test error'
        };

        expect(isAIServiceError(invalidError)).toBe(false);
      });

      it('should reject objects missing message property', () => {
        const invalidError = {
          code: AIErrorCode.API_UNAVAILABLE
        };

        expect(isAIServiceError(invalidError)).toBe(false);
      });

      it('should reject objects with non-string code', () => {
        const invalidError = {
          code: 123,
          message: 'Test error'
        };

        expect(isAIServiceError(invalidError)).toBe(false);
      });

      it('should reject objects with non-string message', () => {
        const invalidError = {
          code: AIErrorCode.API_UNAVAILABLE,
          message: 123
        };

        expect(isAIServiceError(invalidError)).toBe(false);
      });

      it('should reject null and undefined values', () => {
        expect(isAIServiceError(null)).toBe(false);
        expect(isAIServiceError(undefined)).toBe(false);
      });

      it('should reject primitive values', () => {
        expect(isAIServiceError('string')).toBe(false);
        expect(isAIServiceError(123)).toBe(false);
        expect(isAIServiceError(true)).toBe(false);
      });

      it('should reject arrays', () => {
        const arrayError = [
          AIErrorCode.API_UNAVAILABLE,
          'Test error'
        ];

        expect(isAIServiceError(arrayError)).toBe(false);
      });

      it('should handle objects with additional properties', () => {
        const errorWithExtra = {
          code: AIErrorCode.API_UNAVAILABLE,
          message: 'Test error',
          apiName: 'Summarizer',
          timestamp: Date.now(),
          details: { foo: 'bar' }
        };

        expect(isAIServiceError(errorWithExtra)).toBe(true);
      });
    });
  });

  describe('Type System Edge Cases', () => {
    it('should handle window vs globalThis differences', () => {
      // Save original globalThis
      const originalGlobalThis = globalThis;

      try {
        // Test with a minimal globalThis
        const mockGlobalThis = {};
        (global as any).globalThis = mockGlobalThis;

        expect(isSummarizerSupported()).toBe(false);
        expect(isChromeAISupported()).toBe(false);
        expect(getAllSupportedAPIs()).toEqual([]);
      } finally {
        // Restore original globalThis
        (global as any).globalThis = originalGlobalThis;
      }
    });

    it('should handle undefined typeof checks gracefully', () => {
      // These should not throw errors
      expect(() => isSummarizerSupported()).not.toThrow();
      expect(() => isRewriterSupported()).not.toThrow();
      expect(() => isWriterSupported()).not.toThrow();
      expect(() => isLanguageModelSupported()).not.toThrow();
      expect(() => isProofreaderSupported()).not.toThrow();
      expect(() => isTranslatorSupported()).not.toThrow();
      expect(() => isLanguageDetectorSupported()).not.toThrow();
    });

    it('should handle concurrent availability checks', () => {
      setupChromeAIMocks(['Summarizer', 'Translator']);

      // Multiple simultaneous checks should be consistent
      const results = Array.from({ length: 10 }, () => ({
        summarizer: isSummarizerSupported(),
        translator: isTranslatorSupported(),
        writer: isWriterSupported(),
        overall: isChromeAISupported()
      }));

      // All results should be identical
      results.forEach(result => {
        expect(result.summarizer).toBe(true);
        expect(result.translator).toBe(true);
        expect(result.writer).toBe(false);
        expect(result.overall).toBe(true);
      });
    });

    it('should maintain consistency between individual and overall checks', () => {
      const testCases = [
        { apis: [], expectedOverall: false },
        { apis: ['Summarizer'], expectedOverall: true },
        { apis: ['Summarizer', 'Translator'], expectedOverall: true },
        { apis: ['Writer', 'Rewriter', 'Proofreader'], expectedOverall: true },
        { apis: ['Summarizer', 'Rewriter', 'Writer', 'LanguageModel', 'Proofreader', 'Translator', 'LanguageDetector'], expectedOverall: true }
      ];

      testCases.forEach(({ apis, expectedOverall }) => {
        setupChromeAIMocks(apis);

        const individualResults = {
          summarizer: isSummarizerSupported(),
          rewriter: isRewriterSupported(),
          writer: isWriterSupported(),
          languageModel: isLanguageModelSupported(),
          proofreader: isProofreaderSupported(),
          translator: isTranslatorSupported(),
          languageDetector: isLanguageDetectorSupported()
        };

        const hasAnySupport = Object.values(individualResults).some(Boolean);
        const overallSupport = isChromeAISupported();

        expect(hasAnySupport).toBe(expectedOverall);
        expect(overallSupport).toBe(expectedOverall);
        expect(hasAnySupport).toBe(overallSupport);
      });
    });
  });
});