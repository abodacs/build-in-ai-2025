/**
 * Test Generator Utility
 *
 * Generates comprehensive Vitest test suites for Chrome AI APIs
 * Includes unit tests, integration tests, and edge case coverage
 *
 * @module utils/codeGeneration/testGenerator
 */

import type { PromptConfig } from '@/features/unified-playground/api-modules/prompt/types';
import type { ProofreaderConfig } from '@/features/unified-playground/api-modules/proofreader/types/proofreader.types';
import type { WriterConfig } from '@/features/unified-playground/api-modules/writer/types/writer.types';
import type { RewriterConfig } from '@/features/unified-playground/api-modules/rewriter/types/rewriter.types';

// ============================================================================
// Types
// ============================================================================

interface TestGeneratorOptions {
  apiName: string;
  config: any;
  includeEdgeCases?: boolean;
  includeIntegration?: boolean;
  includeMocks?: boolean;
}

// ============================================================================
// Test Generator
// ============================================================================

/**
 * Generate comprehensive Vitest tests for Prompt API
 */
export function generatePromptAPITests(config: PromptConfig): string {
  const configStr = JSON.stringify(
    {
      systemPrompt: config.systemPrompt || 'You are a helpful assistant.',
      temperature: config.temperature || 0.8,
      topK: config.topK || 8,
      maxTokens: config.maxTokens || 2048,
    },
    null,
    2,
  );

  return `/**
 * Chrome AI Prompt API - Comprehensive Test Suite
 *
 * Generated test suite covering:
 * - Basic functionality
 * - Configuration handling
 * - Error scenarios
 * - Edge cases
 * - Integration patterns
 *
 * @vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock LanguageModel API
const mockSession = {
  prompt: vi.fn(),
  promptStreaming: vi.fn(),
  destroy: vi.fn(),
};

const mockLanguageModel = {
  create: vi.fn().mockResolvedValue(mockSession),
  availability: vi.fn().mockResolvedValue('available'),
};

// Setup global mock
beforeEach(() => {
  // @ts-ignore - Mocking browser API
  global.window.LanguageModel = mockLanguageModel;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// Test Configuration
// ============================================================================

const testConfig = ${configStr};

// ============================================================================
// Basic Functionality Tests
// ============================================================================

describe('Prompt API - Basic Functionality', () => {
  it('should check API availability', async () => {
    const availability = await window.LanguageModel.availability();

    expect(availability).toBeDefined();
    expect(['unavailable', 'downloadable', 'downloading']).toContain(availability);
  });

  it('should create a session with configuration', async () => {
    const session = await window.LanguageModel.create(testConfig);

    expect(session).toBeDefined();
    expect(session).toHaveProperty('prompt');
    expect(session).toHaveProperty('destroy');
    expect(mockLanguageModel.create).toHaveBeenCalledWith(testConfig);
  });

  it('should send a basic prompt', async () => {
    const testPrompt = 'What is 2+2?';
    const expectedResponse = 'The answer is 4.';

    mockSession.prompt.mockResolvedValue(expectedResponse);
    const session = await window.LanguageModel.create(testConfig);
    const response = await session.prompt(testPrompt);

    expect(response).toBe(expectedResponse);
    expect(mockSession.prompt).toHaveBeenCalledWith(testPrompt);
  });

  it('should destroy session properly', async () => {
    const session = await window.LanguageModel.create(testConfig);
    session.destroy();

    expect(mockSession.destroy).toHaveBeenCalled();
  });
});

// ============================================================================
// Configuration Tests
// ============================================================================

describe('Prompt API - Configuration', () => {
  it('should respect temperature setting', async () => {
    const customConfig = { ...testConfig, temperature: 0.5 };
    await window.LanguageModel.create(customConfig);

    expect(mockLanguageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0.5 })
    );
  });

  it('should respect topK setting', async () => {
    const customConfig = { ...testConfig, topK: 20 };
    await window.LanguageModel.create(customConfig);

    expect(mockLanguageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ topK: 20 })
    );
  });

  it('should respect maxTokens setting', async () => {
    const customConfig = { ...testConfig, maxTokens: 4096 };
    await window.LanguageModel.create(customConfig);

    expect(mockLanguageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ maxTokens: 4096 })
    );
  });

  it('should respect systemPrompt setting', async () => {
    const customConfig = {
      ...testConfig,
      systemPrompt: 'You are a coding assistant.'
    };
    await window.LanguageModel.create(customConfig);

    expect(mockLanguageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: 'You are a coding assistant.'
      })
    );
  });
});

// ============================================================================
// Streaming Tests
// ============================================================================

describe('Prompt API - Streaming', () => {
  it('should handle streaming responses', async () => {
    const chunks = ['Hello', ' ', 'World', '!'];
    const mockStream = {
      getReader: () => ({
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: chunks[0] })
          .mockResolvedValueOnce({ done: false, value: chunks[0] + chunks[1] })
          .mockResolvedValueOnce({ done: false, value: chunks.slice(0, 3).join('') })
          .mockResolvedValueOnce({ done: false, value: chunks.join('') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    };

    mockSession.promptStreaming.mockReturnValue(mockStream);
    const session = await window.LanguageModel.create(testConfig);

    const receivedChunks: string[] = [];
    const stream = session.promptStreaming('Test prompt');
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedChunks.push(value);
    }

    expect(receivedChunks).toHaveLength(4);
    expect(receivedChunks[receivedChunks.length - 1]).toBe('Hello World!');
  });

  it('should emit chunks progressively', async () => {
    const mockStream = {
      getReader: () => ({
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: 'Chunk 1' })
          .mockResolvedValueOnce({ done: false, value: 'Chunk 1 Chunk 2' })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    };

    mockSession.promptStreaming.mockReturnValue(mockStream);
    const session = await window.LanguageModel.create(testConfig);
    const stream = session.promptStreaming('Test');
    const reader = stream.getReader();

    const { value: first } = await reader.read();
    expect(first).toBe('Chunk 1');

    const { value: second } = await reader.read();
    expect(second).toBe('Chunk 1 Chunk 2');
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Prompt API - Error Handling', () => {
  it('should throw when API is not available', async () => {
    mockLanguageModel.availability.mockResolvedValue('no');

    await expect(async () => {
      const availability = await window.LanguageModel.availability();
      if (availability === 'no') {
        throw new Error('Chrome AI not available on this device');
      }
    }).rejects.toThrow('Chrome AI not available');
  });

  it('should handle prompt errors gracefully', async () => {
    const errorMessage = 'Model overloaded';
    mockSession.prompt.mockRejectedValue(new Error(errorMessage));

    const session = await window.LanguageModel.create(testConfig);

    await expect(session.prompt('Test')).rejects.toThrow(errorMessage);
  });

  it('should handle session creation failures', async () => {
    mockLanguageModel.create.mockRejectedValueOnce(
      new Error('Failed to create session')
    );

    await expect(
      window.LanguageModel.create(testConfig)
    ).rejects.toThrow('Failed to create session');
  });

  it('should handle streaming errors', async () => {
    const mockStream = {
      getReader: () => ({
        read: vi.fn().mockRejectedValue(new Error('Stream error')),
      }),
    };

    mockSession.promptStreaming.mockReturnValue(mockStream);
    const session = await window.LanguageModel.create(testConfig);
    const stream = session.promptStreaming('Test');
    const reader = stream.getReader();

    await expect(reader.read()).rejects.toThrow('Stream error');
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('Prompt API - Edge Cases', () => {
  it('should handle empty prompts', async () => {
    mockSession.prompt.mockResolvedValue('Please provide a prompt.');
    const session = await window.LanguageModel.create(testConfig);

    const response = await session.prompt('');

    expect(response).toBeDefined();
    expect(mockSession.prompt).toHaveBeenCalledWith('');
  });

  it('should handle very long prompts', async () => {
    const longPrompt = 'A'.repeat(10000);
    mockSession.prompt.mockResolvedValue('Response to long prompt');

    const session = await window.LanguageModel.create(testConfig);
    const response = await session.prompt(longPrompt);

    expect(response).toBeDefined();
    expect(mockSession.prompt).toHaveBeenCalledWith(longPrompt);
  });

  it('should handle rapid consecutive calls', async () => {
    mockSession.prompt.mockResolvedValue('Response');
    const session = await window.LanguageModel.create(testConfig);

    const promises = Array(5).fill(null).map((_, i) =>
      session.prompt(\`Prompt \${i}\`)
    );

    const responses = await Promise.all(promises);

    expect(responses).toHaveLength(5);
    expect(mockSession.prompt).toHaveBeenCalledTimes(5);
  });

  it('should handle special characters in prompts', async () => {
    const specialPrompt = 'Test with émojis 🎉 and spëcial çharacters!';
    mockSession.prompt.mockResolvedValue('Handled special characters');

    const session = await window.LanguageModel.create(testConfig);
    const response = await session.prompt(specialPrompt);

    expect(response).toBeDefined();
    expect(mockSession.prompt).toHaveBeenCalledWith(specialPrompt);
  });

  it('should handle model download requirement', async () => {
    mockLanguageModel.availability.mockResolvedValue('after-download');

    const availability = await window.LanguageModel.availability();

    expect(availability).toBe('after-download');
    // In real scenario, model would download on first create() call
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Prompt API - Integration Patterns', () => {
  it('should support conversational pattern', async () => {
    mockSession.prompt
      .mockResolvedValueOnce('Hello! How can I help you?')
      .mockResolvedValueOnce('Sure, I can help with that.')
      .mockResolvedValueOnce('Is there anything else?');

    const session = await window.LanguageModel.create(testConfig);

    // First message
    const response1 = await session.prompt('Hello!');
    expect(response1).toContain('help');

    // Follow-up message (context maintained)
    const response2 = await session.prompt('Can you help me?');
    expect(response2).toContain('help');

    // Another follow-up
    const response3 = await session.prompt('Thanks!');
    expect(response3).toBeDefined();

    // Session should be reused
    expect(mockLanguageModel.create).toHaveBeenCalledTimes(1);

    // Cleanup
    session.destroy();
  });

  it('should support request-response pattern', async () => {
    mockSession.prompt.mockResolvedValue('42');

    const session = await window.LanguageModel.create(testConfig);
    const response = await session.prompt('What is the answer?');
    session.destroy();

    expect(response).toBe('42');
    expect(mockSession.destroy).toHaveBeenCalled();
  });

  it('should handle session reuse correctly', async () => {
    mockSession.prompt.mockResolvedValue('Response');

    const session = await window.LanguageModel.create(testConfig);

    await session.prompt('First');
    await session.prompt('Second');
    await session.prompt('Third');

    expect(mockLanguageModel.create).toHaveBeenCalledTimes(1);
    expect(mockSession.prompt).toHaveBeenCalledTimes(3);

    session.destroy();
  });
});

// ============================================================================
// Advanced Features Tests
// ============================================================================

describe('Prompt API - Clone', () => {
  it('should clone a session', async () => {
    const mockClone = vi.fn().mockReturnValue(mockSession);
    mockSession.clone = mockClone;

    const session = await window.LanguageModel.create(testConfig);
    const clonedSession = session.clone();

    expect(clonedSession).toBeDefined();
    expect(mockClone).toHaveBeenCalled();
  });

  it('should clone session with options', async () => {
    const mockClone = vi.fn().mockReturnValue(mockSession);
    mockSession.clone = mockClone;

    const session = await window.LanguageModel.create(testConfig);
    const cloneOptions = { signal: new AbortController().signal };
    const clonedSession = session.clone(cloneOptions);

    expect(clonedSession).toBeDefined();
    expect(mockClone).toHaveBeenCalledWith(cloneOptions);
  });

  it('should allow independent operations on cloned sessions', async () => {
    mockSession.prompt.mockResolvedValue('Response');
    const mockClonedSession = { ...mockSession };
    mockSession.clone = vi.fn().mockReturnValue(mockClonedSession);

    const session = await window.LanguageModel.create(testConfig);
    const clonedSession = session.clone();

    await Promise.all([
      session.prompt('Test 1'),
      clonedSession.prompt('Test 2')
    ]);

    expect(mockSession.prompt).toHaveBeenCalledTimes(1);
  });
});

describe('Prompt API - Append', () => {
  it('should append messages to conversation', async () => {
    const mockAppend = vi.fn().mockResolvedValue(undefined);
    mockSession.append = mockAppend;

    const session = await window.LanguageModel.create(testConfig);
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' }
    ];

    await session.append(messages);

    expect(mockAppend).toHaveBeenCalledWith(messages);
  });

  it('should maintain context after appending', async () => {
    const mockAppend = vi.fn().mockResolvedValue(undefined);
    mockSession.append = mockAppend;
    mockSession.prompt.mockResolvedValue('Response with context');

    const session = await window.LanguageModel.create(testConfig);

    await session.append([
      { role: 'user', content: 'What is AI?' },
      { role: 'assistant', content: 'AI is artificial intelligence.' }
    ]);

    const response = await session.prompt('Tell me more');

    expect(mockAppend).toHaveBeenCalled();
    expect(response).toContain('context');
  });
});

describe('Prompt API - AbortSignal', () => {
  it('should accept AbortSignal in prompt options', async () => {
    const controller = new AbortController();
    mockSession.prompt.mockResolvedValue('Response');

    const session = await window.LanguageModel.create(testConfig);
    await session.prompt('Test', { signal: controller.signal });

    expect(mockSession.prompt).toHaveBeenCalledWith('Test',
      expect.objectContaining({ signal: controller.signal })
    );
  });

  it('should abort prompt when signal is triggered', async () => {
    const controller = new AbortController();
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';

    mockSession.prompt.mockImplementation(() => {
      controller.abort();
      return Promise.reject(abortError);
    });

    const session = await window.LanguageModel.create(testConfig);

    await expect(
      session.prompt('Long prompt', { signal: controller.signal })
    ).rejects.toThrow('Aborted');
  });

  it('should handle AbortSignal in streaming', async () => {
    const controller = new AbortController();
    const mockStream = {
      getReader: () => ({
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: 'Chunk 1' })
          .mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))
      })
    };

    mockSession.promptStreaming.mockReturnValue(mockStream);

    const session = await window.LanguageModel.create(testConfig);
    const stream = session.promptStreaming('Test', { signal: controller.signal });
    const reader = stream.getReader();

    await reader.read(); // First chunk
    controller.abort();

    await expect(reader.read()).rejects.toThrow('Aborted');
  });
});

describe('Prompt API - Quota Tracking', () => {
  it('should expose inputQuota property', async () => {
    const session = await window.LanguageModel.create(testConfig);

    // Mock the readonly property
    Object.defineProperty(mockSession, 'inputQuota', {
      value: 4096,
      writable: false
    });

    expect(session.inputQuota).toBeDefined();
    expect(typeof session.inputQuota).toBe('number');
  });

  it('should expose inputUsage property', async () => {
    const session = await window.LanguageModel.create(testConfig);

    // Mock the readonly property
    Object.defineProperty(mockSession, 'inputUsage', {
      value: 0,
      writable: false
    });

    expect(session.inputUsage).toBeDefined();
    expect(typeof session.inputUsage).toBe('number');
  });

  it('should track usage after prompts', async () => {
    let usage = 0;
    Object.defineProperty(mockSession, 'inputUsage', {
      get: () => usage
    });
    Object.defineProperty(mockSession, 'inputQuota', {
      value: 4096
    });

    mockSession.prompt.mockImplementation(async () => {
      usage += 50; // Simulate token consumption
      return 'Response';
    });

    const session = await window.LanguageModel.create(testConfig);

    expect(session.inputUsage).toBe(0);
    await session.prompt('Test');
    expect(session.inputUsage).toBe(50);
    await session.prompt('Test 2');
    expect(session.inputUsage).toBe(100);
  });

  it('should warn when approaching quota limit', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    Object.defineProperty(mockSession, 'inputUsage', {
      value: 3500 // 85% of 4096
    });
    Object.defineProperty(mockSession, 'inputQuota', {
      value: 4096
    });

    const session = await window.LanguageModel.create(testConfig);

    if (session.inputUsage / session.inputQuota > 0.8) {
      console.warn('Approaching quota limit');
    }

    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Prompt API - Performance', () => {
  it('should handle timeouts gracefully', async () => {
    vi.useFakeTimers();

    mockSession.prompt.mockImplementation(() =>
      new Promise((resolve) => setTimeout(() => resolve('Late response'), 5000))
    );

    const session = await window.LanguageModel.create(testConfig);
    const promptPromise = session.prompt('Test');

    // Fast forward time
    vi.advanceTimersByTime(5000);

    const response = await promptPromise;
    expect(response).toBe('Late response');

    vi.useRealTimers();
  });

  it('should clean up resources on destroy', async () => {
    const session = await window.LanguageModel.create(testConfig);

    // Simulate some operations
    await session.prompt('Test 1');
    await session.prompt('Test 2');

    // Destroy should clean up
    session.destroy();

    expect(mockSession.destroy).toHaveBeenCalledTimes(1);
  });
});
`;
}

