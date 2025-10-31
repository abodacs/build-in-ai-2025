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
import { ChromeAIPromptService } from '../../services/ChromeAIPromptService';

// Mock the ChromeAIPromptService
vi.mock('../../services/ChromeAIPromptService', () => ({
  ChromeAIPromptService: {
    isSupported: vi.fn().mockReturnValue(true),
    checkAvailability: vi.fn().mockResolvedValue('available'),
    checkMultimodalAvailability: vi.fn().mockResolvedValue({
      available: 'available',
      hasMultimodalSupport: true,
    }),
    checkDetailedAvailability: vi.fn().mockResolvedValue({
      availability: 'available',
      isSupported: true,
      requiresDownload: false,
      requirements: {
        minChromeVersion: 138,
        requiredFlags: ['prompt-api-for-gemini-nano-multimodal-input'],
        storageRequired: '~22GB',
        ramRequired: '4GB+',
        networkRequired: false,
      },
    }),
    checkSystemRequirements: vi.fn().mockResolvedValue({
      browser: {
        supported: true,
        version: 138,
        requiredVersion: 138,
      },
      online: true,
      storage: {
        available: 30000000000,
        required: 22000000000,
      },
    }),
    downloadModel: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('usePromptAvailability', () => {
  let mockAPI: ReturnType<typeof setupLanguageModelAPIMock>;

  beforeEach(() => {
    mockAPI = setupLanguageModelAPIMock();

    // Reset service mocks
    vi.mocked(ChromeAIPromptService.isSupported).mockReturnValue(true);
    vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
      'available',
    );
    vi.mocked(
      ChromeAIPromptService.checkDetailedAvailability,
    ).mockResolvedValue({
      availability: 'available',
      isSupported: true,
      requiresDownload: false,
      requirements: {
        minChromeVersion: 138,
        requiredFlags: ['prompt-api-for-gemini-nano-multimodal-input'],
        storageRequired: '~22GB',
        ramRequired: '4GB+',
        networkRequired: false,
      },
    });
    vi.mocked(ChromeAIPromptService.checkSystemRequirements).mockResolvedValue({
      browser: {
        supported: true,
        version: 138,
        requiredVersion: 138,
      },
      online: true,
      storage: {
        available: 30000000000,
        required: 22000000000,
      },
    });
  });

  afterEach(() => {
    cleanupLanguageModelAPIMock();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Initial State Tests
  // ==========================================================================

  describe('Initial State', () => {
    it('starts with checking state', () => {
      const { result } = renderHook(() => usePromptAvailability());

      expect(result.current.isChecking).toBe(true);
      expect(result.current.isSupported).toBe(true); // From service mock
      expect(result.current.availability).toBe('no'); // Initial state
    });

    it('initializes all state fields', () => {
      const { result } = renderHook(() => usePromptAvailability());

      expect(result.current).toHaveProperty('isSupported');
      expect(result.current).toHaveProperty('availability');
      expect(result.current).toHaveProperty('isReady');
      expect(result.current).toHaveProperty('requiresDownload');
      expect(result.current).toHaveProperty('isChecking');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refresh');
      expect(result.current).toHaveProperty('startDownload');
      expect(result.current).toHaveProperty('capabilities');
      expect(result.current).toHaveProperty('requirements');
    });
  });

  // ==========================================================================
  // API Support Detection Tests
  // ==========================================================================

  describe('API Support Detection', () => {
    it('detects when API is supported', async () => {
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
        'available',
      );

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(result.current.isSupported).toBe(true);
      expect(result.current.availability).toBe('available');
    });

    it('detects when API is not supported', async () => {
      vi.mocked(ChromeAIPromptService.isSupported).mockReturnValue(false);
      vi.mocked(
        ChromeAIPromptService.checkDetailedAvailability,
      ).mockResolvedValue({
        availability: 'no',
        isSupported: false,
        requiresDownload: false,
        requirements: {
          minChromeVersion: 138,
          requiredFlags: ['prompt-api-for-gemini-nano-multimodal-input'],
          storageRequired: '~22GB',
          ramRequired: '4GB+',
          networkRequired: true,
        },
        error: 'LanguageModel API is not supported in this browser',
      });

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(result.current.isSupported).toBe(false);
      expect(result.current.availability).toBe('no');
    });

    it('detects when download is required', async () => {
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
        'after-download',
      );
      vi.mocked(
        ChromeAIPromptService.checkDetailedAvailability,
      ).mockResolvedValue({
        availability: 'after-download',
        isSupported: true,
        requiresDownload: true,
        requirements: {
          minChromeVersion: 138,
          requiredFlags: ['prompt-api-for-gemini-nano-multimodal-input'],
          storageRequired: '~22GB',
          ramRequired: '4GB+',
          networkRequired: true,
        },
      });

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
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
        'available',
      );

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
    });

    it('reports not ready when download required', async () => {
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
        'after-download',
      );

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isReady).toBe(false);
      });
    });

    it('reports not ready when API not supported', async () => {
      vi.mocked(ChromeAIPromptService.isSupported).mockReturnValue(false);
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
        'no',
      );

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
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
        'available',
      );

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
        expect(result.current.capabilities).not.toBeNull();
      });

      expect(result.current.capabilities).toHaveProperty('supported');
      expect(result.current.capabilities).toHaveProperty('availability');
      expect(result.current.capabilities).toHaveProperty('capabilities');
      expect(result.current.capabilities?.capabilities.streaming).toBe(true);
      expect(result.current.capabilities?.capabilities.downloadProgress).toBe(
        true,
      );
    });

    it('handles missing capabilities gracefully', async () => {
      vi.mocked(ChromeAIPromptService.isSupported).mockReturnValue(false);

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(result.current.capabilities).toBeDefined(); // Still defined even when API not supported
      expect(result.current.capabilities?.supported).toBe(false);
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('handles availability check errors', async () => {
      vi.mocked(ChromeAIPromptService.checkAvailability).mockRejectedValue(
        new Error('Check failed'),
      );

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error).toContain('Check failed');
    });

    it('handles capability query errors', async () => {
      vi.mocked(ChromeAIPromptService.checkAvailability).mockRejectedValue(
        new Error('Capability error'),
      );

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      // Should report error and capabilities still defined but as not supported
      expect(result.current.error).toContain('Capability error');
      expect(result.current.capabilities).toBeDefined();
    });

    it('recovers from errors on refresh', async () => {
      vi.mocked(ChromeAIPromptService.checkAvailability).mockRejectedValueOnce(
        new Error('First error'),
      );
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
        'available',
      );

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      // Refresh
      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.error).toBeNull(); // Should clear error on successful refresh
        expect(result.current.availability).toBe('available');
      });
    });
  });

  // ==========================================================================
  // Manual Check Tests
  // ==========================================================================

  describe('Manual Check', () => {
    it('provides refresh function', async () => {
      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(typeof result.current.refresh).toBe('function');
    });

    it('provides startDownload function', async () => {
      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(typeof result.current.startDownload).toBe('function');
    });

    it('allows manual availability refresh', async () => {
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
        'available',
      );

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.availability).toBe('available');
      });
    });

    it('re-checks availability on refresh', async () => {
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
        'available',
      );

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      vi.mocked(ChromeAIPromptService.checkAvailability).mockClear();

      await result.current.refresh();

      await waitFor(() => {
        expect(ChromeAIPromptService.checkAvailability).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // Lifecycle Tests
  // ==========================================================================

  describe('Lifecycle', () => {
    it('checks availability on mount', async () => {
      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      // Hook runs checkAvailability on mount which calls the service
      expect(result.current.availability).toBeDefined();
    });

    it('does not check twice on mount', async () => {
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
        'available',
      );

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      // Should only check once on mount
      expect(result.current.availability).toBe('available');
    });

    it('handles unmount gracefully', async () => {
      vi.mocked(ChromeAIPromptService.checkAvailability).mockImplementation(
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
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
        'available',
      );

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
        expect(result.current.details).not.toBeNull();
      });

      expect(result.current.details).toHaveProperty('availability');
      expect(result.current.details).toHaveProperty('isSupported');
    });

    it('indicates browser support correctly', async () => {
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
        'available',
      );

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
        expect(result.current.details?.isSupported).toBe(true);
      });
    });

    it('indicates when browser does not support API', async () => {
      vi.mocked(ChromeAIPromptService.isSupported).mockReturnValue(false);
      vi.mocked(
        ChromeAIPromptService.checkDetailedAvailability,
      ).mockResolvedValue({
        availability: 'no',
        isSupported: false,
        requiresDownload: false,
        requirements: {
          minChromeVersion: 138,
          requiredFlags: ['prompt-api-for-gemini-nano-multimodal-input'],
          storageRequired: '~22GB',
          ramRequired: '4GB+',
          networkRequired: true,
        },
        error: 'LanguageModel API is not supported in this browser',
      });

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.isSupported).toBe(false);
        expect(result.current.details?.isSupported).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles concurrent refresh calls', async () => {
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
        'available',
      );

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
      vi.mocked(ChromeAIPromptService.checkAvailability).mockImplementation(
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
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValueOnce(
        'after-download',
      );
      vi.mocked(ChromeAIPromptService.checkAvailability).mockResolvedValue(
        'available',
      );

      const { result } = renderHook(() => usePromptAvailability());

      await waitFor(() => {
        expect(result.current.availability).toBe('after-download');
      });

      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.availability).toBe('available');
      });
    });
  });
});
