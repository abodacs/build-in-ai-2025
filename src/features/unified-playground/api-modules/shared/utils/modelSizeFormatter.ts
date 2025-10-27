/**
 * Model Size Formatter Utility
 *
 * Formats model download sizes in human-readable format.
 * ONLY formats actual data - no fake estimates!
 *
 * @module shared/utils/modelSizeFormatter
 */

// ============================================================================
// Constants
// ============================================================================

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * 1024;
const BYTES_PER_GB = BYTES_PER_MB * 1024;

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format bytes to human-readable size
 *
 * Automatically chooses appropriate unit (B, KB, MB, GB)
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.50 GB", "250.00 MB")
 *
 * @example
 * ```ts
 * formatModelSize(1024) // "1.00 KB"
 * formatModelSize(1536000) // "1.46 MB"
 * formatModelSize(23622320128) // "22.00 GB"
 * ```
 */
export function formatModelSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0) return 'Invalid';

  // GB
  if (bytes >= BYTES_PER_GB) {
    return `${(bytes / BYTES_PER_GB).toFixed(decimals)} GB`;
  }

  // MB
  if (bytes >= BYTES_PER_MB) {
    return `${(bytes / BYTES_PER_MB).toFixed(decimals)} MB`;
  }

  // KB
  if (bytes >= BYTES_PER_KB) {
    return `${(bytes / BYTES_PER_KB).toFixed(decimals)} KB`;
  }

  // Bytes - floor to whole number since fractional bytes don't exist
  return `${Math.floor(bytes)} B`;
}

/**
 * Format download progress percentage
 *
 * @param loaded - Bytes downloaded
 * @param total - Total bytes
 * @returns Percentage with 1 decimal place
 *
 * @example
 * ```ts
 * formatProgress(512, 1024) // "50.0%"
 * formatProgress(0, 1024) // "0.0%"
 * formatProgress(1024, 1024) // "100.0%"
 * ```
 */
export function formatProgress(loaded: number, total: number): string {
  if (total === 0) return '0.0%';
  const percentage = (loaded / total) * 100;
  return `${percentage.toFixed(1)}%`;
}

/**
 * Format download speed
 *
 * @param bytesPerSecond - Download speed in bytes/second
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted speed string (e.g., "2.5 MB/s")
 *
 * @example
 * ```ts
 * formatSpeed(1048576) // "1.0 MB/s"
 * formatSpeed(524288) // "512.0 KB/s"
 * ```
 */
export function formatSpeed(
  bytesPerSecond: number,
  decimals: number = 1,
): string {
  return `${formatModelSize(bytesPerSecond, decimals)}/s`;
}

/**
 * Calculate estimated time remaining
 *
 * @param remaining - Remaining bytes to download
 * @param bytesPerSecond - Current download speed
 * @returns Estimated seconds remaining
 *
 * @example
 * ```ts
 * estimateTimeRemaining(1048576, 524288) // 2 (seconds)
 * estimateTimeRemaining(10485760, 1048576) // 10 (seconds)
 * ```
 */
export function estimateTimeRemaining(
  remaining: number,
  bytesPerSecond: number,
): number {
  if (bytesPerSecond === 0) return 0;
  return Math.ceil(remaining / bytesPerSecond);
}

/**
 * Format time duration in human-readable format
 *
 * @param seconds - Duration in seconds
 * @returns Formatted time string (e.g., "2m 30s", "45s")
 *
 * @example
 * ```ts
 * formatDuration(30) // "30s"
 * formatDuration(90) // "1m 30s"
 * formatDuration(3600) // "1h 0m"
 * ```
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m ${secs}s`;
}

/**
 * Validate download progress data
 *
 * Ensures loaded/total values are valid before formatting
 *
 * @param loaded - Bytes downloaded
 * @param total - Total bytes
 * @returns True if data is valid
 *
 * @example
 * ```ts
 * isValidProgress(512, 1024) // true
 * isValidProgress(-1, 1024) // false
 * isValidProgress(1024, 512) // false (loaded > total)
 * ```
 */
export function isValidProgress(loaded: number, total: number): boolean {
  return (
    typeof loaded === 'number' &&
    typeof total === 'number' &&
    loaded >= 0 &&
    total > 0 &&
    loaded <= total
  );
}

// ============================================================================
// Export
// ============================================================================

export default {
  formatModelSize,
  formatProgress,
  formatSpeed,
  estimateTimeRemaining,
  formatDuration,
  isValidProgress,
};
