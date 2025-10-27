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
import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';
import { isChromeInternalLink } from '@/utils/linkSanitizer';

// Register common languages for syntax highlighting
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);

// ============================================================================
// Markdown Components
// ============================================================================

/**
 * Custom markdown components for ReactMarkdown
 * Provides syntax highlighting for code blocks
 *
 * NOTE: chrome:// links are intentionally non-clickable
 * These URLs only work in Chrome's internal pages, not web browsers
 */
const createMarkdownComponents = (
  isDarkMode: boolean,
): Partial<Components> => ({
  // Use div instead of p to avoid invalid nesting of <pre> inside <p>
  p: ({ children, ...props }) => (
    <div className="my-2" {...props}>
      {children}
    </div>
  ),
  // Custom link handler: Prevent chrome:// links from being clickable
  a: ({ href, children, ...props }) => {
    if (isChromeInternalLink(href)) {
      return (
        <code className="text-blue-600 dark:text-blue-400">{children}</code>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline"
        {...props}
      >
        {children}
      </a>
    );
  },
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

    // Supported languages for syntax highlighting
    const supportedLanguages = [
      'typescript',
      'ts',
      'javascript',
      'js',
      'tsx',
      'jsx',
      'python',
      'py',
      'json',
      'bash',
      'sh',
    ];
    const normalizedLang = language.toLowerCase();
    const isSupported = supportedLanguages.includes(normalizedLang);

    if (!inline && isSupported) {
      const displayLang =
        normalizedLang === 'ts' || normalizedLang === 'tsx'
          ? 'typescript'
          : normalizedLang === 'js' || normalizedLang === 'jsx'
            ? 'javascript'
            : normalizedLang === 'py'
              ? 'python'
              : normalizedLang === 'sh'
                ? 'bash'
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

    // Inline code
    return (
      <code
        className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
});

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

  // Detect dark mode for syntax highlighting
  const isDarkMode = document.documentElement.classList.contains('dark');
  const markdownComponents = createMarkdownComponents(isDarkMode);

  /**
   * Sanitize content for safe display
   * Allows markdown tags but prevents XSS attacks
   */
  const sanitizedContent = useMemo(
    () =>
      content
        ? DOMPurify.sanitize(content, {
            ALLOWED_TAGS: [
              'p',
              'br',
              'strong',
              'em',
              'u',
              'span',
              'div',
              'h1',
              'h2',
              'h3',
              'h4',
              'h5',
              'h6',
              'ul',
              'ol',
              'li',
              'code',
              'pre',
              'blockquote',
              'a',
            ],
            ALLOWED_ATTR: ['class', 'href', 'rel', 'target'],
            ALLOW_DATA_ATTR: false,
          })
        : '',
    [content],
  );

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
            <ReactMarkdown components={markdownComponents}>
              {sanitizedContent}
            </ReactMarkdown>
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
