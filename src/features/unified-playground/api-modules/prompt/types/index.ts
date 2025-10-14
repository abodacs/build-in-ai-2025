/**
 * Prompt API Types Barrel Export
 *
 * Central export point for all Prompt API type definitions
 *
 * @module prompt/types
 */

// ============================================================================
// Chrome AI LanguageModel API Types
// ============================================================================

export type {
  // Configuration
  LanguageModelCreateOptions,
  PromptOptions,
  // Availability
  LanguageModelAvailability,
  // Errors
  LanguageModelErrorType,
  LanguageModelError,
  // Download Progress
  DownloadProgress,
  DownloadProgressEvent,
  // Native API
  LanguageModel,
  LanguageModelAPI,
  LanguageModelCapabilities,
  // Browser Compatibility
  APIVersion,
  BrowserCapabilities,
  SystemRequirements,
  AvailabilityCheckResult,
} from './api.types';

export {
  // Type Guards
  hasStreamingSupport,
  hasTokenCountingSupport,
  hasCloningSupport,
} from './api.types';

// ============================================================================
// Prompt Configuration and Session Types
// ============================================================================

export type {
  // Messages
  MessageRole,
  Message,
  MessageAttachment,
  MessageMetadata,
  // Conversations
  Conversation,
  ConversationMetadata,
  // Configuration
  PromptConfig,
  // Session Management
  PromptSession,
  SessionState,
  SessionStorageData,
  // Context Window
  ContextWindow,
  TokenUsage,
  // Streaming
  StreamingStatus,
  StreamingState,
  // Export/Import
  ExportFormat,
  ExportData,
  // Performance
  PromptMetrics,
  PerformanceStatistics,
  // UI State
  PromptInputState,
  ConfigPanelState,
  ChatInterfaceState,
  // Templates
  PromptTemplate,
} from './prompt.types';

export {
  // Constants
  DEFAULT_PROMPT_CONFIG,
  PROMPT_TEMPLATES,
} from './prompt.types';

// ============================================================================
// Multimodal File Handling Types
// ============================================================================

export type {
  // File Types
  SupportedFileType,
  FileValidationResult,
  FileUploadConstraints,
  // Image Processing
  ImageFormat,
  ImageQuality,
  ImageData,
  ImageMetadata,
  ImageProcessingOptions,
  ImageProcessingResult,
  // Upload State
  UploadStatus,
  FileUploadState,
  UploadedFile,
  // Drag and Drop
  DragDropEventData,
  DragDropState,
  // Preview
  PreviewMode,
  ImagePreviewState,
  PreviewControls,
  // Multimodal Content
  MultimodalContent,
  MultimodalPromptInput,
  // Errors
  FileUploadErrorType,
  FileUploadError,
  // Utilities
  FormattedFileSize,
  ImageDimensionsResult,
  CompressionStatistics,
} from './multimodal.types';

export {
  // Constants
  DEFAULT_FILE_CONSTRAINTS,
  DEFAULT_IMAGE_PROCESSING,
} from './multimodal.types';
