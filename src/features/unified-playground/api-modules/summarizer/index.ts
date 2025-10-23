/**
 * Chrome AI Summarizer Module
 *
 * Complete implementation of Chrome AI Summarizer API
 * with progressive disclosure, advanced features, and production-ready code
 *
 * @module summarizer
 */

// ============================================================================
// Components
// ============================================================================

// Core Components
export { SparkButton } from './components/SparkButton';
export type { SparkButtonProps } from './components/SparkButton';

export { SummarizerConfig } from './components/SummarizerConfig';
export type { SummarizerConfigProps } from './components/SummarizerConfig';

export { SummarizerInput } from './components/SummarizerInput';
export type { SummarizerInputProps } from './components/SummarizerInput';

export { SummarizerResults } from './components/SummarizerResults';
export type { SummarizerResultsProps } from './components/SummarizerResults';

export { QuickSamplesCard, QUICK_SAMPLES } from './components/QuickSamplesCard';
export type { QuickSamplesCardProps } from './components/QuickSamplesCard';

// Advanced Components
export { ChunkingStrategySelector } from './components/ChunkingStrategySelector';
export type { ChunkingStrategySelectorProps } from './components/ChunkingStrategySelector';

export { URLExtractionCard } from './components/URLExtractionCard';
export type { URLExtractionCardProps } from './components/URLExtractionCard';

export { ModelDownloadMonitor } from './components/ModelDownloadMonitor';
export type { ModelDownloadMonitorProps } from './components/ModelDownloadMonitor';

export { StreamingPerformanceMonitor } from './components/StreamingPerformanceMonitor';
export type { StreamingPerformanceMonitorProps } from './components/StreamingPerformanceMonitor';

// Re-export shared ModelDownloadProgress for backwards compatibility
export { ModelDownloadProgress } from '../shared/components/ModelDownloadProgress';
export type { ModelDownloadProgressProps } from '../shared/components/ModelDownloadProgress';

// Re-export shared StreamingIndicator for backwards compatibility
export { StreamingIndicator } from '../shared/components/StreamingIndicator';
export type { StreamingIndicatorProps } from '../shared/components/StreamingIndicator';

// Tab Components
export { SummarizerPlayground } from './components/tabs/SummarizerPlayground';
export type { SummarizerPlaygroundProps } from './components/tabs/SummarizerPlayground';

export { PlaygroundTab } from './components/tabs/PlaygroundTab';
export type { PlaygroundTabProps } from './components/tabs/PlaygroundTab';

// ============================================================================
// Hooks
// ============================================================================

export { useSummarizer } from './hooks/useSummarizer';
export type {
  UseSummarizerOptions,
  UseSummarizerReturn,
} from './hooks/useSummarizer';

export { useSummarizerAvailability } from './hooks/useSummarizerAvailability';
export type { UseSummarizerAvailabilityReturn } from './hooks/useSummarizerAvailability';

export { useModelDownload } from './hooks/useModelDownload';
export type { UseModelDownloadReturn } from './hooks/useModelDownload';

// ============================================================================
// Services
// ============================================================================

export { ChromeAIService } from './services/ChromeAIService';
export { ChromeAICompatibility } from './services/ChromeAICompatibility';
export { ErrorHandler } from './services/ErrorHandler';
export { SummarizerManager } from './services/SummarizerManager';
export { ChunkingEngine } from './services/ChunkingEngine';
export { URLExtractor } from './services/URLExtractor';

// ============================================================================
// Types
// ============================================================================

// Core Summarizer Types
export type {
  SummarizerCreateOptions,
  SummarizeOptions,
  SummarizerAvailability,
  PlaygroundAvailability,
  SummarizerErrorType,
  SummarizerError,
  DownloadProgress,
  DownloadProgressEvent,
  SummarizerMetrics,
  Summarizer,
  SummarizerAPI,
  APIVersion,
  BrowserCapabilities,
  SystemRequirements,
  AvailabilityCheckResult,
} from './types/summarizer.types';

export { hasStreamingSupport } from './types/summarizer.types';

