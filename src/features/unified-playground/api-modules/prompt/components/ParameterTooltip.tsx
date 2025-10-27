/**
 * ParameterTooltip Component
 * Interactive tooltips for parameter configuration with examples and explanations
 *
 * @module ParameterTooltip
 */

import { ReactNode } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ParameterExample {
  /** Example input */
  input: string;

  /** Example output for low value */
  lowOutput: string;

  /** Example output for high value */
  highOutput: string;
}

export interface ParameterRange {
  /** Minimum value */
  min: number;

  /** Maximum value */
  max: number;

  /** Recommended minimum */
  recommendedMin?: number;

  /** Recommended maximum */
  recommendedMax?: number;
}

export interface ParameterTooltipProps {
  /** Parameter name (e.g., "Temperature", "Top K") */
  name: string;

  /** Current parameter value */
  value: number;

  /** Parameter value range */
  range: ParameterRange;

  /** Description of what this parameter does */
  description: string;

  /** Detailed explanation based on current value */
  currentValueExplanation: string;

  /** Example to demonstrate the parameter effect */
  example?: ParameterExample;

  /** Icon to show */
  icon?: ReactNode;

  /** Child element to wrap (trigger) */
  children: ReactNode;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get zone description based on value position in range
 */
function getZoneDescription(
  value: number,
  range: ParameterRange,
): {
  zone: 'low' | 'medium' | 'high';
  label: string;
  color: string;
} {
  const { min, max } = range;
  const normalizedValue = (value - min) / (max - min);

  if (normalizedValue < 0.33) {
    return {
      zone: 'low',
      label: 'Conservative',
      color: 'text-blue-600 dark:text-blue-400',
    };
  } else if (normalizedValue < 0.67) {
    return {
      zone: 'medium',
      label: 'Balanced',
      color: 'text-green-600 dark:text-green-400',
    };
  } else {
    return {
      zone: 'high',
      label: 'Adventurous',
      color: 'text-purple-600 dark:text-purple-400',
    };
  }
}

/**
 * Format value for display
 */
function formatValue(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(2);
}

// ============================================================================
// ParameterTooltip Component
// ============================================================================

/**
 * Interactive tooltip showing parameter effects and examples
 *
 * @example
 * ```tsx
 * <ParameterTooltip
 *   name="Temperature"
 *   value={0.8}
 *   range={{ min: 0, max: 1 }}
 *   description="Controls randomness in output generation"
 *   currentValueExplanation="Balanced creativity and consistency"
 *   example={{
 *     input: "The sky is",
 *     lowOutput: "blue",
 *     highOutput: "a canvas of endless azure"
 *   }}
 * >
 *   <Slider ... />
 * </ParameterTooltip>
 * ```
 */
export function ParameterTooltip({
  name,
  value,
  range,
  description,
  currentValueExplanation,
  example,
  icon,
  children,
  className,
}: ParameterTooltipProps) {
  const zone = getZoneDescription(value, range);
  const percentage = ((value - range.min) / (range.max - range.min)) * 100;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className={className}>{children}</div>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-80"
        side="top"
        align="start"
        sideOffset={5}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{name}</h4>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>

          {/* Current Value */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Current Value
              </span>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-semibold', zone.color)}>
                  {zone.label}
                </span>
                <span className="text-sm font-mono font-bold">
                  {formatValue(value)}
                </span>
              </div>
            </div>

            {/* Visual Range Indicator */}
            <div className="relative h-1.5 w-full bg-gradient-to-r from-blue-200 via-green-200 to-purple-200 dark:from-blue-900/50 dark:via-green-900/50 dark:to-purple-900/50 rounded-full">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full shadow-md transition-all duration-200"
                style={{ left: `calc(${percentage}% - 6px)` }}
              />
            </div>

            {/* Range Labels */}
            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
              <span>{formatValue(range.min)}</span>
              <span>{formatValue(range.max)}</span>
            </div>
          </div>

          {/* Current Value Explanation */}
          <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              💡 {currentValueExplanation}
            </p>
          </div>

          {/* Example Comparison (if provided) */}
          {example && (
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-muted-foreground">
                Example Comparison
              </h5>

              {/* Input */}
              <div className="text-xs">
                <span className="font-medium">Input: </span>
                <span className="text-muted-foreground">{example.input}</span>
              </div>

              {/* Low vs High Outputs */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Low */}
                <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                    Low ({formatValue(range.min)})
                  </div>
                  <div className="text-muted-foreground italic">
                    &quot;{example.lowOutput}&quot;
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    More predictable
                  </div>
                </div>

                {/* High */}
                <div className="p-2 rounded bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
                  <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">
                    High ({formatValue(range.max)})
                  </div>
                  <div className="text-muted-foreground italic">
                    &quot;{example.highOutput}&quot;
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    More creative
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Range (if provided) */}
          {(range.recommendedMin !== undefined ||
            range.recommendedMax !== undefined) && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Recommended: </span>
              {range.recommendedMin !== undefined &&
                formatValue(range.recommendedMin)}
              {range.recommendedMin !== undefined &&
                range.recommendedMax !== undefined &&
                ' - '}
              {range.recommendedMax !== undefined &&
                formatValue(range.recommendedMax)}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ParameterTooltip;
