/**
 * Chrome AI Summarizer API Type Definitions
 *
 * Based on Chrome AI Summarizer API specification
 * Supports both window.Summarizer and self.Summarizer implementations
 *
 * @module summarizer.types
 */

// ============================================================================
// Chrome AI Summarizer Configuration Types
// ============================================================================

/**
 * Configuration options for creating a summarizer instance
 */
export interface SummarizerCreateOptions {
  /**
   * Type of summary to generate
   * - 'key-points': Extract main points as bullet points
   * - 'tldr': Generate a brief "too long; didn't read" summary
   * - 'teaser': Create a teaser/preview summary
   * - 'headline': Generate a headline-style summary
   */
  type?: 'key-points' | 'tldr' | 'teaser' | 'headline';

  /**
   * Output format for the summary
   * - 'markdown': Formatted markdown output
   * - 'plain-text': Plain text output
   */
  format?: 'markdown' | 'plain-text';

  /**
   * Desired length of the summary
   * - 'short': Concise summary
   * - 'medium': Balanced summary
   * - 'long': Detailed summary
   */
  length?: 'short' | 'medium' | 'long';

  /**
   * Optional shared context to guide the summarization
   * Helps the AI understand the purpose or audience for the summary
   */
  sharedContext?: string;

  /**
   * Output language code
   * Supported languages: 'en' (English), 'es' (Spanish), 'ja' (Japanese)
   *
   * Note: An output language MUST be specified to ensure optimal output quality
   * and properly attest to output safety. This is now required by the Chrome AI API.
   */
  outputLanguage: 'en' | 'es' | 'ja';

  /**
   * Optional AbortSignal for cancellation support
   */
  signal?: AbortSignal;

  /**
   * Optional callback for model download progress monitoring
   */
  monitor?: (monitor: EventTarget) => void;
}

/**
 * Options for the summarize operation
 */
export interface SummarizeOptions {
  /**
   * Optional context for this specific summarization
   * Can be used to provide additional guidance per request
   */
  context?: string;

  /**
   * Output language code
   * Supported languages: 'en' (English), 'es' (Spanish), 'ja' (Japanese)
   *
   * Note: An output language MUST be specified to ensure optimal output quality
   * and properly attest to output safety. This is now required by the Chrome AI API.
   */
  outputLanguage: 'en' | 'es' | 'ja';

  /**
   * Optional AbortSignal for cancellation support
   */
  signal?: AbortSignal;
}

// ============================================================================
// Chrome AI Availability Types
// ============================================================================

/**
 * Availability states from Chrome AI API
 * - 'no': API not available on this device/browser
 * - 'after-download': API available but requires model download
 * - 'available': API immediately available (model already downloaded)
 */
export type SummarizerAvailability = 'no' | 'after-download' | 'available';

/**
 * Playground API compatibility (window.Summarizer uses different values)
 */
export type PlaygroundAvailability =
  | 'not-available'
  | 'downloadable'
  | 'available'
  | 'downloading';

// ============================================================================
// Error Types
// ============================================================================

/**
 * Chrome AI specific error types
 */
export type SummarizerErrorType =
  | 'NotSupportedError' // API not supported in this browser
  | 'InvalidStateError' // API in invalid state
  | 'NotReadableError' // Model download/reading failed
  | 'AbortError'; // Operation was aborted

/**
 * Structured error information
 */
export interface SummarizerError {
  type: SummarizerErrorType;
  message: string;
  recoverable: boolean;
  suggestion: string;
  action?: () => Promise<void>;
}

// ============================================================================
// Download Progress Types
// ============================================================================

/**
 * Model download progress information
 */
export interface DownloadProgress {
  /** Bytes downloaded so far */
  loaded: number;

  /** Total bytes to download */
  total: number;

  /** Progress percentage (0-100) */
  percentage: number;

  /** Estimated time remaining in seconds (optional) */
  timeRemaining?: number;
}

/**
 * Download progress event from Chrome AI
 */
export interface DownloadProgressEvent {
  loaded: number;
  total: number;
}

// ============================================================================
// Performance Metrics Types
// ============================================================================

/**
 * Performance metrics for summarization operations
 */
export interface SummarizerMetrics {
  /** Time taken to initialize the model (ms) */
  modelInitTime: number | null;

  /** Array of individual summarization times (ms) */
  summaryTimes: number[];

  /** Average summarization time (ms) */
  averageTime: number;

  /** Cache hit rate (0-1) for model reuse */
  cacheHitRate: number;

  /** Streaming latency measurements (ms per chunk) */
  streamingLatency: number[];

  /** Original word count (for compression ratio) */
  originalWordCount?: number;

  /** Summary word count */
  summaryWordCount?: number;

  /** Compression ratio (original/summary) */
  compressionRatio?: number;

  /** Number of chunks processed (for long content) */
  chunksProcessed?: number;

  /** Last processing time (ms) */
  processingTime?: number;
}

// ============================================================================
// Chrome AI Native Types (for reference)
// ============================================================================

/**
 * Native Chrome AI Summarizer instance
 * (This is provided by the browser, not implemented by us)
 */
export interface Summarizer {
  /**
   * Summarize the given text
   */
  summarize(text: string, options?: SummarizeOptions): Promise<string>;

  /**
   * Summarize with streaming support
   */
  summarizeStreaming?(
    text: string,
    options?: SummarizeOptions,
  ): ReadableStream<string>;

  /**
   * Clean up the summarizer instance
   */
  destroy(): void;
}

/**
 * Native Chrome AI Summarizer API (global)
 */
export interface SummarizerAPI {
  /**
   * Check if the Summarizer API is available
   */
  availability(): Promise<SummarizerAvailability>;

  /**
   * Create a new summarizer instance
   */
  create(options?: SummarizerCreateOptions): Promise<Summarizer>;
}

/**
 * Type guard to check if streaming is supported
 */
export function hasStreamingSupport(
  summarizer: Summarizer,
): summarizer is Summarizer & {
  summarizeStreaming: (
    text: string,
    options?: SummarizeOptions,
  ) => ReadableStream<string>;
} {
  return (
    'summarizeStreaming' in summarizer &&
    typeof summarizer.summarizeStreaming === 'function'
  );
}

// ============================================================================
// Browser Compatibility Types
// ============================================================================

/**
 * API version detection
 */
export type APIVersion = 'window' | 'self' | 'none';

/**
 * Browser capability information
 */
export interface BrowserCapabilities {
  /** Is the API supported at all? */
  supported: boolean;

  /** Which API version is available */
  version: APIVersion;

  /** Current availability status */
  availability: SummarizerAvailability;

  /** Feature capabilities */
  capabilities: {
    streaming: boolean;
    downloadProgress: boolean;
    contexts: boolean;
  };
}

/**
 * System requirements for Chrome AI
 */
export interface SystemRequirements {
  chromeVersion: string;
  storageRequired: string;
  vramRequired: string;
  networkRequired: boolean;
}

/**
 * Availability check result
 */
export interface AvailabilityCheckResult {
  availability: SummarizerAvailability;
  requirements: SystemRequirements;
}
