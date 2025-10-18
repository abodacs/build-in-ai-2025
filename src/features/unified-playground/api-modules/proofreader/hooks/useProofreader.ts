/**
 * useProofreader Hook
 *
 * React hook for Chrome AI Proofreader API operations.
 * Provides complete state management for proofreading with correction handling.
 *
 * Features:
 * - Proofread operations
 * - Configuration management
 * - Correction application (single/batch)
 * - Loading and error states
 * - Performance metrics
 * - Cancellation support
 * - Automatic cleanup
 *
 * @module proofreader/hooks/useProofreader
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ProofreaderManager, ProofreaderErrorHandler } from '../services';
import { PerformanceTracker } from '../../shared/services';
import {
  HistoryManager,
  createProofreaderSnapshot,
  type ProofreaderHistoryState,
} from '../utils';
import type {
  ProofreaderConfig,
  ProofreadResult,
  ProofreadCorrection,
  CorrectionState,
} from '../types';
import type { PerformanceMetrics } from '../../shared/types';

// ============================================================================
// Utilities
// ============================================================================

/**
 * Add timeout to a promise
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
          `[useProofreader] Retry failed after ${maxAttempts} attempts:`,
          error,
        );
        throw error;
      }

      // Calculate exponential backoff delay
      const backoffDelay = delayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[useProofreader] Attempt ${attempt} failed, retrying in ${backoffDelay}ms...`,
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
 * Loading phase type
 */
export type LoadingPhase = 'initializing' | 'proofreading' | null;

/**
 * Proofreader hook return type
 */
export interface UseProofreaderReturn {
  /** Is currently proofreading */
  isProofreading: boolean;

  /** Corrections found */
  corrections: ProofreadCorrection[];

  /** Correction states (applied/ignored) */
  correctionStates: CorrectionState[];

  /** Original input text */
  originalInput: string | null;

  /** Corrected text (with applied corrections) */
  correctedText: string | null;

  /** Error if any */
  error: Error | null;

  /** Is loading (creating instance) */
  isLoading: boolean;

  /** Current loading phase */
  loadingPhase: LoadingPhase;

  /** Current configuration */
  config: ProofreaderConfig;

  /** Performance metrics */
  metrics: PerformanceMetrics | null;

  /** Can undo */
  canUndo: boolean;

  /** Can redo */
  canRedo: boolean;

