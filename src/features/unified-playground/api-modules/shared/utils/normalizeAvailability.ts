/**
 * Availability Status Normalization Utilities
 *
 * Normalizes Chrome AI API availability status values to internal AvailabilityStatus type.
 *
 * Chrome AI APIs return official status values:
 * - 'unavailable': API not available
 * - 'downloadable': Model needs to be downloaded
 * - 'downloading': Model is currently downloading
 * - 'available': API ready to use
 *
 * Some Chrome versions may also return 'readily' (deprecated/non-standard).
 *
 * Internal AvailabilityStatus uses:
 * - 'no': API not available
 * - 'after-download': Requires model download
 * - 'available': Ready to use
 *
 * @module shared/utils/normalizeAvailability
 */

import type { AvailabilityStatus } from '../types';

/**
 * Chrome AI API availability status values
 * Based on official Chrome AI specification from DefinitelyTyped
 */
export type ChromeAvailability =
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'available';

/**
 * Extended Chrome availability to handle non-standard values
 * Some Chrome versions may return 'readily' (deprecated)
 */
export type ExtendedChromeAvailability =
  | ChromeAvailability
  | 'readily'
  | 'no'
  | 'after-download';

/**
 * Normalize Chrome API availability status to internal AvailabilityStatus
 *
 * Handles both official Chrome API values and legacy/non-standard values
 * for backwards compatibility.
 *
 * Mapping:
 * - 'unavailable' | 'no' → 'no'
 * - 'downloadable' | 'downloading' | 'after-download' → 'after-download'
 * - 'available' | 'readily' → 'available'
 *
 * @param chromeStatus - Status value from Chrome AI API
 * @returns Normalized internal availability status
 *
 * @example
 * ```typescript
 * // Official Chrome API values
 * normalizeAvailability('unavailable') // Returns: 'no'
 * normalizeAvailability('downloadable') // Returns: 'after-download'
 * normalizeAvailability('downloading') // Returns: 'after-download'
 * normalizeAvailability('available') // Returns: 'available'
 *
 * // Backwards compatibility for legacy values
 * normalizeAvailability('readily') // Returns: 'available'
 * normalizeAvailability('no') // Returns: 'no'
 * normalizeAvailability('after-download') // Returns: 'after-download'
 * ```
 */
export function normalizeAvailability(
  chromeStatus: ExtendedChromeAvailability | string,
): AvailabilityStatus {
  // Handle official Chrome API values
  switch (chromeStatus) {
    case 'unavailable':
    case 'no':
      return 'no';

    case 'downloadable':
    case 'downloading':
    case 'after-download':
      return 'after-download';

    case 'available':
    case 'readily': // Legacy value for backwards compatibility
      return 'available';

    default:
      // Fallback for unknown values
      console.warn(
        `[normalizeAvailability] Unknown availability status: "${chromeStatus}". Defaulting to "no".`,
      );
      return 'no';
  }
}

/**
 * Check if availability status indicates API is ready to use
 *
 * @param status - Availability status (Chrome or internal format)
 * @returns True if API is immediately available
 */
export function isAvailable(
  status: ExtendedChromeAvailability | AvailabilityStatus | string,
): boolean {
  return status === 'available' || (status as any) === 'readily';
}

/**
 * Check if availability status indicates download is required
 *
 * @param status - Availability status (Chrome or internal format)
 * @returns True if model download is needed
 */
export function requiresDownload(
  status: ExtendedChromeAvailability | AvailabilityStatus | string,
): boolean {
  return (
    status === 'downloadable' ||
    status === 'downloading' ||
    status === 'after-download'
  );
}

/**
 * Check if availability status indicates API is not available
 *
 * @param status - Availability status (Chrome or internal format)
 * @returns True if API is unavailable
 */
export function isUnavailable(
  status: ExtendedChromeAvailability | AvailabilityStatus | string,
): boolean {
  return status === 'unavailable' || status === 'no';
}
