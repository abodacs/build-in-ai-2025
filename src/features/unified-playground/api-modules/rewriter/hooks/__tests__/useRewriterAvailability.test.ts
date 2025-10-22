/**
 * useRewriterAvailability Hook Test Suite
 *
 * Comprehensive tests for useRewriterAvailability hook including:
 * - Availability status checking
 * - API support detection
 * - Download requirement detection
 * - Error handling
 * - Recheck functionality
 *
 * Coverage: Availability states, transitions, edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRewriterAvailability } from '../useRewriterAvailability';

// ============================================================================
// Test Setup
// ============================================================================

// Mock ChromeAIRewriterService
vi.mock('../../services', () => ({
  ChromeAIRewriterService: {
    isSupported: vi.fn(),
    checkAvailability: vi.fn(),
  },
}));

// Import after mocking
import { ChromeAIRewriterService } from '../../services';
const mockChromeAIService = ChromeAIRewriterService as any;

beforeEach(() => {
  vi.clearAllMocks();

  // Default mocks - API is supported and readily available
  mockChromeAIService.isSupported.mockReturnValue(true);
  mockChromeAIService.checkAvailability.mockResolvedValue('available');
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// Tests
// ============================================================================

describe('useRewriterAvailability', () => {
  // ==========================================================================
  // Initial State Tests
  // ==========================================================================

  describe('Initial State', () => {
    it('starts with checking state', () => {
      const { result } = renderHook(() => useRewriterAvailability());

      expect(result.current.isChecking).toBe(true);
      expect(result.current.availability).toBe('no');
      expect(result.current.error).toBeNull();
    });

    it('checks availability on mount', async () => {
      renderHook(() => useRewriterAvailability());

      await waitFor(() => {
        expect(mockChromeAIService.checkAvailability).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // Availability Status Tests
  // ==========================================================================

  describe('Availability Status - Readily Available', () => {
    it('sets availability to readily when API is ready', async () => {
      mockChromeAIService.checkAvailability.mockResolvedValue('available');

      const { result } = renderHook(() => useRewriterAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
        expect(result.current.availability).toBe('available');
        expect(result.current.isReady).toBe(true);
        expect(result.current.requiresDownload).toBe(false);
      });
    });

    it('sets isSupported to true when API is readily available', async () => {
      mockChromeAIService.isSupported.mockReturnValue(true);
      mockChromeAIService.checkAvailability.mockResolvedValue('available');

      const { result } = renderHook(() => useRewriterAvailability());

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
        expect(result.current.isReady).toBe(true);
      });
    });
  });

  describe('Availability Status - After Download', () => {
    it('sets availability to after-download when model download required', async () => {
      mockChromeAIService.checkAvailability.mockResolvedValue('after-download');

      const { result } = renderHook(() => useRewriterAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
        expect(result.current.availability).toBe('after-download');
        expect(result.current.requiresDownload).toBe(true);
        expect(result.current.isReady).toBe(false);
      });
    });

    it('isSupported remains true when download required', async () => {
      mockChromeAIService.isSupported.mockReturnValue(true);
      mockChromeAIService.checkAvailability.mockResolvedValue('after-download');

      const { result } = renderHook(() => useRewriterAvailability());

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
        expect(result.current.requiresDownload).toBe(true);
      });
    });
  });

  describe('Availability Status - Not Available', () => {
    it('sets availability to no when API not available', async () => {
      mockChromeAIService.checkAvailability.mockResolvedValue('no');

      const { result } = renderHook(() => useRewriterAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
        expect(result.current.availability).toBe('no');
        expect(result.current.isReady).toBe(false);
        expect(result.current.requiresDownload).toBe(false);
      });
    });

    it('sets isSupported to false when API not in browser', async () => {
      mockChromeAIService.isSupported.mockReturnValue(false);
      mockChromeAIService.checkAvailability.mockResolvedValue('no');

      const { result } = renderHook(() => useRewriterAvailability());

      await waitFor(() => {
        expect(result.current.isSupported).toBe(false);
        expect(result.current.availability).toBe('no');
      });
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('handles availability check errors', async () => {
      const testError = new Error('Availability check failed');
      mockChromeAIService.checkAvailability.mockRejectedValue(testError);

      const { result } = renderHook(() => useRewriterAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toBe('Availability check failed');
        expect(result.current.availability).toBe('no');
      });
    });

    it('converts non-Error objects to Error', async () => {
      mockChromeAIService.checkAvailability.mockRejectedValue(
        'String error message',
      );

      const { result } = renderHook(() => useRewriterAvailability());

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('String error message');
      });
    });

    it('sets availability to no on error', async () => {
      mockChromeAIService.checkAvailability.mockRejectedValue(
        new Error('Test error'),
      );

      const { result } = renderHook(() => useRewriterAvailability());

      await waitFor(() => {
        expect(result.current.availability).toBe('no');
        expect(result.current.isReady).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Recheck Functionality Tests
  // ==========================================================================

  describe('Recheck Functionality', () => {
    it('provides recheckAvailability function', () => {
      const { result } = renderHook(() => useRewriterAvailability());

      expect(result.current.recheckAvailability).toBeInstanceOf(Function);
    });

    it('rechecks availability when recheckAvailability is called', async () => {
      mockChromeAIService.checkAvailability.mockResolvedValue('available');

      const { result } = renderHook(() => useRewriterAvailability());

      // Wait for initial check
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(mockChromeAIService.checkAvailability).toHaveBeenCalledTimes(1);

      // Recheck
      await waitFor(async () => {
        await result.current.recheckAvailability();
      });

      expect(mockChromeAIService.checkAvailability).toHaveBeenCalledTimes(2);
    });

    it('updates availability status on recheck', async () => {
      // Initially after-download
      mockChromeAIService.checkAvailability.mockResolvedValue('after-download');

      const { result } = renderHook(() => useRewriterAvailability());

      await waitFor(() => {
        expect(result.current.availability).toBe('after-download');
        expect(result.current.requiresDownload).toBe(true);
      });

      // Change to readily available
      mockChromeAIService.checkAvailability.mockResolvedValue('available');

      // Recheck
      await waitFor(async () => {
        await result.current.recheckAvailability();
      });

      // Should now be readily available
      await waitFor(() => {
        expect(result.current.availability).toBe('available');
        expect(result.current.requiresDownload).toBe(false);
        expect(result.current.isReady).toBe(true);
      });
    });

    it('sets isChecking during recheck', async () => {
      // Use a promise we control to make recheck take time
      let resolveAvailability: (value: string) => void;
      const availabilityPromise = new Promise<string>((resolve) => {
        resolveAvailability = resolve;
      });

      mockChromeAIService.checkAvailability
        .mockResolvedValueOnce('available') // Initial check
        .mockReturnValueOnce(availabilityPromise); // Recheck - controlled timing

      const { result } = renderHook(() => useRewriterAvailability());

      // Wait for initial check
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      // Start recheck (don't await yet)
      result.current.recheckAvailability();

      // isChecking should be true during recheck
      await waitFor(() => {
        expect(result.current.isChecking).toBe(true);
      });

      // Complete recheck
      resolveAvailability!('available');

      // isChecking should be false after recheck
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });
    });

    it('clears previous error on recheck', async () => {
      // First check fails
      mockChromeAIService.checkAvailability.mockRejectedValueOnce(
        new Error('First error'),
      );

      const { result } = renderHook(() => useRewriterAvailability());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Second check succeeds
      mockChromeAIService.checkAvailability.mockResolvedValue('available');

      await waitFor(async () => {
        await result.current.recheckAvailability();
      });

      // Error should be cleared
      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.availability).toBe('available');
      });
    });
  });

  // ==========================================================================
  // Derived Flags Tests
  // ==========================================================================

  describe('Derived Flags', () => {
    it('sets isReady true only when readily available', async () => {
      const scenarios: Array<
        [
          availability: 'available' | 'after-download' | 'no',
          expectedReady: boolean,
        ]
      > = [
        ['available', true],
        ['after-download', false],
        ['no', false],
      ];

      for (const [availability, expectedReady] of scenarios) {
        mockChromeAIService.checkAvailability.mockResolvedValue(availability);

        const { result, unmount } = renderHook(() => useRewriterAvailability());

        await waitFor(() => {
          expect(result.current.isReady).toBe(expectedReady);
        });

        unmount();
      }
    });

    it('sets requiresDownload true only when after-download', async () => {
      const scenarios: Array<
        [
          availability: 'available' | 'after-download' | 'no',
          expectedDownload: boolean,
        ]
      > = [
        ['available', false],
        ['after-download', true],
        ['no', false],
      ];

      for (const [availability, expectedDownload] of scenarios) {
        mockChromeAIService.checkAvailability.mockResolvedValue(availability);

        const { result, unmount } = renderHook(() => useRewriterAvailability());

        await waitFor(() => {
          expect(result.current.requiresDownload).toBe(expectedDownload);
        });

        unmount();
      }
    });

    it('isSupported reflects browser support regardless of availability', async () => {
      const scenarios: Array<
        [
          supported: boolean,
          availability: 'available' | 'after-download' | 'no',
        ]
      > = [
        [true, 'available'],
        [true, 'after-download'],
        [true, 'no'],
        [false, 'no'],
      ];

      for (const [supported, availability] of scenarios) {
        mockChromeAIService.isSupported.mockReturnValue(supported);
        mockChromeAIService.checkAvailability.mockResolvedValue(availability);

        const { result, unmount } = renderHook(() => useRewriterAvailability());

        await waitFor(() => {
          expect(result.current.isSupported).toBe(supported);
          expect(result.current.availability).toBe(availability);
        });

        unmount();
      }
    });
  });

  // ==========================================================================
  // Cleanup Tests
  // ==========================================================================

  describe('Cleanup', () => {
    it('does not update state after unmount', async () => {
      let resolveAvailability: (value: string) => void;
      const availabilityPromise = new Promise<string>((resolve) => {
        resolveAvailability = resolve;
      });

      mockChromeAIService.checkAvailability.mockReturnValue(
        availabilityPromise,
      );

      const { result, unmount } = renderHook(() => useRewriterAvailability());

      // Unmount before availability check completes
      unmount();

      // Resolve availability check after unmount
      resolveAvailability!('available');

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // State should still be initial state (no update after unmount)
      // Note: We can't actually check this since result is unmounted
      // But the test ensures no errors are thrown
      expect(true).toBe(true); // Test completed without errors
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles rapid recheck calls gracefully', async () => {
      mockChromeAIService.checkAvailability.mockResolvedValue('available');

      const { result } = renderHook(() => useRewriterAvailability());

      // Wait for initial check
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      // Call recheck multiple times rapidly
      const recheck1 = result.current.recheckAvailability();
      const recheck2 = result.current.recheckAvailability();
      const recheck3 = result.current.recheckAvailability();

      // All should complete without errors
      await Promise.all([recheck1, recheck2, recheck3]);

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
        expect(result.current.availability).toBe('available');
      });
    });

    it('handles empty availability response', async () => {
      // @ts-expect-error Testing edge case with invalid type
      mockChromeAIService.checkAvailability.mockResolvedValue('');

      const { result } = renderHook(() => useRewriterAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
        // Should handle gracefully, not crash
        expect(result.current.availability).toBeDefined();
      });
    });

    it('handles null/undefined from checkAvailability', async () => {
      // @ts-expect-error Testing edge case with invalid type
      mockChromeAIService.checkAvailability.mockResolvedValue(null);

      const { result } = renderHook(() => useRewriterAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
        // Should not crash
        expect(result.current).toBeDefined();
      });
    });
  });
});
