/**
 * Model Download Hook
 *
 * Manages AI model download state and progress tracking
 * Provides progress updates and download control
 */

import { useState, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface DownloadProgress {
  loaded: number;
  total: number;
  progress: number; // 0-100
}

export interface UseModelDownloadReturn {
  /** Whether download is in progress */
  isDownloading: boolean;

  /** Download progress info */
  downloadProgress: DownloadProgress | null;

  /** Download error */
  downloadError: string | null;

  /** Create monitor callback for Summarizer.create() */
  createMonitor: () => (monitor: EventTarget) => void;

  /** Reset download state */
  resetDownload: () => void;

  /** Abort current download */
  abortDownload: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing model download state
 *
 * @example
 * ```tsx
 * const { isDownloading, downloadProgress, createMonitor } = useModelDownload();
 *
 * const summarizer = await Summarizer.create({
 *   monitor: createMonitor()
 * });
 *
 * {isDownloading && (
 *   <ModelDownloadProgress
 *     progress={downloadProgress?.progress || 0}
 *     loaded={downloadProgress?.loaded}
 *     total={downloadProgress?.total}
 *   />
 * )}
 * ```
 */
export function useModelDownload(): UseModelDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Create monitor callback for Summarizer.create()
   */
  const createMonitor = useCallback(() => {
    return (monitor: EventTarget) => {
      // Create abort controller
      abortControllerRef.current = new AbortController();

      // Listen for download progress
      monitor.addEventListener('downloadprogress', ((
        event: CustomEvent<{ loaded: number; total: number }>,
      ) => {
        const { loaded, total } = event.detail || (event as any);

        if (loaded && total) {
          const progress = Math.round((loaded / total) * 100);

          setIsDownloading(true);
          setDownloadProgress({
            loaded,
            total,
            progress,
          });
          setDownloadError(null);
        }
      }) as any);

      // Listen for download complete
      monitor.addEventListener('downloadcomplete', (() => {
        setIsDownloading(false);
        setDownloadProgress((prev) =>
          prev ? { ...prev, progress: 100 } : null,
        );
      }) as any);

      // Listen for download error
      monitor.addEventListener('downloaderror', ((
        event: CustomEvent<{ message: string }>,
      ) => {
        setIsDownloading(false);
        setDownloadError(event.detail?.message || 'Model download failed');
      }) as any);
    };
  }, []);

  /**
   * Reset download state
   */
  const resetDownload = useCallback(() => {
    setIsDownloading(false);
    setDownloadProgress(null);
    setDownloadError(null);
  }, []);

  /**
   * Abort current download
   */
  const abortDownload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsDownloading(false);
    setDownloadError('Download cancelled by user');
  }, []);

  return {
    isDownloading,
    downloadProgress,
    downloadError,
    createMonitor,
    resetDownload,
    abortDownload,
  };
}

// ============================================================================
// Export
// ============================================================================

export default useModelDownload;
