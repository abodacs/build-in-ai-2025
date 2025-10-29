/**
 * Shared Type Definitions for Writing APIs (Writer & Rewriter)
 *
 * This module contains all common type definitions used across
 * Writer and Rewriter API implementations.
 *
 * @module writing.types
 */

// ============================================================================
// Chrome AI API - Core Types
// ============================================================================

/**
 * Availability status returned by Chrome AI APIs
 *
 * - 'no': API not available
 * - 'after-download': Available after downloading model
 * - 'available': Immediately available
 */
export type AvailabilityStatus = 'no' | 'after-download' | 'available';

export type LegacyAvailability =
  | 'no'
  | 'readily'
  | 'after-download'
  | 'available';

export type ModernAvailability =
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'available';

/**
 * Common availability type - union of modern and legacy patterns
 * @see ModernAvailability for newer APIs
 * @see LegacyAvailability for LanguageModel/Prompt API
 */
export type Availability = ModernAvailability | LegacyAvailability;

/**
 * Download progress information for model downloads
 */
export interface DownloadProgress {
  /** Bytes downloaded */
  loaded: number;

  /** Total bytes to download */
  total: number;

  /** Progress percentage (0-100) */
  percentage: number;

  /** Estimated time remaining in seconds */
  timeRemaining: number;

  /** Download speed in bytes per second */
  speed?: number;
}

/**
 * Progress callback function
 * Called periodically during model download
 */
export type ProgressCallback = (progress: DownloadProgress) => void;

/**
 * Chunk callback function for streaming
 * Called for each chunk of streamed output
 */
export type ChunkCallback = (chunk: string, metadata: ChunkMetadata) => void;

/**
 * Metadata provided with each streaming chunk
 */
export interface ChunkMetadata {
  /** Index of this chunk in the stream */
  chunkIndex: number;

  /** Total accumulated length so far */
  totalLength: number;

  /** Time elapsed since streaming started (ms) */
  elapsedTime: number;

  /** Estimated progress percentage (0-100) */
  progress: number;

  /** Estimated tokens per second */
  tokensPerSecond?: number;
}

// ============================================================================
// Performance & Metrics
// ============================================================================

/**
 * Performance metrics for API operations
 */
export interface PerformanceMetrics {
  /** Operation duration in milliseconds */
  duration: number;

  /** Number of words in output */
  words?: number;

  /** Number of characters in output */
  characters?: number;

  /** Quality assessment */
  quality?: 'high' | 'medium' | 'low';

  /** Processing speed in tokens per second */
  tokensPerSecond?: number;

  /** First chunk latency (ms) for streaming */
  firstChunkLatency?: number;

  /** Total chunks received (streaming only) */
  totalChunks?: number;
}

/**
 * Performance tracker state
 */
export interface PerformanceTrackerState {
  /** Start timestamp */
  startTime: number;

  /** End timestamp */
  endTime?: number;

  /** First chunk timestamp */
  firstChunkTime?: number;

  /** Chunk count */
  chunkCount: number;

  /** Output length */
  outputLength: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Base configuration for writing APIs
 * Common settings shared by Writer and Rewriter
 */
export interface BaseWritingConfig {
  /** Writing tone/style */
  tone: string;

  /** Output format */
  format: string;

  /** Output length */
  length: string;

  /** Additional context to improve quality */
  sharedContext?: string;
}

/**
 * Configuration option definition
 * Used for dropdowns and selectors
 */
export interface ConfigOption {
  /** Option value (used programmatically) */
  value: string;

  /** Human-readable label */
  label: string;

  /** Optional description/help text */
  description?: string;

  /** Optional icon or emoji */
  icon?: string;
}

/**
 * Configuration sections for grouped options
 */
export interface ConfigSection {
  /** Section ID */
  id: string;

  /** Section title */
  title: string;

  /** Section description */
  description?: string;

  /** Configuration options in this section */
  options: ConfigOption[];
}

// ============================================================================
// API Result Types
// ============================================================================

/**
 * Successful API operation result
 */
export interface ApiSuccess<T = string> {
  /** Operation succeeded */
  success: true;

  /** Result data */
  data: T;

