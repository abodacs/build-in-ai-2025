/**
 * Chrome AI API Mocks for Testing
 * Comprehensive mocks for all Chrome AI APIs to enable testing
 */

import { vi } from 'vitest';

// Mock API response data
export const mockApiResponses = {
  summarizer: {
    success: "This is a test summary of the input text.",
    error: "Summarizer API error"
  },
  translator: {
    success: "Esto es una prueba de traducción.",
    error: "Translator API error"
  },
  writer: {
    success: "This is generated text based on the input prompt.",
    error: "Writer API error"
  },
  rewriter: {
    success: "This is the rewritten version of the input text.",
    error: "Rewriter API error"
  },
  proofreader: {
    success: "This is the proofread version with corrections.",
    error: "Proofreader API error"
  },
  languageModel: {
    success: "This is a response from the language model.",
    error: "Language Model API error"
  },
  languageDetector: {
    success: [
      { detectedLanguage: 'en', confidence: 0.95 },
      { detectedLanguage: 'es', confidence: 0.05 }
    ],
    error: "Language Detection API error"
  }
};

// Mock API instance creators
export const createMockApiInstance = (apiName: string, shouldSucceed: boolean = true) => {
  const mockInstance = {
    destroy: vi.fn(),
  };

  switch (apiName) {
    case 'Summarizer':
      return {
        ...mockInstance,
        summarize: vi.fn().mockImplementation(async () => {
          if (!shouldSucceed) throw new Error(mockApiResponses.summarizer.error);
          return mockApiResponses.summarizer.success;
        })
      };

    case 'Translator':
      return {
        ...mockInstance,
        translate: vi.fn().mockImplementation(async () => {
          if (!shouldSucceed) throw new Error(mockApiResponses.translator.error);
          return mockApiResponses.translator.success;
        })
      };

    case 'Writer':
      return {
        ...mockInstance,
        write: vi.fn().mockImplementation(async () => {
          if (!shouldSucceed) throw new Error(mockApiResponses.writer.error);
          return mockApiResponses.writer.success;
        })
      };

    case 'Rewriter':
      return {
        ...mockInstance,
        rewrite: vi.fn().mockImplementation(async () => {
          if (!shouldSucceed) throw new Error(mockApiResponses.rewriter.error);
          return mockApiResponses.rewriter.success;
        })
      };

    case 'Proofreader':
      return {
        ...mockInstance,
        proofread: vi.fn().mockImplementation(async () => {
          if (!shouldSucceed) throw new Error(mockApiResponses.proofreader.error);
          return mockApiResponses.proofreader.success;
        })
      };

    case 'LanguageModel':
      return {
        ...mockInstance,
        prompt: vi.fn().mockImplementation(async () => {
          if (!shouldSucceed) throw new Error(mockApiResponses.languageModel.error);
          return mockApiResponses.languageModel.success;
        })
      };

    case 'LanguageDetector':
      return {
        ...mockInstance,
        detect: vi.fn().mockImplementation(async () => {
          if (!shouldSucceed) throw new Error(mockApiResponses.languageDetector.error);
          return mockApiResponses.languageDetector.success;
        })
      };

    default:
      return mockInstance;
  }
};

// Mock Chrome AI API classes
export const createMockChromeAI = (availableApis: string[] = [], shouldSucceed: boolean = true) => {
  const mockApis: any = {};

  const allApis = ['Summarizer', 'Translator', 'Writer', 'Rewriter', 'Proofreader', 'LanguageModel', 'LanguageDetector'];

  allApis.forEach(apiName => {
    if (availableApis.includes(apiName)) {
      mockApis[apiName] = {
        create: vi.fn().mockImplementation(async (options?: any) => {
          if (!shouldSucceed) throw new Error(`${apiName} creation failed`);
          return createMockApiInstance(apiName, shouldSucceed);
        })
      };
    }
  });

  return mockApis;
};