// ============================================================================
// Generic Test Generator
// ============================================================================

/**
 * Generate tests for any Chrome AI API
 */
export function generateAPITests(options: TestGeneratorOptions): string {
  const { apiName, config } = options;

  // For now, we have specific generator for Prompt API
  // Can be extended for other APIs
  if (apiName.toLowerCase().includes('prompt')) {
    return generatePromptAPITests(config as PromptConfig);
  }

  // Fallback generic template
  return generateGenericAPITests(options);
}

/**
 * Generate generic API tests template
 */
function generateGenericAPITests(options: TestGeneratorOptions): string {
  const { apiName, config } = options;
  const configStr = JSON.stringify(config, null, 2);

  return `/**
 * Chrome AI ${apiName} - Test Suite
 *
 * @vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('${apiName} API Tests', () => {
  const testConfig = ${configStr};

  it('should initialize correctly', () => {
    expect(testConfig).toBeDefined();
  });

  it('should handle basic operations', () => {
    // Add specific tests for ${apiName}
    expect(true).toBe(true);
  });
});
`;
}

/**
 * Generate concise Vitest tests for Proofreader API
 */
export function generateProofreaderAPITests(config: ProofreaderConfig): string {
  const configStr = JSON.stringify(
    {
      expectedInputLanguages: config.expectedInputLanguages || ['en'],
      includeCorrectionTypes: config.includeCorrectionTypes ?? true,
      includeCorrectionExplanations:
        config.includeCorrectionExplanations ?? true,
    },
    null,
    2,
  );

  return `/**
 * Chrome AI Proofreader API - Test Suite
 * Tests both type correctness and runtime behavior
 * @vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Test configuration
const testConfig = ${configStr};

// Top-level async function following DefinitelyTyped pattern
async function testProofreaderAPI() {
  // Mock setup
  const mockProofreader = {
    proofread: vi.fn(),
  };

  const mockProofreaderAPI = {
    create: vi.fn().mockResolvedValue(mockProofreader),
    availability: vi.fn().mockResolvedValue('readily' as ProofreaderAvailability),
  };

  beforeEach(() => {
    // @ts-ignore - Mocking browser API
    global.window.Proofreader = mockProofreaderAPI;
    vi.clearAllMocks();
  });

  describe('Proofreader API', () => {
    it('should check API availability with correct type', async () => {
      const availability: ProofreaderAvailability = await window.Proofreader.availability();
      expect(['no', 'readily', 'after-download']).toContain(availability);
    });

    it('should create proofreader with config', async () => {
      const proofreader: Proofreader = await window.Proofreader.create(testConfig);
      expect(proofreader).toBeDefined();
      expect(proofreader).toHaveProperty('proofread');
    });

    it('should proofread text and return typed corrections', async () => {
      const testText = 'This is a test with erors.';
      const mockCorrections: ProofreaderCorrection[] = [
        { start: 22, end: 27, suggestion: 'errors', type: 'spelling' }
      ];
      mockProofreader.proofread.mockResolvedValue(mockCorrections);

      const proofreader = await window.Proofreader.create(testConfig);
      const corrections: ProofreaderCorrection[] = await proofreader.proofread(testText);

      expect(corrections).toHaveLength(1);
      expect(corrections[0].suggestion).toBe('errors');
      expect(corrections[0].type).toBe('spelling');
    });

    it('should handle text with no errors', async () => {
      mockProofreader.proofread.mockResolvedValue([]);

      const proofreader = await window.Proofreader.create(testConfig);
      const corrections: ProofreaderCorrection[] = await proofreader.proofread('This is correct text.');

      expect(corrections).toHaveLength(0);
    });
  });
}

// Run tests
testProofreaderAPI();
`;
}

