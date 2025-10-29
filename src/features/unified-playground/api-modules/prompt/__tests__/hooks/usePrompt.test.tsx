/**
 * usePrompt Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePrompt } from '../../hooks/usePrompt';
import {
  setupLanguageModelAPIMock,
  cleanupLanguageModelAPIMock,
  createMockLanguageModel,
} from '../test-utils';

describe('usePrompt', () => {
  let mockAPI: ReturnType<typeof setupLanguageModelAPIMock>;

  beforeEach(() => {
    mockAPI = setupLanguageModelAPIMock();
  });

  afterEach(() => {
    cleanupLanguageModelAPIMock();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => usePrompt());
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('initializes instance on mount', async () => {
    mockAPI.create.mockResolvedValue({
      prompt: vi.fn(),
      promptStreaming: vi.fn(),
      destroy: vi.fn(),
      maxTokens: 4096,
      tokensSoFar: 0,
      tokensLeft: 4096,
      topK: 3,
      temperature: 0.7,
    });

    const { result } = renderHook(() => usePrompt());

    expect(result.current.isInitialized).toBe(false);

    await act(async () => {
      await result.current.initialize();
    });

    expect(result.current.isInitialized).toBe(true);
  });

  it('executes basic prompt', async () => {
    const mockInstance = {
      prompt: vi.fn().mockResolvedValue('AI response'),
      promptStreaming: vi.fn(),
      destroy: vi.fn(),
      maxTokens: 4096,
      tokensSoFar: 0,
      tokensLeft: 4096,
      topK: 3,
      temperature: 0.7,
    };
    mockAPI.create.mockResolvedValue(mockInstance);

    const { result } = renderHook(() => usePrompt());

    await act(async () => {
      await result.current.initialize();
    });

    let response: string;
    await act(async () => {
      response = await result.current.prompt('Hello');
    });

    expect(response!).toBe('AI response');
    // Prompt is now wrapped with security delimiters for OWASP LLM01:2025 compliance
    expect(mockInstance.prompt).toHaveBeenCalledWith(
      expect.stringContaining('Hello'),
      expect.objectContaining({ signal: expect.any(Object) }),
    );
  });

  it('executes streaming prompt', async () => {
    const chunks = ['Hello ', 'world'];
    let index = 0;

    const mockStream = {
      getReader: () => ({
        read: vi.fn(async () => {
          if (index < chunks.length) {
            return { done: false, value: chunks[index++] };
          }
          return { done: true, value: undefined };
        }),
        releaseLock: vi.fn(),
      }),
    };

    const mockInstance = {
      prompt: vi.fn(),
      promptStreaming: vi.fn().mockReturnValue(mockStream),
      destroy: vi.fn(),
      maxTokens: 4096,
      tokensSoFar: 0,
      tokensLeft: 4096,
      topK: 3,
      temperature: 0.7,
    };
    mockAPI.create.mockResolvedValue(mockInstance);

    const { result } = renderHook(() => usePrompt());

    await act(async () => {
      await result.current.initialize();
    });

    let response: string;
    await act(async () => {
      response = await result.current.promptStreaming('Test');
    });

    await waitFor(() => {
      expect(response!).toBe('Hello world');
    });
  });

  it('handles prompt errors', async () => {
    const mockInstance = {
      prompt: vi.fn().mockRejectedValue(new Error('Prompt failed')),
      promptStreaming: vi.fn(),
      destroy: vi.fn(),
    };
    mockAPI.create.mockResolvedValue(mockInstance);

    const { result } = renderHook(() => usePrompt());

    await act(async () => {
      await result.current.initialize();
    });

    await act(async () => {
      try {
        await result.current.prompt('Test');
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.error).toBeTruthy();
  });

  it('cancels in-progress operation', async () => {
    const mockInstance = {
      prompt: vi.fn(() => new Promise((resolve) => setTimeout(resolve, 1000))),
      promptStreaming: vi.fn(),
      destroy: vi.fn(),
    };
    mockAPI.create.mockResolvedValue(mockInstance);

    const { result } = renderHook(() => usePrompt());

    await act(async () => {
      await result.current.initialize();
    });

    act(() => {
      result.current.prompt('Test');
      result.current.cancel();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('updates config', async () => {
    const mockInstance = {
      prompt: vi.fn(),
      promptStreaming: vi.fn(),
      destroy: vi.fn(),
    };
    mockAPI.create.mockResolvedValue(mockInstance);

    const { result } = renderHook(() => usePrompt());

    await act(async () => {
      await result.current.initialize();
    });

    await act(async () => {
      await result.current.updateConfig({ temperature: 0.5 });
    });

    expect(mockAPI.create).toHaveBeenCalledTimes(2);
  });

  it('clears messages', async () => {
    const { result } = renderHook(() => usePrompt());

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toHaveLength(0);
  });

  it('destroys instance on unmount', async () => {
    const mockDestroy = vi.fn();
    mockAPI.create.mockResolvedValue({
      prompt: vi.fn(),
      promptStreaming: vi.fn(),
      destroy: mockDestroy,
    });

    const { result, unmount } = renderHook(() => usePrompt());

    await act(async () => {
      await result.current.initialize();
    });

    unmount();

    expect(mockDestroy).toHaveBeenCalled();
  });

  it('estimates tokens for context window', async () => {
    const mockInstance = {
      prompt: vi.fn().mockResolvedValue('response'),
      promptStreaming: vi.fn(),
      destroy: vi.fn(),
    };
    mockAPI.create.mockResolvedValue(mockInstance);

    const { result } = renderHook(() => usePrompt());

    await act(async () => {
      await result.current.initialize();
      await result.current.prompt('Hello world');
    });

    expect(result.current.estimatedTokens).toBeGreaterThan(0);
  });

  it('tracks context window usage', async () => {
    const { result } = renderHook(() =>
      usePrompt({ config: { maxTokens: 2048 } }),
    );

    expect(result.current.contextWindowUsage).toBe(0);
  });

  it('realTimeInputUsage updates from API', async () => {
    const mockInstance = createMockLanguageModel();
    mockInstance.inputUsage = 150; // Simulate real-time usage
    mockAPI.create.mockResolvedValue(mockInstance);

    const { result } = renderHook(() => usePrompt());

    await act(async () => {
      await result.current.initialize();
    });

    // Should get initial usage
    expect(result.current.realTimeInputUsage).toBe(150);

    // Test measureInputUsage
    await act(async () => {
      const measured = await result.current.measureInputUsage('Test input');
      expect(measured).toBeGreaterThan(0);
    });

    expect(result.current.realTimeInputUsage).toBeGreaterThan(0);
  });

  it('quotaExceeded flag set on overflow', async () => {
    const mockInstance = createMockLanguageModel();
    mockAPI.create.mockResolvedValue(mockInstance);

    const { result } = renderHook(() => usePrompt());

    await act(async () => {
      await result.current.initialize();
    });

    // Initially should be false
    expect(result.current.quotaExceeded).toBe(false);

    // Trigger quota overflow event
    await act(async () => {
      const listeners = (
        mockInstance.addEventListener as any
      ).mock.calls.filter((call: any[]) => call[0] === 'quotaoverflow');
      if (listeners.length > 0) {
        const callback = listeners[0][1];
        callback(new Event('quotaoverflow'));
      }
    });

    // Should now be true
    expect(result.current.quotaExceeded).toBe(true);
    expect(result.current.error).toContain('quota exceeded');
  });
});
