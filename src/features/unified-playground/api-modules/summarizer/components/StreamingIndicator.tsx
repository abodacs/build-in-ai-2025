/**
 * Streaming Indicator Component
 *
 * Visual indicator for real-time streaming summarization
 * Shows animated dots and streaming status
 *
 * @module StreamingIndicator
 */

import { Radio, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface StreamingIndicatorProps {
  /** Is currently streaming */
  isActive: boolean;

  /** Number of characters received */
  charactersReceived?: number;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// StreamingIndicator Component
// ============================================================================

/**
 * Streaming status indicator
 *
 * @example
 * ```tsx
 * <StreamingIndicator
 *   isActive={isStreaming}
 *   charactersReceived={result.length}
 * />
 * ```
 */
export function StreamingIndicator({
  isActive,
  charactersReceived = 0,
  className,
}: StreamingIndicatorProps) {
  if (!isActive) return null;

  return (
    <Card
      className={cn(
        'p-4 border-purple-200 bg-purple-50/50 animate-fadeIn',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Animated Icon */}
          <div className="relative">
            <Radio className="w-5 h-5 text-purple-600 animate-pulse" />
            <div className="absolute -top-0.5 -right-0.5">
              <Sparkles className="w-3 h-3 text-purple-500 animate-spin" />
            </div>
          </div>

          {/* Status Text */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-purple-900">
                Streaming Summary
              </span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" />
                <div
                  className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
            <p className="text-xs text-purple-700 mt-0.5">
              Generating summary in real-time...
            </p>
          </div>
        </div>

        {/* Character Count */}
        {charactersReceived > 0 && (
          <div className="text-right">
            <div className="text-xs text-slate-600 font-medium">
              {charactersReceived.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">characters</div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-1 bg-purple-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 animate-shimmer"
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      </div>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default StreamingIndicator;
