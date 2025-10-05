/**
 * API Response and Request Types
 *
 * Types for API responses, web content extraction, and external integrations
 *
 * @module api.types
 */

// ============================================================================
// Web Content Extraction Types
// ============================================================================

/**
 * Extracted web content structure
 */
export interface WebContent {
  /** Article/page title */
  title: string;

  /** Main content text (cleaned) */
  content: string;

  /** Content metadata */
  metadata: WebContentMetadata;

  /** Extracted images (optional) */
  images?: WebImage[];
}

/**
 * Metadata for web content
 */
export interface WebContentMetadata {
  /** Author name if available */
  author?: string;

  /** Publication date */
  publishDate?: Date;

  /** Word count of content */
  wordCount: number;

  /** Estimated reading time in minutes */
  readingTime: number;

  /** Source domain */
  source: string;

  /** Original URL */
  url: string;

  /** Content language */
  language?: string;

  /** Content description/excerpt */
  description?: string;

  /** Tags/keywords */
  tags?: string[];
}

/**
 * Extracted image information
 */
export interface WebImage {
  /** Image URL */
  url: string;

  /** Alt text */
  alt?: string;

  /** Caption/figcaption */
  caption?: string;

  /** Image width in pixels */
  width?: number;

  /** Image height in pixels */
  height?: number;
}

// ============================================================================
// URL Summarization Types
// ============================================================================

/**
 * Result of URL-based summarization
 */
export interface WebSummaryResult {
  /** Original extracted content */
  original: WebContent;

  /** Generated summary */
  summary: string;

  /** Summary metadata */
  summaryMetadata: WebSummaryMetadata;
}

/**
 * Metadata for web summary
 */
export interface WebSummaryMetadata {
  /** Compression ratio (summary/original word count) */
  compressionRatio: number;

  /** Processing time in milliseconds */
  processingTime: number;

  /** Summary type used */
  summaryType: string;

  /** Number of chunks processed if long content */
  chunksProcessed?: number;

  /** Extraction time in milliseconds */
  extractionTime?: number;

  /** Total time (extraction + processing) */
  totalTime?: number;
}

// ============================================================================
// Learn-by-Doing UX Types
// ============================================================================

/**
 * User level for progressive disclosure
 */
export type UserLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Contextual help content
 */
export interface ContextualHelp {
  /** Help message type/id */
  type: string;

  /** Help title */
  title: string;

  /** Help message content */
  message: string;

  /** Optional tip */
  tip?: string;

  /** Optional action button */
  action?: string;

  /** Optional documentation link */
  documentation?: string;
}

/**
 * Usage insights for experienced users
 */
export interface UsageInsights {
  /** Session metrics */
  sessionMetrics: SessionMetrics;

  /** Feature suggestions */
  suggestions: FeatureSuggestions;

  /** Learning path recommendations */
  learningPath: LearningPath;
}

/**
 * Session metrics tracking
 */
export interface SessionMetrics {
  /** Number of summaries generated */
  summariesGenerated: number;

  /** Configurations explored */
  configurationsExplored: string[];

  /** Features used */
  featuresUsed: string[];

  /** Average processing time */
  averageProcessingTime: number;

  /** Total characters processed */
  totalCharactersProcessed: number;

  /** Session start time */
  sessionStartTime: Date;
}

/**
 * Feature suggestions based on usage
 */
export interface FeatureSuggestions {
  /** Next recommended feature to try */
  nextFeature: string;

  /** Optimization tips */
  optimizationTips: string[];

  /** Documentation links */
  documentationLinks: string[];
}

/**
 * Learning path progression
 */
export interface LearningPath {
  /** Current user level */
  currentLevel: UserLevel;

  /** Recommended explorations */
  recommendedExplorations: string[];

  /** Implementation readiness */
  implementationReadiness: boolean;

  /** Next milestone */
  nextMilestone?: string;
}

// ============================================================================
// Comparison Mode Types
// ============================================================================

/**
 * Configuration comparison
 */
export interface ConfigurationComparison {
  /** Comparison ID */
  id: string;

