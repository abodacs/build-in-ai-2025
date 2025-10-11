/**
 * ContentRewritingSkeleton Component
 *
 * Sophisticated skeleton loader for Rewriter API content rewriting.
 * Shows animated before/after comparison blocks.
 *
 * Features:
 * - Side-by-side or stacked skeleton blocks
 * - "Original" and "Rewriting..." labels
 * - Animated transition effects
 * - Diff-style visual hints
 * - Integrated streaming indicator
 * - Responsive design
 *
 * @module ContentRewritingSkeleton
 */

import { Skeleton } from '@/components/ui/skeleton';
import { StreamingIndicator } from './StreamingIndicator';
import { ArrowRight, FileText, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ContentRewritingSkeletonProps {
  /** Display status text */
  text?: string;

  /** Show progress indicator */
  showProgress?: boolean;

  /** Progress percentage (0-100) */
  progress?: number;

  /** Show cancel button */
  showCancel?: boolean;

  /** Cancel handler */
  onCancel?: () => void;

  /** Additional CSS classes */
  className?: string;

  /** Layout variant */
  variant?: 'side-by-side' | 'stacked';
}

// ============================================================================
// Component
// ============================================================================

/**
 * Content rewriting skeleton loader
 *
 * Displays animated skeleton blocks showing before/after comparison
 * structure, providing visual feedback during content rewriting.
 *
 * @example
 * ```tsx
 * <ContentRewritingSkeleton
 *   text="Rewriting content..."
 *   progress={45}
 *   showCancel
 *   onCancel={() => abort()}
 *   variant="side-by-side"
 * />
 * ```
 */
export function ContentRewritingSkeleton({
  text = 'Rewriting content...',
  showProgress = false,
  progress,
  showCancel = false,
  onCancel,
  className,
  variant = 'stacked',
}: ContentRewritingSkeletonProps) {
  // Render skeleton block for one side
  const renderSkeletonBlock = (
    label: string,
    icon: React.ReactNode,
    isOutput = false,
  ) => (
    <div className="flex-1 space-y-3">
      {/* Label */}
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>

      {/* Content Block */}
      <div
        className={cn(
          'p-4 rounded-lg border space-y-3',
          isOutput
            ? 'bg-primary/5 border-primary/20'
            : 'bg-muted/30 border-border',
        )}
      >
        {/* Lines with varying widths */}
        <Skeleton
          className="h-3 w-[90%]"
          style={{
            animationDelay: isOutput ? '200ms' : '0ms',
          }}
        />
        <Skeleton
          className="h-3 w-full"
          style={{
            animationDelay: isOutput ? '300ms' : '100ms',
          }}
        />
        <Skeleton
          className="h-3 w-[85%]"
          style={{
            animationDelay: isOutput ? '400ms' : '200ms',
          }}
        />
        <Skeleton
          className="h-3 w-[92%]"
          style={{
            animationDelay: isOutput ? '500ms' : '300ms',
          }}
        />
        <Skeleton
          className="h-3 w-[78%]"
          style={{
            animationDelay: isOutput ? '600ms' : '400ms',
          }}
        />

        {/* Output shows active generation */}
        {isOutput && (
          <div className="pt-2 space-y-2">
            <Skeleton
              className="h-3 w-[65%]"
              style={{ animationDelay: '700ms' }}
            />
            <Skeleton
              className="h-3 w-[40%]"
              style={{ animationDelay: '800ms' }}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={cn('space-y-4', className)}
      role="status"
      aria-live="polite"
    >
      {/* Streaming Indicator Header */}
      <StreamingIndicator
        text={text}
        variant="default"
        showCancel={showCancel}
        onCancel={onCancel}
        progress={showProgress ? progress : undefined}
      />

      {/* Comparison Layout */}
      <div
        className={cn(
          'relative',
          variant === 'side-by-side'
            ? 'hidden lg:flex lg:gap-4 lg:items-start'
            : 'flex flex-col gap-4',
        )}
      >
        {/* Original Content */}
        {renderSkeletonBlock(
          'Original',
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />,
          false,
        )}

        {/* Arrow Indicator (side-by-side only) */}
        {variant === 'side-by-side' && (
          <div className="hidden lg:flex items-center justify-center mt-12">
            <ArrowRight className="w-5 h-5 text-primary animate-pulse" />
          </div>
        )}

        {/* Rewritten Content (in progress) */}
        {renderSkeletonBlock(
          'Rewriting',
          <Wand2 className="w-3.5 h-3.5 text-primary animate-pulse" />,
          true,
        )}
      </div>

      {/* Mobile/Stacked View (when side-by-side) */}
      {variant === 'side-by-side' && (
        <div className="flex lg:hidden flex-col gap-4">
          {/* Original Content */}
          {renderSkeletonBlock(
            'Original',
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />,
            false,
          )}

          {/* Rewritten Content (in progress) */}
          {renderSkeletonBlock(
            'Rewriting',
            <Wand2 className="w-3.5 h-3.5 text-primary animate-pulse" />,
            true,
          )}
        </div>
      )}

      {/* Status Text */}
      <p className="text-xs text-center text-muted-foreground animate-pulse">
        {showProgress && progress !== undefined
          ? `${Math.round(progress)}% complete`
          : 'Analyzing and rewriting your text...'}
      </p>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ContentRewritingSkeleton;
