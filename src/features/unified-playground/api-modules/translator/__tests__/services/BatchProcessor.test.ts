/**
 * BatchProcessor Test Suite
 *
 * Tests batch translation processing with concurrency control,
 * progress tracking, and error recovery
 *
 * Coverage: 7 tests (4 happy path + 3 edge cases)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BatchProcessor } from '../../services/BatchProcessor';
import { createMockTranslator } from '../test-utils';

describe('BatchProcessor', () => {
  let processor: BatchProcessor;

  beforeEach(() => {
    processor = new BatchProcessor();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Happy Path Tests (4 tests)
  // ==========================================================================

  describe('Happy Path', () => {
    it('processes batch of 5 items successfully', async () => {
      // Arrange
      const items = [
        { id: '1', text: 'Hello' },
        { id: '2', text: 'World' },
        { id: '3', text: 'Good' },
        { id: '4', text: 'Morning' },
        { id: '5', text: 'Friend' },
      ];
      const translator = createMockTranslator({
        translate: vi
          .fn()
          .mockImplementation(async (text) => `Translated: ${text}`),
      });

      // Act
      const results = await processor.processBatch(translator, {
        items,
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });

      // Assert
      expect(results).toHaveLength(5);
      expect(results[0].translated).toBe('Translated: Hello');
      expect(results[4].translated).toBe('Translated: Friend');
      expect(translator.translate).toHaveBeenCalledTimes(5);
    });

    it('reports progress 0%, 25%, 50%, 75%, 100%', async () => {
      // Arrange
      const items = [
        { id: '1', text: 'One' },
        { id: '2', text: 'Two' },
        { id: '3', text: 'Three' },
        { id: '4', text: 'Four' },
      ];
      const translator = createMockTranslator({
        translate: vi.fn().mockResolvedValue('Translated'),
      });
      const onProgress = vi.fn();

      // Act
      await processor.processBatch(translator, {
        items,
        sourceLanguage: 'en',
        targetLanguage: 'es',
        onProgress,
      });

      // Assert
      expect(onProgress).toHaveBeenCalledWith(1, 4);
      expect(onProgress).toHaveBeenCalledWith(2, 4);
      expect(onProgress).toHaveBeenCalledWith(3, 4);
      expect(onProgress).toHaveBeenCalledWith(4, 4);
    });

    it('returns all translated results in order', async () => {
      // Arrange
      const items = [
        { id: '1', text: 'First' },
        { id: '2', text: 'Second' },
        { id: '3', text: 'Third' },
      ];
      const translator = createMockTranslator({
        translate: vi.fn().mockImplementation(async (text) => `Result-${text}`),
      });

      // Act
      const results = await processor.processBatch(translator, {
        items,
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });

      // Assert
      expect(results[0].original).toBe('First');
      expect(results[0].translated).toBe('Result-First');
      expect(results[1].original).toBe('Second');
      expect(results[1].translated).toBe('Result-Second');
      expect(results[2].original).toBe('Third');
      expect(results[2].translated).toBe('Result-Third');
    });

    it('respects concurrency limit (3 concurrent)', async () => {
      // Arrange
      const items = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        text: `Item ${i}`,
      }));
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const translator = createMockTranslator({
        translate: vi.fn().mockImplementation(async (text) => {
          concurrentCount++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCount);
          await new Promise((resolve) => setTimeout(resolve, 10));
          concurrentCount--;
          return `Translated: ${text}`;
        }),
      });

      // Act
      await processor.processBatch(translator, {
        items,
        sourceLanguage: 'en',
        targetLanguage: 'es',
        concurrency: 3,
      });

      // Assert
      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });
  });

  // ==========================================================================
  // Critical Edge Cases (3 tests)
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles error in middle item, continues others', async () => {
      // Arrange
      const items = [
        { id: '1', text: 'Item1' },
        { id: '2', text: 'Item2' },
        { id: '3', text: 'Item3' },
        { id: '4', text: 'Item4' },
      ];
      const translator = createMockTranslator({
        translate: vi.fn().mockImplementation(async (text) => {
          if (text === 'Item2') {
            throw new Error('Translation failed for Item2');
          }
          return `Translated: ${text}`;
        }),
      });

      // Act
      const results = await processor.processBatch(translator, {
        items,
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });

      // Assert
      expect(results).toHaveLength(4);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain('Translation failed');
      expect(results[2].success).toBe(true);
      expect(results[3].success).toBe(true);
    });

    it('processes empty batch returns empty array', async () => {
      // Arrange
      const items: any[] = [];
      const translator = createMockTranslator();

      // Act
      const results = await processor.processBatch(translator, {
        items,
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });

      // Assert
      expect(results).toEqual([]);
      expect(translator.translate).not.toHaveBeenCalled();
    });

    it('handles single item batch', async () => {
      // Arrange
      const items = [{ id: '1', text: 'Single item' }];
      const translator = createMockTranslator({
        translate: vi.fn().mockResolvedValue('Translated single item'),
      });
      const onProgress = vi.fn();

      // Act
      const results = await processor.processBatch(translator, {
        items,
        sourceLanguage: 'en',
        targetLanguage: 'es',
        onProgress,
      });

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].translated).toBe('Translated single item');
      expect(onProgress).toHaveBeenCalledWith(1, 1);
    });
  });
});
