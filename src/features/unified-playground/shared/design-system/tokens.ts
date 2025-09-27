/**
 * Design Tokens for Chrome AI DevBench
 * Optimized for 30-second wow factor with immediate visual impact
 */

// Color System - Designed for stunning visual impact
export const colors = {
  // Brand Colors - Chrome AI DevBench Identity
  brand: {
    primary: 'hsl(217, 91%, 60%)', // Vibrant blue that pops
    secondary: 'hsl(272, 51%, 54%)', // Rich purple for depth
    accent: 'hsl(142, 70%, 49%)', // Fresh green for success states
  },

  // AI-Specific Colors - Visual storytelling
  ai: {
    summarizer: 'hsl(217, 91%, 60%)', // Blue - intelligence
    translator: 'hsl(142, 70%, 49%)', // Green - connection
    writer: 'hsl(272, 51%, 54%)', // Purple - creativity
    rewriter: 'hsl(45, 93%, 58%)', // Gold - transformation
    proofreader: 'hsl(10, 79%, 63%)', // Orange - precision
    prompt: 'hsl(300, 76%, 72%)', // Magenta - versatility
    languageDetection: 'hsl(195, 100%, 50%)', // Cyan - analysis
  },

  // Status Colors - Immediate feedback
  status: {
    success: 'hsl(142, 70%, 49%)',
    warning: 'hsl(45, 93%, 58%)',
    error: 'hsl(0, 84%, 60%)',
    info: 'hsl(217, 91%, 60%)',
    loading: 'hsl(272, 51%, 54%)',
  },

  // Semantic Colors - Context awareness
  semantic: {
    background: {
      light: 'hsl(0, 0%, 100%)',
      dark: 'hsl(224, 15%, 8%)', // Rich dark background
    },
    surface: {
      light: 'hsl(0, 0%, 98%)',
      dark: 'hsl(224, 15%, 12%)',
    },
    border: {
      light: 'hsl(220, 13%, 91%)',
      dark: 'hsl(224, 15%, 20%)',
    },
  },
} as const;

// Typography System - Hierarchy and readability
export const typography = {
  fontFamily: {
    sans: [
      'Inter Variable',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ],
    mono: [
      'JetBrains Mono Variable',
      'JetBrains Mono',
      'Fira Code',
      'Cascadia Code',
      'Source Code Pro',
      'Monaco',
      'Consolas',
      'monospace',
    ],
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },

  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

// Spacing System - Rhythm and harmony
export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
} as const;

// Border Radius - Soft, modern feel
export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// Elevation System - Depth and hierarchy
export const elevation = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  glow: '0 0 20px rgb(99 102 241 / 0.3)', // Special glow effect
} as const;

// Z-Index System - Layering management
export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modal: '1040',
  popover: '1050',
  tooltip: '1060',
  toast: '1070',
} as const;

// Breakpoints - Responsive design
export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Animation Timing - Smooth, natural motion
export const timing = {
  instant: '0ms',
  fast: '150ms',
  normal: '250ms',
  slow: '500ms',
  slower: '750ms',
} as const;

// Easing Functions - Natural motion curves
export const easing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Grid System - Layout structure
export const grid = {
  columns: 12,
  gutter: spacing[6],
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1400px',
  },
} as const;

// Component Variants - Consistent sizing
export const componentSizes = {
  xs: {
    height: '1.5rem', // 24px
    padding: `${spacing[1]} ${spacing[2]}`, // 4px 8px
    fontSize: typography.fontSize.xs,
  },
  sm: {
    height: '2rem', // 32px
    padding: `${spacing[2]} ${spacing[3]}`, // 8px 12px
    fontSize: typography.fontSize.sm,
  },
  md: {
    height: '2.5rem', // 40px
    padding: `${spacing[2]} ${spacing[4]}`, // 8px 16px
    fontSize: typography.fontSize.base,
  },
  lg: {
    height: '3rem', // 48px
    padding: `${spacing[3]} ${spacing[5]}`, // 12px 20px
    fontSize: typography.fontSize.lg,
  },
  xl: {
    height: '3.5rem', // 56px
    padding: `${spacing[4]} ${spacing[6]}`, // 16px 24px
    fontSize: typography.fontSize.xl,
  },
} as const;

// Export all tokens as a unified system
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  elevation,
  zIndex,
  breakpoints,
  timing,
  easing,
  grid,
  componentSizes,
} as const;

// Type exports for TypeScript support
export type ColorTokens = typeof colors;
export type TypographyTokens = typeof typography;
export type SpacingTokens = typeof spacing;
export type BorderRadiusTokens = typeof borderRadius;
export type ElevationTokens = typeof elevation;
export type ZIndexTokens = typeof zIndex;
export type BreakpointTokens = typeof breakpoints;
export type TimingTokens = typeof timing;
export type EasingTokens = typeof easing;
export type GridTokens = typeof grid;
export type ComponentSizeTokens = typeof componentSizes;
export type DesignTokens = typeof designTokens;
