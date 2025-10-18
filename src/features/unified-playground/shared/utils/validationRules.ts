/**
 * Common Validation Rules
 *
 * Reusable validation rules for form fields across the application.
 * Provides consistent validation logic with helpful error messages.
 *
 * @module shared/utils/validationRules
 */

import type { ValidationRule } from '../hooks/useFieldValidation';

// ============================================================================
// Numeric Validation Rules
// ============================================================================

/**
 * Validate temperature parameter (0-1 range)
 */
export function temperatureRules(_value: number): ValidationRule<number>[] {
  return [
    {
      validate: (val) => val >= 0 && val <= 1,
      message: 'Temperature must be between 0 and 1',
      type: 'error',
      priority: 10,
    },
    {
      validate: (val) => val <= 0.9,
      message:
        'High temperature may produce creative but less coherent results',
      type: 'warning',
      priority: 5,
    },
    {
      validate: (val) => val >= 0.1,
      message: 'Very low temperature may produce repetitive results',
      type: 'warning',
      priority: 5,
    },
  ];
}

/**
 * Validate topK parameter (1-8 range for language detection)
 */
export function topKRules(_value: number): ValidationRule<number>[] {
  return [
    {
      validate: (val) => Number.isInteger(val),
      message: 'topK must be an integer',
      type: 'error',
      priority: 10,
    },
    {
      validate: (val) => val >= 1 && val <= 8,
      message: 'topK must be between 1 and 8',
      type: 'error',
      priority: 9,
    },
    {
      validate: (val) => val <= 5,
      message: 'Higher topK values may include less confident results',
      type: 'info',
      priority: 3,
    },
  ];
}

/**
 * Validate confidence threshold (0-1 range)
 */
export function confidenceThresholdRules(
  _value: number,
): ValidationRule<number>[] {
  return [
    {
      validate: (val) => val >= 0 && val <= 1,
      message: 'Threshold must be between 0 and 1',
      type: 'error',
      priority: 10,
    },
    {
      validate: (val) => val <= 0.9,
      message: 'Very high threshold may filter out most detection results',
      type: 'warning',
      priority: 5,
    },
    {
      validate: (val) => val >= 0.1,
      message: 'Very low threshold may include unreliable detections',
      type: 'warning',
      priority: 5,
    },
  ];
}

// ============================================================================
// Text Validation Rules
// ============================================================================

/**
 * Validate text length with character limit
 */
export function textLengthRules(maxLength: number): ValidationRule<string>[] {
  return [
    {
      validate: (text) => text.length <= maxLength,
      message: `Text exceeds maximum length of ${maxLength} characters`,
      type: 'error',
      priority: 10,
    },
    {
      validate: (text) => text.length <= maxLength * 0.9,
      message: `Approaching character limit (${maxLength} max)`,
      type: 'warning',
      priority: 5,
    },
  ];
}

/**
 * Validate minimum text length
 */
export function minTextLengthRules(
  minLength: number,
): ValidationRule<string>[] {
  return [
    {
      validate: (text) => text.trim().length >= minLength,
      message: `Please enter at least ${minLength} characters`,
      type: 'error',
      priority: 10,
    },
  ];
}

/**
 * Validate required field
 */
export function requiredFieldRules(): ValidationRule<string>[] {
  return [
    {
      validate: (text) => text.trim().length > 0,
      message: 'This field is required',
      type: 'error',
      priority: 10,
    },
  ];
}

/**
 * Validate word count
 */
export function wordCountRules(
  minWords?: number,
  maxWords?: number,
): ValidationRule<string>[] {
  const rules: ValidationRule<string>[] = [];

  if (minWords) {
    rules.push({
      validate: (text) => {
        const words = text
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 0);
        return words.length >= minWords;
      },
      message: `Please enter at least ${minWords} words`,
      type: 'error',
      priority: 10,
    });
  }

  if (maxWords) {
    rules.push({
      validate: (text) => {
        const words = text
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 0);
        return words.length <= maxWords;
      },
      message: `Text exceeds maximum of ${maxWords} words`,
      type: 'error',
      priority: 9,
    });

    rules.push({
      validate: (text) => {
        const words = text
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 0);
        return words.length <= maxWords * 0.9;
      },
      message: `Approaching word limit (${maxWords} max)`,
      type: 'warning',
      priority: 5,
    });
  }

  return rules;
}

// ============================================================================
// Token/Context Validation Rules
// ============================================================================

/**
 * Validate token count for AI models
 */
export function tokenCountRules(maxTokens: number): ValidationRule<string>[] {
  // Rough approximation: 1 token ≈ 4 characters
  const approxMaxChars = maxTokens * 4;

  return [
    {
      validate: (text) => text.length <= approxMaxChars,
      message: `Text may exceed token limit (~${maxTokens} tokens max)`,
      type: 'warning',
      priority: 6,
    },
    {
      validate: (text) => text.length <= approxMaxChars * 0.8,
      message: `Approaching token limit (~${maxTokens} tokens max)`,
      type: 'info',
      priority: 3,
    },
  ];
}

// ============================================================================
// Custom Rule Builders
// ============================================================================

/**
 * Create a custom range validation rule
 */
export function rangeRule(
  min: number,
  max: number,
  fieldName: string = 'Value',
): ValidationRule<number> {
  return {
    validate: (val) => val >= min && val <= max,
    message: `${fieldName} must be between ${min} and ${max}`,
    type: 'error',
    priority: 10,
  };
}

/**
 * Create a custom pattern validation rule
 */
export function patternRule(
  pattern: RegExp,
  message: string,
): ValidationRule<string> {
  return {
    validate: (text) => pattern.test(text),
    message,
    type: 'error',
    priority: 10,
  };
}

// ============================================================================
// Export
// ============================================================================

export const validationRules = {
  temperature: temperatureRules,
  topK: topKRules,
  confidenceThreshold: confidenceThresholdRules,
  textLength: textLengthRules,
  minTextLength: minTextLengthRules,
  requiredField: requiredFieldRules,
  wordCount: wordCountRules,
  tokenCount: tokenCountRules,
  range: rangeRule,
  pattern: patternRule,
};

export default validationRules;
