/**
 * ValidationMessage Component
 *
 * Real-time validation feedback with animations.
 * Provides visual indicators for valid/invalid/warning states with smooth transitions.
 *
 * Features:
 * - Animated entrance/exit (fade-in, shake, slide)
 * - Color-coded severity levels
 * - Icon animations (scale, pulse)
 * - Helpful contextual messages
 * - Accessibility support (ARIA live regions)
 *
 * @module shared/components/ValidationMessage
 */

import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ValidationMessageProps {
  /** Validation type determines color and icon */
  type: 'error' | 'warning' | 'info' | 'success';

  /** Message content */
  children: React.ReactNode;

  /** Custom icon (overrides default icon) */
  icon?: React.ReactNode;

  /** Enable animations */
  animated?: boolean;

  /** Show icon */
  showIcon?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** ID for aria-describedby association */
  id?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Validation message with animated feedback
 *
 * @example
 * ```tsx
 * <Slider
 *   value={temperature}
 *   onChange={setTemperature}
 *   aria-describedby="temp-validation"
 * />
 * <ValidationMessage
 *   id="temp-validation"
 *   type={temperature > 0.9 ? 'warning' : 'info'}
 *   icon={temperature > 0.9 ? <AlertTriangle /> : <Info />}
 * >
 *   {temperature > 0.9
 *     ? 'Very creative but potentially unpredictable'
 *     : 'Balanced creativity and coherence'}
 * </ValidationMessage>
 * ```
 */
export function ValidationMessage({
  type,
  children,
  icon,
  animated = true,
  showIcon = true,
  className,
  id,
}: ValidationMessageProps) {
  // Get default icon based on type
  const defaultIcon = getDefaultIcon(type);

  // Get styles based on type
  const styles = getTypeStyles(type);

  return (
    <div
      id={id}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={cn(
        'flex items-start gap-2 text-sm py-2 px-3 rounded-md',
        styles.background,
        styles.border,
        // Animations
        animated &&
          type === 'error' &&
          'animate-in fade-in-0 slide-in-from-left-2',
        animated &&
          type === 'warning' &&
          'animate-in fade-in-0 slide-in-from-left-2',
        animated && type === 'success' && 'animate-in fade-in-0 scale-in',
        animated && type === 'info' && 'animate-in fade-in-0',
        // Transitions
        'transition-all duration-200',
        className,
      )}
    >
      {/* Icon */}
      {showIcon && (
        <div
          className={cn(
            'flex-shrink-0 mt-0.5',
            styles.iconColor,
            // Icon animation
            animated && type === 'success' && 'animate-scaleIn',
            animated && type === 'error' && 'animate-pulse',
          )}
        >
          {icon || defaultIcon}
        </div>
      )}

      {/* Message content */}
      <div className={cn('flex-1 leading-relaxed', styles.textColor)}>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get default icon for validation type
 */
function getDefaultIcon(type: ValidationMessageProps['type']) {
  switch (type) {
    case 'error':
      return <AlertCircle className="w-4 h-4" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4" />;
    case 'success':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'info':
    default:
      return <Info className="w-4 h-4" />;
  }
}

/**
 * Get styling based on validation type
 */
function getTypeStyles(type: ValidationMessageProps['type']) {
  switch (type) {
    case 'error':
      return {
        background: 'bg-red-50 dark:bg-red-950/30',
        border: 'border border-red-200 dark:border-red-900/50',
        iconColor: 'text-red-500 dark:text-red-400',
        textColor: 'text-red-700 dark:text-red-300',
      };
    case 'warning':
      return {
        background: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border border-amber-200 dark:border-amber-900/50',
        iconColor: 'text-amber-500 dark:text-amber-400',
        textColor: 'text-amber-700 dark:text-amber-300',
      };
    case 'success':
      return {
        background: 'bg-green-50 dark:bg-green-950/30',
        border: 'border border-green-200 dark:border-green-900/50',
        iconColor: 'text-green-500 dark:text-green-400',
        textColor: 'text-green-700 dark:text-green-300',
      };
    case 'info':
    default:
      return {
        background: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border border-blue-200 dark:border-blue-900/50',
        iconColor: 'text-blue-500 dark:text-blue-400',
        textColor: 'text-blue-700 dark:text-blue-300',
      };
  }
}

// ============================================================================
// Export
// ============================================================================

export default ValidationMessage;
