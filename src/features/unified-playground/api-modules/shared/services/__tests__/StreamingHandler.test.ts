/**
 * StreamingHandler Tests
 *
 * Comprehensive tests for StreamingHandler.
 * Focus: Resilience, error handling, cancellation, performance.
 *
 * @module shared/services/__tests__/StreamingHandler.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StreamingHandler } from '../StreamingHandler';

// Helper to create async iterable from array
function createAsyncIterable(chunks: string[]): AsyncIterable<string> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        yield chunk;
      }
    },
  };
}

// Helper to create ReadableStream from chunks
function createReadableStream(chunks: string[]): ReadableStream<string> {
  let index = 0;
  return new ReadableStream({
    async pull(controller) {
      if (index < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        controller.enqueue(chunks[index++]);
      } else {
        controller.close();
      }
    },
  });
}

describe('StreamingHandler', () => {
  describe('processStream', () => {
    it('should process all chunks and return complete text', async () => {
      const chunks = ['Hello', ' ', 'world', '!'];
      const stream = createAsyncIterable(chunks);
      const onChunk = vi.fn();

      const result = await StreamingHandler.processStream(stream, onChunk);

      expect(result).toBe('Hello world!');
      expect(onChunk).toHaveBeenCalledTimes(4);
    });

    it('should call onChunk with correct metadata', async () => {
      const chunks = ['First', ' chunk'];
      const stream = createAsyncIterable(chunks);
      const onChunk = vi.fn();

      await StreamingHandler.processStream(stream, onChunk);

      // Check first chunk metadata
      const firstCall = onChunk.mock.calls[0];
      expect(firstCall[0]).toBe('First');
      expect(firstCall[1]).toMatchObject({
        chunkIndex: 0,
        totalLength: 5,
      });
      expect(firstCall[1].progress).toBeGreaterThanOrEqual(0);
      expect(firstCall[1].tokensPerSecond).toBeGreaterThanOrEqual(0);
    });

    it('should handle abort signal', async () => {
      const chunks = ['A'.repeat(100), 'B'.repeat(100), 'C'.repeat(100)];
      const stream = createAsyncIterable(chunks);
      const abortController = new AbortController();

      // Abort after short delay
      setTimeout(() => abortController.abort(), 15);

      await expect(
        StreamingHandler.processStream(stream, vi.fn(), abortController.signal),
      ).rejects.toThrow('abort');
    });

    it('should work with ReadableStream', async () => {
      const chunks = ['Test', ' ', 'stream'];
      const stream = createReadableStream(chunks);
      const onChunk = vi.fn();

      const result = await StreamingHandler.processStream(stream, onChunk);

      expect(result).toBe('Test stream');
      expect(onChunk).toHaveBeenCalledTimes(3);
    });

    it('should handle streaming errors gracefully', async () => {
      const errorStream: AsyncIterable<string> = {
        async *[Symbol.asyncIterator]() {
          yield 'First';
          throw new Error('Stream error');
        },
      };

      await expect(
        StreamingHandler.processStream(errorStream, vi.fn()),
      ).rejects.toThrow('Streaming failed');
    });
  });

  describe('processStreamSimple', () => {
    it('should process stream without metadata', async () => {
      const chunks = ['Simple', ' ', 'test'];
      const stream = createAsyncIterable(chunks);
      const onChunk = vi.fn();

      const result = await StreamingHandler.processStreamSimple(
        stream,
        onChunk,
      );

      expect(result).toBe('Simple test');
      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenCalledWith('Simple');
    });
  });

  describe('collectStream', () => {
    it('should collect entire stream without callbacks', async () => {
      const chunks = ['Collect', ' ', 'all'];
      const stream = createAsyncIterable(chunks);

      const result = await StreamingHandler.collectStream(stream);

      expect(result).toBe('Collect all');
    });

    it('should respect abort signal', async () => {
      const chunks = ['A'.repeat(100), 'B'.repeat(100)];
      const stream = createAsyncIterable(chunks);
      const abortController = new AbortController();

      setTimeout(() => abortController.abort(), 15);

      await expect(
        StreamingHandler.collectStream(stream, abortController.signal),
      ).rejects.toThrow('abort');
    });

    it('should handle collection errors', async () => {
      const errorStream: AsyncIterable<string> = {
        async *[Symbol.asyncIterator]() {
          yield 'Data';
          throw new Error('Collection failed');
        },
      };

      await expect(StreamingHandler.collectStream(errorStream)).rejects.toThrow(
        'Failed to collect stream',
      );
    });
  });

  describe('processStreamWithTimeout', () => {
    it('should complete successfully within timeout', async () => {
      const chunks = ['Fast', ' ', 'stream'];
      const stream = createAsyncIterable(chunks);
      const onChunk = vi.fn();

      const result = await StreamingHandler.processStreamWithTimeout(
        stream,
        onChunk,
        1000,
      );

      expect(result).toBe('Fast stream');
    });

    it('should timeout slow streams', async () => {
      const slowStream: AsyncIterable<string> = {
        async *[Symbol.asyncIterator]() {
          yield 'Slow';
          await new Promise((resolve) => setTimeout(resolve, 500));
          yield ' data';
        },
      };

      await expect(
        StreamingHandler.processStreamWithTimeout(slowStream, vi.fn(), 100),
      ).rejects.toThrow('timed out');
    });
  });

  describe('Utility Methods', () => {
    it('should create abort controller', () => {
      const controller = StreamingHandler.createAbortController();
      expect(controller).toBeInstanceOf(AbortController);
      expect(controller.signal).toBeDefined();
    });

    it('should identify abort errors', () => {
      expect(StreamingHandler.isAbortError(new Error('abort'))).toBe(true);
      expect(StreamingHandler.isAbortError(new Error('cancel'))).toBe(true);
      expect(StreamingHandler.isAbortError(new Error('other error'))).toBe(
        false,
      );
      expect(StreamingHandler.isAbortError('string')).toBe(false);
    });
  });

  describe('Resilience and Edge Cases', () => {
    it('should handle empty stream', async () => {
      const emptyStream = createAsyncIterable([]);
      const onChunk = vi.fn();

      const result = await StreamingHandler.processStream(emptyStream, onChunk);

      expect(result).toBe('');
      expect(onChunk).not.toHaveBeenCalled();
    });

    it('should handle very long content', async () => {
      const longChunks = Array(100).fill('Word ');
      const stream = createAsyncIterable(longChunks);
      const onChunk = vi.fn();

      const result = await StreamingHandler.processStream(stream, onChunk);

      expect(result.length).toBeGreaterThan(0);
      expect(onChunk).toHaveBeenCalledTimes(100);
    });

    it('should track performance metrics correctly', async () => {
      const chunks = ['Test', ' ', 'performance'];
      const stream = createAsyncIterable(chunks);
      const onChunk = vi.fn();

      await StreamingHandler.processStream(stream, onChunk);

      // Check that metadata includes performance metrics
      const lastCall = onChunk.mock.calls[onChunk.mock.calls.length - 1];
      const metadata = lastCall[1];

      expect(metadata.elapsedTime).toBeGreaterThan(0);
      expect(metadata.tokensPerSecond).toBeGreaterThanOrEqual(0);
    });
  });
});
