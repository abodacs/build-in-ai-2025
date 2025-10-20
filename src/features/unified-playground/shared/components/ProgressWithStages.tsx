/**
 * ProgressWithStages Component
 *
 * Multi-stage progress indicator with animations.
 * Shows progress through different stages with smooth transitions.
 *
 * Features:
 * - Visual stage indicators
 * - Animated transitions between stages
 * - Current stage highlighting
 * - ETA display
 * - Percentage-based progress
 *
 * @module shared/components/ProgressWithStages
 */

import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ProgressStage {
  /** Stage label */
  label: string;

  /** Percentage of total progress */
  percent: number;

  /** Stage description */
  description?: string;
}

export interface ProgressWithStagesProps {
  /** Current progress (0-100) */
  progress: number;

  /** Progress stages */
  stages: ProgressStage[];

  /** Current stage label */
  currentStage?: string;

  /** Show ETA */
  showETA?: boolean;

  /** Estimated time remaining (milliseconds) */
  estimatedTimeRemaining?: number;

  /** Additional CSS classes */
  className?: string;

  /** Compact mode (smaller) */
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Progress bar with stage indicators
 *
 * @example
 * ```tsx
 * <ProgressWithStages
 *   progress={65}
 *   stages={[
 *     { label: 'Preparing', percent: 10 },
 *     { label: 'Downloading model', percent: 80 },
 *     { label: 'Initializing', percent: 10 },
 *   ]}
 *   currentStage="Downloading model"
 *   showETA
 *   estimatedTimeRemaining={15000}
 * />
 * ```
 */
export function ProgressWithStages({
  progress,
  stages,
  currentStage,
  showETA = false,
  estimatedTimeRemaining,
  className,
  compact = false,
}: ProgressWithStagesProps) {
  // Calculate which stage we're in
  const currentStageIndex = getCurrentStageIndex(progress, stages);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Stage indicators */}
      {!compact && (
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => {
            const isComplete = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isPending = index > currentStageIndex;

            return (
              <div
                key={`${stage.label}-${index}`}
                className={cn(
                  'flex items-center gap-2 flex-1',
                  index < stages.length - 1 && 'relative',
                )}
              >
                {/* Stage icon */}
                <div
                  className={cn(
                    'flex items-center justify-center',
                    'transition-all duration-300',
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2
                      key={`complete-${index}`}
                      className={cn(
                        'w-5 h-5 text-green-500',
                        'animate-scaleIn',
                      )}
                    />
                  ) : isCurrent ? (
                    <Circle
                      key={`current-${index}`}
                      className={cn(
                        'w-5 h-5 text-blue-500',
                        'animate-pulse fill-current',
                      )}
                    />
                  ) : (
                    <Circle
                      key={`pending-${index}`}
                      className="w-5 h-5 text-muted-foreground/40"
                    />
                  )}
                </div>

                {/* Stage label */}
                <div
                  className={cn(
                    'text-xs font-medium transition-colors duration-300',
                    isComplete && 'text-green-600 dark:text-green-400',
                    isCurrent && 'text-blue-600 dark:text-blue-400',
                    isPending && 'text-muted-foreground/60',
                  )}
                >
                  {stage.label}
                </div>

                {/* Connection line */}
                {index < stages.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-[calc(100%-1rem)] h-0.5 w-full',
                      'transition-colors duration-500',
                      isComplete ? 'bg-green-500' : 'bg-muted-foreground/20',
                    )}
                    style={{ top: '0.625rem' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-2">
        {/* Current stage text and percentage */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {currentStage || stages[currentStageIndex]?.label || 'Processing'}
          </span>
          <span className="font-mono font-semibold">{progress}%</span>
        </div>

        {/* Progress bar */}
        <Progress
          value={progress}
          className={cn(
            'h-2 transition-all duration-300',
            progress < 100 && 'animate-pulse',
          )}
        />
      </div>

      {/* ETA */}
      {showETA && estimatedTimeRemaining !== undefined && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>ETA:</span>
          <span className="font-mono font-medium text-foreground">
            {formatTime(estimatedTimeRemaining)}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate current stage index based on progress
 */
function getCurrentStageIndex(
  progress: number,
  stages: ProgressStage[],
): number {
  let cumulativePercent = 0;

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    if (!stage) continue;

    cumulativePercent += stage.percent;
    if (progress <= cumulativePercent) {
      return i;
    }
  }

  return stages.length - 1;
}

/**
 * Format time in human-readable format
 */
function formatTime(milliseconds: number): string {
  if (milliseconds <= 0) return 'Calculating...';

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

// ============================================================================
// Export
// ============================================================================

export default ProgressWithStages;
