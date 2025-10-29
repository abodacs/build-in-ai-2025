/**
 * useTranslator Hook
 * Main hook for translation operations with Chrome AI Translator API
 *
 * SECURITY: Integrated OWASP LLM01:2025 prompt injection detection and output validation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  type UseTranslatorOptions,
  type UseTranslatorReturn,
  type TranslationResult,
  type Translator,
  TranslationError,
  TranslationErrorType,
} from '../types';
import { TranslatorManager } from '../services';

// SECURITY: Import security utilities
import { detectInjection } from '../../../shared/utils/promptInjectionDetection';
import { validateAIOutput } from '../../../shared/utils/outputValidation';
import {
  logInjectionDetected,
  logSuspiciousOutput,
  getSessionId,
} from '../../../shared/utils/securityLogger';

/**
 * useTranslator hook
 *
 * Main hook for performing translations with the Chrome AI Translator API
 *
 * @param options - Translator options
 * @returns Translator state and functions
 *
 * @example
 * ```tsx
 * const { translate, isLoading, result, error } = useTranslator({
 *   sourceLanguage: 'en',
 *   targetLanguage: 'es',
 * });
 *
 * const handleTranslate = async () => {
 *   await translate('Hello, world!');
 * };
 * ```
 */
export function useTranslator(
  options: UseTranslatorOptions,
): UseTranslatorReturn {
  const { sourceLanguage, targetLanguage, context, onDownloadProgress } =
    options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);

  const translatorRef = useRef<Translator | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const managerRef = useRef(new TranslatorManager());

  /**
   * Get or create translator instance
   */
  const getTranslator = useCallback(async (): Promise<Translator> => {
    // Return cached translator if exists
    if (translatorRef.current) {
      return translatorRef.current;
    }

    // Create new translator
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const translator = await managerRef.current.create({
      sourceLanguage,
      targetLanguage,
      signal: abortController.signal,
      monitor: onDownloadProgress
        ? (m) => {
            m.addEventListener('downloadprogress', ((e: Event) => {
              const customEvent = e as { loaded?: number; total?: number };
              const loaded = customEvent.loaded || 0;
              const total = customEvent.total || 1;
              const progress = (loaded / total) * 100;
              onDownloadProgress(progress, loaded, total);
            }) as EventListener);
          }
        : undefined,
    });

    translatorRef.current = translator;
    return translator;
  }, [sourceLanguage, targetLanguage, onDownloadProgress]);

  /**
   * Translate text
   */
  const translate = useCallback(
    async (text: string): Promise<string | null> => {
      if (!text || text.trim() === '') {
        setError(
          new TranslationError(
            'Input text cannot be empty',
            TranslationErrorType.INVALID_INPUT,
            false,
          ),
        );
        return null;
      }

      // SECURITY: Detect potential prompt injection in input
      const injectionDetection = detectInjection(text);
      if (injectionDetection.isInjection) {
        logInjectionDetected(
          getSessionId(),
          text,
          injectionDetection.category || 'unknown',
          injectionDetection.confidence,
          false, // Don't block, just log
          'translator-api',
        );
        console.warn(
          `[SECURITY] Potential prompt injection detected in translator input:`,
          {
            category: injectionDetection.category,
            confidence: injectionDetection.confidence,
            severity: injectionDetection.severity,
          },
        );
      }

      setIsLoading(true);
      setError(null);

      const startTime = Date.now();

      try {
        const translator = await getTranslator();

        const translation = await translator.translate(text, {
          context,
          signal: abortControllerRef.current?.signal,
        });

        // SECURITY: Validate AI output
        const outputValidation = validateAIOutput(translation, text, {
          strictMode: false,
          sanitizeHtmlContent: true,
        });

        if (!outputValidation.safe) {
          logSuspiciousOutput(
            getSessionId(),
            translation,
            outputValidation.reason || 'Output validation failed',
            'translator-api',
          );
          console.warn(
            `[SECURITY] Suspicious output detected from translator:`,
            {
              reason: outputValidation.reason,
              issues: outputValidation.issues,
            },
          );
        }

        const endTime = Date.now();
        const latency = endTime - startTime;

        const translationResult: TranslationResult = {
          original: text,
          translated: outputValidation.sanitized, // Use sanitized output
          sourceLanguage,
          targetLanguage,
          timestamp: new Date().toISOString(),
          performance: {
            translationLatency: latency,
            throughput: (text.length / latency) * 1000,
            cacheHit: false,
          },
        };

        setResult(translationResult);
        setIsLoading(false);

        return outputValidation.sanitized;
      } catch (err) {
        const error =
          err instanceof TranslationError
            ? err
            : new TranslationError(
                err instanceof Error ? err.message : 'Translation failed',
                TranslationErrorType.TRANSLATION_FAILED,
                true,
                err instanceof Error ? err : undefined,
              );

        setError(error);
        setIsLoading(false);
        return null;
      }
    },
    [getTranslator, sourceLanguage, targetLanguage, context],
  );

  /**
   * Translate with streaming
   */
  const translateStreaming = useCallback(
    async (
      text: string,
      onChunk: (chunk: string) => void,
    ): Promise<string | null> => {
      if (!text || text.trim() === '') {
        setError(
          new TranslationError(
            'Input text cannot be empty',
            TranslationErrorType.INVALID_INPUT,
            false,
          ),
        );
        return null;
      }

      // SECURITY: Detect potential prompt injection in input
      const injectionDetection = detectInjection(text);
      if (injectionDetection.isInjection) {
        logInjectionDetected(
          getSessionId(),
          text,
          injectionDetection.category || 'unknown',
          injectionDetection.confidence,
          false, // Don't block, just log
          'translator-api-streaming',
        );
        console.warn(
          `[SECURITY] Potential prompt injection detected in translator streaming input:`,
          {
            category: injectionDetection.category,
            confidence: injectionDetection.confidence,
            severity: injectionDetection.severity,
          },
        );
      }

      setIsLoading(true);
      setError(null);

      const startTime = Date.now();

      try {
        const translator = await getTranslator();

        const stream = translator.translateStreaming(text, {
          context,
          signal: abortControllerRef.current?.signal,
        });

        let fullTranslation = '';
        let chunkCount = 0;

        for await (const chunk of stream) {
          fullTranslation = chunk;
          chunkCount++;
          onChunk(chunk);
        }

        // SECURITY: Validate complete output
        const outputValidation = validateAIOutput(fullTranslation, text, {
          strictMode: false,
          sanitizeHtmlContent: true,
        });

        if (!outputValidation.safe) {
          logSuspiciousOutput(
            getSessionId(),
            fullTranslation,
            outputValidation.reason || 'Output validation failed',
            'translator-api-streaming',
          );
          console.warn(
            `[SECURITY] Suspicious output detected from streaming translator:`,
            {
              reason: outputValidation.reason,
              issues: outputValidation.issues,
            },
          );
        }

        const endTime = Date.now();
        const latency = endTime - startTime;

        const translationResult: TranslationResult = {
          original: text,
          translated: outputValidation.sanitized, // Use sanitized output
          sourceLanguage,
          targetLanguage,
          timestamp: new Date().toISOString(),
          performance: {
            translationLatency: latency,
            throughput: (text.length / latency) * 1000,
            cacheHit: false,
            streamingMetrics: {
              firstChunkLatency: 0, // TODO: Track first chunk time
              chunkCount,
              averageChunkSize: Math.round(
                outputValidation.sanitized.length / chunkCount,
              ),
              chunksPerSecond: (chunkCount / latency) * 1000,
            },
          },
        };

        setResult(translationResult);
        setIsLoading(false);

        return outputValidation.sanitized;
      } catch (err) {
        const error =
          err instanceof TranslationError
            ? err
            : new TranslationError(
                err instanceof Error
                  ? err.message
                  : 'Streaming translation failed',
                TranslationErrorType.TRANSLATION_FAILED,
                true,
                err instanceof Error ? err : undefined,
              );

        setError(error);
        setIsLoading(false);
        return null;
      }
    },
    [getTranslator, sourceLanguage, targetLanguage, context],
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setResult(null);
  }, []);

  /**
   * Cancel ongoing translation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  /**
   * Cleanup on unmount or language change
   */
  useEffect(() => {
    // Capture ref value to avoid stale closure
    const manager = managerRef.current;

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (translatorRef.current && manager) {
        manager.destroy(sourceLanguage, targetLanguage);
        translatorRef.current = null;
      }
    };
  }, [sourceLanguage, targetLanguage]);

  return {
    translate,
    translateStreaming,
    isLoading,
    error,
    result,
    reset,
    cancel,
  };
}
