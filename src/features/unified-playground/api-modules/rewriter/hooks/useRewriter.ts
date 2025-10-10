/**
 * useRewriter Hook
 *
 * React hook for Chrome AI Rewriter API operations.
 * Provides complete state management for rewriting with streaming support.
 *
 * Features:
 * - Rewrite operations (standard + streaming)
 * - Configuration management
 * - Loading and error states
 * - Performance metrics
 * - Cancellation support
 * - Automatic cleanup
 *
 * @module rewriter/hooks/useRewriter
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { RewriterManager } from '../services';
import { PerformanceTracker } from '../../shared/services';
import type { RewriterConfig } from '../types';
import type { PerformanceMetrics } from '../../shared/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Rewriter hook return type
 */
export interface UseRewriterReturn {
  /** Is currently rewriting */
  isRewriting: boolean;

  /** Is streaming in progress */
  isStreaming: boolean;

  /** Rewritten content */
  content: string | null;

  /** Original input text */
  originalInput: string | null;

  /** Error if any */
  error: Error | null;

  /** Is loading (creating instance) */
  isLoading: boolean;

  /** Current configuration */
  config: RewriterConfig;

  /** Performance metrics */
  metrics: PerformanceMetrics | null;

  /** Actions */
  actions: {
    /** Rewrite text */
    rewrite: (input: string, context?: string) => Promise<string>;

    /** Rewrite with streaming */
    rewriteStreaming: (
      input: string,
      onChunk: (chunk: string) => void,
      context?: string,
    ) => Promise<string>;

    /** Cancel current operation */
    cancel: () => void;

    /** Reset state */
    reset: () => void;

    /** Update configuration */
    updateConfig: (config: Partial<RewriterConfig>) => void;
  };
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useRewriter hook
 *
 * Complete hook for Rewriter API operations with state management.
 *
 * @param initialConfig - Initial configuration
 * @returns Hook return object
 *
 * @example
 * ```tsx
 * const {
 *   isRewriting,
 *   content,
 *   originalInput,
 *   error,
 *   config,
 *   metrics,
 *   actions
 * } = useRewriter({
 *   tone: 'more-formal',
 *   format: 'markdown',
 *   length: 'as-is'
 * });
 *
 * // Rewrite with streaming
 * await actions.rewriteStreaming(inputText, (chunk) => {
 *   console.log('Received chunk:', chunk);
 * });
 * ```
 */
export function useRewriter(initialConfig: RewriterConfig): UseRewriterReturn {
  // State
  const [config, setConfig] = useState<RewriterConfig>(initialConfig);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [originalInput, setOriginalInput] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  // Refs
  const managerRef = useRef<RewriterManager>(new RewriterManager());
  const abortControllerRef = useRef<AbortController | null>(null);
  const performanceTrackerRef = useRef<PerformanceTracker>(
    new PerformanceTracker(),
  );
  const isMountedRef = useRef(true);

  // Update manager config when config changes
  useEffect(() => {
    managerRef.current.updateConfig(config);
  }, [config]);

  // Cleanup on unmount
  useEffect(() => {
    const manager = managerRef.current;
    return () => {
      isMountedRef.current = false;
      manager.cleanup();
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * Rewrite text
   */
  const rewrite = useCallback(
    async (input: string, context?: string): Promise<string> => {
      if (!isMountedRef.current) {
        throw new Error('Component unmounted');
      }

      // Reset state
      setError(null);
      setIsRewriting(true);
      setIsStreaming(false);
      setIsLoading(true);
      setOriginalInput(input);
      setContent(null);
      setMetrics(null);

      // Create abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Start performance tracking
      const tracker = performanceTrackerRef.current;
      tracker.start();

      try {
        setIsLoading(false);

        const result = await managerRef.current.rewrite(input, context, signal);

        if (!isMountedRef.current) {
          return result;
        }

        // Update state
        tracker.end(result);
        setContent(result);
        setMetrics(tracker.getMetrics());
        setIsRewriting(false);

        return result;
      } catch (err: unknown) {
        if (!isMountedRef.current) {
          throw err;
        }

        setError(err instanceof Error ? err : new Error(String(err)));
        setIsRewriting(false);
        setIsLoading(false);
        throw err;
      }
    },

    [],
  );

  /**
   * Rewrite with streaming
   */
  const rewriteStreaming = useCallback(
    async (
      input: string,
      onChunk: (chunk: string) => void,
      context?: string,
    ): Promise<string> => {
      if (!isMountedRef.current) {
        throw new Error('Component unmounted');
      }

      // Reset state
      setError(null);
      setIsRewriting(true);
      setIsStreaming(true);
      setIsLoading(true);
      setOriginalInput(input);
      setContent('');
      setMetrics(null);

      // Create abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Start performance tracking
      const tracker = performanceTrackerRef.current;
      tracker.start();

      try {
        setIsLoading(false);

        const result = await managerRef.current.rewriteStreaming(
          input,
          (chunk) => {
            if (!isMountedRef.current) {
              return;
            }

            // Track chunk
            tracker.addChunk(chunk);

            // Update content
            setContent((prev) => (prev || '') + chunk);

            // Call user callback
            onChunk(chunk);
          },
          context,
          signal,
        );

        if (!isMountedRef.current) {
          return result;
        }

        // Update state
        tracker.end(result);
        setContent(result);
        setMetrics(tracker.getMetrics());
        setIsRewriting(false);
        setIsStreaming(false);

        return result;
      } catch (err: unknown) {
        if (!isMountedRef.current) {
          throw err;
        }

        setError(err instanceof Error ? err : new Error(String(err)));
        setIsRewriting(false);
        setIsStreaming(false);
        setIsLoading(false);
        throw err;
      }
    },

    [],
  );

  /**
   * Cancel current operation
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsRewriting(false);
    setIsStreaming(false);
    setIsLoading(false);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    cancel();
    setContent(null);
    setOriginalInput(null);
    setError(null);
    setMetrics(null);
  }, [cancel]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<RewriterConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  return {
    isRewriting,
    isStreaming,
    content,
    originalInput,
    error,
    isLoading,
    config,
    metrics,
    actions: {
      rewrite,
      rewriteStreaming,
      cancel,
      reset,
      updateConfig,
    },
  };
}

// ============================================================================
// Export
// ============================================================================

export default useRewriter;
