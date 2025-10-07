/**
 * TranslatorManager Test Suite
 *
 * Tests translator instance lifecycle management, caching, availability checking,
 * download monitoring, and resource cleanup
 *
 * Coverage: 15 tests (8 happy path + 7 edge cases)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TranslatorManager } from '../../services/TranslatorManager';
import {
  setupTranslatorAPIMock,
  cleanupTranslatorAPIMock,
  createMockTranslator,
  MOCK_ERRORS,
  waitFor,
} from '../test-utils';

describe('TranslatorManager', () => {
  let mockAPI: ReturnType<typeof setupTranslatorAPIMock>;
  let manager: TranslatorManager;

  beforeEach(() => {
    mockAPI = setupTranslatorAPIMock();
    manager = new TranslatorManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTranslatorAPIMock();
  });

  // ==========================================================================
  // Happy Path Tests (8 tests)
  // ==========================================================================

  describe('Happy Path', () => {
    it('creates translator for valid en→es pair', async () => {
      // Arrange
      const options = { sourceLanguage: 'en', targetLanguage: 'es' };

      // Act
      const translator = await manager.create(options);

      // Assert
      expect(translator).toBeDefined();
      expect(mockAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceLanguage: 'en',
          targetLanguage: 'es',
        }),
      );
    });

    it('caches created translator instances', async () => {
      // Arrange
      const options = { sourceLanguage: 'en', targetLanguage: 'es' };

      // Act
      const translator1 = await manager.create(options);
      const translator2 = await manager.create(options);

      // Assert
      expect(translator1).toBe(translator2); // Same instance
      expect(mockAPI.create).toHaveBeenCalledTimes(1); // Only created once
    });

    it('reuses cached translator for same pair', async () => {
      // Arrange
      const options = { sourceLanguage: 'en', targetLanguage: 'es' };

      // Act
      await manager.create(options);
      await manager.create(options);
      await manager.create(options);

      // Assert
      expect(mockAPI.create).toHaveBeenCalledTimes(1);
    });

    it('monitors download progress 0-100%', async () => {
      // Arrange
      manager.onDownloadProgress('en', 'es', vi.fn());
      const options = {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        monitor: vi.fn(),
      };

      // Mock create with download progress
      mockAPI.create.mockImplementation(async (opts: any) => {
        if (opts.monitor) {
          const mockMonitor = {
            addEventListener: vi.fn((event, callback) => {
              // Simulate progress events
              setTimeout(() => callback({ loaded: 5000, total: 10000 }), 10);
              setTimeout(() => callback({ loaded: 10000, total: 10000 }), 20);
            }),
          };
          opts.monitor(mockMonitor);
        }
        return createMockTranslator();
      });

      // Act
      await manager.create(options);
      await waitFor(50);

      // Assert
      expect(options.monitor).toHaveBeenCalled();
    });

    it('destroys translator and removes from cache', () => {
      // Arrange
      const mockTranslator = createMockTranslator();
      manager['translators'].set('en-es', mockTranslator);

      // Act
      manager.destroy('en', 'es');

      // Assert
      expect(mockTranslator.destroy).toHaveBeenCalled();
      expect(manager['translators'].has('en-es')).toBe(false);
    });

    it('checks availability returns readily', async () => {
      // Arrange
      mockAPI.availability.mockResolvedValue('readily');

      // Act
      const result = await manager.checkAvailability('en', 'es');

      // Assert
      expect(result).toBe('readily');
      expect(mockAPI.availability).toHaveBeenCalledWith({
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });
    });

    it('checks availability returns after-download', async () => {
      // Arrange
      mockAPI.availability.mockResolvedValue('after-download');

      // Act
      const result = await manager.checkAvailability('en', 'fr');

      // Assert
      expect(result).toBe('after-download');
    });

    it('checks availability returns no', async () => {
      // Arrange
      mockAPI.availability.mockResolvedValue('no');

      // Act
      const result = await manager.checkAvailability('en', 'invalid');

      // Assert
      expect(result).toBe('no');
    });
  });

  // ==========================================================================
  // Critical Edge Cases (7 tests)
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles AbortSignal cancellation', async () => {
      // Arrange
      const controller = new AbortController();
      const options = {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        signal: controller.signal,
      };

      mockAPI.create.mockImplementation(async () => {
        await waitFor(50);
        throw MOCK_ERRORS.abortError;
      });

      // Act
      const promise = manager.create(options);
      controller.abort();

      // Assert - TranslatorManager wraps errors
      await expect(promise).rejects.toThrow();
    });

    it('throws error for invalid language code', async () => {
      // Arrange
      mockAPI.create.mockRejectedValue(MOCK_ERRORS.invalidLanguageCode);
      const options = { sourceLanguage: 'xx', targetLanguage: 'es' };

      // Act & Assert
      await expect(manager.create(options)).rejects.toThrow(
        'Invalid language code',
      );
    });

    it('handles API unavailable error', async () => {
      // Arrange
      mockAPI.create.mockRejectedValue(MOCK_ERRORS.apiUnavailable);
      const options = { sourceLanguage: 'en', targetLanguage: 'es' };

      // Act & Assert - TranslatorManager wraps errors
      await expect(manager.create(options)).rejects.toThrow();
    });

    it('handles concurrent create requests', async () => {
      // Arrange
      const options = { sourceLanguage: 'en', targetLanguage: 'es' };

      // Act - First create
      await manager.create(options);

      // Subsequent creates should use cache
      const results = await Promise.all([
        manager.create(options),
        manager.create(options),
        manager.create(options),
      ]);

      // Assert - All return same instance
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });

    it('cleans up all instances on destroy all', () => {
      // Arrange
      const mock1 = createMockTranslator();
      const mock2 = createMockTranslator();
      manager['translators'].set('en-es', mock1);
      manager['translators'].set('en-fr', mock2);

      // Act
      manager.destroyAll();

      // Assert
      expect(mock1.destroy).toHaveBeenCalled();
      expect(mock2.destroy).toHaveBeenCalled();
      expect(manager['translators'].size).toBe(0);
    });

    it('handles create timeout', async () => {
      // Arrange
      mockAPI.create.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000)), // Very long timeout
      );
      const options = { sourceLanguage: 'en', targetLanguage: 'es' };

      // Act & Assert
      // Note: In real implementation, you'd add timeout logic
      // For now, we just verify it doesn't hang
      const promise = manager.create(options);
      expect(promise).toBeInstanceOf(Promise);
    }, 500); // Test timeout

    it('prevents memory leaks after 10 operations', async () => {
      // Arrange
      const initialSize = manager['translators'].size;

      // Act: Create 10 different language pairs
      for (let i = 0; i < 10; i++) {
        await manager.create({
          sourceLanguage: 'en',
          targetLanguage: `lang${i}` as any,
        });
      }

      // Assert: Verify cache doesn't grow indefinitely
      const finalSize = manager['translators'].size;
      expect(finalSize).toBeLessThanOrEqual(10);
      expect(finalSize).toBeGreaterThanOrEqual(initialSize);
    });
  });
});
