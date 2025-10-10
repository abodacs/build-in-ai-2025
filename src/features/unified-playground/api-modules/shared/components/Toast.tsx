/**
 * Toast Notification Component
 *
 * User feedback system for copy/download actions and other operations.
 * Provides non-intrusive notifications with success/error states.
 *
 * Features:
 * - Auto-dismiss after timeout
 * - Success/Error/Info/Warning variants
 * - Accessibility (ARIA live regions)
 * - Smooth animations
 * - Customizable duration
 * - Action buttons (undo, retry, etc.)
 *
 * @module shared/components/Toast
 */

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  /** Action label */
  label: string;

  /** Action handler */
  onClick: () => void;
}

export interface ToastProps {
  /** Toast variant/type */
  variant: ToastVariant;

  /** Toast message */
  message: string;

  /** Optional description */
  description?: string;

  /** Show toast */
  open: boolean;

  /** Close handler */
  onClose: () => void;

  /** Auto-dismiss duration in ms (default: 3000) */
  duration?: number;

  /** Optional action button */
  action?: ToastAction;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Variant Configurations
// ============================================================================

const VARIANT_CONFIG: Record<
  ToastVariant,
  {
    icon: LucideIcon;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
  }
> = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-900 dark:text-green-100',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-900 dark:text-red-100',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-900 dark:text-amber-100',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-900 dark:text-blue-100',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

// ============================================================================
// Component
// ============================================================================

/**
 * Toast notification component
 *
 * @example
 * ```tsx
 * const [showToast, setShowToast] = useState(false);
 *
 * <Toast
 *   variant="success"
 *   message="Content copied to clipboard"
 *   open={showToast}
 *   onClose={() => setShowToast(false)}
 *   duration={3000}
 * />
 * ```
 */
export function Toast({
  variant,
  message,
  description,
  open,
  onClose,
  duration = 3000,
  action,
  className,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(open);
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  /**
   * Auto-dismiss timer
   */
  useEffect(() => {
    if (open) {
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        // Wait for animation to complete before calling onClose
        setTimeout(onClose, 200);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [open, duration, onClose]);

  /**
   * Manual close
   */
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'animate-in slide-in-from-bottom-5 fade-in duration-200',
        !isVisible && 'animate-out slide-out-to-bottom-5 fade-out',
        className,
      )}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={cn(
          'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
          'min-w-[320px] max-w-md',
          config.bgColor,
          config.borderColor,
          config.textColor,
        )}
      >
        {/* Icon */}
        <Icon
          className={cn('w-5 h-5 shrink-0 mt-0.5', config.iconColor)}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-sm">{message}</p>
          {description && <p className="text-xs opacity-90">{description}</p>}

          {/* Action Button */}
          {action && (
            <button
              onClick={() => {
                action.onClick();
                handleClose();
              }}
              className={cn(
                'mt-2 text-xs font-medium underline underline-offset-2',
                'hover:no-underline transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                variant === 'success' && 'focus:ring-green-500',
                variant === 'error' && 'focus:ring-red-500',
                variant === 'warning' && 'focus:ring-amber-500',
                variant === 'info' && 'focus:ring-blue-500',
              )}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className={cn(
            'shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            variant === 'success' && 'focus:ring-green-500',
            variant === 'error' && 'focus:ring-red-500',
            variant === 'warning' && 'focus:ring-amber-500',
            variant === 'info' && 'focus:ring-blue-500',
          )}
          aria-label="Close notification"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Hook for Toast Management
// ============================================================================

export interface ToastState {
  variant: ToastVariant;
  message: string;
  description?: string;
  action?: ToastAction;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [open, setOpen] = useState(false);

  const showToast = (state: ToastState) => {
    setToast(state);
    setOpen(true);
  };

  const hideToast = () => {
    setOpen(false);
    // Clear toast state after animation
    setTimeout(() => setToast(null), 200);
  };

  return {
    toast,
    open,
    showToast,
    hideToast,
  };
}

// ============================================================================
// Export
// ============================================================================

export default Toast;
