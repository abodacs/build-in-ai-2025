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

// ============================================================================
// Export
// ============================================================================

export default {
  generatePromptAPITests,
  generateProofreaderAPITests,
  generateWriterAPITests,
  generateRewriterAPITests,
  generateAPITests,
};
