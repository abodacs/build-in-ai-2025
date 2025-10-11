/**
 * CharacterCount Component
 *
 * Displays character and word count with visual warnings as limits are approached.
 * Used for input validation in Writer and Rewriter APIs.
 *
 * Features:
 * - Real-time character/word counting
 * - Warning indicators at threshold
 * - Maximum length validation
 * - Accessible design
 * - Color-coded feedback
 *
 * @module CharacterCount
 */

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { countWords, formatNumber } from '../utils';

// ============================================================================
// Types
// ============================================================================

/**
 * CharacterCount component props
 */
export interface CharacterCountProps {
  /** Current text value */
  value: string;

  /** Maximum length allowed */
  maxLength?: number;

  /** Show word count */
  showWords?: boolean;

  /** Warning threshold percentage (default: 80) */
  warningThreshold?: number;

  /** Critical threshold percentage (default: 95) */
  criticalThreshold?: number;

  /** Additional CSS classes */
  className?: string;

  /** Compact display (smaller text) */
  compact?: boolean;
}

/**
 * Warning level type
 */
type WarningLevel = 'normal' | 'warning' | 'critical';

// ============================================================================
// Component
// ============================================================================

/**
 * Character and word counter with limit warnings
 *
 * Provides real-time feedback on text length and warnings
 * as the user approaches maximum length.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CharacterCount
 *   value={text}
 *   maxLength={5000}
 *   showWords
 * />
 *
 * // Compact mode
 * <CharacterCount
 *   value={text}
 *   maxLength={1000}
 *   compact
 * />
 *
 * // Custom thresholds
 * <CharacterCount
 *   value={text}
 *   maxLength={10000}
 *   warningThreshold={70}
 *   criticalThreshold={90}
 * />
 * ```
 */
export function CharacterCount({
  value,
  maxLength = 50000,
  showWords = true,
  warningThreshold = 80,
  criticalThreshold = 95,
  className,
  compact = false,
}: CharacterCountProps) {
  const count = value.length;
  const words = showWords ? countWords(value) : 0;
  const percentage = (count / maxLength) * 100;

  /**
   * Determine warning level based on percentage
   */
  const getWarningLevel = (): WarningLevel => {
    if (percentage >= criticalThreshold) {
      return 'critical';
    }
    if (percentage >= warningThreshold) {
      return 'warning';
    }
    return 'normal';
  };

  const warningLevel = getWarningLevel();
  const showWarning = warningLevel !== 'normal';

  // Styling based on warning level
  const warningStyles = {
    normal: 'text-muted-foreground',
    warning: 'text-yellow-600 dark:text-yellow-500 font-medium',
    critical: 'text-destructive font-medium',
  };

  const textSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2',
        textSize,
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={`${count} characters${showWords ? `, ${words} words` : ''}`}
    >
      {/* Count Display */}
      <div className="flex items-center gap-2 text-muted-foreground">
        {showWords && (
          <>
            <span className="inline-flex items-baseline gap-1">
              <span className="font-medium tabular-nums">
                {formatNumber(words)}
              </span>
              <span>{words === 1 ? 'word' : 'words'}</span>
            </span>
            <span className="text-muted-foreground/50" aria-hidden="true">
              •
            </span>
          </>
        )}
        <span className="inline-flex items-baseline gap-1">
          <span className="font-medium tabular-nums">
            {formatNumber(count)}
          </span>
          <span>{count === 1 ? 'character' : 'characters'}</span>
        </span>
      </div>

      {/* Warning Indicator */}
      {showWarning && (
        <div
          className={cn('flex items-center gap-1', warningStyles[warningLevel])}
        >
          <span className="font-medium tabular-nums">
            {Math.round(percentage)}% of limit
          </span>
          {warningLevel === 'critical' && (
            <AlertCircle
              className="w-3.5 h-3.5 shrink-0"
              aria-label="Warning: Approaching character limit"
            />
          )}
        </div>
      )}

      {/* Over Limit Warning */}
      {count > maxLength && (
        <div className="flex items-center gap-1 text-destructive font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="tabular-nums">
            {formatNumber(count - maxLength)} over limit
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default CharacterCount;
