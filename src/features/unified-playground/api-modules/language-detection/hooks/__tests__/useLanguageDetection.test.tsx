/**
 * useLanguageDetection Hook Tests
 *
 * Tests for language detection React hook.
 * Focus: State management, detection operations, error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLanguageDetection } from '../useLanguageDetection';

// Mock ChromeAILanguageDetectionService
vi.mock('../../services', () => ({
  ChromeAILanguageDetectionService: {
    checkAvailability: vi.fn().mockResolvedValue('readily'),
    createInstance: vi.fn().mockResolvedValue({
      detect: vi.fn().mockResolvedValue([
        { detectedLanguage: 'en', confidence: 0.95 },
        { detectedLanguage: 'es', confidence: 0.85 },
        { detectedLanguage: 'fr', confidence: 0.75 },
      ]),
      destroy: vi.fn(), // ✅ CRITICAL FIX: Add destroy() method to mock instance
    }),
    detect: vi.fn().mockResolvedValue([
      { detectedLanguage: 'en', confidence: 0.95 },
      { detectedLanguage: 'es', confidence: 0.85 },
      { detectedLanguage: 'fr', confidence: 0.75 },
    ]),
    destroy: vi.fn(), // ✅ Add destroy() static method
  },
}));

describe('useLanguageDetection', () => {
  const defaultConfig = {
    confidenceThreshold: 0.5,
    maxCandidates: 3,
    showAllCandidates: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      expect(result.current.isDetecting).toBe(false);
      expect(result.current.results).toEqual([]);
      expect(result.current.primaryResult).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize with provided config', () => {
      const customConfig = {
        confidenceThreshold: 0.7,
        maxCandidates: 5,
        showAllCandidates: true,
      };

      const { result } = renderHook(() => useLanguageDetection(customConfig));

      expect(result.current.config).toEqual(customConfig);
    });
  });

  describe('detect', () => {
    it('should detect language from text', async () => {
      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      await act(async () => {
        await result.current.actions.detect('Hello world');
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(3);
      });

      expect(result.current.primaryResult).toEqual({
        detectedLanguage: 'en',
        confidence: 0.95,
      });
      expect(result.current.isDetecting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set isDetecting during detection', async () => {
      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      act(() => {
        result.current.actions.detect('Test');
      });

      expect(result.current.isDetecting).toBe(true);

      await waitFor(() => {
        expect(result.current.isDetecting).toBe(false);
      });
    });

    it('should filter results by confidence threshold', async () => {
      const config = {
        ...defaultConfig,
        confidenceThreshold: 0.1,
      };

      const { result } = renderHook(() => useLanguageDetection(config));

      await act(async () => {
        await result.current.actions.detect('Test');
      });

      await waitFor(() => {
        // Only results above 0.1 confidence
        expect(result.current.results.length).toBeGreaterThan(0);
        result.current.results.forEach((r) => {
          expect(r.confidence).toBeGreaterThanOrEqual(0.1);
        });
      });
    });

    it('should limit results by maxCandidates', async () => {
      const config = {
        ...defaultConfig,
        maxCandidates: 2,
      };

      const { result } = renderHook(() => useLanguageDetection(config));

      await act(async () => {
        await result.current.actions.detect('Test');
      });

      await waitFor(() => {
        expect(result.current.results.length).toBeLessThanOrEqual(2);
      });
    });

    it('should handle empty text', async () => {
      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      const detectResult = await act(async () => {
        return await result.current.actions.detect('');
      });

      expect(detectResult).toBeNull();
      expect(result.current.results).toEqual([]);
    });

    it('should handle detection errors', async () => {
      const { ChromeAILanguageDetectionService } = await import(
        '../../services'
      );
      vi.mocked(ChromeAILanguageDetectionService.detect).mockRejectedValueOnce(
        new Error('Detection failed'),
      );

      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      await act(async () => {
        await result.current.actions.detect('Test');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.isDetecting).toBe(false);
      expect(result.current.results).toEqual([]);
    });

    it('should handle instance creation errors', async () => {
      const { ChromeAILanguageDetectionService } = await import(
        '../../services'
      );
      vi.mocked(
        ChromeAILanguageDetectionService.createInstance,
      ).mockRejectedValueOnce(new Error('Failed to create instance'));

      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      await act(async () => {
        await result.current.actions.detect('Test');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should return null when no results above threshold', async () => {
      const { ChromeAILanguageDetectionService } = await import(
        '../../services'
      );
      vi.mocked(ChromeAILanguageDetectionService.detect).mockResolvedValueOnce([
        { detectedLanguage: 'unknown', confidence: 0.1 },
      ]);

      const config = {
        ...defaultConfig,
        confidenceThreshold: 0.8,
      };

      const { result } = renderHook(() => useLanguageDetection(config));

      await act(async () => {
        await result.current.actions.detect('12345');
      });

      await waitFor(() => {
        expect(result.current.results).toEqual([]);
      });

      expect(result.current.primaryResult).toBeNull();
    });

    it('should handle showAllCandidates config', async () => {
      const config = {
        ...defaultConfig,
        showAllCandidates: true,
        confidenceThreshold: 0.01,
      };

      const { result } = renderHook(() => useLanguageDetection(config));

      await act(async () => {
        await result.current.actions.detect('Test');
      });

      await waitFor(() => {
        // Should show all candidates regardless of threshold when showAllCandidates is true
        expect(result.current.results.length).toBeGreaterThan(0);
      });
    });
  });

  describe('cancel', () => {
    it('should cancel ongoing detection', async () => {
      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      act(() => {
        result.current.actions.detect('Test');
      });

      expect(result.current.isDetecting).toBe(true);

      act(() => {
        result.current.actions.cancel();
      });

      expect(result.current.isDetecting).toBe(false);
    });

    it('should handle cancel when not detecting', () => {
      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      expect(() => {
        act(() => {
          result.current.actions.cancel();
        });
      }).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset all state', async () => {
      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      // Perform detection first
      await act(async () => {
        await result.current.actions.detect('Test');
      });

      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });

      // Reset
      act(() => {
        result.current.actions.reset();
      });

      expect(result.current.results).toEqual([]);
      expect(result.current.primaryResult).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isDetecting).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      act(() => {
        result.current.actions.updateConfig({
          confidenceThreshold: 0.8,
        });
      });

      expect(result.current.config.confidenceThreshold).toBe(0.8);
      expect(result.current.config.maxCandidates).toBe(3); // Unchanged
    });

    it('should update multiple config values', () => {
      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      act(() => {
        result.current.actions.updateConfig({
          confidenceThreshold: 0.7,
          maxCandidates: 5,
          showAllCandidates: true,
        });
      });

      expect(result.current.config).toEqual({
        confidenceThreshold: 0.7,
        maxCandidates: 5,
        showAllCandidates: true,
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should track detection performance', async () => {
      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      await act(async () => {
        await result.current.actions.detect('Test');
      });

      await waitFor(() => {
        expect(result.current.metrics).toBeTruthy();
      });

      if (result.current.metrics) {
        expect(result.current.metrics.duration).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text', async () => {
      const { result } = renderHook(() => useLanguageDetection(defaultConfig));
      const longText = 'word '.repeat(10000);

      await act(async () => {
        await result.current.actions.detect(longText);
      });

      await waitFor(() => {
        expect(result.current.isDetecting).toBe(false);
      });
    });

    it('should handle special characters', async () => {
      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      await act(async () => {
        await result.current.actions.detect('!@#$%^&*()');
      });

      await waitFor(() => {
        expect(result.current.isDetecting).toBe(false);
      });
    });

    it('should handle Unicode text', async () => {
      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      await act(async () => {
        await result.current.actions.detect('こんにちは');
      });

      await waitFor(() => {
        expect(result.current.isDetecting).toBe(false);
      });
    });

    it('should handle rapid successive detections', async () => {
      const { result } = renderHook(() => useLanguageDetection(defaultConfig));

      await act(async () => {
        result.current.actions.detect('First');
        result.current.actions.detect('Second');
        await result.current.actions.detect('Third');
      });

      await waitFor(() => {
        expect(result.current.isDetecting).toBe(false);
      });
    });
  });
});
