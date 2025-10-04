/**
 * SummarizerResults Component
 *
 * Display summarization results with metrics
 * Supports streaming, copy, export, and performance insights
 *
 * @module SummarizerResults
 */

import { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  Zap,
  TrendingDown,
  Clock,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { SummarizerMetrics } from '../types/summarizer.types';

// ============================================================================
// Types
// ============================================================================

export interface SummarizerResultsProps {
  /** Summary text */
  result: string;

  /** Is currently streaming */
  isStreaming?: boolean;

  /** Performance metrics */
  metrics?: SummarizerMetrics | null;

  /** Show metrics */
  showMetrics?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Copy handler */
  onCopy?: () => void;

  /** Export handler */
  onExport?: () => void;
}

// ============================================================================
// SummarizerResults Component
// ============================================================================

/**
 * Display summarization results
 *
 * @example
 * ```tsx
 * <SummarizerResults
 *   result={summary}
 *   isStreaming={isStreaming}
 *   metrics={metrics}
 *   showMetrics
 * />
 * ```
 */
export function SummarizerResults({
  result,
  isStreaming = false,
  metrics,
  showMetrics = true,
  className,
  onCopy,
  onExport,
}: SummarizerResultsProps) {
  // State
  const [copied, setCopied] = useState(false);

  /**
   * Copy to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      onCopy?.();

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  /**
   * Export as text file
   */
  const handleExport = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onExport?.();
  };

  /**
   * Format metrics
   */
  const formatMetrics = () => {
    if (!metrics) return null;

    return {
      processingTime: metrics.processingTime
        ? `${metrics.processingTime.toFixed(0)}ms`
        : metrics.averageTime
          ? `${metrics.averageTime.toFixed(0)}ms`
          : 'N/A',
      originalWords: metrics.originalWordCount?.toLocaleString() || 'N/A',
      summaryWords: metrics.summaryWordCount?.toLocaleString() || 'N/A',
      compressionRatio: metrics.compressionRatio
        ? `${metrics.compressionRatio.toFixed(1)}x`
        : 'N/A',
    };
  };

  const formattedMetrics = formatMetrics();

  return (
    <Card
      className={cn('border-green-200 bg-green-50/30 shadow-sm', className)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
            <CardTitle className="text-lg">
              {isStreaming ? 'Streaming Summary...' : 'Summary'}
            </CardTitle>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={isStreaming}
              className="text-xs"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isStreaming}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {isStreaming && (
          <CardDescription className="text-sm text-purple-600">
            Generating summary in real-time...
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary text */}
        <div
          className={cn(
            'p-4 rounded-lg bg-white border border-slate-200',
            'prose prose-sm max-w-none',
            isStreaming && 'animate-pulse',
          )}
        >
          <div className="whitespace-pre-wrap text-slate-800 leading-relaxed">
            {result}
          </div>
        </div>

        {/* Performance metrics */}
        {showMetrics && formattedMetrics && !isStreaming && (
          <>
            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Zap className="w-4 h-4 text-purple-600" />
                Performance Insights
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Processing Time */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Processing Time
                  </div>
                  <div className="text-lg font-semibold text-blue-900">
                    {formattedMetrics.processingTime}
                  </div>
                </div>

                {/* Compression Ratio */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Compression
                  </div>
                  <div className="text-lg font-semibold text-green-900">
                    {formattedMetrics.compressionRatio}
                  </div>
                </div>

                {/* Original Words */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <FileText className="w-3.5 h-3.5" />
                    Original
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    {formattedMetrics.originalWords}
                  </div>
                  <div className="text-[10px] text-slate-500">words</div>
                </div>

                {/* Summary Words */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="flex items-center gap-1.5 text-xs text-purple-600 font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    Summary
                  </div>
                  <div className="text-lg font-semibold text-purple-900">
                    {formattedMetrics.summaryWords}
                  </div>
                  <div className="text-[10px] text-purple-500">words</div>
                </div>
              </div>

              {/* Additional metrics */}
              {metrics && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {metrics.cacheHitRate > 0 && (
                    <Badge variant="outline" className="text-xs bg-white">
                      Cache Hit Rate: {(metrics.cacheHitRate * 100).toFixed(0)}%
                    </Badge>
                  )}

                  {metrics.chunksProcessed && metrics.chunksProcessed > 1 && (
                    <Badge variant="outline" className="text-xs bg-white">
                      Chunks Processed: {metrics.chunksProcessed}
                    </Badge>
                  )}

                  {metrics.streamingLatency &&
                    metrics.streamingLatency.length > 0 && (
                      <Badge variant="outline" className="text-xs bg-white">
                        Avg Chunk Latency:{' '}
                        {(
                          metrics.streamingLatency.reduce((a, b) => a + b, 0) /
                          metrics.streamingLatency.length
                        ).toFixed(0)}
                        ms
                      </Badge>
                    )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-purple-600">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-200" />
            </div>
            <span>Streaming in progress...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default SummarizerResults;
