/**
 * useWriter Tests
 *
 * Essential tests for useWriter hook.
 * Focus: State management, write operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWriter } from '../useWriter';

// Mock WriterManager
vi.mock('../../services', () => ({
  WriterManager: vi.fn().mockImplementation(() => ({
    write: vi.fn(async () => 'Generated content'),
    writeStreaming: vi.fn(async (prompt, onChunk) => {
      onChunk('Hello');
      onChunk(' world');
      return 'Hello world';
    }),
    getInstance: vi.fn(),
    updateConfig: vi.fn(),
    destroy: vi.fn(),
  })),
}));

describe('useWriter', () => {
  const defaultConfig = {
    tone: 'neutral' as const,
    format: 'markdown' as const,
    length: 'medium' as const,
    outputLanguage: 'en' as const,
    sharedContext: '',
  };

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useWriter(defaultConfig));

      expect(result.current.isWriting).toBe(false);
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.content).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('write', () => {
    it('should generate content', async () => {
      const { result } = renderHook(() => useWriter(defaultConfig));

      await act(async () => {
        await result.current.actions.write('Test prompt');
      });

      await waitFor(() => {
        expect(result.current.content).toBe('Generated content');
      });

      expect(result.current.isWriting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set isWriting during generation', () => {
      const { result } = renderHook(() => useWriter(defaultConfig));

      act(() => {
        result.current.actions.write('Test');
      });

      expect(result.current.isWriting).toBe(true);
    });
  });

  describe('writeStreaming', () => {
    it('should stream content', async () => {
      const { result } = renderHook(() => useWriter(defaultConfig));
      const onChunk = vi.fn();

      await act(async () => {
        await result.current.actions.writeStreaming('Test', onChunk);
      });

      await waitFor(() => {
        expect(result.current.content).toBe('Hello world');
      });

      expect(onChunk).toHaveBeenCalled();
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('cancel', () => {
    it('should cancel operation', () => {
      const { result } = renderHook(() => useWriter(defaultConfig));

      act(() => {
        result.current.actions.write('Test');
      });

      act(() => {
        result.current.actions.cancel();
      });

      expect(result.current.isWriting).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset state', async () => {
      const { result } = renderHook(() => useWriter(defaultConfig));

      await act(async () => {
        await result.current.actions.write('Test');
      });

      act(() => {
        result.current.actions.reset();
      });

      expect(result.current.content).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
});
