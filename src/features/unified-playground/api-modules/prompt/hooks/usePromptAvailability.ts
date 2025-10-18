/**
 * usePromptAvailability Hook
 *
 * Hook for checking Chrome AI LanguageModel API availability and capabilities.
 *
 * @module prompt/hooks/usePromptAvailability
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChromeAIPromptService } from '../services/ChromeAIPromptService';
import type {
  LanguageModelAvailability,
  AvailabilityCheckResult,
  LanguageModelCapabilities,
} from '../types';

// ============================================================================
// Types
// ============================================================================

interface UsePromptAvailabilityReturn {
  /** Is the API supported in this browser? */
  isSupported: boolean;

  /** Current availability status */
  availability: LanguageModelAvailability | null;

  /** Is the API ready to use? */
  isReady: boolean;

  /** Does the API require model download? */
  requiresDownload: boolean;

  /** Is checking availability? */
  isChecking: boolean;

  /** Error message if check failed */
  error: string | null;

  /** Detailed availability information */
  details: AvailabilityCheckResult | null;

  /** API capabilities */
  capabilities: LanguageModelCapabilities | null;

  /** Check availability */
  checkAvailability: () => Promise<void>;

  /** Refresh availability status */
  refresh: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * usePromptAvailability - Check Chrome AI Prompt API availability
 *
 * Checks if the LanguageModel API is supported, available, and ready to use.
 * Also provides detailed information about requirements and capabilities.
 */
export function usePromptAvailability(): UsePromptAvailabilityReturn {
  // State
  const [isSupported, setIsSupported] = useState(false);
  const [availability, setAvailability] =
    useState<LanguageModelAvailability | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<AvailabilityCheckResult | null>(null);
  const [capabilities, setCapabilities] =
    useState<LanguageModelCapabilities | null>(null);

  // Derived state (memoized to prevent infinite loops in dependent components)
  // Chrome may return either 'available' or 'readily' depending on version
  const isReady = useMemo(
    () => availability === 'available' || availability === 'readily',
    [availability],
  );
  const requiresDownload = useMemo(
    () => availability === 'after-download',
    [availability],
  );

  console.log(
    'usePromptAvailability: Derived state - availability:',
    availability,
    '| isReady:',
    isReady,
    '| requiresDownload:',
    requiresDownload,
  );

  // ============================================================================
  // Check Availability
  // ============================================================================

  /**
   * Check API availability
   */
  const checkAvailability = useCallback(async () => {
    console.log('usePromptAvailability: checkAvailability() called');
    try {
      setIsChecking(true);
      setError(null);

      // Check if API is supported
      console.log('usePromptAvailability: Checking if API is supported...');
      const supported = ChromeAIPromptService.isSupported();
      console.log('usePromptAvailability: API supported =', supported);
      setIsSupported(supported);

      if (!supported) {
        console.log(
          'usePromptAvailability: API not supported, setting availability to "no"',
        );
        setAvailability('no');
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
        return;
      }

      // Check availability status
      console.log('usePromptAvailability: Checking availability status...');
      const availabilityStatus =
        await ChromeAIPromptService.checkAvailability();
      console.log(
        'usePromptAvailability: Availability status =',
        availabilityStatus,
      );
      console.log(
        'usePromptAvailability: Is ready? (status === "available" or "readily") =',
        availabilityStatus === 'available' || availabilityStatus === 'readily',
      );
      setAvailability(availabilityStatus);

      // Get detailed information
      const detailedInfo =
        await ChromeAIPromptService.checkDetailedAvailability();
      setDetails(detailedInfo);

      // Get capabilities if available
      if (availabilityStatus !== 'no') {
        const caps = await ChromeAIPromptService.getCapabilities();
        setCapabilities(caps);
      }

      console.log('usePromptAvailability: Check complete');
    } catch (err) {
      console.error(
        'usePromptAvailability: Error during availability check:',
        err,
      );
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to check availability';
      setError(errorMessage);
      setAvailability('no');
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Refresh availability (alias for checkAvailability)
   */
  const refresh = useCallback(async () => {
    await checkAvailability();
  }, [checkAvailability]);

  // ============================================================================
  // Auto-check on Mount
  // ============================================================================

  useEffect(() => {
    console.log(
      'usePromptAvailability: Auto-check useEffect triggered on mount',
    );
    checkAvailability();
  }, [checkAvailability]);

  // ============================================================================
  // Return
  // ============================================================================

  console.log(
    'usePromptAvailability: availability=',
    availability,
    'isSupported=',
    isSupported,
    'isReady=',
    isReady,
  );
  return {
    isSupported,
    availability,
    isReady,
    requiresDownload,
    isChecking,
    error,
    details,
    capabilities,
    checkAvailability,
    refresh,
  };
}

export default usePromptAvailability;
