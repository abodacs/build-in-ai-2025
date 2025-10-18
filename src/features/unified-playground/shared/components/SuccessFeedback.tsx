/**
 * SuccessFeedback Component
 *
 * Animated success feedback for completed operations.
 * Provides celebratory visual feedback to enhance user satisfaction.
 *
 * Features:
 * - Checkmark scale-in animation
 * - Pulse effect for emphasis
 * - Fade-in entrance
 * - Optional success message
 * - Customizable colors and sizes
 *
 * @module shared/components/SuccessFeedback
 */

import { useEffect } from 'react';
import { CheckCircle2, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface SuccessFeedbackProps {
  /** Success message */
  message?: string;

  /** Show celebration icon (party popper) */
  celebrate?: boolean;

  /** Variant determines styling */
  variant?: 'default' | 'compact' | 'inline';

  /** Additional CSS classes */
  className?: string;

  /** Auto-dismiss after duration (ms) */
  autoDismiss?: number;

  /** Callback when dismissed */
  onDismiss?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Success feedback component with animations
 *
 * @example
 * ```tsx
 * // Default variant
 * <SuccessFeedback
 *   message="Translation completed successfully!"
 *   celebrate
 * />
 *
 * // Compact variant
 * <SuccessFeedback
 *   variant="compact"
 *   message="Saved"
 * />
 *
 * // Inline variant
 * <SuccessFeedback
 *   variant="inline"
 *   message="Copied to clipboard"
 *   autoDismiss={2000}
 * />
 * ```
 */
export function SuccessFeedback({
  message,
  celebrate = false,
  variant = 'default',
  className,
  autoDismiss,
  onDismiss,
}: SuccessFeedbackProps) {
  // Auto-dismiss effect with proper cleanup
  useEffect(() => {
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(onDismiss, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  // Get variant styles
  const styles = getVariantStyles(variant);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-2',
        styles.container,
        // Entrance animation
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        className,
      )}
    >
      {/* Success icon */}
      <div
        className={cn(
          'flex-shrink-0',
          styles.iconColor,
          // Icon animation - scale in with bounce
          'animate-scaleIn',
        )}
      >
        {celebrate ? (
          <PartyPopper className={styles.iconSize} />
        ) : (
          <CheckCircle2 className={styles.iconSize} />
        )}
      </div>

      {/* Success message */}
      {message && (
        <span className={cn('font-medium', styles.textColor, styles.textSize)}>
          {message}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get styles based on variant
 */
function getVariantStyles(variant: SuccessFeedbackProps['variant']) {
  switch (variant) {
    case 'compact':
      return {
        container: 'py-1 px-2',
        iconSize: 'w-4 h-4',
        iconColor: 'text-green-600 dark:text-green-400',
        textColor: 'text-green-700 dark:text-green-300',
        textSize: 'text-sm',
      };
    case 'inline':
      return {
        container: '',
        iconSize: 'w-4 h-4',
        iconColor: 'text-green-600 dark:text-green-400',
        textColor: 'text-green-700 dark:text-green-300',
        textSize: 'text-sm',
      };
    case 'default':
    default:
      return {
        container:
          'rounded-lg border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30 py-3 px-4',
        iconSize: 'w-5 h-5',
        iconColor: 'text-green-600 dark:text-green-400',
        textColor: 'text-green-700 dark:text-green-300',
        textSize: 'text-base',
      };
  }
}

// ============================================================================
// Export
// ============================================================================

export default SuccessFeedback;