  /** Configuration A */
  configA: ComparisonConfig;

  /** Configuration B */
  configB: ComparisonConfig;

  /** Comparison results */
  results: ComparisonResults;
}

/**
 * Configuration for comparison
 */
export interface ComparisonConfig {
  /** Config label */
  label: string;

  /** Summarizer options */
  options: import('./summarizer.types').SummarizerCreateOptions;

  /** Result summary */
  summary?: string;

  /** Processing metrics */
  metrics?: ComparisonMetrics;
}

/**
 * Metrics for comparison
 */
export interface ComparisonMetrics {
  /** Processing time in milliseconds */
  processingTime: number;

  /** Word count */
  wordCount: number;

  /** Compression ratio */
  compressionRatio: number;

  /** Quality score (subjective) */
  qualityScore?: number;
}

/**
 * Comparison analysis results
 */
export interface ComparisonResults {
  /** Winner based on criteria */
  winner: 'A' | 'B' | 'tie';

  /** Comparison criteria */
  criteria: {
    speed: 'A' | 'B' | 'tie';
    compression: 'A' | 'B' | 'tie';
    quality: 'A' | 'B' | 'tie';
  };

  /** Recommendations */
  recommendation: string;
}

// ============================================================================
// Code Generation Types
// ============================================================================

/**
 * Generated code output
 */
export interface GeneratedCode {
  /** Programming language */
  language: 'typescript' | 'javascript';

  /** Generated code string */
  code: string;

  /** Code description */
  description: string;

  /** Include streaming support? */
  includeStreaming: boolean;

  /** Configuration used */
  config: import('./summarizer.types').SummarizerCreateOptions;
}

/**
 * Code export format
 */
export type CodeExportFormat =
  | 'typescript'
  | 'javascript'
  | 'markdown'
  | 'html';

// ============================================================================
// Performance Tracking Types
// ============================================================================

/**
 * Operation history entry
 */
export interface OperationHistory {
  /** Operation ID */
  id: string;

  /** Timestamp */
  timestamp: Date;

  /** Operation type */
  type: 'summarize' | 'summarize-streaming' | 'url-extract';

  /** Input size */
  inputSize: number;

  /** Output size */
  outputSize: number;

  /** Processing time */
  processingTime: number;

  /** Success status */
  success: boolean;

  /** Error if failed */
  error?: string;
}

/**
 * Performance report
 */
export interface PerformanceReport {
  /** Report period */
  period: {
    start: Date;
    end: Date;
  };

  /** Total operations */
  totalOperations: number;

  /** Success rate */
  successRate: number;

  /** Average processing time */
  averageProcessingTime: number;

  /** Total data processed */
  totalDataProcessed: number;

  /** Operations by type */
  operationsByType: Record<string, number>;

  /** Performance over time */
  performanceOverTime: Array<{
    timestamp: Date;
    processingTime: number;
  }>;
}

// ============================================================================
// Sample Data Types
// ============================================================================

/**
 * Pre-configured sample text
 */
export interface SampleText {
  /** Unique sample ID */
  id: string;

  /** Display label */
  label: string;

  /** Icon/emoji */
  icon: string;

  /** Sample text content */
  text: string;

  /** Sample description */
  description: string;

  /** Recommended configuration */
  recommendedConfig?: import('./summarizer.types').SummarizerCreateOptions;

  /** Sample category */
  category?: 'article' | 'technical' | 'news' | 'long-form' | 'url';
}

// ============================================================================
// Export/Import Types
// ============================================================================

/**
 * Export data format
 */
export interface ExportData {
  /** Export format version */
  version: string;

  /** Export timestamp */
  timestamp: Date;

  /** Configuration */
  config: import('./summarizer.types').SummarizerCreateOptions;

  /** Input text */
  input: string;

  /** Output summary */
  output: string;

  /** Metrics */
  metrics: import('./summarizer.types').SummarizerMetrics;
}

/**
 * Export format
 */
export type ExportFormat = 'json' | 'markdown' | 'txt' | 'csv';
