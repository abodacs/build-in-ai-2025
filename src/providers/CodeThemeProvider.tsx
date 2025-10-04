/**
 * Code Theme Provider - Independent Theme Management for Code Blocks
 *
 * Provides a separate theme context specifically for code syntax highlighting
 * Works independently from the main app theme
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useTheme } from './ThemeProvider';

// ============================================================================
// Types
// ============================================================================

export type CodeTheme = 'light' | 'dark' | 'auto';
export type ResolvedCodeTheme = 'light' | 'dark';

interface CodeThemeContextValue {
  /** Current code theme setting */
  codeTheme: CodeTheme;

  /** Actual code theme being displayed (auto resolved to light/dark) */
  resolvedCodeTheme: ResolvedCodeTheme;

  /** Update the code theme */
  setCodeTheme: (theme: CodeTheme) => void;

  /** Toggle between light/dark/auto */
  cycleCodeTheme: () => void;
}

// ============================================================================
// Context
// ============================================================================

const CodeThemeContext = createContext<CodeThemeContextValue | undefined>(
  undefined
);

// ============================================================================
// Provider Component
// ============================================================================

interface CodeThemeProviderProps {
  children: ReactNode;
  defaultCodeTheme?: CodeTheme;
  storageKey?: string;
}

export function CodeThemeProvider({
  children,
  defaultCodeTheme = 'auto',
  storageKey = 'code-theme',
}: CodeThemeProviderProps) {
  const [codeTheme, setCodeThemeState] = useState<CodeTheme>(defaultCodeTheme);
  const [resolvedCodeTheme, setResolvedCodeTheme] =
    useState<ResolvedCodeTheme>('dark');
  const [mounted, setMounted] = useState(false);

  // Get app theme to support 'auto' mode
  const { resolvedTheme: appTheme } = useTheme();

  // Resolve code theme based on current setting
  const resolveCodeTheme = useCallback(
    (theme: CodeTheme): ResolvedCodeTheme => {
      if (theme === 'auto') {
        // Follow app theme
        return appTheme;
      }
      return theme;
    },
    [appTheme]
  );

  // Set code theme and persist
  const setCodeTheme = useCallback(
    (newTheme: CodeTheme) => {
      setCodeThemeState(newTheme);

      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (e) {
        console.warn('Failed to save code theme to localStorage:', e);
      }

      const resolved = resolveCodeTheme(newTheme);
      setResolvedCodeTheme(resolved);

      // Emit custom event for components
      window.dispatchEvent(
        new CustomEvent('codethemechange', {
          detail: { codeTheme: newTheme, resolvedCodeTheme: resolved },
        })
      );
    },
    [storageKey, resolveCodeTheme]
  );

  // Cycle through themes: auto → light → dark → auto
  const cycleCodeTheme = useCallback(() => {
    const next: CodeTheme =
      codeTheme === 'auto' ? 'light'
      : codeTheme === 'light' ? 'dark'
      : 'auto';
    setCodeTheme(next);
  }, [codeTheme, setCodeTheme]);

  // Initialize code theme on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(storageKey) as CodeTheme;
      const initialTheme = savedTheme || defaultCodeTheme;

      setCodeThemeState(initialTheme);
      const resolved = resolveCodeTheme(initialTheme);
      setResolvedCodeTheme(resolved);
    } catch (e) {
      console.warn('Failed to load code theme from localStorage:', e);
      const resolved = resolveCodeTheme(defaultCodeTheme);
      setResolvedCodeTheme(resolved);
    }

    setMounted(true);
  }, [defaultCodeTheme, storageKey, resolveCodeTheme]);

  // Update resolved theme when app theme changes (for 'auto' mode)
  useEffect(() => {
    if (codeTheme === 'auto') {
      setResolvedCodeTheme(appTheme);
    }
  }, [appTheme, codeTheme]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  const value: CodeThemeContextValue = {
    codeTheme,
    resolvedCodeTheme,
    setCodeTheme,
    cycleCodeTheme,
  };

  return (
    <CodeThemeContext.Provider value={value}>
      {children}
    </CodeThemeContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access code theme context
 *
 * @example
 * ```tsx
 * const { codeTheme, resolvedCodeTheme, setCodeTheme } = useCodeTheme();
 *
 * <div className={resolvedCodeTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}>
 *   {code}
 * </div>
 * ```
 */
export function useCodeTheme() {
  const context = useContext(CodeThemeContext);

  if (context === undefined) {
    throw new Error('useCodeTheme must be used within a CodeThemeProvider');
  }

  return context;
}

// ============================================================================
// Exports
// ============================================================================

export default CodeThemeProvider;