/**
 * Generate concise Vitest tests for Writer API
 */
export function generateWriterAPITests(config: WriterConfig): string {
  const configStr = JSON.stringify(
    {
      tone: config.tone || 'neutral',
      format: config.format || 'plain-text',
      length: config.length || 'medium',
      outputLanguage: config.outputLanguage || 'en',
      sharedContext: config.sharedContext,
    },
    null,
    2,
  );

  return `/**
 * Chrome AI Writer API - Test Suite
 * Tests both type correctness and runtime behavior
 * @vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Test configuration
const testConfig = ${configStr};

// Top-level async function following DefinitelyTyped pattern
async function testWriterAPI() {
  // Mock setup
  const mockWriter = {
    write: vi.fn(),
    writeStreaming: vi.fn(),
  };

  const mockWriterAPI = {
    create: vi.fn().mockResolvedValue(mockWriter),
    availability: vi.fn().mockResolvedValue('readily' as WriterAvailability),
  };

  beforeEach(() => {
    // @ts-ignore - Mocking browser API
    global.window.Writer = mockWriterAPI;
    vi.clearAllMocks();
  });

  describe('Writer API', () => {
    it('should check API availability with correct type', async () => {
      const availability: WriterAvailability = await window.Writer.availability();
      expect(['no', 'readily', 'after-download']).toContain(availability);
    });

    it('should create writer with typed config', async () => {
      const writer: Writer = await window.Writer.create(testConfig);
      expect(writer).toBeDefined();
      expect(writer).toHaveProperty('write');
      expect(writer).toHaveProperty('writeStreaming');
    });

    it('should write content and return typed response', async () => {
      const prompt = 'Write about AI technology';
      const mockResponse = 'AI technology is transforming the world...';
      mockWriter.write.mockResolvedValue(mockResponse);

      const writer = await window.Writer.create(testConfig);
      const result: string = await writer.write(prompt);

      expect(result).toBe(mockResponse);
      expect(mockWriter.write).toHaveBeenCalledWith(prompt);
    });

    it('should handle streaming responses with correct types', async () => {
      const chunks = ['AI ', 'technology ', 'is ', 'amazing.'];
      const mockStream = {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({ done: false, value: chunks[0] })
            .mockResolvedValueOnce({ done: false, value: chunks.slice(0, 2).join('') })
            .mockResolvedValueOnce({ done: false, value: chunks.slice(0, 3).join('') })
            .mockResolvedValueOnce({ done: false, value: chunks.join('') })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      };
      mockWriter.writeStreaming.mockReturnValue(mockStream);

      const writer = await window.Writer.create(testConfig);
      const stream: ReadableStream<string> = writer.writeStreaming('Write something');
      const reader = stream.getReader();

      const receivedChunks: string[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedChunks.push(value);
      }

      expect(receivedChunks).toHaveLength(4);
    });
  });
}

// Run tests
testWriterAPI();
`;
}

