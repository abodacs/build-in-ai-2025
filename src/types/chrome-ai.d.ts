/**
 * Chrome Built-in AI API Type Definitions
 *
 * Type definitions for Chrome's experimental AI APIs
 * Based on the Chrome AI API specification
 */

// ============================================================================
// Shared Types
// ============================================================================

/**
 * Modern availability states (used by Summarizer, Writer, Rewriter, Translator, etc.)
 * Represents the current availability and download state of the API
 */
export type ModernAvailability =
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'available';

/**
 * Legacy availability states (used by LanguageModel/Prompt API)
 * Represents whether the API can be used readily or requires download
 */
export type LegacyAvailability = 'no' | 'readily' | 'after-download';

/**
 * Common availability type - union of modern and legacy patterns
 * @see ModernAvailability for newer APIs
 * @see LegacyAvailability for LanguageModel/Prompt API
 */
export type Availability = ModernAvailability | LegacyAvailability;

/**
 * Create monitor for tracking download progress
 */
export interface CreateMonitor extends EventTarget {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: DownloadProgressEvent) => void,
  ): void;
}

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
// Chrome AI Language Model / Prompt API
// ============================================================================

/**
 * Language Model availability states
 */
export type LanguageModelAvailability = Availability;

/**
 * Message role in conversation
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * Input/Output type specifications
 */
export interface ExpectedIO {
  type: 'text' | 'image';
  languages?: string[];
}

/**
 * Text content in a message
 */
export interface TextContent {
  type: 'text';
  value: string;
}

/**
 * Image content in a message
 */
export interface ImageContent {
  type: 'image';
  value: HTMLImageElement | Blob;
}

/**
 * Message content (text or image)
 */
export type MessageContent =
  | string
  | TextContent
  | ImageContent
  | (TextContent | ImageContent)[];

/**
 * Conversation message
 */
export interface Message {
  role: MessageRole;
  content: MessageContent;
  prefix?: boolean;
}

/**
 * Tool definition for function calling
 */
export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (args: Record<string, unknown>) => Promise<string> | string;
}

/**
 * JSON Schema for response constraints
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: unknown;
}

/**
 * Language Model create options
 */
export interface LanguageModelCreateOptions {
  topK?: number;
  temperature?: number;
  expectedInputs?: ExpectedIO[];
  expectedOutputs?: ExpectedIO[];
  tools?: Tool[];
  signal?: AbortSignal;
  initialPrompts?: Message[];
  monitor?: (monitor: CreateMonitor) => void;
}

/**
 * Language Model availability options
 */
export interface LanguageModelAvailabilityOptions {
  topK?: number;
  temperature?: number;
  expectedInputs?: ExpectedIO[];
  expectedOutputs?: ExpectedIO[];
}

/**
 * Language Model prompt options
 */
export interface LanguageModelPromptOptions {
  signal?: AbortSignal;
  responseConstraint?: JSONSchema;
  omitResponseConstraintInput?: boolean;
}

/**
 * Language Model clone options
 */
export interface LanguageModelCloneOptions {
  signal?: AbortSignal;
}

/**
 * Language Model append options
 */
export interface LanguageModelAppendOptions {
  signal?: AbortSignal;
}

/**
 * Language Model measure input usage options
 */
export interface LanguageModelMeasureInputUsageOptions {
  signal?: AbortSignal;
}

/**
 * Language Model parameters
 */
export interface LanguageModelParams {
  defaultTopK: number;
  maxTopK: number;
  defaultTemperature: number;
  maxTemperature: number;
}

/**
 * Language Model instance
 */
export interface LanguageModel extends EventTarget {
  prompt(
    input: string | Message[],
    options?: LanguageModelPromptOptions,
  ): Promise<string>;
  promptStreaming(
    input: string | Message[],
    options?: LanguageModelPromptOptions,
  ): AsyncIterable<string>;
  append(
    input: string | Message[],
    options?: LanguageModelAppendOptions,
  ): Promise<void>;
  clone(options?: LanguageModelCloneOptions): Promise<LanguageModel>;
  measureInputUsage(
    input: string | Message[],
    options?: LanguageModelMeasureInputUsageOptions,
  ): Promise<number>;
  destroy(): void;

  readonly topK: number;
  readonly temperature: number;
  readonly inputQuota: number;
  readonly inputUsage: number;

  onquotaoverflow: ((event: Event) => void) | null;
  addEventListener(
    type: 'quotaoverflow',
    listener: (event: Event) => void,
  ): void;
  removeEventListener(
    type: 'quotaoverflow',
    listener: (event: Event) => void,
  ): void;
}

/**
 * Language Model API static interface
 */
export interface LanguageModelAPI {
  create(options?: LanguageModelCreateOptions): Promise<LanguageModel>;
  availability(
    options?: LanguageModelAvailabilityOptions,
  ): Promise<LanguageModelAvailability>;
  params(): Promise<LanguageModelParams>;
}

// ============================================================================
// Chrome AI Writer API
// ============================================================================

/**
 * Writer availability states
 */
export type WriterAvailability = Availability;

/**
 * Writer tone options
 */