  /** Actions */
  actions: {
    /** Proofread text */
    proofread: (
      input: string,
      context?: string,
    ) => Promise<ProofreadResult | null>;

    /** Apply correction at index */
    applyCorrectionAtIndex: (index: number) => void;

    /** Ignore correction at index */
    ignoreCorrectionAtIndex: (index: number) => void;

    /** Apply all corrections */
    applyAllCorrections: () => void;

    /** Apply corrections by type */
    applyCorrectionsByType: (type: string) => void;

    /** Undo last change */
    undo: () => void;

    /** Redo last undone change */
    redo: () => void;

    /** Cancel current operation */
    cancel: () => void;

    /** Reset state */
    reset: () => void;

    /** Update configuration */
    updateConfig: (config: Partial<ProofreaderConfig>) => void;
  };
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useProofreader hook
 *
 * Complete hook for Proofreader API operations with state management.
 *
 * @param initialConfig - Initial configuration
 * @returns Hook return object
 *
 * @example
 * ```tsx
 * const {
 *   isProofreading,
 *   corrections,
 *   correctedText,
 *   error,
 *   actions
 * } = useProofreader({
 *   expectedInputLanguages: ['en'],
 *   autoApply: false,
 *   correctionTypeFilter: [],
 *   correctionMode: 'standard'
 * });
 *
 * // Proofread text
 * await actions.proofread(inputText);
 *
 * // Apply specific correction
 * actions.applyCorrectionAtIndex(0);
 * ```
 */
export function useProofreader(
  initialConfig: ProofreaderConfig,
): UseProofreaderReturn {
  // State
  const [config, setConfig] = useState<ProofreaderConfig>(initialConfig);
  const [isProofreading, setIsProofreading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
  const [corrections, setCorrections] = useState<ProofreadCorrection[]>([]);
  const [correctionStates, setCorrectionStates] = useState<CorrectionState[]>(
    [],
  );
  const [originalInput, setOriginalInput] = useState<string | null>(null);
  const [correctedText, setCorrectedText] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Refs
  const managerRef = useRef<ProofreaderManager>(new ProofreaderManager());
  const abortControllerRef = useRef<AbortController | null>(null);
  const performanceTrackerRef = useRef<PerformanceTracker>(
    new PerformanceTracker(),
  );
  const historyManagerRef = useRef<HistoryManager<ProofreaderHistoryState>>(
    new HistoryManager({ maxSize: 50, debug: false }),
  );
  const configRef = useRef<ProofreaderConfig>(config);
  const isApplyingHistoryRef = useRef(false);

  // Keep configRef in sync with config state
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
   * Proofread text
   */
  const proofread = useCallback(
    async (
      input: string,
      context?: string,
    ): Promise<ProofreadResult | null> => {
      console.group('🔧 useProofreader: proofread');
      console.log('Input:', input);
      console.log('Context:', context || '(none)');
      console.log('📋 Active Config:', configRef.current);

      // Reset state
      setError(null);
      setIsProofreading(true);
      setIsLoading(true);
      setLoadingPhase('initializing'); // Set phase to initializing
      setOriginalInput(input);
      setCorrections([]);
      setCorrectionStates([]);
      setCorrectedText(input); // Start with original
      setMetrics(null);

      // Create abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Start performance tracking
      const tracker = performanceTrackerRef.current;
      tracker.start();

      // Start instance creation synchronously
      const activeConfig = configRef.current;
      console.log('⚡ Starting instance creation...');
      const instancePromise = managerRef.current.getInstance(activeConfig);

      try {
        console.log('🔨 Waiting for Proofreader instance...');

        // Await instance creation with timeout
        await withTimeout(
          instancePromise,
          180000,
          'Proofreader instance creation timed out after 3 minutes. Model download may be in progress. Check chrome://on-device-internals for download status. Ensure 22GB+ free space and unmetered connection.',
        );
        console.log('✅ Proofreader instance obtained');
        setIsLoading(false);
        setLoadingPhase('proofreading'); // Switch to proofreading phase

        // Perform proofread with retry logic
        const result = await withRetry(async () => {
          return await managerRef.current.proofread(input, context, signal);
        });

        console.log('✅ Proofreading complete!');
        console.log('📊 Found corrections:', result.corrections?.length || 0);

        // Update state with result
        tracker.end();
        setCorrections(result.corrections || []);

        // Initialize correction states
        const states: CorrectionState[] = (result.corrections || []).map(
          (correction, index) => ({
            index,
            correction,
            state: 'pending',
          }),
        );
        setCorrectionStates(states);

        setMetrics(tracker.getMetrics());
        setIsProofreading(false);
        setLoadingPhase(null); // Clear loading phase

        console.groupEnd();
        return result;
      } catch (err: unknown) {
        tracker.end();

        console.error('❌ Proofreading failed:', err);

        // Handle error
        const proofreaderError = ProofreaderErrorHandler.handleProofreadError(
          err,
          input.length,
        );
        const error = new Error(
          ProofreaderErrorHandler.getUserMessage(proofreaderError),
        );
        setError(error);
        setIsProofreading(false);
        setIsLoading(false);
        setLoadingPhase(null); // Clear loading phase on error

        console.error(
          ProofreaderErrorHandler.formatForLogging(proofreaderError),
        );

        console.groupEnd();
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [],
  );

  /**
   * Apply correction at index
   */
  const applyCorrectionAtIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= corrections.length) {
        console.error(`Invalid correction index: ${index}`);
        return;
      }

      const correction = corrections[index];
      const currentText = correctedText || originalInput || '';

      try {
        const newText = managerRef.current.applyCorrectionAtIndex(
          currentText,
          correction,
        );
        setCorrectedText(newText);

        // Update correction state
        setCorrectionStates((prev) =>
          prev.map((state) =>
            state.index === index ? { ...state, state: 'applied' } : state,
          ),
        );

        console.log(`✅ Applied correction ${index}`);
      } catch (error) {
        console.error(`Failed to apply correction ${index}:`, error);
      }
    },
    [corrections, correctedText, originalInput],
  );

  /**
   * Ignore correction at index
   */
  const ignoreCorrectionAtIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= corrections.length) {
        console.error(`Invalid correction index: ${index}`);
        return;
      }

      // Update correction state
      setCorrectionStates((prev) =>
        prev.map((state) =>
          state.index === index ? { ...state, state: 'ignored' } : state,
        ),
      );

