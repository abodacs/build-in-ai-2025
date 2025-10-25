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
 * Based on official Chrome AI specification
 */
export type SummarizerAvailability =
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'available';

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
// Chrome AI Rewriter API
// ============================================================================

/**
 * Rewriter availability states
 * Based on official Chrome AI specification
 */
export type RewriterAvailability =
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'available';

/**
 * Rewriter create options
 */
export interface ChromeRewriterOptions {
  tone?: 'as-is' | 'more-formal' | 'more-casual';
  format?: 'as-is' | 'plain-text' | 'markdown';
  length?: 'as-is' | 'shorter' | 'longer';
  sharedContext?: string;
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
}

/**
 * Rewriter instance
 */
export interface ChromeRewriter {
  rewrite(input: string, context?: string): Promise<string>;
  rewriteStreaming(input: string, context?: string): ReadableStream<string>;
  destroy(): void;
}

/**
 * Rewriter API static interface
 */
export interface ChromeRewriterAPI {
  create(options?: ChromeRewriterOptions): Promise<ChromeRewriter>;
  availability(): Promise<RewriterAvailability>;
}

// ============================================================================
// Chrome AI Proofreader API
// ============================================================================

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
 * Proofreader language codes
 *
 * NOTE: Currently only English ('en') is supported by the Chrome AI Proofreader model.
 * Other languages are reserved for future use.
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

/**
 * Proofreader correction type
 * Based on official Chrome AI Proofreader specification
 */
export type ProofreaderCorrectionType =
  | 'spelling'
  | 'punctuation'
  | 'capitalization'
  | 'preposition'
  | 'missing-words'
  | 'grammar';

/**
 * Proofreader correction mode
 */
export type ProofreaderCorrectionMode = 'light' | 'standard' | 'thorough';

/**
 * Proofreader create options
 * Based on official specification
 */
export interface ChromeProofreaderOptions {
  expectedInputLanguages?: ProofreaderLanguage[];
  outputLanguage?: ProofreaderLanguage;
  includeCorrectionTypes?: boolean;
  includeCorrectionExplanations?: boolean;
  correctionExplanationLanguage?: string;
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
}

/**
 * Proofreader correction
 * Based on official specification
 */
export interface ChromeProofreaderCorrection {
  startIndex: number;
  endIndex: number;
  correction: string;
  type?: ProofreaderCorrectionType;
  explanation?: string;
}

/**
 * Proofreader result
 */
export interface ChromeProofreaderResult {
  corrections: ChromeProofreaderCorrection[];
}

/**
 * Proofreader instance
 * Based on official specification
 */
export interface ChromeProofreader {
  proofread(
    input: string,
    options?: { context?: string; signal?: AbortSignal },
  ): Promise<ChromeProofreaderResult>;
  proofreadStreaming(
    input: string,
    options?: { context?: string; signal?: AbortSignal },
  ): ReadableStream;
  destroy(): void;
  readonly expectedInputLanguages: ProofreaderLanguage[];
  readonly correctionExplanationLanguage: string;
  readonly includeCorrectionExplanations: boolean;
  readonly includeCorrectionTypes: boolean;
}

/**
 * Proofreader API static interface
 */
export interface ChromeProofreaderAPI {
  create(options?: ChromeProofreaderOptions): Promise<ChromeProofreader>;
  availability(options?: {
    expectedInputLanguages?: ProofreaderLanguage[];
  }): Promise<ProofreaderAvailability>;
}

// ============================================================================
// Chrome AI Language Detection API
// ============================================================================

/**
 * Language Detector availability states
 * Based on official Chrome AI specification
 */
export type LanguageDetectorAvailability =
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'available';

/**
 * Language detection result
 */
export interface ChromeLanguageDetectionResult {
  detectedLanguage: string | null;
  confidence: 'high' | 'medium' | 'low' | 'not-applicable';
}

/**
 * Language Detector instance
 */
export interface ChromeLanguageDetector {
  detect(text: string): Promise<ChromeLanguageDetectionResult[]>;
  destroy(): void;
}

/**
 * Language Detector API static interface
 */
export interface ChromeLanguageDetectorAPI {
  create(): Promise<ChromeLanguageDetector>;
  availability(): Promise<LanguageDetectorAvailability>;
}

// ============================================================================
// Chrome AI Translator API
// ============================================================================

/**
 * Translator availability states
 * Based on official Chrome AI specification
 */
export type TranslatorAvailability =
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'available';

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
    Rewriter?: ChromeRewriterAPI;
    Proofreader?: ChromeProofreaderAPI;
    LanguageDetector?: ChromeLanguageDetectorAPI;
  }

  interface WorkerGlobalScope {
    Summarizer?: ChromeSummarizerAPI;
    Translator?: ChromeTranslatorAPI;
    Rewriter?: ChromeRewriterAPI;
    Proofreader?: ChromeProofreaderAPI;
    LanguageDetector?: ChromeLanguageDetectorAPI;
  }

  const Summarizer: ChromeSummarizerAPI | undefined;
  const Translator: ChromeTranslatorAPI | undefined;
  const Rewriter: ChromeRewriterAPI | undefined;
  const Proofreader: ChromeProofreaderAPI | undefined;
  const LanguageDetector: ChromeLanguageDetectorAPI | undefined;
}

export {};