export type WriterTone = 'formal' | 'neutral' | 'casual';

/**
 * Writer format options
 */
export type WriterFormat = 'plain-text' | 'markdown';

/**
 * Writer length options
 */
export type WriterLength = 'short' | 'medium' | 'long';

/**
 * Writer create options
 */
export interface ChromeWriterOptions {
  tone?: WriterTone;
  format?: WriterFormat;
  length?: WriterLength;
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
  sharedContext?: string;
  signal?: AbortSignal;
  monitor?: (monitor: CreateMonitor) => void;
}

/**
 * Writer availability options
 */
export interface ChromeWriterAvailabilityOptions {
  tone?: WriterTone;
  format?: WriterFormat;
  length?: WriterLength;
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
}

/**
 * Writer operation options
 */
export interface ChromeWriterOperationOptions {
  signal?: AbortSignal;
  context?: string;
}

/**
 * Writer measure input usage options
 */
export interface ChromeWriterMeasureInputUsageOptions {
  signal?: AbortSignal;
  context?: string;
}

/**
 * Writer instance
 */
export interface ChromeWriter {
  write(
    prompt: string,
    options?: ChromeWriterOperationOptions,
  ): Promise<string>;
  writeStreaming(
    prompt: string,
    options?: ChromeWriterOperationOptions,
  ): AsyncIterable<string>;
  measureInputUsage(
    prompt: string,
    options?: ChromeWriterMeasureInputUsageOptions,
  ): Promise<number>;
  destroy(): void;

  readonly sharedContext?: string;
  readonly tone: WriterTone;
  readonly format: WriterFormat;
  readonly length: WriterLength;
  readonly expectedInputLanguages?: string[];
  readonly expectedContextLanguages?: string[];
  readonly outputLanguage?: string;
  readonly inputQuota: number;
}

/**
 * Writer API static interface
 */
export interface ChromeWriterAPI {
  create(options?: ChromeWriterOptions): Promise<ChromeWriter>;
  availability(
    options?: ChromeWriterAvailabilityOptions,
  ): Promise<WriterAvailability>;
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
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
  sharedContext?: string;
  signal?: AbortSignal;
  monitor?: (monitor: CreateMonitor) => void;
}

/**
 * Summarizer availability options
 */
export interface ChromeSummarizerAvailabilityOptions {
  type?: 'key-points' | 'tldr' | 'teaser' | 'headline';
  format?: 'markdown' | 'plain-text';
  length?: 'short' | 'medium' | 'long';
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
}

/**
 * Summarizer operation options
 */
export interface ChromeSummarizerOperationOptions {
  signal?: AbortSignal;
  context?: string;
}

/**
 * Summarizer measure input usage options
 */
export interface ChromeSummarizerMeasureInputUsageOptions {
  signal?: AbortSignal;
  context?: string;
}

/**
 * Summarizer instance
 */
export interface ChromeSummarizer {
  summarize(
    text: string,
    options?: ChromeSummarizerOperationOptions,
  ): Promise<string>;
  summarizeStreaming(
    text: string,
    options?: ChromeSummarizerOperationOptions,
  ): AsyncIterable<string>;
  measureInputUsage(
    text: string,
    options?: ChromeSummarizerMeasureInputUsageOptions,
  ): Promise<number>;
  destroy(): void;

  readonly sharedContext?: string;
  readonly type: 'key-points' | 'tldr' | 'teaser' | 'headline';
  readonly format: 'markdown' | 'plain-text';
  readonly length: 'short' | 'medium' | 'long';
  readonly expectedInputLanguages?: string[];
  readonly expectedContextLanguages?: string[];
  readonly outputLanguage?: string;
  readonly inputQuota: number;
}

/**
 * Summarizer API static interface
 */
export interface ChromeSummarizerAPI {
  create(options?: ChromeSummarizerOptions): Promise<ChromeSummarizer>;
  availability(
    options?: ChromeSummarizerAvailabilityOptions,
  ): Promise<SummarizerAvailability>;
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
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
  sharedContext?: string;
  signal?: AbortSignal;
  monitor?: (monitor: CreateMonitor) => void;
}

/**
 * Rewriter availability options
 */
export interface ChromeRewriterAvailabilityOptions {
  tone?: 'as-is' | 'more-formal' | 'more-casual';
  format?: 'as-is' | 'plain-text' | 'markdown';
  length?: 'as-is' | 'shorter' | 'longer';
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
}

/**
 * Rewriter operation options
 */
export interface ChromeRewriterOperationOptions {
  signal?: AbortSignal;
  context?: string;
}

/**
 * Rewriter measure input usage options
 */
export interface ChromeRewriterMeasureInputUsageOptions {
  signal?: AbortSignal;
  context?: string;
}

/**
 * Rewriter instance
 */
export interface ChromeRewriter {
  rewrite(
    input: string,
    options?: ChromeRewriterOperationOptions,
  ): Promise<string>;
  rewriteStreaming(
    input: string,
    options?: ChromeRewriterOperationOptions,
  ): AsyncIterable<string>;
  measureInputUsage(
    input: string,
    options?: ChromeRewriterMeasureInputUsageOptions,
  ): Promise<number>;
  destroy(): void;

