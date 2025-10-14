/**
 * Validation Utilities
 *
 * Reusable validation functions that return user-friendly error messages
 *
 * @module shared/utils/validation
 */

import {
  type ErrorMessage,
  getErrorMessageWithContext,
  createErrorMessage,
} from './errorMessages';

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;

  /** Error message if validation failed */
  error?: ErrorMessage;
}

export interface TextValidationOptions {
  /** Minimum length (characters) */
  minLength?: number;

  /** Maximum length (characters) */
  maxLength?: number;

  /** Require non-empty input */
  required?: boolean;

  /** Custom validator function */
  customValidator?: (value: string) => boolean;

  /** Custom error message for custom validator */
  customErrorMessage?: string;
}

export interface LanguageValidationOptions {
  /** List of supported language codes */
  supportedLanguages: string[];

  /** Whether to allow empty/null */
  optional?: boolean;
}

// ============================================================================
// Text Validation
// ============================================================================

/**
 * Validate text input with length requirements
 *
 * @param value - Text to validate
 * @param options - Validation options
 * @returns Validation result
 *
 * @example
 * ```ts
 * const result = validateTextInput('Hello world', {
 *   minLength: 10,
 *   maxLength: 100,
 *   required: true
 * });
 * if (!result.valid) {
 *   console.error(result.error?.message);
 * }
 * ```
 */
export function validateTextInput(
  value: string,
  options: TextValidationOptions = {},
): ValidationResult {
  const {
    minLength,
    maxLength,
    required = false,
    customValidator,
    customErrorMessage,
  } = options;

  // Check if empty
  if (required && !value.trim()) {
    return {
      valid: false,
      error: getErrorMessageWithContext('INPUT_EMPTY'),
    };
  }

  // Skip further validation if empty and not required
  if (!value.trim() && !required) {
    return { valid: true };
  }

  const length = value.length;

  // Check minimum length
  if (minLength !== undefined && length < minLength) {
    return {
      valid: false,
      error: getErrorMessageWithContext('INPUT_TOO_SHORT', {
        currentLength: length,
        minLength,
      }),
    };
  }

  // Check maximum length
  if (maxLength !== undefined && length > maxLength) {
    return {
      valid: false,
      error: getErrorMessageWithContext('INPUT_TOO_LONG', {
        currentLength: length,
        maxLength,
      }),
    };
  }

  // Custom validation
  if (customValidator && !customValidator(value)) {
    return {
      valid: false,
      error: createErrorMessage(
        customErrorMessage || 'Validation failed',
        'Please check your input and try again.',
        'warning',
      ),
    };
  }

  return { valid: true };
}

/**
 * Validate required field
 *
 * @param value - Value to check
 * @param fieldName - Name of the field for error message
 * @returns Validation result
 */
export function validateRequired(
  value: string | undefined | null,
  fieldName: string = 'This field',
): ValidationResult {
  if (!value || !value.trim()) {
    return {
      valid: false,
      error: createErrorMessage(
        `${fieldName} is required`,
        'Please fill in this field to continue.',
        'warning',
      ),
    };
  }

  return { valid: true };
}

/**
 * Validate character limit with warning threshold
 *
 * Returns warning at 90% of limit, error at 100%
 *
 * @param value - Text to validate
 * @param maxLength - Maximum character limit
 * @param warningThreshold - Percentage at which to show warning (default: 0.9)
 * @returns Validation result
 */
export function validateCharacterLimit(
  value: string,
  maxLength: number,
  warningThreshold: number = 0.9,
): ValidationResult {
  const length = value.length;
  const warningPoint = Math.floor(maxLength * warningThreshold);

  // At or over limit
  if (length >= maxLength) {
    return {
      valid: false,
      error: getErrorMessageWithContext('INPUT_TOO_LONG', {
        currentLength: length,
        maxLength,
      }),
    };
  }

  // Approaching limit (warning)
  if (length >= warningPoint) {
    const remaining = maxLength - length;
    return {
      valid: true,
      error: createErrorMessage(
        `Approaching character limit`,
        `You have ${remaining} character${remaining === 1 ? '' : 's'} remaining.`,
        'warning',
      ),
    };
  }

  return { valid: true };
}

