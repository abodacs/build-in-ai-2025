/**
 * Chrome AI Proofreader Service Tests
 *
 * Tests for Chrome's built-in Proofreader API service wrapper.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChromeAIProofreaderService } from '../ChromeAIService';
import type { Proofreader, ProofreaderAPI, ProofreadResult } from '../../types';

describe('ChromeAIProofreaderService', () => {
  // Mock Proofreader instance
  const mockProofreader: Proofreader = {
    proofread: vi.fn(),
    destroy: vi.fn(),
  };

  // Mock API
  const mockAPI: ProofreaderAPI = {
    create: vi.fn(),
    availability: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // ✅ CRITICAL FIX: Use direct assignment like Language Detection tests
    (window as any).Proofreader = mockAPI;

    // Default mock responses
    mockAPI.availability.mockResolvedValue('readily');
    mockAPI.create.mockResolvedValue(mockProofreader);
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clean up the mock
    (window as any).Proofreader = mockAPI; // Restore for next test
  });

  // ==========================================================================
  // API Support
  // ==========================================================================

  describe('isSupported', () => {
    it('should return true when Proofreader API exists', () => {
      expect(ChromeAIProofreaderService.isSupported()).toBe(true);
    });

    it('should return false when Proofreader API does not exist', () => {
      (window as any).Proofreader = undefined; // ✅ FIX: Use undefined instead of delete

      expect(ChromeAIProofreaderService.isSupported()).toBe(false);
    });
  });

  // ==========================================================================
  // Availability Check
  // ==========================================================================

  describe('checkAvailability', () => {
    it('should return readily when API is available', async () => {
      mockAPI.availability.mockResolvedValue('readily');

      const result = await ChromeAIProofreaderService.checkAvailability();

      expect(result).toBe('readily');
      expect(mockAPI.availability).toHaveBeenCalledOnce();
    });

    it('should return after-download when model needs download', async () => {
      mockAPI.availability.mockResolvedValue('after-download');

      const result = await ChromeAIProofreaderService.checkAvailability();

      expect(result).toBe('after-download');
    });

    it('should return no when API is not supported', async () => {
      (window as any).Proofreader = undefined; // ✅ FIX: Use undefined instead of delete

      const result = await ChromeAIProofreaderService.checkAvailability();

      expect(result).toBe('no');
    });

    it('should return no on error', async () => {
      mockAPI.availability.mockRejectedValue(new Error('API error'));

      const result = await ChromeAIProofreaderService.checkAvailability();

      expect(result).toBe('no');
    });
  });

  // ==========================================================================
  // Options Validation
  // ==========================================================================

  describe('validateOptions', () => {
    it('should accept valid language codes', () => {
      const options = {
        expectedInputLanguages: ['en', 'es', 'fr'],
      };

      expect(() =>
        ChromeAIProofreaderService.validateOptions(options),
      ).not.toThrow();
    });

    it('should accept empty options', () => {
      expect(() =>
        ChromeAIProofreaderService.validateOptions({}),
      ).not.toThrow();
    });

    it('should throw on non-array expectedInputLanguages', () => {
      const options = {
        expectedInputLanguages: 'en' as any,
      };

      expect(() => ChromeAIProofreaderService.validateOptions(options)).toThrow(
        'expectedInputLanguages must be an array',
      );
    });

    it('should throw on empty expectedInputLanguages array', () => {
      const options = {
        expectedInputLanguages: [],
      };

      expect(() => ChromeAIProofreaderService.validateOptions(options)).toThrow(
        'expectedInputLanguages cannot be empty',
      );
    });

    it('should throw on invalid language code', () => {
      const options = {
        expectedInputLanguages: ['en', 'invalid'],
      };

      expect(() => ChromeAIProofreaderService.validateOptions(options)).toThrow(
        /Invalid language code/,
      );
    });

    it('should accept all valid language codes', () => {
      const options = {
        expectedInputLanguages: [
          'en',
          'es',
          'fr',
          'de',
          'it',
          'pt',
          'ja',
          'ko',
          'zh',
        ],
      };

      expect(() =>
        ChromeAIProofreaderService.validateOptions(options),
      ).not.toThrow();
    });
  });

  // ==========================================================================
  // Instance Creation
  // ==========================================================================

  describe('createInstance', () => {
    it('should create instance with default options', async () => {
      const instance = await ChromeAIProofreaderService.createInstance();

      expect(instance).toBe(mockProofreader);
      expect(mockAPI.create).toHaveBeenCalledWith({});
    });

    it('should create instance with custom options', async () => {
      const options = {
        expectedInputLanguages: ['en', 'es'],
      };

      const instance = await ChromeAIProofreaderService.createInstance(options);

      expect(instance).toBe(mockProofreader);
      expect(mockAPI.create).toHaveBeenCalledWith(options);
    });

    it('should check availability before creating', async () => {
      await ChromeAIProofreaderService.createInstance();

      expect(mockAPI.availability).toHaveBeenCalled();
    });

    it('should throw when API is not available', async () => {
      mockAPI.availability.mockResolvedValue('no');

      await expect(ChromeAIProofreaderService.createInstance()).rejects.toThrow(
        /not available/,
      );
    });

    it('should throw when API is not supported', async () => {
      (window as any).Proofreader = undefined; // ✅ FIX: Use undefined instead of delete

      await expect(ChromeAIProofreaderService.createInstance()).rejects.toThrow(
        /not supported/,
      );
    });

    it('should validate options before creating', async () => {
      const options = {
        expectedInputLanguages: [],
      };

      await expect(
        ChromeAIProofreaderService.createInstance(options),
      ).rejects.toThrow();
    });

    it('should handle creation errors', async () => {
      mockAPI.create.mockRejectedValue(new Error('Creation failed'));

      await expect(ChromeAIProofreaderService.createInstance()).rejects.toThrow(
        /Failed to create Proofreader instance/,
      );
    });
  });

  // ==========================================================================
  // Proofread Operation
  // ==========================================================================

  describe('proofread', () => {
    const mockResult: ProofreadResult = {
      corrections: [
        {
          original: 'teh',
          suggestion: 'the',
          type: 'spelling',
          startIndex: 0,
          endIndex: 3,
        },
      ],
    };

    beforeEach(() => {
      mockProofreader.proofread.mockResolvedValue(mockResult);
    });

    it('should proofread text successfully', async () => {
      const result = await ChromeAIProofreaderService.proofread(
        mockProofreader,
        'teh quick fox',
      );

      expect(result).toEqual(mockResult);
      expect(mockProofreader.proofread).toHaveBeenCalledWith('teh quick fox', {
        context: undefined,
        signal: undefined,
      });
    });

    it('should include context when provided', async () => {
      await ChromeAIProofreaderService.proofread(
        mockProofreader,
        'test',
        'This is context',
      );

      expect(mockProofreader.proofread).toHaveBeenCalledWith('test', {
        context: 'This is context',
        signal: undefined,
      });
    });

    it('should include abort signal when provided', async () => {
      const signal = new AbortController().signal;

      await ChromeAIProofreaderService.proofread(
        mockProofreader,
        'test',
        undefined,
        signal,
      );

      expect(mockProofreader.proofread).toHaveBeenCalledWith('test', {
        context: undefined,
        signal,
      });
    });

    it('should throw on empty input', async () => {
      await expect(
        ChromeAIProofreaderService.proofread(mockProofreader, ''),
      ).rejects.toThrow(/must be a non-empty string/);
    });

    it('should throw on whitespace-only input', async () => {
      await expect(
        ChromeAIProofreaderService.proofread(mockProofreader, '   '),
      ).rejects.toThrow(/cannot be empty/);
    });

    it('should throw on non-string input', async () => {
      await expect(
        ChromeAIProofreaderService.proofread(mockProofreader, null as any),
      ).rejects.toThrow(/must be a non-empty string/);
    });

    it('should handle abort signal before operation', async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        ChromeAIProofreaderService.proofread(
          mockProofreader,
          'test',
          undefined,
          controller.signal,
        ),
      ).rejects.toThrow(/cancelled/);
    });

    it('should handle abort during operation', async () => {
      mockProofreader.proofread.mockRejectedValue(new Error('AbortError'));

      await expect(
        ChromeAIProofreaderService.proofread(mockProofreader, 'test'),
      ).rejects.toThrow(/failed/);
    });

    it('should handle API errors', async () => {
      mockProofreader.proofread.mockRejectedValue(new Error('API error'));

      await expect(
        ChromeAIProofreaderService.proofread(mockProofreader, 'test'),
      ).rejects.toThrow(/Proofreading failed/);
    });
  });

  // ==========================================================================
  // Instance Destruction
  // ==========================================================================

  describe('destroy', () => {
    it('should destroy instance successfully', () => {
      ChromeAIProofreaderService.destroy(mockProofreader);

      expect(mockProofreader.destroy).toHaveBeenCalledOnce();
    });

    it('should handle destroy errors gracefully', () => {
      mockProofreader.destroy.mockImplementation(() => {
        throw new Error('Destroy failed');
      });

      // Should not throw
      expect(() =>
        ChromeAIProofreaderService.destroy(mockProofreader),
      ).not.toThrow();
    });
  });

  // ==========================================================================
  // Error Messages
  // ==========================================================================

  describe('getErrorMessage', () => {
    it('should return message for not supported error', () => {
      const error = new Error('not supported');
      const message = ChromeAIProofreaderService.getErrorMessage(error);

      expect(message).toContain('not supported');
      expect(message).toContain('Chrome 141-145');
    });

    it('should return message for not available error', () => {
      const error = new Error('not available');
      const message = ChromeAIProofreaderService.getErrorMessage(error);

      expect(message).toContain('not available');
    });

    it('should return message for download required', () => {
      const error = new Error('after-download');
      const message = ChromeAIProofreaderService.getErrorMessage(error);

      expect(message).toContain('download');
      expect(message).toContain('22GB');
    });

    it('should return message for cancelled operation', () => {
      const error = new Error('cancelled');
      const message = ChromeAIProofreaderService.getErrorMessage(error);

      expect(message).toContain('cancelled');
    });

    it('should return message for abort error', () => {
      const error = new Error('AbortError');
      error.name = 'AbortError';
      const message = ChromeAIProofreaderService.getErrorMessage(error);

      expect(message).toContain('cancelled');
    });

    it('should return message for input error', () => {
      const error = new Error('Input must be a string');
      const message = ChromeAIProofreaderService.getErrorMessage(error);

      expect(message).toBe(error.message);
    });

    it('should return generic message for unknown error', () => {
      const error = new Error('Something went wrong');
      const message = ChromeAIProofreaderService.getErrorMessage(error);

      expect(message).toContain('Proofreading error');
    });

    it('should handle non-Error objects', () => {
      const message =
        ChromeAIProofreaderService.getErrorMessage('string error');

      expect(message).toContain('unexpected error');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    // ✅ FIX: Add beforeEach to set up mock response for edge case tests
    beforeEach(() => {
      const mockResult: ProofreadResult = {
        corrections: [
          {
            original: 'test',
            suggestion: 'test',
            type: 'spelling',
            startIndex: 0,
            endIndex: 4,
          },
        ],
      };
      mockProofreader.proofread.mockResolvedValue(mockResult);
    });

    it('should handle very long text', async () => {
      const longText = 'word '.repeat(10000);

      await ChromeAIProofreaderService.proofread(mockProofreader, longText);

      expect(mockProofreader.proofread).toHaveBeenCalled();
    });

    it('should handle Unicode text', async () => {
      const unicodeText = 'こんにちは世界 Hello мир';

      await ChromeAIProofreaderService.proofread(mockProofreader, unicodeText);

      expect(mockProofreader.proofread).toHaveBeenCalledWith(unicodeText, {
        context: undefined,
        signal: undefined,
      });
    });

    it('should handle special characters', async () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';

      await ChromeAIProofreaderService.proofread(mockProofreader, specialText);

      expect(mockProofreader.proofread).toHaveBeenCalled();
    });

    it('should handle newlines and formatting', async () => {
      const formattedText = 'Line 1\nLine 2\n\tIndented\n\n  Spaced';

      await ChromeAIProofreaderService.proofread(
        mockProofreader,
        formattedText,
      );

      expect(mockProofreader.proofread).toHaveBeenCalled();
    });

    it('should handle empty corrections array', async () => {
      mockProofreader.proofread.mockResolvedValue({ corrections: [] });

      const result = await ChromeAIProofreaderService.proofread(
        mockProofreader,
        'perfect text',
      );

      expect(result.corrections).toEqual([]);
    });
  });
});