  readonly sharedContext?: string;
  readonly tone: 'as-is' | 'more-formal' | 'more-casual';
  readonly format: 'as-is' | 'plain-text' | 'markdown';
  readonly length: 'as-is' | 'shorter' | 'longer';
  readonly expectedInputLanguages?: string[];
  readonly expectedContextLanguages?: string[];
  readonly outputLanguage?: string;
  readonly inputQuota: number;
}

/**
 * Rewriter API static interface
 */
export interface ChromeRewriterAPI {
  create(options?: ChromeRewriterOptions): Promise<ChromeRewriter>;
  availability(
    options?: ChromeRewriterAvailabilityOptions,
  ): Promise<RewriterAvailability>;
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
 * Proofreader result - array of corrections
 */
export type ProofreadResult = ChromeProofreaderCorrection[];

/**
 * Proofreader operation options
 */
export interface ChromeProofreaderOperationOptions {
  context?: string;
  signal?: AbortSignal;
}

/**
 * Proofreader instance
 * Based on official specification
 */
export interface ChromeProofreader {
  proofread(
    input: string,
    options?: ChromeProofreaderOperationOptions,
  ): Promise<ProofreadResult>;
  proofreadStreaming(
    input: string,
    options?: ChromeProofreaderOperationOptions,
  ): AsyncIterable<string>;
  destroy(): void;

  readonly expectedInputLanguages: ProofreaderLanguage[];
  readonly correctionExplanationLanguage?: string;
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
 * Language Detector create options
 */
export interface ChromeLanguageDetectorOptions {
  signal?: AbortSignal;
  monitor?: (monitor: CreateMonitor) => void;
}

/**
 * Language Detector availability options
 */
export interface ChromeLanguageDetectorAvailabilityOptions {
  expectedInputLanguages?: string[];
}

/**
 * Language Detector detect options
 */
export interface ChromeLanguageDetectorDetectOptions {
  signal?: AbortSignal;
}

/**
 * Language Detector instance
 */
export interface ChromeLanguageDetector {
  detect(
    text: string,
    options?: ChromeLanguageDetectorDetectOptions,
  ): Promise<ChromeLanguageDetectionResult[]>;
  destroy(): void;
}

/**
 * Language Detector API static interface
 */
export interface ChromeLanguageDetectorAPI {
  create(
    options?: ChromeLanguageDetectorOptions,
  ): Promise<ChromeLanguageDetector>;
  availability(
    options?: ChromeLanguageDetectorAvailabilityOptions,
  ): Promise<LanguageDetectorAvailability>;
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
  monitor?: (monitor: CreateMonitor) => void;
}

/**
 * Translator availability options
 */
export interface ChromeTranslatorAvailabilityOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

/**
 * Translator operation options
 */
export interface ChromeTranslatorOperationOptions {
  signal?: AbortSignal;
}

/**
 * Translator measure input usage options
 */
export interface ChromeTranslatorMeasureInputUsageOptions {
  signal?: AbortSignal;
}

/**
 * Translator instance
 */
export interface ChromeTranslator {
  translate(
    text: string,
    options?: ChromeTranslatorOperationOptions,
  ): Promise<string>;
  translateStreaming(
    text: string,
    options?: ChromeTranslatorOperationOptions,
  ): AsyncIterable<string>;
  measureInputUsage(
    text: string,
    options?: ChromeTranslatorMeasureInputUsageOptions,
  ): Promise<number>;
  destroy(): void;

  readonly sourceLanguage: string;
  readonly targetLanguage: string;
  readonly inputQuota: number;
}

/**
 * Translator API static interface
 */
export interface ChromeTranslatorAPI {
  create(options: ChromeTranslatorOptions): Promise<ChromeTranslator>;
  availability(
    options: ChromeTranslatorAvailabilityOptions,
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
    LanguageModel?: LanguageModelAPI;
    Writer?: ChromeWriterAPI;
    Summarizer?: ChromeSummarizerAPI;
    Rewriter?: ChromeRewriterAPI;
    Translator?: ChromeTranslatorAPI;
    LanguageDetector?: ChromeLanguageDetectorAPI;
    Proofreader?: ChromeProofreaderAPI;
  }

  interface WorkerGlobalScope {
    LanguageModel?: LanguageModelAPI;
    Writer?: ChromeWriterAPI;
    Summarizer?: ChromeSummarizerAPI;
    Rewriter?: ChromeRewriterAPI;
    Translator?: ChromeTranslatorAPI;
    LanguageDetector?: ChromeLanguageDetectorAPI;
    Proofreader?: ChromeProofreaderAPI;
  }

  const LanguageModel: LanguageModelAPI | undefined;
  const Writer: ChromeWriterAPI | undefined;
  const Summarizer: ChromeSummarizerAPI | undefined;
  const Rewriter: ChromeRewriterAPI | undefined;
  const Translator: ChromeTranslatorAPI | undefined;
  const LanguageDetector: ChromeLanguageDetectorAPI | undefined;
  const Proofreader: ChromeProofreaderAPI | undefined;
}

export {};
