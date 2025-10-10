/**
 * PerformanceMetrics Component
 *
 * Displays performance metrics for Writer and Rewriter API operations.
 * Shows duration, word count, quality, and speed in a clean, readable format.
 *
 * Features:
 * - Responsive grid layout
 * - Icon-based visual design
 * - Multiple display variants
 * - Automatic formatting
 * - Quality indicators
 *
 * @module PerformanceMetrics
 */

import { Clock, FileText, Type, Star, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PerformanceMetrics as PerformanceMetricsType } from '../types';
import {
  formatDuration,
  formatNumber,
  formatTokensPerSecond,
} from '../utils/formatters';

// ============================================================================
// Types
// ============================================================================

/**
 * PerformanceMetrics component props
 */
export interface PerformanceMetricsProps {
  /** Performance metrics data */
  metrics: PerformanceMetricsType;

  /** Display variant */
  variant?: 'default' | 'compact' | 'detailed';

  /** Additional CSS classes */
  className?: string;

  /** Show quality indicator */
  showQuality?: boolean;

  /** Show first chunk latency (for streaming) */
  showLatency?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Display performance metrics
 *
 * Shows operation performance data in a clean, readable format.
 *
 * @example
 * ```tsx
 * // Default variant
 * <PerformanceMetrics
 *   metrics={{
 *     duration: 1250,
 *     words: 245,
 *     characters: 1523,
 *     quality: 'high',
 *     tokensPerSecond: 32.5,
 *   }}
 * />
 *
 * // Compact variant
 * <PerformanceMetrics
 *   metrics={metrics}
 *   variant="compact"
 * />
 *
 * // Detailed variant with all info
 * <PerformanceMetrics
 *   metrics={metrics}
 *   variant="detailed"
 *   showQuality
 *   showLatency
 * />
 * ```
 */
export function PerformanceMetrics({
  metrics,
  variant = 'default',
  className,
  showQuality = true,
  showLatency = false,
}: PerformanceMetricsProps) {
  // Quality color mapping
  const qualityColors = {
    high: 'text-green-600 dark:text-green-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-red-600 dark:text-red-400',
  };

  // Compact variant - single line
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center gap-3 text-xs text-muted-foreground',
          className,
        )}
      >
        {/* Duration */}
        {metrics.duration !== undefined && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(metrics.duration)}</span>
          </div>
        )}

        {/* Words */}
        {metrics.words !== undefined && (
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>{formatNumber(metrics.words)} words</span>
          </div>
        )}

        {/* Speed */}
        {metrics.tokensPerSecond !== undefined && (
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>{formatTokensPerSecond(metrics.tokensPerSecond)}</span>
          </div>
        )}

        {/* Quality */}
        {showQuality && metrics.quality && (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] h-4 px-1.5',
              qualityColors[metrics.quality],
            )}
          >
            {metrics.quality}
          </Badge>
        )}
      </div>
    );
  }

  // Default and Detailed variants - card layout
  const items = [
    {
      icon: Clock,
      label: 'Duration',
      value:
        metrics.duration !== undefined
          ? formatDuration(metrics.duration)
          : null,
      show: metrics.duration !== undefined,
    },
    {
      icon: FileText,
      label: 'Words',
      value: metrics.words !== undefined ? formatNumber(metrics.words) : null,
      show: metrics.words !== undefined,
    },
    {
      icon: Type,
      label: 'Characters',
      value:
        metrics.characters !== undefined
          ? formatNumber(metrics.characters)
          : null,
      show: variant === 'detailed' && metrics.characters !== undefined,
    },
    {
      icon: Zap,
      label: 'Speed',
      value:
        metrics.tokensPerSecond !== undefined
          ? formatTokensPerSecond(metrics.tokensPerSecond)
          : null,
      show: metrics.tokensPerSecond !== undefined,
    },
    {
      icon: TrendingUp,
      label: 'First Chunk',
      value:
        metrics.firstChunkLatency !== undefined
          ? formatDuration(metrics.firstChunkLatency)
          : null,
      show: showLatency && metrics.firstChunkLatency !== undefined,
    },
  ].filter((item) => item.show);

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="pt-4 pb-3">
        <div
          className={cn(
            'grid gap-4',
            variant === 'detailed'
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
              : 'grid-cols-2 sm:grid-cols-4',
          )}
        >
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <item.icon
                className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{item.value}</div>
                <div className="text-xs text-muted-foreground">
                  {item.label}
                </div>
              </div>
            </div>
          ))}

          {/* Quality Badge */}
          {showQuality && metrics.quality && (
            <div className="flex items-start gap-2">
              <Star
                className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div
                  className={cn(
                    'text-sm font-medium capitalize truncate',
                    qualityColors[metrics.quality],
                  )}
                >
                  {metrics.quality}
                </div>
                <div className="text-xs text-muted-foreground">Quality</div>
              </div>
            </div>
          )}

          {/* Total Chunks (detailed only) */}
          {variant === 'detailed' && metrics.totalChunks !== undefined && (
            <div className="flex items-start gap-2">
              <FileText
                className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {metrics.totalChunks}
                </div>
                <div className="text-xs text-muted-foreground">Chunks</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default PerformanceMetrics;
