/**
 * useWriterAvailability Hook
 *
 * React hook for checking Writer API availability.
 * Provides state management for availability checking and model download.
 *
 * Features:
 * - Availability status checking
 * - Browser support detection
 * - Download requirement detection
 * - System requirements validation
 * - Browser capabilities detection
 * - Model download with progress tracking
 * - Error handling
 *
 * @module writer/hooks/useWriterAvailability
 */

import { useState, useEffect, useCallback } from 'react';
import { WriterChromeAIService, WriterErrorHandler } from '../services';
import type { DownloadProgress } from '../../shared/types';

// ============================================================================
// Types
// ============================================================================

export interface SystemRequirements {
  chromeVersion: string;
  storageRequired: string;
  vramRequired: string;
  networkRequired: boolean;
}

export interface BrowserCapabilities {
  supported: boolean;
  version: 'window' | 'none';
  availability: 'no' | 'after-download' | 'available';
  capabilities: {
    streaming: boolean;
    downloadProgress: boolean;
  };
}

/**
 * Hook return type
 */
export interface UseWriterAvailabilityReturn {
  /** Availability status */
  availability: 'no' | 'after-download' | 'available';

  /** System requirements */
  requirements: SystemRequirements | null;

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

  /** Requires download (alias for availability === 'after-download') */
  requiresDownload: boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for Writer API availability checking
 *
 * Automatically checks availability on mount and provides
 * model download capabilities with progress tracking.
 *
 * @returns Availability state and actions
 *
 * @example
 * ```tsx
 * function WriterAvailabilityCheck() {
 *   const {
 *     availability,
 *     isReady,
 *     isDownloading,
 *     downloadProgress,
 *     startDownload,
 *   } = useWriterAvailability();
 *
 *   if (!isReady) {
 *     return <ModelDownloadButton onDownload={startDownload} />;
 *   }
 *
 *   return <Writer />;
 * }
 * ```
 */
export function useWriterAvailability(): UseWriterAvailabilityReturn {
  // State
  const [availability, setAvailability] = useState<
    'no' | 'after-download' | 'available'
  >('no');
  const [requirements, setRequirements] = useState<SystemRequirements | null>(
    null,
  );
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const isSupported = WriterChromeAIService.isSupported();

  // Model is ready when:
  // 1. Availability is 'available' (model downloaded and available)
  // 2. Not currently downloading
  // 3. API is supported
  const isReady = availability === 'available' && !isDownloading && isSupported;

  /**
   * Detect browser capabilities
   */
  const detectCapabilities = useCallback(
    async (currentAvailability: 'no' | 'after-download' | 'available') => {
      const caps: BrowserCapabilities = {
        supported: isSupported,
        version: isSupported ? 'window' : 'none',
        availability: currentAvailability,
        capabilities: {
          streaming: true, // Writer supports streaming via writeStreaming
          downloadProgress: true, // Writer supports download progress monitoring
        },
      };
      setCapabilities(caps);
      return caps;
    },
    [isSupported],
  );

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
          chromeVersion: 'Chrome 137+',
          storageRequired: '22+ GB free storage',
          vramRequired: '4+ GB VRAM',
          networkRequired: true,
        });
        await detectCapabilities('no');
        return;
      }

      // Check availability
      const status = await WriterChromeAIService.checkAvailability();
      setAvailability(status);
      setRequirements({
        chromeVersion: 'Chrome 137+',
        storageRequired: '22 GB free storage',
        vramRequired: '4 GB VRAM',
        networkRequired: status === 'after-download',
      });

      // Detect capabilities
      await detectCapabilities(status);

      // Check system requirements
      const sysReqs = await WriterChromeAIService.checkSystemRequirements();

      // Validate system requirements
      if (!sysReqs.browser.supported) {
        setError(
          `Writer API requires Chrome ${sysReqs.browser.requiredVersion}+ (current version: ${sysReqs.browser.version})`,
        );
      }

      if (!sysReqs.online) {
        setError('Internet connection required for model download');
      }
    } catch (err) {
      const handledError = WriterErrorHandler.handleError(err);
      setError(handledError.message);
      setAvailability('no');
    } finally {
      setIsChecking(false);
    }
  }, [isSupported, detectCapabilities]);

  /**
   * Refresh availability status
   */
  const refresh = useCallback(async () => {
    await checkAvailability();
  }, [checkAvailability]);

  /**
   * Start model download
   */
  const startDownload = useCallback(async () => {
    console.log('[useWriterAvailability] startDownload called', {
      availability,
    });

    if (availability !== 'after-download') {
      console.warn(
        '[useWriterAvailability] Model download not needed. Current availability:',
        availability,
      );
      return;
    }

    console.log('[useWriterAvailability] Starting download...');
    setIsDownloading(true);
    setDownloadProgress(null);
    setError(null);

    let currentProgress = 0;

    try {
      await WriterChromeAIService.downloadModel((progress) => {
        console.log('[useWriterAvailability] Progress update:', progress);
        currentProgress = progress.loaded;
        setDownloadProgress(progress);
      });

      console.log(
        '[useWriterAvailability] Download complete, waiting for Chrome to register model...',
      );

      // Give Chrome a moment to register the downloaded model
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('[useWriterAvailability] Refreshing availability...');

      // Download complete - refresh availability
      await checkAvailability();

      console.log('[useWriterAvailability] Availability refreshed:', {
        availability,
      });
    } catch (err) {
      console.error('[useWriterAvailability] Download error:', err);
      const handledError = WriterErrorHandler.handleDownloadError(
        err,
        currentProgress,
      );
      setError(handledError.message);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
      console.log('[useWriterAvailability] Download cleanup complete');
    }
  }, [availability, checkAvailability]);

  /**
   * Initial availability check on mount
   */
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Derived property - requires download
  const requiresDownload = availability === 'after-download';

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
    requiresDownload,
  };
}

// ============================================================================
// Export
// ============================================================================

export default useWriterAvailability;
