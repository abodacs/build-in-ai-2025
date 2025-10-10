/**
 * ComparisonStats Component
 *
 * Displays detailed comparison statistics between original and rewritten text.
 * Shows character counts, word counts, length changes, and quality indicators.
 *
 * @module rewriter/components/ComparisonStats
 */

import { useMemo } from 'react';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Hash,
  Type,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ComparisonStatsProps {
  /** Original text */
  originalText: string;

  /** Rewritten text */
  rewrittenText: string;

  /** Additional CSS classes */
  className?: string;
}

interface TextMetrics {
  characters: number;
  words: number;
  sentences: number;
  avgWordLength: number;
  avgSentenceLength: number;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calculate text metrics
 */
function calculateMetrics(text: string): TextMetrics {
  const characters = text.length;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Count sentences (approximate)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = sentences.length;

  // Calculate averages
  const avgWordLength =
    wordCount > 0
      ? words.reduce((sum, word) => sum + word.length, 0) / wordCount
      : 0;

  const avgSentenceLength =
    sentenceCount > 0 && wordCount > 0 ? wordCount / sentenceCount : 0;

  return {
    characters,
    words: wordCount,
    sentences: sentenceCount,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
  };
}

/**
 * Get readability category based on avg sentence length
 */
function getReadabilityCategory(avgSentenceLength: number): {
  label: string;
  color: string;
} {
  if (avgSentenceLength < 12) {
    return { label: 'Easy', color: 'text-green-600 dark:text-green-400' };
  } else if (avgSentenceLength < 18) {
    return { label: 'Moderate', color: 'text-blue-600 dark:text-blue-400' };
  } else if (avgSentenceLength < 25) {
    return { label: 'Complex', color: 'text-amber-600 dark:text-amber-400' };
  } else {
    return { label: 'Very Complex', color: 'text-red-600 dark:text-red-400' };
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * ComparisonStats component
 *
 * Shows detailed comparison between original and rewritten text.
 *
 * @example
 * ```tsx
 * <ComparisonStats
 *   originalText={originalInput}
 *   rewrittenText={content}
 * />
 * ```
 */
export function ComparisonStats({
  originalText,
  rewrittenText,
  className,
}: ComparisonStatsProps) {
  // Calculate metrics
  const { originalMetrics, rewrittenMetrics, deltas } = useMemo(() => {
    const original = calculateMetrics(originalText);
    const rewritten = calculateMetrics(rewrittenText);

    const deltas = {
      characters: rewritten.characters - original.characters,
      words: rewritten.words - original.words,
      sentences: rewritten.sentences - original.sentences,
      avgWordLength: rewritten.avgWordLength - original.avgWordLength,
      avgSentenceLength:
        rewritten.avgSentenceLength - original.avgSentenceLength,
      percentChange:
        original.characters > 0
          ? Math.round(
              ((rewritten.characters - original.characters) /
                original.characters) *
                100,
            )
          : 0,
    };

    return {
      originalMetrics: original,
      rewrittenMetrics: rewritten,
      deltas,
    };
  }, [originalText, rewrittenText]);

  const originalReadability = getReadabilityCategory(
    originalMetrics.avgSentenceLength,
  );
  const rewrittenReadability = getReadabilityCategory(
    rewrittenMetrics.avgSentenceLength,
  );

  const isExpanding = deltas.characters > 0;
  const isCondensing = deltas.characters < 0;
  const isUnchanged = deltas.characters === 0;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="w-4 h-4 text-primary" />
          Comparison Statistics
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Change Summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Overall Change</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                isExpanding ? 'default' : isCondensing ? 'secondary' : 'outline'
              }
              className={cn(
                'text-sm',
                isExpanding &&
                  'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
                isCondensing &&
                  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
              )}
            >
              {isExpanding && <TrendingUp className="w-3 h-3 mr-1" />}
              {isCondensing && <TrendingDown className="w-3 h-3 mr-1" />}
              {isUnchanged && <Minus className="w-3 h-3 mr-1" />}
              {deltas.percentChange > 0 ? '+' : ''}
              {deltas.percentChange}%
            </Badge>
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Characters */}
          <div className="space-y-2 p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Hash className="w-3 h-3" />
              <span>Characters</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Original</div>
                <div className="text-lg font-semibold font-mono">
                  {originalMetrics.characters.toLocaleString()}
                </div>
              </div>
              <div className="text-2xl text-muted-foreground/30">→</div>
              <div className="space-y-1 text-right">
                <div className="text-xs text-muted-foreground">Rewritten</div>
                <div className="text-lg font-semibold font-mono text-primary">
                  {rewrittenMetrics.characters.toLocaleString()}
                </div>
              </div>
            </div>
            {deltas.characters !== 0 && (
              <div
                className={cn(
                  'text-xs font-medium',
                  deltas.characters > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-blue-600 dark:text-blue-400',
                )}
              >
                {deltas.characters > 0 ? '+' : ''}
                {deltas.characters.toLocaleString()} chars
              </div>
            )}
          </div>

          {/* Words */}
          <div className="space-y-2 p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Type className="w-3 h-3" />
              <span>Words</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Original</div>
                <div className="text-lg font-semibold font-mono">
                  {originalMetrics.words.toLocaleString()}
                </div>
              </div>
              <div className="text-2xl text-muted-foreground/30">→</div>
              <div className="space-y-1 text-right">
                <div className="text-xs text-muted-foreground">Rewritten</div>
                <div className="text-lg font-semibold font-mono text-primary">
                  {rewrittenMetrics.words.toLocaleString()}
                </div>
              </div>
            </div>
            {deltas.words !== 0 && (
              <div
                className={cn(
                  'text-xs font-medium',
                  deltas.words > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-blue-600 dark:text-blue-400',
                )}
              >
                {deltas.words > 0 ? '+' : ''}
                {deltas.words.toLocaleString()} words
              </div>
            )}
          </div>

          {/* Sentences */}
          <div className="space-y-2 p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="w-3 h-3" />
              <span>Sentences</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Original</div>
                <div className="text-lg font-semibold font-mono">
                  {originalMetrics.sentences}
                </div>
              </div>
              <div className="text-2xl text-muted-foreground/30">→</div>
              <div className="space-y-1 text-right">
                <div className="text-xs text-muted-foreground">Rewritten</div>
                <div className="text-lg font-semibold font-mono text-primary">
                  {rewrittenMetrics.sentences}
                </div>
              </div>
            </div>
            {deltas.sentences !== 0 && (
              <div
                className={cn(
                  'text-xs font-medium',
                  deltas.sentences > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-blue-600 dark:text-blue-400',
                )}
              >
                {deltas.sentences > 0 ? '+' : ''}
                {deltas.sentences} sentences
              </div>
            )}
          </div>

          {/* Readability */}
          <div className="space-y-2 p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BarChart3 className="w-3 h-3" />
              <span>Readability</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Original</div>
                <div
                  className={cn(
                    'text-sm font-semibold',
                    originalReadability.color,
                  )}
                >
                  {originalReadability.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {originalMetrics.avgSentenceLength} words/sentence
                </div>
              </div>
              <div className="text-2xl text-muted-foreground/30">→</div>
              <div className="space-y-1 text-right">
                <div className="text-xs text-muted-foreground">Rewritten</div>
                <div
                  className={cn(
                    'text-sm font-semibold',
                    rewrittenReadability.color,
                  )}
                >
                  {rewrittenReadability.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {rewrittenMetrics.avgSentenceLength} words/sentence
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t">
          <div>
            <span className="font-medium">Avg word length:</span>{' '}
            {originalMetrics.avgWordLength} → {rewrittenMetrics.avgWordLength}{' '}
            chars
          </div>
          <div className="text-right">
            <span className="font-medium">Transformation:</span>{' '}
            {isExpanding
              ? 'Expanded'
              : isCondensing
                ? 'Condensed'
                : 'Maintained'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ComparisonStats;
