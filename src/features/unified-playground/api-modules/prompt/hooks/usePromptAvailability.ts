/**
 * usePromptAvailability Hook
 *
 * Hook for checking Chrome AI LanguageModel API availability and capabilities.
 * Provides state management for availability checking and model download.
 *
 * @module prompt/hooks/usePromptAvailability
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChromeAIPromptService } from '../services/ChromeAIPromptService';
import type {
  LanguageModelAvailability,
  AvailabilityCheckResult,
  DownloadProgress,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface SystemRequirements {
  minChromeVersion: number;
  requiredFlags: string[];
  storageRequired: string;
  ramRequired: string;
  networkRequired: boolean;
}

export interface BrowserCapabilities {
  supported: boolean;
  availability: LanguageModelAvailability;
  capabilities: {
    streaming: boolean;
    downloadProgress: boolean;
  };
}

interface UsePromptAvailabilityReturn {
  /** Current availability status */
  availability: LanguageModelAvailability;

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

  /** Is multimodal (image input) supported */
  multimodalAvailable: boolean;

  /** Detailed availability information (legacy) */
  details: AvailabilityCheckResult | null;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * usePromptAvailability - Check Chrome AI Prompt API availability
 *
 * Checks if the LanguageModel API is supported, available, and ready to use.
 * Provides model download capabilities with progress tracking.
 */
export function usePromptAvailability(): UsePromptAvailabilityReturn {
  // State
  const [availability, setAvailability] =
    useState<LanguageModelAvailability>('no');
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
  const [details, setDetails] = useState<AvailabilityCheckResult | null>(null);
  const [multimodalAvailable, setMultimodalAvailable] = useState(false);

  // Ref to track current availability value (prevents stale closures)
  const availabilityRef = useRef<LanguageModelAvailability>(availability);

  // Keep ref in sync with state
  useEffect(() => {
    availabilityRef.current = availability;
  }, [availability]);

  // Computed values
  const isSupported = ChromeAIPromptService.isSupported();

  // Model is ready when:
  // 1. Availability is 'available' (model downloaded and available)
  // 2. Not currently downloading
  // 3. API is supported
  const isReady = availability === 'available' && !isDownloading && isSupported;
  const requiresDownload = availability === 'after-download';

  // ============================================================================
  // Check Availability
  // ============================================================================

  /**
   * Detect browser capabilities
   */
  const detectCapabilities = useCallback(
    async (currentAvailability: LanguageModelAvailability) => {
      const caps: BrowserCapabilities = {
        supported: isSupported,
        availability: currentAvailability,
        capabilities: {
          streaming: true, // Prompt API supports streaming via promptStreaming
          downloadProgress: true, // Prompt API supports download progress monitoring
        },
      };
      setCapabilities(caps);
      return caps;
    },
    [isSupported],
  );

  /**
   * Check API availability
   */
  const checkAvailability = useCallback(async () => {
    console.log('[usePromptAvailability] checkAvailability() called');
    setIsChecking(true);
    setError(null);

    try {
      // Check if API is supported
      if (!isSupported) {
        console.log(
          '[usePromptAvailability] API not supported, setting availability to "no"',
        );
        setAvailability('no');
        setRequirements({
          minChromeVersion: 138,
          requiredFlags: ['prompt-api-for-gemini-nano-multimodal-input'],
          storageRequired: '~22GB',
          ramRequired: '4GB+',
          networkRequired: true,
        });
        setDetails({
          availability: 'no',
          isSupported: false,
          requiresDownload: false,
          requirements: {
            minChromeVersion: 138,
            requiredFlags: ['prompt-api-for-gemini-nano-multimodal-input'],
            storageRequired: '~22GB',
            ramRequired: '4GB+',
            networkRequired: true,
          },
          error: 'LanguageModel API is not supported in this browser',
        });
        await detectCapabilities('no');
        return;
      }

      // Check availability status and multimodal support in parallel
      console.log('[usePromptAvailability] Checking availability status...');
      const [availabilityStatus, multimodalStatus] = await Promise.all([
        ChromeAIPromptService.checkAvailability(),
        ChromeAIPromptService.checkMultimodalAvailability(),
      ]);

      console.log(
        '[usePromptAvailability] Availability status =',
        availabilityStatus,
      );
      console.log(
        '[usePromptAvailability] Multimodal status =',
        multimodalStatus,
      );

      setAvailability(availabilityStatus);
      setMultimodalAvailable(multimodalStatus === 'available');

      setRequirements({
        minChromeVersion: 138,
        requiredFlags: ['prompt-api-for-gemini-nano-multimodal-input'],
        storageRequired: '~22GB',
        ramRequired: '4GB+',
        networkRequired: availabilityStatus === 'after-download',
      });

      // Get detailed information
      const detailedInfo =
        await ChromeAIPromptService.checkDetailedAvailability();
      setDetails(detailedInfo);

      // Detect capabilities
      await detectCapabilities(availabilityStatus);

      // Check system requirements
      const sysReqs = await ChromeAIPromptService.checkSystemRequirements();

      // Validate system requirements
      if (!sysReqs.browser.supported) {
        setError(
          `LanguageModel API requires Chrome ${sysReqs.browser.requiredVersion}+ (current version: ${sysReqs.browser.version})`,
        );
      }

      if (!sysReqs.online) {
        setError('Internet connection required for model download');
      }

      console.log('[usePromptAvailability] Check complete');
    } catch (err) {
      console.error(
        '[usePromptAvailability] Error during availability check:',
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
    // Use ref to get current availability value (prevents stale closure)
    const currentAvailability = availabilityRef.current;

    console.log('[usePromptAvailability] startDownload called', {
      availability: currentAvailability,
    });

    if (currentAvailability !== 'after-download') {
      console.warn(
        '[usePromptAvailability] Model download not needed. Current availability:',
        currentAvailability,
      );
      return;
    }

    console.log('[usePromptAvailability] Starting download...');
    setIsDownloading(true);
    setDownloadProgress(null);
    setError(null);

    try {
      await ChromeAIPromptService.downloadModel((progress) => {
        console.log('[usePromptAvailability] Progress update:', progress);
        setDownloadProgress(progress);
      });

      console.log(
        '[usePromptAvailability] Download complete, waiting for Chrome to register model...',
      );

      // Give Chrome a moment to register the downloaded model
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('[usePromptAvailability] Refreshing availability...');

      // Download complete - refresh availability
      await checkAvailability();

      console.log('[usePromptAvailability] Availability refreshed:', {
        availability,
      });
    } catch (err) {
      console.error('[usePromptAvailability] Download error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Model download failed: Unknown error';
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
      console.log('[usePromptAvailability] Download cleanup complete');
    }
  }, [checkAvailability]); // Removed 'availability' - using availabilityRef instead

  // ============================================================================
  // Auto-check on Mount
  // ============================================================================

  useEffect(() => {
    console.log(
      '[usePromptAvailability] Auto-check useEffect triggered on mount',
    );
    checkAvailability();
  }, [checkAvailability]);

  // ============================================================================
  // Return
  // ============================================================================

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
    multimodalAvailable,
    details,
  };
}

export default usePromptAvailability;
