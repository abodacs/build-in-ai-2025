/**
 * useProofreaderAvailability Hook
 *
 * React hook for checking Proofreader API availability.
 * Monitors download status and availability changes.
 *
 * @module proofreader/hooks/useProofreaderAvailability
 */

import { useState, useEffect } from 'react';
import { ChromeAIProofreaderService } from '../services';
import type { AvailabilityStatus } from '../../shared/types';

// ============================================================================
// Types
// ============================================================================

export interface UseProofreaderAvailabilityReturn {
  /** Current availability status */
  availability: AvailabilityStatus | null;

  /** Is API available and ready (model downloaded) */
  isAvailable: boolean;

  /** Is model ready to use (alias for isAvailable) */
  isReady: boolean;

  /** Does model require download */
  requiresDownload: boolean;

  /** Is checking availability */
  isChecking: boolean;

  /** Is model downloading */
  isDownloading: boolean;

  /** Error if any */
  error: Error | null;

  /** Recheck availability */
  recheckAvailability: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useProofreaderAvailability hook
 *
 * Checks and monitors Proofreader API availability
 *
 * @param options - Hook options
 * @param options.checkOnMount - Check availability on mount (default: true)
 * @param options.recheckInterval - Recheck interval in ms (default: null = no recheck)
 * @returns Hook return object
 *
 * @example
 * ```tsx
 * const { availability, isAvailable, isDownloading } = useProofreaderAvailability({
 *   checkOnMount: true,
 *   recheckInterval: 5000 // Check every 5 seconds
 * });
 *
 * if (!isAvailable) {
 *   return <div>Proofreader API not available</div>;
 * }
 * ```
 */
export function useProofreaderAvailability(
  options: {
    checkOnMount?: boolean;
    recheckInterval?: number | null;
  } = {},
): UseProofreaderAvailabilityReturn {
  const { checkOnMount = true, recheckInterval = null } = options;

  const [availability, setAvailability] = useState<AvailabilityStatus | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Check availability
   */
  const recheckAvailability = async () => {
    try {
      setIsChecking(true);
      setError(null);

      const status = await ChromeAIProofreaderService.checkAvailability();
      setAvailability(status);

      console.log('[useProofreaderAvailability] Status:', status);
    } catch (err: unknown) {
      console.error('[useProofreaderAvailability] Check failed:', err);
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to check Proofreader availability'),
      );
      setAvailability('no');
    } finally {
      setIsChecking(false);
    }
  };

  // Check on mount
  useEffect(() => {
    if (checkOnMount) {
      recheckAvailability();
    }
  }, [checkOnMount]);

  // Periodic recheck
  useEffect(() => {
    if (recheckInterval && recheckInterval > 0) {
      const intervalId = setInterval(recheckAvailability, recheckInterval);
      return () => clearInterval(intervalId);
    }
  }, [recheckInterval]);

  // Derived state
  const isAvailable = availability === 'readily';
  const isReady = isAvailable; // Alias for UnifiedModelManager compatibility
  const requiresDownload = availability === 'after-download';
  const isDownloading = requiresDownload; // Alias for backward compatibility

  return {
    availability,
    isAvailable,
    isReady,
    requiresDownload,
    isChecking,
    isDownloading,
    error,
    recheckAvailability,
  };
}

// ============================================================================
// Export
// ============================================================================

export default useProofreaderAvailability;
