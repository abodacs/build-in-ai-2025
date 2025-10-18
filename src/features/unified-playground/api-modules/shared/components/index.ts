/**
 * Shared Components - Export Module
 *
 * Central export point for all shared UI components.
 *
 * @module shared/components
 */

// Configuration panel
export { WritingConfigPanel } from './WritingConfigPanel';
export type { WritingConfigPanelProps } from './WritingConfigPanel';

// Streaming indicator
export { StreamingIndicator } from './StreamingIndicator';
export type { StreamingIndicatorProps } from './StreamingIndicator';

// Performance metrics component
export { PerformanceMetrics as PerformanceMetricsDisplay } from './PerformanceMetrics';
export type { PerformanceMetricsProps } from './PerformanceMetrics';

// Character count
export { CharacterCount } from './CharacterCount';
export type { CharacterCountProps } from './CharacterCount';

// Action buttons
export { APIActionButton } from './APIActionButton';
export type { APIActionButtonProps, APIVariant } from './APIActionButton';

// Toast notifications
export { Toast, useToast } from './Toast';
export type {
  ToastProps,
  ToastVariant,
  ToastAction,
  ToastState,
} from './Toast';

// Skeleton loaders
export { ContentGenerationSkeleton } from './ContentGenerationSkeleton';
export type { ContentGenerationSkeletonProps } from './ContentGenerationSkeleton';

export { ContentRewritingSkeleton } from './ContentRewritingSkeleton';
export type { ContentRewritingSkeletonProps } from './ContentRewritingSkeleton';

// Inline error display
export { FieldError } from './FieldError';
export type { FieldErrorProps } from './FieldError';

// Unified model management
export { UnifiedModelManager } from './UnifiedModelManager';
export type {
  UnifiedModelManagerProps,
  ModelInfo,
  DownloadProgress as SharedDownloadProgress,
  LoadingPhase,
} from './UnifiedModelManager';
