/**
 * useModelDownload Tests
 *
 * Unit tests for useModelDownload hook.
 * Focus: State management, error handling, cancellation, cleanup.
 *
 * @module shared/hooks/__tests__/useModelDownload.test
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useModelDownload } from '../useModelDownload';

describe('useModelDownload', () => {
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useModelDownload());

      expect(result.current.isDownloading).toBe(false);
      expect(result.current.progress).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isComplete).toBe(false);
      expect(result.current.canCancel).toBe(false);
    });

    it('should provide all required action functions', () => {
      const { result } = renderHook(() => useModelDownload());

      expect(typeof result.current.startDownload).toBe('function');
      expect(typeof result.current.cancelDownload).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('Starting Download', () => {
    it('should set isDownloading to true when download starts', async () => {
      const { result } = renderHook(() => useModelDownload());

      const downloadFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      act(() => {
        result.current.startDownload(downloadFn);
      });

      expect(result.current.isDownloading).toBe(true);
    });

    it('should mark as complete on successful download', async () => {
      const { result } = renderHook(() => useModelDownload());

      const downloadFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      await act(async () => {
        await result.current.startDownload(downloadFn);
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      expect(result.current.isDownloading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should reset state when starting new download', async () => {
      const { result } = renderHook(() => useModelDownload());

      // First download with error
      const failFn = vi.fn(async () => {
        throw new Error('First error');
      });

      await act(async () => {
        try {
          await result.current.startDownload(failFn);
        } catch (err) {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Second download should reset state
      const successFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      act(() => {
        result.current.startDownload(successFn);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should set error on download failure', async () => {
      const { result } = renderHook(() => useModelDownload());

      const errorMessage = 'Download failed';
      const downloadFn = vi.fn(async () => {
        throw new Error(errorMessage);
      });

      await act(async () => {
        try {
          await result.current.startDownload(downloadFn);
        } catch (err) {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.message).toBe(errorMessage);
      expect(result.current.isDownloading).toBe(false);
      expect(result.current.isComplete).toBe(false);
    });

    it('should handle non-Error exceptions', async () => {
      const { result } = renderHook(() => useModelDownload());

      const downloadFn = vi.fn(async () => {
        throw 'String error';
      });

      await act(async () => {
        try {
          await result.current.startDownload(downloadFn);
        } catch (err) {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.message).toBe(
        'Download failed with unknown error',
      );
    });

    it('should handle cancellation errors differently from other errors', async () => {
      const { result } = renderHook(() => useModelDownload());

      const downloadFn = vi.fn(async () => {
        throw new Error('Download cancelled by user');
      });

      await act(async () => {
        try {
          await result.current.startDownload(downloadFn);
        } catch (err) {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.isDownloading).toBe(false);
      });

      // Cancellation should not set error
      expect(result.current.error).toBeNull();
    });
  });

  describe('Cancellation', () => {
    it('should stop download when cancelled', async () => {
      const { result } = renderHook(() => useModelDownload());

      const downloadFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });

      act(() => {
        result.current.startDownload(downloadFn);
      });

      expect(result.current.isDownloading).toBe(true);

      act(() => {
        result.current.cancelDownload();
      });

      expect(result.current.isDownloading).toBe(false);
      expect(result.current.progress).toBeNull();
    });

    it('should set canCancel to true during download', async () => {
      const { result } = renderHook(() => useModelDownload());

      const downloadFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      act(() => {
        result.current.startDownload(downloadFn);
      });

      expect(result.current.canCancel).toBe(true);

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      expect(result.current.canCancel).toBe(false);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all state to initial values', async () => {
      const { result } = renderHook(() => useModelDownload());

      // Complete a download
      const downloadFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      await act(async () => {
        await result.current.startDownload(downloadFn);
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.isDownloading).toBe(false);
      expect(result.current.progress).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isComplete).toBe(false);
    });

    it('should reset error state', async () => {
      const { result } = renderHook(() => useModelDownload());

      // Trigger error
      const downloadFn = vi.fn(async () => {
        throw new Error('Test error');
      });

      await act(async () => {
        try {
          await result.current.startDownload(downloadFn);
        } catch (err) {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => useModelDownload());

      const downloadFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });

      act(() => {
        result.current.startDownload(downloadFn);
      });

      expect(result.current.isDownloading).toBe(true);

      // Unmount should cleanup
      unmount();

      // No assertion needed - test passes if no memory leaks or errors
    });

    it('should not update state after unmount', async () => {
      const { result, unmount } = renderHook(() => useModelDownload());

      const downloadFn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      act(() => {
        result.current.startDownload(downloadFn);
      });

      // Unmount before download completes
      unmount();

      // Wait to ensure download would have completed
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Test passes if no errors thrown (no state updates after unmount)
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple startDownload calls', async () => {
      const { result } = renderHook(() => useModelDownload());

      const download1 = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      const download2 = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Start first download
      act(() => {
        result.current.startDownload(download1);
      });

      // Start second download (should reset state from first)
      act(() => {
        result.current.startDownload(download2);
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      expect(download2).toHaveBeenCalled();
    });
  });
});
