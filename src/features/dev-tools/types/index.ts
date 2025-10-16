/**
 * Developer Tools Types
 *
 * Type definitions for performance monitoring, debugging, and API comparison
 *
 * @module dev-tools/types
 */

// ============================================================================
// Performance Monitoring Types
// ============================================================================

/**
 * Performance metric for a single API call
 */
export interface PerformanceMetric {
  /** Unique metric ID */
  id: string;

  /** API name (e.g., "Summarizer", "Translator") */
  api: string;

  /** Method called (e.g., "summarize", "translate") */
  method: string;

  /** Start timestamp */
  startTime: number;

  /** End timestamp */
  endTime: number;

  /** Duration in milliseconds */
  duration: number;

  /** Request size in bytes */
  requestSize: number;

  /** Response size in bytes */
  responseSize: number;

  /** Token usage */
  tokens?: {
    input: number;
    output: number;
    total: number;
  };

  /** Success or error status */
  status: 'success' | 'error';

  /** Error message if failed */
  error?: string;
}

/**
 * Aggregated performance statistics for an API
 */
export interface PerformanceStats {
  /** API name */
  api: string;

  /** Total number of calls */
  callCount: number;

  /** Average duration in ms */
  avgDuration: number;

  /** Minimum duration in ms */
  minDuration: number;

  /** Maximum duration in ms */
  maxDuration: number;

  /** 95th percentile */
  p95Duration: number;

  /** 99th percentile */
  p99Duration: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Total tokens used */
  totalTokens: number;

  /** Average tokens per call */
  avgTokens: number;
}

/**
 * Memory usage snapshot
 */
export interface MemorySnapshot {
  /** Timestamp */
  timestamp: number;

  /** Used JS heap size in bytes */
  usedJSHeapSize: number;

  /** Total JS heap size in bytes */
  totalJSHeapSize: number;

  /** JS heap size limit in bytes */
  jsHeapSizeLimit: number;

  /** Usage percentage (0-100) */
  usagePercentage: number;
}

// ============================================================================
// Debug Console Types
// ============================================================================

/**
 * Debug log entry for API calls
 */
export interface DebugLogEntry {
  /** Unique entry ID */
  id: string;

  /** Timestamp */
  timestamp: number;

  /** API name */
  api: string;

  /** Method called */
  method: string;

  /** Request payload */
  request: unknown;

  /** Response data */
  response: unknown;

  /** Duration in milliseconds */
  duration: number;

  /** Status */
  status: 'success' | 'error';

  /** Error details if failed */
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Debug console filters
 */
export interface DebugFilters {
  /** Filter by API name */
  api?: string;

  /** Filter by status */
  status?: 'success' | 'error' | 'all';

  /** Search query */
  search?: string;

  /** Time range filter */
  timeRange?: {
    start: number;
    end: number;
  };
}

// ============================================================================
// API Comparison Types
// ============================================================================

/**
 * API comparison configuration
 */
export interface ComparisonConfig {
  /** APIs to compare */
  apis: string[];

  /** Input text/prompt */
  input: string;

  /** Additional options per API */
  options?: Record<string, unknown>;
}

/**
 * Comparison result for a single API
 */
export interface ComparisonResult {
  /** API name */
  api: string;

  /** Response output */
  output: string;

  /** Response time in ms */
  responseTime: number;

  /** Token usage */
  tokens?: {
    input: number;
    output: number;
    total: number;
  };

  /** Status */
  status: 'success' | 'error';

  /** Error message if failed */
  error?: string;

  /** Quality metrics (if available) */
  quality?: {
    /** Output length */
    length: number;

    /** Word count */
    wordCount: number;

    /** Character count */
    charCount: number;
  };
}

/**
 * Full comparison report
 */
export interface ComparisonReport {
  /** Unique report ID */
  id: string;

  /** Timestamp */
  timestamp: number;

  /** Configuration used */
  config: ComparisonConfig;

  /** Results from all APIs */
  results: ComparisonResult[];

  /** Summary statistics */
  summary: {
    /** Fastest API */
    fastest: string;

    /** Slowest API */
    slowest: string;

    /** Most tokens used */
    mostTokens: string;

    /** Least tokens used */
    leastTokens: string;
  };
}

// ============================================================================
// Export Format Types
// ============================================================================

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv' | 'txt';

/**
 * Export data structure
 */
export interface ExportData {
  /** Export type */
  type: 'performance' | 'debug' | 'comparison';

  /** Export format */
  format: ExportFormat;

  /** Timestamp */
  timestamp: number;

  /** Data to export */
  data: unknown;

  /** Metadata */
  metadata?: {
    version: string;
    source: string;
    [key: string]: unknown;
  };
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Developer tools panel state
 */
export interface DevToolsState {
  /** Is panel open? */
  isOpen: boolean;

  /** Active tab */
  activeTab: 'performance' | 'debug' | 'comparison';

  /** Performance metrics */
  metrics: PerformanceMetric[];

  /** Debug logs */
  logs: DebugLogEntry[];

  /** Comparison reports */
  reports: ComparisonReport[];

  /** Current filters */
  filters: DebugFilters;
}