  /** Performance metrics */
  metrics: PerformanceMetrics;

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Failed API operation result
 */
export interface ApiError {
  /** Operation failed */
  success: false;

  /** Error message */
  error: string;

  /** Error code */
  code?: string;

  /** Error details */
  details?: Record<string, unknown>;

  /** Suggested recovery action */
  recovery?: string;
}

/**
 * API operation result (success or error)
 */
export type ApiResult<T = string> = ApiSuccess<T> | ApiError;

// ============================================================================
// Availability Check Results
// ============================================================================

/**
 * Detailed availability check result
 */
export interface AvailabilityCheckResult {
  /** Availability status */
  availability: AvailabilityStatus;

  /** Whether API is supported in browser */
  isSupported: boolean;

  /** Model download required */
  requiresDownload: boolean;

  /** Estimated model size in bytes */
  modelSize?: number;

  /** System requirements */
  requirements?: {
    /** Minimum Chrome version */
    minChromeVersion?: number;

    /** Required feature flags */
    requiredFlags?: string[];

    /** Other requirements */
    other?: string[];
  };

  /** Error if unavailable */
  error?: string;
}

// ============================================================================
// Instance Management Types
// ============================================================================

/**
 * Instance state
 */
export type InstanceState =
  | 'idle' // No instance created
  | 'creating' // Instance being created
  | 'ready' // Instance ready to use
  | 'processing' // Currently processing
  | 'downloading' // Model downloading
  | 'error' // Error state
  | 'destroyed'; // Instance destroyed

/**
 * Instance metadata
 */
export interface InstanceMetadata {
  /** Instance ID */
  id: string;

  /** Creation timestamp */
  createdAt: number;

  /** Last used timestamp */
  lastUsedAt?: number;

  /** Usage count */
  usageCount: number;

  /** Current state */
  state: InstanceState;

  /** Configuration hash for caching */
  configHash?: string;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  /** Validation passed */
  valid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings?: string[];
}

/**
 * Text validation constraints
 */
export interface TextConstraints {
  /** Minimum length */
  minLength?: number;

  /** Maximum length */
  maxLength?: number;

  /** Minimum word count */
  minWords?: number;

  /** Maximum word count */
  maxWords?: number;

  /** Disallowed patterns */
  disallowedPatterns?: RegExp[];

  /** Required patterns */
  requiredPatterns?: RegExp[];
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Loading state
 */
export interface LoadingState {
  /** Is loading */
  isLoading: boolean;

  /** Loading message */
  message?: string;

  /** Progress percentage */
  progress?: number;

  /** Can cancel */
  cancellable?: boolean;
}

/**
 * Error state
 */
export interface ErrorState {
  /** Has error */
  hasError: boolean;

  /** Error message */
  message?: string;

  /** Error code */
  code?: string;

  /** Is recoverable */
  recoverable?: boolean;

  /** Recovery action label */
  recoveryLabel?: string;
}

/**
 * Streaming state
 */
export interface StreamingState {
  /** Is streaming */
  isStreaming: boolean;

  /** Current accumulated output */
  output: string;

  /** Chunks received */
  chunksReceived: number;

  /** Estimated progress */
  progress: number;

  /** Streaming started at */
  startedAt?: number;
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Cache entry
 */
export interface CacheEntry<T> {
  /** Cached value */
  value: T;

  /** Cache key */
  key: string;

  /** Creation timestamp */
  timestamp: number;

  /** Expiration timestamp */
  expiresAt?: number;

  /** Hit count */
  hits: number;

  /** Entry size in bytes */
  size?: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total entries */
  size: number;

  /** Cache hits */
  hits: number;

  /** Cache misses */
  misses: number;

  /** Hit rate percentage */
  hitRate: number;

  /** Total size in bytes */
  totalSize: number;

  /** Max size in bytes */
  maxSize: number;
}

// ============================================================================
// Export All Types
// ============================================================================

export type {
  // Re-export for convenience
  AvailabilityStatus as WritingAvailabilityStatus,
  BaseWritingConfig as WritingConfig,
  ApiResult as WritingApiResult,
  ApiSuccess as WritingApiSuccess,
  ApiError as WritingApiError,
};
