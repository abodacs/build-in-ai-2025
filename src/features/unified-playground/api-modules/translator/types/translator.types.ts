/**
 * Type definitions for Chrome AI Translator API
 * Based on Chrome Built-in AI Translator specification
 */

// ============================================================================
// Chrome AI Translator API Types
// ============================================================================

/**
 * Options for creating a translator instance
 */
export interface TranslatorCreateOptions {
  /** Source language (BCP 47 code) */
  sourceLanguage: string;
  /** Target language (BCP 47 code) */
  targetLanguage: string;
  /** Optional abort signal for cancellation */
  signal?: AbortSignal;
  /** Optional download progress monitor */
  monitor?: (monitor: EventTarget) => void;
}

/**
 * Options for translation operations
 */
export interface TranslateOptions {
  /** Optional context to improve translation accuracy */
  context?: string;
  /** Optional abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Chrome AI Translator instance interface
 */
export interface Translator {
  /**
   * Translates text from source to target language
   * @param text - Text to translate
   * @param options - Translation options
   * @returns Promise resolving to translated text
   */
  translate(text: string, options?: TranslateOptions): Promise<string>;

  /**
   * Translates text with streaming support
   * @param text - Text to translate
   * @param options - Translation options
   * @returns Async iterable stream of translation chunks
   */
  translateStreaming(
    text: string,
    options?: TranslateOptions,
  ): AsyncIterable<string>;

  /**
   * Destroys the translator instance and frees resources
   */
  destroy(): void;
}

/**
 * Availability check options
 */
export interface TranslatorAvailability {
  sourceLanguage: string;
  targetLanguage: string;
}

/**
 * Availability status values
 */
export type AvailabilityStatus = 'no' | 'after-download' | 'readily';

/**
 * Download progress event
 */
export interface DownloadProgressEvent extends Event {
  /** Bytes downloaded so far */
  loaded: number;
  /** Total bytes to download */
  total: number;
}

// ============================================================================
// Application Types
// ============================================================================

/**
 * Translation result with metadata
 */
export interface TranslationResult {
  /** Original input text */
  original: string;
  /** Translated output text */
  translated: string;
  /** Source language code */
  sourceLanguage: string;
  /** Target language code */
  targetLanguage: string;
  /** Timestamp of translation */
  timestamp: string;
  /** Optional performance metrics */
  performance?: PerformanceMetrics;
}

/**
 * Performance metrics for translations
 */
export interface PerformanceMetrics {
  /** Translation latency in milliseconds */
  translationLatency: number;
  /** Throughput in characters per second */
  throughput: number;
  /** Whether this was a cache hit */
  cacheHit: boolean;
  /** Optional model download time in milliseconds */
  downloadTime?: number;
  /** Optional streaming metrics */
  streamingMetrics?: StreamingMetrics;
}

/**
 * Streaming-specific metrics
 */
export interface StreamingMetrics {
  /** Time to first chunk in milliseconds */
  firstChunkLatency: number;
  /** Total number of chunks received */
  chunkCount: number;
  /** Average chunk size in characters */
  averageChunkSize: number;
  /** Chunks per second */
  chunksPerSecond: number;
}

// ============================================================================
// Language Support Types
// ============================================================================

/**
 * BCP 47 language codes supported by the Translator API
 */
export type LanguageCode =
  | 'en' // English
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'it' // Italian
  | 'pt' // Portuguese
  | 'ru' // Russian
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'zh' // Chinese (Simplified)
  | 'zh-Hant' // Chinese (Traditional)
  | 'ar' // Arabic
  | 'hi'; // Hindi

/**
 * Language information
 */
export interface LanguageInfo {
  /** BCP 47 language code */
  code: LanguageCode;
  /** English name of the language */
  name: string;
  /** Native name of the language */
  nativeName: string;
  /** Flag emoji for the language */
  flag: string;
  /** Whether the language is RTL (right-to-left) */
  isRTL?: boolean;
}

/**
 * Language pair
 */
export interface LanguagePair {
  source: LanguageCode;
  target: LanguageCode;
}

/**
 * Supported languages with metadata
 */
export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    isRTL: false,
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    isRTL: false,
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    isRTL: false,
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    isRTL: false,
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    isRTL: false,
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    isRTL: false,
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    isRTL: false,
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    isRTL: false,
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    isRTL: false,
  },
  zh: {
    code: 'zh',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flag: '🇨🇳',
    isRTL: false,
  },
  'zh-Hant': {
    code: 'zh-Hant',
    name: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    flag: '🇹🇼',
    isRTL: false,
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    isRTL: true,
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    isRTL: false,
  },
};

