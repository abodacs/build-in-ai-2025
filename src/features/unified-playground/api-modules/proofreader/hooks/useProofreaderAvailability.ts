/**
 * useProofreaderAvailability Hook
 *
 * React hook for checking Proofreader API availability.
 * Provides state management for availability checking and model download.
 *
 * @module proofreader/hooks/useProofreaderAvailability
 */

import { useState, useEffect, useCallback } from 'react';
import { ChromeAIProofreaderService } from '../services';
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

export interface UseProofreaderAvailabilityReturn {
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
 * useProofreaderAvailability hook
 *
 * Checks Proofreader API availability and provides model download capabilities.
 *
 * @returns Hook return object
 *
 * @example
 * ```tsx
 * const { availability, isReady, isDownloading, startDownload } = useProofreaderAvailability();
 *
 * if (!isReady) {
 *   return <ModelDownloadButton onDownload={startDownload} />;
 * }
 * ```
 */
export function useProofreaderAvailability(): UseProofreaderAvailabilityReturn {
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
  const isSupported = ChromeAIProofreaderService.isSupported();

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
          streaming: false, // Proofreader doesn't support streaming
          downloadProgress: true, // Proofreader supports download progress monitoring
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
    console.log('[useProofreaderAvailability] checkAvailability() called');
    setIsChecking(true);
    setError(null);

    try {
      // Check if API is supported
      if (!isSupported) {
        console.log(
          '[useProofreaderAvailability] API not supported, setting availability to "no"',
        );
        setAvailability('no');
        setRequirements({
          chromeVersion: 'Chrome 141+',
          storageRequired: '22+ GB free storage',
          vramRequired: '4+ GB VRAM',
          networkRequired: true,
        });
        await detectCapabilities('no');
        return;
      }

      // Check availability status
      const status = await ChromeAIProofreaderService.checkAvailability();
      console.log('[useProofreaderAvailability] Availability status =', status);
      setAvailability(status);
      setRequirements({
        chromeVersion: 'Chrome 141+',
        storageRequired: '22 GB free storage',
        vramRequired: '4 GB VRAM',
        networkRequired: status === 'after-download',
      });

      // Detect capabilities
      await detectCapabilities(status);

      // Check system requirements
      const sysReqs =
        await ChromeAIProofreaderService.checkSystemRequirements();

      // Validate system requirements
      if (!sysReqs.browser.supported) {
        setError(
          `Proofreader API requires Chrome ${sysReqs.browser.requiredVersion}+ (current version: ${sysReqs.browser.version})`,
        );
      }

      if (!sysReqs.online) {
        setError('Internet connection required for model download');
      }

      console.log('[useProofreaderAvailability] Check complete');
    } catch (err) {
      console.error(
        '[useProofreaderAvailability] Error during availability check:',
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
    console.log('[useProofreaderAvailability] startDownload called', {
      availability,
    });

    if (availability !== 'after-download') {
      console.warn(
        '[useProofreaderAvailability] Model download not needed. Current availability:',
        availability,
      );
      return;
    }

    console.log('[useProofreaderAvailability] Starting download...');
    setIsDownloading(true);
    setDownloadProgress(null);
    setError(null);

    try {
      await ChromeAIProofreaderService.downloadModel((progress) => {
        console.log('[useProofreaderAvailability] Progress update:', progress);
        setDownloadProgress(progress);
      });

      console.log(
        '[useProofreaderAvailability] Download complete, waiting for Chrome to register model...',
      );

      // Give Chrome a moment to register the downloaded model
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('[useProofreaderAvailability] Refreshing availability...');

      // Download complete - refresh availability
      await checkAvailability();

      console.log('[useProofreaderAvailability] Availability refreshed:', {
        availability,
      });
    } catch (err) {
      console.error('[useProofreaderAvailability] Download error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Model download failed: Unknown error';
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
      console.log('[useProofreaderAvailability] Download cleanup complete');
    }
  }, [availability, checkAvailability]);

  // Check on mount
  useEffect(() => {
    console.log(
      '[useProofreaderAvailability] Auto-check useEffect triggered on mount',
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

export default useProofreaderAvailability;
