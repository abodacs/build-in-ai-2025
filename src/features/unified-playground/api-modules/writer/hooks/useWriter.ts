/**
 * useWriter Hook
 *
 * Main React hook for Writer API operations.
 * Provides state management and actions for content generation.
 *
 * Features:
 * - Write content with streaming support
 * - Configuration management
 * - Performance tracking
 * - Error handling
 * - Automatic cleanup
 *
 * @module writer/hooks/useWriter
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { WriterManager, WriterErrorHandler } from '../services';
import { PerformanceTracker } from '../../shared/services';
import type { WriterConfig, WriterState } from '../types';
import type { PerformanceMetrics } from '../../shared/types';

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if user activation is available
 * User activation is required for Writer API operations
 */
function checkUserActivation(): void {
  if (
    typeof navigator !== 'undefined' &&
    'userActivation' in navigator &&
    !(navigator as Navigator & { userActivation?: { isActive: boolean } })
      .userActivation?.isActive
  ) {
    throw new Error(
      'User activation required. Writer operations must be initiated from a user gesture (e.g., button click).',
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
          `[useWriter] Retry failed after ${maxAttempts} attempts:`,
          error,
        );
        throw error;
      }

      // Calculate exponential backoff delay
      const backoffDelay = delayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[useWriter] Attempt ${attempt} failed, retrying in ${backoffDelay}ms...`,
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
 * Writer hook actions
 */
export interface UseWriterActions {
  /** Write content (non-streaming) */
  write: (prompt: string, context?: string) => Promise<string | null>;

  /** Write content with streaming */
  writeStreaming: (
    prompt: string,
    onChunk: (chunk: string) => void,
    context?: string,
  ) => Promise<string | null>;

  /** Write with automatic streaming decision */
  writeAuto: (
    prompt: string,
    onChunk?: (chunk: string) => void,
    context?: string,
  ) => Promise<string | null>;

  /** Cancel current operation */
  cancel: () => void;

  /** Reset state */
  reset: () => void;

  /** Update configuration */
  updateConfig: (config: Partial<WriterConfig>) => void;
}

/**
 * Writer hook return type
 */
export interface UseWriterReturn extends WriterState {
  /** Current configuration */
  config: WriterConfig;

  /** Performance metrics */
  metrics: PerformanceMetrics | null;

  /** Actions */
  actions: UseWriterActions;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for Writer API operations
 *
 * Provides complete state management for Writer operations with
 * automatic performance tracking and error handling.
 *
 * @param initialConfig - Initial Writer configuration
 * @returns Writer state and actions
 *
 * @example
 * ```tsx
 * function WriterDemo() {
 *   const {
 *     isWriting,
 *     isStreaming,
 *     content,
 *     error,
 *     metrics,
 *     config,
 *     actions,
 *   } = useWriter({
 *     tone: 'formal',
 *     format: 'markdown',
 *     length: 'medium',
 *   });
 *
 *   const handleWrite = async () => {
 *     const result = await actions.write('Write a welcome message');
 *     console.log('Generated:', result);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleWrite} disabled={isWriting}>
 *         Generate
 *       </button>
 *       {error && <div>Error: {error.message}</div>}
 *       {content && <div>{content}</div>}
 *       {metrics && <div>Duration: {metrics.duration}ms</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWriter(initialConfig: WriterConfig): UseWriterReturn {
  // State
  const [config, setConfig] = useState<WriterConfig>(initialConfig);
  const [isWriting, setIsWriting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  // Refs
  const managerRef = useRef<WriterManager>(new WriterManager());
  const abortControllerRef = useRef<AbortController | null>(null);
  const performanceTrackerRef = useRef<PerformanceTracker>(
    new PerformanceTracker(),
  );
  const configRef = useRef<WriterConfig>(config);

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
   * Write content (non-streaming)
   */
  const write = useCallback(
    async (prompt: string, context?: string): Promise<string | null> => {
      console.group('🔧 useWriter: write');
      console.log('Prompt:', prompt);
      console.log('Context:', context || '(none)');
      console.log('📋 Active Config (from ref):', configRef.current);

      // Reset state
      setIsWriting(true);
      setIsStreaming(false);
      setError(null);
      setContent(null);
      setMetrics(null);
      setIsLoading(true);

      // Create abort controller
      abortControllerRef.current = new AbortController();

      // Start performance tracking
      const tracker = performanceTrackerRef.current;
      tracker.start();

      // CRITICAL FIX: Start instance creation SYNCHRONOUSLY (while user activation is still valid)
      const activeConfig = configRef.current;
      console.log('🔧 Using active config for getInstance:', activeConfig);
      console.log('⚡ Starting instance creation IMMEDIATELY (sync)...');
      const instancePromise = managerRef.current.getInstance(activeConfig);

      try {
        // Await instance creation first (before retry logic)
        await instancePromise;
        console.log('✅ Writer instance obtained');
        setIsLoading(false);

        // Wrap write operation with retry logic (but NOT instance creation)
        const result = await withRetry(async () => {
          // Perform write
          return await managerRef.current.write(
            prompt,
            context,
            abortControllerRef.current?.signal,
          );
        });

        // End tracking
        tracker.end(result);

        setContent(result);
        setMetrics(tracker.getMetrics());
        setIsWriting(false);

        console.log('✅ Write complete');
        console.log('Result length:', result?.length || 0);
        console.groupEnd();
        return result;
      } catch (err) {
        tracker.end();

        console.error('❌ Write failed:', err);
        // Use ErrorHandler for better error messages
        const writerError = WriterErrorHandler.handleWriteError(
          err,
          prompt.length,
        );
        const error = new Error(WriterErrorHandler.getUserMessage(writerError));
        setError(error);
        setIsWriting(false);
        setIsLoading(false);

        // Log formatted error
        console.error(WriterErrorHandler.formatForLogging(writerError));

        console.groupEnd();
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },

    [], // Empty deps - using configRef.current for latest config
  );

  /**
   * Write content with streaming
   */
  const writeStreaming = useCallback(
    async (
      prompt: string,
      onChunk: (chunk: string) => void,
      context?: string,
    ): Promise<string | null> => {
      console.group('🔧 useWriter: writeStreaming');
      console.log('Prompt:', prompt);
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
      setIsWriting(true);
      setIsStreaming(true);
      setError(null);
      setContent('');
      setMetrics(null);
      setIsLoading(true);

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
      // This initiates the Writer.create() call before any await, preserving user activation
      const activeConfig = configRef.current;
      console.log('🔧 Using active config for getInstance:', activeConfig);
      console.log('⚡ Starting instance creation IMMEDIATELY (sync)...');
      const instancePromise = managerRef.current.getInstance(activeConfig);

      try {
        console.log('🔨 Waiting for Writer instance...');

        // Await instance creation first (with 20-minute timeout to allow for model downloads on slow connections)
        // This must happen BEFORE retry logic since retries are only for streaming errors,
        // not instance creation errors
        console.log('⏱️ Awaiting instance with 20-minute timeout...');
        await withTimeout(
          instancePromise,
          1200000,
          'Writer instance creation timed out after 20 minutes. This may indicate a model download is required or the API is unresponsive. Check chrome://on-device-internals for download status.',
        );
        console.log('✅ Writer instance obtained');
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

          console.log('📡 Starting streaming write with 60s timeout...');
          // Perform streaming write (with 60s timeout for actual generation)
          const streamResult = await withTimeout(
            managerRef.current.writeStreaming(
              prompt,
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
              signal, // Use signal we extracted earlier
            ),
            60000,
            'Content generation timed out after 60 seconds. The API may be unresponsive or the prompt may be too complex.',
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
        setIsWriting(false);
        setIsStreaming(false);

        console.groupEnd();
        return result;
      } catch (err) {
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

        // Use ErrorHandler for better error messages
        const writerError = WriterErrorHandler.handleWriteError(
          err,
          prompt.length,
        );
        const error = new Error(WriterErrorHandler.getUserMessage(writerError));
        setError(error);
        setIsWriting(false);
        setIsStreaming(false);
        setIsLoading(false);

        // Log formatted error
        console.error(WriterErrorHandler.formatForLogging(writerError));

        console.groupEnd();
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },

    [], // Empty deps - using configRef.current for latest config
  );

  /**
   * Write with automatic streaming decision
   */
  const writeAuto = useCallback(
    async (
      prompt: string,
      onChunk?: (chunk: string) => void,
      context?: string,
    ): Promise<string | null> => {
      // Use streaming if callback provided or prompt is long
      const wordCount = prompt.trim().split(/\s+/).length;
      const shouldStream = wordCount > 20 || !!onChunk;

      if (shouldStream && onChunk) {
        return writeStreaming(prompt, onChunk, context);
      } else {
        return write(prompt, context);
      }
    },
    [write, writeStreaming],
  );

  /**
   * Cancel current operation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsWriting(false);
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

    setIsWriting(false);
    setIsStreaming(false);
    setContent(null);
    setError(null);
    setIsLoading(false);
    setMetrics(null);

    performanceTrackerRef.current.reset();
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<WriterConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  return {
    // State
    isWriting,
    isStreaming,
    content,
    error,
    isLoading,

    // Configuration
    config,

    // Metrics
    metrics,

    // Actions
    actions: {
      write,
      writeStreaming,
      writeAuto,
      cancel,
      reset,
      updateConfig,
    },
  };
}

// ============================================================================
// Export
// ============================================================================

export default useWriter;
