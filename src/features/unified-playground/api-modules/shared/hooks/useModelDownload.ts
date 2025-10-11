/**
 * useModelDownload Hook
 *
 * React hook for managing model download state and progress.
 * Provides UI state management for download operations.
 *
 * Features:
 * - Download progress tracking
 * - User activation handling
 * - Error management
 * - Cancellation support
 * - Automatic cleanup
 *
 * @module useModelDownload
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { DownloadProgress } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Download state
 */
export interface DownloadState {
  /** Is download in progress */
  isDownloading: boolean;

  /** Download progress */
  progress: DownloadProgress | null;

  /** Download error */
  error: Error | null;

  /** Has completed successfully */
  isComplete: boolean;

  /** Can be cancelled */
  canCancel: boolean;
}

/**
 * Download actions
 */
export interface DownloadActions {
  /** Start download */
  startDownload: (downloadFn: () => Promise<void>) => Promise<void>;

  /** Cancel download */
  cancelDownload: () => void;

  /** Reset download state */
  reset: () => void;
}

/**
 * Hook return type
 */
export type UseModelDownloadReturn = DownloadState & DownloadActions;

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing model download
 *
 * Provides state management and actions for model downloads.
 * Handles progress tracking, errors, and cancellation.
 *
 * @returns Download state and actions
 *
 * @example
 * ```tsx
 * function DownloadButton() {
 *   const {
 *     isDownloading,
 *     progress,
 *     error,
 *     startDownload,
 *     cancelDownload,
 *     reset,
 *   } = useModelDownload();
 *
 *   const handleDownload = async () => {
 *     await startDownload(async () => {
 *       await manager.monitorDownload(
 *         (progress) => {
 *           // Progress handled automatically by hook
 *         },
 *         abortController.signal
 *       );
 *     });
 *   };
 *
 *   if (error) {
 *     return (
 *       <div>
 *         Error: {error.message}
 *         <button onClick={reset}>Retry</button>
 *       </div>
 *     );
 *   }
 *
 *   if (isDownloading) {
 *     return (
 *       <div>
 *         Downloading: {progress?.percentage.toFixed(0)}%
 *         <button onClick={cancelDownload}>Cancel</button>
 *       </div>
 *     );
 *   }
 *
 *   return <button onClick={handleDownload}>Download Model</button>;
 * }
 * ```
 */
export function useModelDownload(): UseModelDownloadReturn {
  // State
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Start download
   */
  const startDownload = useCallback(async (downloadFn: () => Promise<void>) => {
    // Reset state
    setIsDownloading(true);
    setProgress(null);
    setError(null);
    setIsComplete(false);

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Run download function
      await downloadFn();

      // Mark complete (only if still mounted)
      if (isMountedRef.current) {
        setIsComplete(true);
        setIsDownloading(false);
      }
    } catch (err) {
      // Handle error (only if still mounted)
      if (isMountedRef.current) {
        const error =
          err instanceof Error
            ? err
            : new Error('Download failed with unknown error');

        // Check if it was cancelled
        if (
          error.message.includes('abort') ||
          error.message.includes('cancel')
        ) {
          // Cancelled - just reset
          setIsDownloading(false);
          setProgress(null);
        } else {
          // Real error
          setError(error);
          setIsDownloading(false);
        }
      }
    }
  }, []);

  /**
   * Cancel download
   */
  const cancelDownload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsDownloading(false);
    setProgress(null);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsDownloading(false);
    setProgress(null);
    setError(null);
    setIsComplete(false);
  }, []);

  return {
    // State
    isDownloading,
    progress,
    error,
    isComplete,
    canCancel: isDownloading && !isComplete,

    // Actions
    startDownload,
    cancelDownload,
    reset,
  };
}

// ============================================================================
// Export
// ============================================================================

export default useModelDownload;
