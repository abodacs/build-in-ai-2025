/**
 * Test Utilities for Translator Module
 *
 * Provides mock factories, test helpers, and shared test utilities
 * for all Translator API tests
 */

import { vi } from 'vitest';
import type {
  Translator,
  TranslatorCreateOptions,
  TranslateOptions,
  AvailabilityStatus,
  LanguageCode,
  TranslationResult,
  PerformanceMetrics,
} from '../types/translator.types';

// ============================================================================
// Mock Factories
// ============================================================================

/**
 * Creates a mock Translator instance
 */
export function createMockTranslator(
  overrides?: Partial<Translator>,
): Translator {
  return {
    translate: vi.fn().mockResolvedValue('Translated text'),
    translateStreaming: vi.fn().mockReturnValue(createMockStream()),
    destroy: vi.fn(),
    ...overrides,
  };
}

/**
 * Creates a mock ReadableStream for streaming translation
 */
export function createMockStream(
  chunks: string[] = ['Chunk 1', 'Chunk 1 2', 'Chunk 1 2 3'],
) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const chunk of chunks) {
        await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate delay
        yield chunk;
      }
    },
  };
}

/**
 * Creates a mock Translator API class
 */
export function createMockTranslatorAPI() {
  return {
    create: vi.fn().mockResolvedValue(createMockTranslator()),
    availability: vi.fn().mockResolvedValue('available' as AvailabilityStatus),
  };
}

/**
 * Sets up global Translator API mock
 * Note: Directly assigns to globalThis.Translator which is already mocked in setup.ts
 */
export function setupTranslatorAPIMock() {
  // Clear any existing mocks first
  vi.clearAllMocks();

  const mockAPI = createMockTranslatorAPI();

  // Directly override the already-defined Translator object
  // setup.ts creates it, we just replace its methods
  (globalThis as any).Translator.create = mockAPI.create;
  (globalThis as any).Translator.availability = mockAPI.availability;

  return mockAPI;
}

/**
 * Cleans up global Translator API mock
 */
export function cleanupTranslatorAPIMock() {
  // Clear all mocks
  vi.clearAllMocks();

  // Reset to default mocks
  (globalThis as any).Translator.create = vi.fn();
  (globalThis as any).Translator.availability = vi.fn();
}

// ============================================================================
// Test Data
// ============================================================================

export const SUPPORTED_LANGUAGE_PAIRS = [
  { source: 'en' as LanguageCode, target: 'es' as LanguageCode },
  { source: 'en' as LanguageCode, target: 'fr' as LanguageCode },
  { source: 'es' as LanguageCode, target: 'en' as LanguageCode },
  { source: 'zh' as LanguageCode, target: 'en' as LanguageCode },
];

export const SAMPLE_TEXTS = {
  short: 'Hello, world!',
  medium: 'This is a medium-length text. '.repeat(20), // ~580 chars
  long: 'This is a long text for testing. '.repeat(1500), // ~51,000 chars
  empty: '',
  withContext: {
    text: 'Good morning',
    context: 'formal greeting',
  },
};

export const SAMPLE_TRANSLATIONS = {
  'en->es': {
    original: 'Hello',
    translated: 'Hola',
  },
  'en->fr': {
    original: 'Hello',
    translated: 'Bonjour',
  },
  'es->en': {
    original: 'Hola',
    translated: 'Hello',
  },
};

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Waits for async operations to complete
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulates download progress
 */
export function simulateDownloadProgress(
  callback: (progress: { loaded: number; total: number }) => void,
  steps = 5,
) {
  const total = 10000000; // 10MB
  let loaded = 0;
  const interval = setInterval(() => {
    loaded += total / steps;
    if (loaded >= total) {
      loaded = total;
      clearInterval(interval);
    }
    callback({ loaded, total });
  }, 100);
  return interval;
}

/**
 * Creates a mock AbortController
 */
export function createMockAbortController() {
  const controller = new AbortController();
  return {
    controller,
    abort: () => controller.abort(),
    signal: controller.signal,
  };
}

/**
 * Creates mock performance metrics
 */
export function createMockPerformanceMetrics(
  overrides?: Partial<PerformanceMetrics>,
): PerformanceMetrics {
  return {
    translationLatency: 250,
    throughput: 100,
    cacheHit: false,
    downloadTime: undefined,
    ...overrides,
  };
}

/**
 * Creates mock translation result
 */
export function createMockTranslationResult(
  overrides?: Partial<TranslationResult>,
): TranslationResult {
  return {
    original: 'Hello',
    translated: 'Hola',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    timestamp: new Date().toISOString(),
    performance: createMockPerformanceMetrics(),
    ...overrides,
  };
}

// ============================================================================
// Error Mocks
// ============================================================================

export const MOCK_ERRORS = {
  apiUnavailable: new DOMException('API not available', 'NotSupportedError'),
  modelDownloadFailed: new Error('Model download failed'),
  networkError: new Error('Network error'),
  translationFailed: new Error('Translation failed'),
  abortError: new DOMException('Operation aborted', 'AbortError'),
  invalidLanguageCode: new Error('Invalid language code'),
};

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Asserts that a translator was created with correct options
 */
export function assertTranslatorCreated(
  mockCreate: any,
  sourceLanguage: string,
  targetLanguage: string,
) {
  expect(mockCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      sourceLanguage,
      targetLanguage,
    }),
  );
}

/**
 * Asserts that translation was called with correct parameters
 */
export function assertTranslationCalled(
  mockTranslate: any,
  text: string,
  context?: string,
) {
  if (context) {
    expect(mockTranslate).toHaveBeenCalledWith(text, { context });
  } else {
    expect(mockTranslate).toHaveBeenCalledWith(text, expect.any(Object));
  }
}

/**
 * Asserts performance metrics are within acceptable ranges
 */
export function assertPerformanceMetrics(metrics: PerformanceMetrics) {
  expect(metrics.translationLatency).toBeGreaterThanOrEqual(0);
  expect(metrics.throughput).toBeGreaterThanOrEqual(0);
  expect(typeof metrics.cacheHit).toBe('boolean');
}
