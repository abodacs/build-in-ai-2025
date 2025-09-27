/**
 * Elevation and Shadow System for Chrome AI DevBench
 * Creates depth and hierarchy with beautiful shadows
 */

// Base shadow system - Material Design inspired
export const shadows = {
  // No shadow
  none: 'none',

  // Subtle shadows for minimal elevation
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',

  // Standard shadows for most components
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',

  // High elevation shadows for modals and overlays
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',

  // Special effects
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  outline: '0 0 0 3px rgb(59 130 246 / 0.5)', // Focus outline
} as const;

// Colored shadows for AI components
export const coloredShadows = {
  // AI-specific colored shadows
  ai: {
    summarizer: '0 4px 20px rgb(59 130 246 / 0.3)', // Blue
    translator: '0 4px 20px rgb(34 197 94 / 0.3)', // Green
    writer: '0 4px 20px rgb(168 85 247 / 0.3)', // Purple
    rewriter: '0 4px 20px rgb(251 191 36 / 0.3)', // Yellow
    proofreader: '0 4px 20px rgb(239 68 68 / 0.3)', // Red
    prompt: '0 4px 20px rgb(236 72 153 / 0.3)', // Pink
    languageDetection: '0 4px 20px rgb(6 182 212 / 0.3)', // Cyan
  },

  // Status shadows
  status: {
    success: '0 4px 20px rgb(34 197 94 / 0.3)', // Green
    warning: '0 4px 20px rgb(251 191 36 / 0.3)', // Yellow
    error: '0 4px 20px rgb(239 68 68 / 0.3)', // Red
    info: '0 4px 20px rgb(59 130 246 / 0.3)', // Blue
  },

  // Brand shadows
  brand: {
    primary: '0 4px 20px rgb(59 130 246 / 0.3)', // Primary blue
    secondary: '0 4px 20px rgb(168 85 247 / 0.3)', // Secondary purple
    accent: '0 4px 20px rgb(34 197 94 / 0.3)', // Accent green
  },
} as const;

// Interactive shadows for hover states
export const interactiveShadows = {
  // Hover effects
  hover: {
    subtle: '0 4px 12px rgb(0 0 0 / 0.15)',
    medium: '0 8px 25px rgb(0 0 0 / 0.15)',
    strong: '0 15px 35px rgb(0 0 0 / 0.2)',
  },

  // Active/pressed states
  active: {
    inset: 'inset 0 2px 8px rgb(0 0 0 / 0.2)',
    lifted: '0 2px 8px rgb(0 0 0 / 0.15)',
  },

  // Focus states
  focus: {
    ring: '0 0 0 3px rgb(59 130 246 / 0.5)',
    glow: '0 0 0 3px rgb(59 130 246 / 0.5), 0 0 20px rgb(59 130 246 / 0.3)',
  },
} as const;

// Glow effects for special elements
export const glowEffects = {
  // Subtle glows
  subtle: {
    blue: '0 0 10px rgb(59 130 246 / 0.3)',
    green: '0 0 10px rgb(34 197 94 / 0.3)',
    purple: '0 0 10px rgb(168 85 247 / 0.3)',
    yellow: '0 0 10px rgb(251 191 36 / 0.3)',
    red: '0 0 10px rgb(239 68 68 / 0.3)',
    cyan: '0 0 10px rgb(6 182 212 / 0.3)',
    pink: '0 0 10px rgb(236 72 153 / 0.3)',
  },

  // Medium glows
  medium: {
    blue: '0 0 20px rgb(59 130 246 / 0.4), 0 0 40px rgb(59 130 246 / 0.2)',
    green: '0 0 20px rgb(34 197 94 / 0.4), 0 0 40px rgb(34 197 94 / 0.2)',
    purple: '0 0 20px rgb(168 85 247 / 0.4), 0 0 40px rgb(168 85 247 / 0.2)',
    yellow: '0 0 20px rgb(251 191 36 / 0.4), 0 0 40px rgb(251 191 36 / 0.2)',
    red: '0 0 20px rgb(239 68 68 / 0.4), 0 0 40px rgb(239 68 68 / 0.2)',
    cyan: '0 0 20px rgb(6 182 212 / 0.4), 0 0 40px rgb(6 182 212 / 0.2)',
    pink: '0 0 20px rgb(236 72 153 / 0.4), 0 0 40px rgb(236 72 153 / 0.2)',
  },

  // Strong glows for wow factor
  strong: {
    blue: '0 0 30px rgb(59 130 246 / 0.5), 0 0 60px rgb(59 130 246 / 0.3), 0 0 90px rgb(59 130 246 / 0.1)',
    green: '0 0 30px rgb(34 197 94 / 0.5), 0 0 60px rgb(34 197 94 / 0.3), 0 0 90px rgb(34 197 94 / 0.1)',
    purple: '0 0 30px rgb(168 85 247 / 0.5), 0 0 60px rgb(168 85 247 / 0.3), 0 0 90px rgb(168 85 247 / 0.1)',
    rainbow: '0 0 30px rgb(59 130 246 / 0.3), 0 0 60px rgb(168 85 247 / 0.3), 0 0 90px rgb(34 197 94 / 0.2)',
  },
} as const;

