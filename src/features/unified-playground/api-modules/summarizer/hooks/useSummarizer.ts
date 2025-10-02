/**
 * useSummarizer Hook
 *
 * React hook for Chrome AI Summarizer operations
 * Provides summarization, streaming, metrics, and lifecycle management
 *
 * @module useSummarizer
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { SummarizerManager } from '../services/SummarizerManager';
import { ErrorHandler } from '../services/ErrorHandler';
import { getPerformanceTracker } from '../utils/performanceTracker';
import { validateText, countWords } from '../utils/textPreprocessing';
import type {
  SummarizerCreateOptions,
  SummarizeOptions,
  SummarizerMetrics,
  SummarizerError,
} from '../types/summarizer.types';

// ============================================================================
// Types
// ============================================================================

export interface UseSummarizerOptions {
  /** Initial configuration */
  config?: SummarizerCreateOptions;

  /** Enable performance tracking */
  trackPerformance?: boolean;

  /** Auto-cleanup on unmount */
  autoCleanup?: boolean;
}

export interface UseSummarizerReturn {
  /** Summarize text */
  summarize: (
    text: string,
    options?: SummarizeOptions,
    config?: SummarizerCreateOptions,
  ) => Promise<string>;

  /** Summarize with streaming */
  summarizeStreaming: (
    text: string,
    options?: SummarizeOptions,
    config?: SummarizerCreateOptions,
  ) => Promise<ReadableStream<string>>;

  /** Current summary result */
  result: string | null;

  /** Is currently summarizing */
  isLoading: boolean;

  /** Is streaming */
  isStreaming: boolean;

  /** Error if operation failed */
  error: SummarizerError | null;

  /** Performance metrics */
  metrics: SummarizerMetrics | null;

  /** Update configuration */
  updateConfig: (config: SummarizerCreateOptions) => void;

  /** Reset hook state */
  reset: () => void;

  /** Abort current operation */
  abort: () => void;

  /** Has active summarizer instance */
  hasInstance: boolean;
}

// ============================================================================
// useSummarizer Hook
// ============================================================================

