/**
 * RewriterResults Component
 *
 * Displays rewriter results with before/after comparison and diff view.
 * Includes performance metrics and action buttons.
 *
 * @module rewriter/components/RewriterResults
 */

import { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import {
  FileOutput,
  Copy,
  Check,
  Download,
  RotateCcw,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  StreamingIndicator,
  PerformanceMetricsDisplay,
  ContentRewritingSkeleton,
} from '../../shared/components';
import { DiffHighlight } from './DiffHighlight';
import { StreamingMetrics } from './StreamingMetrics';
import { ComparisonStats } from './ComparisonStats';
import { calculateDiffResult, getDiffSummary } from '../utils/diffCalculator';
import { cn } from '@/lib/utils';
import type { PerformanceMetrics } from '../../shared/types';

// ============================================================================
// Types
// ============================================================================

export interface RewriterResultsProps {
  /** Original input text */
  originalText: string | null;

  /** Rewritten content */
  content: string | null;

  /** Is rewriting in progress */
  isRewriting: boolean;

  /** Is streaming */
  isStreaming: boolean;

  /** Performance metrics */
  metrics: PerformanceMetrics | null;

  /** Copy original text handler */
  onCopyOriginal?: () => void;

  /** Copy rewritten text handler */
  onCopyRewritten?: () => void;

  /** Download handler */
  onDownload?: () => void;

  /** Retry handler */
  onRetry?: () => void;

  /** Cancel handler (for streaming) */
  onCancel?: () => void;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Rewriter results component
 *
 * Comprehensive results display with multiple view modes:
 * - Original: Shows input text
 * - Rewritten: Shows output text
 * - Diff: Shows inline differences
 *
 * @example
 * ```tsx
 * <RewriterResults
 *   originalText={originalInput}
 *   content={rewrittenContent}
 *   isRewriting={isRewriting}
 *   isStreaming={isStreaming}
 *   metrics={metrics}
 *   onCopyOriginal={handleCopyOriginal}
 *   onCopyRewritten={handleCopyRewritten}
 *   onDownload={handleDownload}
 *   onRetry={handleRetry}
 * />
 * ```
 */
export function RewriterResults({
  originalText,
  content,
  isRewriting,
  isStreaming,
  metrics,
  onCopyOriginal,
  onCopyRewritten,
  onDownload,
  onRetry,
  onCancel,
  className,
}: RewriterResultsProps) {
  const [activeTab, setActiveTab] = useState<'original' | 'rewritten' | 'diff'>(
    'rewritten',
  );
  const [recentlyCopied, setRecentlyCopied] = useState<
    'rewritten' | 'original' | null
  >(null);

  // Calculate diff
  const diffResult = useMemo(() => {
    if (!originalText || !content) {
      return null;
    }
    return calculateDiffResult(originalText, content);
  }, [originalText, content]);

  /**
   * Sanitize original and rewritten text for safe display
   * Strip all HTML tags for plain text display
   */
  const sanitizedOriginalText = useMemo(
    () =>
      originalText
        ? DOMPurify.sanitize(originalText, { ALLOWED_TAGS: [] })
        : '',
    [originalText],
  );

  const sanitizedContent = useMemo(
    () => (content ? DOMPurify.sanitize(content, { ALLOWED_TAGS: [] }) : ''),
    [content],
  );

  console.log('Diff Result::::content', content); // Debug log
  console.log('Diff Result::::originalText', originalText); // Debug log

  /**
   * Handle copy rewritten with visual feedback
   */
  const handleCopyRewritten = async () => {
    setRecentlyCopied('rewritten');
    await onCopyRewritten?.();
    setTimeout(() => setRecentlyCopied(null), 2000);
  };

  /**
   * Handle copy original with visual feedback
   */
  const handleCopyOriginal = async () => {
    setRecentlyCopied('original');
    await onCopyOriginal?.();
    setTimeout(() => setRecentlyCopied(null), 2000);
  };

  // Don't show anything if no content yet
  if (!content && !isRewriting) {
    return null;
  }

  const hasContent = content && content.length > 0;
  const lengthChange = diffResult
    ? diffResult.stats.rewrittenLength - diffResult.stats.originalLength
    : 0;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-fluid-base sm:text-fluid-lg">
              <FileOutput className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              Results
              {isStreaming && <StreamingIndicator />}
            </CardTitle>
            <CardDescription className="text-fluid-xs sm:text-fluid-sm mt-1">
              {diffResult && (
                <span className="flex items-center gap-2">
                  {lengthChange > 0 && (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span>Expanded by {lengthChange} characters</span>
                    </>
                  )}
                  {lengthChange < 0 && (
                    <>
                      <TrendingDown className="w-3 h-3 text-blue-500" />
                      <span>
                        Condensed by {Math.abs(lengthChange)} characters
                      </span>
                    </>
                  )}
                  {lengthChange === 0 && (
                    <>
                      <Minus className="w-3 h-3 text-gray-500" />
                      <span>Length unchanged</span>
                    </>
                  )}
                  {diffResult.stats.percentChanged > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 ml-2">
                      {diffResult.stats.percentChanged}% modified
                    </Badge>
                  )}
                </span>
              )}
            </CardDescription>
          </div>

          {/* Action Buttons */}
          {hasContent && !isRewriting && (
            <div className="flex items-center touch-gap">
              {onCopyRewritten && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyRewritten}
                  disabled={recentlyCopied === 'rewritten'}
                  className={cn(
                    'h-10 lg:h-8 px-2 sm:px-3 tap-fast transition-all',
                    recentlyCopied === 'rewritten' && 'text-green-600',
                  )}
                  title={
                    recentlyCopied === 'rewritten'
                      ? 'Copied!'
                      : 'Copy rewritten text'
                  }
                >
                  {recentlyCopied === 'rewritten' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline ml-1.5 text-xs">
                    {recentlyCopied === 'rewritten' ? 'Copied!' : 'Copy'}
                  </span>
                </Button>
              )}

              {onCopyOriginal && originalText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyOriginal}
                  disabled={recentlyCopied === 'original'}
                  className={cn(
                    'h-10 lg:h-8 px-2 sm:px-3 tap-fast transition-all',
                    recentlyCopied === 'original' && 'text-green-600',
                  )}
                  title={
                    recentlyCopied === 'original'
                      ? 'Copied!'
                      : 'Copy original text'
                  }
                >
                  {recentlyCopied === 'original' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="hidden sm:inline ml-1.5 text-xs">
                    {recentlyCopied === 'original' ? 'Copied!' : 'Original'}
                  </span>
                </Button>
              )}

              {onDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDownload}
                  className="h-10 lg:h-8 px-2 tap-fast"
                  title="Download as file"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}

              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="h-10 lg:h-8 px-2 tap-fast"
                  title="Retry rewrite"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {isStreaming && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-10 lg:h-8 px-2 tap-fast"
              title="Cancel streaming"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Real-time Streaming Metrics */}
        {isStreaming && hasContent && originalText && (
          <StreamingMetrics
            originalText={originalText}
            streamingContent={content || ''}
            isStreaming={isStreaming}
          />
        )}

        {/* Tabs for different views */}
        {hasContent && originalText && !isStreaming && (
          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(v as 'original' | 'rewritten' | 'diff')
            }
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="rewritten"
                className="text-fluid-xs sm:text-fluid-sm"
              >
                Rewritten
              </TabsTrigger>
              <TabsTrigger
                value="original"
                className="text-fluid-xs sm:text-fluid-sm"
              >
                Original
              </TabsTrigger>
              <TabsTrigger
                value="diff"
                className="text-fluid-xs sm:text-fluid-sm"
              >
                Diff View
              </TabsTrigger>
            </TabsList>

            {/* Rewritten View */}
            <TabsContent value="rewritten" className="mt-4">
              <div className="rounded-md border bg-muted/30 p-4">
                <div className="font-mono text-fluid-sm whitespace-pre-wrap break-words">
                  {sanitizedContent}
                </div>
              </div>
            </TabsContent>

            {/* Original View */}
            <TabsContent value="original" className="mt-4">
              <div className="rounded-md border bg-muted/30 p-4">
                <div className="font-mono text-fluid-sm whitespace-pre-wrap break-words text-muted-foreground">
                  {sanitizedOriginalText}
                </div>
              </div>
            </TabsContent>

            {/* Diff View */}
            <TabsContent value="diff" className="mt-4">
              <div className="rounded-md border bg-muted/30 p-4">
                {diffResult && (
                  <>
                    <div className="mb-3 text-xs text-muted-foreground">
                      {getDiffSummary(diffResult.stats)}
                    </div>
                    <DiffHighlight
                      segments={diffResult.segments}
                      showRemoved
                      showAdded
                    />
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Loading State - Show skeleton while rewriting without content */}
        {isRewriting && !hasContent && (
          <ContentRewritingSkeleton
            text={
              isStreaming ? 'Rewriting content...' : 'Preparing to rewrite...'
            }
            showCancel={!!onCancel}
            onCancel={onCancel}
            variant="stacked"
          />
        )}

        {/* Streaming content (before complete) - Show streaming content with progress */}
        {isStreaming && hasContent && (
          <div className="rounded-md border bg-muted/30 p-4">
            <div className="font-mono text-sm whitespace-pre-wrap break-words">
              {sanitizedContent}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {metrics && !isRewriting && (
          <div className="pt-4 border-t">
            <PerformanceMetricsDisplay metrics={metrics} variant="compact" />
          </div>
        )}

        {/* Comparison Statistics */}
        {hasContent && originalText && !isRewriting && (
          <div className="pt-4">
            <ComparisonStats
              originalText={originalText}
              rewrittenText={content}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default RewriterResults;