// Dark mode shadow variants
export const darkShadows = {
  // Enhanced shadows for dark mode
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.7)',

  // Colored highlights for dark mode
  colored: {
    blue: '0 0 0 1px rgb(59 130 246 / 0.3), 0 4px 20px rgb(59 130 246 / 0.2)',
    green: '0 0 0 1px rgb(34 197 94 / 0.3), 0 4px 20px rgb(34 197 94 / 0.2)',
    purple: '0 0 0 1px rgb(168 85 247 / 0.3), 0 4px 20px rgb(168 85 247 / 0.2)',
  },
} as const;

// Component-specific shadow presets
export const componentShadows = {
  // Card shadows
  card: {
    default: shadows.sm,
    hover: shadows.md,
    active: shadows.lg,
  },

  // Button shadows
  button: {
    default: shadows.xs,
    hover: shadows.sm,
    active: interactiveShadows.active.inset,
    focus: interactiveShadows.focus.ring,
  },

  // Modal shadows
  modal: {
    backdrop: 'inset 0 0 0 1px rgb(255 255 255 / 0.05)',
    content: shadows['2xl'],
  },

  // Dropdown shadows
  dropdown: {
    default: shadows.lg,
    mobile: shadows.xl,
  },

  // Tooltip shadows
  tooltip: {
    default: shadows.md,
  },

  // Navigation shadows
  navigation: {
    header: shadows.sm,
    sidebar: shadows.lg,
  },

  // Input shadows
  input: {
    default: shadows.xs,
    focus: interactiveShadows.focus.ring,
    error: '0 0 0 3px rgb(239 68 68 / 0.2)',
    success: '0 0 0 3px rgb(34 197 94 / 0.2)',
  },
} as const;

// CSS Custom Properties for dynamic shadows
export const shadowVariables = {
  // Base elevation levels
  '--shadow-xs': shadows.xs,
  '--shadow-sm': shadows.sm,
  '--shadow-base': shadows.base,
  '--shadow-md': shadows.md,
  '--shadow-lg': shadows.lg,
  '--shadow-xl': shadows.xl,
  '--shadow-2xl': shadows['2xl'],

  // Interactive states
  '--shadow-hover': interactiveShadows.hover.medium,
  '--shadow-focus': interactiveShadows.focus.ring,
  '--shadow-active': interactiveShadows.active.inset,

  // AI-specific shadows
  '--shadow-ai-blue': coloredShadows.ai.summarizer,
  '--shadow-ai-green': coloredShadows.ai.translator,
  '--shadow-ai-purple': coloredShadows.ai.writer,
} as const;

// Utility functions for dynamic shadow creation
export const createShadow = {
  // Create a basic shadow with custom opacity
  basic: (offset: number, blur: number, opacity: number = 0.1) =>
    `0 ${offset}px ${blur}px 0 rgb(0 0 0 / ${opacity})`,

  // Create a colored shadow
  colored: (color: string, opacity: number = 0.3, blur: number = 20) =>
    `0 4px ${blur}px ${color.replace(')', ` / ${opacity})`)}`,

  // Create a glow effect
  glow: (color: string, intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const intensities = {
      subtle: '0 0 10px',
      medium: '0 0 20px, 0 0 40px',
      strong: '0 0 30px, 0 0 60px, 0 0 90px',
    };
    return `${intensities[intensity]} ${color}`;
  },

  // Create layered shadows
  layered: (...shadows: string[]) => shadows.join(', '),
} as const;

// Export all shadow utilities
export const elevationSystem = {
  shadows,
  coloredShadows,
  interactiveShadows,
  glowEffects,
  darkShadows,
  componentShadows,
  shadowVariables,
  createShadow,
} as const;

// Type exports
export type ShadowKey = keyof typeof shadows;
export type ColoredShadowKey = keyof typeof coloredShadows.ai;
export type InteractiveShadowType = keyof typeof interactiveShadows;
export type GlowEffectType = keyof typeof glowEffects.subtle;
export type ComponentShadowType = keyof typeof componentShadows;
export type ElevationSystem = typeof elevationSystem;