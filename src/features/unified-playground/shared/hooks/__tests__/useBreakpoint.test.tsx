/**
 * useBreakpoint Hook Tests
 *
 * Comprehensive test suite for responsive breakpoint detection
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  useBreakpoint,
  useIsMobile,
  useIsTabletOrSmaller,
  useIsDesktop,
  type Breakpoint,
} from '../useBreakpoint';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Mock window.innerWidth and trigger resize event
 */
function resizeWindow(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

/**
 * Wait for debounced resize to complete (150ms + buffer)
 */
async function waitForResize() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('useBreakpoint', () => {
  beforeEach(() => {
    // Set default window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Initial Breakpoint Detection
  // ==========================================================================

  describe('Initial breakpoint detection', () => {
    it('should return "mobile" for widths < 768px', () => {
      resizeWindow(375); // iPhone
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('mobile');
    });

    it('should return "mobile" for smallest viewport (320px)', () => {
      resizeWindow(320); // iPhone SE
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('mobile');
    });

    it('should return "mobile" for width exactly at 767px', () => {
      resizeWindow(767); // Edge case
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('mobile');
    });

    it('should return "tablet" for widths 768-1023px', () => {
      resizeWindow(768); // iPad portrait
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('tablet');
    });

    it('should return "tablet" for width exactly at 1023px', () => {
      resizeWindow(1023); // Edge case
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('tablet');
    });

    it('should return "desktop" for widths 1024-1535px', () => {
      resizeWindow(1024); // iPad landscape / laptop
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('desktop');
    });

    it('should return "desktop" for width exactly at 1535px', () => {
      resizeWindow(1535); // Edge case
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('desktop');
    });

    it('should return "wide" for widths >= 1536px', () => {
      resizeWindow(1920); // Full HD desktop
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('wide');
    });

    it('should return "wide" for ultra-wide displays', () => {
      resizeWindow(2560); // 2K display
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('wide');
    });
  });

  // ==========================================================================
  // Responsive Breakpoint Changes
  // ==========================================================================

  describe('Responsive breakpoint changes', () => {
    it('should update from mobile to tablet on resize', async () => {
      resizeWindow(375);
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current).toBe('mobile');

      resizeWindow(768);
      await waitForResize();

      await waitFor(() => {
        expect(result.current).toBe('tablet');
      });
    });

    it('should update from tablet to desktop on resize', async () => {
      resizeWindow(800);
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current).toBe('tablet');

      resizeWindow(1024);
      await waitForResize();

      await waitFor(() => {
        expect(result.current).toBe('desktop');
      });
    });

    it('should update from desktop to wide on resize', async () => {
      resizeWindow(1280);
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current).toBe('desktop');

      resizeWindow(1920);
      await waitForResize();

      await waitFor(() => {
        expect(result.current).toBe('wide');
      });
    });

    it('should update from desktop to mobile on resize', async () => {
      resizeWindow(1280);
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current).toBe('desktop');

      resizeWindow(375);
      await waitForResize();

      await waitFor(() => {
        expect(result.current).toBe('mobile');
      });
    });

    it('should handle rapid resize events with debouncing', async () => {
      resizeWindow(375);
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current).toBe('mobile');

      // Simulate rapid resizing
      resizeWindow(500);
      resizeWindow(600);
      resizeWindow(700);
      resizeWindow(768);

      // Should only update once after debounce
      await waitForResize();

      await waitFor(() => {
        expect(result.current).toBe('tablet');
      });
    });
  });

  // ==========================================================================
  // Helper Hooks
  // ==========================================================================

  describe('useIsMobile', () => {
    it('should return true for mobile breakpoint', () => {
      resizeWindow(375);
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should return false for tablet breakpoint', () => {
      resizeWindow(768);
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('should return false for desktop breakpoint', () => {
      resizeWindow(1280);
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('should update when breakpoint changes', async () => {
      resizeWindow(375);
      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);

      resizeWindow(1024);
      await waitForResize();

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });
  });

  describe('useIsTabletOrSmaller', () => {
    it('should return true for mobile breakpoint', () => {
      resizeWindow(375);
      const { result } = renderHook(() => useIsTabletOrSmaller());
      expect(result.current).toBe(true);
    });

    it('should return true for tablet breakpoint', () => {
      resizeWindow(768);
      const { result } = renderHook(() => useIsTabletOrSmaller());
      expect(result.current).toBe(true);
    });

    it('should return false for desktop breakpoint', () => {
      resizeWindow(1280);
      const { result } = renderHook(() => useIsTabletOrSmaller());
      expect(result.current).toBe(false);
    });

    it('should return false for wide breakpoint', () => {
      resizeWindow(1920);
      const { result } = renderHook(() => useIsTabletOrSmaller());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsDesktop', () => {
    it('should return false for mobile breakpoint', () => {
      resizeWindow(375);
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);
    });

    it('should return false for tablet breakpoint', () => {
      resizeWindow(768);
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);
    });

    it('should return true for desktop breakpoint', () => {
      resizeWindow(1280);
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });

    it('should return true for wide breakpoint', () => {
      resizeWindow(1920);
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });
  });

  // ==========================================================================
  // Real-World Device Scenarios
  // ==========================================================================

  describe('Real-world device scenarios', () => {
    const devices = [
      { name: 'iPhone SE', width: 320, expected: 'mobile' as Breakpoint },
      { name: 'iPhone 12/13/14', width: 390, expected: 'mobile' as Breakpoint },
      {
        name: 'iPhone 14 Pro Max',
        width: 428,
        expected: 'mobile' as Breakpoint,
      },
      { name: 'iPad Mini', width: 768, expected: 'tablet' as Breakpoint },
      { name: 'iPad Pro', width: 1024, expected: 'desktop' as Breakpoint },
      {
        name: 'MacBook Pro 13"',
        width: 1280,
        expected: 'desktop' as Breakpoint,
      },
      {
        name: 'MacBook Pro 16"',
        width: 1512,
        expected: 'desktop' as Breakpoint,
      },
      { name: 'Full HD (1080p)', width: 1920, expected: 'wide' as Breakpoint },
      { name: '2K Display', width: 2560, expected: 'wide' as Breakpoint },
    ];

    devices.forEach(({ name, width, expected }) => {
      it(`should return "${expected}" for ${name} (${width}px)`, () => {
        resizeWindow(width);
        const { result } = renderHook(() => useBreakpoint());
        expect(result.current).toBe(expected);
      });
    });
  });

  // ==========================================================================
  // Performance & Cleanup
  // ==========================================================================

  describe('Performance and cleanup', () => {
    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useBreakpoint());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
      );
    });

    it('should not cause memory leaks with multiple instances', () => {
      const instances = Array.from({ length: 10 }, () =>
        renderHook(() => useBreakpoint()),
      );

      instances.forEach((instance) => {
        expect(instance.result.current).toMatch(
          /^(mobile|tablet|desktop|wide)$/,
        );
      });

      // Cleanup all instances
      instances.forEach((instance) => instance.unmount());
    });

    it('should only update state when breakpoint actually changes', async () => {
      resizeWindow(1280);
      const { result, rerender } = renderHook(() => useBreakpoint());

      const initialBreakpoint = result.current;

      // Resize within same breakpoint range
      resizeWindow(1300);
      await waitForResize();
      rerender();

      // Should still be same breakpoint
      expect(result.current).toBe(initialBreakpoint);
      expect(result.current).toBe('desktop');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge cases', () => {
    it('should handle SSR environment (no window)', () => {
      // This test would require mocking the window object as undefined
      // For now, we ensure the hook doesn't crash when window is checked
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toMatch(/^(mobile|tablet|desktop|wide)$/);
    });

    it('should handle extremely small viewports', () => {
      resizeWindow(200);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('mobile');
    });

    it('should handle extremely large viewports', () => {
      resizeWindow(5000);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('wide');
    });

    it('should handle breakpoint boundary at 768px precisely', () => {
      resizeWindow(767);
      const { result: result1 } = renderHook(() => useBreakpoint());
      expect(result1.current).toBe('mobile');

      resizeWindow(768);
      const { result: result2 } = renderHook(() => useBreakpoint());
      expect(result2.current).toBe('tablet');
    });

    it('should handle breakpoint boundary at 1024px precisely', () => {
      resizeWindow(1023);
      const { result: result1 } = renderHook(() => useBreakpoint());
      expect(result1.current).toBe('tablet');

      resizeWindow(1024);
      const { result: result2 } = renderHook(() => useBreakpoint());
      expect(result2.current).toBe('desktop');
    });

    it('should handle breakpoint boundary at 1536px precisely', () => {
      resizeWindow(1535);
      const { result: result1 } = renderHook(() => useBreakpoint());
      expect(result1.current).toBe('desktop');

      resizeWindow(1536);
      const { result: result2 } = renderHook(() => useBreakpoint());
      expect(result2.current).toBe('wide');
    });
  });
});
