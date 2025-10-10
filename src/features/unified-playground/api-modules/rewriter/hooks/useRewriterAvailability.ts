/**
 * useRewriterAvailability Hook
 *
 * React hook for checking Chrome AI Rewriter API availability.
 * Provides availability status and helper flags.
 *
 * @module rewriter/hooks/useRewriterAvailability
 */

import { useState, useEffect, useRef } from 'react';
import { ChromeAIRewriterService } from '../services';
import type { AvailabilityStatus } from '../../shared/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Rewriter availability hook return type
 */
export interface UseRewriterAvailabilityReturn {
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
 * useRewriterAvailability hook
 *
 * Checks Rewriter API availability and provides helper flags.
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
 * } = useRewriterAvailability();
 *
 * if (!isSupported) {
 *   return <div>Rewriter API not supported</div>;
 * }
 *
 * if (requiresDownload) {
 *   return <div>Model download required</div>;
 * }
 *
 * if (isReady) {
 *   return <RewriterUI />;
 * }
 * ```
 */
export function useRewriterAvailability(): UseRewriterAvailabilityReturn {
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
      const status = await ChromeAIRewriterService.checkAvailability();

      if (isMountedRef.current) {
        setAvailability(status);
        setIsChecking(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err);
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
  const isSupported = ChromeAIRewriterService.isSupported();
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

export default useRewriterAvailability;
