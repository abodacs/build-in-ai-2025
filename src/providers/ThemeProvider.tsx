/**
 * Theme Provider - Centralized Theme Management
 *
 * Provides a global theme context that works across all API modules
 * Prevents conflicts by using a single source of truth
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// ============================================================================
// Types
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  /** Current theme setting */
  theme: Theme;

  /** Actual theme being displayed (system resolved to light/dark) */
  resolvedTheme: ResolvedTheme;

  /** Update the theme */
  setTheme: (theme: Theme) => void;

  /** Toggle between light/dark (skips system) */
  toggleTheme: () => void;
}

// ============================================================================
// Context
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  // Apply theme to DOM
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    let actualTheme: ResolvedTheme;

    if (newTheme === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      actualTheme = newTheme;
    }

    // Apply theme class
    root.classList.add(actualTheme);

    // Update resolved theme state
    setResolvedTheme(actualTheme);

    // Add transition animation
    root.classList.add('animate-themeSwitch');
    setTimeout(() => {
      root.classList.remove('animate-themeSwitch');
    }, 200);
  }, []);

  // Set theme and persist
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);

      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (e) {
        console.warn('Failed to save theme to localStorage:', e);
      }

      applyTheme(newTheme);

      // Emit custom event for other components
      window.dispatchEvent(
        new CustomEvent('themechange', { detail: { theme: newTheme } })
      );
    },
    [storageKey, applyTheme]
  );

  // Toggle between light and dark (skip system)
  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  // Initialize theme on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(storageKey) as Theme;
      const initialTheme = savedTheme || defaultTheme;

      setThemeState(initialTheme);
      applyTheme(initialTheme);
    } catch (e) {
      console.warn('Failed to load theme from localStorage:', e);
      applyTheme(defaultTheme);
    }

    setMounted(true);
  }, [defaultTheme, storageKey, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access theme context
 *
 * @example
 * ```tsx
 * const { theme, setTheme, toggleTheme } = useTheme();
 *
 * <button onClick={toggleTheme}>
 *   Toggle Theme
 * </button>
 * ```
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// ============================================================================
// Exports
// ============================================================================

export default ThemeProvider;
