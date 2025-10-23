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
import { Streamdown } from 'streamdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';
import type { SummarizerMetrics } from '../types/summarizer.types';

// Register only needed languages for optimal bundle size
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('json', json);

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
// Markdown Components
// ============================================================================

/**
 * Custom markdown components for Streamdown
 * Provides syntax highlighting for code blocks
 */
const createMarkdownComponents = (
  isDarkMode: boolean,
): Partial<Components> => ({
  code: ({
    inline,
    className,
    children,
    ref: _ref,
    ...props
  }: React.ClassAttributes<HTMLElement> &
    React.HTMLAttributes<HTMLElement> & {
      inline?: boolean;
      node?: unknown;
    }) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match?.[1] ?? '';

    // Only support TypeScript, JavaScript, and JSON
    const supportedLanguages = [
      'typescript',
      'ts',
      'javascript',
      'js',
      'tsx',
      'jsx',
      'json',
    ];
    const normalizedLang = language.toLowerCase();
    const isSupported = supportedLanguages.includes(normalizedLang);

    if (!inline && isSupported) {
      const displayLang =
        normalizedLang === 'ts' || normalizedLang === 'tsx'
          ? 'typescript'
          : normalizedLang === 'js' || normalizedLang === 'jsx'
            ? 'javascript'
            : normalizedLang;

      return (
        <div className="relative group my-4">
          <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded z-10">
            {displayLang}
          </div>
          <SyntaxHighlighter
            language={displayLang}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={isDarkMode ? (oneDark as any) : (oneLight as any)}
            customStyle={{
              margin: 0,
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              padding: '1rem',
            }}
            showLineNumbers
            {...(props as React.HTMLAttributes<HTMLElement>)}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    }

    // Inline code or unsupported language
    if (!inline) {
      return (
        <pre className="bg-gray-800 dark:bg-gray-900 rounded p-4 overflow-x-auto my-4">
          <code className="text-sm text-gray-100" {...props}>
            {children}
          </code>
        </pre>
      );
    }

    return (
      <code
        className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm"
        {...props}
      >
        {children}
      </code>
    );
  },
});

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

  // Detect dark mode
  const isDarkMode = document.documentElement.classList.contains('dark');

  // Get custom markdown components
  const markdownComponents = createMarkdownComponents(isDarkMode);

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
          <div className="flex items-center touch-gap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={isStreaming}
              className="h-10 lg:h-8 text-xs tap-fast"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isStreaming}
              className="h-10 lg:h-8 text-xs tap-fast"
            >
              <Download className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Export</span>
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
        {/* Summary text with markdown support */}
        <div
          className={cn(
            'p-4 rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700',
            'prose prose-sm dark:prose-invert max-w-none',
            'text-slate-800 dark:text-gray-100 leading-relaxed tracking-tight',
            isStreaming && 'animate-pulse',
          )}
        >
          <Streamdown components={markdownComponents}>{result}</Streamdown>
        </div>

        {/* Performance metrics */}
        {showMetrics && formattedMetrics && !isStreaming && (
          <>
            <Separator className="my-4" />

            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
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
