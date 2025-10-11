/**
 * WriterResults Component
 *
 * Displays generated content from Writer API.
 * Shows content with streaming support, performance metrics, and actions.
 *
 * @module writer/components/WriterResults
 */

import { FileText, Copy, Download, RotateCw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  StreamingIndicator,
  PerformanceMetricsDisplay,
} from '../../shared/components';
import { cn } from '@/lib/utils';
import type { PerformanceMetrics } from '../../shared/types';
import { useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface WriterResultsProps {
  /** Generated content */
  content: string | null;

  /** Is currently generating */
  isWriting: boolean;

  /** Is streaming */
  isStreaming: boolean;

  /** Performance metrics */
  metrics: PerformanceMetrics | null;

  /** Copy action handler */
  onCopy?: () => void;

  /** Download action handler */
  onDownload?: () => void;

  /** Retry action handler */
  onRetry?: () => void;

  /** Cancel streaming handler */
  onCancel?: () => void;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Writer results display component
 *
 * Shows generated content with streaming support, performance metrics,
 * and action buttons for copy, download, and retry.
 *
 * @example
 * ```tsx
 * <WriterResults
 *   content={generatedContent}
 *   isWriting={isWriting}
 *   isStreaming={isStreaming}
 *   metrics={metrics}
 *   onCopy={() => navigator.clipboard.writeText(generatedContent)}
 *   onDownload={() => downloadAsFile(generatedContent)}
 *   onRetry={handleRetry}
 * />
 * ```
 */
export function WriterResults({
  content,
  isWriting,
  isStreaming,
  metrics,
  onCopy,
  onDownload,
  onRetry,
  onCancel,
  className,
}: WriterResultsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasContent = content && content.trim().length > 0;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            Generated Content
          </CardTitle>

          {/* Streaming Indicator */}
          {isStreaming && (
            <StreamingIndicator
              text="Generating..."
              variant="compact"
              showCancel={!!onCancel}
              onCancel={onCancel}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content Display - Show content when available */}
        {hasContent && (
          <div
            className={cn(
              'min-h-[200px] p-4 rounded-lg border bg-muted/30',
              'prose prose-sm max-w-none dark:prose-invert',
              'overflow-auto max-h-[500px]',
            )}
          >
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {content}
            </div>
          </div>
        )}

        {/* Empty State - Show when no content and not generating */}
        {!hasContent && !isWriting && (
          <div className="flex items-center justify-center h-[200px] p-4 rounded-lg border bg-muted/30">
            <div className="text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Generated content will appear here</p>
              <p className="text-xs mt-1">
                Enter a prompt and click Generate to start
              </p>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {metrics && hasContent && !isWriting && (
          <PerformanceMetricsDisplay
            metrics={metrics}
            variant="compact"
            showQuality
          />
        )}

        {/* Action Buttons */}
        {hasContent && !isWriting && (
          <div className="flex flex-wrap gap-2">
            {onCopy && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </Button>
            )}

            {onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            )}

            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-1.5"
              >
                <RotateCw className="w-4 h-4" />
                <span className="hidden sm:inline">Regenerate</span>
              </Button>
            )}
          </div>
        )}

        {/* Success Message */}
        {hasContent && !isWriting && metrics && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-xs text-green-800 dark:text-green-200">
              Content generated successfully in {metrics.duration}ms
              {metrics.words && ` • ${metrics.words} words`}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default WriterResults;
