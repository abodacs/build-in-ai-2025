/**
 * useBatchRewrite Hook
 *
 * React hook for batch text rewriting operations.
 * Manages multiple texts, progress tracking, and sequential processing.
 *
 * @module rewriter/hooks/useBatchRewrite
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { RewriterManager } from '../services/RewriterManager';
import { DEFAULT_REWRITER_CONFIG } from '../types/rewriter.types';
import type {
  BatchRewriteItem,
  BatchRewriteConfig,
  BatchRewriteResult,
  BatchProgress,
  BatchStatus,
  UseBatchRewriteReturn,
  BatchImportOptions,
  BatchExportOptions,
} from '../types/batch.types';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_BATCH_CONFIG: BatchRewriteConfig = {
  ...DEFAULT_REWRITER_CONFIG,
  maxConcurrent: 1, // Sequential processing (safer for Chrome AI)
  delayBetweenRequests: 100, // 100ms delay between requests
  stopOnError: false,
  retryFailed: false,
  maxRetries: 2,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate unique ID for batch item
 */
function generateItemId(): string {
  return `batch-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate batch progress
 */
function calculateProgress(items: BatchRewriteItem[]): BatchProgress {
  const total = items.length;
  const completed = items.filter((item) => item.status === 'completed').length;
  const failed = items.filter((item) => item.status === 'failed').length;
  const cancelled = items.filter((item) => item.status === 'cancelled').length;
  const currentIndex = items.findIndex((item) => item.status === 'processing');

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    failed,
    cancelled,
    currentIndex,
    percentage,
    estimatedTimeRemaining: null, // Calculated separately
    itemsPerSecond: null, // Calculated separately
  };
}

/**
 * Calculate batch status
 */
function calculateStatus(
  items: BatchRewriteItem[],
  isRunning: boolean,
  isPaused: boolean,
  isCancelled: boolean,
): BatchStatus {
  if (isCancelled) return 'cancelled';
  if (isPaused) return 'paused';
  if (isRunning) return 'running';

  const allProcessed = items.every(
    (item) =>
      item.status === 'completed' ||
      item.status === 'failed' ||
      item.status === 'cancelled',
  );

  if (allProcessed && items.length > 0) return 'completed';
  return 'idle';
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useBatchRewrite Hook
 *
 * Manages batch rewriting operations with progress tracking.
 *
 * @example
 * ```tsx
 * const batch = useBatchRewrite();
 *
 * // Add items
 * batch.actions.addItems(['Text 1', 'Text 2', 'Text 3']);
 *
 * // Start processing
 * await batch.actions.start();
 *
 * // Monitor progress
 * console.log(batch.progress);
 * ```
 */
export function useBatchRewrite(
  initialConfig: Partial<BatchRewriteConfig> = {},
): UseBatchRewriteReturn {
  // State
  const [items, setItems] = useState<BatchRewriteItem[]>([]);
  const [config, setConfig] = useState<BatchRewriteConfig>({
    ...DEFAULT_BATCH_CONFIG,
    ...initialConfig,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  // Refs for processing control
  const shouldPauseRef = useRef(false);
  const shouldCancelRef = useRef(false);
  const managerRef = useRef<RewriterManager | null>(null);
  const processingTimesRef = useRef<number[]>([]);

  // Calculate progress
  const progress = useMemo(() => {
    const baseProgress = calculateProgress(items);

    // Calculate estimated time remaining and throughput
    if (
      isRunning &&
      processingTimesRef.current.length > 0 &&
      baseProgress.completed > 0
    ) {
      const avgTime =
        processingTimesRef.current.reduce((a, b) => a + b, 0) /
        processingTimesRef.current.length;
      const remaining = baseProgress.total - baseProgress.completed;
      const estimatedTimeRemaining = avgTime * remaining;

      const elapsed = startTime ? Date.now() - startTime : 0;
      const itemsPerSecond =
        elapsed > 0 ? (baseProgress.completed / elapsed) * 1000 : null;

      return {
        ...baseProgress,
        estimatedTimeRemaining,
        itemsPerSecond,
      };
    }

    return baseProgress;
  }, [items, isRunning, startTime]);

  // Calculate status
  const status = useMemo(
    () => calculateStatus(items, isRunning, isPaused, isCancelled),
    [items, isRunning, isPaused, isCancelled],
  );

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    const completedItems = items.filter(
      (item) => item.status === 'completed' && item.rewrittenText,
    );

    const totalCharactersOriginal = completedItems.reduce(
      (sum, item) => sum + item.originalText.length,
      0,
    );
    const totalCharactersRewritten = completedItems.reduce(
      (sum, item) => sum + (item.rewrittenText?.length || 0),
      0,
    );
    const totalWords = completedItems.reduce(
      (sum, item) =>
        sum + item.originalText.split(/\s+/).filter(Boolean).length,
      0,
    );

    const averageTimePerItem =
      processingTimesRef.current.length > 0
        ? processingTimesRef.current.reduce((a, b) => a + b, 0) /
          processingTimesRef.current.length
        : null;

    return {
      totalCharactersOriginal,
      totalCharactersRewritten,
      totalWords,
      averageTimePerItem,
    };
  }, [items]);

  // Build result object
  const result: BatchRewriteResult | null = useMemo(() => {
    if (items.length === 0) return null;

    return {
      items,
      progress,
      status,
      startTime: startTime || Date.now(),
      endTime,
      duration: startTime && endTime ? endTime - startTime : null,
      overallMetrics,
    };
  }, [items, progress, status, startTime, endTime, overallMetrics]);

  // ========================================================================
  // Actions
  // ========================================================================

  /**
   * Add items to batch
   */
  const addItems = useCallback((texts: string[], contexts?: string[]) => {
    const newItems: BatchRewriteItem[] = texts.map((text, index) => ({
      id: generateItemId(),
      originalText: text,
      rewrittenText: null,
      status: 'pending' as const,
      error: null,
      metrics: null,
      context: contexts?.[index],
    }));

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  /**
   * Remove item
   */
  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  /**
   * Clear all items
   */
  const clearItems = useCallback(() => {
    setItems([]);
    setStartTime(null);
    setEndTime(null);
    setIsRunning(false);
    setIsPaused(false);
    setIsCancelled(false);
    processingTimesRef.current = [];
  }, []);

  /**
   * Process single item
   */
  const processItem = useCallback(
    async (item: BatchRewriteItem): Promise<BatchRewriteItem> => {
      const itemStartTime = Date.now();

      try {
        // Create manager if not exists
        if (!managerRef.current) {
          managerRef.current = new RewriterManager();
        }

        // Rewrite the text
        const result = await managerRef.current.rewrite(
          item.originalText,
          item.context,
        );

        const itemEndTime = Date.now();
        const processingTime = itemEndTime - itemStartTime;
        processingTimesRef.current.push(processingTime);

        return {
          ...item,
          rewrittenText: result,
          status: 'completed',
          metrics: {
            duration: processingTime,
            characters: result.length,
            words: result.split(/\s+/).filter(Boolean).length,
          },
        };
      } catch (error) {
        return {
          ...item,
          status: 'failed',
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
    },
    [],
  );

  /**
   * Start batch processing
   */
  const start = useCallback(async () => {
    if (isRunning || items.length === 0) return;

    setIsRunning(true);
    setIsPaused(false);
    setIsCancelled(false);
    setStartTime(Date.now());
    shouldPauseRef.current = false;
    shouldCancelRef.current = false;

    const pendingItems = items.filter((item) => item.status === 'pending');

    for (let i = 0; i < pendingItems.length; i++) {
      // Check for pause
      if (shouldPauseRef.current) {
        setIsPaused(true);
        setIsRunning(false);
        return;
      }

      // Check for cancel
      if (shouldCancelRef.current) {
        setItems((prev) =>
          prev.map((item) =>
            item.status === 'pending' || item.status === 'processing'
              ? { ...item, status: 'cancelled' as const }
              : item,
          ),
        );
        setIsCancelled(true);
        setIsRunning(false);
        setEndTime(Date.now());
        return;
      }

      const currentItem = pendingItems[i];
      if (!currentItem) continue;

      // Mark as processing
      setItems((prev) =>
        prev.map((item) =>
          item.id === currentItem.id
            ? { ...item, status: 'processing' as const }
            : item,
        ),
      );

      // Process item
      const processedItem = await processItem(currentItem);

      // Update item
      setItems((prev) =>
        prev.map((item) =>
          item.id === processedItem.id ? processedItem : item,
        ),
      );

      // Check if should stop on error
      if (config.stopOnError && processedItem.status === 'failed') {
        setIsRunning(false);
        setEndTime(Date.now());
        return;
      }

      // Delay between requests
      if (
        i < pendingItems.length - 1 &&
        config.delayBetweenRequests &&
        config.delayBetweenRequests > 0
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, config.delayBetweenRequests),
        );
      }
    }

    setIsRunning(false);
    setEndTime(Date.now());
  }, [items, isRunning, config, processItem]);

  /**
   * Pause batch processing
   */
  const pause = useCallback(() => {
    if (!isRunning) return;
    shouldPauseRef.current = true;
  }, [isRunning]);

  /**
   * Resume batch processing
   */
  const resume = useCallback(async () => {
    if (!isPaused) return;
    setIsPaused(false);
    shouldPauseRef.current = false;
    await start();
  }, [isPaused, start]);

  /**
   * Cancel batch processing
   */
  const cancel = useCallback(() => {
    if (!isRunning) return;
    shouldCancelRef.current = true;
  }, [isRunning]);

  /**
   * Retry failed items
   */
  const retryFailed = useCallback(async () => {
    setItems((prev) =>
      prev.map((item) =>
        item.status === 'failed'
          ? { ...item, status: 'pending' as const, error: null }
          : item,
      ),
    );

    await start();
  }, [start]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<BatchRewriteConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Import from file
   */
  const importFromFile = useCallback(
    async (file: File, options?: Partial<BatchImportOptions>) => {
      // This will be implemented with the parser utility
      console.log('Import from file:', file, options);
      throw new Error('Not implemented yet - requires parser utility');
    },
    [],
  );

  /**
   * Export results
   */
  const exportResults = useCallback((options?: Partial<BatchExportOptions>) => {
    // This will be implemented with the exporter utility
    console.log('Export results:', options);
    throw new Error('Not implemented yet - requires exporter utility');
  }, []);

  // ========================================================================
  // Return
  // ========================================================================

  return {
    items,
    progress,
    status,
    result,
    config,
    actions: {
      addItems,
      removeItem,
      clearItems,
      start,
      pause,
      resume,
      cancel,
      retryFailed,
      updateConfig,
      importFromFile,
      exportResults,
    },
  };
}

// ============================================================================
// Export
// ============================================================================

export default useBatchRewrite;
