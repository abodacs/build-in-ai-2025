/**
 * useFieldValidation Hook
 *
 * Real-time field validation with debouncing and animation support.
 * Provides immediate feedback for user input with configurable validation rules.
 *
 * Features:
 * - Debounced validation (default 300ms)
 * - Multiple validation rules support
 * - Priority-based error/warning display
 * - Type-safe validation state
 * - Animation trigger support
 *
 * @module shared/hooks/useFieldValidation
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Validation rule interface
 */
export interface ValidationRule<T = any> {
  /** Validation function */
  validate: (value: T) => boolean;

  /** Error/warning message */
  message: string;

  /** Severity type */
  type: 'error' | 'warning' | 'info';

  /** Priority (higher = shown first) */
  priority?: number;
}

/**
 * Validation state
 */
export interface ValidationState {
  /** Is the field valid? */
  isValid: boolean;

  /** Validation message (if invalid) */
  message?: string;

  /** Message type */
  type?: 'error' | 'warning' | 'info' | 'success';

  /** Is validation in progress? */
  isValidating?: boolean;
}

/**
 * Hook options
 */
export interface UseFieldValidationOptions {
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;

  /** Skip validation on initial mount */
  skipInitialValidation?: boolean;

  /** Success message when valid */
  successMessage?: string;

  /** Show success state */
  showSuccess?: boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Field validation hook with debouncing
 *
 * IMPORTANT: For optimal performance, wrap the `rules` array in useMemo
 * at the call site to prevent unnecessary re-validation:
 *
 * @example
 * ```tsx
 * // ✅ GOOD: Memoize rules array in parent component
 * const temperatureRules = useMemo(() => [
 *   {
 *     validate: (val) => val >= 0 && val <= 1,
 *     message: 'Temperature must be between 0 and 1',
 *     type: 'error',
 *     priority: 10,
 *   },
 *   {
 *     validate: (val) => val <= 0.9,
 *     message: 'High temperature may produce unpredictable results',
 *     type: 'warning',
 *     priority: 5,
 *   },
 * ], []); // Empty deps if rules are static
 *
 * const temperatureValidation = useFieldValidation(temperature, temperatureRules);
 *
 * return (
 *   <>
 *     <Slider value={temperature} onChange={setTemperature} />
 *     {!temperatureValidation.isValid && (
 *       <ValidationMessage type={temperatureValidation.type!}>
 *         {temperatureValidation.message}
 *       </ValidationMessage>
 *     )}
 *   </>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // ❌ BAD: Creating new rules array on every render
 * const temperatureValidation = useFieldValidation(temperature, [
 *   { validate: (val) => val >= 0, message: 'Invalid', type: 'error' },
 * ]); // This will cause validation on EVERY render!
 * ```
 */
export function useFieldValidation<T = any>(
  value: T,
  rules: ValidationRule<T>[],
  options: UseFieldValidationOptions = {},
): ValidationState {
  const {
    debounceMs = 300,
    skipInitialValidation = false,
    successMessage = 'Valid',
    showSuccess = false,
  } = options;

  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: true,
    isValidating: false,
  });

  const [isInitialMount, setIsInitialMount] = useState(true);

  // Validation function
  const validate = useCallback(() => {
    // Skip if initial mount and skipInitialValidation is true
    if (isInitialMount && skipInitialValidation) {
      setIsInitialMount(false);
      return;
    }

    setIsInitialMount(false);
    setValidationState((prev) => ({ ...prev, isValidating: true }));

    // Sort rules by priority (higher first)
    const sortedRules = [...rules].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0),
    );

    // Find first failing rule
    const failedRule = sortedRules.find((rule) => !rule.validate(value));

    if (failedRule) {
      setValidationState({
        isValid: false,
        message: failedRule.message,
        type: failedRule.type,
        isValidating: false,
      });
    } else {
      // All rules passed
      setValidationState({
        isValid: true,
        message: showSuccess ? successMessage : undefined,
        type: showSuccess ? 'success' : undefined,
        isValidating: false,
      });
    }
  }, [
    value,
    rules,
    isInitialMount,
    skipInitialValidation,
    successMessage,
    showSuccess,
  ]);

  // Debounced validation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      validate();
    }, debounceMs);

    // Set validating state immediately
    setValidationState((prev) => ({ ...prev, isValidating: true }));

    return () => clearTimeout(timer);
  }, [value, validate, debounceMs]);

  return validationState;
}

// ============================================================================
// Export
// ============================================================================

export default useFieldValidation;