/**
 * Popular language pairs for quick selection
 */
export const POPULAR_LANGUAGE_PAIRS: LanguagePair[] = [
  { source: 'ar', target: 'es' }, // Arabic → Spanish
  { source: 'en', target: 'es' }, // English → Spanish
  { source: 'en', target: 'fr' }, // English → French
  { source: 'en', target: 'de' }, // English → German
  { source: 'en', target: 'zh' }, // English → Chinese
  { source: 'es', target: 'en' }, // Spanish → English
  { source: 'fr', target: 'en' }, // French → English
  { source: 'ja', target: 'en' }, // Japanese → English
  { source: 'ko', target: 'en' }, // Korean → English
];

// ============================================================================
// Batch Translation Types
// ============================================================================

/**
 * Batch translation item
 */
export interface BatchItem {
  /** Unique identifier for the item */
  id: string;
  /** Text to translate */
  text: string;
  /** Optional context for this item */
  context?: string;
}

/**
 * Batch translation result
 */
export interface BatchResult {
  /** Item ID */
  id: string;
  /** Original text */
  original: string;
  /** Translated text (empty if failed) */
  translated: string;
  /** Source language */
  sourceLanguage: string;
  /** Target language */
  targetLanguage: string;
  /** Whether translation was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Performance metrics */
  performance?: PerformanceMetrics;
}

/**
 * Batch translation options
 */
