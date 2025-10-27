/**
 * Link Sanitizer Utility
 *
 * Utilities for handling links in markdown content, specifically
 * preventing chrome:// internal links from being clickable.
 *
 * @module linkSanitizer
 */

/**
 * Check if a URL is a Chrome internal link (chrome://)
 *
 * Chrome internal links (chrome://flags, chrome://components, etc.) only work
 * within Chrome's internal pages, not in web applications. These should be
 * displayed as non-clickable text to avoid confusion.
 *
 * @param href - The URL to check
 * @returns True if the URL is a chrome:// link
 *
 * @example
 * ```ts
 * isChromeInternalLink('chrome://flags') // true
 * isChromeInternalLink('https://example.com') // false
 * ```
 */
export const isChromeInternalLink = (href: string | undefined): boolean => {
  if (!href) return false;
  return href.startsWith('chrome://');
};
