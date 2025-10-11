/**
 * useStreamingOutput Tests
 *
 * Unit tests for useStreamingOutput hook.
 * Focus: State management, chunk accumulation, progress tracking.
 *
 * @module shared/hooks/__tests__/useStreamingOutput.test
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreamingOutput } from '../useStreamingOutput';

describe('useStreamingOutput', () => {
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useStreamingOutput());

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.output).toBe('');
      expect(result.current.chunksReceived).toBe(0);
      expect(result.current.progress).toBe(0);
      expect(result.current.startedAt).toBeUndefined();
    });

    it('should provide all action functions', () => {
      const { result } = renderHook(() => useStreamingOutput());

      expect(typeof result.current.startStreaming).toBe('function');
      expect(typeof result.current.addChunk).toBe('function');
      expect(typeof result.current.completeStreaming).toBe('function');
      expect(typeof result.current.cancelStreaming).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('Streaming Lifecycle', () => {
    it('should start streaming correctly', () => {
      const { result } = renderHook(() => useStreamingOutput());

      act(() => {
        result.current.startStreaming();
      });

      expect(result.current.isStreaming).toBe(true);
      expect(result.current.output).toBe('');
      expect(result.current.chunksReceived).toBe(0);
      expect(result.current.progress).toBe(0);
      expect(result.current.startedAt).toBeGreaterThan(0);
    });

    it('should accumulate chunks', () => {
      const { result } = renderHook(() => useStreamingOutput());

      act(() => {
        result.current.startStreaming();
      });

      act(() => {
        result.current.addChunk('Hello');
        result.current.addChunk(' ');
        result.current.addChunk('world');
      });

      expect(result.current.output).toBe('Hello world');
      expect(result.current.chunksReceived).toBe(3);
    });

    it('should update progress with chunks', () => {
      const { result } = renderHook(() => useStreamingOutput());

      act(() => {
        result.current.startStreaming();
      });

      act(() => {
        result.current.addChunk('chunk1');
        result.current.addChunk('chunk2');
      });

      expect(result.current.progress).toBeGreaterThan(0);
      expect(result.current.progress).toBeLessThanOrEqual(95);
    });

    it('should use metadata progress when provided', () => {
      const { result } = renderHook(() => useStreamingOutput());

      act(() => {
        result.current.startStreaming();
      });

      act(() => {
        result.current.addChunk('data', {
          chunkIndex: 0,
          totalLength: 100,
          elapsedTime: 50,
          progress: 50,
          tokensPerSecond: 20,
        });
      });

      expect(result.current.progress).toBe(50);
    });

    it('should complete streaming', () => {
      const { result } = renderHook(() => useStreamingOutput());

      act(() => {
        result.current.startStreaming();
        result.current.addChunk('complete');
      });

      act(() => {
        result.current.completeStreaming();
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.progress).toBe(100);
      expect(result.current.output).toBe('complete');
    });

    it('should cancel streaming', () => {
      const { result } = renderHook(() => useStreamingOutput());

      act(() => {
        result.current.startStreaming();
        result.current.addChunk('partial');
      });

      act(() => {
        result.current.cancelStreaming();
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.output).toBe('partial');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all state', () => {
      const { result } = renderHook(() => useStreamingOutput());

      act(() => {
        result.current.startStreaming();
        result.current.addChunk('data1');
        result.current.addChunk('data2');
        result.current.completeStreaming();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.output).toBe('');
      expect(result.current.chunksReceived).toBe(0);
      expect(result.current.progress).toBe(0);
      expect(result.current.startedAt).toBeUndefined();
    });
  });

  describe('Multiple Streaming Sessions', () => {
    it('should handle multiple streaming sessions', () => {
      const { result } = renderHook(() => useStreamingOutput());

      // First session
      act(() => {
        result.current.startStreaming();
        result.current.addChunk('Session 1');
        result.current.completeStreaming();
      });

      expect(result.current.output).toBe('Session 1');

      // Second session
      act(() => {
        result.current.startStreaming();
        result.current.addChunk('Session 2');
        result.current.completeStreaming();
      });

      expect(result.current.output).toBe('Session 2');
      expect(result.current.chunksReceived).toBe(1);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => useStreamingOutput());

      act(() => {
        result.current.startStreaming();
        result.current.addChunk('data');
      });

      unmount();

      // Test passes if no errors thrown
    });
  });
});
