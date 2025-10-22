/**
 * Test Utilities for Prompt API
 *
 * Provides mocks, helpers, and utilities for testing Prompt API components
 */

import { vi } from 'vitest';
import type {
  LanguageModel,
  LanguageModelCreateOptions,
  LanguageModelAvailability,
  Message,
  Conversation,
  ImageData,
  PromptConfig,
} from '../types';

// ============================================================================
// Mock LanguageModel API
// ============================================================================

export function createMockLanguageModel(): LanguageModel {
  return {
    prompt: vi.fn().mockResolvedValue('Mock response'),
    promptStreaming: vi.fn(async function* () {
      yield 'Mock ';
      yield 'streaming ';
      yield 'response';
    }),
    countPromptTokens: vi.fn().mockResolvedValue(10),
    maxTokens: 4096,
    tokensSoFar: 0,
    tokensLeft: 4096,
    topK: 3,
    temperature: 0.7,
    clone: vi.fn().mockResolvedValue(createMockLanguageModel()),
    destroy: vi.fn(),
  };
}

export function setupLanguageModelAPIMock() {
  const mockCreate = vi.fn().mockResolvedValue(createMockLanguageModel());
  const mockAvailability = vi
    .fn()
    .mockResolvedValue('available' as LanguageModelAvailability);
  const mockCapabilities = vi.fn().mockResolvedValue({
    available: 'available' as LanguageModelAvailability,
    defaultTopK: 3,
    maxTopK: 128,
    defaultTemperature: 0.7,
  });

  // Mock global LanguageModel
  (global as any).LanguageModel = {
    create: mockCreate,
    availability: mockAvailability,
    capabilities: mockCapabilities,
  };

  return {
    create: mockCreate,
    availability: mockAvailability,
    capabilities: mockCapabilities,
  };
}

export function cleanupLanguageModelAPIMock() {
  delete (global as any).LanguageModel;
  vi.clearAllMocks();
}

// ============================================================================
// Mock Errors
// ============================================================================

export const MOCK_ERRORS = {
  abortError: Object.assign(new Error('The operation was aborted'), {
    name: 'AbortError',
  }),
  notSupportedError: new Error('LanguageModel API is not supported'),
  downloadRequiredError: new Error('Model download required'),
  promptTooLongError: new Error('Prompt exceeds maximum token limit'),
  invalidConfigError: new Error('Invalid configuration options'),
  instanceNotInitializedError: new Error('Instance not initialized'),
  streamingFailedError: new Error('Streaming failed'),
};

// ============================================================================
// Mock Data Factories
// ============================================================================

export function createMockMessage(overrides?: Partial<Message>): Message {
  return {
    id: 'msg-1',
    role: 'user',
    content: 'Test message',
    timestamp: new Date(),
    ...overrides,
  };
}

export function createMockConversation(
  overrides?: Partial<Conversation>,
): Conversation {
  return {
    id: 'conv-1',
    title: 'Test Conversation',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    systemPrompt: 'You are a helpful assistant',
    modelConfig: {
      systemPrompt: 'You are a helpful assistant',
      temperature: 0.7,
      topK: 3,
      maxTokens: 4096,
    },
    totalTokens: 0,
    metadata: {
      messageCount: 0,
      userMessageCount: 0,
      assistantMessageCount: 0,
      averageResponseTime: 0,
      totalProcessingTime: 0,
      hasRegenerations: false,
    },
    ...overrides,
  };
}

export function createMockImageData(overrides?: Partial<ImageData>): ImageData {
  return {
    id: 'img-1',
    file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
    dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    blobUrl: 'blob:http://localhost:3000/test',
    dimensions: { width: 100, height: 100 },
    size: 1024,
    mimeType: 'image/jpeg',
    format: 'jpeg',
    optimized: false,
    metadata: {
      fileName: 'test.jpg',
      originalSize: 1024,
      currentSize: 1024,
      compressionRatio: 1.0,
      createdAt: new Date(),
      modifiedAt: new Date(),
      aspectRatio: 1.0,
    },
    ...overrides,
  };
}

export function createMockPromptConfig(
  overrides?: Partial<PromptConfig>,
): PromptConfig {
  return {
    systemPrompt: 'You are a helpful assistant',
    temperature: 0.7,
    topK: 3,
    maxTokens: 4096,
    enableStreaming: false,
    enableHistory: true,
    enableMultimodal: true,
    ...overrides,
  };
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Wait for a specified duration
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 1000,
  interval = 50,
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await waitFor(interval);
  }
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const storage = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => storage.get(key) || null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
    get length() {
      return storage.size;
    },
    key: vi.fn((index: number) => Array.from(storage.keys())[index] || null),
  };
}

