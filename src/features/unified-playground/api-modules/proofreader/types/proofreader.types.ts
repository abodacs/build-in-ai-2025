/**
 * Proofreader API Types
 *
 * Type definitions for Chrome AI Proofreader API.
 * Extends base writing types with Proofreader-specific options.
 *
 * Key features:
 * - Grammar, spelling, punctuation corrections
 * - Error type identification
 * - Position-based correction application
 * - Explanation for each correction
 *
 * @module proofreader/types
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Configuration option for UI
 */
export interface ConfigOption<T = string> {
  value: T;
  label: string;
  description: string;
  icon: string;
}

// ============================================================================
// Types
// ============================================================================

/**
 * Correction types supported by the Proofreader API
 */
export type CorrectionType =
  | 'grammar'
  | 'spelling'
  | 'punctuation'
  | 'style'
  | 'clarity';

/**
 * Expected input languages for proofreading
 */
export type ProofreaderLanguage =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt'
  | 'ja'
  | 'ko'
  | 'zh';

// ============================================================================
// Chrome AI API Types
// ============================================================================

/**
 * Options for creating Proofreader instance
 *
 * Maps to Chrome AI Proofreader.create() options
 */
export interface ProofreaderCreateOptions {
  /** Expected input languages (improves accuracy) */
  expectedInputLanguages?: ProofreaderLanguage[];

  /** Abort signal for cancellation */
  signal?: AbortSignal;

  /** Download progress monitor */
  monitor?: (monitor: EventTarget) => void;
}

/**
 * Options for proofread operations
 */
export interface ProofreadOptions {
  /** Additional context for better corrections */
  context?: string;

  /** Abort signal */
  signal?: AbortSignal;
}

/**
 * Individual correction suggested by the Proofreader
 */
export interface ProofreadCorrection {
  /** Original text with error */
  original: string;

  /** Suggested correction */
  suggestion: string;

  /** Type of error/correction */
  type: CorrectionType;

  /** Explanation of why this correction is suggested */
  explanation: string;

  /** Start position in original text */
  startIndex: number;

  /** End position in original text */
  endIndex: number;

  /** Optional confidence score (0.0-1.0) */
  confidence?: number;
}

/**
 * Result from proofread operation
 */
export interface ProofreadResult {
  /** Array of corrections found */
  corrections: ProofreadCorrection[];
}

/**
 * Chrome AI Proofreader instance
 */
export interface Proofreader {
  /**
   * Proofread text and return corrections
   */
  proofread(
    input: string,
    options?: ProofreadOptions,
  ): Promise<ProofreadResult>;

  /**
   * Destroy the instance
   */
  destroy(): void;
}

/**
 * Chrome AI Proofreader API
 */
export interface ProofreaderAPI {
  create(options?: ProofreaderCreateOptions): Promise<Proofreader>;
  availability(): Promise<'no' | 'after-download' | 'readily'>;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Proofreader configuration
 */
export interface ProofreaderConfig {
  /** Expected input languages */
  expectedInputLanguages: ProofreaderLanguage[];

  /** Auto-apply corrections */
  autoApply: boolean;

  /** Filter by correction types (empty = all types) */
  correctionTypeFilter: CorrectionType[];

  /** Correction mode intensity */
  correctionMode: 'light' | 'standard' | 'thorough';

