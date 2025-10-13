/**
 * HighlightedTextEditor Component
 *
 * Content-editable text editor with inline error highlighting using CSS Custom Highlights API.
 * Replaces standard textarea with rich error visualization.
 *
 * Features:
 * - CSS Custom Highlights API for inline error underlining
 * - Clickable highlights that show correction details
 * - Color-coded by correction type (grammar, spelling, etc.)
 * - Maintains cursor position during updates
 * - Accessible keyboard navigation
 *
 * Browser Support: Chrome 105+
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/::highlight
 *
 * @module proofreader/components/HighlightedTextEditor
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { ProofreadCorrection, CorrectionType } from '../types';
import '../styles/highlights.css';

// ============================================================================
// Types
// ============================================================================

export interface HighlightedTextEditorProps {
  /** Current text value */
  value: string;

  /** Text change handler */
  onChange: (value: string) => void;

  /** Corrections to highlight */
  corrections?: ProofreadCorrection[];

  /** Click on highlight handler */
  onHighlightClick?: (correction: ProofreadCorrection, index: number) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Is disabled */
  disabled?: boolean;

  /** Maximum character length */
  maxLength?: number;

  /** Additional CSS classes */
  className?: string;

  /** Editor ID for accessibility */
  id?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if CSS Custom Highlights API is supported
 */
function isHighlightsAPISupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'CSS' in window &&
    'highlights' in (CSS as any)
  );
}

/**
 * Get text content from contenteditable element
 */
function getTextContent(element: HTMLElement | null): string {
  if (!element) return '';
  return element.textContent || '';
}

/**
 * Set cursor position in contenteditable element
 */
function setCursorPosition(element: HTMLElement, position: number) {
  const selection = window.getSelection();
  const range = document.createRange();

  // Find the text node and offset
  let currentPos = 0;
  let targetNode: Node | null = null;
  let targetOffset = 0;

  function traverse(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const length = node.textContent?.length || 0;
      if (currentPos + length >= position) {
        targetNode = node;
        targetOffset = position - currentPos;
        return true;
      }
      currentPos += length;
    } else {
      for (const child of Array.from(node.childNodes)) {
        if (traverse(child)) return true;
      }
    }
    return false;
  }

  traverse(element);

  if (targetNode) {
    range.setStart(targetNode, targetOffset);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
}

/**
 * Get current cursor position in contenteditable
 */
function getCursorPosition(element: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  return preCaretRange.toString().length;
}

// ============================================================================
// Component
// ============================================================================

/**
 * HighlightedTextEditor component
 *
 * @example
 * ```tsx
 * <HighlightedTextEditor
 *   value={text}
 *   onChange={setText}
 *   corrections={corrections}
 *   onHighlightClick={(correction, index) => showPopover(correction)}
 *   placeholder="Enter text to proofread..."
 * />
 * ```
 */
