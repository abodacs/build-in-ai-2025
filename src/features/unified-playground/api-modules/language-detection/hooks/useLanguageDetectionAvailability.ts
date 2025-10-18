/**
 * useLanguageDetectionAvailability Hook
 *
 * React hook for checking Chrome AI Language Detection API availability.
 * Provides availability status and helper flags.
 *
 * @module language-detection/hooks/useLanguageDetectionAvailability
 */

import { useState, useEffect, useRef } from 'react';
import { ChromeAILanguageDetectionService } from '../services';
import type { AvailabilityStatus } from '../../shared/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Language Detection availability hook return type
 */
export interface UseLanguageDetectionAvailabilityReturn {
  /** Availability status */
  availability: AvailabilityStatus;

  /** Is checking availability */
  isChecking: boolean;

  /** Error if any */
  error: Error | null;

  /** Is API supported in browser */
  isSupported: boolean;

  /** Requires model download */
  requiresDownload: boolean;

  /** Is readily available */
  isReady: boolean;

  /** Recheck availability */
  recheckAvailability: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useLanguageDetectionAvailability hook
 *
 * Checks Language Detection API availability and provides helper flags.
 *
 * @returns Hook return object
 *
 * @example
 * ```tsx
 * const {
 *   availability,
 *   isSupported,
 *   requiresDownload,
 *   isReady
 * } = useLanguageDetectionAvailability();
 *
 * if (!isSupported) {
 *   return <div>Language Detection API not supported</div>;
 * }
 *
 * if (requiresDownload) {
 *   return <div>Model download required</div>;
 * }
 *
 * if (isReady) {
 *   return <LanguageDetectionUI />;
 * }
 * ```
 */
export function useLanguageDetectionAvailability(): UseLanguageDetectionAvailabilityReturn {
  const [availability, setAvailability] = useState<AvailabilityStatus>('no');
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Check availability
   */
  const checkAvailability = async () => {
    if (!isMountedRef.current) {
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const status = await ChromeAILanguageDetectionService.checkAvailability();

      if (isMountedRef.current) {
        setAvailability(status);
        setIsChecking(false);
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setAvailability('no');
        setIsChecking(false);
      }
    }
  };

  // Check on mount
  useEffect(() => {
    checkAvailability();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Derived flags
  const isSupported = ChromeAILanguageDetectionService.isSupported();
  const requiresDownload = availability === 'after-download';
  const isReady = availability === 'readily';

  return {
    availability,
    isChecking,
    error,
    isSupported,
    requiresDownload,
    isReady,
    recheckAvailability: checkAvailability,
  };
}

// ============================================================================
// Export
// ============================================================================

export default useLanguageDetectionAvailability;
