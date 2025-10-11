/**
 * StreamingIndicator Component
 *
 * Visual indicator for streaming operations in Writer and Rewriter APIs.
 * Shows animated progress and optional cancel button.
 *
 * Features:
 * - Animated pulsing dots
 * - Compact and default variants
 * - Optional cancel button
 * - Progress percentage display
 * - Accessible design
 *
 * @module StreamingIndicator
 */

import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

/**
 * StreamingIndicator component props
 */
export interface StreamingIndicatorProps {
  /** Display text */
  text?: string;

  /** Visual variant */
  variant?: 'default' | 'compact' | 'minimal';

  /** Show cancel button */
  showCancel?: boolean;

  /** Cancel button handler */
  onCancel?: () => void;

  /** Optional progress percentage (0-100) */
  progress?: number;

  /** Additional CSS classes */
  className?: string;

  /** Disable cancel button */
  cancelDisabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Streaming indicator with animated progress
 *
 * Displays visual feedback during streaming operations.
 *
 * @example
 * ```tsx
 * // Default variant
 * <StreamingIndicator
 *   text="Generating content..."
 *   progress={45}
 *   showCancel
 *   onCancel={() => abort()}
 * />
 *
 * // Compact variant
 * <StreamingIndicator variant="compact" />
 *
 * // Minimal variant
 * <StreamingIndicator variant="minimal" text="Loading..." />
 * ```
 */
export function StreamingIndicator({
  text = 'Streaming...',
  variant = 'default',
  showCancel = false,
  onCancel,
  progress,
  className,
  cancelDisabled = false,
}: StreamingIndicatorProps) {
  // Minimal variant - just a spinner
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  // Compact variant - small dots
  if (variant === 'compact') {
    return (
      <div
        className={cn('inline-flex items-center gap-2', className)}
        role="status"
        aria-live="polite"
        aria-label={text}
      >
        <div className="flex gap-1">
          <div
            className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"
            style={{ animationDelay: '0ms', animationDuration: '1s' }}
          />
          <div
            className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"
            style={{ animationDelay: '200ms', animationDuration: '1s' }}
          />
          <div
            className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"
            style={{ animationDelay: '400ms', animationDuration: '1s' }}
          />
        </div>
        {progress !== undefined && (
          <span className="text-xs text-muted-foreground font-medium">
            {Math.round(progress)}%
          </span>
        )}
      </div>
    );
  }

  // Default variant - full UI
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        'bg-primary/5 border-primary/20',
        'backdrop-blur-sm',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Animated Dots */}
        <div className="flex gap-1.5 shrink-0">
          <div
            className="w-2 h-2 bg-primary rounded-full animate-pulse"
            style={{ animationDelay: '0ms', animationDuration: '1s' }}
            aria-hidden="true"
          />
          <div
            className="w-2 h-2 bg-primary rounded-full animate-pulse"
            style={{ animationDelay: '200ms', animationDuration: '1s' }}
            aria-hidden="true"
          />
          <div
            className="w-2 h-2 bg-primary rounded-full animate-pulse"
            style={{ animationDelay: '400ms', animationDuration: '1s' }}
            aria-hidden="true"
          />
        </div>

        {/* Text and Progress */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-medium text-primary truncate">
            {text}
          </span>
          {progress !== undefined && (
            <span className="text-sm text-primary/70 font-medium shrink-0">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      </div>

      {/* Cancel Button */}
      {showCancel && onCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={cancelDisabled}
          className={cn(
            'h-7 px-2 ml-2 shrink-0',
            'hover:bg-destructive/10 hover:text-destructive',
          )}
          aria-label="Cancel streaming"
        >
          <X className="w-4 h-4 mr-1" />
          <span className="text-xs hidden sm:inline">Cancel</span>
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default StreamingIndicator;
