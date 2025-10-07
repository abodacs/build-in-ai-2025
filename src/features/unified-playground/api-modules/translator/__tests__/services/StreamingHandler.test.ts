/**
 * StreamingHandler Test Suite
 *
 * Tests streaming translation with chunk processing, progress tracking,
 * and cancellation support
 *
 * Coverage: 8 tests (4 happy path + 4 edge cases)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StreamingHandler } from '../../services/StreamingHandler';
import {
  createMockTranslator,
  createMockStream,
  MOCK_ERRORS,
  waitFor,
} from '../test-utils';

describe('StreamingHandler', () => {
  let handler: StreamingHandler;

  beforeEach(() => {
    handler = new StreamingHandler();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Happy Path Tests (4 tests)
  // ==========================================================================

  describe('Happy Path', () => {
    it('streams translation with multiple chunks', async () => {
      // Arrange
      const chunks = ['Hello', 'Hello world', 'Hello world, how are you?'];
      const translator = createMockTranslator({
        translateStreaming: vi.fn().mockReturnValue(createMockStream(chunks)),
      });
      const onChunk = vi.fn();

      // Act
      const result = await handler.translateStreaming(
        translator,
        'Hello world',
        {
          onChunk,
        },
      );

      // Assert
      expect(result).toBe('Hello world, how are you?');
      expect(onChunk).toHaveBeenCalledTimes(3);
    });

    it('calls onChunk callback for each chunk', async () => {
      // Arrange
      const chunks = ['Hola', 'Hola mundo', 'Hola mundo completo'];
      const translator = createMockTranslator({
        translateStreaming: vi.fn().mockReturnValue(createMockStream(chunks)),
      });
      const onChunk = vi.fn();

      // Act
      await handler.translateStreaming(translator, 'test', { onChunk });

      // Assert
      expect(onChunk).toHaveBeenNthCalledWith(1, 'Hola', expect.any(Object));
      expect(onChunk).toHaveBeenNthCalledWith(
        2,
        'Hola mundo',
        expect.any(Object),
      );
      expect(onChunk).toHaveBeenNthCalledWith(
        3,
        'Hola mundo completo',
        expect.any(Object),
      );
    });

    it('accumulates full translation', async () => {
      // Arrange
      const chunks = ['Bon', 'Bonjour', 'Bonjour le monde'];
      const translator = createMockTranslator({
        translateStreaming: vi.fn().mockReturnValue(createMockStream(chunks)),
      });

      // Act
      const result = await handler.translateStreaming(translator, 'test', {});

      // Assert
      expect(result).toBe('Bonjour le monde');
    });

    it('returns final complete translation', async () => {
      // Arrange
      const finalTranslation = 'Complete translated sentence here';
      const chunks = ['Complete', 'Complete translated', finalTranslation];
      const translator = createMockTranslator({
        translateStreaming: vi.fn().mockReturnValue(createMockStream(chunks)),
      });

      // Act
      const result = await handler.translateStreaming(
        translator,
        'long text',
        {},
      );

      // Assert
      expect(result).toBe(finalTranslation);
      expect(translator.translateStreaming).toHaveBeenCalledWith(
        'long text',
        expect.any(Object),
      );
    });
  });

  // ==========================================================================
  // Critical Edge Cases (4 tests)
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles AbortSignal cancellation mid-stream', async () => {
      // Arrange
      const controller = new AbortController();
      const translator = createMockTranslator({
        translateStreaming: vi.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield 'Chunk 1';
            await waitFor(50);
            if (controller.signal.aborted) {
              throw MOCK_ERRORS.abortError;
            }
            yield 'Chunk 2';
          },
        }),
      });

      // Act
      const promise = handler.translateStreaming(translator, 'test', {
        signal: controller.signal,
      });

      setTimeout(() => controller.abort(), 25);

      // Assert
      await expect(promise).rejects.toThrow();
    });

    it('handles stream error and throws', async () => {
      // Arrange
      const translator = createMockTranslator({
        translateStreaming: vi.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield 'Chunk 1';
            throw new Error('Stream error');
          },
        }),
      });

      // Act & Assert
      await expect(
        handler.translateStreaming(translator, 'test', {}),
      ).rejects.toThrow('Stream error');
    });

    it('estimates progress correctly', async () => {
      // Arrange
      const chunks = ['H', 'He', 'Hel', 'Hell', 'Hello'];
      const translator = createMockTranslator({
        translateStreaming: vi.fn().mockReturnValue(createMockStream(chunks)),
      });
      const onChunk = vi.fn();

      // Act
      await handler.translateStreaming(translator, 'Hello', { onChunk });

      // Assert
      const progressValues = onChunk.mock.calls.map((call) => call[1].progress);

      // Progress should increase with each chunk
      expect(progressValues[0]).toBeLessThan(progressValues[1]);
      expect(progressValues[1]).toBeLessThan(progressValues[2]);

      // Last progress should be less than 100 (only complete when done)
      expect(progressValues[progressValues.length - 1]).toBeLessThan(100);
    });

    it('handles empty stream gracefully', async () => {
      // Arrange
      const translator = createMockTranslator({
        translateStreaming: vi.fn().mockReturnValue(createMockStream([])),
      });

      // Act
      const result = await handler.translateStreaming(translator, 'test', {});

      // Assert
      expect(result).toBe('');
    });
  });
});
