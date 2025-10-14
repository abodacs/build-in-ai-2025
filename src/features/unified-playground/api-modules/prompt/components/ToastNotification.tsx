/**
 * ToastNotification Component
 * Native toast notifications using DOM APIs and CSS animations
 * No external dependencies (no sonner, no react-toastify)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  dismissible?: boolean;
}

interface ToastNotificationProps {
  toast: Toast;
  onDismiss: (id: string) => void;
  position?: ToastPosition;
}

interface ToastContainerProps {
  toasts: Toast[];
  position?: ToastPosition;
  onDismiss: (id: string) => void;
}

// ============================================================================
// Toast Icon Component
// ============================================================================

const ToastIcon: React.FC<{ variant: ToastVariant }> = ({ variant }) => {
  const iconClass = 'w-5 h-5 shrink-0';

  switch (variant) {
    case 'success':
      return (
        <CheckCircle
          className={`${iconClass} text-green-600 dark:text-green-400`}
        />
      );
    case 'error':
      return (
        <XCircle className={`${iconClass} text-red-600 dark:text-red-400`} />
      );
    case 'warning':
      return (
        <AlertCircle
          className={`${iconClass} text-amber-600 dark:text-amber-400`}
        />
      );
    case 'info':
      return (
        <Info className={`${iconClass} text-blue-600 dark:text-blue-400`} />
      );
    default:
      return null;
  }
};

// ============================================================================
// Toast Variant Styles
// ============================================================================

const getToastStyles = (variant: ToastVariant): string => {
  const baseStyles = 'border-l-4';

  switch (variant) {
    case 'success':
      return `${baseStyles} border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100`;
    case 'error':
      return `${baseStyles} border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100`;
    case 'warning':
      return `${baseStyles} border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100`;
    case 'info':
      return `${baseStyles} border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100`;
    default:
      return baseStyles;
  }
};

// ============================================================================
// Single Toast Component
// ============================================================================

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onDismiss,
  position = 'top-right',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Slide in animation on mount
  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation to complete
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300); // Match animation duration
  }, [toast.id, onDismiss]);

  // Animation classes based on position
  const getAnimationClasses = () => {
    const entering = isVisible && !isExiting;
    const exiting = isExiting;

    const isRight = position.includes('right');
    const isLeft = position.includes('left');
    const isCenter = position.includes('center');

    if (isRight) {
      return `transition-all duration-300 ease-in-out ${
        entering
          ? 'translate-x-0 opacity-100'
          : exiting
            ? 'translate-x-full opacity-0'
            : 'translate-x-full opacity-0'
      }`;
    } else if (isLeft) {
      return `transition-all duration-300 ease-in-out ${
        entering
          ? 'translate-x-0 opacity-100'
          : exiting
            ? '-translate-x-full opacity-0'
            : '-translate-x-full opacity-0'
      }`;
    } else if (isCenter) {
      return `transition-all duration-300 ease-in-out ${
        entering
          ? 'translate-y-0 opacity-100'
          : exiting
            ? '-translate-y-4 opacity-0'
            : '-translate-y-4 opacity-0'
      }`;
    }

    return '';
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`
        ${getToastStyles(toast.variant)}
        ${getAnimationClasses()}
        flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm
        min-w-[300px] max-w-[400px] pointer-events-auto
      `}
    >
      {/* Icon */}
      <ToastIcon variant={toast.variant} />

      {/* Message */}
      <div className="flex-1 text-sm font-medium">{toast.message}</div>

      {/* Dismiss Button */}
      {toast.dismissible !== false && (
        <button
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className="shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Toast Container Component
// ============================================================================

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
  onDismiss,
}) => {
  // Position styles
  const getPositionStyles = (): string => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4 items-end';
      case 'top-left':
        return 'top-4 left-4 items-start';
      case 'bottom-right':
        return 'bottom-4 right-4 items-end';
      case 'bottom-left':
        return 'bottom-4 left-4 items-start';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2 items-center';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2 items-center';
      default:
        return 'top-4 right-4 items-end';
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        fixed z-50 flex flex-col gap-2 pointer-events-none
        ${getPositionStyles()}
      `}
    >
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          position={position}
        />
      ))}
    </div>
  );
};

// ============================================================================
// Toast Hook for Easy Usage
// ============================================================================

let toastIdCounter = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (
      message: string,
      variant: ToastVariant = 'info',
      duration: number = 5000,
      dismissible: boolean = true,
    ) => {
      const id = `toast-${Date.now()}-${toastIdCounter++}`;
      const newToast: Toast = {
        id,
        message,
        variant,
        duration,
        dismissible,
      };

      setToasts((prev) => [...prev, newToast]);

      return id;
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (message: string, duration?: number) =>
      showToast(message, 'success', duration),
    [showToast],
  );

  const error = useCallback(
    (message: string, duration?: number) =>
      showToast(message, 'error', duration),
    [showToast],
  );

  const warning = useCallback(
    (message: string, duration?: number) =>
      showToast(message, 'warning', duration),
    [showToast],
  );

  const info = useCallback(
    (message: string, duration?: number) =>
      showToast(message, 'info', duration),
    [showToast],
  );

  return {
    toasts,
    showToast,
    dismissToast,
    dismissAll,
    success,
    error,
    warning,
    info,
    ToastContainer: () => (
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    ),
  };
};

// ============================================================================
// Export
// ============================================================================

export default ToastNotification;
