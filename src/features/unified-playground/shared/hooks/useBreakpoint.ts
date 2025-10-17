/**
 * useBreakpoint Hook
 *
 * Provides programmatic access to current responsive breakpoint.
 * Returns semantic breakpoint names for developer-friendly conditional logic.
 *
 * @module shared/hooks/useBreakpoint
 *
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint();
 *
 * // Conditional rendering
 * if (breakpoint === 'mobile') {
 *   return <MobileLayout />;
 * }
 *
 * // Conditional logic
 * const columns = breakpoint === 'desktop' ? 3 : 1;
 * ```
 */

import { useState, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Semantic breakpoint names aligned with Tailwind CSS breakpoints
 */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

/**
 * Breakpoint configuration with pixel values
 */
interface BreakpointConfig {
  mobile: { min: number; max: number };
  tablet: { min: number; max: number };
  desktop: { min: number; max: number };
  wide: { min: number };
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint definitions matching Tailwind CSS defaults
 * - mobile: 0-767px (base, sm: 640px included)
 * - tablet: 768-1023px (md: 768px)
 * - desktop: 1024-1535px (lg: 1024px, xl: 1280px)
 * - wide: 1536px+ (2xl: 1536px)
 */
const BREAKPOINTS: BreakpointConfig = {
  mobile: { min: 0, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: 1535 },
  wide: { min: 1536 },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determines current breakpoint based on window width
 */
function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.wide.min) {
    return 'wide';
  }
  if (width >= BREAKPOINTS.desktop.min && width <= BREAKPOINTS.desktop.max) {
    return 'desktop';
  }
  if (width >= BREAKPOINTS.tablet.min && width <= BREAKPOINTS.tablet.max) {
    return 'tablet';
  }
  return 'mobile';
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook that returns the current responsive breakpoint
 *
 * Features:
 * - SSR-safe (returns 'desktop' as default for server-side rendering)
 * - Debounced resize handling for performance
 * - Automatic cleanup
 * - Type-safe return value
 *
 * @returns Current breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide'
 */
export function useBreakpoint(): Breakpoint {
  // Initialize with 'desktop' for SSR compatibility
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    // Only access window in browser environment
    if (typeof window === 'undefined') {
      return 'desktop';
    }
    return getCurrentBreakpoint(window.innerWidth);
  });

  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined') {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    /**
     * Debounced resize handler
     * Waits 150ms after last resize event before updating breakpoint
     * This prevents excessive re-renders during window resizing
     */
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newBreakpoint = getCurrentBreakpoint(window.innerWidth);
        setBreakpoint((prevBreakpoint) => {
          // Only update if breakpoint actually changed
          return newBreakpoint !== prevBreakpoint
            ? newBreakpoint
            : prevBreakpoint;
        });
      }, 150);
    };

    // Set initial breakpoint
    setBreakpoint(getCurrentBreakpoint(window.innerWidth));

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return breakpoint;
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Returns true if current breakpoint is mobile
 * @example const isMobile = useIsMobile(); // true on phones
 */
export function useIsMobile(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'mobile';
}

/**
 * Returns true if current breakpoint is tablet or smaller
 * @example const isTabletOrSmaller = useIsTabletOrSmaller();
 */
export function useIsTabletOrSmaller(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'mobile' || breakpoint === 'tablet';
}

/**
 * Returns true if current breakpoint is desktop or larger
 * @example const isDesktop = useIsDesktop();
 */
export function useIsDesktop(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'desktop' || breakpoint === 'wide';
}

// ============================================================================
// Exports
// ============================================================================

export default useBreakpoint;
