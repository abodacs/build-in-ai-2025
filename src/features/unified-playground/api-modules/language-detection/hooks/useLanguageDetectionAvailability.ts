/**
 * useLanguageDetectionAvailability Hook
 *
 * React hook for checking Chrome AI Language Detection API availability.
 * Provides state management for availability checking and model download.
 *
 * @module language-detection/hooks/useLanguageDetectionAvailability
 */

import { useState, useEffect, useCallback } from 'react';
import { ChromeAILanguageDetectionService } from '../services';
import type { AvailabilityStatus, DownloadProgress } from '../../shared/types';

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
  availability: AvailabilityStatus;
  capabilities: {
    streaming: boolean;
    downloadProgress: boolean;
  };
}

/**
 * Language Detection availability hook return type
 */
export interface UseLanguageDetectionAvailabilityReturn {
  /** Availability status */
  availability: AvailabilityStatus;

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
 * useLanguageDetectionAvailability hook
 *
 * Checks Language Detection API availability and provides model download capabilities.
 *
 * @returns Hook return object
 *
 * @example
 * ```tsx
 * const { availability, isReady, isDownloading, startDownload } = useLanguageDetectionAvailability();
 *
 * if (!isReady) {
 *   return <ModelDownloadButton onDownload={startDownload} />;
 * }
 * ```
 */
export function useLanguageDetectionAvailability(): UseLanguageDetectionAvailabilityReturn {
  // State
  const [availability, setAvailability] = useState<AvailabilityStatus>('no');
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
  const isSupported = ChromeAILanguageDetectionService.isSupported();

  // Model is ready when:
  // 1. Availability is 'available' (model downloaded and available)
  // 2. Not currently downloading
  // 3. API is supported
  const isReady = availability === 'available' && !isDownloading && isSupported;
  const requiresDownload = availability === 'after-download';

  /**
   * Detect browser capabilities
   */
  const detectCapabilities = useCallback(
    async (currentAvailability: AvailabilityStatus) => {
      const caps: BrowserCapabilities = {
        supported: isSupported,
        version: isSupported ? 'window' : 'none',
        availability: currentAvailability,
        capabilities: {
          streaming: false, // Language Detection doesn't support streaming
          downloadProgress: true, // Language Detection supports download progress monitoring
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
    console.log(
      '[useLanguageDetectionAvailability] checkAvailability() called',
    );
    setIsChecking(true);
    setError(null);

    try {
      // Check if API is supported
      if (!isSupported) {
        console.log(
          '[useLanguageDetectionAvailability] API not supported, setting availability to "no"',
        );
        setAvailability('no');
        setRequirements({
          chromeVersion: 'Chrome 138+',
          storageRequired: '22+ GB free storage',
          vramRequired: '4+ GB VRAM',
          networkRequired: true,
        });
        await detectCapabilities('no');
        return;
      }

      // Check availability status
      const status = await ChromeAILanguageDetectionService.checkAvailability();
      console.log(
        '[useLanguageDetectionAvailability] Availability status =',
        status,
      );
      setAvailability(status);
      setRequirements({
        chromeVersion: 'Chrome 138+',
        storageRequired: '22 GB free storage',
        vramRequired: '4 GB VRAM',
        networkRequired: status === 'after-download',
      });

      // Detect capabilities
      await detectCapabilities(status);

      // Check system requirements
      const sysReqs =
        await ChromeAILanguageDetectionService.checkSystemRequirements();

      // Validate system requirements
      if (!sysReqs.browser.supported) {
        setError(
          `Language Detection API requires Chrome ${sysReqs.browser.requiredVersion}+ (current version: ${sysReqs.browser.version})`,
        );
      }

      if (!sysReqs.online) {
        setError('Internet connection required for model download');
      }

      console.log('[useLanguageDetectionAvailability] Check complete');
    } catch (err) {
      console.error(
        '[useLanguageDetectionAvailability] Error during availability check:',
        err,
      );
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to check availability';
      setError(errorMessage);
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
    console.log('[useLanguageDetectionAvailability] startDownload called', {
      availability,
    });

    if (availability !== 'after-download') {
      console.warn(
        '[useLanguageDetectionAvailability] Model download not needed. Current availability:',
        availability,
      );
      return;
    }

    console.log('[useLanguageDetectionAvailability] Starting download...');
    setIsDownloading(true);
    setDownloadProgress(null);
    setError(null);

    try {
      await ChromeAILanguageDetectionService.downloadModel((progress) => {
        console.log(
          '[useLanguageDetectionAvailability] Progress update:',
          progress,
        );
        setDownloadProgress(progress);
      });

      console.log(
        '[useLanguageDetectionAvailability] Download complete, waiting for Chrome to register model...',
      );

      // Give Chrome a moment to register the downloaded model
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log(
        '[useLanguageDetectionAvailability] Refreshing availability...',
      );

      // Download complete - refresh availability
      await checkAvailability();

      console.log(
        '[useLanguageDetectionAvailability] Availability refreshed:',
        {
          availability,
        },
      );
    } catch (err) {
      console.error('[useLanguageDetectionAvailability] Download error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Model download failed: Unknown error';
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
      console.log(
        '[useLanguageDetectionAvailability] Download cleanup complete',
      );
    }
  }, [availability, checkAvailability]);

  // Check on mount
  useEffect(() => {
    console.log(
      '[useLanguageDetectionAvailability] Auto-check useEffect triggered on mount',
    );
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
    requiresDownload,
  };
}

// ============================================================================
// Export
// ============================================================================

export default useLanguageDetectionAvailability;
