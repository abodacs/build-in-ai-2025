/**
 * TokenVisualization Component
 * Real-time token counter with progress bar and breakdown details
 *
 * @module TokenVisualization
 */

import { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface TokenBreakdown {
  /** System prompt tokens */
  systemPromptTokens: number;

  /** Current user input tokens */
  inputTokens: number;

  /** Estimated response tokens */
  estimatedResponseTokens: number;

  /** Total tokens used */
  totalTokens: number;

  /** Maximum tokens allowed (context window limit, e.g., 6144 for Gemini Nano) */
  maxTokens: number;
}

export interface TokenVisualizationProps {
  /** Token breakdown data */
  breakdown: TokenBreakdown;

  /** Additional CSS classes */
  className?: string;

  /** Show detailed breakdown by default */
  defaultExpanded?: boolean;

  /** Whether token count is measured (true) or estimated (false) */
  isMeasured?: boolean;

  /** Whether quota overflow occurred */
  quotaExceeded?: boolean;

  /** Callback when user requests token reduction */
  onOptimize?: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get color based on token usage percentage
 */
function getUsageColor(percentage: number): {
  text: string;
  bg: string;
  progress: string;
} {
  if (percentage < 50) {
    return {
      text: 'text-green-700 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
      progress: 'bg-green-500',
    };
  } else if (percentage < 75) {
    return {
      text: 'text-yellow-700 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      progress: 'bg-yellow-500',
    };
  } else if (percentage < 90) {
    return {
      text: 'text-orange-700 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      progress: 'bg-orange-500',
    };
  } else {
    return {
      text: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
      progress: 'bg-red-500',
    };
  }
}

/**
 * Get performance hint based on token usage
 */
function getPerformanceHint(percentage: number): string | null {
  if (percentage < 50) {
    return 'Optimal - Fast response expected';
  } else if (percentage < 75) {
    return 'Good - Response may be slightly slower';
  } else if (percentage < 90) {
    return 'High - Consider reducing prompt length';
  } else if (percentage < 100) {
    return 'Critical - Very close to limit, response may fail';
  } else {
    return 'Exceeded - Reduce prompt to continue';
  }
}

/**
 * Format token count to readable string
 */
function formatTokens(tokens: number): string {
  if (tokens < 1000) {
    return tokens.toString();
  } else {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
}

// ============================================================================
// TokenVisualization Component
// ============================================================================

/**
 * Real-time token visualization with breakdown and progress bar
 *
 * @example
 * ```tsx
 * <TokenVisualization
 *   breakdown={{
 *     systemPromptTokens: 24,
 *     inputTokens: 156,
 *     estimatedResponseTokens: 200,
 *     totalTokens: 380,
 *     maxTokens: 1024,
 *   }}
 *   onOptimize={() => console.log('Optimize requested')}
 * />
 * ```
 */
export function TokenVisualization({
  breakdown,
  className,
  defaultExpanded = false,
  isMeasured = false,
  quotaExceeded: _quotaExceeded = false,
  onOptimize,
}: TokenVisualizationProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const percentage = (breakdown.totalTokens / breakdown.maxTokens) * 100;
  const colors = getUsageColor(percentage);
  const hint = getPerformanceHint(percentage);
  const isNearLimit = percentage >= 75;
  const isOverLimit = percentage >= 100;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Main Token Display */}
      <div className="flex items-center justify-between gap-3">
        {/* Token Count Badge */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-sm transition-colors',
                    colors.bg,
                    colors.text,
                  )}
                >
                  <span>
                    {formatTokens(breakdown.totalTokens)} /{' '}
                    {formatTokens(breakdown.maxTokens)} tokens
                  </span>
                  <Info className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p className="font-medium">Context Window Usage</p>
                  <p>1 token ≈ 4 characters or 0.75 words</p>
                  <p className="text-muted-foreground">
                    {Math.round(percentage)}% of total conversation limit (
                    {formatTokens(breakdown.maxTokens)} tokens)
                  </p>
                  <p className="text-xs mt-1 text-slate-500">
                    {isMeasured
                      ? '📊 Real-time measurement from Chrome AI API'
                      : '📐 Estimated based on character count'}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Measurement Source Badge */}
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-md font-medium',
              isMeasured
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-100 text-slate-600',
            )}
          >
            {isMeasured ? 'Measured' : 'Estimated'}
          </span>

          {/* Performance Hint */}
          {hint && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      isOverLimit
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : isNearLimit
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                    )}
                  >
                    {isOverLimit
                      ? 'Limit Exceeded'
                      : `${Math.round(percentage)}%`}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{hint}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-7 text-xs gap-1"
          aria-label={
            isExpanded ? 'Hide token breakdown' : 'Show token breakdown'
          }
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Hide
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Details
            </>
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className={cn(
              'h-full transition-all duration-300',
              colors.progress,
            )}
            style={{
              width: `${Math.min(percentage, 100)}%`,
              ...(isOverLimit && {
                animation:
                  'tokenLimitPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                willChange: 'opacity',
              }),
            }}
          />
        </div>
        {isOverLimit && (
          <p className="text-xs text-red-600 dark:text-red-400">
            Prompt exceeds maximum token limit
          </p>
        )}
      </div>

      {/* Detailed Breakdown (Expandable) */}
      {isExpanded && (
        <div
          className={cn(
            'p-3 rounded-lg border text-xs space-y-2 animate-fadeInDown',
            'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800',
          )}
        >
          <div className="space-y-1.5">
            {/* System Prompt */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">System Prompt:</span>
              <span className="font-mono font-medium">
                {breakdown.systemPromptTokens} tokens
              </span>
            </div>

            {/* User Input */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Your Input:</span>
              <span className="font-mono font-medium">
                {breakdown.inputTokens} tokens
              </span>
            </div>

            {/* Estimated Response */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Est. Response:</span>
              <span className="font-mono font-medium text-gray-500">
                ~{breakdown.estimatedResponseTokens} tokens
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 dark:border-gray-700 my-2" />

            {/* Total */}
            <div className="flex justify-between items-center font-medium">
              <span>Total:</span>
              <span className={cn('font-mono', colors.text)}>
                {breakdown.totalTokens} / {breakdown.maxTokens} tokens
              </span>
            </div>
          </div>

          {/* Performance Tips */}
          <div className="pt-2 border-t border-gray-300 dark:border-gray-700">
            <p className="text-muted-foreground mb-2">💡 Performance Tips:</p>
            <ul className="space-y-1 text-muted-foreground ml-4 list-disc">
              <li>Shorter prompts = faster responses</li>
              <li>Keep context under 75% for best results</li>
              {isNearLimit && (
                <li className="text-orange-600 dark:text-orange-400 font-medium">
                  Consider reducing your prompt length
                </li>
              )}
            </ul>

            {/* Optimize Button */}
            {isNearLimit && onOptimize && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOptimize}
                className="mt-3 w-full text-xs h-8"
              >
                Optimize Prompt
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default TokenVisualization;
