/**
 * AI Service Unit Tests
 * Comprehensive tests for the Chrome AI service layer (Epic 1)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isAiAvailable,
  runAiTask,
  summarizeText,
  translateText,
  generateText,
  rewriteText,
  proofreadText,
  generatePrompt,
  detectLanguage,
  simulateError,
  testAiAvailability
} from '@/services/aiService';
import {
  setupChromeAIMocks,
  cleanupChromeAIMocks,
  mockPerformanceNow,
  testData,
  errorScenarios,
  mockApiResponses
} from '../utils/chromeAiMocks';
import { createMockApiResult, createMockApiError, expectAsyncError, verifyTiming } from '../utils/testHelpers';

describe('AI Service Layer (Epic 1)', () => {
  let performanceMock: ReturnType<typeof mockPerformanceNow>;

  beforeEach(() => {
    performanceMock = mockPerformanceNow();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupChromeAIMocks();
    performanceMock.restore();
  });

  describe('Core Infrastructure', () => {
    describe('isAiAvailable', () => {
      it('should return true when any Chrome AI API is available', () => {
        setupChromeAIMocks(['Summarizer']);
        expect(isAiAvailable()).toBe(true);
      });

      it('should return false when no Chrome AI APIs are available', () => {
        cleanupChromeAIMocks();
        expect(isAiAvailable()).toBe(false);
      });

      it('should return true when multiple APIs are available', () => {
        setupChromeAIMocks(['Summarizer', 'Translator', 'Writer']);
        expect(isAiAvailable()).toBe(true);
      });
    });

    describe('runAiTask', () => {
      it('should execute task successfully and return AiResponse', async () => {
        setupChromeAIMocks(['Summarizer']);
        const mockTask = vi.fn().mockResolvedValue('test result');

        const result = await runAiTask('test-task', mockTask);

        expect(result.data).toBe('test result');
        expect(result.error).toBeNull();
        expect(result.latency).toBeGreaterThan(0);
        expect(mockTask).toHaveBeenCalledOnce();
      });

      it('should handle task failures and return error response', async () => {
        setupChromeAIMocks(['Summarizer']);
        const mockError = new Error('Task failed');
        const mockTask = vi.fn().mockRejectedValue(mockError);

        const result = await runAiTask('test-task', mockTask);

        expect(result.data).toBeNull();
        expect(result.error).toBe('Task failed');
        expect(result.latency).toBeGreaterThan(0);
      });

      it('should accurately measure execution time', async () => {
        setupChromeAIMocks(['Summarizer']);
        performanceMock.setTime(0);

        const mockTask = vi.fn().mockImplementation(async () => {
          performanceMock.incrementTime(250); // Simulate 250ms execution
          return 'result';
        });

        const result = await runAiTask('test-task', mockTask);

        verifyTiming(result.latency, 250, 10);
      });

      it('should handle AI unavailability gracefully', async () => {
        cleanupChromeAIMocks(); // No AI APIs available
        const mockTask = vi.fn().mockResolvedValue('result');

        const result = await runAiTask('test-task', mockTask);

        expect(result.data).toBeNull();
        expect(result.error).toContain('Chrome AI APIs not available');
        expect(mockTask).not.toHaveBeenCalled();
      });

      it('should handle non-Error exceptions', async () => {
        setupChromeAIMocks(['Summarizer']);
        const mockTask = vi.fn().mockRejectedValue('string error');

        const result = await runAiTask('test-task', mockTask);

        expect(result.error).toBe('Unknown error occurred');
      });
    });
  });

  describe('API Wrappers', () => {
    describe('summarizeText', () => {
      it('should call Summarizer.create with correct options', async () => {
        const mockApis = setupChromeAIMocks(['Summarizer']);
        const options = testData.summarizer.options[0];

        await summarizeText({
          input: testData.summarizer.input,
          ...options
        });

        expect(mockApis.Summarizer.create).toHaveBeenCalledWith({
          type: options.type,
          format: options.format,
          length: options.length
        });
      });

      it('should handle all summarizer option combinations', async () => {
        setupChromeAIMocks(['Summarizer']);

        for (const options of testData.summarizer.options) {
          const result = await summarizeText({
            input: testData.summarizer.input,
            ...options
          });

          expect(result.data).toBe(mockApiResponses.summarizer.success);
          expect(result.error).toBeNull();
        }
      });

      it('should handle summarizer creation failure', async () => {
        setupChromeAIMocks(['Summarizer'], false); // Force failure

        const result = await summarizeText({
          input: testData.summarizer.input,
          type: 'tl-dr',
          format: 'plain-text',
          length: 'medium'
        });

        expect(result.data).toBeNull();
        expect(result.error).toContain('Summarizer creation failed');
      });

      it('should destroy summarizer instance after use', async () => {
        const mockApis = setupChromeAIMocks(['Summarizer']);
        const mockInstance = await mockApis.Summarizer.create();

        await summarizeText({
          input: testData.summarizer.input,
          type: 'tl-dr',
          format: 'plain-text',
          length: 'medium'
        });

        expect(mockInstance.destroy).toHaveBeenCalled();
      });

      it('should handle summarizer API unavailability', async () => {
        cleanupChromeAIMocks(); // No Summarizer available

        const result = await summarizeText({
          input: testData.summarizer.input,
          type: 'tl-dr',
          format: 'plain-text',
          length: 'medium'
        });

        expect(result.error).toContain('Summarizer API not available');
      });
    });

    describe('translateText', () => {
      it('should handle translation with language options', async () => {
        const mockApis = setupChromeAIMocks(['Translator']);

        for (const options of testData.translator.options) {
          const result = await translateText({
            input: testData.translator.input,
            ...options
          });

          expect(result.data).toBe(mockApiResponses.translator.success);
          expect(mockApis.Translator.create).toHaveBeenCalledWith({
            sourceLanguage: options.sourceLanguage,
            targetLanguage: options.targetLanguage
          });
        }
      });

      it('should use default source language when not provided', async () => {
        const mockApis = setupChromeAIMocks(['Translator']);

        await translateText({
          input: testData.translator.input,
          targetLanguage: 'es'
        });

        expect(mockApis.Translator.create).toHaveBeenCalledWith({
          sourceLanguage: 'en', // Default
          targetLanguage: 'es'
        });
      });

      it('should handle translator API unavailability', async () => {
        cleanupChromeAIMocks();

        const result = await translateText({
          input: testData.translator.input,
          targetLanguage: 'es'
        });

        expect(result.error).toContain('Translator API not available');
      });
    });

    describe('generateText (Writer API)', () => {
      it('should handle tone, format, and length options', async () => {
        const mockApis = setupChromeAIMocks(['Writer']);

        for (const options of testData.writer.options) {
          const result = await generateText({
            input: testData.writer.input,
            ...options
          });

          expect(result.data).toBe(mockApiResponses.writer.success);
          expect(mockApis.Writer.create).toHaveBeenCalledWith({
            tone: options.tone,
            format: options.format,
            length: options.length
          });
        }
      });

      it('should use default options when not provided', async () => {
        const mockApis = setupChromeAIMocks(['Writer']);

        await generateText({
          input: testData.writer.input
        });

        expect(mockApis.Writer.create).toHaveBeenCalledWith({
          tone: 'neutral',
          format: 'plain-text',
          length: 'medium'
        });
      });

      it('should handle writer API unavailability', async () => {
        cleanupChromeAIMocks();

        const result = await generateText({
          input: testData.writer.input
        });

        expect(result.error).toContain('Writer API not available');
      });
    });

    describe('rewriteText', () => {
      it('should handle rewriting with style options', async () => {
        const mockApis = setupChromeAIMocks(['Rewriter']);

        for (const options of testData.rewriter.options) {
          const result = await rewriteText({
            input: testData.rewriter.input,
            ...options
          });

          expect(result.data).toBe(mockApiResponses.rewriter.success);
          expect(mockApis.Rewriter.create).toHaveBeenCalledWith({
            tone: options.tone,
            format: options.format,
            length: options.length
          });
        }
      });

      it('should use default "as-is" options when not provided', async () => {
        const mockApis = setupChromeAIMocks(['Rewriter']);

        await rewriteText({
          input: testData.rewriter.input
        });

        expect(mockApis.Rewriter.create).toHaveBeenCalledWith({
          tone: 'as-is',
          format: 'as-is',
          length: 'as-is'
        });
      });
    });

    describe('proofreadText', () => {
      it('should handle proofreading when API available', async () => {
        const mockApis = setupChromeAIMocks(['Proofreader']);

        const result = await proofreadText({
          input: testData.proofreader.input
        });

        expect(result.data).toBe(mockApiResponses.proofreader.success);
        expect(mockApis.Proofreader.create).toHaveBeenCalled();
      });

      it('should handle proofreader API unavailability', async () => {
        cleanupChromeAIMocks(); // No Proofreader available

        const result = await proofreadText({
          input: testData.proofreader.input
        });

        expect(result.error).toContain('Proofreader API not available');
      });
    });

    describe('generatePrompt (Language Model)', () => {
      it('should handle system prompt and context', async () => {
        const mockApis = setupChromeAIMocks(['LanguageModel']);

        for (const options of testData.languageModel.options) {
          const result = await generatePrompt({
            input: testData.languageModel.input,
            systemPrompt: options.systemPrompt,
            context: options.context
          });

          expect(result.data).toBe(mockApiResponses.languageModel.success);
          expect(mockApis.LanguageModel.create).toHaveBeenCalledWith({
            systemPrompt: options.systemPrompt
          });
        }
      });

      it('should combine context with input in prompt', async () => {
        const mockApis = setupChromeAIMocks(['LanguageModel']);
        const mockInstance = await mockApis.LanguageModel.create();

        await generatePrompt({
          input: testData.languageModel.input,
          context: 'Test context'
        });

        expect(mockInstance.prompt).toHaveBeenCalledWith(
          `Context: Test context\n\nInput: ${testData.languageModel.input}`
        );
      });

      it('should handle prompt without context', async () => {
        const mockApis = setupChromeAIMocks(['LanguageModel']);
        const mockInstance = await mockApis.LanguageModel.create();

        await generatePrompt({
          input: testData.languageModel.input
        });

        expect(mockInstance.prompt).toHaveBeenCalledWith(testData.languageModel.input);
      });
    });

    describe('detectLanguage', () => {
      it('should return top confidence language result', async () => {
        const mockApis = setupChromeAIMocks(['LanguageDetector']);

        const result = await detectLanguage(testData.languageDetector.inputs[0]);

        expect(result.data).toBe('en'); // Top result from mock
        expect(result.error).toBeNull();
      });

      it('should handle detection results with multiple languages', async () => {
        const mockApis = setupChromeAIMocks(['LanguageDetector']);

        // Test with different inputs
        for (const input of testData.languageDetector.inputs) {
          const result = await detectLanguage(input);
          expect(typeof result.data).toBe('string');
        }
      });

      it('should handle language detector API unavailability', async () => {
        cleanupChromeAIMocks();

        const result = await detectLanguage(testData.languageDetector.inputs[0]);

        expect(result.error).toContain('Language Detection API not available');
      });
    });
  });

  describe('Utility Functions', () => {
    describe('simulateError', () => {
      it('should simulate API error with timing', async () => {
        const result = await simulateError();

        expect(result.data).toBeNull();
        expect(result.error).toBe('Simulated API error for testing purposes');
        expect(result.latency).toBeGreaterThan(400); // Should include 500ms delay
      });
    });

    describe('testAiAvailability', () => {
      it('should check all 7 APIs and return status', async () => {
        setupChromeAIMocks(['Summarizer', 'Translator', 'Writer']);

        const availability = await testAiAvailability();

        expect(availability).toHaveProperty('summarizer', 'available');
        expect(availability).toHaveProperty('translator', 'available');
        expect(availability).toHaveProperty('writer', 'available');
        expect(availability).toHaveProperty('rewriter', 'unavailable');
        expect(availability).toHaveProperty('proofreader', 'unavailable');
        expect(availability).toHaveProperty('prompt', 'unavailable');
        expect(availability).toHaveProperty('languageDetection', 'unavailable');
      });

      it('should return unavailable for all APIs when none present', async () => {
        cleanupChromeAIMocks();

        const availability = await testAiAvailability();

        Object.values(availability).forEach(status => {
          expect(status).toBe('unavailable');
        });
      });

      it('should handle mixed API availability', async () => {
        setupChromeAIMocks(['Summarizer', 'LanguageModel', 'LanguageDetector']);

        const availability = await testAiAvailability();

        expect(availability.summarizer).toBe('available');
        expect(availability.prompt).toBe('available');
        expect(availability.languageDetection).toBe('available');
        expect(availability.translator).toBe('unavailable');
        expect(availability.writer).toBe('unavailable');
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle API instance creation failures', async () => {
      // Setup API as available but creation fails
      const mockApis = setupChromeAIMocks(['Summarizer']);
      mockApis.Summarizer.create.mockRejectedValue(new Error('Creation failed'));

      const result = await summarizeText({
        input: testData.summarizer.input,
        type: 'tl-dr',
        format: 'plain-text',
        length: 'medium'
      });

      expect(result.error).toContain('Creation failed');
    });

    it('should handle API runtime errors', async () => {
      const mockApis = setupChromeAIMocks(['Summarizer']);
      const mockInstance = await mockApis.Summarizer.create();
      mockInstance.summarize.mockRejectedValue(new Error('Runtime error'));

      const result = await summarizeText({
        input: testData.summarizer.input,
        type: 'tl-dr',
        format: 'plain-text',
        length: 'medium'
      });

      expect(result.error).toContain('Runtime error');
    });

    it('should ensure cleanup even when errors occur', async () => {
      const mockApis = setupChromeAIMocks(['Summarizer']);
      const mockInstance = await mockApis.Summarizer.create();
      mockInstance.summarize.mockRejectedValue(new Error('Test error'));

      await summarizeText({
        input: testData.summarizer.input,
        type: 'tl-dr',
        format: 'plain-text',
        length: 'medium'
      });

      // Verify destroy was called even with error
      expect(mockInstance.destroy).toHaveBeenCalled();
    });
  });

  describe('Performance and Timing', () => {
    it('should maintain consistent timing measurements', async () => {
      setupChromeAIMocks(['Summarizer']);
      const results: number[] = [];

      // Run multiple times to test consistency
      for (let i = 0; i < 5; i++) {
        performanceMock.setTime(i * 1000);
        const result = await summarizeText({
          input: testData.summarizer.input,
          type: 'tl-dr',
          format: 'plain-text',
          length: 'medium'
        });
        results.push(result.latency);
      }

      // All measurements should be consistent (within tolerance)
      results.forEach(latency => {
        verifyTiming(latency, 100, 10);
      });
    });

    it('should handle performance.now() edge cases', async () => {
      setupChromeAIMocks(['Summarizer']);

      // Test with zero start time
      performanceMock.setTime(0);
      const result1 = await summarizeText({
        input: testData.summarizer.input,
        type: 'tl-dr',
        format: 'plain-text',
        length: 'medium'
      });

      expect(result1.latency).toBeGreaterThanOrEqual(0);

      // Test with large numbers
      performanceMock.setTime(1000000);
      const result2 = await summarizeText({
        input: testData.summarizer.input,
        type: 'tl-dr',
        format: 'plain-text',
        length: 'medium'
      });

      expect(result2.latency).toBeGreaterThanOrEqual(0);
    });
  });
});