/**
 * Generate concise Vitest tests for Rewriter API
 */
export function generateRewriterAPITests(config: RewriterConfig): string {
  const configStr = JSON.stringify(
    {
      tone: config.tone || 'as-is',
      format: config.format || 'as-is',
      length: config.length || 'as-is',
      outputLanguage: config.outputLanguage || 'en',
    },
    null,
    2,
  );

  return `/**
 * Chrome AI Rewriter API - Test Suite
 * Tests both type correctness and runtime behavior
 * @vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Test configuration
const testConfig = ${configStr};

// Top-level async function following DefinitelyTyped pattern
async function testRewriterAPI() {
  // Mock setup
  const mockRewriter = {
    rewrite: vi.fn(),
    rewriteStreaming: vi.fn(),
  };

  const mockRewriterAPI = {
    create: vi.fn().mockResolvedValue(mockRewriter),
    availability: vi.fn().mockResolvedValue('readily' as RewriterAvailability),
  };

  beforeEach(() => {
    // @ts-ignore - Mocking browser API
    global.window.Rewriter = mockRewriterAPI;
    vi.clearAllMocks();
  });

  describe('Rewriter API', () => {
    it('should check API availability with correct type', async () => {
      const availability: RewriterAvailability = await window.Rewriter.availability();
      expect(['no', 'readily', 'after-download']).toContain(availability);
    });

    it('should create rewriter with typed config', async () => {
      const rewriter: Rewriter = await window.Rewriter.create(testConfig);
      expect(rewriter).toBeDefined();
      expect(rewriter).toHaveProperty('rewrite');
      expect(rewriter).toHaveProperty('rewriteStreaming');
    });

    it('should rewrite text and return typed response', async () => {
      const original = 'Hey, this is cool!';
      const rewritten = 'This is quite impressive.';
      mockRewriter.rewrite.mockResolvedValue(rewritten);

      const rewriter = await window.Rewriter.create(testConfig);
      const result: string = await rewriter.rewrite(original);

      expect(result).toBe(rewritten);
      expect(mockRewriter.rewrite).toHaveBeenCalledWith(original);
    });

    it('should handle streaming rewrites with correct types', async () => {
      const chunks = ['This ', 'is ', 'rewritten ', 'text.'];
      const mockStream = {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({ done: false, value: chunks[0] })
            .mockResolvedValueOnce({ done: false, value: chunks.slice(0, 2).join('') })
            .mockResolvedValueOnce({ done: false, value: chunks.slice(0, 3).join('') })
            .mockResolvedValueOnce({ done: false, value: chunks.join('') })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      };
      mockRewriter.rewriteStreaming.mockReturnValue(mockStream);

      const rewriter = await window.Rewriter.create(testConfig);
      const stream: ReadableStream<string> = rewriter.rewriteStreaming('Original text');
      const reader = stream.getReader();

      const receivedChunks: string[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedChunks.push(value);
      }

      expect(receivedChunks).toHaveLength(4);
    });
  });
}

// Run tests
testRewriterAPI();
`;
}

/**
 * Generate comprehensive Vitest tests for Language Detector API
 */
