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
import { RewriterManager, RewriterErrorHandler } from '../services';
import { PerformanceTracker } from '../../shared/services';
import type { RewriterConfig } from '../types';
import type { PerformanceMetrics } from '../../shared/types';

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if user activation is available
 * User activation is required for Rewriter API operations
 */
function checkUserActivation(): void {
  if (
    typeof navigator !== 'undefined' &&
    'userActivation' in navigator &&
    !(navigator as Navigator & { userActivation?: { isActive: boolean } })
      .userActivation?.isActive
  ) {
    throw new Error(
      'User activation required. Rewriter operations must be initiated from a user gesture (e.g., button click).',
    );
  }
}

/**
 * Add timeout to a promise
 * @param promise Promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Error message if timeout occurs
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out',
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs),
    ),
  ]);
}

/**
 * Retry helper with exponential backoff
 * @param fn Function to retry
 * @param maxAttempts Maximum retry attempts (default 3)
 * @param delayMs Initial delay in milliseconds (default 1000)
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      // Don't retry on user abort
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }

      // Don't retry on user activation errors
      if (error instanceof Error && error.message.includes('user activation')) {
        throw error;
      }

      // Don't retry on validation errors
      if (
        error instanceof Error &&
        (error.message.includes('Invalid') ||
          error.message.includes('validation'))
      ) {
        throw error;
      }

      // Last attempt - throw error
      if (attempt === maxAttempts) {
        console.error(
          `[useRewriter] Retry failed after ${maxAttempts} attempts:`,
          error,
        );
        throw error;
      }

      // Calculate exponential backoff delay
      const backoffDelay = delayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[useRewriter] Attempt ${attempt} failed, retrying in ${backoffDelay}ms...`,
        error,
      );

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError;
}

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
    rewrite: (input: string, context?: string) => Promise<string | null>;

    /** Rewrite with streaming */
    rewriteStreaming: (
      input: string,
      onChunk: (chunk: string) => void,
      context?: string,
    ) => Promise<string | null>;

    /** Rewrite with automatic streaming decision */
    rewriteAuto: (
      input: string,
      onChunk?: (chunk: string) => void,
      context?: string,
    ) => Promise<string | null>;

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
  const configRef = useRef<RewriterConfig>(config);

  // Keep configRef in sync with config state (during render, not useEffect)
  configRef.current = config;

  // Cleanup on unmount
  useEffect(() => {
    const manager = managerRef.current;
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      manager.destroy();
    };
  }, []);

  /**
   * Rewrite text
   */
  const rewrite = useCallback(
    async (input: string, context?: string): Promise<string | null> => {
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

      // Start instance creation synchronously
      const activeConfig = configRef.current;
      const instancePromise = managerRef.current.getInstance(activeConfig);

      try {
        // Await instance creation with timeout for model downloads
        await withTimeout(
          instancePromise,
          180000,
          'Rewriter instance creation timed out after 3 minutes. Model download may be in progress. Check chrome://on-device-internals for download status. Ensure 22GB+ free space and unmetered connection.',
        );
        setIsLoading(false);

        // Perform rewrite with retry logic
        const result = await withRetry(async () => {
          return await managerRef.current.rewrite(input, context, signal);
        });

        // Update state with result
        tracker.end(result);
        setContent(result);
        setMetrics(tracker.getMetrics());
        setIsRewriting(false);

        return result;
      } catch (err: unknown) {
        tracker.end();

        // Handle error
        const rewriterError = RewriterErrorHandler.handleRewriteError(
          err,
          input.length,
        );
        const error = new Error(
          RewriterErrorHandler.getUserMessage(rewriterError),
        );
        setError(error);
        setIsRewriting(false);
        setIsLoading(false);

        console.error(RewriterErrorHandler.formatForLogging(rewriterError));
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },

    [], // Empty deps - using configRef.current for latest config
  );

  /**
   * Rewrite with streaming
   */
  const rewriteStreaming = useCallback(
    async (
      input: string,
      onChunk: (chunk: string) => void,
      context?: string,
    ): Promise<string | null> => {
      console.group('🔧 useRewriter: rewriteStreaming');
      console.log('Input:', input);
      console.log('Context:', context || '(none)');
      console.log('📋 Active Config (from ref):', configRef.current);

      // IMPORTANT: Check user activation IMMEDIATELY while we're still in the event handler context
      // User activation is transient and expires after async operations
      console.log('🔐 Checking user activation...');
      try {
        checkUserActivation();
        console.log('✅ User activation confirmed');
      } catch (err) {
        console.error('❌ User activation check failed:', err);
        const error = new Error(
          err instanceof Error ? err.message : 'User activation required',
        );
        setError(error);
        console.groupEnd();
        return null;
      }

      console.log('🔄 Resetting state...');

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

      // Check if already aborted (shouldn't happen, but guard against it)
      if (signal.aborted) {
        console.error('❌ Signal already aborted before streaming starts');
        throw new Error('Operation was cancelled before it could start');
      }

      // Start performance tracking
      const tracker = performanceTrackerRef.current;
      tracker.start();
      console.log('⏱️ Performance tracking started');

      // CRITICAL FIX: Start instance creation SYNCHRONOUSLY (while user activation is still valid)
      // This initiates the Rewriter.create() call before any await, preserving user activation
      const activeConfig = configRef.current;
      console.log('🔧 Using active config for getInstance:', activeConfig);
      console.log('⚡ Starting instance creation IMMEDIATELY (sync)...');
      const instancePromise = managerRef.current.getInstance(activeConfig);

      try {
        console.log('🔨 Waiting for Rewriter instance...');

        // Await instance creation first (with timeout to prevent indefinite hanging)
        // This must happen BEFORE retry logic since retries are only for streaming errors,
        // not instance creation errors
        console.log('⏱️ Awaiting instance with timeout...');
        await withTimeout(
          instancePromise,
          180000,
          'Rewriter instance creation timed out after 3 minutes. Model download may be in progress. Check chrome://on-device-internals for download status. Ensure 22GB+ free space and unmetered connection.',
        );
        console.log('✅ Rewriter instance obtained');
        setIsLoading(false);

        // Track chunks across retry attempts
        let finalChunkCount = 0;

        // Wrap streaming operation with retry logic (but NOT instance creation)
        const result = await withRetry(async () => {
          // Check signal at start of each retry attempt
          if (signal?.aborted) {
            console.warn('⚠️ Signal aborted before retry attempt');
            throw new Error('Operation cancelled');
          }

          // Reset for this attempt (important for retries)
          let accumulatedContent = '';
          let chunkCount = 0;

          // Check signal after getInstance (may have taken time for download)
          if (signal?.aborted) {
            console.warn('⚠️ Signal aborted after getInstance');
            throw new Error('Operation cancelled after model preparation');
          }

          console.log('📡 Starting streaming rewrite with 60s timeout...');
          // Perform streaming rewrite (with 60s timeout for actual generation)
          const streamResult = await withTimeout(
            managerRef.current.rewriteStreaming(
              input,
              (chunk) => {
                chunkCount++;
                // Track chunks
                if (!tracker.hasFirstChunk()) {
                  tracker.markFirstChunk();
                  console.log('🎯 First chunk received!');
                }
                tracker.addChunk(chunk);

                // Update UI
                accumulatedContent += chunk;
                console.log(
                  `📦 Chunk ${chunkCount}:`,
                  chunk.substring(0, 30) + '...',
                );
                console.log(
                  `📊 Accumulated (${accumulatedContent.length} chars):`,
                  accumulatedContent.substring(0, 50) + '...',
                );

                console.log(
                  `🎨 Setting content state (${accumulatedContent.length} chars)...`,
                );
                setContent(accumulatedContent);
                console.log('✅ setContent called successfully');

                // Call user callback
                onChunk(chunk);
              },
              context,
              signal,
            ),
            60000,
            'Content rewriting timed out after 60 seconds. The API may be unresponsive or the input may be too complex.',
          );

          // Store for logging
          finalChunkCount = chunkCount;
          return streamResult;
        });

        // End tracking
        tracker.end(result);
        const metrics = tracker.getMetrics();

        console.log('✅ Streaming complete!');
        console.log('📊 Final result from manager:', result);
        console.log('📊 Result length:', result?.length || 0);
        console.log('📊 Total chunks received:', finalChunkCount);
        console.log(
          '📊 Result is empty:',
          !result || result.trim().length === 0,
        );
        console.log('Metrics:', metrics);

        // Only update content if we have a valid result
        if (result && result.trim().length > 0) {
          console.log(
            '✅ Setting final content:',
            result.substring(0, 100) + '...',
          );
          setContent(result);
        } else {
          console.warn('⚠️ Result is empty, keeping accumulated content');
        }
        setMetrics(metrics);
        setIsRewriting(false);
        setIsStreaming(false);

        console.groupEnd();
        return result;
      } catch (err: unknown) {
        tracker.end();

        console.error('❌ Streaming failed:', err);
        console.error(
          'Error type:',
          err instanceof Error ? err.constructor.name : typeof err,
        );
        console.error(
          'Error message:',
          err instanceof Error ? err.message : String(err),
        );

        // Handle error
        const rewriterError = RewriterErrorHandler.handleRewriteError(
          err,
          input.length,
        );
        const error = new Error(
          RewriterErrorHandler.getUserMessage(rewriterError),
        );
        setError(error);
        setIsRewriting(false);
        setIsStreaming(false);
        setIsLoading(false);

        // Log formatted error
        console.error(RewriterErrorHandler.formatForLogging(rewriterError));

        console.groupEnd();
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },

    [], // Empty deps - using configRef.current for latest config
  );

  /**
   * Rewrite with automatic mode selection
   */
  const rewriteAuto = useCallback(
    async (
      input: string,
      onChunk?: (chunk: string) => void,
      context?: string,
    ): Promise<string | null> => {
      // Use streaming if callback provided or input is long
      const wordCount = input.trim().split(/\s+/).length;
      const shouldStream = wordCount > 20 || !!onChunk;

      if (shouldStream && onChunk) {
        return rewriteStreaming(input, onChunk, context);
      } else {
        return rewrite(input, context);
      }
    },
    [rewrite, rewriteStreaming],
  );

  /**
   * Cancel current operation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsRewriting(false);
    setIsStreaming(false);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsRewriting(false);
    setIsStreaming(false);
    setContent(null);
    setOriginalInput(null);
    setError(null);
    setIsLoading(false);
    setMetrics(null);

    performanceTrackerRef.current.reset();
  }, []);

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
      rewriteAuto,
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
