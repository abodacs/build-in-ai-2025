/**
 * DiffHighlight Component
 *
 * Visualizes text differences with inline highlighting.
 * Shows added, removed, and unchanged segments.
 *
 * @module rewriter/components/DiffHighlight
 */

import { cn } from '@/lib/utils';
import type { DiffSegment } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface DiffHighlightProps {
  /** Diff segments to display */
  segments: DiffSegment[];

  /** Display mode */
  mode?: 'inline' | 'side-by-side';

  /** Show removed segments */
  showRemoved?: boolean;

  /** Show added segments */
  showAdded?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Diff highlight component
 *
 * Renders diff segments with appropriate styling for visualization.
 *
 * @example
 * ```tsx
 * <DiffHighlight
 *   segments={diffSegments}
 *   mode="inline"
 *   showRemoved
 *   showAdded
 * />
 * ```
 */
export function DiffHighlight({
  segments,
  showRemoved = true,
  showAdded = true,
  className,
}: DiffHighlightProps) {
  return (
    <div
      className={cn(
        'font-mono text-sm whitespace-pre-wrap break-words',
        className,
      )}
    >
      {segments.map((segment, index) => {
        // Skip removed if not showing
        if (segment.type === 'removed' && !showRemoved) {
          return null;
        }

        // Skip added if not showing
        if (segment.type === 'added' && !showAdded) {
          return null;
        }

        return (
          <span
            key={index}
            className={cn(
              'transition-colors',
              segment.type === 'added' &&
                'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100',
              segment.type === 'removed' &&
                'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 line-through',
              segment.type === 'unchanged' && 'text-foreground',
            )}
          >
            {segment.value}
          </span>
        );
      })}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default DiffHighlight;