export function generateLanguageDetectorAPITests(_config?: any): string {
  return `/**
 * Chrome AI Language Detector API - Comprehensive Test Suite
 * Tests both type correctness and runtime behavior
 * Based on DefinitelyTyped patterns
 * @vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// Mock Setup
// ============================================================================

const mockLanguageDetector = {
  detect: vi.fn(),
  destroy: vi.fn(),
};

const mockLanguageDetectorAPI = {
  create: vi.fn().mockResolvedValue(mockLanguageDetector),
  availability: vi.fn().mockResolvedValue('available' as Availability),
};

beforeEach(() => {
  // @ts-ignore - Mocking browser API
  global.window.LanguageDetector = mockLanguageDetectorAPI;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// Availability Tests
// ============================================================================

describe('Language Detector API - Availability', () => {
  it('should check API availability without options', async () => {
    const availability: Availability = await window.LanguageDetector.availability();
    expect(['unavailable', 'downloadable', 'downloading', 'available']).toContain(availability);
  });

  it('should check availability with expected input languages', async () => {
    const availability: Availability = await window.LanguageDetector.availability({
      expectedInputLanguages: ['de'],
    });
    expect(availability).toBeDefined();
  });

  it('should return availability status', async () => {
    mockLanguageDetectorAPI.availability.mockResolvedValue('available');
    const availability = await window.LanguageDetector.availability();
    expect(availability).toBe('available');
  });
});

// ============================================================================
// Creation and Configuration Tests
// ============================================================================

describe('Language Detector API - Creation', () => {
  it('should create language detector', async () => {
    const detector = await window.LanguageDetector.create();
    expect(detector).toBeDefined();
    expect(detector).toHaveProperty('detect');
    expect(detector).toHaveProperty('destroy');
  });

  it('should support download progress monitoring', async () => {
    const monitorFn = vi.fn();
    await window.LanguageDetector.create({
      monitor: (m) => {
        m.addEventListener('downloadprogress', (e: any) => {
          monitorFn(e.loaded, e.total);
        });
      },
    });

    expect(mockLanguageDetectorAPI.create).toHaveBeenCalled();
  });

  it('should support abort signal', async () => {
    const controller = new AbortController();
    await window.LanguageDetector.create({
      signal: controller.signal,
    });

    expect(mockLanguageDetectorAPI.create).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal })
    );
  });
});

// ============================================================================
// Detection Tests
// ============================================================================

describe('Language Detector API - Detect', () => {
  it('should detect language and return typed result', async () => {
    const mockResult = [{
      detectedLanguage: 'en',
      confidence: 'high' as const,
    }];
    mockLanguageDetector.detect.mockResolvedValue(mockResult);

    const detector = await window.LanguageDetector.create();
    const [result] = await detector.detect('Hello world');

    expect(result.detectedLanguage).toBe('en');
    expect(result.confidence).toBe('high');
  });

  it('should return multiple detection results', async () => {
    const mockResults = [
      { detectedLanguage: 'en', confidence: 'high' as const },
      { detectedLanguage: 'es', confidence: 'medium' as const },
    ];
    mockLanguageDetector.detect.mockResolvedValue(mockResults);

    const detector = await window.LanguageDetector.create();
    const results = await detector.detect('Hello hola');

    expect(results).toHaveLength(2);
    expect(results[0].detectedLanguage).toBe('en');
    expect(results[1].detectedLanguage).toBe('es');
  });

  it('should handle different confidence levels', async () => {
    const testCases = [
      { text: 'Hello world', confidence: 'high' as const },
      { text: 'Bonjour', confidence: 'medium' as const },
      { text: 'xyz', confidence: 'low' as const },
      { text: '', confidence: 'not-applicable' as const },
    ];

    const detector = await window.LanguageDetector.create();

    for (const testCase of testCases) {
      mockLanguageDetector.detect.mockResolvedValue([{
        detectedLanguage: 'en',
        confidence: testCase.confidence,
      }]);

      const [result] = await detector.detect(testCase.text);
      expect(['high', 'medium', 'low', 'not-applicable']).toContain(result.confidence);
    }
  });

  it('should support abort signal in detect', async () => {
    const controller = new AbortController();
    mockLanguageDetector.detect.mockResolvedValue([{
      detectedLanguage: 'en',
      confidence: 'high',
    }]);

    const detector = await window.LanguageDetector.create();
    await detector.detect('Text', { signal: controller.signal });

    expect(mockLanguageDetector.detect).toHaveBeenCalledWith(
      'Text',
      expect.objectContaining({ signal: controller.signal })
    );
  });

  it('should return null for undetectable language', async () => {
    mockLanguageDetector.detect.mockResolvedValue([{
      detectedLanguage: null,
      confidence: 'not-applicable',
    }]);

    const detector = await window.LanguageDetector.create();
    const [result] = await detector.detect('123 !@#');

    expect(result.detectedLanguage).toBeNull();
    expect(result.confidence).toBe('not-applicable');
  });
});

// ============================================================================
// Cleanup Tests
// ============================================================================

describe('Language Detector API - Cleanup', () => {
  it('should destroy detector properly', async () => {
    const detector = await window.LanguageDetector.create();
    detector.destroy();

    expect(mockLanguageDetector.destroy).toHaveBeenCalled();
  });

  it('should clean up after multiple detections', async () => {
    mockLanguageDetector.detect.mockResolvedValue([{
      detectedLanguage: 'en',
      confidence: 'high',
    }]);

    const detector = await window.LanguageDetector.create();

    await detector.detect('Text 1');
    await detector.detect('Text 2');
    await detector.detect('Text 3');
    detector.destroy();

    expect(mockLanguageDetector.detect).toHaveBeenCalledTimes(3);
    expect(mockLanguageDetector.destroy).toHaveBeenCalled();
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Language Detector API - Error Handling', () => {
  it('should handle unavailable API', async () => {
    mockLanguageDetectorAPI.availability.mockResolvedValue('unavailable');

    const availability = await window.LanguageDetector.availability();
    expect(availability).toBe('unavailable');
  });

  it('should handle detection errors', async () => {
    mockLanguageDetector.detect.mockRejectedValue(new Error('Detection failed'));

    const detector = await window.LanguageDetector.create();

    await expect(detector.detect('Text')).rejects.toThrow('Detection failed');
  });

  it('should handle creation failures', async () => {
    mockLanguageDetectorAPI.create.mockRejectedValueOnce(new Error('Failed to create'));

    await expect(window.LanguageDetector.create()).rejects.toThrow('Failed to create');
  });

  it('should handle abort scenarios', async () => {
    const controller = new AbortController();
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';

    mockLanguageDetector.detect.mockImplementation(() => {
      controller.abort();
      return Promise.reject(abortError);
    });

    const detector = await window.LanguageDetector.create();

    await expect(
      detector.detect('Text', { signal: controller.signal })
    ).rejects.toThrow('Aborted');
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('Language Detector API - Edge Cases', () => {
  it('should handle empty text', async () => {
    mockLanguageDetector.detect.mockResolvedValue([{
      detectedLanguage: null,
      confidence: 'not-applicable',
    }]);

    const detector = await window.LanguageDetector.create();
    const [result] = await detector.detect('');

    expect(result.detectedLanguage).toBeNull();
  });

  it('should handle very long text', async () => {
    const longText = 'Hello world. '.repeat(10000);
    mockLanguageDetector.detect.mockResolvedValue([{
      detectedLanguage: 'en',
      confidence: 'high',
    }]);

    const detector = await window.LanguageDetector.create();
    const [result] = await detector.detect(longText);

    expect(result.detectedLanguage).toBe('en');
  });

  it('should handle mixed language text', async () => {
    mockLanguageDetector.detect.mockResolvedValue([
      { detectedLanguage: 'en', confidence: 'medium' },
      { detectedLanguage: 'es', confidence: 'medium' },
    ]);

    const detector = await window.LanguageDetector.create();
    const results = await detector.detect('Hello world. Hola mundo.');

    expect(results.length).toBeGreaterThan(0);
  });

  it('should handle numbers and symbols', async () => {
    mockLanguageDetector.detect.mockResolvedValue([{
      detectedLanguage: null,
      confidence: 'not-applicable',
    }]);

    const detector = await window.LanguageDetector.create();
    const [result] = await detector.detect('123 !@# $%^');

    expect(result.confidence).toBe('not-applicable');
  });

  it('should handle special characters and emojis', async () => {
    mockLanguageDetector.detect.mockResolvedValue([{
      detectedLanguage: 'en',
      confidence: 'medium',
    }]);

    const detector = await window.LanguageDetector.create();
    const [result] = await detector.detect('Hello 🌍 world 🎉');

    expect(result.detectedLanguage).toBeDefined();
  });

  it('should handle download requirement', async () => {
    mockLanguageDetectorAPI.availability.mockResolvedValue('after-download');

    const availability = await window.LanguageDetector.availability();
    expect(availability).toBe('after-download');
  });
});
`;
}

/**
 * Generate comprehensive Vitest tests for Translator API
 */
