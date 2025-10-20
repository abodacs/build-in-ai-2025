/**
 * BCP 47 Language Code Utilities
 *
 * Utilities for validating and working with BCP 47 language codes
 * @module utils/bcp47
 */

import { type LanguageCode, SUPPORTED_LANGUAGES } from '../types';

/**
 * Validate if a language code is supported
 */
export function isValidLanguageCode(code: string): code is LanguageCode {
  return code in SUPPORTED_LANGUAGES;
}

/**
 * Get language info by code
 */
export function getLanguageInfo(code: LanguageCode) {
  return SUPPORTED_LANGUAGES[code];
}

/**
 * Get all supported language codes
 */
export function getSupportedLanguageCodes(): LanguageCode[] {
  return Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[];
}

/**
 * Format language code for display
 */
export function formatLanguageCode(code: LanguageCode): string {
  const info = SUPPORTED_LANGUAGES[code];
  return `${info.flag} ${info.name} (${info.code})`;
}

/**
 * Get language pair key
 */
export function getLanguagePairKey(
  source: LanguageCode,
  target: LanguageCode,
): string {
  return `${source}→${target}`;
}

/**
 * Parse language pair key
 */
export function parseLanguagePairKey(
  key: string,
): { source: LanguageCode; target: LanguageCode } | null {
  const parts = key.split('→');
  if (parts.length !== 2) return null;

  const source = parts[0];
  const target = parts[1];
  if (
    !source ||
    !target ||
    !isValidLanguageCode(source) ||
    !isValidLanguageCode(target)
  ) {
    return null;
  }

  return { source, target };
}

/**
 * Check if language is RTL (Right-to-Left)
 */
export function isRTLLanguage(code: LanguageCode): boolean {
  return code === 'ar'; // Arabic is RTL
}

/**
 * Get text direction for language
 */
export function getTextDirection(code: LanguageCode): 'ltr' | 'rtl' {
  return isRTLLanguage(code) ? 'rtl' : 'ltr';
}
