/**
 * StreamingMetrics Component
 *
 * Real-time metrics display during streaming rewrite operations.
 * Shows character count, change delta, and streaming progress.
 *
 * @module rewriter/components/StreamingMetrics
 */

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface StreamingMetricsProps {
  /** Original text */
  originalText: string;

  /** Current streaming content */
  streamingContent: string;

  /** Is streaming active */
  isStreaming: boolean;

  /** Estimated total (optional) */
  estimatedTotal?: number;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * StreamingMetrics component
 *
 * Displays real-time metrics during streaming operations.
 *
 * @example
 * ```tsx
 * <StreamingMetrics
 *   originalText={originalInput}
 *   streamingContent={content}
 *   isStreaming={isStreaming}
 * />
 * ```
 */
export function StreamingMetrics({
  originalText,
  streamingContent,
  isStreaming,
  estimatedTotal,
  className,
}: StreamingMetricsProps) {
  // Calculate real-time metrics
  const metrics = useMemo(() => {
    const originalLength = originalText.length;
    const currentLength = streamingContent.length;
    const delta = currentLength - originalLength;
    const percentChange =
      originalLength > 0
        ? Math.round((Math.abs(delta) / originalLength) * 100)
        : 0;

    // Word counts
    const originalWords = originalText
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const currentWords = streamingContent
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const wordDelta = currentWords - originalWords;

    // Progress estimation
    const progress =
      estimatedTotal && estimatedTotal > 0
        ? Math.min(100, (currentLength / estimatedTotal) * 100)
        : undefined;

    return {
      originalLength,
      currentLength,
      delta,
      percentChange,
      originalWords,
      currentWords,
      wordDelta,
      progress,
    };
  }, [originalText, streamingContent, estimatedTotal]);

  const isExpanding = metrics.delta > 0;
  const isCondensing = metrics.delta < 0;
  const isUnchanged = metrics.delta === 0;

  return (
    <div
      className={cn(
        'rounded-lg border bg-gradient-to-r from-blue-50/50 to-purple-50/50',
        'dark:from-blue-950/20 dark:to-purple-950/20 p-3 space-y-2',
        'animate-in fade-in-50 duration-300',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
          <span className="text-sm font-medium">
            {isStreaming ? 'Streaming...' : 'Stream Complete'}
          </span>
        </div>

        {/* Change Badge */}
        {!isUnchanged && (
          <Badge
            variant={isExpanding ? 'default' : 'secondary'}
            className={cn(
              'text-xs font-mono',
              isExpanding &&
                'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
              isCondensing &&
                'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
            )}
          >
            {isExpanding && <TrendingUp className="w-3 h-3 mr-1" />}
            {isCondensing && <TrendingDown className="w-3 h-3 mr-1" />}
            {isExpanding ? '+' : ''}
            {metrics.delta} chars
          </Badge>
        )}
      </div>

      {/* Real-time Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Original */}
        <div className="space-y-0.5">
          <div className="text-muted-foreground">Original</div>
          <div className="font-mono font-semibold">
            {metrics.originalLength.toLocaleString()}
            <span className="text-[10px] text-muted-foreground ml-1">
              ({metrics.originalWords}w)
            </span>
          </div>
        </div>

        {/* Current */}
        <div className="space-y-0.5">
          <div className="text-muted-foreground">Current</div>
          <div className="font-mono font-semibold text-primary">
            {metrics.currentLength.toLocaleString()}
            <span className="text-[10px] text-muted-foreground ml-1">
              ({metrics.currentWords}w)
            </span>
          </div>
        </div>

        {/* Change */}
        <div className="space-y-0.5">
          <div className="text-muted-foreground">Change</div>
          <div
            className={cn(
              'font-mono font-semibold flex items-center gap-1',
              isExpanding && 'text-green-600 dark:text-green-400',
              isCondensing && 'text-blue-600 dark:text-blue-400',
              isUnchanged && 'text-muted-foreground',
            )}
          >
            {isExpanding && <TrendingUp className="w-3 h-3" />}
            {isCondensing && <TrendingDown className="w-3 h-3" />}
            {isUnchanged && <Minus className="w-3 h-3" />}
            {metrics.percentChange}%
          </div>
        </div>

        {/* Words Delta */}
        <div className="space-y-0.5">
          <div className="text-muted-foreground">Words</div>
          <div className="font-mono font-semibold">
            {metrics.wordDelta > 0 ? '+' : ''}
            {metrics.wordDelta}
          </div>
        </div>
      </div>

      {/* Progress Bar (if estimated total available) */}
      {isStreaming && metrics.progress !== undefined && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Progress</span>
            <span className="font-mono">{Math.round(metrics.progress)}%</span>
          </div>
          <Progress value={metrics.progress} className="h-1.5" />
        </div>
      )}

      {/* Live Indicator */}
      {isStreaming && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-75" />
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-150" />
          </div>
          <span>Generating in real-time</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default StreamingMetrics;