export function generateTranslatorAPITests(config: any): string {
  const configStr = JSON.stringify(
    {
      sourceLanguage: config.sourceLanguage || 'en',
      targetLanguage: config.targetLanguage || 'es',
    },
    null,
    2,
  );

  return `/**
 * Chrome AI Translator API - Comprehensive Test Suite
 * Tests both type correctness and runtime behavior
 * Based on DefinitelyTyped patterns
 * @vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// Mock Setup
// ============================================================================

const mockTranslator = {
  translate: vi.fn(),
  translateStreaming: vi.fn(),
  measureInputUsage: vi.fn(),
  destroy: vi.fn(),
  sourceLanguage: 'en',
  targetLanguage: 'es',
  inputQuota: 4096,
};

const mockTranslatorAPI = {
  create: vi.fn().mockResolvedValue(mockTranslator),
  availability: vi.fn().mockResolvedValue('available' as Availability),
};

beforeEach(() => {
  // @ts-ignore - Mocking browser API
  global.window.Translator = mockTranslatorAPI;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// Test Configuration
// ============================================================================

const testConfig = ${configStr};

// ============================================================================
// Availability Tests
// ============================================================================

describe('Translator API - Availability', () => {
  it('should check API availability with language pair', async () => {
    const availability: Availability = await window.Translator.availability({
      sourceLanguage: 'en',
      targetLanguage: 'es',
    });
    expect(['unavailable', 'downloadable', 'downloading', 'available']).toContain(availability);
  });

  it('should check different language pairs', async () => {
    const availability = await window.Translator.availability({
      sourceLanguage: 'de',
      targetLanguage: 'en',
    });
    expect(availability).toBeDefined();
  });

  it('should return availability status', async () => {
    mockTranslatorAPI.availability.mockResolvedValue('available');
    const availability = await window.Translator.availability({
      sourceLanguage: 'en',
      targetLanguage: 'fr',
    });
    expect(availability).toBe('available');
  });
});

// ============================================================================
// Creation and Configuration Tests
// ============================================================================

describe('Translator API - Creation', () => {
  it('should create translator with typed config', async () => {
    const translator = await window.Translator.create(testConfig);
    expect(translator).toBeDefined();
    expect(translator).toHaveProperty('translate');
    expect(translator).toHaveProperty('translateStreaming');
    expect(translator).toHaveProperty('destroy');
  });

  it('should create with required language pair', async () => {
    await window.Translator.create({
      sourceLanguage: 'en',
      targetLanguage: 'ja',
    });
    expect(mockTranslatorAPI.create).toHaveBeenCalledWith({
      sourceLanguage: 'en',
      targetLanguage: 'ja',
    });
  });

  it('should support download progress monitoring', async () => {
    const monitorFn = vi.fn();
    await window.Translator.create({
      ...testConfig,
      monitor: (m) => {
        m.addEventListener('downloadprogress', (e: any) => {
          monitorFn(e.loaded, e.total);
        });
      },
    });

    expect(mockTranslatorAPI.create).toHaveBeenCalled();
  });

  it('should support abort signal', async () => {
    const controller = new AbortController();
    await window.Translator.create({
      ...testConfig,
      signal: controller.signal,
    });

    expect(mockTranslatorAPI.create).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal })
    );
  });
});

// ============================================================================
// Translation Tests
// ============================================================================

describe('Translator API - Translate', () => {
  it('should translate text and return typed response', async () => {
    const inputText = 'Hello, how are you?';
    const expectedTranslation = 'Hola, ¿cómo estás?';
    mockTranslator.translate.mockResolvedValue(expectedTranslation);

    const translator = await window.Translator.create(testConfig);
    const result: string = await translator.translate(inputText);

    expect(result).toBe(expectedTranslation);
    expect(mockTranslator.translate).toHaveBeenCalledWith(inputText);
  });

  it('should support abort signal in translate', async () => {
    const controller = new AbortController();
    mockTranslator.translate.mockResolvedValue('Translated text');

    const translator = await window.Translator.create(testConfig);
    await translator.translate('Text', { signal: controller.signal });

    expect(mockTranslator.translate).toHaveBeenCalledWith(
      'Text',
      expect.objectContaining({ signal: controller.signal })
    );
  });

  it('should translate multiple texts', async () => {
    mockTranslator.translate
      .mockResolvedValueOnce('Traducción 1')
      .mockResolvedValueOnce('Traducción 2')
      .mockResolvedValueOnce('Traducción 3');

    const translator = await window.Translator.create(testConfig);

    const result1 = await translator.translate('Text 1');
    const result2 = await translator.translate('Text 2');
    const result3 = await translator.translate('Text 3');

    expect(mockTranslator.translate).toHaveBeenCalledTimes(3);
    expect(result1).toBe('Traducción 1');
    expect(result2).toBe('Traducción 2');
    expect(result3).toBe('Traducción 3');
  });
});

// ============================================================================
// Streaming Tests
// ============================================================================

describe('Translator API - Streaming', () => {
  it('should handle streaming with async iteration', async () => {
    const chunks = ['Hola', ', ', '¿cómo ', 'estás?'];

    async function* mockAsyncIterator() {
      for (const chunk of chunks) {
        yield chunk;
      }
    }

    mockTranslator.translateStreaming.mockReturnValue(mockAsyncIterator());

    const translator = await window.Translator.create(testConfig);
    const receivedChunks: string[] = [];

    for await (const chunk of translator.translateStreaming('Hello, how are you?')) {
      receivedChunks.push(chunk);
    }

    expect(receivedChunks).toEqual(chunks);
  });

  it('should support abort signal in streaming', async () => {
    const controller = new AbortController();

    async function* mockAsyncIterator() {
      yield 'Chunk';
    }

    mockTranslator.translateStreaming.mockReturnValue(mockAsyncIterator());

    const translator = await window.Translator.create(testConfig);

    for await (const chunk of translator.translateStreaming('Text', { signal: controller.signal })) {
      expect(chunk).toBeDefined();
    }

    expect(mockTranslator.translateStreaming).toHaveBeenCalled();
  });

  it('should handle progressive translation', async () => {
    const chunks = ['This ', 'is ', 'a ', 'test.'];

    async function* mockAsyncIterator() {
      for (const chunk of chunks) {
        yield chunk;
      }
    }

    mockTranslator.translateStreaming.mockReturnValue(mockAsyncIterator());

    const translator = await window.Translator.create(testConfig);
    let fullTranslation = '';

    for await (const chunk of translator.translateStreaming('This is a test.')) {
      fullTranslation += chunk;
    }

    expect(fullTranslation).toBe('This is a test.');
  });
});

// ============================================================================
// Quota and Usage Tests
// ============================================================================

describe('Translator API - Quota Tracking', () => {
  it('should expose inputQuota property', async () => {
    const translator = await window.Translator.create(testConfig);
    expect(translator.inputQuota).toBeDefined();
    expect(typeof translator.inputQuota).toBe('number');
  });

  it('should measure input usage', async () => {
    mockTranslator.measureInputUsage.mockResolvedValue(120);

    const translator = await window.Translator.create(testConfig);
    const usage: number = await translator.measureInputUsage('Hello world');

    expect(usage).toBe(120);
    expect(mockTranslator.measureInputUsage).toHaveBeenCalledWith('Hello world');
  });

  it('should support signal in measureInputUsage', async () => {
    const controller = new AbortController();
    mockTranslator.measureInputUsage.mockResolvedValue(100);

    const translator = await window.Translator.create(testConfig);
    await translator.measureInputUsage('Text', { signal: controller.signal });

    expect(mockTranslator.measureInputUsage).toHaveBeenCalledWith(
      'Text',
      expect.objectContaining({ signal: controller.signal })
    );
  });

  it('should measure usage for different text lengths', async () => {
    mockTranslator.measureInputUsage
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(150)
      .mockResolvedValueOnce(500);

    const translator = await window.Translator.create(testConfig);

    const usage1 = await translator.measureInputUsage('Short');
    const usage2 = await translator.measureInputUsage('Medium length text here');
    const usage3 = await translator.measureInputUsage('A'.repeat(1000));

    expect(usage1).toBe(50);
    expect(usage2).toBe(150);
    expect(usage3).toBe(500);
  });
});

// ============================================================================
// Readonly Properties Tests
// ============================================================================

describe('Translator API - Readonly Properties', () => {
  it('should expose readonly language properties', async () => {
    mockTranslator.sourceLanguage = 'en';
    mockTranslator.targetLanguage = 'es';

    const translator = await window.Translator.create(testConfig);

    expect(translator.sourceLanguage).toBe('en');
    expect(translator.targetLanguage).toBe('es');
  });

  it('should preserve language pair from config', async () => {
    const customConfig = {
      sourceLanguage: 'de',
      targetLanguage: 'fr',
    };
    mockTranslator.sourceLanguage = 'de';
    mockTranslator.targetLanguage = 'fr';

    const translator = await window.Translator.create(customConfig);

    expect(translator.sourceLanguage).toBe('de');
    expect(translator.targetLanguage).toBe('fr');
  });
});

// ============================================================================
// Cleanup Tests
// ============================================================================

describe('Translator API - Cleanup', () => {
  it('should destroy translator properly', async () => {
    const translator = await window.Translator.create(testConfig);
    translator.destroy();

    expect(mockTranslator.destroy).toHaveBeenCalled();
  });

  it('should clean up after multiple translations', async () => {
    mockTranslator.translate.mockResolvedValue('Translated');

    const translator = await window.Translator.create(testConfig);

    await translator.translate('Text 1');
    await translator.translate('Text 2');
    await translator.translate('Text 3');
    translator.destroy();

    expect(mockTranslator.translate).toHaveBeenCalledTimes(3);
    expect(mockTranslator.destroy).toHaveBeenCalled();
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Translator API - Error Handling', () => {
  it('should handle unavailable API', async () => {
    mockTranslatorAPI.availability.mockResolvedValue('unavailable');

    const availability = await window.Translator.availability({
      sourceLanguage: 'en',
      targetLanguage: 'es',
    });
    expect(availability).toBe('unavailable');
  });

  it('should handle unsupported language pair', async () => {
    mockTranslatorAPI.availability.mockResolvedValue('unavailable');

    const availability = await window.Translator.availability({
      sourceLanguage: 'xx',
      targetLanguage: 'yy',
    });
    expect(availability).toBe('unavailable');
  });

  it('should handle translation errors', async () => {
    mockTranslator.translate.mockRejectedValue(new Error('Translation failed'));

    const translator = await window.Translator.create(testConfig);

    await expect(translator.translate('Text')).rejects.toThrow('Translation failed');
  });

  it('should handle creation failures', async () => {
    mockTranslatorAPI.create.mockRejectedValueOnce(new Error('Failed to create'));

    await expect(window.Translator.create(testConfig)).rejects.toThrow('Failed to create');
  });

  it('should handle abort scenarios', async () => {
    const controller = new AbortController();
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';

    mockTranslator.translate.mockImplementation(() => {
      controller.abort();
      return Promise.reject(abortError);
    });

    const translator = await window.Translator.create(testConfig);

    await expect(
      translator.translate('Text', { signal: controller.signal })
    ).rejects.toThrow('Aborted');
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('Translator API - Edge Cases', () => {
  it('should handle empty text', async () => {
    mockTranslator.translate.mockResolvedValue('');

    const translator = await window.Translator.create(testConfig);
    const result = await translator.translate('');

    expect(mockTranslator.translate).toHaveBeenCalledWith('');
  });

  it('should handle very long text', async () => {
    const longText = 'A'.repeat(50000);
    mockTranslator.translate.mockResolvedValue('B'.repeat(50000));

    const translator = await window.Translator.create(testConfig);
    const result = await translator.translate(longText);

    expect(result).toBeDefined();
    expect(mockTranslator.translate).toHaveBeenCalledWith(longText);
  });

  it('should handle special characters and emojis', async () => {
    const specialText = 'Hello 🌍 with spëcial çharacters!';
    mockTranslator.translate.mockResolvedValue('¡Hola 🌍 con caracteres especiales!');

    const translator = await window.Translator.create(testConfig);
    const result = await translator.translate(specialText);

    expect(result).toBeDefined();
    expect(mockTranslator.translate).toHaveBeenCalledWith(specialText);
  });

  it('should handle download requirement', async () => {
    mockTranslatorAPI.availability.mockResolvedValue('after-download');

    const availability = await window.Translator.availability({
      sourceLanguage: 'en',
      targetLanguage: 'ja',
    });
    expect(availability).toBe('after-download');
  });

  it('should handle same source and target language', async () => {
    mockTranslator.translate.mockResolvedValue('Same text');

    const translator = await window.Translator.create({
      sourceLanguage: 'en',
      targetLanguage: 'en',
    });
    const result = await translator.translate('Same text');

    expect(result).toBe('Same text');
  });
});
`;
}

