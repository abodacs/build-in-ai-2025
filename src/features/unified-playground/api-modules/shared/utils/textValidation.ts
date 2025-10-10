/**
 * Text Validation Utilities
 *
 * Provides validation functions for text input to Writer and Rewriter APIs.
 * Includes length checking, content validation, and safety checks.
 *
 * @module textValidation
 */

import type { ValidationResult, TextConstraints } from '../types/writing.types';

// ============================================================================
// Constants
// ============================================================================

/** Default maximum text length (50,000 characters) */
export const DEFAULT_MAX_LENGTH = 50000;

/** Default minimum text length */
export const DEFAULT_MIN_LENGTH = 1;

/** Maximum word count for reasonable processing */
export const DEFAULT_MAX_WORDS = 10000;

/** Patterns for potentially problematic content */
const SUSPICIOUS_PATTERNS = [
  // Extremely long words (might break processing)
  /\b\w{200,}\b/,
  // Excessive repetition
  /(.)\1{50,}/,
  // Too many special characters
  /[^a-zA-Z0-9\s.,!?;:'"()-]{100,}/,
];

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate text against constraints
 *
 * Checks text against provided constraints and returns
 * validation result with errors and warnings.
 *
 * @param text - Text to validate
 * @param constraints - Validation constraints
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateText(userInput, {
 *   minLength: 10,
 *   maxLength: 5000,
 *   maxWords: 1000
 * });
 *
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateText(
  text: string,
  constraints: TextConstraints = {},
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Apply default constraints
  const {
    minLength = DEFAULT_MIN_LENGTH,
    maxLength = DEFAULT_MAX_LENGTH,
    minWords,
    maxWords = DEFAULT_MAX_WORDS,
    disallowedPatterns = [],
    requiredPatterns = [],
  } = constraints;

  // Check if text is empty
  if (!text || text.trim().length === 0) {
    errors.push('Text cannot be empty');
    return { valid: false, errors, warnings };
  }

  const trimmedText = text.trim();
  const length = trimmedText.length;
  const wordCount = countWords(trimmedText);

  // Length validation
  if (length < minLength) {
    errors.push(
      `Text is too short. Minimum length is ${minLength} characters (current: ${length})`,
    );
  }

  if (length > maxLength) {
    errors.push(
      `Text is too long. Maximum length is ${maxLength} characters (current: ${length})`,
    );
  }

  // Word count validation
  if (minWords && wordCount < minWords) {
    errors.push(
      `Text has too few words. Minimum is ${minWords} words (current: ${wordCount})`,
    );
  }

  if (maxWords && wordCount > maxWords) {
    errors.push(
      `Text has too many words. Maximum is ${maxWords} words (current: ${wordCount})`,
    );
  }

  // Pattern validation - disallowed
  for (const pattern of disallowedPatterns) {
    if (pattern.test(trimmedText)) {
      errors.push(`Text contains disallowed pattern: ${pattern.source}`);
    }
  }

  // Pattern validation - required
  for (const pattern of requiredPatterns) {
    if (!pattern.test(trimmedText)) {
      errors.push(`Text must match required pattern: ${pattern.source}`);
    }
  }

  // Suspicious content warnings
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(trimmedText)) {
      warnings.push('Text contains unusual patterns that might affect quality');
      break; // Only warn once
    }
  }

  // Warn about very long text
  if (length > maxLength * 0.8) {
    warnings.push(
      `Text is approaching length limit (${((length / maxLength) * 100).toFixed(0)}%)`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate prompt for Writer API
 *
 * Specialized validation for writing prompts.
 *
 * @param prompt - Writing prompt
 * @returns Validation result
 */
export function validateWriterPrompt(prompt: string): ValidationResult {
  return validateText(prompt, {
    minLength: 3,
    maxLength: 5000,
    maxWords: 1000,
  });
}

/**
 * Validate text for Rewriter API
 *
 * Specialized validation for rewriting input.
 *
 * @param text - Text to rewrite
 * @returns Validation result
 */
export function validateRewriterInput(text: string): ValidationResult {
  return validateText(text, {
    minLength: 10, // Rewriting needs some minimum content
    maxLength: DEFAULT_MAX_LENGTH,
    maxWords: DEFAULT_MAX_WORDS,
  });
}

/**
 * Validate shared context
 *
 * @param context - Context string
 * @returns Validation result
 */
export function validateContext(context: string): ValidationResult {
  return validateText(context, {
    minLength: 0, // Context is optional
    maxLength: 2000,
    maxWords: 400,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Count words in text
 *
 * @param text - Text to count
 * @returns Word count
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Count characters (excluding whitespace)
 *
 * @param text - Text to count
 * @returns Character count
 */
export function countCharacters(text: string): number {
  return text.length;
}

/**
 * Count sentences in text
 *
 * @param text - Text to count
 * @returns Sentence count
 */
export function countSentences(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  // Split on sentence endings, filter empty
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  return sentences.length;
}

/**
 * Check if text is likely empty or meaningless
 *
 * @param text - Text to check
 * @returns true if text appears empty/meaningless
 */
export function isEmptyOrMeaningless(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return true;
  }

  const trimmed = text.trim();

  // Too short to be meaningful
  if (trimmed.length < 3) {
    return true;
  }

  // Only whitespace or special characters
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return true;
  }

  // Only repeated characters
  if (/^(.)\1+$/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Sanitize text for safe processing
 *
 * Removes potentially problematic characters while preserving
 * meaningful content.
 *
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  return (
    text
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove control characters (except newline, tab, carriage return)
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize whitespace (but preserve newlines)
      .replace(/[^\S\n]+/g, ' ')
      // Remove excessive newlines (max 2 consecutive)
      .replace(/\n{3,}/g, '\n\n')
      // Trim
      .trim()
  );
}

/**
 * Truncate text to maximum length
 *
 * Truncates at word boundary when possible.
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Whether to add ellipsis
 * @returns Truncated text
 */
export function truncateText(
  text: string,
  maxLength: number,
  ellipsis = true,
): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find last word boundary before max length
  let truncated = text.substring(0, maxLength);

  // Try to truncate at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.8) {
    // Only use word boundary if it's not too far back
    truncated = truncated.substring(0, lastSpace);
  }

  return ellipsis ? truncated + '...' : truncated;
}

/**
 * Calculate text complexity score
 *
 * Returns a score from 0-100 indicating text complexity.
 * Higher scores = more complex text.
 *
 * @param text - Text to analyze
 * @returns Complexity score (0-100)
 */
export function calculateComplexity(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  const words = countWords(text);
  const sentences = countSentences(text);
  const characters = text.length;

  if (sentences === 0) {
    return 0;
  }

  // Average word length
  const avgWordLength = characters / words;

  // Average sentence length
  const avgSentenceLength = words / sentences;

  // Complexity factors (weighted)
  const wordLengthScore = Math.min((avgWordLength / 10) * 100, 100) * 0.4;
  const sentenceLengthScore =
    Math.min((avgSentenceLength / 30) * 100, 100) * 0.4;

  // Count long words (> 10 characters)
  const longWords = text.match(/\b\w{10,}\b/g)?.length || 0;
  const longWordScore = Math.min((longWords / words) * 100, 100) * 0.2;

  return Math.round(wordLengthScore + sentenceLengthScore + longWordScore);
}

// ============================================================================
// Export
// ============================================================================

export default {
  validateText,
  validateWriterPrompt,
  validateRewriterInput,
  validateContext,
  countWords,
  countCharacters,
  countSentences,
  isEmptyOrMeaningless,
  sanitizeText,
  truncateText,
  calculateComplexity,
};
