/**
 * ContentGenerationSkeleton Component
 *
 * Sophisticated skeleton loader for Writer API content generation.
 * Shows animated paragraph blocks with realistic text-like appearance.
 *
 * Features:
 * - Multiple animated skeleton paragraphs
 * - Varying line widths for realistic text appearance
 * - Shimmer/pulse effects
 * - Integrated streaming indicator
 * - Responsive design
 *
 * @module ContentGenerationSkeleton
 */

import { Skeleton } from '@/components/ui/skeleton';
import { StreamingIndicator } from './StreamingIndicator';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ContentGenerationSkeletonProps {
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

  /** Number of paragraph blocks to show */
  paragraphs?: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Content generation skeleton loader
 *
 * Displays animated skeleton blocks that resemble text paragraphs
 * being generated, providing engaging visual feedback during content generation.
 *
 * @example
 * ```tsx
 * <ContentGenerationSkeleton
 *   text="Generating content..."
 *   progress={45}
 *   showCancel
 *   onCancel={() => abort()}
 * />
 * ```
 */
export function ContentGenerationSkeleton({
  text = 'Generating content...',
  showProgress = false,
  progress,
  showCancel = false,
  onCancel,
  className,
  paragraphs = 3,
}: ContentGenerationSkeletonProps) {
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

      {/* Skeleton Content - Multiple Paragraphs */}
      <div className="space-y-6 p-4 rounded-lg border bg-muted/30">
        {Array.from({ length: paragraphs }).map((_, paragraphIndex) => (
          <div key={paragraphIndex} className="space-y-3">
            {/* Paragraph Title/First Line (sometimes wider) */}
            <Skeleton
              className={cn('h-4', paragraphIndex === 0 ? 'w-3/4' : 'w-2/3')}
              style={{
                animationDelay: `${paragraphIndex * 150}ms`,
              }}
            />

            {/* Paragraph Lines - Varying widths for realism */}
            <div className="space-y-2.5">
              <Skeleton
                className="h-3 w-full"
                style={{
                  animationDelay: `${paragraphIndex * 150 + 100}ms`,
                }}
              />
              <Skeleton
                className="h-3 w-[95%]"
                style={{
                  animationDelay: `${paragraphIndex * 150 + 200}ms`,
                }}
              />
              <Skeleton
                className="h-3 w-[92%]"
                style={{
                  animationDelay: `${paragraphIndex * 150 + 300}ms`,
                }}
              />
              {paragraphIndex < paragraphs - 1 && (
                <>
                  <Skeleton
                    className="h-3 w-[88%]"
                    style={{
                      animationDelay: `${paragraphIndex * 150 + 400}ms`,
                    }}
                  />
                  <Skeleton
                    className="h-3 w-[60%]"
                    style={{
                      animationDelay: `${paragraphIndex * 150 + 500}ms`,
                    }}
                  />
                </>
              )}
            </div>
          </div>
        ))}

        {/* Last incomplete line for active generation feel */}
        <div className="pt-2">
          <Skeleton
            className="h-3 w-[40%]"
            style={{
              animationDelay: `${paragraphs * 150 + 600}ms`,
            }}
          />
        </div>
      </div>

      {/* Status Text */}
      <p className="text-xs text-center text-muted-foreground animate-pulse">
        {showProgress && progress !== undefined
          ? `${Math.round(progress)}% complete`
          : 'This may take a few moments...'}
      </p>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ContentGenerationSkeleton;
