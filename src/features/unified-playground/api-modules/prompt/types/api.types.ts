/**
 * Chrome AI LanguageModel API Type Definitions
 *
 * Based on Chrome Built-in AI LanguageModel API specification
 * Supports window.LanguageModel (Chrome 138+)
 *
 * @module prompt/types/api.types
 */

// ============================================================================
// Chrome AI LanguageModel Configuration Types
// ============================================================================

/**
 * Configuration options for creating a LanguageModel instance
 */
export interface LanguageModelCreateOptions {
  /**
   * System prompt that defines the model's behavior and personality
   * Guides the model's responses throughout the conversation
   */
  systemPrompt?: string;

  /**
   * Temperature controls randomness/creativity (0.0 - 1.0)
   * - Lower values (0.0-0.3): More deterministic, focused responses
   * - Medium values (0.4-0.7): Balanced creativity and consistency
   * - Higher values (0.8-1.0): More creative, diverse responses
   * Default: 0.8
   */
  temperature?: number;

  /**
   * Top-K sampling - number of highest probability tokens to consider
   * - Lower values (1-10): More focused, predictable
   * - Medium values (10-30): Balanced diversity
   * - Higher values (30-50): More diverse, exploratory
   * Range: 1-50, Default: 8
   */
  topK?: number;

  /**
   * Maximum number of tokens to generate
   * Controls response length (typically 1 token ~= 4 characters)
   * Range: 1-4096, Default: 2048
   */
  maxTokens?: number;

  /**
   * Optional AbortSignal for cancellation support
   * Allows canceling model creation/download
   */
  signal?: AbortSignal;

  /**
   * Optional callback for model download progress monitoring
   * Receives an EventTarget that emits 'downloadprogress' events
   */
  monitor?: (monitor: EventTarget) => void;

  /**
   * Expected input types for multimodal support
   * Enables image and/or audio input when specified
   * Example: [{type: 'image'}, {type: 'audio'}]
   */
  expectedInputs?: ExpectedInput[];

  /**
   * Initial conversation prompts for multimodal sessions
   * Allows setting up conversation context with multimodal content
   */
  initialPrompts?: MultimodalContent[];
}

/**
 * Options for prompt execution
 */
export interface PromptOptions {
  /**
   * Optional AbortSignal for cancellation support
   * Allows canceling prompt execution mid-stream
   */
  signal?: AbortSignal;
}

// ============================================================================
// Multimodal Types (Images + Audio Support)
// ============================================================================

/**
 * Content item in a multimodal message
 */
export interface MultimodalContentItem {
  /** Content type */
  type: 'text' | 'image' | 'audio';

  /** Content value - string for text, Blob/File for media */
  value: string | Blob;
}

/**
 * Multimodal message content
 * User-specified format for sending images and audio alongside text
 */
export interface MultimodalContent {
  /** Message role */
  role: 'user' | 'assistant';

  /** Array of content items (text, images, audio) */
  content: MultimodalContentItem[];
}

/**
 * Expected input type for multimodal sessions
 */
export interface ExpectedInput {
  /** Input type to enable */
  type: 'image' | 'audio';
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
export type LanguageModelAvailability = 'no' | 'after-download' | 'available';

// ============================================================================
// Error Types
// ============================================================================

/**
 * Chrome AI specific error types
 */
export type LanguageModelErrorType =
  | 'NotSupportedError' // API not supported in this browser
  | 'InvalidStateError' // API in invalid state
  | 'NotReadableError' // Model download/reading failed
  | 'AbortError' // Operation was aborted
  | 'QuotaExceededError' // Token limit exceeded
  | 'TypeError'; // Invalid parameter type

/**
 * Structured error information
 */
export interface LanguageModelError {
  type: LanguageModelErrorType;
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

  /** Download speed in bytes/second (optional) */
  downloadSpeed?: number;
}

/**
 * Download progress event from Chrome AI
 */
export interface DownloadProgressEvent {
  loaded: number;
  total: number;
}

// ============================================================================
// Chrome AI Native Types (Browser-provided)
// ============================================================================

/**
 * Native Chrome AI LanguageModel instance
 * (This is provided by the browser, not implemented by us)
 */
export interface LanguageModel {
  /**
   * Execute a prompt and get a response
   * @param prompt - The user prompt to send to the model
   * @param options - Optional configuration for this request
   * @returns Promise resolving to the model's response
   */
  prompt(prompt: string, options?: PromptOptions): Promise<string>;

  /**
   * Execute a prompt with streaming support
   * Returns chunks of the response as they're generated
   * @param prompt - The user prompt to send to the model
   * @param options - Optional configuration for this request
   * @returns ReadableStream of response chunks
   */
  promptStreaming(
    prompt: string,
    options?: PromptOptions,
  ): ReadableStream<string>;

  /**
   * Append multimodal message(s) to the conversation
   * Used for sending images and audio alongside text
   * Requires session created with expectedInputs
   * @param messages - Array of multimodal messages to append
   * @returns Promise resolving to the model's response
   */
  append?(messages: MultimodalContent[]): Promise<string>;

  /**
   * Append multimodal message(s) with streaming support
   * Used for sending images and audio alongside text with streaming response
   * Requires session created with expectedInputs
   * @param messages - Array of multimodal messages to append
   * @returns ReadableStream of response chunks
   */
  appendStreaming?(messages: MultimodalContent[]): ReadableStream<string>;

