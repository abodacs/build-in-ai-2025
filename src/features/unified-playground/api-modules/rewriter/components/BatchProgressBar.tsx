/**
 * BatchProgressBar Component
 *
 * Progress tracking display for batch rewriting operations.
 * Shows completion status, metrics, and estimated time remaining.
 *
 * @module rewriter/components/BatchProgressBar
 */

import { useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Pause,
  Play,
  StopCircle,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BatchProgress, BatchStatus } from '../types/batch.types';

// ============================================================================
// Types
// ============================================================================

export interface BatchProgressBarProps {
  /** Progress information */
  progress: BatchProgress;

  /** Overall status */
  status: BatchStatus;

  /** Additional CSS classes */
  className?: string;

  /** Show detailed metrics */
  showDetails?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format time in human-readable format
 */
function formatTime(milliseconds: number | null): string {
  if (milliseconds === null || milliseconds <= 0) return 'Calculating...';

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Get status color
 */
function getStatusColor(status: BatchStatus): string {
  switch (status) {
    case 'running':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
    case 'completed':
      return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
    case 'paused':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
    case 'cancelled':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300';
    case 'idle':
    default:
      return 'bg-muted text-muted-foreground';
  }
}

/**
 * Get status icon
 */
function getStatusIcon(status: BatchStatus) {
  switch (status) {
    case 'running':
      return <Play className="w-3 h-3" />;
    case 'completed':
      return <CheckCircle2 className="w-3 h-3" />;
    case 'paused':
      return <Pause className="w-3 h-3" />;
    case 'cancelled':
      return <StopCircle className="w-3 h-3" />;
    case 'idle':
    default:
      return null;
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * Batch progress bar component
 *
 * Displays real-time progress during batch operations.
 *
 * @example
 * ```tsx
 * <BatchProgressBar
 *   progress={batch.progress}
 *   status={batch.status}
 *   showDetails
 * />
 * ```
 */
export function BatchProgressBar({
  progress,
  status,
  className,
  showDetails = true,
}: BatchProgressBarProps) {
  // Calculate remaining items
  const remainingItems = useMemo(() => {
    return (
      progress.total - progress.completed - progress.failed - progress.cancelled
    );
  }, [progress]);

  return (
    <div
      className={cn(
        'rounded-lg border bg-gradient-to-r from-blue-50/50 to-purple-50/50',
        'dark:from-blue-950/20 dark:to-purple-950/20 p-4 space-y-3',
        'animate-in fade-in-50 duration-300',
        className,
      )}
    >
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === 'running' && (
            <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
          )}
          {status === 'completed' && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
          {status === 'paused' && <Pause className="w-4 h-4 text-yellow-500" />}
          {status === 'cancelled' && (
            <StopCircle className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm font-medium">
            {status === 'running' && 'Processing Batch'}
            {status === 'completed' && 'Batch Complete'}
            {status === 'paused' && 'Batch Paused'}
            {status === 'cancelled' && 'Batch Cancelled'}
            {status === 'idle' && 'Ready to Process'}
          </span>
        </div>

        <Badge className={cn('text-xs font-mono', getStatusColor(status))}>
          {getStatusIcon(status)}
          <span className="ml-1 capitalize">{status}</span>
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {progress.completed} / {progress.total} items
          </span>
          <span className="font-mono font-semibold">
            {progress.percentage}%
          </span>
        </div>

        <Progress
          value={progress.percentage}
          className={cn(
            'h-2 transition-all duration-300',
            status === 'running' && 'animate-pulse',
          )}
        />
      </div>

      {/* Detailed Metrics */}
      {showDetails && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Completed */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <CheckCircle2 className="w-3 h-3" />
              <span>Completed</span>
            </div>
            <div className="font-mono font-semibold text-green-600 dark:text-green-400">
              {progress.completed}
            </div>
          </div>

          {/* Failed */}
          {progress.failed > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <XCircle className="w-3 h-3" />
                <span>Failed</span>
              </div>
              <div className="font-mono font-semibold text-red-600 dark:text-red-400">
                {progress.failed}
              </div>
            </div>
          )}

          {/* Cancelled */}
          {progress.cancelled > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <StopCircle className="w-3 h-3" />
                <span>Cancelled</span>
              </div>
              <div className="font-mono font-semibold text-gray-600 dark:text-gray-400">
                {progress.cancelled}
              </div>
            </div>
          )}

          {/* Remaining */}
          {remainingItems > 0 && status !== 'completed' && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Remaining</span>
              </div>
              <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                {remainingItems}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Time Estimate and Throughput */}
      {status === 'running' && showDetails && (
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t text-xs">
          {/* Time Remaining */}
          {progress.estimatedTimeRemaining !== null && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>ETA:</span>
              <span className="font-mono font-medium text-foreground">
                {formatTime(progress.estimatedTimeRemaining)}
              </span>
            </div>
          )}

          {/* Throughput */}
          {progress.itemsPerSecond !== null && progress.itemsPerSecond > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="w-3.5 h-3.5" />
              <span>Speed:</span>
              <span className="font-mono font-medium text-foreground">
                {progress.itemsPerSecond.toFixed(2)} items/s
              </span>
            </div>
          )}
        </div>
      )}

      {/* Current Item Indicator */}
      {status === 'running' &&
        progress.currentIndex >= 0 &&
        progress.currentIndex < progress.total && (
          <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-75" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-150" />
            </div>
            <span>
              Processing item {progress.currentIndex + 1} of {progress.total}
            </span>
          </div>
        )}

      {/* Completion Message */}
      {status === 'completed' && (
        <div className="flex items-center gap-2 pt-2 border-t text-xs">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-green-600 dark:text-green-400 font-medium">
            All items processed successfully!
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default BatchProgressBar;
