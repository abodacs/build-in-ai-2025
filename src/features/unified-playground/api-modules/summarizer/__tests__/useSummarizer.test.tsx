/**
 * useSummarizer Hook Test Suite
 *
 * Production-grade tests for useSummarizer React hook
 * Tests summarization, streaming, error handling, and lifecycle management
 *
 * Coverage Target: 95%+
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
} from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSummarizer } from '../hooks/useSummarizer';

// ============================================================================
// Mocks
// ============================================================================

// Store mock manager reference
let mockManagerInstance: any;

// Create factory function for mock manager
const createMockManager = () => ({
  summarize: vi.fn().mockResolvedValue('This is a summary of the input text.'),
  summarizeStreaming: vi.fn().mockResolvedValue(
    new ReadableStream({
      start(controller) {
        controller.enqueue('Test ');
        controller.enqueue('stream');
        controller.close();
      },
    }),
  ),
  getMetrics: vi.fn().mockReturnValue({
    modelInitTime: 100,
    summaryTimes: [500],
    averageTime: 500,
    cacheHitRate: 0,
    streamingLatency: [],
  }),
  hasInstance: vi.fn().mockReturnValue(true),
  cleanup: vi.fn(),
});

// Mock SummarizerManager - reuse the same instance instead of creating new ones
vi.mock('../services/SummarizerManager', () => ({
  SummarizerManager: vi.fn().mockImplementation(() => {
    // Reuse existing instance if it exists, otherwise create new one
    if (!mockManagerInstance) {
      mockManagerInstance = createMockManager();
    }
    return mockManagerInstance;
  }),
}));

// Mock ErrorHandler
vi.mock('../services/ErrorHandler', () => ({
  ErrorHandler: {
    handleSummarizationError: vi.fn((error: any) => ({
      type: 'NotReadableError',
      message: error.message || 'Summarization failed',
      recoverable: true,
      suggestion: 'Please try again',
    })),
  },
}));

// Mock performance tracker - create single instance that's reused
const mockPerformanceTracker = {
  recordOperation: vi.fn(),
};

vi.mock('../utils/performanceTracker', () => ({
  getPerformanceTracker: vi.fn(() => mockPerformanceTracker),
}));

// Mock text preprocessing
vi.mock('../utils/textPreprocessing', () => ({
  validateText: vi.fn((text: string) => {
    if (!text || text.trim().length < 100) {
      return {
        valid: false,
        reason: 'Text must be at least 100 characters',
      };
    }
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 10) {
      return {
        valid: false,
        reason: 'Text must contain at least 10 words',
      };
    }
    return { valid: true };
  }),
  countWords: vi.fn((text: string) => text.trim().split(/\s+/).length),
}));

// ============================================================================
// Test Fixtures
// ============================================================================

const VALID_TEXT = 'This is a valid text for summarization. '.repeat(20); // ~800 chars, ~100 words

const SHORT_TEXT = 'Too short';

const MOCK_SUMMARY = 'This is a summary of the input text.';

// ============================================================================
// Tests
// ============================================================================

describe('useSummarizer Hook', () => {
  // Ensure mock instance is created before first test
  beforeAll(() => {
    // Create a dummy hook instance to initialize mockManagerInstance
    const { unmount } = renderHook(() => useSummarizer());
    unmount();
  });

  beforeEach(() => {
    // Clear mocks and reset to default behavior
    vi.clearAllMocks();
    mockManagerInstance.summarize.mockResolvedValue(MOCK_SUMMARY);
    mockManagerInstance.summarizeStreaming.mockResolvedValue(
      new ReadableStream({
        start(controller) {
          controller.enqueue('Test ');
          controller.enqueue('stream');
          controller.close();
        },
      }),
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      // Act
      const { result } = renderHook(() => useSummarizer());

      // Assert
      expect(result.current).toMatchObject({
        result: null,
        isLoading: false,
        isStreaming: false,
        error: null,
        metrics: null,
        hasInstance: expect.any(Boolean),
      });
      expect(result.current.summarize).toBeInstanceOf(Function);
      expect(result.current.reset).toBeInstanceOf(Function);
    });

    it('should initialize with custom config', () => {
      // Arrange
      const config = {
        type: 'tldr' as const,
        format: 'markdown' as const,
        length: 'medium' as const,
      };

      // Act
      const { result } = renderHook(() => useSummarizer({ config }));

      // Assert
      expect(result.current).toBeDefined();
    });

    it('should initialize with performance tracking disabled', () => {
      // Act
      const { result } = renderHook(() =>
        useSummarizer({ trackPerformance: false }),
      );

      // Assert
      expect(result.current).toBeDefined();
    });
  });

  // ============================================================================
  // Summarization Tests
  // ============================================================================

  describe('Summarization', () => {
    it('should summarize text successfully', async () => {
      // Arrange
      mockManagerInstance.summarize.mockResolvedValue(MOCK_SUMMARY);
      const { result } = renderHook(() => useSummarizer());

      // Act
      let summary: string | undefined;
      await act(async () => {
        summary = await result.current.summarize(VALID_TEXT);
      });

      // Assert
      expect(summary).toBe(MOCK_SUMMARY);
      expect(result.current.result).toBe(MOCK_SUMMARY);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockManagerInstance.summarize).toHaveBeenCalledWith(
        VALID_TEXT,
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
        expect.any(Object),
      );
    });

    it('should set loading state during summarization', async () => {
      // Arrange
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
      mockManagerInstance.summarize.mockReturnValue(promise);

      const { result } = renderHook(() => useSummarizer());

      // Act
      let summaryPromise: Promise<string>;
      act(() => {
        summaryPromise = result.current.summarize(VALID_TEXT);
      });

      // Assert - loading state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Complete the operation
      await act(async () => {
        resolvePromise!(MOCK_SUMMARY);
        await summaryPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should validate input text', async () => {
      // Arrange
      const { result } = renderHook(() => useSummarizer());

      // Act & Assert
      await act(async () => {
        await expect(result.current.summarize(SHORT_TEXT)).rejects.toThrow();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.type).toBe('InvalidStateError');
      expect(mockManagerInstance.summarize).not.toHaveBeenCalled();
    });

    it('should handle summarization errors', async () => {
      // Arrange
      mockManagerInstance.summarize.mockRejectedValue(new Error('API Error'));
      const { result } = renderHook(() => useSummarizer());

      // Act & Assert
      await act(async () => {
        await expect(result.current.summarize(VALID_TEXT)).rejects.toThrow();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.result).toBeNull();
    });

    it('should update metrics after successful summarization', async () => {
      // Arrange
      mockManagerInstance.summarize.mockResolvedValue(MOCK_SUMMARY);
      const { result } = renderHook(() => useSummarizer());

      // Act
      await act(async () => {
        await result.current.summarize(VALID_TEXT);
      });

      // Assert
      expect(result.current.metrics).not.toBeNull();
      expect(result.current.metrics).toMatchObject({
        originalWordCount: expect.any(Number),
        summaryWordCount: expect.any(Number),
        compressionRatio: expect.any(Number),
        processingTime: expect.any(Number),
      });
    });

    it('should track performance when enabled', async () => {
      // Arrange
      mockManagerInstance.summarize.mockResolvedValue(MOCK_SUMMARY);
      const { getPerformanceTracker } = await import(
        '../utils/performanceTracker'
      );
      const mockTracker = (getPerformanceTracker as any)();

      const { result } = renderHook(() =>
        useSummarizer({ trackPerformance: true }),
      );

      // Act
      await act(async () => {
        await result.current.summarize(VALID_TEXT);
      });

      // Assert
      expect(mockTracker.recordOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'summarize',
          success: true,
          inputSize: VALID_TEXT.length,
        }),
      );
    });

    it('should pass additional options to manager', async () => {
      // Arrange
      mockManagerInstance.summarize.mockResolvedValue(MOCK_SUMMARY);
      const { result } = renderHook(() => useSummarizer());
      const context = 'Summarize this for developers';

      // Act
      await act(async () => {
        await result.current.summarize(VALID_TEXT, { context });
      });

      // Assert
      expect(mockManagerInstance.summarize).toHaveBeenCalledWith(
        VALID_TEXT,
        expect.objectContaining({ context }),
        expect.any(Object),
      );
    });
  });

  // ============================================================================
  // Streaming Tests
  // ============================================================================

  describe('Streaming Summarization', () => {
    it('should handle streaming summarization', async () => {
      // Arrange
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue('Chunk 1 ');
          controller.enqueue('Chunk 2 ');
          controller.enqueue('Chunk 3');
          controller.close();
        },
      });
      mockManagerInstance.summarizeStreaming.mockResolvedValue(mockStream);

      const { result } = renderHook(() => useSummarizer());

      // Act
      let stream: ReadableStream<string> | undefined;
      await act(async () => {
        stream = await result.current.summarizeStreaming(VALID_TEXT);
      });

      // Assert
      expect(stream).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isStreaming).toBe(false); // Streaming completes quickly
      expect(mockManagerInstance.summarizeStreaming).toHaveBeenCalled();
    });

    it('should set streaming state', async () => {
      // Arrange
      let resolvePromise: (value: ReadableStream) => void;
      const promise = new Promise<ReadableStream>((resolve) => {
        resolvePromise = resolve;
      });
      mockManagerInstance.summarizeStreaming.mockReturnValue(promise);

      const { result } = renderHook(() => useSummarizer());

      // Act
      let streamPromise: Promise<ReadableStream<string>>;
      act(() => {
        streamPromise = result.current.summarizeStreaming(VALID_TEXT);
      });

      // Assert - streaming state
      await waitFor(() => {
        expect(result.current.isStreaming).toBe(true);
      });

      // Complete
      const mockStream = new ReadableStream();
      await act(async () => {
        resolvePromise!(mockStream);
        await streamPromise!;
      });
    });

    it('should validate input for streaming', async () => {
      // Arrange
      const { result } = renderHook(() => useSummarizer());

      // Act & Assert
      await act(async () => {
        await expect(
          result.current.summarizeStreaming(SHORT_TEXT),
        ).rejects.toThrow();
      });

      expect(result.current.error).not.toBeNull();
      expect(mockManagerInstance.summarizeStreaming).not.toHaveBeenCalled();
    });

    it('should handle streaming errors', async () => {
      // Arrange
      mockManagerInstance.summarizeStreaming.mockRejectedValue(
        new Error('Streaming failed'),
      );
      const { result } = renderHook(() => useSummarizer());

      // Act & Assert
      await act(async () => {
        try {
          await result.current.summarizeStreaming(VALID_TEXT);
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.isStreaming).toBe(false);
    });
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      // Arrange
      const { result } = renderHook(() => useSummarizer());
      const newConfig = {
        type: 'key-points' as const,
        format: 'markdown' as const,
        length: 'long' as const,
      };

      // Act
      act(() => {
        result.current.updateConfig(newConfig);
      });

      // Assert
      // Config is updated internally, will be used in next summarize call
      expect(result.current).toBeDefined();
    });

    it('should use updated config in next summarization', async () => {
      // Arrange
      mockManagerInstance.summarize.mockResolvedValue(MOCK_SUMMARY);
      const { result } = renderHook(() => useSummarizer());
      const newConfig = {
        type: 'headline' as const,
      };

      // Act
      act(() => {
        result.current.updateConfig(newConfig);
      });

      await act(async () => {
        await result.current.summarize(VALID_TEXT);
      });

      // Assert
      expect(mockManagerInstance.summarize).toHaveBeenCalledWith(
        VALID_TEXT,
        expect.any(Object),
        expect.objectContaining({ type: 'headline' }),
      );
    });
  });

  // ============================================================================
  // State Management Tests
  // ============================================================================

  describe('State Management', () => {
    it('should reset state', async () => {
      // Arrange
      mockManagerInstance.summarize.mockResolvedValue(MOCK_SUMMARY);
      const { result } = renderHook(() => useSummarizer());

      await act(async () => {
        await result.current.summarize(VALID_TEXT);
      });

      expect(result.current.result).not.toBeNull();

      // Act
      act(() => {
        result.current.reset();
      });

      // Assert
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should abort ongoing operation', async () => {
      // Arrange
      let rejectPromise: (reason: any) => void;
      const promise = new Promise<string>((_, reject) => {
        rejectPromise = reject;
      });
      mockManagerInstance.summarize.mockReturnValue(promise);

      const { result } = renderHook(() => useSummarizer());

      // Start operation
      let summaryPromise: Promise<string> | undefined;
      act(() => {
        summaryPromise = result.current.summarize(VALID_TEXT);
      });

      // Wait for loading state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Act - abort and reject promise together
      await act(async () => {
        result.current.abort();
        rejectPromise!(new Error('AbortError'));
        if (summaryPromise) {
          try {
            await summaryPromise;
          } catch {
            // Expected
          }
        }
      });

      // Assert
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ============================================================================
  // Lifecycle Tests
  // ============================================================================

  describe('Lifecycle', () => {
    it('should cleanup on unmount with autoCleanup enabled', () => {
      // Arrange
      const { unmount } = renderHook(() =>
        useSummarizer({ autoCleanup: true }),
      );
      const cleanupSpy = vi.spyOn(mockManagerInstance, 'cleanup');

      // Act
      unmount();

      // Assert
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should not cleanup on unmount with autoCleanup disabled', () => {
      // Arrange
      const { unmount } = renderHook(() =>
        useSummarizer({ autoCleanup: false }),
      );
      const cleanupSpy = vi.spyOn(mockManagerInstance, 'cleanup');

      // Act
      unmount();

      // Assert
      expect(cleanupSpy).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Arrange
      mockManagerInstance.summarize.mockRejectedValue(
        new Error('Network error'),
      );
      const { result } = renderHook(() => useSummarizer());

      // Act
      await act(async () => {
        try {
          await result.current.summarize(VALID_TEXT);
        } catch {
          // Expected
        }
      });

      // Assert
      expect(result.current.error).not.toBeNull();
      expect(result.current.result).toBeNull();
    });

    it('should track failed operations', async () => {
      // Arrange
      mockManagerInstance.summarize.mockRejectedValue(new Error('Test error'));
      const { getPerformanceTracker } = await import(
        '../utils/performanceTracker'
      );
      const mockTracker = (getPerformanceTracker as any)();

      const { result } = renderHook(() =>
        useSummarizer({ trackPerformance: true }),
      );

      // Act
      await act(async () => {
        try {
          await result.current.summarize(VALID_TEXT);
        } catch {
          // Expected
        }
      });

      // Assert
      expect(mockTracker.recordOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'summarize',
          success: false,
        }),
      );
    });

    it('should provide error recovery suggestions', async () => {
      // Arrange
      mockManagerInstance.summarize.mockRejectedValue(
        new Error('Model not loaded'),
      );
      const { result } = renderHook(() => useSummarizer());

      // Act
      await act(async () => {
        try {
          await result.current.summarize(VALID_TEXT);
        } catch {
          // Expected
        }
      });

      // Assert
      expect(result.current.error).toMatchObject({
        message: expect.any(String),
        recoverable: expect.any(Boolean),
        suggestion: expect.any(String),
      });
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty text', async () => {
      // Arrange
      const { result } = renderHook(() => useSummarizer());

      // Act & Assert
      await act(async () => {
        await expect(result.current.summarize('')).rejects.toThrow();
      });

      expect(result.current.error).not.toBeNull();
    });

    it('should handle whitespace-only text', async () => {
      // Arrange
      const { result } = renderHook(() => useSummarizer());

      // Act & Assert
      await act(async () => {
        await expect(result.current.summarize('   \n\n   ')).rejects.toThrow();
      });

      expect(result.current.error).not.toBeNull();
    });

    it('should handle concurrent summarizations', async () => {
      // Arrange
      mockManagerInstance.summarize.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(MOCK_SUMMARY), 100),
          ),
      );
      const { result } = renderHook(() => useSummarizer());

      // Act
      await act(async () => {
        const promise1 = result.current.summarize(VALID_TEXT);
        const promise2 = result.current.summarize(VALID_TEXT + ' more text');

        await Promise.all([promise1, promise2]);
      });

      // Assert
      expect(mockManagerInstance.summarize).toHaveBeenCalledTimes(2);
    });

    it('should handle very long text', async () => {
      // Arrange
      const longText = VALID_TEXT.repeat(100); // ~80k chars
      mockManagerInstance.summarize.mockResolvedValue(MOCK_SUMMARY);
      const { result } = renderHook(() => useSummarizer());

      // Act
      await act(async () => {
        await result.current.summarize(longText);
      });

      // Assert
      expect(result.current.result).toBe(MOCK_SUMMARY);
      expect(mockManagerInstance.summarize).toHaveBeenCalledWith(
        longText,
        expect.any(Object),
        expect.any(Object),
      );
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration', () => {
    it('should handle complete workflow', async () => {
      // Arrange
      mockManagerInstance.summarize.mockResolvedValue(MOCK_SUMMARY);
      const { result } = renderHook(() =>
        useSummarizer({
          config: { type: 'tldr', length: 'medium' },
          trackPerformance: true,
        }),
      );

      // Act - summarize
      await act(async () => {
        await result.current.summarize(VALID_TEXT);
      });

      expect(result.current.result).toBe(MOCK_SUMMARY);

      // Act - update config
      act(() => {
        result.current.updateConfig({ type: 'headline' });
      });

      // Act - summarize again
      mockManagerInstance.summarize.mockResolvedValue('Headline summary');
      await act(async () => {
        await result.current.summarize(VALID_TEXT);
      });

      expect(result.current.result).toBe('Headline summary');

      // Act - reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.result).toBeNull();

      // Assert
      expect(result.current.error).toBeNull();
    });
  });
});
