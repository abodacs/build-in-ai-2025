/**
 * Shared Services - Export Module
 *
 * Central export point for all shared service classes.
 *
 * @module shared/services
 */

// Base manager class
export { BaseWritingManager } from './BaseWritingManager';
export { default as BaseWritingManagerDefault } from './BaseWritingManager';

// Streaming handler
export { StreamingHandler } from './StreamingHandler';
export { default as StreamingHandlerDefault } from './StreamingHandler';

// Performance tracker
export {
  PerformanceTracker,
  trackOperation,
  withPerformanceTracking,
} from './PerformanceTracker';
export { default as PerformanceTrackerDefault } from './PerformanceTracker';
