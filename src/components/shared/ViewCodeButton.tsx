/**
 * ViewCodeButton Component
 *
 * Reusable button for viewing implementation code in playground modules.
 * Provides consistent styling, tooltip, and keyboard shortcut hint across all API playgrounds.
 * Automatically detects user's OS and displays the appropriate keyboard shortcut.
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

import React from 'react';
import { Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SHORTCUTS } from '@/utils/keyboard';

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
   * Show keyboard shortcut in tooltip and button
   * @default true
   */
  showKeyboardHint?: boolean;

  /**
   * Show keyboard shortcut on button label (inline)
   * @default false
   */
  showInlineShortcut?: boolean;

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
 * - Informative tooltip with OS-specific keyboard shortcut
 * - Optional inline keyboard shortcut display
 * - Stops event propagation (for use in collapsible headers)
 * - Accessible and responsive design
 * - Automatic OS detection for shortcuts (⌘K on Mac, Ctrl+K on Windows/Linux)
 *
 * @see {@link https://github.com/your-repo/docs/components/view-code-button.md|Documentation}
 */
export function ViewCodeButton({
  onClick,
  label = 'View Code',
  tooltipText = 'View implementation code',
  showKeyboardHint = true,
  showInlineShortcut = false,
  disabled = false,
  className,
}: ViewCodeButtonProps) {
  // Get OS-specific keyboard shortcut
  const keyboardShortcut = SHORTCUTS.viewCode();

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
            className={`h-8 text-xs text-slate-600 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors ${className || ''}`}
            aria-label={`${tooltipText} (${keyboardShortcut})`}
          >
            <Code className="w-4 h-4 mr-1.5" />
            <span>{label}</span>
            {showInlineShortcut && (
              <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
                {keyboardShortcut}
              </kbd>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          <p className="text-xs">{tooltipText}</p>
          {showKeyboardHint && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Press{' '}
              <kbd className="px-1 py-0.5 font-mono bg-slate-100 dark:bg-slate-700 rounded text-[10px]">
                {keyboardShortcut}
              </kbd>
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Hook for keyboard shortcut support
 * Enables Cmd+K (Mac) or Ctrl+K (Windows/Linux) to open code modal
 *
 * @example
 * ```tsx
 * function MyPlayground() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   useCodeModalShortcut(() => setIsOpen(true));
 *
 *   return <CodeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
 * }
 * ```
 */
export function useCodeModalShortcut(onOpen: () => void) {
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd+K on Mac, Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onOpen]);

  return { openCodeModal: onOpen };
}
