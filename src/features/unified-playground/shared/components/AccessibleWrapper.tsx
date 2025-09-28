/**
 * Accessible Wrapper Component
 * WCAG 2.1 AA compliant wrapper with comprehensive accessibility features
 */

import { useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  useAccessibilityContext,
  ARIA_LABELS,
  KEYBOARD_SHORTCUTS,
  announcePageLoad,
} from '../utils/accessibility';
import { AccessibilityContext } from './useAccessibility';

// ============================================================================
// Accessible Wrapper Component
// ============================================================================

interface AccessibleWrapperProps {
  children: ReactNode;
  className?: string;
  pageName?: string;
  enableKeyboardShortcuts?: boolean;
  enableFocusManagement?: boolean;
  enableMotionReduction?: boolean;
  role?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function AccessibleWrapper({
  children,
  className,
  pageName = 'Chrome AI DevBench',
  enableKeyboardShortcuts = true,
  enableMotionReduction = true,
  role = 'main',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: AccessibleWrapperProps) {
  const accessibility = useAccessibilityContext();

  // ============================================================================
  // Setup Effects
  // ============================================================================

  useEffect(() => {
    // Announce page load
    announcePageLoad(pageName);

    // Set up keyboard shortcuts
    if (enableKeyboardShortcuts) {
      // Global shortcuts
      accessibility.keyboardNavigation.registerShortcut(
        KEYBOARD_SHORTCUTS.HELP,
        () => {
          accessibility.liveRegion.announce(
            'Keyboard shortcuts: Alt+I for input, Alt+C for config, Alt+O for output, ? for help, Escape to close dialogs',
            'assertive',
          );
        },
      );

      accessibility.keyboardNavigation.registerShortcut(
        'r',
        () => {
          document.dispatchEvent(new CustomEvent('playground:refresh'));
          accessibility.liveRegion.announce(
            'Refreshing AI capabilities',
            'polite',
          );
        },
        true, // Ctrl+R
      );

      accessibility.keyboardNavigation.registerShortcut(
        't',
        () => {
          document.dispatchEvent(new CustomEvent('playground:theme-toggle'));
          accessibility.liveRegion.announce('Theme toggled', 'polite');
        },
        true, // Ctrl+T
      );

      // Focus management shortcuts
      accessibility.keyboardNavigation.registerShortcut(
        'i',
        () => {
          accessibility.focusManagement.focusElement('main-input');
          accessibility.liveRegion.announce('Focused on main input', 'polite');
        },
        false,
        true, // Alt+I
      );

      accessibility.keyboardNavigation.registerShortcut(
        'c',
        () => {
          accessibility.focusManagement.focusElement('config-panel');
          accessibility.liveRegion.announce(
            'Focused on configuration panel',
            'polite',
          );
        },
        false,
        true, // Alt+C
      );

      accessibility.keyboardNavigation.registerShortcut(
        'o',
        () => {
          accessibility.focusManagement.focusElement('output-panel');
          accessibility.liveRegion.announce(
            'Focused on output panel',
            'polite',
          );
        },
        false,
        true, // Alt+O
      );
    }

    return () => {
      // Cleanup shortcuts
      if (enableKeyboardShortcuts) {
        accessibility.keyboardNavigation.unregisterShortcut(
          KEYBOARD_SHORTCUTS.HELP,
        );
        accessibility.keyboardNavigation.unregisterShortcut('r', true);
        accessibility.keyboardNavigation.unregisterShortcut('t', true);
        accessibility.keyboardNavigation.unregisterShortcut('i', false, true);
        accessibility.keyboardNavigation.unregisterShortcut('c', false, true);
        accessibility.keyboardNavigation.unregisterShortcut('o', false, true);
      }
    };
  }, [pageName, enableKeyboardShortcuts, accessibility]);

  // ============================================================================
  // Motion Preferences
  // ============================================================================

  useEffect(() => {
    if (
      enableMotionReduction &&
      accessibility.motionPreferences.prefersReducedMotion
    ) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
      document.documentElement.style.setProperty('--transition-duration', '0s');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
      document.documentElement.style.removeProperty('--transition-duration');
    }
  }, [
    enableMotionReduction,
    accessibility.motionPreferences.prefersReducedMotion,
  ]);

  // ============================================================================
  // Focus Indicator Styles
  // ============================================================================

  const focusClasses = accessibility.keyboardNavigation.isKeyboardMode
    ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
    : 'focus:outline-none';

  return (
    <AccessibilityContext.Provider value={accessibility}>
      <div
        className={cn(
          'min-h-screen bg-background text-foreground',
          focusClasses,
          className,
        )}
        role={role}
        aria-label={ariaLabel || ARIA_LABELS.playground}
        aria-describedby={ariaDescribedBy}
      >
        {/* Skip to main content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 p-4 bg-primary text-primary-foreground rounded-br-lg transition-all"
        >
          Skip to main content
        </a>

        {/* Main content */}
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>

        {/* Accessibility live region */}
        <accessibility.liveRegion.LiveRegion />

        {/* Screen reader only instructions */}
        <div className="sr-only">
          <h2>Keyboard Navigation Instructions</h2>
          <ul>
            <li>Use Tab to navigate between interactive elements</li>
            <li>Press ? for help and keyboard shortcuts</li>
            <li>Press Escape to close dialogs or clear errors</li>
            <li>
              Use Alt+I to focus input, Alt+C for config, Alt+O for output
            </li>
            <li>Use Ctrl+R to refresh, Ctrl+T to toggle theme</li>
          </ul>
        </div>
      </div>
    </AccessibilityContext.Provider>
  );
}

// ============================================================================\n// Accessible Component Wrappers\n// ============================================================================\n\ninterface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {\n  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'\n  size?: 'sm' | 'md' | 'lg'\n  loading?: boolean\n  'aria-describedby'?: string\n}\n\nexport function AccessibleButton({\n  children,\n  className,\n  variant = 'primary',\n  size = 'md',\n  loading = false,\n  disabled,\n  'aria-describedby': ariaDescribedBy,\n  ...props\n}: AccessibleButtonProps) {\n  const { keyboardNavigation } = useAccessibility()\n\n  const baseClasses = [\n    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium',\n    'transition-all duration-200 ease-out',\n    'disabled:pointer-events-none disabled:opacity-50',\n    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'\n  ]\n\n  const variantClasses = {\n    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',\n    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',\n    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',\n    ghost: 'hover:bg-accent hover:text-accent-foreground'\n  }\n\n  const sizeClasses = {\n    sm: 'h-8 px-3 text-sm',\n    md: 'h-10 px-4 text-sm',\n    lg: 'h-12 px-6 text-base'\n  }\n\n  return (\n    <button\n      className={cn(\n        baseClasses,\n        variantClasses[variant],\n        sizeClasses[size],\n        keyboardNavigation.isKeyboardMode && 'ring-offset-background',\n        className\n      )}\n      disabled={disabled || loading}\n      aria-describedby={ariaDescribedBy}\n      aria-busy={loading}\n      {...props}\n    >\n      {loading && (\n        <span className=\"animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full\" aria-hidden=\"true\" />\n      )}\n      {children}\n    </button>\n  )\n}\n\ninterface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {\n  label: string\n  error?: string\n  helpText?: string\n  required?: boolean\n}\n\nexport function AccessibleInput({\n  label,\n  error,\n  helpText,\n  required,\n  className,\n  id,\n  ...props\n}: AccessibleInputProps) {\n  const { liveRegion } = useAccessibility()\n  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`\n  const helpId = helpText ? `${inputId}-help` : undefined\n  const errorId = error ? `${inputId}-error` : undefined\n\n  useEffect(() => {\n    if (error) {\n      liveRegion.announce(`Input error: ${error}`, 'assertive')\n    }\n  }, [error, liveRegion])\n\n  return (\n    <div className=\"space-y-2\">\n      <label\n        htmlFor={inputId}\n        className=\"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70\"\n      >\n        {label}\n        {required && (\n          <span className=\"text-destructive ml-1\" aria-label=\"required\">\n            *\n          </span>\n        )}\n      </label>\n\n      <input\n        id={inputId}\n        className={cn(\n          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',\n          'file:border-0 file:bg-transparent file:text-sm file:font-medium',\n          'placeholder:text-muted-foreground',\n          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',\n          'disabled:cursor-not-allowed disabled:opacity-50',\n          error && 'border-destructive focus-visible:ring-destructive',\n          className\n        )}\n        aria-describedby={cn(helpId, errorId)}\n        aria-invalid={!!error}\n        aria-required={required}\n        {...props}\n      />\n\n      {helpText && (\n        <p id={helpId} className=\"text-sm text-muted-foreground\">\n          {helpText}\n        </p>\n      )}\n\n      {error && (\n        <p id={errorId} className=\"text-sm text-destructive\" role=\"alert\">\n          {error}\n        </p>\n      )}\n    </div>\n  )\n}\n\ninterface AccessibleHeadingProps {\n  level: 1 | 2 | 3 | 4 | 5 | 6\n  children: ReactNode\n  className?: string\n  id?: string\n}\n\nexport function AccessibleHeading({ level, children, className, id }: AccessibleHeadingProps) {\n  const Tag = `h${level}` as keyof JSX.IntrinsicElements\n\n  const levelClasses = {\n    1: 'text-4xl font-bold',\n    2: 'text-3xl font-bold',\n    3: 'text-2xl font-semibold',\n    4: 'text-xl font-semibold',\n    5: 'text-lg font-medium',\n    6: 'text-base font-medium'\n  }\n\n  return (\n    <Tag\n      id={id}\n      className={cn(levelClasses[level], 'text-foreground', className)}\n    >\n      {children}\n    </Tag>\n  )\n}"
