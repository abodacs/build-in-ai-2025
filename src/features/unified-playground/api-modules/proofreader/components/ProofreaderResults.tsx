/**
 * ProofreaderResults Component
 *
 * Displays proofreading results with corrections and statistics.
 *
 * @module proofreader/components/ProofreaderResults
 */

import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Download, Copy, RefreshCw } from 'lucide-react';
import { CorrectionCard } from './CorrectionCard';
import type { ProofreadCorrection, CorrectionState } from '../types';
import { calculateCorrectionStats } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface ProofreaderResultsProps {
  /** Original text */
  originalText: string;

  /** Corrected text */
  correctedText: string;

  /** All corrections */
  corrections: ProofreadCorrection[];

  /** Correction states */
  correctionStates: CorrectionState[];

  /** Apply correction handler */
  onApplyCorrection: (index: number) => void;

  /** Ignore correction handler */
  onIgnoreCorrection: (index: number) => void;

  /** Apply all corrections handler */
  onApplyAll: () => void;

  /** Reset handler */
  onReset: () => void;

  /** Is disabled */
  disabled?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProofreaderResults component
 */
export function ProofreaderResults({
  originalText,
  correctedText,
  corrections,
  correctionStates,
  onApplyCorrection,
  onIgnoreCorrection,
  onApplyAll,
  onReset,
  disabled = false,
  className = '',
}: ProofreaderResultsProps) {
  const stats = calculateCorrectionStats(corrections, correctionStates);
  const hasPending = correctionStates.some((s) => s.state === 'pending');

  /**
   * Sanitize corrected text for safe display
   * Strip all HTML tags for plain text display
   */
  const sanitizedCorrectedText = useMemo(
    () => DOMPurify.sanitize(correctedText, { ALLOWED_TAGS: [] }),
    [correctedText],
  );

  // Download corrected text
  const handleDownload = () => {
    const blob = new Blob([correctedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'corrected-text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy corrected text
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(correctedText);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (corrections.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-fluid-lg font-semibold mb-2">
            No Corrections Needed!
          </h3>
          <p className="text-fluid-sm text-muted-foreground">
            Your text looks great. No errors or improvements found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-fluid-base">Corrections Found</CardTitle>
            <div className="flex items-center touch-gap">
              <Button
                onClick={onApplyAll}
                disabled={!hasPending || disabled}
                size="sm"
                className="h-10 lg:h-8 tap-fast"
              >
                <CheckCircle2 className="mr-2 h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Apply All</span>
              </Button>
              <Button
                onClick={onReset}
                disabled={disabled}
                size="sm"
                variant="outline"
                className="h-10 lg:h-8 tap-fast"
              >
                <RefreshCw className="mr-2 h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Total: {stats.total}</Badge>
            <Badge variant="outline">Applied: {stats.applied}</Badge>
            <Badge variant="outline">Ignored: {stats.ignored}</Badge>
            {stats.byType.grammar > 0 && (
              <Badge variant="destructive">
                Grammar: {stats.byType.grammar}
              </Badge>
            )}
            {stats.byType.spelling > 0 && (
              <Badge variant="destructive">
                Spelling: {stats.byType.spelling}
              </Badge>
            )}
            {stats.byType.punctuation > 0 && (
              <Badge variant="default">
                Punctuation: {stats.byType.punctuation}
              </Badge>
            )}
            {stats.byType.capitalization > 0 && (
              <Badge variant="secondary">
                Capitalization: {stats.byType.capitalization}
              </Badge>
            )}
            {stats.byType.preposition > 0 && (
              <Badge variant="secondary">
                Preposition: {stats.byType.preposition}
              </Badge>
            )}
            {stats.byType['missing-words'] > 0 && (
              <Badge variant="secondary">
                Missing Words: {stats.byType['missing-words']}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Corrected Text */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-fluid-base">Corrected Text</CardTitle>
            <div className="flex items-center touch-gap">
              <Button
                onClick={handleCopy}
                size="sm"
                variant="outline"
                className="h-10 lg:h-8 tap-fast"
              >
                <Copy className="mr-2 h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button
                onClick={handleDownload}
                size="sm"
                variant="outline"
                className="h-10 lg:h-8 tap-fast"
              >
                <Download className="mr-2 h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={sanitizedCorrectedText}
            readOnly
            className="min-h-[200px] font-mono text-sm"
            aria-label="Corrected text output"
          />
        </CardContent>
      </Card>

      {/* Correction Cards */}
      <div className="space-y-3">
        <h3 className="text-fluid-sm font-medium">Individual Corrections</h3>
        {correctionStates.map((state) => (
          <CorrectionCard
            key={state.index}
            correction={state.correction}
            index={state.index}
            state={state.state}
            onApply={() => onApplyCorrection(state.index)}
            onIgnore={() => onIgnoreCorrection(state.index)}
            disabled={disabled}
            originalText={originalText}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ProofreaderResults;
