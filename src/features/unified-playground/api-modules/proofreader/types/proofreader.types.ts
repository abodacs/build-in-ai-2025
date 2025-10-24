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
 * Based on official Chrome AI Proofreader specification
 */
export type CorrectionType =
  | 'spelling'
  | 'punctuation'
  | 'capitalization'
  | 'preposition'
  | 'missing-words'
  | 'grammar';

/**
 * Expected input languages for proofreading
 *
 * NOTE: Currently only English ('en') is supported by the Chrome AI Proofreader model.
 * Other languages listed here are for future compatibility but will result in
 * "unavailable" status if used.
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
 * Based on official specification
 */
export interface ProofreaderCreateOptions {
  /** Expected input languages (improves accuracy) */
  expectedInputLanguages?: ProofreaderLanguage[];

  /** Output language code (required for optimal quality and safety) */
  outputLanguage?: ProofreaderLanguage;

  /** Include error type labels in corrections */
  includeCorrectionTypes?: boolean;

  /** Include plain-language explanations in corrections */
  includeCorrectionExplanations?: boolean;

  /** Language for correction explanations */
  correctionExplanationLanguage?: string;

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
 * Based on official Chrome AI Proofreader specification
 */
export interface ProofreadCorrection {
  /** Start position in original text */
  startIndex: number;

  /** End position in original text */
  endIndex: number;

  /** The suggested replacement text */
  correction: string;

  /** Type of error/correction (optional, when includeCorrectionTypes is enabled) */
  type?: CorrectionType;

  /** Explanation of why this correction is suggested (optional, when includeCorrectionExplanations is enabled) */
  explanation?: string;
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
 * Based on official specification
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
   * Proofread text with streaming explanations
   * Provides corrections progressively for better perceived responsiveness
   */
  proofreadStreaming(input: string, options?: ProofreadOptions): ReadableStream;

  /**
   * Destroy the instance and unload model from memory
   */
  destroy(): void;

  /**
   * Expected input languages
   */
  readonly expectedInputLanguages: ProofreaderLanguage[];

  /**
   * Language for correction explanations
   */
  readonly correctionExplanationLanguage: string;

  /**
   * Whether correction explanations are included
   */
  readonly includeCorrectionExplanations: boolean;

  /**
   * Whether correction types are included
   */
  readonly includeCorrectionTypes: boolean;
}

/**
 * Proofreader availability states
 * Based on Chrome AI Proofreader enum
 */
export type ProofreaderAvailability =
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'available';

/**
 * Options for checking Proofreader availability
 * Allows checking if specific languages are supported
 */
export interface ProofreaderAvailabilityOptions {
  /** Expected input languages to check availability for */
  expectedInputLanguages?: ProofreaderLanguage[];
}

/**
 * Chrome AI Proofreader API
 */
export interface ProofreaderAPI {
  create(options?: ProofreaderCreateOptions): Promise<Proofreader>;
  availability(
    options?: ProofreaderAvailabilityOptions,
  ): Promise<ProofreaderAvailability>;
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

  /** Output language code (required for optimal quality and safety) */
  outputLanguage: ProofreaderLanguage;

  /** Include error type labels in corrections */
  includeCorrectionTypes: boolean;

  /** Include plain-language explanations in corrections */
  includeCorrectionExplanations: boolean;

  /** Language for correction explanations */
  correctionExplanationLanguage: string;

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
  outputLanguage: 'en',
  includeCorrectionTypes: true,
  includeCorrectionExplanations: true,
  correctionExplanationLanguage: 'en',
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
 *
 * NOTE: Currently only English is supported by the Chrome AI Proofreader model.
 * Other languages are listed for future compatibility.
 */
export const PROOFREADER_LANGUAGE_OPTIONS: ConfigOption<ProofreaderLanguage>[] =
  [
    {
      value: 'en',
      label: 'English',
      description: 'Currently supported',
      icon: '🇺🇸',
    },
    {
      value: 'es',
      label: 'Spanish',
      description: 'Not yet supported',
      icon: '🇪🇸',
    },
    {
      value: 'fr',
      label: 'French',
      description: 'Not yet supported',
      icon: '🇫🇷',
    },
    {
      value: 'de',
      label: 'German',
      description: 'Not yet supported',
      icon: '🇩🇪',
    },
    {
      value: 'it',
      label: 'Italian',
      description: 'Not yet supported',
      icon: '🇮🇹',
    },
    {
      value: 'pt',
      label: 'Portuguese',
      description: 'Not yet supported',
      icon: '🇵🇹',
    },
    {
      value: 'ja',
      label: 'Japanese',
      description: 'Not yet supported',
      icon: '🇯🇵',
    },
    {
      value: 'ko',
      label: 'Korean',
      description: 'Not yet supported',
      icon: '🇰🇷',
    },
    {
      value: 'zh',
      label: 'Chinese',
      description: 'Not yet supported',
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
    value: 'capitalization',
    label: 'Capitalization',
    description: 'Incorrect capitalization',
    icon: '🔤',
  },
  {
    value: 'preposition',
    label: 'Preposition',
    description: 'Incorrect preposition usage',
    icon: '🔗',
  },
  {
    value: 'missing-words',
    label: 'Missing Words',
    description: 'Missing words in sentence',
    icon: '➕',
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
    capitalization: number;
    preposition: number;
    'missing-words': number;
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
    [
      'grammar',
      'spelling',
      'punctuation',
      'capitalization',
      'preposition',
      'missing-words',
    ].includes(value)
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
      return 'blue';
    case 'spelling':
      return 'purple';
    case 'punctuation':
      return 'red';
    case 'capitalization':
      return 'lime';
    case 'preposition':
      return 'orange';
    case 'missing-words':
      return 'pink';
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
      capitalization: 0,
      preposition: 0,
      'missing-words': 0,
    },
    applied: 0,
    ignored: 0,
  };

  corrections.forEach((correction) => {
    if (correction.type) {
      stats.byType[correction.type]++;
    }
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
