/**
 * useStreamingOutput Hook
 *
 * React hook for managing streaming output state.
 * Provides UI state management for streaming operations with real-time updates.
 *
 * Features:
 * - Real-time output accumulation
 * - Progress tracking
 * - Performance metrics
 * - Cancellation support
 * - Automatic cleanup
 *
 * @module useStreamingOutput
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { StreamingState, ChunkMetadata } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Streaming actions
 */
export interface StreamingActions {
  /** Start streaming */
  startStreaming: () => void;

  /** Add chunk to output */
  addChunk: (chunk: string, metadata?: ChunkMetadata) => void;

  /** Complete streaming */
  completeStreaming: () => void;

  /** Cancel streaming */
  cancelStreaming: () => void;

  /** Reset streaming state */
  reset: () => void;
}

/**
 * Hook return type
 */
export type UseStreamingOutputReturn = StreamingState & StreamingActions;

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing streaming output
 *
 * Provides state management for streaming operations.
 * Accumulates chunks and tracks progress.
 *
 * @returns Streaming state and actions
 *
 * @example
 * ```tsx
 * function StreamingDemo() {
 *   const {
 *     isStreaming,
 *     output,
 *     progress,
 *     chunksReceived,
 *     startStreaming,
 *     addChunk,
 *     completeStreaming,
 *     cancelStreaming,
 *     reset,
 *   } = useStreamingOutput();
 *
 *   const handleWrite = async () => {
 *     startStreaming();
 *
 *     try {
 *       const stream = await writer.writeStreaming(prompt);
 *
 *       for await (const chunk of stream) {
 *         addChunk(chunk);
 *       }
 *
 *       completeStreaming();
 *     } catch (error) {
 *       cancelStreaming();
 *       console.error('Streaming failed:', error);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {isStreaming && (
 *         <div>
 *           <p>Streaming... {progress}%</p>
 *           <button onClick={cancelStreaming}>Cancel</button>
 *         </div>
 *       )}
 *       <div>{output}</div>
 *       <div>Chunks received: {chunksReceived}</div>
 *       <button onClick={handleWrite} disabled={isStreaming}>
 *         Generate
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useStreamingOutput(): UseStreamingOutputReturn {
  // State
  const [isStreaming, setIsStreaming] = useState(false);
  const [output, setOutput] = useState('');
  const [chunksReceived, setChunksReceived] = useState(0);
  const [progress, setProgress] = useState(0);
  const [startedAt, setStartedAt] = useState<number | undefined>(undefined);

  // Refs
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Start streaming
   */
  const startStreaming = useCallback(() => {
    if (!isMountedRef.current) return;

    setIsStreaming(true);
    setOutput('');
    setChunksReceived(0);
    setProgress(0);
    setStartedAt(Date.now());
  }, []);

  /**
   * Add chunk to output
   */
  const addChunk = useCallback((chunk: string, metadata?: ChunkMetadata) => {
    if (!isMountedRef.current) return;

    setOutput((prev) => prev + chunk);
    setChunksReceived((prev) => prev + 1);

    // Update progress if metadata provided
    if (metadata) {
      setProgress(Math.round(metadata.progress));
    } else {
      // Estimate progress based on chunks (cap at 95%)
      setProgress((prev) => Math.min(prev + 5, 95));
    }
  }, []);

  /**
   * Complete streaming
   */
  const completeStreaming = useCallback(() => {
    if (!isMountedRef.current) return;

    setIsStreaming(false);
    setProgress(100);
  }, []);

  /**
   * Cancel streaming
   */
  const cancelStreaming = useCallback(() => {
    if (!isMountedRef.current) return;

    setIsStreaming(false);
    setProgress(0);
  }, []);

  /**
   * Reset streaming state
   */
  const reset = useCallback(() => {
    if (!isMountedRef.current) return;

    setIsStreaming(false);
    setOutput('');
    setChunksReceived(0);
    setProgress(0);
    setStartedAt(undefined);
  }, []);

  return {
    // State
    isStreaming,
    output,
    chunksReceived,
    progress,
    startedAt,

    // Actions
    startStreaming,
    addChunk,
    completeStreaming,
    cancelStreaming,
    reset,
  };
}

// ============================================================================
// Export
// ============================================================================

export default useStreamingOutput;
