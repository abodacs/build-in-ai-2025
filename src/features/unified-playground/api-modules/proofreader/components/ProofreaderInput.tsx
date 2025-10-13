/**
 * ProofreaderInput Component
 *
 * Text input component for proofreading with character counter.
 *
 * @module proofreader/components/ProofreaderInput
 */

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Undo2, Redo2 } from 'lucide-react';
import { HighlightedTextEditor } from './HighlightedTextEditor';
import type { ProofreadCorrection } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface ProofreaderInputProps {
  /** Input text value */
  value: string;

  /** Value change handler */
  onChange: (value: string) => void;

  /** Proofread handler */
  onProofread: () => void;

  /** Clear handler */
  onClear: () => void;

  /** Corrections to highlight */
  corrections?: ProofreadCorrection[];

  /** Click on highlight handler */
  onHighlightClick?: (correction: ProofreadCorrection, index: number) => void;

  /** Can undo */
  canUndo?: boolean;

  /** Can redo */
  canRedo?: boolean;

  /** Undo handler */
  onUndo?: () => void;

  /** Redo handler */
  onRedo?: () => void;

  /** Is proofreading in progress */
  isProofreading?: boolean;

  /** Is disabled */
  disabled?: boolean;

  /** Maximum character length */
  maxLength?: number;

  /** Number of corrections found */
  correctionCount?: number;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProofreaderInput component
 */
export function ProofreaderInput({
  value,
  onChange,
  onProofread,
  onClear,
  corrections = [],
  onHighlightClick,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  isProofreading = false,
  disabled = false,
  maxLength = 5000,
  correctionCount = 0,
  className = '',
}: ProofreaderInputProps) {
  const characterCount = value.length;
  const isOverLimit = characterCount > maxLength;
  const canProofread = characterCount > 0 && !isOverLimit && !isProofreading;

  // Keyboard shortcuts for undo/redo
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Ctrl+Z or Cmd+Z for undo
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === 'z' &&
      !event.shiftKey
    ) {
      if (canUndo && onUndo) {
        event.preventDefault();
        onUndo();
      }
    }
    // Ctrl+Shift+Z or Ctrl+Y or Cmd+Shift+Z for redo
    else if (
      ((event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === 'z') ||
      (event.ctrlKey && event.key === 'y')
    ) {
      if (canRedo && onRedo) {
        event.preventDefault();
        onRedo();
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Text to Proofread</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={isOverLimit ? 'text-destructive font-medium' : ''}>
              {characterCount.toLocaleString()} / {maxLength.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2" onKeyDown={handleKeyDown}>
          <Label htmlFor="proofreader-input">Input Text</Label>
          <HighlightedTextEditor
            id="proofreader-input"
            value={value}
            onChange={onChange}
            corrections={corrections}
            onHighlightClick={onHighlightClick}
            placeholder="Enter or paste text to proofread..."
            disabled={disabled || isProofreading}
            maxLength={maxLength}
            className="min-h-[200px]"
          />
          {isOverLimit && (
            <p className="text-xs text-destructive">
              Text exceeds maximum length of {maxLength.toLocaleString()}{' '}
              characters. Please shorten the text.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onProofread}
            disabled={!canProofread || disabled}
            className="flex-1"
          >
            {isProofreading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Proofreading...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Proofread Text
              </>
            )}
          </Button>
          <Button
            onClick={onClear}
            disabled={characterCount === 0 || disabled || isProofreading}
            variant="outline"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>

        {/* Undo/Redo Buttons */}
        {(onUndo || onRedo) && (
          <div className="flex items-center gap-2">
            <Button
              onClick={onUndo}
              disabled={!canUndo || disabled || isProofreading}
              variant="outline"
              size="sm"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Undo
            </Button>
            <Button
              onClick={onRedo}
              disabled={!canRedo || disabled || isProofreading}
              variant="outline"
              size="sm"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="mr-2 h-4 w-4" />
              Redo
            </Button>
          </div>
        )}

        {correctionCount > 0 && (
          <div className="text-sm text-muted-foreground">
            Found {correctionCount} correction{correctionCount !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ProofreaderInput;
