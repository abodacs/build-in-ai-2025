/**
 * Text Formatting Utilities
 *
 * Provides formatting and display utilities for Writer and Rewriter APIs.
 * Includes text formatting, number formatting, time formatting, and more.
 *
 * @module formatters
 */

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format number with thousand separators
 *
 * @param num - Number to format
 * @returns Formatted string
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format bytes to human-readable size
 *
 * @param bytes - Number of bytes
 * @param decimals - Decimal places
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

  return `${size} ${sizes[i]}`;
}

/**
 * Format percentage
 *
 * @param value - Value (0-100)
 * @param decimals - Decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

// ============================================================================
// Time Formatting
// ============================================================================

/**
 * Format milliseconds to human-readable duration
 *
 * @param ms - Milliseconds
 * @returns Formatted string (e.g., "1.5s", "250ms")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  return `${minutes}m ${seconds}s`;
}

/**
 * Format seconds to time remaining string
 *
 * @param seconds - Seconds remaining
 * @returns Formatted string (e.g., "5 min", "30 sec")
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 1) {
    return '< 1 sec';
  }

  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes < 60) {
    if (remainingSeconds === 0) {
      return `${minutes} min`;
    }
    return `${minutes} min ${remainingSeconds} sec`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Format timestamp to relative time
 *
 * @param timestamp - Unix timestamp (ms)
 * @returns Relative time string (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

// ============================================================================
// Text Formatting
// ============================================================================

/**
 * Format text statistics
 *
 * @param text - Text to analyze
 * @returns Formatted statistics object
 */
export interface TextStats {
  characters: string;
  words: string;
  sentences: string;
  paragraphs: string;
  readingTime: string;
}

export function formatTextStats(text: string): TextStats {
  const characters = text.length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const sentences = text
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0).length;
  const paragraphs = text.split(/\n\n+/).filter(Boolean).length;

  // Estimate reading time (average 200 words per minute)
  const readingMinutes = Math.ceil(words / 200);

  return {
    characters: formatNumber(characters),
    words: formatNumber(words),
    sentences: formatNumber(sentences),
    paragraphs: formatNumber(paragraphs),
    readingTime: readingMinutes < 1 ? '< 1 min' : `${readingMinutes} min`,
  };
}

/**
 * Format word count with label
 *
 * @param count - Word count
 * @returns Formatted string
 */
export function formatWordCount(count: number): string {
  return `${formatNumber(count)} ${count === 1 ? 'word' : 'words'}`;
}

/**
 * Format character count with label
 *
 * @param count - Character count
 * @returns Formatted string
 */
export function formatCharacterCount(count: number): string {
  return `${formatNumber(count)} ${count === 1 ? 'character' : 'characters'}`;
}

/**
 * Capitalize first letter of string
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert kebab-case or snake_case to Title Case
 *
 * @param str - String to convert
 * @returns Title cased string
 */
export function toTitleCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => capitalize(word.toLowerCase()))
    .join(' ');
}

/**
 * Truncate text with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function ellipsis(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// Performance Formatting
// ============================================================================

/**
 * Format tokens per second
 *
 * @param tokensPerSecond - Tokens per second
 * @returns Formatted string
 */
export function formatTokensPerSecond(tokensPerSecond: number): string {
  if (tokensPerSecond < 1) {
    return '< 1 tok/s';
  }

  return `${Math.round(tokensPerSecond)} tok/s`;
}

/**
 * Format download speed
 *
 * @param bytesPerSecond - Bytes per second
 * @returns Formatted string (e.g., "1.5 MB/s")
 */
export function formatDownloadSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

/**
 * Format latency
 *
 * @param ms - Milliseconds
 * @returns Formatted latency string
 */
export function formatLatency(ms: number): string {
  if (ms < 100) {
    return `${Math.round(ms)}ms (excellent)`;
  }

  if (ms < 500) {
    return `${Math.round(ms)}ms (good)`;
  }

  if (ms < 1000) {
    return `${Math.round(ms)}ms (acceptable)`;
  }

  return `${(ms / 1000).toFixed(1)}s (slow)`;
}

// ============================================================================
// Configuration Formatting
// ============================================================================

/**
 * Format API configuration for display
 *
 * @param config - Configuration object
 * @returns Human-readable string
 */
export function formatConfig(config: Record<string, any>): string {
  return Object.entries(config)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const formattedKey = toTitleCase(key);
      const formattedValue =
        typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
      return `${formattedKey}: ${formattedValue}`;
    })
    .join(', ');
}

// ============================================================================
// Status/Quality Formatting
// ============================================================================

/**
 * Format availability status
 *
 * @param status - Availability status
 * @returns Human-readable status
 */
export function formatAvailabilityStatus(
  status: 'no' | 'after-download' | 'readily',
): string {
  const statusMap = {
    no: 'Not Available',
    'after-download': 'Available After Download',
    readily: 'Ready to Use',
  };

  return statusMap[status] || status;
}

/**
 * Format quality level
 *
 * @param quality - Quality level
 * @returns Formatted quality with emoji
 */
export function formatQuality(quality: 'high' | 'medium' | 'low'): string {
  const qualityMap = {
    high: '🟢 High Quality',
    medium: '🟡 Medium Quality',
    low: '🔴 Low Quality',
  };

  return qualityMap[quality] || quality;
}

// ============================================================================
// List Formatting
// ============================================================================

/**
 * Format array to comma-separated list with "and"
 *
 * @param items - Array of items
 * @returns Formatted list
 *
 * @example
 * formatList(['a', 'b', 'c']) // "a, b, and c"
 */
export function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;

  const last = items[items.length - 1];
  const rest = items.slice(0, -1);

  return `${rest.join(', ')}, and ${last}`;
}

/**
 * Format array to bulleted list
 *
 * @param items - Array of items
 * @returns Bulleted list string
 */
export function formatBulletList(items: string[]): string {
  return items.map((item) => `• ${item}`).join('\n');
}

// ============================================================================
// Export Default
// ============================================================================

export default {
  formatNumber,
  formatBytes,
  formatPercentage,
  formatDuration,
  formatTimeRemaining,
  formatRelativeTime,
  formatTextStats,
  formatWordCount,
  formatCharacterCount,
  capitalize,
  toTitleCase,
  ellipsis,
  formatTokensPerSecond,
  formatDownloadSpeed,
  formatLatency,
  formatConfig,
  formatAvailabilityStatus,
  formatQuality,
  formatList,
  formatBulletList,
};
