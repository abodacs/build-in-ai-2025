/**
 * Chrome Built-in AI API Type Definitions
 *
 * Type definitions for Chrome's experimental AI APIs
 * Based on the Chrome AI API specification
 */

// ============================================================================
// Download Progress Events
// ============================================================================

/**
 * Download progress event detail
 */
export interface DownloadProgressDetail {
  loaded: number;
  total: number;
}

/**
 * Download progress event
 */
export interface DownloadProgressEvent extends Event {
  detail?: DownloadProgressDetail;
  loaded?: number;
  total?: number;
}

/**
 * Download complete event
 */
export type DownloadCompleteEvent = Event;

/**
 * Download error event detail
 */
export interface DownloadErrorDetail {
  message: string;
}

/**
 * Download error event
 */
export interface DownloadErrorEvent extends Event {
  detail?: DownloadErrorDetail;
}

// ============================================================================
// Chrome AI Summarizer API
// ============================================================================

/**
 * Summarizer availability states
 */
export type SummarizerAvailability = 'no' | 'after-download' | 'available';

/**
 * Summarizer create options
 */
export interface ChromeSummarizerOptions {
  type?: 'key-points' | 'tldr' | 'teaser' | 'headline';
  format?: 'markdown' | 'plain-text';
  length?: 'short' | 'medium' | 'long';
  sharedContext?: string;
  outputLanguage?: 'en' | 'es' | 'ja';
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
}

/**
 * Summarizer instance
 */
export interface ChromeSummarizer {
  summarize(text: string, options?: Record<string, unknown>): Promise<string>;
  summarizeStreaming(
    text: string,
    options?: Record<string, unknown>,
  ): ReadableStream<string>;
  destroy(): void;
}

/**
 * Summarizer API static interface
 */
export interface ChromeSummarizerAPI {
  create(options?: ChromeSummarizerOptions): Promise<ChromeSummarizer>;
  availability(): Promise<SummarizerAvailability>;
}

// ============================================================================
// Chrome AI Translator API
// ============================================================================

/**
 * Translator availability states
 */
export type TranslatorAvailability = 'no' | 'after-download' | 'available';

/**
 * Translator create options
 */
export interface ChromeTranslatorOptions {
  sourceLanguage: string;
  targetLanguage: string;
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
}

/**
 * Translator instance
 */
export interface ChromeTranslator {
  translate(text: string): Promise<string>;
  translateStreaming(text: string): Promise<ReadableStream<string>>;
  destroy(): void;
}

/**
 * Translator API static interface
 */
export interface ChromeTranslatorAPI {
  create(options: ChromeTranslatorOptions): Promise<ChromeTranslator>;
  availability(
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<TranslatorAvailability>;
}

// ============================================================================
// Navigator User Activation API
// ============================================================================

/**
 * User activation state
 */
export interface UserActivation {
  hasBeenActive: boolean;
  isActive: boolean;
}

/**
 * Navigator with user activation
 */
export interface NavigatorWithUserActivation extends Navigator {
  userActivation?: UserActivation;
}

// ============================================================================
// Global Window/Self Augmentation
// ============================================================================

declare global {
  interface Window {
    Summarizer?: ChromeSummarizerAPI;
    Translator?: ChromeTranslatorAPI;
  }

  interface WorkerGlobalScope {
    Summarizer?: ChromeSummarizerAPI;
    Translator?: ChromeTranslatorAPI;
  }

  const Summarizer: ChromeSummarizerAPI | undefined;
  const Translator: ChromeTranslatorAPI | undefined;
}

export {};
