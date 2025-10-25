/**
 * CorrectionLegend Component
 *
 * Visual legend showing all correction types with color indicators.
 * Based on Google Chrome Labs web-ai-demos implementation.
 *
 * @module proofreader/components/CorrectionLegend
 */

import type { CorrectionType } from '../types';
import '@/styles/highlights.css';

// ============================================================================
// Types
// ============================================================================

export interface CorrectionLegendProps {
  /** Additional CSS classes */
  className?: string;
}

interface LegendItem {
  type: CorrectionType;
  label: string;
  colorClass: string;
}

// ============================================================================
// Constants
// ============================================================================

const LEGEND_ITEMS: LegendItem[] = [
  {
    type: 'spelling',
    label: 'Spelling',
    colorClass: 'proofreader-legend-color-spelling',
  },
  {
    type: 'punctuation',
    label: 'Punctuation',
    colorClass: 'proofreader-legend-color-punctuation',
  },
  {
    type: 'capitalization',
    label: 'Capitalization',
    colorClass: 'proofreader-legend-color-capitalization',
  },
  {
    type: 'preposition',
    label: 'Preposition',
    colorClass: 'proofreader-legend-color-preposition',
  },
  {
    type: 'missing-words',
    label: 'Missing Words',
    colorClass: 'proofreader-legend-color-missing-words',
  },
  {
    type: 'grammar',
    label: 'Grammar',
    colorClass: 'proofreader-legend-color-grammar',
  },
];

// ============================================================================
// Component
// ============================================================================

/**
 * CorrectionLegend component
 *
 * Displays a visual legend of all correction types with color coding
 *
 * @example
 * ```tsx
 * <CorrectionLegend />
 * ```
 */
export function CorrectionLegend({ className = '' }: CorrectionLegendProps) {
  return (
    <div
      className={`proofreader-legend ${className}`}
      role="list"
      aria-label="Correction type legend"
    >
      {LEGEND_ITEMS.map((item) => (
        <div
          key={item.type}
          className="proofreader-legend-item"
          role="listitem"
        >
          <span
            className={`proofreader-legend-color ${item.colorClass}`}
            aria-hidden="true"
          />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default CorrectionLegend;
