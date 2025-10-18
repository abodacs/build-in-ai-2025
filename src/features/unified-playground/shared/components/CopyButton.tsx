/**
 * CopyButton Component
 *
 * Reusable copy-to-clipboard button with animated feedback.
 * Provides instant visual confirmation of successful copy operation.
 *
 * Features:
 * - Icon swap animation (Copy → Check)
 * - Success pulse effect
 * - Toast notification support
 * - Customizable appearance
 * - Accessibility support
 *
 * @module shared/components/CopyButton
 */

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string;

  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';

  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';

  /** Show label text */
  showLabel?: boolean;

  /** Custom label text */
  label?: string;

  /** Custom copied label text */
  copiedLabel?: string;

  /** Show toast notification on copy */
  showToast?: boolean;

  /** Custom toast message */
  toastMessage?: string;

  /** Duration to show copied state (ms) */
  copiedDuration?: number;

  /** Additional CSS classes */
  className?: string;

  /** Callback after copy */
  onCopy?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Copy button with animated success feedback
 *
 * @example
 * ```tsx
 * // Simple icon button
 * <CopyButton text={code} size="icon" variant="ghost" />
 *
 * // With label
 * <CopyButton
 *   text={generatedText}
 *   showLabel
 *   label="Copy"
 *   copiedLabel="Copied!"
 *   showToast
 * />
 *
 * // Custom styling
 * <CopyButton
 *   text={output}
 *   variant="outline"
 *   size="sm"
 *   toastMessage="Code copied to clipboard"
 *   onCopy={() => console.log('Copied!')}
 * />
 * ```
 */
export function CopyButton({
  text,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
  label = 'Copy',
  copiedLabel = 'Copied!',
  showToast = false,
  toastMessage,
  copiedDuration = 2000,
  className,
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  /**
   * Handle copy to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Show toast if enabled
      if (showToast) {
        toast.success(toastMessage || 'Copied to clipboard', {
          duration: 2000,
        });
      }

      // Call callback if provided
      onCopy?.();

      // Reset copied state after duration
      setTimeout(() => {
        setCopied(false);
      }, copiedDuration);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        'relative group',
        'transition-all duration-200',
        copied && 'text-green-600 dark:text-green-400',
        className,
      )}
      aria-label={copied ? copiedLabel : label}
      disabled={copied}
    >
      {/* Icon with swap animation */}
      <div className="relative flex items-center gap-2">
        {/* Copy Icon */}
        <div
          className={cn(
            'transition-all duration-200',
            copied
              ? 'opacity-0 scale-0 absolute'
              : 'opacity-100 scale-100 relative',
          )}
        >
          <Copy className={size === 'icon' ? 'w-4 h-4' : 'w-4 h-4'} />
        </div>

        {/* Check Icon with success animation */}
        <div
          className={cn(
            'transition-all duration-200',
            copied
              ? 'opacity-100 scale-100 relative animate-scaleIn'
              : 'opacity-0 scale-0 absolute',
          )}
        >
          <Check className={size === 'icon' ? 'w-4 h-4' : 'w-4 h-4'} />
        </div>

        {/* Label text */}
        {showLabel && (
          <span
            className={cn(
              'font-medium transition-all duration-200',
              copied && 'animate-fadeIn',
            )}
          >
            {copied ? copiedLabel : label}
          </span>
        )}
      </div>

      {/* Success pulse effect */}
      {copied && (
        <span
          className="absolute inset-0 rounded-md animate-successPulse pointer-events-none"
          aria-hidden="true"
        />
      )}
    </Button>
  );
}

// ============================================================================
// Export
// ============================================================================

export default CopyButton;
