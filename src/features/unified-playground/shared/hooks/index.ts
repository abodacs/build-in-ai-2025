/**
 * Shared Hooks - Export Module
 *
 * Central export point for all shared hooks
 *
 * @module shared/hooks
 */

// Performance metrics
export { usePerformanceMetrics } from './usePerformanceMetrics';

// Playground state
export { usePlaygroundState } from './usePlaygroundState';

// Responsive breakpoints
export {
  useBreakpoint,
  useIsMobile,
  useIsTabletOrSmaller,
  useIsDesktop,
  type Breakpoint,
} from './useBreakpoint';