      console.log(`⏭️ Ignored correction ${index}`);
    },
    [corrections.length],
  );

  /**
   * Apply all corrections
   */
  const applyAllCorrections = useCallback(() => {
    const currentText = originalInput || '';

    try {
      const newText = managerRef.current.applyAllCorrections(
        currentText,
        corrections,
      );
      setCorrectedText(newText);

      // Mark all as applied
      setCorrectionStates((prev) =>
        prev.map((state) => ({ ...state, state: 'applied' })),
      );

      console.log(`✅ Applied all ${corrections.length} corrections`);
    } catch (error) {
      console.error('Failed to apply all corrections:', error);
    }
  }, [corrections, originalInput]);

  /**
   * Apply corrections by type
   */
  const applyCorrectionsByType = useCallback(
    (type: string) => {
      const filteredCorrections = corrections.filter((c) => c.type === type);
      const currentText = correctedText || originalInput || '';

      try {
        const newText = managerRef.current.applyAllCorrections(
          currentText,
          filteredCorrections,
        );
        setCorrectedText(newText);

        // Mark matching type as applied
        setCorrectionStates((prev) =>
          prev.map((state) =>
            state.correction.type === type
              ? { ...state, state: 'applied' }
              : state,
          ),
        );

        console.log(
          `✅ Applied ${filteredCorrections.length} ${type} corrections`,
        );
      } catch (error) {
        console.error(`Failed to apply ${type} corrections:`, error);
      }
    },
    [corrections, correctedText, originalInput],
  );

  /**
   * Cancel current operation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsProofreading(false);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsProofreading(false);
    setCorrections([]);
    setCorrectionStates([]);
    setOriginalInput(null);
    setCorrectedText(null);
    setError(null);
    setIsLoading(false);
    setLoadingPhase(null); // Clear loading phase
    setMetrics(null);
    setCanUndo(false);
    setCanRedo(false);

    performanceTrackerRef.current.reset();
    historyManagerRef.current.clear();
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<ProofreaderConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Push current state to history
   */
  const pushHistory = useCallback(
    (description?: string) => {
      if (isApplyingHistoryRef.current) return;

      const snapshot = createProofreaderSnapshot(
        correctedText || '',
        correctionStates,
        originalInput,
      );
      historyManagerRef.current.push(snapshot, description);
      setCanUndo(historyManagerRef.current.canUndo());
      setCanRedo(historyManagerRef.current.canRedo());
    },
    [correctedText, correctionStates, originalInput],
  );

  /**
   * Apply history state
   */
  const applyHistoryState = useCallback((state: ProofreaderHistoryState) => {
    isApplyingHistoryRef.current = true;

    setCorrectedText(state.text);
    setCorrectionStates(state.correctionStates);
    setOriginalInput(state.originalInput);

    // Update undo/redo availability
    setCanUndo(historyManagerRef.current.canUndo());
    setCanRedo(historyManagerRef.current.canRedo());

    // Small delay to ensure state is applied before allowing new history pushes
    setTimeout(() => {
      isApplyingHistoryRef.current = false;
    }, 0);
  }, []);

  /**
   * Undo last change
   */
  const undo = useCallback(() => {
    const previousEntry = historyManagerRef.current.undo();
    if (previousEntry) {
      console.log('⏪ Undo:', previousEntry.description);
      applyHistoryState(previousEntry.data);
    }
  }, [applyHistoryState]);

  /**
   * Redo last undone change
   */
  const redo = useCallback(() => {
    const nextEntry = historyManagerRef.current.redo();
    if (nextEntry) {
      console.log('⏩ Redo:', nextEntry.description);
      applyHistoryState(nextEntry.data);
    }
  }, [applyHistoryState]);

  /**
   * Track history when corrections or text changes (but not during history application)
   * Note: We don't include pushHistory in deps because it already depends on
   * correctedText, correctionStates, and originalInput. Including it would cause
   * unnecessary re-runs when the function reference changes.
   */
  useEffect(() => {
    if (isApplyingHistoryRef.current || !correctedText) return;

    // Only push if we have meaningful state (after proofread or correction)
    if (corrections.length > 0 || correctionStates.length > 0) {
      const timer = setTimeout(() => {
        pushHistory('Text or corrections changed');
      }, 300); // Debounce to avoid excessive history entries

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correctedText, correctionStates, corrections.length]);

  return {
    isProofreading,
    corrections,
    correctionStates,
    originalInput,
    correctedText,
    error,
    isLoading,
    loadingPhase,
    config,
    metrics,
    canUndo,
    canRedo,
    actions: {
      proofread,
      applyCorrectionAtIndex,
      ignoreCorrectionAtIndex,
      applyAllCorrections,
      applyCorrectionsByType,
      undo,
      redo,
      cancel,
      reset,
      updateConfig,
    },
  };
}

// ============================================================================
// Export
// ============================================================================

export default useProofreader;