export function HighlightedTextEditor({
  value,
  onChange,
  corrections = [],
  onHighlightClick,
  placeholder = 'Enter text...',
  disabled = false,
  maxLength,
  className = '',
  id = 'proofreader-editor',
}: HighlightedTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [highlightsSupported] = useState(isHighlightsAPISupported());
  const lastCursorPosRef = useRef<number>(0);
  const isUpdatingRef = useRef(false);

  /**
   * Apply CSS Custom Highlights to corrections
   */
  const applyHighlights = useCallback(() => {
    if (!highlightsSupported || !editorRef.current) return;

    const element = editorRef.current;
    const textContent = getTextContent(element);

    // Clear existing highlights
    if ((CSS as any).highlights) {
      const highlights = (CSS as any).highlights as Map<string, any>;
      highlights.clear();
    }

    // No corrections to highlight
    if (corrections.length === 0 || textContent.length === 0) return;

    // Get first text node
    const textNode = element.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;

    // Group corrections by type
    const correctionsByType = new Map<
      CorrectionType | 'other',
      ProofreadCorrection[]
    >();

    corrections.forEach((correction) => {
      const type = correction.type || 'other';
      if (!correctionsByType.has(type)) {
        correctionsByType.set(type, []);
      }
      correctionsByType.get(type)!.push(correction);
    });

    // Create highlights for each type
    correctionsByType.forEach((typeCorrections, type) => {
      try {
        // Create Highlight instance
        const highlight = new (window as any).Highlight();

        typeCorrections.forEach((correction) => {
          // Validate indices
          if (
            correction.startIndex < 0 ||
            correction.endIndex > textContent.length ||
            correction.startIndex >= correction.endIndex
          ) {
            console.warn('Invalid correction indices:', correction);
            return;
          }

          // Create range for this correction
          const range = document.createRange();
          range.setStart(textNode, correction.startIndex);
          range.setEnd(textNode, correction.endIndex);

          // Add range to highlight
          highlight.add(range);
        });

        // Register highlight with CSS
        const highlightName = `proofreader-${type}`;
        (CSS as any).highlights.set(highlightName, highlight);
      } catch (error) {
        console.error(`Failed to create highlight for ${type}:`, error);
      }
    });
  }, [corrections, highlightsSupported]);

  /**
   * Handle input changes
   */
  const handleInput = useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      if (disabled || isUpdatingRef.current) return;

      const element = event.currentTarget;
      const newText = getTextContent(element);

      // Check max length
      if (maxLength && newText.length > maxLength) {
        // Prevent further input
        event.preventDefault();
        return;
      }

      // Save cursor position
      lastCursorPosRef.current = getCursorPosition(element);

      // Notify parent
      onChange(newText);
    },
    [onChange, disabled, maxLength],
  );

  /**
   * Handle click on editor - check if clicking a highlight
   */
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!onHighlightClick || corrections.length === 0) return;

      const element = event.currentTarget;
      const cursorPos = getCursorPosition(element);

      // Find correction at cursor position
      const clickedCorrection = corrections.find(
        (c) => cursorPos >= c.startIndex && cursorPos <= c.endIndex,
      );

      if (clickedCorrection) {
        const index = corrections.indexOf(clickedCorrection);
        onHighlightClick(clickedCorrection, index);
      }
    },
    [corrections, onHighlightClick],
  );

  /**
   * Handle paste - strip formatting
   */
  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();

      const text = event.clipboardData.getData('text/plain');
      const element = event.currentTarget;

      // Check max length
      const currentText = getTextContent(element);
      if (maxLength && currentText.length + text.length > maxLength) {
        const remaining = maxLength - currentText.length;
        const truncatedText = text.slice(0, remaining);
        document.execCommand('insertText', false, truncatedText);
      } else {
        document.execCommand('insertText', false, text);
      }
    },
    [maxLength],
  );

  /**
   * Update editor content when value changes externally
   */
  useEffect(() => {
    if (!editorRef.current || isUpdatingRef.current) return;

    const element = editorRef.current;
    const currentText = getTextContent(element);

    if (currentText !== value) {
      isUpdatingRef.current = true;

      // Update text content
      element.textContent = value;

      // Restore cursor position
      if (document.activeElement === element) {
        const newPos = Math.min(lastCursorPosRef.current, value.length);
        setTimeout(() => {
          setCursorPosition(element, newPos);
          isUpdatingRef.current = false;
        }, 0);
      } else {
        isUpdatingRef.current = false;
      }
    }
  }, [value]);

  /**
   * Apply highlights when corrections change
   */
  useEffect(() => {
    applyHighlights();
  }, [applyHighlights]);

  /**
   * Cleanup highlights on unmount
   */
  useEffect(() => {
    return () => {
      if (highlightsSupported && (CSS as any).highlights) {
        (CSS as any).highlights.clear();
      }
    };
  }, [highlightsSupported]);

  // Warn if API not supported
  useEffect(() => {
    if (!highlightsSupported && corrections.length > 0) {
      console.warn(
        'CSS Custom Highlights API not supported in this browser. Inline highlighting disabled.',
      );
    }
  }, [highlightsSupported, corrections.length]);

  return (
    <div
      ref={editorRef}
      id={id}
      role="textbox"
      aria-label="Text editor with inline error highlighting"
      aria-multiline="true"
      contentEditable={!disabled}
      suppressContentEditableWarning
      onInput={handleInput}
      onClick={handleClick}
      onPaste={handlePaste}
      data-placeholder={placeholder}
      className={`proofreader-editor ${className}`}
      style={{
        cursor: disabled ? 'not-allowed' : 'text',
      }}
    />
  );
}

// ============================================================================
// Export
// ============================================================================

export default HighlightedTextEditor;