/**
 * Generate comprehensive Vitest tests for Summarizer API
 */
export function generateSummarizerAPITests(config: any): string {
  const configStr = JSON.stringify(
    {
      type: config.type || 'tldr',
      format: config.format || 'plain-text',
      length: config.length || 'medium',
      sharedContext: config.sharedContext,
      outputLanguage: config.outputLanguage || 'en',
    },
    null,
    2,
  );

  return `/**
 * Chrome AI Summarizer API - Comprehensive Test Suite
 * Tests both type correctness and runtime behavior
 * Based on DefinitelyTyped patterns
 * @vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// Mock Setup
// ============================================================================

const mockSummarizer = {
  summarize: vi.fn(),
  summarizeStreaming: vi.fn(),
  measureInputUsage: vi.fn(),
  destroy: vi.fn(),
  sharedContext: undefined,
  type: 'tldr',
  format: 'plain-text',
  length: 'medium',
  inputQuota: 4096,
};

const mockSummarizerAPI = {
  create: vi.fn().mockResolvedValue(mockSummarizer),
  availability: vi.fn().mockResolvedValue('available' as Availability),
};

beforeEach(() => {
  // @ts-ignore - Mocking browser API
  global.window.Summarizer = mockSummarizerAPI;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// Test Configuration
// ============================================================================

const testConfig = ${configStr};

// ============================================================================
// Availability Tests
// ============================================================================

describe('Summarizer API - Availability', () => {
  it('should check API availability without options', async () => {
    const availability: Availability = await window.Summarizer.availability();
    expect(['unavailable', 'downloadable', 'downloading', 'available']).toContain(availability);
  });

  it('should check availability with specific configuration', async () => {
    const availability: Availability = await window.Summarizer.availability({
      type: 'teaser',
      format: 'plain-text',
      length: 'long',
      expectedInputLanguages: ['en'],
      expectedContextLanguages: ['en'],
      outputLanguage: 'en',
    });
    expect(availability).toBeDefined();
  });

  it('should return availability status', async () => {
    mockSummarizerAPI.availability.mockResolvedValue('available');
    const availability = await window.Summarizer.availability();
    expect(availability).toBe('available');
  });
});

// ============================================================================
// Creation and Configuration Tests
// ============================================================================

describe('Summarizer API - Creation', () => {
  it('should create summarizer with typed config', async () => {
    const summarizer = await window.Summarizer.create(testConfig);
    expect(summarizer).toBeDefined();
    expect(summarizer).toHaveProperty('summarize');
    expect(summarizer).toHaveProperty('summarizeStreaming');
    expect(summarizer).toHaveProperty('destroy');
  });

  it('should create with all configuration options', async () => {
    const fullConfig = {
      type: 'key-points' as const,
      format: 'markdown' as const,
      length: 'long' as const,
      sharedContext: 'Technical documentation context',
      expectedInputLanguages: ['en'],
      expectedContextLanguages: ['en'],
      outputLanguage: 'en',
    };

    await window.Summarizer.create(fullConfig);
    expect(mockSummarizerAPI.create).toHaveBeenCalledWith(fullConfig);
  });

  it('should support download progress monitoring', async () => {
    const monitorFn = vi.fn();
    await window.Summarizer.create({
      ...testConfig,
      monitor: (m) => {
        m.addEventListener('downloadprogress', (e: any) => {
          monitorFn(e.loaded, e.total);
        });
      },
    });

    expect(mockSummarizerAPI.create).toHaveBeenCalled();
  });

  it('should support abort signal', async () => {
    const controller = new AbortController();
    await window.Summarizer.create({
      ...testConfig,
      signal: controller.signal,
    });

    expect(mockSummarizerAPI.create).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal })
    );
  });
});

// ============================================================================
// Summarization Tests
// ============================================================================

describe('Summarizer API - Summarize', () => {
  it('should summarize text and return typed response', async () => {
    const inputText = 'This is a long article about artificial intelligence and machine learning...';
    const expectedSummary = 'AI and ML summary';
    mockSummarizer.summarize.mockResolvedValue(expectedSummary);

    const summarizer = await window.Summarizer.create(testConfig);
    const result: string = await summarizer.summarize(inputText);

    expect(result).toBe(expectedSummary);
    expect(mockSummarizer.summarize).toHaveBeenCalledWith(inputText);
  });

  it('should summarize with context', async () => {
    const inputText = 'Technical content...';
    const context = 'Software development context';
    mockSummarizer.summarize.mockResolvedValue('Technical summary');

    const summarizer = await window.Summarizer.create(testConfig);
    await summarizer.summarize(inputText, { context });

    expect(mockSummarizer.summarize).toHaveBeenCalledWith(
      inputText,
      expect.objectContaining({ context })
    );
  });

  it('should support abort signal in summarize', async () => {
    const controller = new AbortController();
    mockSummarizer.summarize.mockResolvedValue('Summary');

    const summarizer = await window.Summarizer.create(testConfig);
    await summarizer.summarize('Text', { signal: controller.signal });

    expect(mockSummarizer.summarize).toHaveBeenCalledWith(
      'Text',
      expect.objectContaining({ signal: controller.signal })
    );
  });
});

// ============================================================================
// Streaming Tests
// ============================================================================

describe('Summarizer API - Streaming', () => {
  it('should handle streaming with async iteration', async () => {
    const chunks = ['AI ', 'and ', 'ML ', 'summary.'];

    async function* mockAsyncIterator() {
      for (const chunk of chunks) {
        yield chunk;
      }
    }

    mockSummarizer.summarizeStreaming.mockReturnValue(mockAsyncIterator());

    const summarizer = await window.Summarizer.create(testConfig);
    const receivedChunks: string[] = [];

    for await (const chunk of summarizer.summarizeStreaming('Long article...')) {
      receivedChunks.push(chunk);
    }

    expect(receivedChunks).toEqual(chunks);
  });

  it('should handle streaming with context', async () => {
    async function* mockAsyncIterator() {
      yield 'Chunk';
    }

    mockSummarizer.summarizeStreaming.mockReturnValue(mockAsyncIterator());

    const summarizer = await window.Summarizer.create(testConfig);
    const context = 'Context information';

    for await (const chunk of summarizer.summarizeStreaming('Text', { context })) {
      expect(chunk).toBeDefined();
    }

    expect(mockSummarizer.summarizeStreaming).toHaveBeenCalledWith(
      'Text',
      expect.objectContaining({ context })
    );
  });

  it('should support abort signal in streaming', async () => {
    const controller = new AbortController();

    async function* mockAsyncIterator() {
      yield 'Chunk';
    }

    mockSummarizer.summarizeStreaming.mockReturnValue(mockAsyncIterator());

    const summarizer = await window.Summarizer.create(testConfig);

    for await (const chunk of summarizer.summarizeStreaming('Text', { signal: controller.signal })) {
      expect(chunk).toBeDefined();
    }

    expect(mockSummarizer.summarizeStreaming).toHaveBeenCalled();
  });
});

// ============================================================================
// Quota and Usage Tests
// ============================================================================

describe('Summarizer API - Quota Tracking', () => {
  it('should expose inputQuota property', async () => {
    const summarizer = await window.Summarizer.create(testConfig);
    expect(summarizer.inputQuota).toBeDefined();
    expect(typeof summarizer.inputQuota).toBe('number');
  });

  it('should measure input usage', async () => {
    mockSummarizer.measureInputUsage.mockResolvedValue(150);

    const summarizer = await window.Summarizer.create(testConfig);
    const usage: number = await summarizer.measureInputUsage('Test text');

    expect(usage).toBe(150);
    expect(mockSummarizer.measureInputUsage).toHaveBeenCalledWith('Test text');
  });

  it('should measure input usage with context', async () => {
    mockSummarizer.measureInputUsage.mockResolvedValue(200);

    const summarizer = await window.Summarizer.create(testConfig);
    const usage = await summarizer.measureInputUsage('Text', {
      context: 'Additional context',
    });

    expect(usage).toBe(200);
    expect(mockSummarizer.measureInputUsage).toHaveBeenCalledWith(
      'Text',
      expect.objectContaining({ context: 'Additional context' })
    );
  });

  it('should support signal in measureInputUsage', async () => {
    const controller = new AbortController();
    mockSummarizer.measureInputUsage.mockResolvedValue(100);

    const summarizer = await window.Summarizer.create(testConfig);
    await summarizer.measureInputUsage('Text', { signal: controller.signal });

    expect(mockSummarizer.measureInputUsage).toHaveBeenCalledWith(
      'Text',
      expect.objectContaining({ signal: controller.signal })
    );
  });
});

// ============================================================================
// Readonly Properties Tests
// ============================================================================

describe('Summarizer API - Readonly Properties', () => {
  it('should expose readonly configuration properties', async () => {
    Object.assign(mockSummarizer, {
      type: 'tldr',
      format: 'plain-text',
      length: 'medium',
      sharedContext: testConfig.sharedContext,
      outputLanguage: 'en',
    });

    const summarizer = await window.Summarizer.create(testConfig);

    expect(summarizer.type).toBeDefined();
    expect(summarizer.format).toBeDefined();
    expect(summarizer.length).toBeDefined();
  });

  it('should expose sharedContext if provided', async () => {
    const contextConfig = { ...testConfig, sharedContext: 'Test context' };
    mockSummarizer.sharedContext = 'Test context';

    const summarizer = await window.Summarizer.create(contextConfig);

    expect(summarizer.sharedContext).toBe('Test context');
  });

  it('should expose language properties', async () => {
    Object.assign(mockSummarizer, {
      expectedInputLanguages: ['en'],
      expectedContextLanguages: ['en'],
      outputLanguage: 'en',
    });

    const summarizer = await window.Summarizer.create(testConfig);

    expect(summarizer.expectedInputLanguages).toBeDefined();
    expect(summarizer.outputLanguage).toBeDefined();
  });
});

// ============================================================================
// Cleanup Tests
// ============================================================================

describe('Summarizer API - Cleanup', () => {
  it('should destroy summarizer properly', async () => {
    const summarizer = await window.Summarizer.create(testConfig);
    summarizer.destroy();

    expect(mockSummarizer.destroy).toHaveBeenCalled();
  });

  it('should clean up after multiple operations', async () => {
    mockSummarizer.summarize.mockResolvedValue('Summary');

    const summarizer = await window.Summarizer.create(testConfig);

    await summarizer.summarize('Text 1');
    await summarizer.summarize('Text 2');
    summarizer.destroy();

    expect(mockSummarizer.summarize).toHaveBeenCalledTimes(2);
    expect(mockSummarizer.destroy).toHaveBeenCalled();
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Summarizer API - Error Handling', () => {
  it('should handle unavailable API', async () => {
    mockSummarizerAPI.availability.mockResolvedValue('unavailable');

    const availability = await window.Summarizer.availability();
    expect(availability).toBe('unavailable');
  });

  it('should handle summarization errors', async () => {
    mockSummarizer.summarize.mockRejectedValue(new Error('Summarization failed'));

    const summarizer = await window.Summarizer.create(testConfig);

    await expect(summarizer.summarize('Text')).rejects.toThrow('Summarization failed');
  });

  it('should handle creation failures', async () => {
    mockSummarizerAPI.create.mockRejectedValueOnce(new Error('Failed to create'));

    await expect(window.Summarizer.create(testConfig)).rejects.toThrow('Failed to create');
  });

  it('should handle abort scenarios', async () => {
    const controller = new AbortController();
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';

    mockSummarizer.summarize.mockImplementation(() => {
      controller.abort();
      return Promise.reject(abortError);
    });

    const summarizer = await window.Summarizer.create(testConfig);

    await expect(
      summarizer.summarize('Text', { signal: controller.signal })
    ).rejects.toThrow('Aborted');
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('Summarizer API - Edge Cases', () => {
  it('should handle empty text', async () => {
    mockSummarizer.summarize.mockResolvedValue('');

    const summarizer = await window.Summarizer.create(testConfig);
    const result = await summarizer.summarize('');

    expect(mockSummarizer.summarize).toHaveBeenCalledWith('');
  });

  it('should handle very long text', async () => {
    const longText = 'A'.repeat(50000);
    mockSummarizer.summarize.mockResolvedValue('Summary of long text');

    const summarizer = await window.Summarizer.create(testConfig);
    const result = await summarizer.summarize(longText);

    expect(result).toBeDefined();
    expect(mockSummarizer.summarize).toHaveBeenCalledWith(longText);
  });

  it('should handle special characters', async () => {
    const specialText = 'Text with émojis 🎉 and spëcial çharacters!';
    mockSummarizer.summarize.mockResolvedValue('Summary');

    const summarizer = await window.Summarizer.create(testConfig);
    await summarizer.summarize(specialText);

    expect(mockSummarizer.summarize).toHaveBeenCalledWith(specialText);
  });

  it('should handle download requirement', async () => {
    mockSummarizerAPI.availability.mockResolvedValue('after-download');

    const availability = await window.Summarizer.availability();
    expect(availability).toBe('after-download');
  });
});
`;
}

// ============================================================================
// Export
// ============================================================================

export default {
  generatePromptAPITests,
  generateSummarizerAPITests,
  generateTranslatorAPITests,
  generateLanguageDetectorAPITests,
  generateProofreaderAPITests,
  generateWriterAPITests,
  generateRewriterAPITests,
  generateAPITests,
};
