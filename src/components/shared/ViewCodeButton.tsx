/**
 * ViewCodeButton Component
 *
 * Reusable button for viewing implementation code in playground modules.
 * Provides consistent styling, tooltip, and keyboard shortcut hint across all API playgrounds.
 *
 * @module ViewCodeButton
 * @example
 * ```tsx
 * import { ViewCodeButton } from '@/components/shared/ViewCodeButton';
 *
 * function MyPlayground() {
 *   const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <ViewCodeButton onClick={() => setIsCodeModalOpen(true)} />
 *       <CodeModal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)} />
 *     </>
 *   );
 * }
 * ```
 */

import { Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// Types
// ============================================================================

export interface ViewCodeButtonProps {
  /**
   * Click handler for the button
   */
  onClick: () => void;

  /**
   * Button label text
   * @default "View Code"
   */
  label?: string;

  /**
   * Tooltip description
   * @default "View implementation code"
   */
  tooltipText?: string;

  /**
   * Show keyboard shortcut in tooltip
   * @default true
   */
  showKeyboardHint?: boolean;

  /**
   * Keyboard shortcut to display (e.g., "⌘K", "Ctrl+K")
   * @default "⌘K"
   */
  keyboardHint?: string;

  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ViewCodeButton Component
 *
 * Consistent "View Code" button used across all API playground modules.
 * Features:
 * - Ghost variant with subtle hover states
 * - Informative tooltip with keyboard shortcut
 * - Stops event propagation (for use in collapsible headers)
 * - Accessible and responsive design
 *
 * @see {@link https://github.com/your-repo/docs/components/view-code-button.md|Documentation}
 */
export function ViewCodeButton({
  onClick,
  label = 'View Code',
  tooltipText = 'View implementation code',
  showKeyboardHint = true,
  keyboardHint = '⌘K',
  disabled = false,
  className,
}: ViewCodeButtonProps) {
  /**
   * Handle click with event propagation stop
   * Prevents triggering parent collapsible/accordion when used in headers
   */
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            disabled={disabled}
            className={`h-8 text-xs text-slate-600 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800 ${className || ''}`}
            aria-label={tooltipText}
          >
            <Code className="w-4 h-4 mr-1.5" />
            {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          <p className="text-xs">{tooltipText}</p>
          {showKeyboardHint && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {keyboardHint}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Hook for keyboard shortcut support (optional enhancement)
 * Can be used in playground components to trigger code modal with keyboard
 *
 * @example
 * ```tsx
 * const { openCodeModal } = useCodeModalShortcut(() => setIsCodeModalOpen(true));
 * ```
 */
export function useCodeModalShortcut(onOpen: () => void) {
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // ⌘K on Mac, Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onOpen]);

  return { openCodeModal: onOpen };
}

// Re-export React for the hook
import React from 'react';
