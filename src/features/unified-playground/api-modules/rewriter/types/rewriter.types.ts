/**
 * Rewriter API Types
 *
 * Type definitions for Chrome AI Rewriter API.
 * Extends base writing types with Rewriter-specific options.
 *
 * Key differences from Writer:
 * - Tone: 'more-formal' | 'as-is' | 'more-casual'
 * - Format: 'as-is' | 'markdown' | 'plain-text'
 * - Length: 'shorter' | 'as-is' | 'longer'
 * - Requires input text (not just prompt)
 *
 * @module rewriter/types
 */

import type { BaseWritingConfig, ConfigOption } from '../../shared/types';

// ============================================================================
// Core Types
// ============================================================================

/**
 * Rewriter tone options
 */
export type RewriterTone = 'more-formal' | 'as-is' | 'more-casual';

/**
 * Rewriter format options
 */
export type RewriterFormat = 'as-is' | 'markdown' | 'plain-text';

/**
 * Rewriter length options
 */
export type RewriterLength = 'shorter' | 'as-is' | 'longer';

/**
 * Rewriter API output language options
 * Supported languages: English, Spanish, Japanese
 */
export type RewriterLanguage = 'en' | 'es' | 'ja';

// ============================================================================
// Chrome AI API Types
// ============================================================================

/**
 * Options for creating Rewriter instance
 *
 * Maps to Chrome AI Rewriter.create() options
 */
export interface RewriterCreateOptions {
  /** Tone adjustment */
  tone?: RewriterTone;

  /** Output format */
  format?: RewriterFormat;

  /** Length adjustment */
  length?: RewriterLength;

  /** Output language (required for optimal quality and safety) */
  outputLanguage?: RewriterLanguage;

  /** Shared context for all rewrites */
  sharedContext?: string;

  /** Abort signal for cancellation */
  signal?: AbortSignal;

  /** Download progress monitor */
  monitor?: (monitor: EventTarget) => void;
}

/**
 * Options for rewrite operations
 */
export interface RewriteOptions {
  /** Per-rewrite context */
  context?: string;

  /** Abort signal */
  signal?: AbortSignal;
}

/**
 * Chrome AI Rewriter instance
 */
export interface Rewriter {
  /**
   * Rewrite text
   */
  rewrite(input: string, options?: RewriteOptions): Promise<string>;

  /**
   * Rewrite text with streaming
   */
  rewriteStreaming(
    input: string,
    options?: RewriteOptions,
  ): ReadableStream<string>;

  /**
   * Destroy the instance
   */
  destroy(): void;
}

/**
 * Chrome AI Rewriter API
 */
export interface RewriterAPI {
  create(options?: RewriterCreateOptions): Promise<Rewriter>;
  availability(): Promise<'no' | 'after-download' | 'readily'>;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Rewriter configuration
 *
 * Extends BaseWritingConfig with Rewriter-specific options
 */
export interface RewriterConfig extends BaseWritingConfig {
  tone: RewriterTone;
  format: RewriterFormat;
  length: RewriterLength;
  outputLanguage: RewriterLanguage;
}

/**
 * Default Rewriter configuration
 */
export const DEFAULT_REWRITER_CONFIG: RewriterConfig = {
  tone: 'as-is',
  format: 'as-is',
  length: 'as-is',
  outputLanguage: 'en',
  sharedContext: '',
};

// ============================================================================
// UI Option Definitions
// ============================================================================

/**
 * Tone options for UI
 */
export const REWRITER_TONE_OPTIONS = [
  {
    value: 'more-formal' as RewriterTone,
    label: 'More Formal',
    description: 'Professional, business-appropriate',
    icon: '👔',
  },
  {
    value: 'as-is' as RewriterTone,
    label: 'As-Is',
    description: 'Keep original tone',
    icon: '↔️',
  },
  {
    value: 'more-casual' as RewriterTone,
    label: 'More Casual',
    description: 'Relaxed, conversational',
    icon: '😊',
  },
] as const;

/**
 * Format options for UI
 */
export const REWRITER_FORMAT_OPTIONS = [
  {
    value: 'as-is' as RewriterFormat,
    label: 'As-Is',
    description: 'Keep original format',
    icon: '↔️',
  },
  {
    value: 'markdown' as RewriterFormat,
    label: 'Markdown',
    description: 'Formatted with headings, lists, etc.',
    icon: '📝',
  },
  {
    value: 'plain-text' as RewriterFormat,
    label: 'Plain Text',
    description: 'Unformatted text',
    icon: '📄',
  },
] as const;

/**
 * Length options for UI
 */
export const REWRITER_LENGTH_OPTIONS = [
  {
    value: 'shorter' as RewriterLength,
    label: 'Shorter',
    description: 'Condense the content',
    icon: '📌',
  },
  {
    value: 'as-is' as RewriterLength,
    label: 'As-Is',
    description: 'Keep original length',
    icon: '↔️',
  },
  {
    value: 'longer' as RewriterLength,
    label: 'Longer',
    description: 'Expand with details',
    icon: '📜',
  },
] as const;

/**
 * Language options for UI
 */
export const REWRITER_LANGUAGE_OPTIONS = [
  {
    value: 'en' as RewriterLanguage,
    label: 'English',
    description: 'Output in English',
    icon: '🇺🇸',
  },
  {
    value: 'es' as RewriterLanguage,
    label: 'Spanish',
    description: 'Output in Spanish',
    icon: '🇪🇸',
  },
  {
    value: 'ja' as RewriterLanguage,
    label: 'Japanese',
    description: 'Output in Japanese',
    icon: '🇯🇵',
  },
] as const;

// ============================================================================
// Template Types
// ============================================================================

/**
 * Rewriter template for quick transforms
 */
export interface RewriterTemplate {
  /** Unique template ID */
  id: string;

  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Category */
  category: string;

