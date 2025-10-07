/**
 * useTranslator Hook
 * Main hook for translation operations with Chrome AI Translator API
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
            m.addEventListener('downloadprogress', ((e: any) => {
              const progress = (e.loaded / e.total) * 100;
              onDownloadProgress(progress, e.loaded, e.total);
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

      setIsLoading(true);
      setError(null);

      const startTime = Date.now();

      try {
        const translator = await getTranslator();

        const translation = await translator.translate(text, {
          context,
          signal: abortControllerRef.current?.signal,
        });

        const endTime = Date.now();
        const latency = endTime - startTime;

        const translationResult: TranslationResult = {
          original: text,
          translated: translation,
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

        return translation;
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

        const endTime = Date.now();
        const latency = endTime - startTime;

        const translationResult: TranslationResult = {
          original: text,
          translated: fullTranslation,
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
              averageChunkSize: Math.round(fullTranslation.length / chunkCount),
              chunksPerSecond: (chunkCount / latency) * 1000,
            },
          },
        };

        setResult(translationResult);
        setIsLoading(false);

        return fullTranslation;
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
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (translatorRef.current) {
        managerRef.current.destroy(sourceLanguage, targetLanguage);
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