export interface BatchTranslationOptions {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  items: BatchItem[];
  onProgress?: (completed: number, total: number) => void;
  concurrency?: number;
  signal?: AbortSignal;
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Cache entry for language pair translators
 */
export interface CacheEntry {
  /** Translator instance */
  translator: Translator;
  /** Source language */
  sourceLanguage: string;
  /** Target language */
  targetLanguage: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last used timestamp */
  lastUsed: number;
  /** Usage count */
  useCount: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Current cache size */
  size: number;
  /** Maximum cache size */
  maxSize: number;
  /** Cache entries */
  entries: CacheEntryStats[];
  /** Hit rate percentage */
  hitRate: number;
  /** Total hits */
  hits: number;
  /** Total misses */
  misses: number;
}

/**
 * Cache entry statistics
 */
export interface CacheEntryStats {
  /** Language pair key */
  languagePair: string;
  /** Usage count */
  useCount: number;
  /** Age in milliseconds */
  age: number;
}

// ============================================================================
// Streaming Types
// ============================================================================

/**
 * Streaming options
 */
export interface StreamingOptions {
  /** Optional context */
  context?: string;
  /** Abort signal */
  signal?: AbortSignal;
  /** Chunk callback */
  onChunk?: (chunk: string, metadata: ChunkMetadata) => void;
  /** Progress callback */
  onProgress?: (progress: number) => void;
}

/**
 * Chunk metadata
 */
export interface ChunkMetadata {
  /** Total translation length so far */
  totalLength: number;
  /** Chunk number (1-indexed) */
  chunkNumber: number;
  /** Estimated progress (0-100) */
  progress: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Translation error types
 */
export enum TranslationErrorType {
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  LANGUAGE_PAIR_UNAVAILABLE = 'LANGUAGE_PAIR_UNAVAILABLE',
  MODEL_DOWNLOAD_FAILED = 'MODEL_DOWNLOAD_FAILED',
  TRANSLATION_FAILED = 'TRANSLATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CANCELLED = 'CANCELLED',
  INVALID_INPUT = 'INVALID_INPUT',
  CONTEXT_TOO_LONG = 'CONTEXT_TOO_LONG',
  TEXT_TOO_LONG = 'TEXT_TOO_LONG',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Translation error class
 */
export class TranslationError extends Error {
  constructor(
    message: string,
    public type: TranslationErrorType,
    public recoverable: boolean = false,
    public originalError?: Error,
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * TranslatorConfig component props
 */
export interface TranslatorConfigProps {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  context?: string;
  onSourceLanguageChange: (lang: LanguageCode) => void;
  onTargetLanguageChange: (lang: LanguageCode) => void;
  onContextChange: (context: string) => void;
  onSwapLanguages: () => void;
  availability: AvailabilityStatus;
  isCheckingAvailability?: boolean;
  // Advanced settings
  advancedSettings: AdvancedSettings;
  onAdvancedSettingsChange: (settings: AdvancedSettings) => void;
  disabled?: boolean;
  // View Code integration
  onViewCode?: () => void;
  // Availability recheck
  onRecheckAvailability?: () => void;
  // Download progress (0-100 percentage, null if not downloading)
  downloadProgress?: number | null;
}

/**
 * TranslatorInput component props
 */
export interface TranslatorInputProps {
  value: string;
  onChange: (value: string) => void;
  detectedLanguage?: LanguageCode;
  detectionConfidence?: number;
  maxLength?: number;
  placeholder?: string;
  onDetectLanguage?: () => void;
  disabled?: boolean;
  /** Inline error message to display */
  error?: string;
  /** Error help text for recovery guidance */
  errorHelpText?: string;
}

/**
 * TranslatorResults component props
 */
export interface TranslatorResultsProps {
  originalText: string;
  translatedText: string;
  isStreaming: boolean;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  performance?: PerformanceMetrics;
  onCopy: (text: string) => void;
  onDownload: () => void;
  onRetry: () => void;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * useTranslator hook return type
 */
export interface UseTranslatorReturn {
  translate: (text: string) => Promise<string | null>;
  translateStreaming: (
    text: string,
    onChunk: (chunk: string) => void,
  ) => Promise<string | null>;
  isLoading: boolean;
  error: Error | null;
  result: TranslationResult | null;
  reset: () => void;
  cancel: () => void;
}

/**
 * useTranslator hook options
 */
export interface UseTranslatorOptions {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  context?: string;
  onDownloadProgress?: (
    progress: number,
    loaded: number,
    total: number,
  ) => void;
}

/**
 * useTranslatorAvailability hook return type
 */
export interface UseTranslatorAvailabilityReturn {
  availability: AvailabilityStatus | null;
  isChecking: boolean;
  error: Error | null;
  recheck: () => void;
  downloadProgress: number | null; // 0-100 percentage, null if not downloading
}

// ============================================================================
// Advanced Options Types
// ============================================================================

/**
 * Streaming mode options
 */
export type StreamingMode = 'auto' | 'always' | 'never';

/**
 * Translation quality/tone options
 */
export type TranslationQuality = 'standard' | 'formal' | 'casual' | 'technical';

/**
 * Batch concurrency level (1-5)
 */
export type ConcurrencyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Advanced translation settings
 */
export interface AdvancedSettings {
  /** Streaming mode preference */
  streamingMode: StreamingMode;

  /** Translation quality/tone */
  quality: TranslationQuality;

  /** Batch processing concurrency level */
  concurrency: ConcurrencyLevel;

  /** Word threshold for auto streaming */
  streamingThreshold: number;
}

/**
 * Default advanced settings
 */
export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  streamingMode: 'auto',
  quality: 'standard',
  concurrency: 3,
  streamingThreshold: 100,
};

// ============================================================================
// Global Type Declarations
// ============================================================================

declare global {
  interface Window {
    Translator?: {
      create(options: TranslatorCreateOptions): Promise<Translator>;
      availability(
        options: TranslatorAvailability,
      ): Promise<AvailabilityStatus>;
    };
  }
}

export {};
