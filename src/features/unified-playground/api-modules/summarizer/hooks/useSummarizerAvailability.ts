/**
 * useSummarizerAvailability Hook
 *
 * React hook for checking Chrome AI Summarizer availability
 * Provides availability status, system requirements, and model download management
 *
 * @module useSummarizerAvailability
 */

import { useState, useEffect, useCallback } from 'react';
import { ChromeAIService } from '../services/ChromeAIService';
import { ChromeAICompatibility } from '../services/ChromeAICompatibility';
import { ErrorHandler } from '../services/ErrorHandler';
import type {
  SummarizerAvailability,
  AvailabilityCheckResult,
  DownloadProgress,
  BrowserCapabilities,
} from '../types/summarizer.types';

// ============================================================================
// Types
// ============================================================================

export interface UseSummarizerAvailabilityReturn {
  /** Availability status */
  availability: SummarizerAvailability;

  /** System requirements */
  requirements: AvailabilityCheckResult['requirements'] | null;

  /** Browser capabilities */
  capabilities: BrowserCapabilities | null;

  /** Is checking availability */
  isChecking: boolean;

  /** Is downloading model */
  isDownloading: boolean;

  /** Download progress */
  downloadProgress: DownloadProgress | null;

  /** Error if availability check failed */
  error: string | null;

  /** Refresh availability status */
  refresh: () => Promise<void>;

  /** Start model download */
  startDownload: () => Promise<void>;

  /** Is API supported */
  isSupported: boolean;

  /** Is model ready to use */
  isReady: boolean;
}

// ============================================================================
// useSummarizerAvailability Hook
// ============================================================================

/**
 * Hook for checking Chrome AI Summarizer availability
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     availability,
 *     isReady,
 *     isDownloading,
 *     downloadProgress,
 *     startDownload,
 *   } = useSummarizerAvailability();
 *
 *   if (!isReady) {
 *     return <ModelDownloadButton onDownload={startDownload} />;
 *   }
 *
 *   return <Summarizer />;
 * }
 * ```
 */
export function useSummarizerAvailability(): UseSummarizerAvailabilityReturn {
  // State
  const [availability, setAvailability] =
    useState<SummarizerAvailability>('no');
  const [requirements, setRequirements] = useState<
    AvailabilityCheckResult['requirements'] | null
  >(null);
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const isSupported = ChromeAIService.isSupported();

  // Model is ready when:
  // 1. Availability is 'available' (model downloaded and available)
  // 2. Not currently downloading
  // 3. API is supported
  const isReady = availability === 'available' && !isDownloading && isSupported;

  /**
   * Check availability
   */
  const checkAvailability = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    try {
      // Check if API is supported
      if (!isSupported) {
        setAvailability('no');
        setRequirements({
          chromeVersion: 'Chrome 138+',
          storageRequired: '22+ GB free storage',
          vramRequired: '4+ GB VRAM',
          networkRequired: true,
        });
        return;
      }

      // Check availability
      const result = await ChromeAIService.checkAvailability();
      setAvailability(result.availability);
      setRequirements(result.requirements);

      // Check capabilities
      const caps = await ChromeAICompatibility.detectCapabilities();
      setCapabilities(caps);

      // Check system requirements
      const sysReqs = await ChromeAIService.checkSystemRequirements();
      const reqsError = ErrorHandler.validateSystemRequirements(sysReqs);

      if (reqsError) {
        setError(reqsError.message);
      }
    } catch (err) {
      const handledError = ErrorHandler.handleError(err);
      setError(handledError.message);
      setAvailability('no');
    } finally {
      setIsChecking(false);
    }
  }, [isSupported]);

  /**
   * Refresh availability status
   */
  const refresh = useCallback(async () => {
    // Clear cache before checking
    ChromeAICompatibility.clearCache();
    await checkAvailability();
  }, [checkAvailability]);

  /**
   * Start model download
   */
  const startDownload = useCallback(async () => {
    console.log('[useSummarizerAvailability] startDownload called', {
      availability,
    });

    if (availability !== 'after-download') {
      console.warn(
        '[useSummarizerAvailability] Model download not needed. Current availability:',
        availability,
      );
      return;
    }

    console.log('[useSummarizerAvailability] Starting download...');
    setIsDownloading(true);
    setDownloadProgress(null);
    setError(null);

    let currentProgress = 0;

    try {
      await ChromeAIService.downloadModel((progress) => {
        console.log('[useSummarizerAvailability] Progress update:', progress);
        currentProgress = progress.loaded;
        setDownloadProgress(progress);
      });

      console.log(
        '[useSummarizerAvailability] Download complete, waiting for Chrome to register model...',
      );

      // Give Chrome a moment to register the downloaded model
      // Chrome needs time to process and mark the model as 'available' available
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('[useSummarizerAvailability] Refreshing availability...');

      // Clear cache to force fresh check
      ChromeAICompatibility.clearCache();

      // Download complete - refresh availability
      await checkAvailability();

      console.log('[useSummarizerAvailability] Availability refreshed:', {
        availability,
      });
    } catch (err) {
      console.error('[useSummarizerAvailability] Download error:', err);
      const handledError = ErrorHandler.handleDownloadError(
        err,
        currentProgress,
      );
      setError(handledError.message);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
      console.log('[useSummarizerAvailability] Download cleanup complete');
    }
  }, [availability, checkAvailability]);

  /**
   * Initial availability check on mount
   */
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return {
    availability,
    requirements,
    capabilities,
    isChecking,
    isDownloading,
    downloadProgress,
    error,
    refresh,
    startDownload,
    isSupported,
    isReady,
  };
}

// ============================================================================
// Export
// ============================================================================

export default useSummarizerAvailability;
