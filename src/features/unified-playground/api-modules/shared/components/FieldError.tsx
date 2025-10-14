/**
 * FieldError Component
 *
 * Inline error message component for form fields
 * Provides clear, accessible error feedback with proper ARIA attributes
 *
 * @module shared/components/FieldError
 */

import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface FieldErrorProps {
  /** Error message to display */
  message: string;

  /** Optional help text or recovery suggestion */
  helpText?: string;

  /** Error severity level */
  severity?: 'error' | 'warning' | 'info';

  /** ID for aria-describedby association */
  id?: string;

  /** Additional CSS classes */
  className?: string;

  /** Show icon */
  showIcon?: boolean;

  /** Animate entrance */
  animate?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Inline field error component with accessibility support
 *
 * Features:
 * - Clear, readable error messages
 * - Optional help text for recovery guidance
 * - Proper ARIA attributes for screen readers
 * - Severity levels with appropriate colors
 * - Optional animation
 *
 * @example
 * ```tsx
 * <Input
 *   aria-invalid={!!error}
 *   aria-describedby={error ? "field-error" : undefined}
 * />
 * {error && (
 *   <FieldError
 *     id="field-error"
 *     message="Please enter at least 10 characters"
 *     helpText="Try adding more details to your description"
 *     severity="error"
 *   />
 * )}
 * ```
 */
export function FieldError({
  message,
  helpText,
  severity = 'error',
  id,
  className,
  showIcon = true,
  animate = true,
}: FieldErrorProps) {
  // Get styling based on severity
  const styles = getSeverityStyles(severity);

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={cn(
        'flex gap-2 text-sm',
        animate && 'animate-in fade-in-0 slide-in-from-top-1 duration-200',
        className,
      )}
    >
      {/* Icon */}
      {showIcon && (
        <div className="flex-shrink-0 mt-0.5">
          {severity === 'info' ? (
            <Info className={cn('w-4 h-4', styles.iconColor)} />
          ) : (
            <AlertCircle className={cn('w-4 h-4', styles.iconColor)} />
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 space-y-1">
        {/* Main error message */}
        <p className={cn('font-medium leading-tight', styles.textColor)}>
          {message}
        </p>

        {/* Optional help text */}
        {helpText && (
          <p className={cn('text-xs leading-relaxed', styles.helpTextColor)}>
            {helpText}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get color classes based on severity
 */
function getSeverityStyles(severity: FieldErrorProps['severity']) {
  switch (severity) {
    case 'warning':
      return {
        iconColor: 'text-amber-500 dark:text-amber-400',
        textColor: 'text-amber-700 dark:text-amber-400',
        helpTextColor: 'text-amber-600/80 dark:text-amber-400/80',
      };
    case 'info':
      return {
        iconColor: 'text-blue-500 dark:text-blue-400',
        textColor: 'text-blue-700 dark:text-blue-400',
        helpTextColor: 'text-blue-600/80 dark:text-blue-400/80',
      };
    case 'error':
    default:
      return {
        iconColor: 'text-red-500 dark:text-red-400',
        textColor: 'text-red-600 dark:text-red-400',
        helpTextColor: 'text-red-500/80 dark:text-red-400/80',
      };
  }
}

// ============================================================================
// Export
// ============================================================================

export default FieldError;
