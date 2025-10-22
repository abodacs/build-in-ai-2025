/**
 * Writer API Type Definitions
 *
 * Type definitions for Chrome's built-in Writer API.
 * Based on the Chrome AI Writer specification.
 *
 * @module writer/types
 */

import type { BaseWritingConfig } from '../../shared/types';

// ============================================================================
// Chrome Writer API - Core Types
// ============================================================================

/**
 * Writer API tone options
 */
export type WriterTone = 'formal' | 'neutral' | 'casual';

/**
 * Writer API format options
 */
export type WriterFormat = 'markdown' | 'plain-text';

/**
 * Writer API length options
 */
export type WriterLength = 'short' | 'medium' | 'long';

/**
 * Writer API output language options
 * Supported languages: English, Spanish, Japanese
 */
export type WriterLanguage = 'en' | 'es' | 'ja';

/**
 * Writer instance creation options
 */
export interface WriterCreateOptions {
  /** Writing tone/style */
  tone?: WriterTone;

  /** Output format */
  format?: WriterFormat;

  /** Target length */
  length?: WriterLength;

  /** Output language (required for optimal quality and safety) */
  outputLanguage?: WriterLanguage;

  /** Additional context */
  sharedContext?: string;

  /** Abort signal for cancellation */
  signal?: AbortSignal;

  /** Monitor for download progress */
  monitor?: (monitor: EventTarget) => void;
}

/**
 * Writer write operation options
 */
export interface WriteOptions {
  /** Additional context for this specific write */
  context?: string;

  /** Abort signal */
  signal?: AbortSignal;
}

/**
 * Writer API instance interface
 */
export interface Writer {
  /**
   * Generate text (non-streaming)
   *
   * @param input - Writing prompt
   * @param options - Write options
   * @returns Promise resolving to generated text
   */
  write(input: string, options?: WriteOptions): Promise<string>;

  /**
   * Generate text with streaming
   *
   * @param input - Writing prompt
   * @param options - Write options
   * @returns Async iterable of text chunks
   */
  writeStreaming(
    input: string,
    options?: WriteOptions,
  ): ReadableStream<string> & AsyncIterable<string>;

  /**
   * Destroy the writer instance and free resources
   */
  destroy(): void;
}

/**
 * Writer API global declaration
 */
declare global {
  interface Window {
    Writer: {
      create(options?: WriterCreateOptions): Promise<Writer>;
      availability(): Promise<'no' | 'after-download' | 'available'>;
    };
  }
  const Writer: Window['Writer'];
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Writer configuration (extends base config)
 */
export interface WriterConfig extends BaseWritingConfig {
  tone: WriterTone;
  format: WriterFormat;
  length: WriterLength;
  outputLanguage: WriterLanguage; // Required for optimal output quality and safety attestation
  sharedContext?: string;
}

/**
 * Default Writer configuration
 */
export const DEFAULT_WRITER_CONFIG: WriterConfig = {
  tone: 'neutral',
  format: 'plain-text',
  length: 'medium',
  outputLanguage: 'en',
  sharedContext: '',
};

/**
 * Writer tone options for UI
 */
export const WRITER_TONE_OPTIONS = [
  {
    value: 'formal' as WriterTone,
    label: 'Formal',
    description: 'Professional, business-appropriate',
    icon: '👔',
  },
  {
    value: 'neutral' as WriterTone,
    label: 'Neutral',
    description: 'Balanced, versatile tone',
    icon: '⚖️',
  },
  {
    value: 'casual' as WriterTone,
    label: 'Casual',
    description: 'Relaxed, conversational',
    icon: '😊',
  },
] as const;

/**
 * Writer format options for UI
 */
export const WRITER_FORMAT_OPTIONS = [
  {
    value: 'markdown' as WriterFormat,
    label: 'Markdown',
    description: 'Formatted with headings, lists, etc.',
    icon: '📝',
  },
  {
    value: 'plain-text' as WriterFormat,
    label: 'Plain Text',
    description: 'Unformatted text',
    icon: '📄',
  },
] as const;

/**
 * Writer length options for UI
 */
export const WRITER_LENGTH_OPTIONS = [
  {
    value: 'short' as WriterLength,
    label: 'Short',
    description: '~100 words',
    icon: '📌',
  },
  {
    value: 'medium' as WriterLength,
    label: 'Medium',
    description: '~250 words',
    icon: '📃',
  },
  {
    value: 'long' as WriterLength,
    label: 'Long',
    description: '~500+ words',
    icon: '📖',
  },
] as const;

// ============================================================================
// State Types
// ============================================================================

/**
 * Writer operation state
 */
export interface WriterState {
  /** Is writing in progress */
  isWriting: boolean;

  /** Is streaming */
  isStreaming: boolean;

  /** Generated content */
  content: string | null;

  /** Operation error */
  error: Error | null;

  /** Is loading (creating instance) */
  isLoading: boolean;
}

/**
 * Writer availability state
 */
export interface WriterAvailabilityState {
  /** Availability status */
  availability: 'no' | 'after-download' | 'available' | null;

  /** Is checking availability */
  isChecking: boolean;

  /** Check error */
  error: Error | null;

  /** Is supported in browser */
  isSupported: boolean;

  /** Requires model download */
  requiresDownload: boolean;
}

// ============================================================================
// Template Types
// ============================================================================

/**
 * Writer prompt template
 */
export interface WriterTemplate {
  /** Template ID */
  id: string;

  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Template category */
  category: string;

  /** Prompt template */
  prompt: string;

  /** Write-specific context (for this particular generation) */
  context?: string;

  /** Recommended configuration */
  config?: Partial<WriterConfig>;

  /** Example output */
  example?: string;

  /** Icon */
  icon?: string;
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
  templates: WriterTemplate[];
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Writer operation result
 */
export interface WriterResult {
  /** Generated content */
  content: string;

  /** Generation timestamp */
  timestamp: number;

  /** Used configuration */
  config: WriterConfig;

  /** Prompt used */
  prompt: string;

  /** Word count */
  wordCount: number;

  /** Character count */
  characterCount: number;
}

// ============================================================================
// Export Types
// ============================================================================

export type { Writer as WriterInstance, WriterCreateOptions as WriterOptions };
