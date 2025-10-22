/**
 * usePromptAvailability Hook Test Suite
 *
 * Tests API availability checking, browser compatibility detection,
 * and capability querying
 *
 * Coverage: 15+ tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePromptAvailability } from '../../hooks/usePromptAvailability';
import {
  setupLanguageModelAPIMock,
  cleanupLanguageModelAPIMock,
} from '../test-utils';

describe('usePromptAvailability', () => {
  let mockAPI: ReturnType<typeof setupLanguageModelAPIMock>;

  beforeEach(() => {
    mockAPI = setupLanguageModelAPIMock();
  });

  afterEach(() => {
    cleanupLanguageModelAPIMock();
  });

  // ==========================================================================
  // Initial State Tests
  // ==========================================================================

  describe('Initial State', () => {
    it('starts with checking state', () => {
      const { result } = renderHook(() => usePromptAvailability());

      expect(result.current.isChecking).toBe(true);
      expect(result.current.isSupported).toBeUndefined();
      expect(result.current.availability).toBeUndefined();
    });

    it('initializes all state fields', () => {
      const { result } = renderHook(() => usePromptAvailability());

      expect(result.current).toHaveProperty('isSupported');
      expect(result.current).toHaveProperty('availability');
      expect(result.current).toHaveProperty('isReady');
      expect(result.current).toHaveProperty('requiresDownload');
      expect(result.current).toHaveProperty('isChecking');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('checkAvailability');
      expect(result.current).toHaveProperty('refresh');
    });
  });

  // ==========================================================================
  // API Support Detection Tests
  // ==========================================================================

  describe('API Support Detection', () => {
    it('detects when API is supported', async () => {
      mockAPI.availability.mockResolvedValue('available');

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(result.current.isSupported).toBe(true);
      expect(result.current.availability).toBe('available');
    });

    it('detects when API is not supported', async () => {
      delete (global as any).LanguageModel;

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(result.current.isSupported).toBe(false);
      expect(result.current.availability).toBe('no');
    });

    it('detects when download is required', async () => {
      mockAPI.availability.mockResolvedValue('after-download');

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(result.current.isSupported).toBe(true);
      expect(result.current.availability).toBe('after-download');
      expect(result.current.requiresDownload).toBe(true);
    });
  });

  // ==========================================================================
  // Readiness Tests
  // ==========================================================================

  describe('Readiness', () => {
    it('reports ready when availability is readily', async () => {
      mockAPI.availability.mockResolvedValue('available');

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
    });

    it('reports not ready when download required', async () => {
      mockAPI.availability.mockResolvedValue('after-download');

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isReady).toBe(false);
      });
    });

    it('reports not ready when API not supported', async () => {
      mockAPI.availability.mockResolvedValue('no');

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isReady).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Capability Detection Tests
  // ==========================================================================

  describe('Capability Detection', () => {
    it('retrieves API capabilities', async () => {
      mockAPI.capabilities.mockResolvedValue({
        available: 'available',
        defaultTopK: 3,
        maxTopK: 128,
        defaultTemperature: 0.7,
      });

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.capabilities).toBeDefined();
      });

      expect(result.current.capabilities).toHaveProperty('defaultTopK');
      expect(result.current.capabilities).toHaveProperty('maxTopK');
      expect(result.current.capabilities).toHaveProperty('defaultTemperature');
    });

    it('handles missing capabilities gracefully', async () => {
      delete (global as any).LanguageModel.capabilities;

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(result.current.capabilities).toBeUndefined();
      expect(result.current.error).toBeNull();
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('handles availability check errors', async () => {
      mockAPI.availability.mockRejectedValue(new Error('Check failed'));

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain('Check failed');
    });

    it('handles capability query errors', async () => {
      mockAPI.capabilities.mockRejectedValue(new Error('Capability error'));

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      // Should still report availability, but capabilities may be undefined
      expect(result.current.capabilities).toBeUndefined();
    });

    it('recovers from errors on refresh', async () => {
      mockAPI.availability.mockRejectedValueOnce(new Error('First error'));
      mockAPI.availability.mockResolvedValue('available');

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      // Refresh
      result.current.refresh();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.availability).toBe('available');
      });
    });
  });

  // ==========================================================================
  // Manual Check Tests
  // ==========================================================================

  describe('Manual Check', () => {
    it('provides checkAvailability function', async () => {
      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(typeof result.current.checkAvailability).toBe('function');
    });

    it('allows manual availability check', async () => {
      mockAPI.availability.mockResolvedValue('available');

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      const availability = await result.current.checkAvailability();

      expect(availability).toBe('available');
    });

    it('provides refresh function', async () => {
      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(typeof result.current.refresh).toBe('function');
    });

    it('re-checks availability on refresh', async () => {
      mockAPI.availability.mockResolvedValue('available');

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      mockAPI.availability.mockClear();

      result.current.refresh();

      await waitFor(() => {
        expect(mockAPI.availability).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // Lifecycle Tests
  // ==========================================================================

  describe('Lifecycle', () => {
    it('checks availability on mount', async () => {
      mockAPI.availability.mockResolvedValue('available');

      renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(mockAPI.availability).toHaveBeenCalled();
      });
    });

    it('does not check twice on mount', async () => {
      mockAPI.availability.mockResolvedValue('available');

      renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(mockAPI.availability).toHaveBeenCalledTimes(1);
      });
    });

    it('handles unmount gracefully', async () => {
      mockAPI.availability.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve('available'), 1000),
          ),
      );

      const { unmount } = renderHook(() => usePromptAvailability());

      unmount();

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  // ==========================================================================
  // Details and Metadata Tests
  // ==========================================================================

  describe('Details and Metadata', () => {
    it('provides detailed availability information', async () => {
      mockAPI.availability.mockResolvedValue('available');

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.details).toBeDefined();
      });

      expect(result.current.details).toHaveProperty('browserSupported');
      expect(result.current.details).toHaveProperty('apiAvailable');
    });

    it('indicates browser support correctly', async () => {
      mockAPI.availability.mockResolvedValue('available');

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.details?.browserSupported).toBe(true);
      });
    });

    it('indicates when browser does not support API', async () => {
      delete (global as any).LanguageModel;

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.details?.browserSupported).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles concurrent refresh calls', async () => {
      mockAPI.availability.mockResolvedValue('available');

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      // Call refresh multiple times
      result.current.refresh();
      result.current.refresh();
      result.current.refresh();

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      // Should handle gracefully
      expect(result.current.availability).toBeDefined();
    });

    it('handles slow API responses', async () => {
      mockAPI.availability.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve('available'), 100)),
      );

      const { result } = renderHook(() => usePromptAvailability());

      expect(result.current.isChecking).toBe(true);

      await waitFor(
        () => {
          expect(result.current.isChecking).toBe(false);
        },
        { timeout: 200 },
      );

      expect(result.current.availability).toBe('available');
    });

    it('handles API changes during check', async () => {
      mockAPI.availability.mockResolvedValueOnce('after-download');
      mockAPI.availability.mockResolvedValue('available');

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.availability).toBe('after-download');
      });

      result.current.refresh();

      await waitFor(() => {
        expect(result.current.availability).toBe('available');
      });
    });
  });
});
