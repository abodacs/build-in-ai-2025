/**
 * Proofreader Manager Tests
 *
 * Tests for high-level Proofreader manager with instance lifecycle and operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProofreaderManager } from '../ProofreaderManager';
import { ChromeAIProofreaderService } from '../ChromeAIService';
import type {
  Proofreader,
  ProofreaderConfig,
  ProofreadCorrection,
} from '../../types';

// Mock ChromeAIProofreaderService
vi.mock('../ChromeAIService', () => ({
  ChromeAIProofreaderService: {
    isSupported: vi.fn(),
    checkAvailability: vi.fn(),
    createInstance: vi.fn(),
    proofread: vi.fn(),
    destroy: vi.fn(),
    validateOptions: vi.fn(),
    getErrorMessage: vi.fn(),
  },
}));

describe('ProofreaderManager', () => {
  let manager: ProofreaderManager;
  const mockProofreader: Proofreader = {
    proofread: vi.fn(),
    destroy: vi.fn(),
  };

  const defaultConfig: ProofreaderConfig = {
    expectedInputLanguages: ['en'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new ProofreaderManager();

    // Setup default mocks
    vi.mocked(ChromeAIProofreaderService.isSupported).mockReturnValue(true);
    vi.mocked(ChromeAIProofreaderService.checkAvailability).mockResolvedValue(
      'readily',
    );
    vi.mocked(ChromeAIProofreaderService.createInstance).mockResolvedValue(
      mockProofreader,
    );
    vi.mocked(ChromeAIProofreaderService.proofread).mockResolvedValue({
      corrections: [],
    });
  });

  // ==========================================================================
  // Instance Management
  // ==========================================================================

  describe('getInstance', () => {
    it('should create instance on first call', async () => {
      const instance = await manager.getInstance(defaultConfig);

      expect(instance).toBe(mockProofreader);
      expect(ChromeAIProofreaderService.createInstance).toHaveBeenCalledOnce();
    });

    it('should reuse instance with same config', async () => {
      await manager.getInstance(defaultConfig);
      await manager.getInstance(defaultConfig);

      expect(ChromeAIProofreaderService.createInstance).toHaveBeenCalledOnce();
    });

    it('should create new instance when config changes', async () => {
      await manager.getInstance(defaultConfig);
      await manager.getInstance({ expectedInputLanguages: ['en', 'es'] });

      expect(ChromeAIProofreaderService.createInstance).toHaveBeenCalledTimes(
        2,
      );
    });

    it('should destroy old instance when recreating', async () => {
      await manager.getInstance(defaultConfig);
      await manager.getInstance({ expectedInputLanguages: ['es'] });

      expect(ChromeAIProofreaderService.destroy).toHaveBeenCalledWith(
        mockProofreader,
      );
    });
  });

  // ==========================================================================
  // Proofread Operation
  // ==========================================================================

  describe('proofread', () => {
    const mockCorrections: ProofreadCorrection[] = [
      {
        original: 'teh',
        suggestion: 'the',
        type: 'spelling',
        startIndex: 0,
        endIndex: 3,
      },
    ];

    beforeEach(() => {
      vi.mocked(ChromeAIProofreaderService.proofread).mockResolvedValue({
        corrections: mockCorrections,
      });
    });

    it('should proofread text successfully', async () => {
      manager.updateConfig(defaultConfig);

      const result = await manager.proofread('teh test');

      expect(result.corrections).toEqual(mockCorrections);
    });

    it('should throw when config not set', async () => {
      await expect(manager.proofread('test')).rejects.toThrow(
        /Configuration not set/,
      );
    });

    it('should set config before proofreading', async () => {
      manager.updateConfig(defaultConfig);

      await manager.proofread('test');

      expect(ChromeAIProofreaderService.createInstance).toHaveBeenCalled();
    });

    it('should pass context to service', async () => {
      manager.updateConfig(defaultConfig);

      await manager.proofread('test', 'This is context');

      expect(ChromeAIProofreaderService.proofread).toHaveBeenCalledWith(
        mockProofreader,
        'test',
        'This is context',
        undefined,
      );
    });

    it('should pass abort signal to service', async () => {
      manager.updateConfig(defaultConfig);
      const signal = new AbortController().signal;

      await manager.proofread('test', undefined, signal);

      expect(ChromeAIProofreaderService.proofread).toHaveBeenCalledWith(
        mockProofreader,
        'test',
        undefined,
        signal,
      );
    });

    it('should handle abort error', async () => {
      manager.updateConfig(defaultConfig);
      const controller = new AbortController();
      controller.abort();

      vi.mocked(ChromeAIProofreaderService.proofread).mockRejectedValue(
        new Error('AbortError'),
      );

      await expect(
        manager.proofread('test', undefined, controller.signal),
      ).rejects.toThrow(/cancelled/);
    });

    it('should update manager state during operation', async () => {
      manager.updateConfig(defaultConfig);
      // Pre-create instance so getInstance returns immediately from cache
      await manager.getInstance(defaultConfig);

      // Make proofread async with delay so we can check state during execution
      vi.mocked(ChromeAIProofreaderService.proofread).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ corrections: mockCorrections }), 10);
          }),
      );

      const promise = manager.proofread('test');

      // Wait a tick for promise to start executing
      await new Promise((resolve) => setTimeout(resolve, 0));

      // State should be processing (since instance is cached and operation started)
      expect(manager.getState()).toBe('processing');

      await promise;

      // State should be ready after completion
      expect(manager.getState()).toBe('ready');
    });

    it('should set error state on failure', async () => {
      manager.updateConfig(defaultConfig);

      vi.mocked(ChromeAIProofreaderService.proofread).mockRejectedValue(
        new Error('Proofread failed'),
      );

      await expect(manager.proofread('test')).rejects.toThrow();

      expect(manager.getState()).toBe('error');
    });
  });

  // ==========================================================================
  // Correction Application
  // ==========================================================================

  describe('applyCorrectionAtIndex', () => {
    it('should apply correction correctly', () => {
      const text = 'teh quick fox';
      const correction: ProofreadCorrection = {
        original: 'teh',
        suggestion: 'the',
        type: 'spelling',
        startIndex: 0,
        endIndex: 3,
      };

      const result = manager.applyCorrectionAtIndex(text, correction);

      expect(result).toBe('the quick fox');
    });

    it('should handle correction in middle of text', () => {
      const text = 'the quik fox';
      const correction: ProofreadCorrection = {
        original: 'quik',
        suggestion: 'quick',
        type: 'spelling',
        startIndex: 4,
        endIndex: 8,
      };

      const result = manager.applyCorrectionAtIndex(text, correction);

      expect(result).toBe('the quick fox');
    });

    it('should handle correction at end of text', () => {
      const text = 'the quick fo';
      const correction: ProofreadCorrection = {
        original: 'fo',
        suggestion: 'fox',
        type: 'spelling',
        startIndex: 10,
        endIndex: 12,
      };

      const result = manager.applyCorrectionAtIndex(text, correction);

      expect(result).toBe('the quick fox');
    });

    it('should throw on invalid start index', () => {
      const text = 'test';
      const correction: ProofreadCorrection = {
        original: 'x',
        suggestion: 'y',
        type: 'spelling',
        startIndex: -1,
        endIndex: 1,
      };

      expect(() => manager.applyCorrectionAtIndex(text, correction)).toThrow(
        /Invalid correction indices/,
      );
    });

    it('should throw on invalid end index', () => {
      const text = 'test';
      const correction: ProofreadCorrection = {
        original: 'x',
        suggestion: 'y',
        type: 'spelling',
        startIndex: 0,
        endIndex: 100,
      };

      expect(() => manager.applyCorrectionAtIndex(text, correction)).toThrow(
        /Invalid correction indices/,
      );
    });

    it('should throw when start >= end', () => {
      const text = 'test';
      const correction: ProofreadCorrection = {
        original: 'x',
        suggestion: 'y',
        type: 'spelling',
        startIndex: 5,
        endIndex: 5,
      };

      expect(() => manager.applyCorrectionAtIndex(text, correction)).toThrow(
        /Invalid correction indices/,
      );
    });
  });

  // ==========================================================================
  // Multiple Corrections
  // ==========================================================================

  describe('applyAllCorrections', () => {
    it('should apply all corrections in order', () => {
      const text = 'teh quik fox';
      const corrections: ProofreadCorrection[] = [
        {
          original: 'teh',
          suggestion: 'the',
          type: 'spelling',
          startIndex: 0,
          endIndex: 3,
        },
        {
          original: 'quik',
          suggestion: 'quick',
          type: 'spelling',
          startIndex: 4,
          endIndex: 8,
        },
      ];

      const result = manager.applyAllCorrections(text, corrections);

      expect(result).toBe('the quick fox');
    });

    it('should apply corrections from end to start', () => {
      // Corrections applied in reverse order maintain indices
      const text = 'a b c d';
      const corrections: ProofreadCorrection[] = [
        {
          original: 'a',
          suggestion: 'A',
          type: 'style',
          startIndex: 0,
          endIndex: 1,
        },
        {
          original: 'd',
          suggestion: 'D',
          type: 'style',
          startIndex: 6,
          endIndex: 7,
        },
      ];

      const result = manager.applyAllCorrections(text, corrections);

      expect(result).toBe('A b c D');
    });

    it('should handle empty corrections array', () => {
      const text = 'test';

      const result = manager.applyAllCorrections(text, []);

      expect(result).toBe('test');
    });

    it('should handle single correction', () => {
      const text = 'teh';
      const corrections: ProofreadCorrection[] = [
        {
          original: 'teh',
          suggestion: 'the',
          type: 'spelling',
          startIndex: 0,
          endIndex: 3,
        },
      ];

      const result = manager.applyAllCorrections(text, corrections);

      expect(result).toBe('the');
    });

    it('should maintain original array', () => {
      const text = 'test';
      const corrections: ProofreadCorrection[] = [
        {
          original: 'test',
          suggestion: 'TEST',
          type: 'style',
          startIndex: 0,
          endIndex: 4,
        },
      ];
      const originalLength = corrections.length;

      manager.applyAllCorrections(text, corrections);

      expect(corrections).toHaveLength(originalLength);
    });
  });

  // ==========================================================================
  // Filtering and Grouping
  // ==========================================================================

  describe('filterCorrectionsByType', () => {
    const mockCorrections: ProofreadCorrection[] = [
      {
        original: 'teh',
        suggestion: 'the',
        type: 'spelling',
        startIndex: 0,
        endIndex: 3,
      },
      {
        original: 'bad grammar',
        suggestion: 'good grammar',
        type: 'grammar',
        startIndex: 10,
        endIndex: 21,
      },
      {
        original: 'missing comma',
        suggestion: 'with comma',
        type: 'punctuation',
        startIndex: 30,
        endIndex: 43,
      },
    ];

    it('should return all corrections when types is empty', () => {
      const result = manager.filterCorrectionsByType(mockCorrections, []);

      expect(result).toEqual(mockCorrections);
    });

    it('should filter by single type', () => {
      const result = manager.filterCorrectionsByType(mockCorrections, [
        'spelling',
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('spelling');
    });

    it('should filter by multiple types', () => {
      const result = manager.filterCorrectionsByType(mockCorrections, [
        'spelling',
        'grammar',
      ]);

      expect(result).toHaveLength(2);
      expect(result.some((c) => c.type === 'spelling')).toBe(true);
      expect(result.some((c) => c.type === 'grammar')).toBe(true);
    });

    it('should return empty array when no matches', () => {
      const result = manager.filterCorrectionsByType(mockCorrections, [
        'nonexistent',
      ]);

      expect(result).toEqual([]);
    });
  });

  describe('groupCorrectionsByType', () => {
    const mockCorrections: ProofreadCorrection[] = [
      {
        original: 'teh',
        suggestion: 'the',
        type: 'spelling',
        startIndex: 0,
        endIndex: 3,
      },
      {
        original: 'fox',
        suggestion: 'Fox',
        type: 'spelling',
        startIndex: 10,
        endIndex: 13,
      },
      {
        original: 'bad',
        suggestion: 'good',
        type: 'grammar',
        startIndex: 20,
        endIndex: 23,
      },
    ];

    it('should group corrections by type', () => {
      const result = manager.groupCorrectionsByType(mockCorrections);

      expect(result.spelling).toHaveLength(2);
      expect(result.grammar).toHaveLength(1);
      expect(result.punctuation).toHaveLength(0);
      expect(result.style).toHaveLength(0);
      expect(result.clarity).toHaveLength(0);
    });

    it('should initialize all type groups', () => {
      const result = manager.groupCorrectionsByType([]);

      expect(result).toHaveProperty('grammar');
      expect(result).toHaveProperty('spelling');
      expect(result).toHaveProperty('punctuation');
      expect(result).toHaveProperty('style');
      expect(result).toHaveProperty('clarity');
    });

    it('should handle empty corrections', () => {
      const result = manager.groupCorrectionsByType([]);

      expect(result.grammar).toEqual([]);
      expect(result.spelling).toEqual([]);
    });
  });

  // ==========================================================================
  // Configuration
  // ==========================================================================

  describe('configMatches', () => {
    beforeEach(() => {
      manager.updateConfig(defaultConfig);
    });

    it('should return true for identical config', () => {
      const result = manager['configMatches'](defaultConfig);

      expect(result).toBe(true);
    });

    it('should return true for same languages in different order', () => {
      manager.updateConfig({ expectedInputLanguages: ['en', 'es', 'fr'] });

      const result = manager['configMatches']({
        expectedInputLanguages: ['fr', 'en', 'es'],
      });

      expect(result).toBe(true);
    });

    it('should return false for different languages', () => {
      const result = manager['configMatches']({
        expectedInputLanguages: ['es'],
      });

      expect(result).toBe(false);
    });

    it('should return false for different number of languages', () => {
      const result = manager['configMatches']({
        expectedInputLanguages: ['en', 'es'],
      });

      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // Static Methods
  // ==========================================================================

  describe('Static Methods', () => {
    it('should check support', () => {
      ProofreaderManager.isSupported();

      expect(ChromeAIProofreaderService.isSupported).toHaveBeenCalled();
    });

    it('should get error message', () => {
      const error = new Error('Test error');

      ProofreaderManager.getErrorMessage(error);

      expect(ChromeAIProofreaderService.getErrorMessage).toHaveBeenCalledWith(
        error,
      );
    });
  });

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  describe('cleanup', () => {
    it('should destroy instance on cleanup', async () => {
      manager.updateConfig(defaultConfig);
      await manager.getInstance(defaultConfig);

      manager.cleanup();

      expect(ChromeAIProofreaderService.destroy).toHaveBeenCalledWith(
        mockProofreader,
      );
    });
  });
});