// Chunking Types
export type {
  ChunkingStrategyType,
  ChunkingStrategy,
  ChunkingResult,
  ChunkingMetadata,
  RecursiveSummaryResult,
  RecursiveSummaryMetadata,
  ChunkProgressCallback,
  ChunkProgress,
  ChunkAnalysis,
  ChunkingPreview,
  TextSplit,
  ChunkValidation,
  StrategyRecommendation,
  ChunkingPresetKey,
} from './types/chunking.types';

export { ChunkingPresets } from './types/chunking.types';

// API Response Types
export type {
  WebContent,
  WebContentMetadata,
  WebImage,
  WebSummaryResult,
  WebSummaryMetadata,
  UserLevel,
  ContextualHelp,
  UsageInsights,
  SessionMetrics,
  FeatureSuggestions,
  LearningPath,
  ConfigurationComparison,
  ComparisonConfig,
  ComparisonMetrics,
  ComparisonResults,
  GeneratedCode,
  CodeExportFormat,
  OperationHistory,
  PerformanceReport,
  SampleText,
  ExportData,
  ExportFormat,
} from './types/api.types';

// ============================================================================
// Utils
// ============================================================================

export {
  cleanText,
  stripHTML,
  decodeHTMLEntities,
  stripMarkdown,
  countWords,
  estimateReadingTime,
  countCharacters,
  countSentences,
  isLikelyCode,
  detectLanguage,
  truncateText,
  extractFirstSentences,
  validateText,
  isGibberish,
} from './utils/textPreprocessing';

export {
  PerformanceTracker,
  getPerformanceTracker,
  resetPerformanceTracker,
} from './utils/performanceTracker';

export {
  isValidURL,
  normalizeURL,
  parseURL,
  extractDomain,
  isContentSite,
  detectContentType,
  getExtractionStrategy,
  getURLMetadata,
  isExtractable,
  removeTrackingParams,
  getDisplayURL,
} from './utils/urlParser';

// ============================================================================
// Default Export
// ============================================================================

import { SparkButton } from './components/SparkButton';
import { SummarizerConfig } from './components/SummarizerConfig';
import { SummarizerInput } from './components/SummarizerInput';
import { SummarizerResults } from './components/SummarizerResults';
import { QuickSamplesCard } from './components/QuickSamplesCard';
import { ChunkingStrategySelector } from './components/ChunkingStrategySelector';
import { URLExtractionCard } from './components/URLExtractionCard';
import { ModelDownloadMonitor } from './components/ModelDownloadMonitor';
import { StreamingPerformanceMonitor } from './components/StreamingPerformanceMonitor';
import { ModelDownloadProgress } from '../shared/components/ModelDownloadProgress';
import { StreamingIndicator } from '../shared/components/StreamingIndicator';
import { SummarizerPlayground } from './components/tabs/SummarizerPlayground';
import { PlaygroundTab } from './components/tabs/PlaygroundTab';
import { useSummarizer } from './hooks/useSummarizer';
import { useSummarizerAvailability } from './hooks/useSummarizerAvailability';
import { useModelDownload } from './hooks/useModelDownload';
import { ChromeAIService } from './services/ChromeAIService';
import { ChromeAICompatibility } from './services/ChromeAICompatibility';
import { ErrorHandler } from './services/ErrorHandler';
import { SummarizerManager } from './services/SummarizerManager';
import { ChunkingEngine } from './services/ChunkingEngine';
import { URLExtractor } from './services/URLExtractor';
import { getPerformanceTracker } from './utils/performanceTracker';

export default {
  // Components
  SparkButton,
  SummarizerConfig,
  SummarizerInput,
  SummarizerResults,
  QuickSamplesCard,
  ChunkingStrategySelector,
  URLExtractionCard,
  ModelDownloadMonitor,
  StreamingPerformanceMonitor,
  ModelDownloadProgress,
  StreamingIndicator,
  SummarizerPlayground,
  PlaygroundTab,

  // Hooks
  useSummarizer,
  useSummarizerAvailability,
  useModelDownload,

  // Services
  ChromeAIService,
  ChromeAICompatibility,
  ErrorHandler,
  SummarizerManager,
  ChunkingEngine,
  URLExtractor,

  // Utils
  getPerformanceTracker,
};