/**
 * Hook for Chrome AI Summarizer operations
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     summarize,
 *     result,
 *     isLoading,
 *     error,
 *   } = useSummarizer({
 *     config: { type: 'tldr', length: 'medium' },
 *   });
 *
 *   const handleSummarize = async () => {
 *     const summary = await summarize(inputText);
 *     console.log(summary);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleSummarize} disabled={isLoading}>
 *         Summarize
 *       </button>
 *       {result && <p>{result}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSummarizer(
  options: UseSummarizerOptions = {},
): UseSummarizerReturn {
  const {
    config: initialConfig = {},
    trackPerformance = true,
    autoCleanup = true,
  } = options;

  // State
  const [config, setConfig] = useState<SummarizerCreateOptions>(initialConfig);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<SummarizerError | null>(null);
  const [metrics, setMetrics] = useState<SummarizerMetrics | null>(null);

  // Keep configRef in sync with config state
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Refs
  const managerRef = useRef<SummarizerManager>(new SummarizerManager());
  const abortControllerRef = useRef<AbortController | null>(null);
  const performanceTracker = trackPerformance ? getPerformanceTracker() : null;
  const configRef = useRef<SummarizerCreateOptions>(config);

  /**
   * Summarize text
   */
  const summarize = useCallback(
    async (
      text: string,
      summarizeOptions: SummarizeOptions = {},
      customConfig?: SummarizerCreateOptions,
    ): Promise<string> => {
      // Use custom config if provided, otherwise use ref to get latest state
      const activeConfig = customConfig || configRef.current;

      // Validate input
      const validation = validateText(text);
      if (!validation.valid) {
        const validationError: SummarizerError = {
          type: 'InvalidStateError',
          message: validation.reason || 'Invalid text input',
          recoverable: true,
          suggestion:
            'Please provide valid text with at least 100 characters and 10 words.',
        };
        setError(validationError);
        throw new Error(validation.reason);
      }

      // Reset state
      setIsLoading(true);
      setError(null);
      setResult(null);

      // Create abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const startTime = performance.now();

      try {
        // Summarize
        const summary = await managerRef.current.summarize(
          text,
          { ...summarizeOptions, signal },
          activeConfig,
        );

        // Update state
        setResult(summary);

        // Track performance
        if (performanceTracker && summary) {
          const processingTime = performance.now() - startTime;
          performanceTracker.recordOperation({
            type: 'summarize',
            inputSize: text.length,
            outputSize: summary.length,
            processingTime,
            success: true,
          });
        }

        // Update metrics
        const currentMetrics = managerRef.current.getMetrics();
        if (summary) {
          setMetrics({
            ...currentMetrics,
            originalWordCount: countWords(text),
            summaryWordCount: countWords(summary),
            compressionRatio: countWords(text) / countWords(summary),
            processingTime: performance.now() - startTime,
          });
        }

        return summary;
      } catch (err) {
        // Handle error
        const handledError = ErrorHandler.handleSummarizationError(
          err,
          text.length,
        );
        setError(handledError);

        // Track failure
        if (performanceTracker) {
          performanceTracker.recordOperation({
            type: 'summarize',
            inputSize: text.length,
            outputSize: 0,
            processingTime: performance.now() - startTime,
            success: false,
            error: handledError.message,
          });
        }

        throw err;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [performanceTracker],
  );

  /**
   * Summarize with streaming
   */
  const summarizeStreaming = useCallback(
    async (
      text: string,
      summarizeOptions: SummarizeOptions = {},
      customConfig?: SummarizerCreateOptions,
    ): Promise<ReadableStream<string>> => {
      // Use custom config if provided, otherwise use ref to get latest state
      const activeConfig = customConfig || configRef.current;

      // Validate input
      const validation = validateText(text);
      if (!validation.valid) {
        const validationError: SummarizerError = {
          type: 'InvalidStateError',
          message: validation.reason || 'Invalid text input',
          recoverable: true,
          suggestion:
            'Please provide valid text with at least 100 characters and 10 words.',
        };
        setError(validationError);
        throw new Error(validation.reason);
      }

      // Reset state
      setIsLoading(true);
      setIsStreaming(true);
      setError(null);
      setResult(null);

      // Create abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const startTime = performance.now();
      let accumulatedResult = '';

      try {
        // Get stream
        const stream = await managerRef.current.summarizeStreaming(
          text,
          { ...summarizeOptions, signal },
          activeConfig,
        );

        // Wrap stream to track chunks
        const trackedStream = new ReadableStream<string>({
          async start(controller) {
            const reader = stream.getReader();

            try {
              while (true) {
                const { done, value } = await reader.read();

                if (done) {
                  controller.close();

                  // Final state update
                  setResult(accumulatedResult);
                  setIsLoading(false);
                  setIsStreaming(false);

                  // Track performance
                  if (performanceTracker) {
                    performanceTracker.recordOperation({
                      type: 'summarize-streaming',
                      inputSize: text.length,
                      outputSize: accumulatedResult.length,
                      processingTime: performance.now() - startTime,
                      success: true,
                    });
                  }

                  // Update metrics
                  const currentMetrics = managerRef.current.getMetrics();
                  setMetrics({
                    ...currentMetrics,
                    originalWordCount: countWords(text),
                    summaryWordCount: countWords(accumulatedResult),
                    compressionRatio:
                      countWords(text) / countWords(accumulatedResult),
                    processingTime: performance.now() - startTime,
                  });

                  break;
                }

                // Accumulate result
                accumulatedResult += value;
                setResult(accumulatedResult);

                controller.enqueue(value);
              }
            } catch (err) {
              controller.error(err);
              throw err;
            } finally {
              reader.releaseLock();
            }
          },
        });

        return trackedStream;
      } catch (err) {
        // Handle error
        const handledError = ErrorHandler.handleSummarizationError(
          err,
          text.length,
        );
        setError(handledError);

        setIsLoading(false);
        setIsStreaming(false);

        // Track failure
        if (performanceTracker) {
          performanceTracker.recordOperation({
            type: 'summarize-streaming',
            inputSize: text.length,
            outputSize: 0,
            processingTime: performance.now() - startTime,
            success: false,
            error: handledError.message,
          });
        }

        throw err;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [performanceTracker],
  );

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: SummarizerCreateOptions) => {
    setConfig(newConfig);
  }, []);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
    setIsStreaming(false);

    // Abort any ongoing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Abort current operation
   */
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (autoCleanup) {
        // Abort any ongoing operation
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Cleanup manager
        managerRef.current.cleanup();
      }
    };
  }, [autoCleanup]);

  return {
    summarize,
    summarizeStreaming,
    result,
    isLoading,
    isStreaming,
    error,
    metrics,
    updateConfig,
    reset,
    abort,
    hasInstance: managerRef.current.hasInstance(),
  };
}

// ============================================================================
// Export
// ============================================================================

export default useSummarizer;
