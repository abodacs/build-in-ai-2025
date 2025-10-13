/**
 * InlineCorrectionPopover Component
 *
 * Popover that displays correction details when clicking on highlighted text.
 * Shows original text, suggestion, explanation, and action buttons.
 *
 * @module proofreader/components/InlineCorrectionPopover
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X as XIcon } from 'lucide-react';
import type { ProofreadCorrection } from '../types';
import '../styles/highlights.css';

// ============================================================================
// Types
// ============================================================================

export interface InlineCorrectionPopoverProps {
  /** The correction to display */
  correction: ProofreadCorrection | null;

  /** Correction index */
  index: number;

  /** Is visible */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Apply correction handler */
  onApply: (index: number) => void;

  /** Ignore correction handler */
  onIgnore: (index: number) => void;

  /** Anchor element for positioning */
  anchorEl?: HTMLElement | null;
}

// ============================================================================
// Helpers
// ============================================================================

function getCorrectionBadgeVariant(
  type: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (type) {
    case 'grammar':
    case 'spelling':
      return 'destructive';
    case 'punctuation':
      return 'default';
    case 'style':
    case 'clarity':
      return 'secondary';
    default:
      return 'outline';
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * InlineCorrectionPopover component
 */
export function InlineCorrectionPopover({
  correction,
  index,
  isOpen,
  onClose,
  onApply,
  onIgnore,
  anchorEl,
}: InlineCorrectionPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position relative to anchor
  useEffect(() => {
    if (isOpen && anchorEl && popoverRef.current) {
      const anchorRect = anchorEl.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = anchorRect.bottom + 8;
      let left = anchorRect.left;

      // Adjust if popover would go off-screen horizontally
      if (left + popoverRect.width > viewportWidth) {
        left = viewportWidth - popoverRect.width - 16;
      }
      if (left < 16) {
        left = 16;
      }

      // Adjust if popover would go off-screen vertically
      if (top + popoverRect.height > viewportHeight) {
        top = anchorRect.top - popoverRect.height - 8;
      }

      setPosition({ top, left });
    }
  }, [isOpen, anchorEl]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !correction) return null;

  const handleApply = () => {
    onApply(index);
    onClose();
  };

  const handleIgnore = () => {
    onIgnore(index);
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      className="proofreader-popover"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      role="dialog"
      aria-label="Correction details"
    >
      {/* Header */}
      <div className="proofreader-popover-header">
        <div className="flex items-center gap-2">
          <Badge variant={getCorrectionBadgeVariant(correction.type)}>
            {correction.type}
          </Badge>
          <span className="text-xs text-muted-foreground">#{index + 1}</span>
        </div>
        <button
          className="proofreader-popover-close"
          onClick={onClose}
          aria-label="Close"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="proofreader-popover-content">
        {/* Original */}
        <div className="proofreader-popover-section">
          <div className="proofreader-popover-label">Original:</div>
          <div className="proofreader-popover-text proofreader-popover-text-original">
            {correction.original}
          </div>
        </div>

        {/* Suggestion */}
        <div className="proofreader-popover-section">
          <div className="proofreader-popover-label">Suggestion:</div>
          <div className="proofreader-popover-text proofreader-popover-text-suggestion">
            {correction.suggestion}
          </div>
        </div>

        {/* Explanation */}
        {correction.explanation && (
          <div className="proofreader-popover-section">
            <div className="proofreader-popover-label">Why:</div>
            <div className="proofreader-popover-explanation">
              {correction.explanation}
            </div>
          </div>
        )}

        {/* Confidence */}
        {correction.confidence !== undefined && (
          <div className="proofreader-popover-section">
            <div className="proofreader-popover-label">Confidence:</div>
            <div className="text-sm">
              {(correction.confidence * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="proofreader-popover-actions">
        <Button onClick={handleApply} size="sm" className="flex-1">
          <Check className="mr-2 h-4 w-4" />
          Apply
        </Button>
        <Button
          onClick={handleIgnore}
          size="sm"
          variant="outline"
          className="flex-1"
        >
          <XIcon className="mr-2 h-4 w-4" />
          Ignore
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default InlineCorrectionPopover;
