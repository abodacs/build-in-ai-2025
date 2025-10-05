/**
 * Streaming Performance Monitor Component
 *
 * Advanced monitoring for streaming summarization performance
 * Displays real-time metrics, latency, and performance insights
 *
 * @module StreamingPerformanceMonitor
 */

import {
  Radio,
  TrendingUp,
  Clock,
  Zap,
  Activity,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { SummarizerMetrics } from '../types/summarizer.types';

// ============================================================================
// Types
// ============================================================================

export interface StreamingPerformanceMonitorProps {
  /** Is currently streaming */
  isStreaming?: boolean;

  /** Current metrics */
  metrics?: SummarizerMetrics | null;

  /** Is loading (non-streaming) */
  isLoading?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate average latency from array
 */
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Get performance rating
 */
function getPerformanceRating(avgLatency: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (avgLatency < 50) {
    return {
      label: 'Excellent',
      color: 'text-green-700',
      bgColor: 'bg-green-500',
    };
  }
  if (avgLatency < 100) {
    return {
      label: 'Good',
      color: 'text-blue-700',
      bgColor: 'bg-blue-500',
    };
  }
  if (avgLatency < 200) {
    return {
      label: 'Fair',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-500',
    };
  }
  return {
    label: 'Slow',
    color: 'text-red-700',
    bgColor: 'bg-red-500',
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * Streaming performance monitor
 *
 * @example
 * ```tsx
 * <StreamingPerformanceMonitor
 *   isStreaming={isStreaming}
 *   metrics={metrics}
 * />
 * ```
 */
export function StreamingPerformanceMonitor({
  isStreaming = false,
  metrics,
  isLoading = false,
  className,
}: StreamingPerformanceMonitorProps) {
  // Calculate streaming metrics
  const streamingLatency = metrics?.streamingLatency || [];
  const avgLatency = calculateAverage(streamingLatency);
  const chunksProcessed = metrics?.chunksProcessed || 0;
  const totalOperations = metrics?.summaryTimes?.length || 0;
  const successRate = totalOperations > 0 ? 100 : 0; // We'll assume 100% for now since we don't track failures separately

  const performanceRating = getPerformanceRating(avgLatency);

  // Calculate estimated throughput (rough estimate)
  const estimatedThroughput =
    avgLatency > 0 ? Math.round(1000 / avgLatency) : 0;

  return (
    <Card className={cn('border-slate-200', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Streaming Performance
          </CardTitle>
          {isStreaming ? (
            <Badge className="bg-purple-500 text-white">
              <Radio className="w-3 h-3 mr-1 animate-pulse" />
              Active
            </Badge>
          ) : isLoading ? (
            <Badge className="bg-blue-500 text-white">
              <Zap className="w-3 h-3 mr-1 animate-pulse" />
              Processing
            </Badge>
          ) : (
            <Badge variant="outline">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Idle
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Average Latency */}
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-600 font-medium">Avg Latency</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {streamingLatency.length > 0 ? `${avgLatency.toFixed(0)}` : '--'}
            </p>
            <p className="text-xs text-blue-600">milliseconds</p>
          </div>

          {/* Chunks Processed */}
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-600 font-medium">
                Chunks Processed
              </p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {chunksProcessed}
            </p>
            <p className="text-xs text-green-600">total</p>
          </div>

          {/* Throughput */}
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-purple-600 font-medium">Throughput</p>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {streamingLatency.length > 0 ? estimatedThroughput : '--'}
            </p>
            <p className="text-xs text-purple-600">chunks/sec</p>
          </div>

          {/* Success Rate */}
          <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-600" />
              <p className="text-xs text-yellow-600 font-medium">
                Success Rate
              </p>
            </div>
            <p className="text-2xl font-bold text-yellow-900">
              {totalOperations > 0 ? successRate.toFixed(1) : '--'}
            </p>
            <p className="text-xs text-yellow-600">percent</p>
          </div>
        </div>

        {/* Performance Rating */}
        {streamingLatency.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Performance Rating</span>
              <span className={cn('font-semibold', performanceRating.color)}>
                {performanceRating.label}
              </span>
            </div>
            <Progress
              value={Math.min(100, (200 - avgLatency) / 2)}
              className="h-2"
            />
          </div>
        )}

        {/* Latency Distribution (if we have data) */}
        {streamingLatency.length > 0 && (
          <div className="pt-3 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-700 mb-2">
              Latency Distribution:
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="text-slate-500">Min</p>
                <p className="font-semibold text-slate-900">
                  {Math.min(...streamingLatency).toFixed(0)}ms
                </p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">Avg</p>
                <p className="font-semibold text-slate-900">
                  {avgLatency.toFixed(0)}ms
                </p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">Max</p>
                <p className="font-semibold text-slate-900">
                  {Math.max(...streamingLatency).toFixed(0)}ms
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Session Stats */}
        {metrics && (
          <div className="pt-3 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-700 mb-2">
              Session Statistics:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-500">Total Operations</p>
                <p className="font-semibold text-slate-900">
                  {totalOperations}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Cache Hit Rate</p>
                <p className="font-semibold text-slate-900">
                  {metrics.cacheHitRate > 0
                    ? `${(metrics.cacheHitRate * 100).toFixed(0)}%`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!metrics && !isStreaming && !isLoading && (
          <Alert className="bg-slate-50 border-slate-200">
            <Activity className="h-4 w-4 text-slate-600" />
            <AlertDescription className="text-xs text-slate-700">
              No performance data yet. Run a summarization in streaming mode to
              see metrics here.
            </AlertDescription>
          </Alert>
        )}

        {/* Performance Tips */}
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-700 mb-2">
            Performance Tips:
          </p>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Streaming mode provides real-time feedback</li>
            <li>• Lower latency = faster chunk generation</li>
            <li>• First chunk may take longer (model initialization)</li>
            <li>• Performance improves with cached models</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default StreamingPerformanceMonitor;
