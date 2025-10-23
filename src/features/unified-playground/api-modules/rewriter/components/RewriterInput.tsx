/**
 * RewriterInput Component
 *
 * Input component for Rewriter API.
 * Provides textarea for input text with validation and character count.
 *
 * @module rewriter/components/RewriterInput
 */

import { FileText, Command, Lightbulb } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CharacterCount, FieldError } from '../../shared/components';
import { cn } from '@/lib/utils';
import { getRandomContextExample } from '../data/samples';

// ============================================================================
// Types
// ============================================================================

export interface RewriterInputProps {
  /** Input text value */
  value: string;

  /** Change handler */
  onChange: (value: string) => void;

  /** Task-specific context value (optional) */
  contextValue?: string;

  /** Context change handler (optional) */
  onContextChange?: (value: string) => void;

  /** Disabled state */
  disabled?: boolean;

  /** Show character count */
  showCharacterCount?: boolean;

  /** Minimum characters (for validation) */
  minChars?: number;

  /** Maximum characters (for validation) */
  maxChars?: number;

  /** Placeholder text */
  placeholder?: string;

  /** Additional CSS classes */
  className?: string;

  /** Inline error message to display */
  error?: string;

  /** Error help text for recovery guidance */
  errorHelpText?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Rewriter input component
 *
 * Provides text input for content to be rewritten.
 *
 * @example
 * ```tsx
 * <RewriterInput
 *   value={inputText}
 *   onChange={setInputText}
 *   disabled={isRewriting}
 *   showCharacterCount
 * />
 * ```
 */
export function RewriterInput({
  value,
  onChange,
  contextValue,
  onContextChange,
  disabled = false,
  showCharacterCount = true,
  minChars = 1,
  maxChars = 10000,
  placeholder = 'Enter or paste the text you want to rewrite...',
  className,
  error,
  errorHelpText,
}: RewriterInputProps) {
  const charCount = value.length;
  const isValid = charCount >= minChars && charCount <= maxChars;

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter triggers rewrite
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      // Trigger custom event that parent can listen for
      const rewriteEvent = new CustomEvent('rewriter-rewrite', {
        bubbles: true,
        detail: { text: value },
      });
      e.currentTarget.dispatchEvent(rewriteEvent);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          Input Text
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Enter the text you want to rewrite or transform
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="relative">
          <Textarea
            id="rewriter-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              'min-h-[200px] resize-y font-mono text-base md:text-sm',
              !isValid && value.length > 0 && 'border-destructive',
              error && 'border-red-400 dark:border-red-500',
              disabled && 'opacity-60 cursor-not-allowed',
            )}
            aria-label="Input text for rewriting"
            aria-invalid={!!error || (!isValid && value.length > 0)}
            aria-describedby={error ? 'rewriter-input-error' : undefined}
          />
          {/* Keyboard Shortcut Hint */}
          {!disabled && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-muted-foreground/60 pointer-events-none">
              <Command className="w-3 h-3" />
              <span>+Enter to rewrite</span>
            </div>
          )}
        </div>

        {/* Inline error message */}
        {error && (
          <FieldError
            id="rewriter-input-error"
            message={error}
            helpText={errorHelpText}
            severity="error"
          />
        )}

        {/* Task-Specific Context (Optional) */}
        {onContextChange && (
          <div className="space-y-2 pt-2 border-t">
            <label
              htmlFor="rewriter-context"
              className="text-xs sm:text-sm font-medium flex items-center gap-1"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Context{' '}
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
            </label>
            <Textarea
              id="rewriter-context"
              value={contextValue || ''}
              onChange={(e) => onContextChange(e.target.value)}
              placeholder={getRandomContextExample()}
              disabled={disabled}
              rows={2}
              className={cn(
                'resize-none text-base md:text-sm',
                'focus-visible:ring-2 focus-visible:ring-blue-500/50',
                'transition-all duration-200',
              )}
              aria-label="Task-specific context"
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <span>💡</span>
              <span>
                <strong>Tip:</strong> Add specific context for better results.
                This applies only to <strong>this</strong> rewrite, unlike
                shared context in configuration.
              </span>
            </p>
          </div>
        )}

        {showCharacterCount && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <CharacterCount value={value} maxLength={maxChars} showWords />

            {!isValid && value.length > 0 && (
              <span className="text-destructive">
                {charCount < minChars
                  ? `At least ${minChars} characters required`
                  : `Maximum ${maxChars} characters exceeded`}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default RewriterInput;
