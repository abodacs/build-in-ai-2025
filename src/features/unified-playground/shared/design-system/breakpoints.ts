/**
 * Responsive Design Breakpoints for Chrome AI DevBench
 * Mobile-first approach with consistent breakpoint system
 */

export const breakpoints = {
  // Base breakpoints
  xs: '480px', // Extra small devices (phones)
  sm: '640px', // Small devices (large phones)
  md: '768px', // Medium devices (tablets)
  lg: '1024px', // Large devices (laptops)
  xl: '1280px', // Extra large devices (desktops)
  '2xl': '1536px', // 2X large devices (large desktops)
} as const;

// Breakpoint ranges for more specific targeting
export const breakpointRanges = {
  mobile: `(max-width: ${breakpoints.md})`,
  tablet: `(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`,
  desktop: `(min-width: ${breakpoints.lg})`,
  'mobile-only': `(max-width: calc(${breakpoints.md} - 1px))`,
  'tablet-only': `(min-width: ${breakpoints.md}) and (max-width: calc(${breakpoints.lg} - 1px))`,
  'desktop-only': `(min-width: ${breakpoints.lg})`,
} as const;

// Container max-widths for consistent layout
export const containerSizes = {
  xs: '100%',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px', // Slightly smaller than breakpoint for padding
} as const;

// Grid system configuration
export const gridSystem = {
  columns: 12,
  gutter: {
    xs: '1rem', // 16px
    sm: '1.5rem', // 24px
    md: '2rem', // 32px
    lg: '2.5rem', // 40px
    xl: '3rem', // 48px
  },
  margins: {
    xs: '1rem', // 16px
    sm: '1.5rem', // 24px
    md: '2rem', // 32px
    lg: '3rem', // 48px
    xl: '4rem', // 64px
  },
} as const;

// Utility functions for responsive design
export const mediaQueries = {
  up: (breakpoint: keyof typeof breakpoints) =>
    `@media (min-width: ${breakpoints[breakpoint]})`,

  down: (breakpoint: keyof typeof breakpoints) => {
    const breakpointValues = Object.values(breakpoints);
    const currentIndex = Object.keys(breakpoints).indexOf(breakpoint);
    const nextBreakpoint = breakpointValues[currentIndex];
    return `@media (max-width: calc(${nextBreakpoint} - 1px))`;
  },

  between: (min: keyof typeof breakpoints, max: keyof typeof breakpoints) =>
    `@media (min-width: ${breakpoints[min]}) and (max-width: calc(${breakpoints[max]} - 1px))`,

  only: (breakpoint: keyof typeof breakpoints) => {
    const keys = Object.keys(breakpoints) as Array<keyof typeof breakpoints>;
    const currentIndex = keys.indexOf(breakpoint);
    const nextBreakpoint = keys[currentIndex + 1];

    if (currentIndex === 0 && nextBreakpoint) {
      return `@media (max-width: calc(${breakpoints[nextBreakpoint]} - 1px))`;
    } else if (currentIndex === keys.length - 1) {
      return `@media (min-width: ${breakpoints[breakpoint]})`;
    } else if (nextBreakpoint) {
      return `@media (min-width: ${breakpoints[breakpoint]}) and (max-width: calc(${breakpoints[nextBreakpoint]} - 1px))`;
    }
    return `@media (min-width: ${breakpoints[breakpoint]})`;
  },
} as const;

// Component-specific responsive configurations
export const componentBreakpoints = {
  // Sidebar behavior
  sidebar: {
    mobile: `(max-width: calc(${breakpoints.lg} - 1px))`, // Overlay on mobile/tablet
    desktop: `(min-width: ${breakpoints.lg})`, // Side-by-side on desktop
  },

  // Navigation behavior
  navigation: {
    compact: `(max-width: calc(${breakpoints.md} - 1px))`, // Hamburger menu
    expanded: `(min-width: ${breakpoints.md})`, // Full navigation
  },

  // API playground layout
  playground: {
    stacked: `(max-width: calc(${breakpoints.xl} - 1px))`, // Stack panels
    sideBySide: `(min-width: ${breakpoints.xl})`, // Side-by-side panels
  },

  // Code display
  codeDisplay: {
    scroll: `(max-width: calc(${breakpoints.lg} - 1px))`, // Horizontal scroll
    wrap: `(min-width: ${breakpoints.lg})`, // Text wrapping
  },
} as const;

// Responsive font sizes
export const responsiveFontSizes = {
  'display-xl': {
    xs: '2.25rem', // 36px
    sm: '3rem', // 48px
    md: '3.75rem', // 60px
    lg: '4.5rem', // 72px
  },
  'display-lg': {
    xs: '1.875rem', // 30px
    sm: '2.25rem', // 36px
    md: '3rem', // 48px
    lg: '3.75rem', // 60px
  },
  'display-md': {
    xs: '1.5rem', // 24px
    sm: '1.875rem', // 30px
    md: '2.25rem', // 36px
    lg: '3rem', // 48px
  },
  heading: {
    xs: '1.25rem', // 20px
    sm: '1.5rem', // 24px
    md: '1.875rem', // 30px
    lg: '2.25rem', // 36px
  },
  body: {
    xs: '0.875rem', // 14px
    sm: '1rem', // 16px
    md: '1rem', // 16px
    lg: '1.125rem', // 18px
  },
} as const;

// Responsive spacing
export const responsiveSpacing = {
  section: {
    xs: '2rem', // 32px
    sm: '3rem', // 48px
    md: '4rem', // 64px
    lg: '5rem', // 80px
    xl: '6rem', // 96px
  },
  component: {
    xs: '1rem', // 16px
    sm: '1.5rem', // 24px
    md: '2rem', // 32px
    lg: '2.5rem', // 40px
    xl: '3rem', // 48px
  },
  element: {
    xs: '0.5rem', // 8px
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.25rem', // 20px
    xl: '1.5rem', // 24px
  },
} as const;

// Export all breakpoint utilities
export const responsiveDesign = {
  breakpoints,
  breakpointRanges,
  containerSizes,
  gridSystem,
  mediaQueries,
  componentBreakpoints,
  responsiveFontSizes,
  responsiveSpacing,
} as const;

// Type exports
export type Breakpoint = keyof typeof breakpoints;
export type BreakpointRange = keyof typeof breakpointRanges;
export type ContainerSize = keyof typeof containerSizes;
export type ResponsiveDesign = typeof responsiveDesign;
