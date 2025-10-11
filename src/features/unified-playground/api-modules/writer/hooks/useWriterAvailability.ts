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
 * - Automatic retries
 * - Error handling
 *
 * @module writer/hooks/useWriterAvailability
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { WriterChromeAIService } from '../services';
import type { WriterAvailabilityState } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Availability hook actions
 */
export interface UseWriterAvailabilityActions {
  /** Check availability */
  checkAvailability: () => Promise<void>;

  /** Refresh availability status */
  refresh: () => Promise<void>;
}

/**
 * Hook return type
 */
export interface UseWriterAvailabilityReturn extends WriterAvailabilityState {
  /** Actions */
  actions: UseWriterAvailabilityActions;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for Writer API availability checking
 *
 * Automatically checks availability on mount and provides
 * actions to refresh the status.
 *
 * @param autoCheck - Whether to check on mount (default: true)
 * @returns Availability state and actions
 *
 * @example
 * ```tsx
 * function WriterAvailabilityCheck() {
 *   const {
 *     availability,
 *     isChecking,
 *     error,
 *     isSupported,
 *     requiresDownload,
 *     actions,
 *   } = useWriterAvailability();
 *
 *   if (isChecking) {
 *     return <div>Checking availability...</div>;
 *   }
 *
 *   if (error) {
 *     return <div>Error: {error.message}</div>;
 *   }
 *
 *   if (!isSupported) {
 *     return (
 *       <div>
 *         Writer API not supported. Requires Chrome 137+.
 *       </div>
 *     );
 *   }
 *
 *   if (requiresDownload) {
 *     return (
 *       <div>
 *         Model download required. Click Generate to start download.
 *       </div>
 *     );
 *   }
 *
 *   return <div>Writer API is ready to use!</div>;
 * }
 * ```
 */
export function useWriterAvailability(
  autoCheck = true,
): UseWriterAvailabilityReturn {
  // State
  const [availability, setAvailability] = useState<
    'no' | 'after-download' | 'readily' | null
  >(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [requiresDownload, setRequiresDownload] = useState(false);

  // Refs
  const isMountedRef = useRef(true);
  const hasCheckedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Check availability
   */
  const checkAvailability = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsChecking(true);
    setError(null);

    try {
      // Check if API is supported
      const supported = WriterChromeAIService.isSupported();
      setIsSupported(supported);

      if (!supported) {
        setAvailability('no');
        setRequiresDownload(false);
        setIsChecking(false);
        return;
      }

      // Check detailed availability
      const result = await WriterChromeAIService.checkDetailedAvailability();

      if (isMountedRef.current) {
        setAvailability(result.availability);
        setRequiresDownload(result.requiresDownload);
        setIsChecking(false);
        hasCheckedRef.current = true;
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error =
          err instanceof Error
            ? err
            : new Error('Failed to check availability');
        setError(error);
        setAvailability('no');
        setIsSupported(false);
        setRequiresDownload(false);
        setIsChecking(false);
      }
    }
  }, []);

  /**
   * Refresh availability status
   */
  const refresh = useCallback(async () => {
    hasCheckedRef.current = false;
    await checkAvailability();
  }, [checkAvailability]);

  // Auto-check on mount
  useEffect(() => {
    if (autoCheck && !hasCheckedRef.current) {
      checkAvailability();
    }
  }, [autoCheck, checkAvailability]);

  return {
    // State
    availability,
    isChecking,
    error,
    isSupported,
    requiresDownload,

    // Actions
    actions: {
      checkAvailability,
      refresh,
    },
  };
}

// ============================================================================
// Export
// ============================================================================

export default useWriterAvailability;
