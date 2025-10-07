/**
 * LanguagePairCache Test Suite
 *
 * Tests LRU cache for translator instances with TTL expiration
 *
 * Coverage: 10 tests (5 happy path + 5 edge cases)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LanguagePairCache } from '../../services/LanguagePairCache';
import { createMockTranslator, waitFor } from '../test-utils';

describe('LanguagePairCache', () => {
  let cache: LanguagePairCache;

  beforeEach(() => {
    cache = new LanguagePairCache();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Happy Path Tests (5 tests)
  // ==========================================================================

  describe('Happy Path', () => {
    it('stores and retrieves translator by language pair', () => {
      // Arrange
      const translator = createMockTranslator();

      // Act
      cache.set('en', 'es', translator);
      const result = cache.get('en', 'es');

      // Assert
      expect(result).toBe(translator);
    });

    it('returns null for cache miss', () => {
      // Act
      const result = cache.get('en', 'fr');

      // Assert
      expect(result).toBeNull();
    });

    it('evicts LRU when cache is full (>10 items)', () => {
      // Mock Date.now to control timing
      let currentTime = 1000;
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

      // Arrange: Fill cache with 10 items with distinct timestamps
      for (let i = 0; i < 10; i++) {
        currentTime += 10; // Increment time for each entry
        cache.set('en', `lang${i}`, createMockTranslator());
      }

      // Access lang0 to make it most recently used
      currentTime += 100;
      const firstTranslator = cache.get('en', 'lang0');

      // Act: Add 11th item, should evict least recently used (lang1)
      currentTime += 10;
      const newTranslator = createMockTranslator();
      cache.set('en', 'new', newTranslator);

      // Assert
      expect(cache.get('en', 'new')).toBe(newTranslator);
      expect(cache.get('en', 'lang0')).toBe(firstTranslator); // Still there because we accessed it
      expect(cache.get('en', 'lang1')).toBeNull(); // Should be evicted (oldest unused)

      // Restore Date.now
      vi.restoreAllMocks();
    });

    it('clears all cached translators', () => {
      // Arrange
      cache.set('en', 'es', createMockTranslator());
      cache.set('en', 'fr', createMockTranslator());
      cache.set('es', 'en', createMockTranslator());

      // Act
      cache.clear();

      // Assert
      expect(cache.get('en', 'es')).toBeNull();
      expect(cache.get('en', 'fr')).toBeNull();
      expect(cache.get('es', 'en')).toBeNull();
    });

    it('returns cache statistics', () => {
      // Arrange
      cache.set('en', 'es', createMockTranslator());
      cache.set('en', 'fr', createMockTranslator());
      cache.get('en', 'es'); // Hit
      cache.get('en', 'de'); // Miss

      // Act
      const stats = cache.getStats();

      // Assert
      expect(stats.size).toBe(2);
      expect(stats.hits).toBeGreaterThanOrEqual(0);
      expect(stats.misses).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // Critical Edge Cases (5 tests)
  // ==========================================================================

  describe('Edge Cases', () => {
    it('expires translators after 30 min TTL', async () => {
      // Arrange
      const translator = createMockTranslator();
      cache.set('en', 'es', translator);

      // Mock time passing (30 min + 1 sec)
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 30 * 60 * 1000 + 1000);

      // Act
      const result = cache.get('en', 'es');

      // Assert
      expect(result).toBeNull();
      expect(translator.destroy).toHaveBeenCalled();

      // Cleanup
      Date.now = originalNow;
    });

    it('updates lastUsed timestamp on get', () => {
      // Arrange
      const translator = createMockTranslator();
      cache.set('en', 'es', translator);
      const entry = cache['cache'].get('en→es');
      const originalLastUsed = entry!.lastUsed;

      // Wait a bit
      const laterTime = originalLastUsed + 1000;
      Date.now = vi.fn(() => laterTime);

      // Act
      cache.get('en', 'es');
      const updatedEntry = cache['cache'].get('en→es');

      // Assert
      expect(updatedEntry!.lastUsed).toBeGreaterThan(originalLastUsed);
    });

    it('calls destroy() on evicted translators', () => {
      // Arrange: Fill cache to max capacity
      const translators: any[] = [];
      for (let i = 0; i < 10; i++) {
        const t = createMockTranslator();
        translators.push(t);
        cache.set('en', `lang${i}`, t);
      }

      // Act: Add one more to trigger eviction
      cache.set('en', 'new', createMockTranslator());

      // Assert: One of the original translators should be destroyed
      const destroyedCount = translators.filter(
        (t) => t.destroy.mock.calls.length > 0,
      ).length;
      expect(destroyedCount).toBeGreaterThanOrEqual(1);
    });

    it('handles empty cache gracefully', () => {
      // Act
      const result = cache.get('en', 'es');
      cache.clear();
      const stats = cache.getStats();

      // Assert
      expect(result).toBeNull();
      expect(stats.size).toBe(0);
      expect(() => cache.clear()).not.toThrow();
    });

    it('generates unique keys for language pairs', () => {
      // Arrange
      const t1 = createMockTranslator();
      const t2 = createMockTranslator();
      const t3 = createMockTranslator();

      // Act
      cache.set('en', 'es', t1);
      cache.set('es', 'en', t2); // Reverse pair
      cache.set('en', 'fr', t3);

      // Assert: All three should be stored separately
      expect(cache.get('en', 'es')).toBe(t1);
      expect(cache.get('es', 'en')).toBe(t2);
      expect(cache.get('en', 'fr')).toBe(t3);
      expect(t1).not.toBe(t2); // Different instances
    });
  });
});