  /**
   * Count tokens in a given text
   * Useful for managing context windows and estimating costs
   * @param text - Text to count tokens for
   * @returns Promise resolving to token count
   */
  countPromptTokens?(text: string): Promise<number>;

  /**
   * Get maximum number of tokens the model supports
   * @returns Maximum tokens
   */
  maxTokens?: number;

  /**
   * Get number of tokens used so far in current session
   * @returns Tokens used
   */
  tokensSoFar?: number;

  /**
   * Get number of tokens available for next prompt
   * @returns Tokens left
   */
  tokensLeft?: number;

  /**
   * Clone the current session state
   * Creates a new LanguageModel with the same conversation history
   * @returns Promise resolving to cloned model
   */
  clone?(): Promise<LanguageModel>;

  /**
   * Clean up the model instance and free resources
   */
  destroy(): void;
}

/**
 * Native Chrome AI LanguageModel API (global)
 * Accessed via window.LanguageModel
 */
export interface LanguageModelAPI {
  /**
   * Check if the LanguageModel API is available
   * @returns Promise resolving to availability status
   */
  availability(): Promise<LanguageModelAvailability>;

  /**
   * Create a new LanguageModel instance
   * @param options - Configuration options
   * @returns Promise resolving to LanguageModel instance
   */
  create(options?: LanguageModelCreateOptions): Promise<LanguageModel>;

  /**
   * Get capabilities of the LanguageModel API
   * @returns Promise resolving to capabilities object
   */
  capabilities?(): Promise<LanguageModelCapabilities>;
}

/**
 * LanguageModel capabilities information
 */
export interface LanguageModelCapabilities {
  /** Is streaming supported? */
  supportsStreaming: boolean;

  /** Is token counting supported? */
  supportsTokenCounting: boolean;

  /** Is session cloning supported? */
  supportsCloning: boolean;

  /** Maximum supported temperature */
  maxTemperature: number;

  /** Maximum supported topK */
  maxTopK: number;

  /** Maximum supported tokens */
  maxTokens: number;

  /** Supported languages */
  supportedLanguages?: string[];
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if streaming is supported
 */
export function hasStreamingSupport(
  model: LanguageModel,
): model is LanguageModel & {
  promptStreaming: (
    prompt: string,
    options?: PromptOptions,
  ) => ReadableStream<string>;
} {
  return (
    'promptStreaming' in model && typeof model.promptStreaming === 'function'
  );
}

/**
 * Type guard to check if token counting is supported
 */
export function hasTokenCountingSupport(
  model: LanguageModel,
): model is LanguageModel & {
  countPromptTokens: (text: string) => Promise<number>;
  maxTokens: number;
  tokensSoFar: number;
  tokensLeft: number;
} {
  return (
    'countPromptTokens' in model &&
    typeof model.countPromptTokens === 'function' &&
    'maxTokens' in model &&
    'tokensSoFar' in model &&
    'tokensLeft' in model
  );
}

/**
 * Type guard to check if session cloning is supported
 */
export function hasCloningSupport(
  model: LanguageModel,
): model is LanguageModel & {
  clone: () => Promise<LanguageModel>;
} {
  return 'clone' in model && typeof model.clone === 'function';
}

/**
 * Type guard to check if multimodal append is supported
 */
export function hasMultimodalSupport(
  model: LanguageModel,
): model is LanguageModel & {
  append: (messages: MultimodalContent[]) => Promise<string>;
  appendStreaming?: (messages: MultimodalContent[]) => ReadableStream<string>;
} {
  return 'append' in model && typeof model.append === 'function';
}

/**
 * Type guard to check if multimodal streaming is supported
 */
export function hasMultimodalStreamingSupport(
  model: LanguageModel,
): model is LanguageModel & {
  append: (messages: MultimodalContent[]) => Promise<string>;
  appendStreaming: (messages: MultimodalContent[]) => ReadableStream<string>;
} {
  return (
    'append' in model &&
    typeof model.append === 'function' &&
    'appendStreaming' in model &&
    typeof model.appendStreaming === 'function'
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
  availability: LanguageModelAvailability;

  /** Feature capabilities */
  capabilities: {
    streaming: boolean;
    tokenCounting: boolean;
    cloning: boolean;
    downloadProgress: boolean;
    multimodal: boolean;
  };
}

/**
 * System requirements for Chrome AI
 */
export interface SystemRequirements {
  /** Minimum Chrome version required */
  minChromeVersion: number;

  /** Required Chrome flags */
  requiredFlags: string[];

  /** Storage space required for model */
  storageRequired: string;

  /** RAM required for model */
  ramRequired: string;

  /** Network required for initial download? */
  networkRequired: boolean;

  /** Other requirements */
  other?: string[];
}

/**
 * Availability check result
 */
export interface AvailabilityCheckResult {
  /** Current availability status */
  availability: LanguageModelAvailability;

  /** Is the API supported? */
  isSupported: boolean;

  /** Does it require model download? */
  requiresDownload: boolean;

  /** System requirements */
  requirements: SystemRequirements;

  /** Error message if not available */
  error?: string;
}