  /** Shared context for proofreading */
  sharedContext?: string;
}

/**
 * Default Proofreader configuration
 */
export const DEFAULT_PROOFREADER_CONFIG: ProofreaderConfig = {
  expectedInputLanguages: ['en'],
  autoApply: false,
  correctionTypeFilter: [],
  correctionMode: 'standard',
  sharedContext: '',
};

// ============================================================================
// UI Option Definitions
// ============================================================================

/**
 * Language options for UI
 */
export const PROOFREADER_LANGUAGE_OPTIONS: ConfigOption<ProofreaderLanguage>[] =
  [
    {
      value: 'en',
      label: 'English',
      description: 'English proofreading',
      icon: '🇺🇸',
    },
    {
      value: 'es',
      label: 'Spanish',
      description: 'Spanish proofreading',
      icon: '🇪🇸',
    },
    {
      value: 'fr',
      label: 'French',
      description: 'French proofreading',
      icon: '🇫🇷',
    },
    {
      value: 'de',
      label: 'German',
      description: 'German proofreading',
      icon: '🇩🇪',
    },
    {
      value: 'it',
      label: 'Italian',
      description: 'Italian proofreading',
      icon: '🇮🇹',
    },
    {
      value: 'pt',
      label: 'Portuguese',
      description: 'Portuguese proofreading',
      icon: '🇵🇹',
    },
    {
      value: 'ja',
      label: 'Japanese',
      description: 'Japanese proofreading',
      icon: '🇯🇵',
    },
    {
      value: 'ko',
      label: 'Korean',
      description: 'Korean proofreading',
      icon: '🇰🇷',
    },
    {
      value: 'zh',
      label: 'Chinese',
      description: 'Chinese proofreading',
      icon: '🇨🇳',
    },
  ];

/**
 * Correction type options for filtering
 */
export const CORRECTION_TYPE_OPTIONS: ConfigOption<CorrectionType>[] = [
  {
    value: 'grammar',
    label: 'Grammar',
    description: 'Subject-verb agreement, tense consistency',
    icon: '📝',
  },
  {
    value: 'spelling',
    label: 'Spelling',
    description: 'Misspelled words and typos',
    icon: '✍️',
  },
  {
    value: 'punctuation',
    label: 'Punctuation',
    description: 'Missing or incorrect punctuation',
    icon: '❗',
  },
  {
    value: 'style',
    label: 'Style',
    description: 'Writing style improvements',
    icon: '🎨',
  },
  {
    value: 'clarity',
    label: 'Clarity',
    description: 'Suggestions for clearer expression',
    icon: '💡',
  },
];

/**
 * Correction mode options
 */
export const CORRECTION_MODE_OPTIONS: ConfigOption<
  'light' | 'standard' | 'thorough'
>[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Only critical errors',
    icon: '🔍',
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Balanced correction',
    icon: '⚖️',
  },
  {
    value: 'thorough',
    label: 'Thorough',
    description: 'All suggestions including style',
    icon: '🔬',
  },
];

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Statistics about corrections found
 */
export interface CorrectionStats {
  /** Total corrections */
  total: number;

  /** Corrections by type */
  byType: {
    grammar: number;
    spelling: number;
    punctuation: number;
    style: number;
    clarity: number;
  };

  /** Applied corrections count */
  applied: number;

  /** Ignored corrections count */
  ignored: number;
}

/**
 * Correction application state
 */
export interface CorrectionState {
  /** Correction index */
  index: number;

  /** Correction data */
  correction: ProofreadCorrection;

  /** Application state */
  state: 'pending' | 'applied' | 'ignored';
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate correction type
 */
export function isValidCorrectionType(value: unknown): value is CorrectionType {
  return (
    typeof value === 'string' &&
    ['grammar', 'spelling', 'punctuation', 'style', 'clarity'].includes(value)
  );
}

/**
 * Validate Proofreader language
 */
export function isValidProofreaderLanguage(
  value: unknown,
): value is ProofreaderLanguage {
  return (
    typeof value === 'string' &&
    ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'].includes(value)
  );
}

/**
 * Validate Proofreader configuration
 */
export function isValidProofreaderConfig(
  config: unknown,
): config is ProofreaderConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const c = config as Record<string, unknown>;

  return (
    Array.isArray(c.expectedInputLanguages) &&
    c.expectedInputLanguages.every(isValidProofreaderLanguage) &&
    typeof c.autoApply === 'boolean' &&
    Array.isArray(c.correctionTypeFilter) &&
    c.correctionTypeFilter.every(isValidCorrectionType) &&
    (c.correctionMode === 'light' ||
      c.correctionMode === 'standard' ||
      c.correctionMode === 'thorough') &&
    (c.sharedContext === undefined || typeof c.sharedContext === 'string')
  );
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if Proofreader API is available
 */
export function isProofreaderSupported(): boolean {
  return typeof window !== 'undefined' && 'Proofreader' in window;
}

/**
 * Get Proofreader API
 */
export function getProofreaderAPI(): ProofreaderAPI | null {
  if (!isProofreaderSupported()) {
    return null;
  }

  return (window as any).Proofreader as ProofreaderAPI;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get color for correction type
 */
export function getCorrectionTypeColor(type: CorrectionType): string {
  switch (type) {
    case 'grammar':
      return 'red';
    case 'spelling':
      return 'orange';
    case 'punctuation':
      return 'yellow';
    case 'style':
      return 'blue';
    case 'clarity':
      return 'purple';
    default:
      return 'gray';
  }
}

/**
 * Calculate correction statistics
 */
export function calculateCorrectionStats(
  corrections: ProofreadCorrection[],
  states?: CorrectionState[],
): CorrectionStats {
  const stats: CorrectionStats = {
    total: corrections.length,
    byType: {
      grammar: 0,
      spelling: 0,
      punctuation: 0,
      style: 0,
      clarity: 0,
    },
    applied: 0,
    ignored: 0,
  };

  corrections.forEach((correction) => {
    stats.byType[correction.type]++;
  });

  if (states) {
    states.forEach((state) => {
      if (state.state === 'applied') {
        stats.applied++;
      } else if (state.state === 'ignored') {
        stats.ignored++;
      }
    });
  }

  return stats;
}

// ============================================================================
// Exports
// ============================================================================
