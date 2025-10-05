/**
 * Chunking Strategy Types for Long Content Processing
 *
 * Supports recursive, sliding-window, and semantic chunking strategies
 * for content that exceeds model context limits (~10,000 characters)
 *
 * @module chunking.types
 */

// ============================================================================
// Chunking Strategy Types
// ============================================================================

/**
 * Available chunking strategies for long content
 */
export type ChunkingStrategyType = 'recursive' | 'sliding-window' | 'semantic';

/**
 * Configuration for chunking strategy
 */
export interface ChunkingStrategy {
  /**
   * Type of chunking strategy to use
   * - 'recursive': Hierarchical processing with recursive summarization
   * - 'sliding-window': Overlapping windows for continuity preservation
   * - 'semantic': Boundary-aware splits at natural break points
   */
  type: ChunkingStrategyType;

  /**
   * Maximum size of each chunk in characters
   * Default: 10000
   */
  maxChunkSize: number;

  /**
   * Overlap size for sliding-window strategy (in characters)
   * Only used when type === 'sliding-window'
   * Default: 500
   */
  overlapSize?: number;

  /**
   * Separator patterns for semantic chunking
   * Only used when type === 'semantic'
   * Default: ['\n\n', '\n', '. ']
   */
  semanticSeparators?: string[];
}

// ============================================================================
// Chunking Result Types
// ============================================================================

/**
 * Result of chunking operation
 */
export interface ChunkingResult {
  /** Array of text chunks */
  chunks: string[];

  /** Metadata about the chunking operation */
  metadata: ChunkingMetadata;
}

/**
 * Metadata about chunking operation
 */
export interface ChunkingMetadata {
  /** Original content length in characters */
  originalLength: number;

  /** Number of chunks created */
  chunkCount: number;

  /** Strategy used for chunking */
  strategy: ChunkingStrategyType;

  /** Estimated processing time in milliseconds */
  estimatedProcessingTime: number;

  /** Average chunk size */
  averageChunkSize?: number;

  /** Recursion depth (for recursive strategy) */
  recursionDepth?: number;
}

// ============================================================================
// Recursive Summarization Types
// ============================================================================

/**
 * Result of recursive summarization
 */
export interface RecursiveSummaryResult {
  /** Final summary text */
  summary: string;

  /** Metadata about the recursive process */
  metadata: RecursiveSummaryMetadata;
}

/**
 * Metadata for recursive summarization
 */
export interface RecursiveSummaryMetadata {
  /** Original word count */
  originalWordCount: number;

  /** Final summary word count */
  finalWordCount: number;

  /** Compression ratio (final/original) */
  compressionRatio: number;

  /** Total processing time in milliseconds */
  processingTime: number;

  /** Number of chunks processed */
  chunksProcessed: number;

  /** Maximum recursion depth reached */
  recursionLevels: number;

  /** Individual chunk processing times */
  chunkProcessingTimes?: number[];
}

// ============================================================================
// Progress Tracking Types
// ============================================================================

/**
 * Progress callback for chunking operations
 */
export type ChunkProgressCallback = (current: number, total: number) => void;

/**
 * Progress information for chunking
 */
export interface ChunkProgress {
  /** Current chunk being processed (0-indexed) */
  current: number;

  /** Total number of chunks */
  total: number;

  /** Percentage complete (0-100) */
  percentage: number;

  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining?: number;

  /** Current processing stage */
  stage: 'chunking' | 'summarizing' | 'combining';
}

// ============================================================================
// Chunk Analysis Types
// ============================================================================

/**
 * Analysis of a text chunk
 */
export interface ChunkAnalysis {
  /** Chunk index */
  index: number;

  /** Chunk size in characters */
  size: number;

  /** Word count */
  wordCount: number;

  /** Estimated processing time in milliseconds */
  estimatedProcessingTime: number;

  /** Has overlap with previous chunk? */
  hasOverlap: boolean;

  /** Overlap size if applicable */
  overlapSize?: number;
}

/**
 * Preview of chunking operation before execution
 */
export interface ChunkingPreview {
  /** Estimated number of chunks */
  estimatedChunks: number;

  /** Estimated total processing time in milliseconds */
  estimatedProcessingTime: number;

  /** Estimated recursion depth (for recursive strategy) */
  estimatedRecursionDepth: number;

  /** Strategy that will be used */
  strategy: ChunkingStrategyType;

  /** Chunk size distribution */
  chunkSizeDistribution: {
    min: number;
    max: number;
    average: number;
  };
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Text split result
 */
export interface TextSplit {
  /** Array of text segments */
  segments: string[];

  /** Separator used for splitting */
  separator: string;

  /** Whether split was successful */
  success: boolean;
}

/**
 * Chunk validation result
 */
export interface ChunkValidation {
  /** Is the chunk valid? */
  valid: boolean;

  /** Validation errors if any */
  errors: string[];

  /** Validation warnings if any */
  warnings: string[];
}

/**
 * Strategy recommendation based on content analysis
 */
export interface StrategyRecommendation {
  /** Recommended strategy */
  strategy: ChunkingStrategyType;

  /** Confidence score (0-1) */
  confidence: number;

  /** Reasoning for recommendation */
  reasoning: string;

  /** Alternative strategies */
  alternatives: Array<{
    strategy: ChunkingStrategyType;
    confidence: number;
    reasoning: string;
  }>;
}

// ============================================================================
// Configuration Presets
// ============================================================================

/**
 * Predefined chunking configurations for common scenarios
 */
export const ChunkingPresets = {
  /** Standard recursive chunking - good for most content */
  STANDARD_RECURSIVE: {
    type: 'recursive' as ChunkingStrategyType,
    maxChunkSize: 10000,
  },

  /** Sliding window with moderate overlap - preserves continuity */
  SLIDING_MODERATE: {
    type: 'sliding-window' as ChunkingStrategyType,
    maxChunkSize: 10000,
    overlapSize: 500,
  },

  /** Sliding window with high overlap - maximum continuity */
  SLIDING_HIGH_OVERLAP: {
    type: 'sliding-window' as ChunkingStrategyType,
    maxChunkSize: 10000,
    overlapSize: 2000,
  },

  /** Semantic chunking for structured documents */
  SEMANTIC_STRUCTURED: {
    type: 'semantic' as ChunkingStrategyType,
    maxChunkSize: 10000,
    semanticSeparators: ['\n\n', '\n', '. ', '! ', '? '],
  },

  /** Small chunks for detailed processing */
  SMALL_CHUNKS: {
    type: 'recursive' as ChunkingStrategyType,
    maxChunkSize: 5000,
  },

  /** Large chunks for faster processing */
  LARGE_CHUNKS: {
    type: 'recursive' as ChunkingStrategyType,
    maxChunkSize: 15000,
  },
} as const;

/**
 * Type for chunking preset keys
 */
export type ChunkingPresetKey = keyof typeof ChunkingPresets;