// ============================================================================
// Language Validation
// ============================================================================

/**
 * Validate language code
 *
 * @param languageCode - Language code to validate (e.g., 'en', 'es', 'fr')
 * @param options - Validation options
 * @returns Validation result
 */
export function validateLanguage(
  languageCode: string | undefined | null,
  options: LanguageValidationOptions,
): ValidationResult {
  const { supportedLanguages, optional = false } = options;

  // Check if empty
  if (!languageCode) {
    if (optional) {
      return { valid: true };
    }
    return {
      valid: false,
      error: createErrorMessage(
        'Please select a language',
        'Choose a language from the available options.',
        'warning',
      ),
    };
  }

  // Check if supported
  if (!supportedLanguages.includes(languageCode)) {
    return {
      valid: false,
      error: getErrorMessageWithContext('INVALID_LANGUAGE'),
    };
  }

  return { valid: true };
}

// ============================================================================
// Format Validation
// ============================================================================

/**
 * Validate URL format
 *
 * @param value - String to validate as URL
 * @returns Validation result
 */
export function validateURL(value: string): ValidationResult {
  if (!value.trim()) {
    return { valid: false, error: getErrorMessageWithContext('INPUT_EMPTY') };
  }

  try {
    new URL(value);
    return { valid: true };
  } catch {
    return {
      valid: false,
      error: createErrorMessage(
        'Invalid URL format',
        'Enter a valid URL starting with http:// or https://.',
        'warning',
      ),
    };
  }
}

/**
 * Validate email format
 *
 * @param value - String to validate as email
 * @returns Validation result
 */
export function validateEmail(value: string): ValidationResult {
  if (!value.trim()) {
    return { valid: false, error: getErrorMessageWithContext('INPUT_EMPTY') };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return {
      valid: false,
      error: createErrorMessage(
        'Invalid email format',
        'Enter a valid email address (e.g., name@example.com).',
        'warning',
      ),
    };
  }

  return { valid: true };
}

// ============================================================================
// Numeric Validation
// ============================================================================

/**
 * Validate numeric input within range
 *
 * @param value - Number to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param fieldName - Name of the field for error messages
 * @returns Validation result
 */
export function validateNumberRange(
  value: number,
  min?: number,
  max?: number,
  fieldName: string = 'Value',
): ValidationResult {
  if (min !== undefined && value < min) {
    return {
      valid: false,
      error: createErrorMessage(
        `${fieldName} is too low`,
        `Enter a number greater than or equal to ${min}.`,
        'warning',
      ),
    };
  }

  if (max !== undefined && value > max) {
    return {
      valid: false,
      error: createErrorMessage(
        `${fieldName} is too high`,
        `Enter a number less than or equal to ${max}.`,
        'warning',
      ),
    };
  }

  return { valid: true };
}

// ============================================================================
// Batch Validation
// ============================================================================

/**
 * Validate multiple fields and return first error
 *
 * @param validations - Array of validation results
 * @returns Combined validation result (fails on first error)
 *
 * @example
 * ```ts
 * const result = validateMultiple([
 *   validateRequired(name, 'Name'),
 *   validateEmail(email),
 *   validateTextInput(message, { minLength: 10 })
 * ]);
 * ```
 */
export function validateMultiple(
  validations: ValidationResult[],
): ValidationResult {
  for (const validation of validations) {
    if (!validation.valid) {
      return validation;
    }
  }

  return { valid: true };
}

/**
 * Validate multiple fields and return all errors
 *
 * @param validations - Array of validation results
 * @returns Array of all errors found
 */
export function validateAll(validations: ValidationResult[]): ErrorMessage[] {
  return validations.filter((v) => !v.valid && v.error).map((v) => v.error!);
}

// ============================================================================
// Export
// ============================================================================

export default {
  validateTextInput,
  validateRequired,
  validateCharacterLimit,
  validateLanguage,
  validateURL,
  validateEmail,
  validateNumberRange,
  validateMultiple,
  validateAll,
};
