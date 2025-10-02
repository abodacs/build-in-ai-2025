/**
 * SparkButton Component
 *
 * Animated gradient button for triggering summarization
 * Features shimmer effect, icon transitions, and processing states
 *
 * @module SparkButton
 */

import { Sparkles, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface SparkButtonProps {
  /** Click handler */
  onClick: () => void;

  /** Disabled state */
  disabled?: boolean;

  /** Processing/loading state */
  isProcessing?: boolean;

  /** Button text (default: "Run Summarizer") */
  text?: string;

  /** Processing text (default: "Summarizing...") */
  processingText?: string;

  /** Additional CSS classes */
  className?: string;

  /** Button size */
  size?: 'default' | 'sm' | 'lg';

  /** Full width */
  fullWidth?: boolean;
}

// ============================================================================
// SparkButton Component
// ============================================================================

/**
 * Animated gradient button for summarization
 *
 * @example
 * ```tsx
 * <SparkButton
 *   onClick={handleSummarize}
 *   isProcessing={isLoading}
 *   disabled={!hasText}
 * />
 * ```
 */
export function SparkButton({
  onClick,
  disabled = false,
  isProcessing = false,
  text = 'Run Summarizer',
  processingText = 'Summarizing...',
  className,
  size = 'lg',
  fullWidth = false,
}: SparkButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isProcessing}
      size={size}
      className={cn(
        // Base styles
        'relative overflow-hidden group',
        'transition-all duration-200 ease-out',

        // Simple solid color (purple theme)
        'bg-purple-600 hover:bg-purple-700',
        'text-white font-semibold',

        // Subtle hover effects
        'hover:shadow-md hover:shadow-purple-500/30',

        // Disabled state
        disabled &&
          'opacity-50 cursor-not-allowed hover:bg-purple-600 hover:shadow-none',

        // Full width
        fullWidth && 'w-full',

        className,
      )}
    >
      {/* Shimmer effect overlay - ONLY during processing */}
      {isProcessing && (
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'pointer-events-none',
          )}
        >
          <span
            className={cn(
              'absolute inset-0',
              'bg-gradient-to-r from-transparent via-white/20 to-transparent',
              'animate-shimmer',
            )}
            style={{
              backgroundSize: '200% 100%',
            }}
          />
        </span>
      )}

      {/* Button content */}
      <span className="relative flex items-center justify-center gap-2">
        {isProcessing ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>{processingText}</span>
            <Sparkles className="w-4 h-4 animate-pulse" />
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>{text}</span>
          </>
        )}
      </span>
    </Button>
  );
}

// ============================================================================
// Export
// ============================================================================

export default SparkButton;
