/**
 * TranslatorResults Component
 * Side-by-side display of original and translated text
 */

import { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Copy,
  Download,
  RefreshCw,
  Check,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type TranslatorResultsProps, SUPPORTED_LANGUAGES } from '../types';

/**
 * TranslatorResults Component
 *
 * Displays translation results with:
 * - Side-by-side layout (original | translation)
 * - Streaming indicator
 * - Copy to clipboard
 * - Download as JSON
 * - Performance metrics
 * - RTL support
 */
export function TranslatorResults({
  originalText,
  translatedText,
  isStreaming,
  sourceLanguage: _sourceLanguage,
  targetLanguage,
  performance,
  onCopy,
  onDownload,
  onRetry,
}: TranslatorResultsProps) {
  const [copiedText, setCopiedText] = useState<
    'original' | 'translation' | null
  >(null);

  const targetInfo = SUPPORTED_LANGUAGES[targetLanguage];

  /**
   * Sanitize text for safe display
   */
  const sanitizedTranslation = useMemo(
    () => DOMPurify.sanitize(translatedText, { ALLOWED_TAGS: [] }),
    [translatedText],
  );

  /**
   * Handle copy to clipboard
   */
  const handleCopy = async (text: string, type: 'original' | 'translation') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      onCopy(text);

      // Reset after 2 seconds
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  /**
   * Format performance metrics
   */
  const formatPerformanceMetrics = () => {
    if (!performance) return null;

    const { translationLatency, throughput, cacheHit } = performance;

    return {
      latency: `${translationLatency}ms`,
      throughput: `${Math.round(throughput)} chars/s`,
      cacheHit,
    };
  };

  const perfMetrics = formatPerformanceMetrics();

  /**
   * Get quality indicator based on performance
   */
  const getQualityIndicator = () => {
    if (!performance) return null;

    const { translationLatency } = performance;

    if (translationLatency < 500) {
      return {
        label: 'Excellent',
        color: 'text-green-600',
        variant: 'default' as const,
      };
    } else if (translationLatency < 1500) {
      return {
        label: 'Good',
        color: 'text-blue-600',
        variant: 'secondary' as const,
      };
    } else {
      return {
        label: 'Fair',
        color: 'text-yellow-600',
        variant: 'secondary' as const,
      };
    }
  };

  const quality = getQualityIndicator();

  // Check if target language is RTL
  const isTargetRTL = targetInfo?.isRTL || false;

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🌍 Translation Results</h3>
        {isStreaming && (
          <Badge variant="secondary" className="gap-1 animate-pulse">
            <Zap className="h-3 w-3" />
            Streaming...
          </Badge>
        )}
      </div>

      {/* Translation Panel */}
      <Card className="relative overflow-hidden">
        <div className="border-b bg-muted/50 px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              {targetInfo?.flag} {targetInfo?.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(translatedText, 'translation')}
              className="h-7 gap-1 px-2"
              data-testid="copy-translation-btn"
              disabled={!translatedText || isStreaming}
            >
              {copiedText === 'translation' ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          <div
            className={cn(
              'min-h-[120px] whitespace-pre-wrap break-words text-sm',
              isTargetRTL && 'text-right direction-rtl',
            )}
            dir={isTargetRTL ? 'rtl' : 'ltr'}
            data-testid="translated-text"
          >
            {sanitizedTranslation ? (
              sanitizedTranslation
            ) : isStreaming ? (
              <span className="text-muted-foreground italic flex items-center gap-2">
                <Zap className="h-4 w-4 animate-pulse" />
                Translating...
              </span>
            ) : (
              <span className="text-muted-foreground italic">
                Translation will appear here
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {perfMetrics && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              {/* Latency */}
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Latency:{' '}
                  <span className="font-medium text-foreground">
                    {perfMetrics.latency}
                  </span>
                </span>
              </div>

              {/* Throughput */}
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Speed:{' '}
                  <span className="font-medium text-foreground">
                    {perfMetrics.throughput}
                  </span>
                </span>
              </div>

              {/* Cache Hit */}
              {perfMetrics.cacheHit && (
                <Badge variant="secondary" className="gap-1">
                  ⚡ Cached
                </Badge>
              )}

              {/* Quality */}
              {quality && (
                <Badge variant={quality.variant} className={quality.color}>
                  Quality: {quality.label}
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="gap-1"
                data-testid="download-btn"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-1"
                data-testid="retry-btn"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State Actions */}
      {!translatedText && !isStreaming && originalText && (
        <div className="flex justify-center">
          <Button
            variant="default"
            onClick={onRetry}
            className="gap-2"
            data-testid="translate-now-btn"
          >
            <Zap className="h-4 w-4" />
            Translate Now
          </Button>
        </div>
      )}
    </div>
  );
}
