/**
 * useLanguageDetection Hook
 *
 * @module language-detection/hooks/useLanguageDetection
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChromeAILanguageDetectionService } from '../services';
import type {
  DetectionResult,
  DetectionConfig,
  LanguageDetector,
} from '../types';

export interface UseLanguageDetectionReturn {
  isDetecting: boolean;
  results: DetectionResult[];
  primaryResult: DetectionResult | null;
  error: Error | null;
  config: DetectionConfig;
  isLoading: boolean;
  metrics?: { duration: number };
  actions: {
    detect: (input: string) => Promise<DetectionResult[] | null>;
    reset: () => void;
    updateConfig: (config: Partial<DetectionConfig>) => void;
    cancel: () => void;
  };
}

export function useLanguageDetection(
  initialConfig: DetectionConfig,
): UseLanguageDetectionReturn {
  const [config, setConfig] = useState<DetectionConfig>(initialConfig);
  const [isDetecting, setIsDetecting] = useState(false);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [metrics, setMetrics] = useState<{ duration: number } | undefined>(
    undefined,
  );

  const instanceRef = useRef<LanguageDetector | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        ChromeAILanguageDetectionService.destroy(instanceRef.current);
      }
    };
  }, []);

  const detect = useCallback(
    async (input: string): Promise<DetectionResult[] | null> => {
      if (!input || input.trim().length === 0) {
        return null;
      }

      const startTime = performance.now();
      abortControllerRef.current = new AbortController();

      try {
        setError(null);
        setIsDetecting(true);

        if (!instanceRef.current) {
          instanceRef.current =
            await ChromeAILanguageDetectionService.createInstance();
        }

        const detectionResults = await ChromeAILanguageDetectionService.detect(
          instanceRef.current,
          input,
        );

        // Filter by confidence threshold
        const filtered = config.showAllCandidates
          ? detectionResults
          : detectionResults.filter(
              (r) => r.confidence >= config.confidenceThreshold,
            );

        // Limit to max candidates
        const limited = filtered.slice(0, config.maxCandidates);

        const duration = performance.now() - startTime;
        setMetrics({ duration });
        setResults(limited);
        setIsDetecting(false);
        abortControllerRef.current = null;

        return limited;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setIsDetecting(false);
          return null;
        }
        setError(err instanceof Error ? err : new Error('Detection failed'));
        setIsDetecting(false);
        abortControllerRef.current = null;
        return null;
      }
    },
    [config],
  );

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
    setMetrics(undefined);
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsDetecting(false);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<DetectionConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const primaryResult = results.length > 0 ? (results[0] ?? null) : null;

  return {
    isDetecting,
    isLoading: isDetecting,
    results,
    primaryResult,
    error,
    config,
    metrics,
    actions: { detect, reset, updateConfig, cancel },
  };
}

export default useLanguageDetection;