/**
 * Mock File API
 */
export function createMockFile(
  name: string,
  type: string,
  size: number = 1024,
): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
}

/**
 * Mock FileReader
 */
export function mockFileReader() {
  const originalFileReader = global.FileReader;

  class MockFileReader {
    onload: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    result: string | ArrayBuffer | null = null;

    readAsDataURL(_blob: Blob) {
      setTimeout(() => {
        this.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
        if (this.onload) {
          this.onload({ target: { result: this.result } });
        }
      }, 10);
    }

    readAsArrayBuffer(_blob: Blob) {
      setTimeout(() => {
        this.result = new ArrayBuffer(8);
        if (this.onload) {
          this.onload({ target: { result: this.result } });
        }
      }, 10);
    }
  }

  (global as any).FileReader = MockFileReader;

  return {
    restore: () => {
      (global as any).FileReader = originalFileReader;
    },
  };
}

/**
 * Mock Image
 */
export function mockImage() {
  const originalImage = global.Image;

  class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    width = 100;
    height = 100;
    src = '';

    constructor() {
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 10);
    }
  }

  (global as any).Image = MockImage;

  return {
    restore: () => {
      (global as any).Image = originalImage;
    },
  };
}

/**
 * Mock Canvas API
 */
export function mockCanvas() {
  const mockContext = {
    drawImage: vi.fn(),
    getImageData: vi.fn().mockReturnValue({
      data: new Uint8ClampedArray(400), // 100x100 with RGBA
      width: 100,
      height: 100,
    }),
  };

  const mockCanvas = {
    getContext: vi.fn().mockReturnValue(mockContext),
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,iVBORw0KGgo...'),
    toBlob: vi.fn((callback: (blob: Blob) => void) => {
      callback(new Blob(['test'], { type: 'image/png' }));
    }),
    width: 100,
    height: 100,
  };

  document.createElement = vi.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return mockCanvas as any;
    }
    return document.createElement(tagName);
  }) as any;

  return {
    canvas: mockCanvas,
    context: mockContext,
  };
}

/**
 * Mock URL.createObjectURL and revokeObjectURL
 */
export function mockURL() {
  const urls = new Set<string>();

  const mockCreateObjectURL = vi.fn((blob: Blob) => {
    const url = `blob:http://localhost:3000/${Math.random()}`;
    urls.add(url);
    return url;
  });

  const mockRevokeObjectURL = vi.fn((url: string) => {
    urls.delete(url);
  });

  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  URL.createObjectURL = mockCreateObjectURL;
  URL.revokeObjectURL = mockRevokeObjectURL;

  return {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
    urls,
    restore: () => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    },
  };
}

/**
 * Create a streaming chunk callback mock
 */
export function createStreamingCallback() {
  const chunks: string[] = [];
  const callback = vi.fn((chunk: string) => {
    chunks.push(chunk);
  });

  return {
    callback,
    chunks,
    getFullText: () => chunks.join(''),
  };
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that a function throws with a specific message
 */
export async function expectToThrowAsync(
  fn: () => Promise<any>,
  expectedMessage?: string,
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error: any) {
    if (expectedMessage && !error.message.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to include "${expectedMessage}", but got "${error.message}"`,
      );
    }
  }
}

/**
 * Assert that an object has specific properties
 */
export function expectToHaveProperties<T extends object>(
  obj: T,
  properties: (keyof T)[],
): void {
  properties.forEach((prop) => {
    if (!(prop in obj)) {
      throw new Error(`Expected object to have property "${String(prop)}"`);
    }
  });
}

// ============================================================================
// Export all utilities
// ============================================================================

export default {
  createMockLanguageModel,
  setupLanguageModelAPIMock,
  cleanupLanguageModelAPIMock,
  MOCK_ERRORS,
  createMockMessage,
  createMockConversation,
  createMockImageData,
  createMockPromptConfig,
  waitFor,
  waitForCondition,
  mockLocalStorage,
  createMockFile,
  mockFileReader,
  mockImage,
  mockCanvas,
  mockURL,
  createStreamingCallback,
  expectToThrowAsync,
  expectToHaveProperties,
};
