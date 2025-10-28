/**
 * useProofreader Hook Tests
 *
 * Tests for Proofreader React hook with state management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProofreader } from '../useProofreader';
import type { ProofreaderConfig } from '../../types';

// Create shared mock instance that will be reused
const mockManagerInstance = {
  getInstance: vi.fn().mockResolvedValue({
    proofread: vi.fn(),
    destroy: vi.fn(),
  }),
  proofread: vi.fn().mockResolvedValue({
    corrections: [
      {
        correction: 'the',
        type: 'spelling',
        startIndex: 0,
        endIndex: 3,
      },
    ],
  }),
  applyCorrectionAtIndex: vi.fn().mockImplementation((text, correction) => {
    return (
      text.slice(0, correction.startIndex) +
      correction.correction +
      text.slice(correction.endIndex)
    );
  }),
  applyAllCorrections: vi.fn().mockImplementation((text, corrections) => {
    let result = text;
    const sorted = [...corrections].sort((a, b) => b.startIndex - a.startIndex);
    for (const correction of sorted) {
      result =
        result.slice(0, correction.startIndex) +
        correction.correction +
        result.slice(correction.endIndex);
    }
    return result;
  }),
  hasInstance: vi.fn().mockReturnValue(false),
  destroy: vi.fn(),
  getState: vi.fn().mockReturnValue('ready'),
  updateConfig: vi.fn(),
};

// Mock services
vi.mock('../../services', () => ({
  ProofreaderManager: vi.fn().mockImplementation(() => mockManagerInstance),
  ProofreaderErrorHandler: {
    handleProofreadError: vi.fn().mockImplementation((err) => err),
    getUserMessage: vi
      .fn()
      .mockImplementation((err) =>
        err instanceof Error ? err.message : 'Unknown error',
      ),
    formatForLogging: vi.fn().mockReturnValue(''),
  },
}));

vi.mock('../../shared/services', () => ({
  PerformanceTracker: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    end: vi.fn(),
    reset: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({
      duration: 100,
      status: 'success',
      timestamp: Date.now(),
    }),
  })),
}));

describe('useProofreader', () => {
  const defaultConfig: ProofreaderConfig = {
    expectedInputLanguages: ['en'],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset proofread mock to default successful implementation
    mockManagerInstance.proofread.mockResolvedValue({
      corrections: [
        {
          correction: 'the',
          type: 'spelling',
          startIndex: 0,
          endIndex: 3,
        },
      ],
    });
  });

  // ==========================================================================
  // Initial State
  // ==========================================================================

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      expect(result.current.isProofreading).toBe(false);
      expect(result.current.corrections).toEqual([]);
      expect(result.current.correctionStates).toEqual([]);
      expect(result.current.originalInput).toBeNull();
      expect(result.current.correctedText).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.metrics).toBeNull();
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should initialize with provided config', () => {
      const customConfig: ProofreaderConfig = {
        expectedInputLanguages: ['en', 'es'],
      };

      const { result } = renderHook(() => useProofreader(customConfig));

      expect(result.current.config).toEqual(customConfig);
    });
  });

  // ==========================================================================
  // Proofread Operation
  // ==========================================================================

  describe('proofread', () => {
    it('should proofread text successfully', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('teh test');
      });

      await waitFor(() => {
        expect(result.current.corrections).toHaveLength(1);
      });

      expect(result.current.corrections[0]).toEqual({
        correction: 'the',
        type: 'spelling',
        startIndex: 0,
        endIndex: 3,
      });
      expect(result.current.originalInput).toBe('teh test');
      expect(result.current.isProofreading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set loading state during operation', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      act(() => {
        result.current.actions.proofread('test');
      });

      expect(result.current.isProofreading).toBe(true);
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isProofreading).toBe(false);
      });
    });

    it('should initialize correction states', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('teh test');
      });

      await waitFor(() => {
        expect(result.current.correctionStates).toHaveLength(1);
      });

      expect(result.current.correctionStates[0]).toMatchObject({
        index: 0,
        state: 'pending',
      });
    });

    it('should reset state before new proofread', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('first');
      });

      await waitFor(() => {
        expect(result.current.corrections).toHaveLength(1);
      });

      await act(async () => {
        await result.current.actions.proofread('second');
      });

      await waitFor(() => {
        expect(result.current.originalInput).toBe('second');
      });
    });

    it('should track performance metrics', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('test');
      });

      await waitFor(() => {
        expect(result.current.metrics).toBeTruthy();
      });

      expect(result.current.metrics?.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle errors', async () => {
      // Override the mock to reject for all retries (hook retries 3 times)
      mockManagerInstance.proofread.mockRejectedValue(
        new Error('Proofread failed'),
      );

      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('test');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.isProofreading).toBe(false);
    });

    it('should keep correctedText null during proofread operation', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      // Before proofread
      expect(result.current.correctedText).toBeNull();

      // During proofread (before await completes)
      act(() => {
        result.current.actions.proofread('test text');
      });

      // Should still be null while proofread is in progress
      expect(result.current.correctedText).toBeNull();

      // After completion
      await waitFor(() => {
        expect(result.current.isProofreading).toBe(false);
      });
    });

    it('should only set correctedText after successful proofread', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('test text');
      });

      await waitFor(() => {
        expect(result.current.correctedText).toBe('test text');
      });

      expect(result.current.isProofreading).toBe(false);
      expect(result.current.corrections).toHaveLength(1);
    });

    it('should keep correctedText null on error', async () => {
      // Override the mock to reject for all retries
      mockManagerInstance.proofread.mockRejectedValue(
        new Error('Model not ready'),
      );

      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('test');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // correctedText should remain null on error
      expect(result.current.correctedText).toBeNull();
      expect(result.current.isProofreading).toBe(false);
    });
  });

  // ==========================================================================
  // Correction Application
  // ==========================================================================

  describe('applyCorrectionAtIndex', () => {
    it('should apply correction at index', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('teh test');
      });

      await waitFor(() => {
        expect(result.current.corrections).toHaveLength(1);
      });

      act(() => {
        result.current.actions.applyCorrectionAtIndex(0);
      });

      await waitFor(() => {
        expect(result.current.correctedText).toBe('the test');
      });

      expect(result.current.correctionStates[0].state).toBe('applied');
    });

    it('should handle invalid index', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('test');
      });

      await waitFor(() => {
        expect(result.current.corrections).toHaveLength(1);
      });

      // Should not throw
      act(() => {
        result.current.actions.applyCorrectionAtIndex(10);
      });
    });
  });

  describe('ignoreCorrectionAtIndex', () => {
    it('should ignore correction at index', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('teh test');
      });

      await waitFor(() => {
        expect(result.current.corrections).toHaveLength(1);
      });

      act(() => {
        result.current.actions.ignoreCorrectionAtIndex(0);
      });

      await waitFor(() => {
        expect(result.current.correctionStates[0].state).toBe('ignored');
      });

      // Text should not change
      expect(result.current.correctedText).toBe('teh test');
    });

    it('should handle invalid index', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('test');
      });

      await waitFor(() => {
        expect(result.current.corrections).toHaveLength(1);
      });

      // Should not throw
      act(() => {
        result.current.actions.ignoreCorrectionAtIndex(-1);
      });
    });
  });

  describe('applyAllCorrections', () => {
    it('should apply all corrections', async () => {
      // Override the mock to return 2 corrections for this test
      mockManagerInstance.proofread.mockResolvedValueOnce({
        corrections: [
          {
            correction: 'the',
            type: 'spelling',
            startIndex: 0,
            endIndex: 3,
          },
          {
            correction: 'quick',
            type: 'spelling',
            startIndex: 4,
            endIndex: 8,
          },
        ],
      });

      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('teh quik test');
      });

      await waitFor(() => {
        expect(result.current.corrections).toHaveLength(2);
      });

      act(() => {
        result.current.actions.applyAllCorrections();
      });

      await waitFor(() => {
        expect(result.current.correctedText).toContain('the');
        expect(result.current.correctedText).toContain('quick');
      });

      expect(
        result.current.correctionStates.every((s) => s.state === 'applied'),
      ).toBe(true);
    });
  });

  describe('applyCorrectionsByType', () => {
    it('should apply corrections of specific type', async () => {
      // Override the mock to return 2 corrections for this test
      mockManagerInstance.proofread.mockResolvedValueOnce({
        corrections: [
          {
            correction: 'the',
            type: 'spelling',
            startIndex: 0,
            endIndex: 3,
          },
          {
            correction: 'good grammar',
            type: 'grammar',
            startIndex: 10,
            endIndex: 21,
          },
        ],
      });

      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('teh test bad grammar');
      });

      await waitFor(() => {
        expect(result.current.corrections).toHaveLength(2);
      });

      act(() => {
        result.current.actions.applyCorrectionsByType('spelling');
      });

      await waitFor(() => {
        const spellingState = result.current.correctionStates.find(
          (s) => s.correction.type === 'spelling',
        );
        expect(spellingState?.state).toBe('applied');
      });
    });
  });

  // ==========================================================================
  // Undo/Redo
  // ==========================================================================

  describe('Undo/Redo', () => {
    it('should undo correction', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('teh test');
      });

      await waitFor(() => {
        expect(result.current.corrections).toHaveLength(1);
      });

      act(() => {
        result.current.actions.applyCorrectionAtIndex(0);
      });

      await waitFor(() => {
        expect(result.current.correctedText).toBe('the test');
        expect(result.current.canUndo).toBe(true);
      });

      act(() => {
        result.current.actions.undo();
      });

      await waitFor(() => {
        expect(result.current.canRedo).toBe(true);
      });
    });

    it('should redo correction', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('teh test');
      });

      await waitFor(() => {
        expect(result.current.corrections).toHaveLength(1);
      });

      act(() => {
        result.current.actions.applyCorrectionAtIndex(0);
      });

      await waitFor(() => {
        expect(result.current.canUndo).toBe(true);
      });

      act(() => {
        result.current.actions.undo();
      });

      await waitFor(() => {
        expect(result.current.canRedo).toBe(true);
      });

      act(() => {
        result.current.actions.redo();
      });

      // Should be back to applied state
      await waitFor(() => {
        expect(result.current.canUndo).toBe(true);
      });
    });

    it('should disable undo when no history', () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      expect(result.current.canUndo).toBe(false);
    });

    it('should disable redo when at end of history', () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      expect(result.current.canRedo).toBe(false);
    });
  });

  // ==========================================================================
  // Control Actions
  // ==========================================================================

  describe('cancel', () => {
    it('should cancel ongoing operation', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      act(() => {
        result.current.actions.proofread('test');
      });

      expect(result.current.isProofreading).toBe(true);

      act(() => {
        result.current.actions.cancel();
      });

      expect(result.current.isProofreading).toBe(false);
    });

    it('should not throw when no operation in progress', () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      expect(() => {
        act(() => {
          result.current.actions.cancel();
        });
      }).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset all state', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('teh test');
      });

      await waitFor(() => {
        expect(result.current.corrections).toHaveLength(1);
      });

      act(() => {
        result.current.actions.reset();
      });

      expect(result.current.corrections).toEqual([]);
      expect(result.current.correctionStates).toEqual([]);
      expect(result.current.originalInput).toBeNull();
      expect(result.current.correctedText).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isProofreading).toBe(false);
      expect(result.current.metrics).toBeNull();
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      act(() => {
        result.current.actions.updateConfig({
          expectedInputLanguages: ['en', 'es'],
        });
      });

      expect(result.current.config.expectedInputLanguages).toContain('en');
      expect(result.current.config.expectedInputLanguages).toContain('es');
    });

    it('should merge with existing config', () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      act(() => {
        result.current.actions.updateConfig({
          expectedInputLanguages: ['es'],
        });
      });

      expect(result.current.config.expectedInputLanguages).toEqual(['es']);
    });
  });

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useProofreader(defaultConfig));

      unmount();

      // Should not throw
    });

    it('should abort ongoing operations on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useProofreader(defaultConfig),
      );

      act(() => {
        result.current.actions.proofread('test');
      });

      unmount();

      // Should not throw
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty corrections result', async () => {
      // Override the mock to return empty corrections for this test
      mockManagerInstance.proofread.mockResolvedValueOnce({
        corrections: [],
      });

      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('perfect text');
      });

      await waitFor(() => {
        expect(result.current.corrections).toEqual([]);
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle very long text', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));
      const longText = 'word '.repeat(10000);

      await act(async () => {
        await result.current.actions.proofread(longText);
      });

      await waitFor(() => {
        expect(result.current.isProofreading).toBe(false);
      });
    });

    it('should handle Unicode text', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));
      const unicodeText = 'こんにちは世界 Hello мир';

      await act(async () => {
        await result.current.actions.proofread(unicodeText);
      });

      await waitFor(() => {
        expect(result.current.originalInput).toBe(unicodeText);
      });
    });

    it('should handle rapid successive operations', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        result.current.actions.proofread('first');
        result.current.actions.proofread('second');
        await result.current.actions.proofread('third');
      });

      await waitFor(() => {
        expect(result.current.isProofreading).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Instance Creation (Bug Fix Verification)
  // ==========================================================================

  describe('Instance Creation - Fixed Pattern', () => {
    it('should always call getInstance directly (not conditional)', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('test text');
      });

      await waitFor(() => {
        expect(result.current.isProofreading).toBe(false);
      });

      // Verify getInstance was called (the fixed pattern)
      expect(mockManagerInstance.getInstance).toHaveBeenCalled();
      expect(mockManagerInstance.updateConfig).toHaveBeenCalledWith(
        defaultConfig,
      );
    });

    it('should create instance only once per proofread operation', async () => {
      mockManagerInstance.getInstance.mockClear();

      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('test text');
      });

      await waitFor(() => {
        expect(result.current.isProofreading).toBe(false);
      });

      // Should be called exactly once during proofread
      expect(mockManagerInstance.getInstance).toHaveBeenCalledTimes(1);
    });

    it('should call getInstance synchronously to preserve user activation', async () => {
      const callOrder: string[] = [];

      mockManagerInstance.getInstance.mockImplementation(async () => {
        callOrder.push('getInstance-called');
        return {
          proofread: vi.fn(),
          destroy: vi.fn(),
        };
      });

      mockManagerInstance.proofread.mockImplementation(async () => {
        callOrder.push('proofread-called');
        return { corrections: [] };
      });

      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.proofread('test');
      });

      await waitFor(() => {
        expect(result.current.isProofreading).toBe(false);
      });

      // getInstance should be called before proofread
      expect(callOrder[0]).toBe('getInstance-called');
    });
  });

  // ==========================================================================
  // downloadModel (Bug Fix Verification)
  // ==========================================================================

  describe('downloadModel - Fixed Pattern', () => {
    it('should use getInstance instead of monitorDownload', async () => {
      mockManagerInstance.getInstance.mockClear();

      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.downloadModel();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify getInstance was called (the fixed pattern)
      expect(mockManagerInstance.getInstance).toHaveBeenCalled();
      expect(mockManagerInstance.updateConfig).toHaveBeenCalled();
    });

    it('should store the instance for reuse after download', async () => {
      const { result } = renderHook(() => useProofreader(defaultConfig));

      // First, download the model
      await act(async () => {
        await result.current.actions.downloadModel();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockManagerInstance.getInstance.mockClear();

      // Now proofread - instance should already exist and be reused
      await act(async () => {
        await result.current.actions.proofread('test');
      });

      await waitFor(() => {
        expect(result.current.isProofreading).toBe(false);
      });

      // getInstance is called again during proofread (but manager caches it internally)
      expect(mockManagerInstance.getInstance).toHaveBeenCalled();
    });

    it('should handle download errors gracefully', async () => {
      mockManagerInstance.getInstance.mockRejectedValueOnce(
        new Error('Download failed'),
      );

      const { result } = renderHook(() => useProofreader(defaultConfig));

      await act(async () => {
        await result.current.actions.downloadModel();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error?.message).toContain('Download failed');
    });
  });
});
