/**
 * LanguagePairCache Service
 * LRU cache for translator instances per language pair
 */

import {
  type Translator,
  type CacheEntry,
  type CacheStats,
  type CacheEntryStats,
} from '../types';

/**
 * LanguagePairCache provides LRU caching for translator instances
 *
 * Features:
 * - LRU (Least Recently Used) eviction
 * - TTL (Time To Live) support
 * - Configurable max size
 * - Cache statistics
 */
export class LanguagePairCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private ttl: number;
  private hits: number = 0;
  private misses: number = 0;

  /**
   * Create a new LanguagePairCache
   *
   * @param maxSize - Maximum number of translator instances to cache (default: 10)
   * @param ttl - Time to live in milliseconds (default: 30 minutes)
   */
  constructor(maxSize: number = 10, ttl: number = 30 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Get a translator from cache
   *
   * @param source - Source language code
   * @param target - Target language code
   * @returns Translator instance or null if not found/expired
   */
  get(source: string, target: string): Translator | null {
    const key = this.makeKey(source, target);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check TTL
    const now = Date.now();
    if (now - entry.lastUsed > this.ttl) {
      this.remove(source, target);
      this.misses++;
      return null;
    }

    // Update usage stats
    entry.lastUsed = now;
    entry.useCount++;
    this.hits++;

    return entry.translator;
  }

  /**
   * Add a translator to cache
   *
   * @param source - Source language code
   * @param target - Target language code
   * @param translator - Translator instance
   */
  set(source: string, target: string, translator: Translator): void {
    const key = this.makeKey(source, target);

    // Evict LRU if cache is full and key doesn't exist
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const now = Date.now();
    this.cache.set(key, {
      translator,
      sourceLanguage: source,
      targetLanguage: target,
      createdAt: now,
      lastUsed: now,
      useCount: 1,
    });
  }

  /**
   * Remove a translator from cache
   *
   * @param source - Source language code
   * @param target - Target language code
   */
  remove(source: string, target: string): void {
    const key = this.makeKey(source, target);
    const entry = this.cache.get(key);

    if (entry) {
      try {
        entry.translator.destroy();
      } catch (error) {
        console.error('Error destroying translator:', error);
      }
      this.cache.delete(key);
    }
  }

  /**
   * Check if a translator exists in cache (without updating stats)
   *
   * @param source - Source language code
   * @param target - Target language code
   * @returns True if translator exists and is not expired
   */
  has(source: string, target: string): boolean {
    const key = this.makeKey(source, target);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check TTL
    const now = Date.now();
    if (now - entry.lastUsed > this.ttl) {
      return false;
    }

    return true;
  }

  /**
   * Clear all cached translators
   */
  clear(): void {
    for (const entry of this.cache.values()) {
      try {
        entry.translator.destroy();
      } catch (error) {
        console.error('Error destroying translator:', error);
      }
    }

    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   *
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    const now = Date.now();
    const entries: CacheEntryStats[] = [];

    for (const [key, entry] of this.cache.entries()) {
      entries.push({
        languagePair: key,
        useCount: entry.useCount,
        age: now - entry.createdAt,
      });
    }

    const total = this.hits + this.misses;
    const hitRate = total === 0 ? 0 : (this.hits / total) * 100;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries,
      hitRate,
      hits: this.hits,
      misses: this.misses,
    };
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)!;
      try {
        entry.translator.destroy();
      } catch (error) {
        console.error('Error destroying translator during eviction:', error);
      }
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Make cache key from language pair
   *
   * @param source - Source language code
   * @param target - Target language code
   * @returns Cache key
   */
  private makeKey(source: string, target: string): string {
    return `${source}→${target}`;
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all cached language pairs
   */
  getLanguagePairs(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.lastUsed > this.ttl) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      const entry = this.cache.get(key)!;
      try {
        entry.translator.destroy();
      } catch (error) {
        console.error('Error destroying expired translator:', error);
      }
      this.cache.delete(key);
    }
  }
}

/**
 * Global singleton instance
 */
export const languagePairCache = new LanguagePairCache();
