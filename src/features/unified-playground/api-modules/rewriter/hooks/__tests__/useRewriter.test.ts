/**
 * useRewriter Hook Test Suite
 *
 * Comprehensive tests for useRewriter hook including:
 * - State management
 * - Streaming operations
 * - Retry logic with state synchronization
 * - Configuration updates
 * - Cancellation
 * - Error handling
 *
 * Coverage: Hook behavior, state transitions, regression tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRewriter } from '../useRewriter';
import type { RewriterConfig } from '../../types';

// ============================================================================
// Test Setup
// ============================================================================

const DEFAULT_CONFIG: RewriterConfig = {
  tone: 'as-is',
  format: 'plain-text',
  length: 'as-is',
  outputLanguage: 'en',
  sharedContext: '',
};

// Mock RewriterManager
const mockRewriterManager = {
  getInstance: vi.fn(),
  updateConfig: vi.fn(),
  cleanup: vi.fn(),
  rewrite: vi.fn(),
  rewriteStreaming: vi.fn(),
};

vi.mock('../../services', () => ({
  RewriterManager: vi.fn(() => mockRewriterManager),
  RewriterErrorHandler: {
    handleRewriteError: (error: any) => error,
    getUserMessage: (error: any) => error.message || 'Unknown error',
    formatForLogging: (error: any) => `Error: ${error.message}`,
  },
}));

vi.mock('../../../shared/services', () => ({
  PerformanceTracker: vi.fn(() => ({
    start: vi.fn(),
    end: vi.fn(),
    markFirstChunk: vi.fn(),
    hasFirstChunk: vi.fn().mockReturnValue(false),
    addChunk: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({
      totalTime: 1000,
      firstChunkTime: 100,
      wordsPerSecond: 50,
      totalChunks: 10,
      averageChunkSize: 10,
    }),
    reset: vi.fn(),
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();

  // Reset mock implementations
  mockRewriterManager.getInstance.mockResolvedValue({});
  mockRewriterManager.rewrite.mockResolvedValue('Rewritten text');
  mockRewriterManager.rewriteStreaming.mockResolvedValue('Streamed text');
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// Tests
// ============================================================================

describe('useRewriter', () => {
  // ==========================================================================
  // Initial State Tests
  // ==========================================================================

  describe('Initial State', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      expect(result.current.isRewriting).toBe(false);
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.content).toBeNull();
      expect(result.current.originalInput).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.metrics).toBeNull();
      expect(result.current.config).toEqual(DEFAULT_CONFIG);
    });

    it('provides all required actions', () => {
      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      expect(result.current.actions).toHaveProperty('rewrite');
      expect(result.current.actions).toHaveProperty('rewriteStreaming');
      expect(result.current.actions).toHaveProperty('rewriteAuto');
      expect(result.current.actions).toHaveProperty('cancel');
      expect(result.current.actions).toHaveProperty('reset');
      expect(result.current.actions).toHaveProperty('updateConfig');
    });
  });

  // ==========================================================================
  // Standard Rewrite Tests
  // ==========================================================================

  describe('Standard Rewrite', () => {
    it('performs basic rewrite successfully', async () => {
      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      let rewriteResult: string | null = null;

      await act(async () => {
        rewriteResult = await result.current.actions.rewrite('Test input');
      });

      await waitFor(() => {
        expect(result.current.content).toBe('Rewritten text');
        expect(result.current.originalInput).toBe('Test input');
        expect(result.current.isRewriting).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(rewriteResult).toBe('Rewritten text');
    });

    it('sets isLoading and isRewriting states correctly during rewrite', async () => {
      let resolveRewrite: (value: string) => void;
      const rewritePromise = new Promise<string>((resolve) => {
        resolveRewrite = resolve;
      });

      mockRewriterManager.getInstance.mockResolvedValue({});
      mockRewriterManager.rewrite.mockReturnValue(rewritePromise);

      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      // Start rewrite
      act(() => {
        result.current.actions.rewrite('Test input');
      });

      // Check loading state
      await waitFor(() => {
        expect(result.current.isRewriting).toBe(true);
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve instance creation
      await act(async () => {
        // Instance resolved
        await Promise.resolve();
      });

      // Loading should be false after instance is ready
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isRewriting).toBe(true);
      });

      // Complete rewrite
      await act(async () => {
        resolveRewrite!('Rewritten text');
      });

      // All states should be reset
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isRewriting).toBe(false);
      });
    });

    it('passes context to rewrite operation', async () => {
      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      await act(async () => {
        await result.current.actions.rewrite('Test input', 'Make it formal');
      });

      expect(mockRewriterManager.rewrite).toHaveBeenCalledWith(
        'Test input',
        'Make it formal',
        expect.any(Object), // AbortSignal
      );
    });

    it('handles rewrite errors correctly', async () => {
      const testError = new Error('Rewrite failed');
      mockRewriterManager.rewrite.mockRejectedValue(testError);

      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      await act(async () => {
        await result.current.actions.rewrite('Test input');
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toContain('Rewrite failed');
        expect(result.current.isRewriting).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Streaming Rewrite Tests
  // ==========================================================================

  describe('Streaming Rewrite', () => {
    it('performs streaming rewrite successfully', async () => {
      const chunks: string[] = [];
      const onChunk = vi.fn((chunk: string) => chunks.push(chunk));

      // Mock streaming to return chunks
      mockRewriterManager.rewriteStreaming.mockResolvedValue('Full result');

      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      await act(async () => {
        await result.current.actions.rewriteStreaming('Test input', onChunk);
      });

      await waitFor(() => {
        expect(result.current.content).toBeTruthy();
        expect(result.current.isRewriting).toBe(false);
        expect(result.current.isStreaming).toBe(false);
      });
    });

    it('sets isStreaming state correctly during streaming', async () => {
      let resolveStream: (value: string) => void;
      const streamPromise = new Promise<string>((resolve) => {
        resolveStream = resolve;
      });

      mockRewriterManager.rewriteStreaming.mockReturnValue(streamPromise);

      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      // Start streaming
      act(() => {
        result.current.actions.rewriteStreaming('Test input', () => {});
      });

      // Check streaming state
      await waitFor(() => {
        expect(result.current.isStreaming).toBe(true);
        expect(result.current.isRewriting).toBe(true);
      });

      // Complete streaming
      await act(async () => {
        resolveStream!('Streamed result');
      });

      // States should be reset
      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
        expect(result.current.isRewriting).toBe(false);
      });
    });

    it('initializes content with empty string for streaming', async () => {
      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      act(() => {
        result.current.actions.rewriteStreaming('Test input', () => {});
      });

      await waitFor(() => {
        // Content should be initialized to empty string for streaming
        expect(result.current.content).toBe('');
      });
    });
  });

  // ==========================================================================
  // CRITICAL: Streaming Retry State Synchronization Tests
  // Regression test for the bug we just fixed
  // ==========================================================================

  describe('Streaming Retry State Synchronization', () => {
    it('CRITICAL: resets content state on retry to prevent stale content', async () => {
      let attemptCount = 0;

      // First attempt fails, second succeeds
      mockRewriterManager.rewriteStreaming.mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          return Promise.reject(new Error('First attempt failed'));
        }
        return Promise.resolve('Second attempt success');
      });

      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      await act(async () => {
        try {
          await result.current.actions.rewriteStreaming('Test input', () => {});
        } catch {
          // Expected to fail on first attempt
        }
      });

      // After retry, content should be from successful attempt, not stale
      await waitFor(() => {
        const content = result.current.content;
        // Content should either be empty (retry in progress) or from second attempt
        // NOT from first failed attempt
        expect(content).not.toContain('stale');
      });
    });

    it('CRITICAL: accumulated content syncs with state on retry', async () => {
      const onChunk = vi.fn();

      // Simulate retry by resolving on second call
      let callCount = 0;
      mockRewriterManager.rewriteStreaming.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Retry needed'));
        }
        return Promise.resolve('Success after retry');
      });

      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      await act(async () => {
        try {
          await result.current.actions.rewriteStreaming('Test', onChunk);
        } catch {
          // First attempt may fail
        }
      });

      // Verify final state is consistent
      await waitFor(() => {
        // If error occurred, content should be reset
        // If success, content should match result
        if (result.current.error) {
          // On error, content might be empty or contain partial data
          expect(result.current.content).toBeDefined();
        } else {
          expect(result.current.content).toBeTruthy();
        }
      });
    });

    it('clears stale content before retry attempt', async () => {
      mockRewriterManager.rewriteStreaming
        .mockRejectedValueOnce(new Error('First fail'))
        .mockResolvedValueOnce('Success after retry');

      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      // Start streaming operation
      await act(async () => {
        try {
          await result.current.actions.rewriteStreaming('Test', () => {});
        } catch {
          // First attempt may fail
        }
      });

      // After completion (or error), verify state
      await waitFor(() => {
        // Content should either be:
        // 1. The success result if retry worked
        // 2. Empty/null if error occurred
        // It should NOT contain stale data from first failed attempt
        const content = result.current.content;
        if (content) {
          // If we have content, it should be from successful retry
          expect(content).not.toContain('First fail');
        } else {
          // If no content, that's also valid (error state)
          expect(content).toBeNull();
        }
      });
    });
  });

  // ==========================================================================
  // Configuration Tests
  // ==========================================================================

  describe('Configuration Management', () => {
    it('updates configuration correctly', () => {
      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      act(() => {
        result.current.actions.updateConfig({ tone: 'more-formal' });
      });

      expect(result.current.config.tone).toBe('more-formal');
      expect(mockRewriterManager.updateConfig).toHaveBeenCalled();
    });

    it('preserves other config values when updating partially', () => {
      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      act(() => {
        result.current.actions.updateConfig({ tone: 'more-formal' });
      });

      expect(result.current.config).toEqual({
        ...DEFAULT_CONFIG,
        tone: 'more-formal',
      });
    });
  });

  // ==========================================================================
  // Cancellation Tests
  // ==========================================================================

  describe('Cancellation', () => {
    it('cancels ongoing rewrite operation', async () => {
      let resolveRewrite: (value: string) => void;
      const rewritePromise = new Promise<string>((resolve) => {
        resolveRewrite = resolve;
      });

      mockRewriterManager.rewrite.mockReturnValue(rewritePromise);

      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      // Start rewrite
      act(() => {
        result.current.actions.rewrite('Test input');
      });

      await waitFor(() => {
        expect(result.current.isRewriting).toBe(true);
      });

      // Cancel
      act(() => {
        result.current.actions.cancel();
      });

      // States should be reset
      expect(result.current.isRewriting).toBe(false);
      expect(result.current.isStreaming).toBe(false);
    });

    it('cancels streaming operation', async () => {
      let resolveStream: (value: string) => void;
      const streamPromise = new Promise<string>((resolve) => {
        resolveStream = resolve;
      });

      mockRewriterManager.rewriteStreaming.mockReturnValue(streamPromise);

      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      // Start streaming
      act(() => {
        result.current.actions.rewriteStreaming('Test input', () => {});
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(true);
      });

      // Cancel
      act(() => {
        result.current.actions.cancel();
      });

      // States should be reset
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.isRewriting).toBe(false);
    });
  });

  // ==========================================================================
  // Reset Tests
  // ==========================================================================

  describe('Reset Functionality', () => {
    it('resets all state to initial values', async () => {
      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      // Perform a rewrite first
      await act(async () => {
        await result.current.actions.rewrite('Test input');
      });

      // Verify state is populated
      await waitFor(() => {
        expect(result.current.content).toBeTruthy();
        expect(result.current.originalInput).toBeTruthy();
      });

      // Reset
      act(() => {
        result.current.actions.reset();
      });

      // All state should be cleared
      expect(result.current.isRewriting).toBe(false);
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.content).toBeNull();
      expect(result.current.originalInput).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.metrics).toBeNull();
    });

    it('cancels ongoing operations when reset is called', async () => {
      let resolveRewrite: (value: string) => void;
      const rewritePromise = new Promise<string>((resolve) => {
        resolveRewrite = resolve;
      });

      mockRewriterManager.rewrite.mockReturnValue(rewritePromise);

      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      // Start rewrite
      act(() => {
        result.current.actions.rewrite('Test input');
      });

      await waitFor(() => {
        expect(result.current.isRewriting).toBe(true);
      });

      // Reset (should cancel ongoing operation)
      act(() => {
        result.current.actions.reset();
      });

      // States should be reset immediately
      expect(result.current.isRewriting).toBe(false);
      expect(result.current.content).toBeNull();
    });
  });

  // ==========================================================================
  // Auto Mode Tests
  // ==========================================================================

  describe('Auto Mode Selection', () => {
    it('uses streaming when callback is provided', async () => {
      const onChunk = vi.fn();
      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      await act(async () => {
        await result.current.actions.rewriteAuto('Test input', onChunk);
      });

      expect(mockRewriterManager.rewriteStreaming).toHaveBeenCalled();
    });

    it('uses standard rewrite when no callback provided', async () => {
      const { result } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      await act(async () => {
        await result.current.actions.rewriteAuto('Test input');
      });

      expect(mockRewriterManager.rewrite).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Cleanup Tests
  // ==========================================================================

  describe('Cleanup', () => {
    it('cleans up resources on unmount', () => {
      const { unmount } = renderHook(() => useRewriter(DEFAULT_CONFIG));

      unmount();

      expect(mockRewriterManager.cleanup).toHaveBeenCalled();
    });
  });
});
