/**
 * useTranslatorAvailability Hook Test Suite
 *
 * Tests availability checking hook with caching and status updates
 *
 * Coverage: 10 tests (6 happy path + 4 edge cases)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTranslatorAvailability } from '../../hooks/useTranslatorAvailability';
import {
  setupTranslatorAPIMock,
  cleanupTranslatorAPIMock,
} from '../test-utils';

describe('useTranslatorAvailability', () => {
  let mockAPI: ReturnType<typeof setupTranslatorAPIMock>;

  beforeEach(() => {
    mockAPI = setupTranslatorAPIMock();
    vi.clearAllMocks();
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanupTranslatorAPIMock();
    sessionStorage.clear();
  });

  // ==========================================================================
  // Happy Path Tests (6 tests)
  // ==========================================================================

  describe('Happy Path', () => {
    it('checks availability on mount', async () => {
      // Arrange
      mockAPI.availability.mockResolvedValue('available');

      // Act
      const { result } = renderHook(() =>
        useTranslatorAvailability('en', 'es'),
      );

      // Assert
      await waitFor(() => {
        expect(mockAPI.availability).toHaveBeenCalledWith({
          sourceLanguage: 'en',
          targetLanguage: 'es',
        });
        expect(result.current.availability).toBe('available');
        expect(result.current.isChecking).toBe(false);
      });
    });

    it('returns readily status for available pair', async () => {
      // Arrange
      mockAPI.availability.mockResolvedValue('available');

      // Act
      const { result } = renderHook(() =>
        useTranslatorAvailability('en', 'es'),
      );

      // Assert
      await waitFor(() => {
        expect(result.current.availability).toBe('available');
      });
    });

    it('returns after-download status', async () => {
      // Arrange
      mockAPI.availability.mockResolvedValue('after-download');

      // Act
      const { result } = renderHook(() =>
        useTranslatorAvailability('en', 'fr'),
      );

      // Assert
      await waitFor(() => {
        expect(result.current.availability).toBe('after-download');
      });
    });

    it('returns no status for unsupported pair', async () => {
      // Arrange
      mockAPI.availability.mockResolvedValue('no');

      // Act
      const { result } = renderHook(() =>
        useTranslatorAvailability('en', 'invalid' as any),
      );

      // Assert
      await waitFor(() => {
        expect(result.current.availability).toBe('no');
      });
    });

    it('provides recheck function', async () => {
      // Arrange
      mockAPI.availability.mockResolvedValue('available');

      // Act
      const { result } = renderHook(() =>
        useTranslatorAvailability('en', 'es'),
      );

      // Assert
      await waitFor(() => {
        expect(result.current.recheck).toBeInstanceOf(Function);
      });
    });

    it('caches availability result in sessionStorage', async () => {
      // Arrange
      mockAPI.availability.mockResolvedValue('available');

      // Act
      const { result } = renderHook(() =>
        useTranslatorAvailability('en', 'es'),
      );

      // Assert
      await waitFor(() => {
        expect(result.current.availability).toBe('available');
      });

      // Check sessionStorage has cached value
      const cachedValue = sessionStorage.getItem(
        'translator_availability_en_es',
      );
      expect(cachedValue).toBeTruthy();
      const parsed = JSON.parse(cachedValue!);
      expect(parsed.status).toBe('available');
    });
  });

  // ==========================================================================
  // Edge Cases (4 tests)
  // ==========================================================================

  describe('Edge Cases', () => {
    it('uses cached result on second mount', async () => {
      // Arrange
      mockAPI.availability.mockResolvedValue('available');

      // First mount
      const { unmount } = renderHook(() =>
        useTranslatorAvailability('en', 'es'),
      );

      await waitFor(() => {
        expect(mockAPI.availability).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Act - Second mount should use cache
      const { result } = renderHook(() =>
        useTranslatorAvailability('en', 'es'),
      );

      // Assert - Should have cached value immediately without calling API again
      expect(result.current.availability).toBe('available');
      // May call API in background, but result should be from cache
    });

    it('recheck forces new availability check skipping cache', async () => {
      // Arrange
      mockAPI.availability
        .mockResolvedValueOnce('available')
        .mockResolvedValueOnce('after-download');

      // Act
      const { result } = renderHook(() =>
        useTranslatorAvailability('en', 'es'),
      );

      await waitFor(() => {
        expect(result.current.availability).toBe('available');
      });

      // Act - Recheck
      result.current.recheck();

      // Assert - Should get new value
      await waitFor(() => {
        expect(result.current.availability).toBe('after-download');
      });
    });

    it('handles availability check error', async () => {
      // Arrange
      mockAPI.availability.mockRejectedValue(new Error('Check failed'));

      // Act
      const { result } = renderHook(() =>
        useTranslatorAvailability('en', 'es'),
      );

      // Assert
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
        expect(result.current.availability).toBe('no'); // Falls back to 'no'
      });
    });

    it('updates when language pair changes', async () => {
      // Arrange
      mockAPI.availability.mockResolvedValue('available');

      // Act
      const { result, rerender } = renderHook(
        ({ source, target }) => useTranslatorAvailability(source, target),
        { initialProps: { source: 'en' as const, target: 'es' as const } },
      );

      await waitFor(() => {
        expect(result.current.availability).toBe('available');
      });

      // Change languages
      mockAPI.availability.mockResolvedValue('after-download');
      rerender({ source: 'en' as const, target: 'fr' as const });

      // Assert
      await waitFor(() => {
        expect(result.current.availability).toBe('after-download');
      });
    });
  });
});