// Helper to setup globalThis with Chrome AI mocks
export const setupChromeAIMocks = (availableApis: string[] = [], shouldSucceed: boolean = true) => {
  const mockApis = createMockChromeAI(availableApis, shouldSucceed);

  // Clean up existing mocks
  ['Summarizer', 'Translator', 'Writer', 'Rewriter', 'Proofreader', 'LanguageModel', 'LanguageDetector'].forEach(api => {
    delete (globalThis as any)[api];
  });

  // Setup new mocks
  Object.entries(mockApis).forEach(([apiName, apiMock]) => {
    (globalThis as any)[apiName] = apiMock;
  });

  return mockApis;
};

// Helper to cleanup Chrome AI mocks
export const cleanupChromeAIMocks = () => {
  ['Summarizer', 'Translator', 'Writer', 'Rewriter', 'Proofreader', 'LanguageModel', 'LanguageDetector'].forEach(api => {
    delete (globalThis as any)[api];
  });
};

// Mock performance.now for timing tests
export const mockPerformanceNow = () => {
  let mockTime = 0;
  const originalNow = performance.now;

  const mockNow = vi.fn().mockImplementation(() => {
    mockTime += 100; // Increment by 100ms each call
    return mockTime;
  });

  Object.defineProperty(performance, 'now', {
    value: mockNow,
    writable: true
  });

  return {
    mockNow,
    setTime: (time: number) => { mockTime = time; },
    incrementTime: (increment: number) => { mockTime += increment; },
    restore: () => {
      Object.defineProperty(performance, 'now', {
        value: originalNow,
        writable: true
      });
    }
  };
};

// Test data for API inputs and expected outputs
export const testData = {
  summarizer: {
    input: "This is a long text that needs to be summarized. It contains multiple sentences and paragraphs that should be condensed into key points or a brief summary.",
    options: [
      { type: 'tl-dr' as const, format: 'plain-text' as const, length: 'medium' as const },
      { type: 'key-points' as const, format: 'markdown' as const, length: 'short' as const },
      { type: 'teaser' as const, format: 'plain-text' as const, length: 'long' as const },
      { type: 'headline' as const, format: 'plain-text' as const, length: 'short' as const }
    ]
  },
  translator: {
    input: "Hello, how are you today?",
    options: [
      { sourceLanguage: 'en', targetLanguage: 'es' },
      { sourceLanguage: 'en', targetLanguage: 'fr' },
      { sourceLanguage: 'es', targetLanguage: 'en' }
    ]
  },
  writer: {
    input: "Write about the benefits of renewable energy",
    options: [
      { tone: 'formal' as const, format: 'plain-text' as const, length: 'medium' as const },
      { tone: 'casual' as const, format: 'markdown' as const, length: 'short' as const },
      { tone: 'neutral' as const, format: 'plain-text' as const, length: 'long' as const }
    ]
  },
  rewriter: {
    input: "This text needs to be rewritten in a different style.",
    options: [
      { tone: 'more-formal' as const, format: 'plain-text' as const, length: 'as-is' as const },
      { tone: 'more-casual' as const, format: 'markdown' as const, length: 'shorter' as const },
      { tone: 'as-is' as const, format: 'as-is' as const, length: 'longer' as const }
    ]
  },
  proofreader: {
    input: "This text has some gramatical errors that need to be corrected."
  },
  languageModel: {
    input: "Explain quantum computing in simple terms",
    options: [
      { systemPrompt: "You are a helpful assistant." },
      { systemPrompt: "You are a science teacher.", context: "Educational content" }
    ]
  },
  languageDetector: {
    inputs: [
      "Hello, how are you?", // English
      "Hola, ¿cómo estás?", // Spanish
      "Bonjour, comment allez-vous?", // French
      "Guten Tag, wie geht es Ihnen?" // German
    ]
  }
};

// Error scenarios for testing
export const errorScenarios = {
  apiUnavailable: "API not available",
  creationFailed: "Failed to create API instance",
  runtimeError: "Runtime API error",
  networkError: "Network error",
  timeout: "Request timeout",
  invalidInput: "Invalid input parameters"
};