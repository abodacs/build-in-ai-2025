/**
 * useLanguageDetection Hook
 *
 * @module language-detection/hooks/useLanguageDetection
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChromeAILanguageDetectionService } from '../services';
import type { DetectionResult, DetectionConfig } from '../types';

export interface UseLanguageDetectionReturn {
  isDetecting: boolean;
  results: DetectionResult[];
  error: Error | null;
  config: DetectionConfig;
  actions: {
    detect: (input: string) => Promise<DetectionResult[] | null>;
    reset: () => void;
    updateConfig: (config: Partial<DetectionConfig>) => void;
  };
}

export function useLanguageDetection(
  initialConfig: DetectionConfig,
): UseLanguageDetectionReturn {
  const [config, setConfig] = useState<DetectionConfig>(initialConfig);
  const [isDetecting, setIsDetecting] = useState(false);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const instanceRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        ChromeAILanguageDetectionService.destroy(instanceRef.current);
      }
    };
  }, []);

  const detect = useCallback(
    async (input: string): Promise<DetectionResult[] | null> => {
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

        setResults(limited);
        setIsDetecting(false);

        return limited;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Detection failed'));
        setIsDetecting(false);
        return null;
      }
    },
    [config],
  );

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<DetectionConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  return {
    isDetecting,
    results,
    error,
    config,
    actions: { detect, reset, updateConfig },
  };
}

export default useLanguageDetection;
