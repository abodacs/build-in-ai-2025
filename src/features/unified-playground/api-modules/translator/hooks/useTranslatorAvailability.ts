/**
 * useTranslatorAvailability Hook
 * Check translator availability for language pairs with session caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type LanguageCode,
  type UseTranslatorAvailabilityReturn,
  type AvailabilityStatus,
} from '../types';

// ============================================================================
// Session Cache for Availability Results
// ============================================================================

interface CachedAvailability {
  status: AvailabilityStatus;
  timestamp: number;
}

const CACHE_KEY_PREFIX = 'translator_availability_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached availability from sessionStorage
 */
function getCachedAvailability(
  sourceLanguage: string,
  targetLanguage: string,
): AvailabilityStatus | null {
  const cacheKey = `${CACHE_KEY_PREFIX}${sourceLanguage}_${targetLanguage}`;
  const cached = sessionStorage.getItem(cacheKey);

  if (!cached) return null;

  try {
    const { status, timestamp }: CachedAvailability = JSON.parse(cached);
    const age = Date.now() - timestamp;

    // Check if cache is still valid
    if (age < CACHE_DURATION) {
      return status;
    } else {
      // Cache expired, remove it
      sessionStorage.removeItem(cacheKey);
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Store availability in sessionStorage
 */
function setCachedAvailability(
  sourceLanguage: string,
  targetLanguage: string,
  status: AvailabilityStatus,
): void {
  const cacheKey = `${CACHE_KEY_PREFIX}${sourceLanguage}_${targetLanguage}`;
  const cached: CachedAvailability = {
    status,
    timestamp: Date.now(),
  };
  sessionStorage.setItem(cacheKey, JSON.stringify(cached));
}

/**
 * useTranslatorAvailability hook
 *
 * Checks if a language pair is available for translation
 *
 * @param sourceLanguage - Source language code
 * @param targetLanguage - Target language code
 * @returns Availability state and recheck function
 *
 * @example
 * ```tsx
 * const { availability, isChecking, error } = useTranslatorAvailability('en', 'es');
 *
 * if (availability === 'readily') {
 *   // Ready to translate
 * } else if (availability === 'after-download') {
 *   // Model needs to be downloaded first
 * }
 * ```
 */
export function useTranslatorAvailability(
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode,
): UseTranslatorAvailabilityReturn {
  const [availability, setAvailability] = useState<AvailabilityStatus | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [downloadProgress] = useState<number | null>(null);
  // TODO: Implement download progress tracking when model downloads happen
  // const setDownloadProgress = ... (requires monitor callback integration)
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Check availability with timeout, retry logic, and caching
   */
  const checkAvailability = useCallback(
    async (isRetry = false, skipCache = false) => {
      // Try to get from cache first (unless explicitly skipping cache)
      if (!skipCache) {
        const cachedStatus = getCachedAvailability(
          sourceLanguage,
          targetLanguage,
        );
        if (cachedStatus) {
          setAvailability(cachedStatus);
          setIsChecking(false);
          return;
        }
      }

      setIsChecking(true);
      setError(null);

      // Create abort controller for timeout
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, 5000); // 5 second timeout

      try {
        // Check if Translator API exists
        if (!('Translator' in window)) {
          const status: AvailabilityStatus = 'no';
          setAvailability(status);
          setCachedAvailability(sourceLanguage, targetLanguage, status);
          setIsChecking(false);
          clearTimeout(timeoutId);
          return;
        }

        // Check language pair availability
        const status = await window.Translator.availability({
          sourceLanguage,
          targetLanguage,
        });

        setAvailability(status);
        setCachedAvailability(sourceLanguage, targetLanguage, status); // Cache the result
        setIsChecking(false);
        setRetryCount(0); // Reset retry count on success
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);

        // Check if it was a timeout
        const isTimeout = err instanceof Error && err.name === 'AbortError';
        const errorMessage = isTimeout
          ? 'Availability check timed out'
          : 'Failed to check availability';

        const error = err instanceof Error ? err : new Error(errorMessage);
        setError(error);
        const status: AvailabilityStatus = 'no';
        setAvailability(status);
        setCachedAvailability(sourceLanguage, targetLanguage, status);
        setIsChecking(false);

        // Auto-retry logic (max 2 retries)
        if (!isRetry && retryCount < 2) {
          setRetryCount((prev) => prev + 1);
          // Retry after 2 seconds with exponential backoff
          setTimeout(
            () => {
              checkAvailability(true, true); // Skip cache on retry
            },
            2000 * (retryCount + 1),
          );
        }
      }
    },
    [sourceLanguage, targetLanguage, retryCount],
  );

  /**
   * Recheck availability (skips cache for fresh check)
   */
  const recheck = useCallback(() => {
    checkAvailability(false, true); // Skip cache on manual recheck
  }, [checkAvailability]);

  /**
   * Check availability on mount and when languages change
   */
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return {
    availability,
    isChecking,
    error,
    recheck,
    downloadProgress,
  };
}
