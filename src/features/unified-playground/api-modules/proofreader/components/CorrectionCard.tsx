/**
 * CorrectionCard Component
 *
 * Displays an individual correction with accept/ignore actions.
 *
 * @module proofreader/components/CorrectionCard
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProofreadCorrection, CorrectionType } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface CorrectionCardProps {
  /** Correction data */
  correction: ProofreadCorrection;

  /** Correction index */
  index: number;

  /** Current state */
  state: 'pending' | 'applied' | 'ignored';

  /** Apply handler */
  onApply: () => void;

  /** Ignore handler */
  onIgnore: () => void;

  /** Original text (for extracting the original substring) */
  originalText?: string;

  /** Is disabled */
  disabled?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function getCorrectionBadgeVariant(
  type: CorrectionType,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (type) {
    case 'grammar':
      return 'default';
    case 'spelling':
      return 'secondary';
    case 'punctuation':
      return 'destructive';
    case 'capitalization':
      return 'default';
    case 'preposition':
      return 'secondary';
    case 'missing-words':
      return 'destructive';
    default:
      return 'outline';
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * CorrectionCard component
 */
export function CorrectionCard({
  correction,
  index,
  state,
  onApply,
  onIgnore,
  disabled = false,
  originalText,
  className = '',
}: CorrectionCardProps) {
  const isPending = state === 'pending';
  const isApplied = state === 'applied';

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {correction.type && (
                <Badge variant={getCorrectionBadgeVariant(correction.type)}>
                  {correction.type}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                #{index + 1}
              </span>
            </div>

            {!isPending && (
              <Badge variant={isApplied ? 'default' : 'secondary'}>
                {isApplied ? 'Applied' : 'Ignored'}
              </Badge>
            )}
          </div>

          {/* Original and Suggestion */}
          <div className="space-y-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Original:
              </div>
              <div className="p-2 bg-destructive/10 rounded text-sm line-through">
                {originalText?.slice(
                  correction.startIndex,
                  correction.endIndex,
                ) || ''}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Suggestion:
              </div>
              <div className="p-2 bg-primary/10 rounded text-sm font-medium">
                {correction.correction}
              </div>
            </div>
          </div>

          {/* Explanation */}
          {correction.explanation && (
            <div className="flex items-start gap-2 text-sm">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Why this correction is suggested</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <p className="text-muted-foreground">{correction.explanation}</p>
            </div>
          )}

          {/* Actions */}
          {isPending && (
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={onApply}
                disabled={disabled}
                size="sm"
                className="flex-1"
              >
                <Check className="mr-2 h-4 w-4" />
                Apply
              </Button>
              <Button
                onClick={onIgnore}
                disabled={disabled}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Ignore
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default CorrectionCard;
