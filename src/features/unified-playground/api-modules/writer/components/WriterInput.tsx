/**
 * WriterInput Component
 *
 * Input component for Writer prompts.
 * Provides textarea with validation, character counting, and examples.
 *
 * @module writer/components/WriterInput
 */

import { Sparkles, Lightbulb, Command } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CharacterCount, FieldError } from '../../shared/components';
import { cn } from '@/lib/utils';

// ============================================================================
// Constants
// ============================================================================

const EXAMPLE_PROMPTS = [
  {
    id: 'email',
    text: 'Write a professional email about...',
    icon: '✉️',
  },
  {
    id: 'blog',
    text: 'Create a blog post introduction for...',
    icon: '📝',
  },
  {
    id: 'product',
    text: 'Generate a product description for...',
    icon: '🛍️',
  },
];

// ============================================================================
// Types
// ============================================================================

export interface WriterInputProps {
  /** Current prompt value */
  value: string;

  /** Value change handler */
  onChange: (value: string) => void;

  /** Task-specific context value (optional) */
  contextValue?: string;

  /** Context change handler (optional) */
  onContextChange?: (value: string) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Disable input */
  disabled?: boolean;

  /** Show character count */
  showCharacterCount?: boolean;

  /** Maximum length */
  maxLength?: number;

  /** Additional CSS classes */
  className?: string;

  /** Input ID for accessibility */
  id?: string;

  /** Inline error message to display */
  error?: string;

  /** Error help text for recovery guidance */
  errorHelpText?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Writer prompt input component
 *
 * Provides a textarea for entering writing prompts with validation,
 * character counting, and helpful examples.
 *
 * @example
 * ```tsx
 * const [prompt, setPrompt] = useState('');
 *
 * <WriterInput
 *   value={prompt}
 *   onChange={setPrompt}
 *   placeholder="What would you like me to write?"
 * />
 * ```
 */
export function WriterInput({
  value,
  onChange,
  contextValue,
  onContextChange,
  placeholder = 'What would you like me to write?',
  disabled = false,
  showCharacterCount = true,
  maxLength = 5000,
  className,
  id = 'writer-prompt',
  error,
  errorHelpText,
}: WriterInputProps) {
  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter triggers generate (handled by parent)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      // Trigger custom event that parent can listen for
      const generateEvent = new CustomEvent('writer-generate', {
        bubbles: true,
        detail: { prompt: value },
      });
      e.currentTarget.dispatchEvent(generateEvent);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
          Writing Prompt
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Describe what you want to write
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Textarea */}
        <div className="relative">
          <Textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            aria-invalid={!!error}
            aria-describedby={error ? 'writer-prompt-error' : undefined}
            className={cn(
              'min-h-[120px] sm:min-h-[150px] md:min-h-[180px]',
              'resize-y text-sm sm:text-base',
              'focus-visible:ring-2 focus-visible:ring-purple-500',
              'transition-all duration-200',
              error && 'border-red-400 dark:border-red-500',
            )}
            aria-label="Writing prompt"
          />
          {/* Keyboard Shortcut Hint */}
          {!disabled && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-muted-foreground/60 pointer-events-none">
              <Command className="w-3 h-3" />
              <span>+Enter to generate</span>
            </div>
          )}
        </div>

        {/* Inline error message */}
        {error && (
          <FieldError
            id="writer-prompt-error"
            message={error}
            helpText={errorHelpText}
            severity="error"
          />
        )}

        {/* Task-Specific Context (Optional) */}
        {onContextChange && (
          <div className="space-y-2">
            <label
              htmlFor={`${id}-context`}
              className="text-xs sm:text-sm font-medium flex items-center gap-1"
            >
              💡 Context{' '}
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
            </label>
            <Textarea
              id={`${id}-context`}
              value={contextValue || ''}
              onChange={(e) => onContextChange(e.target.value)}
              placeholder='e.g., "The request comes from someone at a startup" or "For a business audience"'
              disabled={disabled}
              rows={2}
              className={cn(
                'resize-none text-sm',
                'focus-visible:ring-2 focus-visible:ring-purple-500/50',
                'transition-all duration-200',
              )}
              aria-label="Task-specific context"
            />
            <p className="text-xs text-muted-foreground">
              Specific context for <strong>this</strong> generation only.
              Different from shared context which applies to all generations.
            </p>
          </div>
        )}

        {/* Helper Text */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-muted">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">
              Tips for better results:
            </p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>Be specific about what you want</li>
              <li>Include context and target audience</li>
              <li>Mention desired style or format</li>
            </ul>
          </div>
        </div>

        {/* Character Count */}
        {showCharacterCount && (
          <CharacterCount
            value={value}
            maxLength={maxLength}
            showWords
            compact
          />
        )}

        {/* Quick Examples - Interactive */}
        {!value && !disabled && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Try these examples:
            </p>
            <div className="flex flex-col gap-1.5">
              {EXAMPLE_PROMPTS.map((example) => (
                <Button
                  key={example.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(example.text)}
                  className={cn(
                    'h-auto py-2 px-3 justify-start text-left',
                    'text-xs text-muted-foreground hover:text-foreground',
                    'hover:bg-muted/50 transition-all duration-200',
                    'font-normal',
                  )}
                >
                  <span className="mr-2 text-base">{example.icon}</span>
                  <span>{example.text}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default WriterInput;
