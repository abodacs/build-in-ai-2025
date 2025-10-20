/**
 * ResultsSkeleton Component
 *
 * Enhanced skeleton loading state for summarization results
 * Features: smart sizing, progressive animation, streaming mode
 *
 * @module ResultsSkeleton
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ResultsSkeletonProps {
  /** Show metrics skeleton */
  showMetrics?: boolean;

  /** Input text length for smart skeleton sizing */
  inputLength?: number;

  /** Is streaming mode active */
  isStreamingMode?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate skeleton line count based on input length
 * Longer input = longer expected summary
 */
function getSkeletonLineCount(inputLength?: number): number {
  if (!inputLength) return 7; // Default

  // Heuristic: longer input typically produces longer summary
  if (inputLength < 500) return 4; // Short input → brief summary
  if (inputLength < 2000) return 7; // Medium input → standard summary
  if (inputLength < 5000) return 10; // Long input → detailed summary
  return 12; // Very long → comprehensive summary (capped at 12)
}

/**
 * Get width for skeleton line
 * Varies widths for natural text appearance
 */
function getLineWidth(index: number, totalLines: number): string {
  const widths = ['100%', '95%', '98%', '90%', '96%', '88%', '92%'];

  // Last line is typically shorter (incomplete sentence)
  if (index === totalLines - 1) {
    return '60%';
  }

  // Cycle through width variations
  return widths[index % widths.length] ?? '95%';
}

// ============================================================================
// ResultsSkeleton Component
// ============================================================================

/**
 * Enhanced skeleton loading state with smart sizing and progressive animation
 *
 * @example
 * ```tsx
 * <ResultsSkeleton
 *   inputLength={1500}
 *   isStreamingMode
 *   showMetrics
 * />
 * ```
 */
export function ResultsSkeleton({
  showMetrics = false,
  inputLength,
  isStreamingMode = false,
  className,
}: ResultsSkeletonProps) {
  // Calculate line count based on input length
  const lineCount = getSkeletonLineCount(inputLength);

  // Progressive animation: reveal lines one by one
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    // Faster reveal for streaming mode
    const revealInterval = isStreamingMode ? 100 : 150; // ms between lines

    const interval = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev >= lineCount) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, revealInterval);

    return () => clearInterval(interval);
  }, [lineCount, isStreamingMode]);

  return (
    <Card
      className={cn(
        'shadow-sm animate-in fade-in duration-200',
        isStreamingMode
          ? 'bg-purple-50/30 border-purple-200' // Purple theme for streaming
          : 'bg-slate-50/30 border-slate-200',
        className,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* Title skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton
              className={cn(
                'w-5 h-5 rounded-full',
                isStreamingMode && 'animate-pulse',
              )}
            />
            <Skeleton
              className={cn('h-6', isStreamingMode ? 'w-40' : 'w-32')}
            />
          </div>

          {/* Action buttons skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content skeleton - progressive reveal */}
        <div
          className={cn(
            'p-4 rounded-lg border space-y-2.5',
            isStreamingMode
              ? 'bg-white border-purple-200' // Streaming mode styling
              : 'bg-white border-slate-200',
          )}
        >
          {Array.from({ length: lineCount }).map((_, i) => {
            // Only show lines that have been revealed
            if (i >= visibleLines) return null;

            return (
              <Skeleton
                key={i}
                className={cn(
                  'h-4 animate-in fade-in slide-in-from-left-2 duration-300',
                  isStreamingMode && 'animate-pulse',
                )}
                style={{ width: getLineWidth(i, lineCount) }}
              />
            );
          })}
        </div>

        {/* Metrics skeleton (optional) */}
        {showMetrics && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-20" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ResultsSkeleton;
