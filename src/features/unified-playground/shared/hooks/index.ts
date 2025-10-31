/**
 * Shared Hooks - Export Module
 *
 * Central export point for all shared hooks
 *
 * @module shared/hooks
 */

// Playground state
export { usePlaygroundState } from './usePlaygroundState';

// Responsive breakpoints
export {
  useBreakpoint,
  useIsMobile,
  useIsTabletOrSmaller,
  useIsDesktop,
  type Breakpoint,
} from './useBreakpoint';

// Validation hooks
export { useFieldValidation } from './useFieldValidation';
export type {
  ValidationRule,
  ValidationState,
  UseFieldValidationOptions,
} from './useFieldValidation';
