/**
 * Batch Rewriting Types
 *
 * Type definitions for batch text rewriting functionality.
 * Supports processing multiple texts with progress tracking and result management.
 *
 * @module rewriter/types/batch
 */

import type { RewriterConfig } from './rewriter.types';
import type { PerformanceMetrics } from '../../shared/types';

// ============================================================================
// Batch Item Types
// ============================================================================

/**
 * Status of a batch item
 */
export type BatchItemStatus =
  | 'pending' // Not yet processed
  | 'processing' // Currently being processed
  | 'completed' // Successfully completed
  | 'failed' // Failed with error
  | 'cancelled'; // Cancelled by user

/**
 * Single item in a batch rewrite operation
 */
export interface BatchRewriteItem {
  /** Unique identifier for this item */
  id: string;

  /** Original text to rewrite */
  originalText: string;

  /** Rewritten text (populated after completion) */
  rewrittenText: string | null;

  /** Current status */
  status: BatchItemStatus;

  /** Error message if failed */
  error: Error | null;

  /** Performance metrics for this item */
  metrics: PerformanceMetrics | null;

  /** Item-specific context (optional) */
  context?: string;

  /** Metadata (optional, for CSV import) */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Batch Operation Types
// ============================================================================

/**
 * Overall batch operation status
 */
export type BatchStatus =
  | 'idle' // No operation in progress
  | 'running' // Operation in progress
  | 'paused' // Operation paused
  | 'completed' // All items processed
  | 'cancelled'; // Operation cancelled

/**
 * Batch rewrite progress information
 */
export interface BatchProgress {
  /** Total number of items */
  total: number;

  /** Number of completed items */
  completed: number;

  /** Number of failed items */
  failed: number;

  /** Number of cancelled items */
  cancelled: number;

  /** Current item being processed (index) */
  currentIndex: number;

  /** Progress percentage (0-100) */
  percentage: number;

  /** Estimated time remaining (ms) */
  estimatedTimeRemaining: number | null;

  /** Items processed per second */
  itemsPerSecond: number | null;
}

/**
 * Batch rewrite configuration
 */
export interface BatchRewriteConfig extends RewriterConfig {
  /** Maximum concurrent requests */
  maxConcurrent?: number;

  /** Delay between requests (ms) */
  delayBetweenRequests?: number;

  /** Stop on first error */
  stopOnError?: boolean;

  /** Retry failed items */
  retryFailed?: boolean;

  /** Maximum retry attempts */
  maxRetries?: number;
}

/**
 * Batch rewrite result
 */
export interface BatchRewriteResult {
  /** All items with their results */
  items: BatchRewriteItem[];

  /** Overall progress */
  progress: BatchProgress;

  /** Overall status */
  status: BatchStatus;

  /** Start time */
  startTime: number;

  /** End time (null if not completed) */
  endTime: number | null;

  /** Total duration (ms) */
  duration: number | null;

  /** Overall metrics */
  overallMetrics: {
    totalCharactersOriginal: number;
    totalCharactersRewritten: number;
    totalWords: number;
    averageTimePerItem: number | null;
  };
}

// ============================================================================
// Input/Output Types
// ============================================================================

/**
 * Batch input format
 */
export type BatchInputFormat = 'csv' | 'txt' | 'json' | 'manual';

/**
 * Batch output format
 */
export type BatchOutputFormat = 'csv' | 'json' | 'txt';

/**
 * CSV row structure for batch input
 */
export interface BatchCSVRow {
  /** Original text column */
  text: string;

  /** Optional context column */
  context?: string;

  /** Any additional columns as metadata */
  [key: string]: string | undefined;
}

/**
 * Batch import options
 */
export interface BatchImportOptions {
  /** Input format */
  format: BatchInputFormat;

  /** Text column name (for CSV) */
  textColumn?: string;

  /** Context column name (for CSV) */
  contextColumn?: string;

  /** Include header row (for CSV) */
  hasHeader?: boolean;

  /** Delimiter (for CSV) */
  delimiter?: string;

  /** Maximum items to import */
  maxItems?: number;
}

/**
 * Batch export options
 */
export interface BatchExportOptions {
  /** Output format */
  format: BatchOutputFormat;

  /** Include original text */
  includeOriginal?: boolean;

  /** Include metadata */
  includeMetadata?: boolean;

  /** Include metrics */
  includeMetrics?: boolean;

  /** Include only successful items */
  onlySuccessful?: boolean;

  /** File name */
  fileName?: string;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Batch event types
 */
export type BatchEventType =
  | 'start' // Batch started
  | 'item-start' // Item processing started
  | 'item-complete' // Item processing completed
  | 'item-error' // Item processing failed
  | 'progress' // Progress updated
  | 'pause' // Batch paused
  | 'resume' // Batch resumed
  | 'complete' // Batch completed
  | 'cancel'; // Batch cancelled

/**
 * Batch event payload
 */
export interface BatchEvent {
  /** Event type */
  type: BatchEventType;

  /** Item ID (for item-specific events) */
  itemId?: string;

  /** Progress information */
  progress?: BatchProgress;

  /** Error (for error events) */
  error?: Error;

  /** Timestamp */
  timestamp: number;
}

/**
 * Batch event callback
 */
export type BatchEventCallback = (event: BatchEvent) => void;

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Batch rewrite hook return type
 */
export interface UseBatchRewriteReturn {
  /** All items */
  items: BatchRewriteItem[];

  /** Current progress */
  progress: BatchProgress;

  /** Current status */
  status: BatchStatus;

  /** Overall result */
  result: BatchRewriteResult | null;

  /** Configuration */
  config: BatchRewriteConfig;

  /** Actions */
  actions: {
    /** Add items to batch */
    addItems: (texts: string[], contexts?: string[]) => void;

    /** Remove item */
    removeItem: (itemId: string) => void;

    /** Clear all items */
    clearItems: () => void;

    /** Start batch processing */
    start: () => Promise<void>;

    /** Pause batch processing */
    pause: () => void;

    /** Resume batch processing */
    resume: () => void;

    /** Cancel batch processing */
    cancel: () => void;

    /** Retry failed items */
    retryFailed: () => Promise<void>;

    /** Update configuration */
    updateConfig: (config: Partial<BatchRewriteConfig>) => void;

    /** Import from file */
    importFromFile: (
      file: File,
      options?: Partial<BatchImportOptions>,
    ) => Promise<void>;

    /** Export results */
    exportResults: (options?: Partial<BatchExportOptions>) => void;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Batch item filter predicate
 */
export type BatchItemFilter = (item: BatchRewriteItem) => boolean;

/**
 * Batch item sort comparator
 */
export type BatchItemComparator = (
  a: BatchRewriteItem,
  b: BatchRewriteItem,
) => number;

/**
 * Batch statistics
 */
export interface BatchStatistics {
  /** Total items */
  total: number;

  /** Success rate (0-100) */
  successRate: number;

  /** Average processing time per item (ms) */
  averageProcessingTime: number;

  /** Total characters processed */
  totalCharacters: number;

  /** Average characters per item */
  averageCharactersPerItem: number;

  /** Items processed per minute */
  throughput: number;
}

// ============================================================================
// Export
// ============================================================================

export default {
  // No default export needed for types
};
