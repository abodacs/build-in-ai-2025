/**
 * APIActionButton Component
 *
 * Unified action button for all Chrome AI API playgrounds.
 * Provides consistent UX across Summarizer, Writer, Rewriter, and Translator.
 *
 * Features:
 * - API-specific color variants
 * - Loading/processing states with animations
 * - Keyboard shortcut hints
 * - Accessibility (ARIA labels, focus management)
 * - Responsive design
 * - Cancel button integration
 *
 * @module shared/components/APIActionButton
 */

import { Loader, Command, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type APIVariant = 'summarize' | 'write' | 'rewrite' | 'translate';

export interface APIActionButtonProps {
  /** API variant - determines color scheme */
  variant: APIVariant;

  /** Button icon */
  icon: LucideIcon;

  /** Button text */
  text: string;

  /** Processing/loading text */
  processingText?: string;

  /** Click handler */
  onClick: () => void;

  /** Disabled state */
  disabled?: boolean;

  /** Processing/loading state */
  isProcessing?: boolean;

  /** Show cancel button during processing */
  showCancel?: boolean;

  /** Cancel handler */
  onCancel?: () => void;

  /** Show keyboard shortcut hint */
  showShortcutHint?: boolean;

  /** Keyboard shortcut text (default: "⌘+Enter") */
  shortcutHint?: string;

  /** Full width */
  fullWidth?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Button size */
  size?: 'default' | 'sm' | 'lg';

  /** Test ID for testing */
  'data-testid'?: string;
}

// ============================================================================
// Variant Configurations
// ============================================================================

const VARIANT_STYLES: Record<
  APIVariant,
  {
    gradient: string;
    hoverGradient: string;
    shadow: string;
    focus: string;
  }
> = {
  summarize: {
    gradient: 'bg-gradient-to-r from-purple-600 to-purple-700',
    hoverGradient: 'hover:from-purple-700 hover:to-purple-800',
    shadow: 'hover:shadow-lg hover:shadow-purple-500/30',
    focus: 'focus-visible:ring-purple-500',
  },
  write: {
    gradient: 'bg-gradient-to-r from-purple-500 to-pink-500',
    hoverGradient: 'hover:from-purple-600 hover:to-pink-600',
    shadow: 'hover:shadow-lg hover:shadow-purple-500/30',
    focus: 'focus-visible:ring-purple-500',
  },
  rewrite: {
    gradient: 'bg-gradient-to-r from-blue-500 to-purple-500',
    hoverGradient: 'hover:from-blue-600 hover:to-purple-600',
    shadow: 'hover:shadow-lg hover:shadow-blue-500/30',
    focus: 'focus-visible:ring-blue-500',
  },
  translate: {
    gradient: 'bg-gradient-to-r from-green-500 to-blue-500',
    hoverGradient: 'hover:from-green-600 hover:to-blue-600',
    shadow: 'hover:shadow-lg hover:shadow-green-500/30',
    focus: 'focus-visible:ring-green-500',
  },
};

// ============================================================================
// Component
// ============================================================================

/**
 * Unified API action button component
 *
 * @example
 * ```tsx
 * <APIActionButton
 *   variant="write"
 *   icon={Wand2}
 *   text="Generate Content"
 *   processingText="Generating..."
 *   onClick={handleGenerate}
 *   isProcessing={isWriting}
 *   showCancel
 *   onCancel={handleCancel}
 *   showShortcutHint
 * />
 * ```
 */
export function APIActionButton({
  variant,
  icon: Icon,
  text,
  processingText,
  onClick,
  disabled = false,
  isProcessing = false,
  showCancel = false,
  onCancel,
  showShortcutHint = true,
  shortcutHint = '⌘+Enter',
  fullWidth = false,
  className,
  size = 'lg',
  'data-testid': dataTestId,
}: APIActionButtonProps) {
  const styles = VARIANT_STYLES[variant];

  const handleClick = () => {
    console.log(`🔘 APIActionButton clicked (${variant})`);
    console.log('  → Disabled:', disabled);
    console.log('  → isProcessing:', isProcessing);
    console.log('  → Text:', text);
    onClick();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Main Action Button */}
      <Button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        size={size}
        data-testid={dataTestId}
        className={cn(
          // Base styles
          'relative overflow-hidden group',
          'transition-all duration-200 ease-out',
          'text-white font-semibold',

          // Variant-specific gradient
          styles.gradient,
          styles.hoverGradient,
          styles.shadow,
          styles.focus,

          // Disabled state
          disabled &&
            'opacity-50 cursor-not-allowed hover:shadow-none saturate-50',

          // Processing state
          isProcessing && 'cursor-wait',

          // Full width
          fullWidth ? 'w-full' : 'min-w-[180px]',

          className,
        )}
        aria-busy={isProcessing}
        aria-label={
          isProcessing
            ? processingText || `${text} in progress`
            : `${text}${showShortcutHint ? ` (${shortcutHint})` : ''}`
        }
      >
        {/* Shimmer effect during processing */}
        {isProcessing && (
          <span
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <span
              className={cn(
                'absolute inset-0',
                'bg-gradient-to-r from-transparent via-white/20 to-transparent',
                'animate-shimmer',
              )}
              style={{
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite',
              }}
            />
          </span>
        )}

        {/* Button content */}
        <span className="relative flex items-center justify-center gap-2">
          {isProcessing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" aria-hidden="true" />
              <span>{processingText || text}</span>
            </>
          ) : (
            <>
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span>{text}</span>
              {showShortcutHint && !disabled && (
                <span
                  className="hidden sm:flex items-center gap-0.5 text-xs opacity-70 ml-1"
                  aria-hidden="true"
                >
                  <Command className="w-3 h-3" />
                  +↵
                </span>
              )}
            </>
          )}
        </span>
      </Button>

      {/* Cancel Button (only shown during processing) */}
      {showCancel && isProcessing && onCancel && (
        <Button
          variant="outline"
          size={size}
          onClick={onCancel}
          className={cn(
            'gap-2',
            'animate-in fade-in slide-in-from-right-5 duration-200',
            'hover:bg-destructive hover:text-destructive-foreground',
            'hover:border-destructive',
            'transition-colors duration-200',
          )}
          aria-label="Cancel operation"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          <span>Cancel</span>
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default APIActionButton;