  /** Example input text */
  exampleInput: string;

  /** Transform instructions (context) */
  instructions?: string;

  /** Recommended configuration */
  config?: Partial<RewriterConfig>;

  /** Icon emoji */
  icon: string;
}

/**
 * Template category
 */
export interface TemplateCategory {
  /** Category ID */
  id: string;

  /** Category name */
  name: string;

  /** Category icon */
  icon: string;

  /** Templates in this category */
  templates: RewriterTemplate[];
}

// ============================================================================
// Diff Types
// ============================================================================

/**
 * Diff change type
 */
export type DiffChangeType = 'added' | 'removed' | 'unchanged';

/**
 * Diff segment
 */
export interface DiffSegment {
  /** Change type */
  type: DiffChangeType;

  /** Text content */
  value: string;
}

/**
 * Diff result
 */
export interface DiffResult {
  /** Original text */
  original: string;

  /** Rewritten text */
  rewritten: string;

  /** Diff segments */
  segments: DiffSegment[];

  /** Statistics */
  stats: {
    /** Characters added */
    added: number;

    /** Characters removed */
    removed: number;

    /** Characters unchanged */
    unchanged: number;

    /** Total original length */
    originalLength: number;

    /** Total rewritten length */
    rewrittenLength: number;

    /** Percentage changed */
    percentChanged: number;
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate tone option
 */
export function isValidRewriterTone(value: unknown): value is RewriterTone {
  return (
    typeof value === 'string' &&
    ['more-formal', 'as-is', 'more-casual'].includes(value)
  );
}

/**
 * Validate format option
 */
export function isValidRewriterFormat(value: unknown): value is RewriterFormat {
  return (
    typeof value === 'string' &&
    ['as-is', 'markdown', 'plain-text'].includes(value)
  );
}

/**
 * Validate length option
 */
export function isValidRewriterLength(value: unknown): value is RewriterLength {
  return (
    typeof value === 'string' && ['shorter', 'as-is', 'longer'].includes(value)
  );
}

/**
 * Validate Rewriter configuration
 */
export function isValidRewriterConfig(
  config: unknown,
): config is RewriterConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const c = config as Record<string, unknown>;

  return (
    isValidRewriterTone(c.tone) &&
    isValidRewriterFormat(c.format) &&
    isValidRewriterLength(c.length) &&
    (c.sharedContext === undefined || typeof c.sharedContext === 'string')
  );
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if Rewriter API is available
 */
export function isRewriterSupported(): boolean {
  return typeof window !== 'undefined' && 'Rewriter' in window;
}

/**
 * Get Rewriter API
 */
export function getRewriterAPI(): RewriterAPI | null {
  if (!isRewriterSupported()) {
    return null;
  }

  return (window as any).Rewriter as RewriterAPI;
}

// ============================================================================
// Exports
// ============================================================================

export type {
  ConfigOption, // Re-export from shared
};
