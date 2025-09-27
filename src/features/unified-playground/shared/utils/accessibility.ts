/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliant accessibility features and utilities
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'

// ============================================================================
// Accessibility Constants
// ============================================================================

export const ARIA_LABELS = {
  playground: 'Chrome AI Developer Playground',
  apiSelector: 'Select Chrome AI API',
  textInput: 'Enter text for AI processing',
  configPanel: 'API Configuration Panel',
  resultsPanel: 'AI Processing Results',
  errorAlert: 'Error Alert',
  loadingStatus: 'Loading Status',
  performanceMetrics: 'Performance Metrics',
  themeToggle: 'Toggle Theme',
  refreshButton: 'Refresh AI Capabilities',
  securityStatus: 'Security Validation Status'
} as const

export const ARIA_DESCRIPTIONS = {
  playground: 'Interactive playground for testing and exploring Chrome built-in AI APIs with security validation and performance monitoring',
  apiInput: 'Text input with real-time validation and security checking. Use Tab to navigate, Enter to submit.',
  configPanel: 'Adjust API-specific settings. Use arrow keys to navigate options, Space to select.',
  resultsPanel: 'AI processing results with performance metrics. Results are announced to screen readers automatically.',
  errorMessages: 'Validation errors and security warnings. Press Escape to dismiss.',
  loadingProgress: 'AI processing progress. Estimated completion time is announced.'
} as const

// ============================================================================
// Keyboard Navigation Constants
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  // Global shortcuts
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',

  // Navigation shortcuts
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',

  // Function shortcuts (with modifiers)
  REFRESH: 'r', // Ctrl+R or Cmd+R
  HELP: '?', // Shift+?
  THEME_TOGGLE: 't', // Ctrl+T or Cmd+T
  FOCUS_INPUT: 'i', // Alt+I
  FOCUS_CONFIG: 'c', // Alt+C
  FOCUS_RESULTS: 'o', // Alt+O (for Output)
} as const

// ============================================================================
// Color Contrast Utilities
// ============================================================================

/**
 * Calculate relative luminance for WCAG contrast calculation
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
  const l1 = getRelativeLuminance(...color1)
  const l2 = getRelativeLuminance(...color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if color combination meets WCAG AA standards
 */
export function meetsContrastRequirement(
  foreground: [number, number, number],
  background: [number, number, number],
  level: 'AA' | 'AAA' = 'AA',
  large: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background)

  if (level === 'AAA') {
    return large ? ratio >= 4.5 : ratio >= 7
  }

  return large ? ratio >= 3 : ratio >= 4.5
}

// ============================================================================
// Focus Management Hook
// ============================================================================

export function useFocusManagement() {
  const [focusedElement, setFocusedElement] = useState<string | null>(null)
  const [focusHistory, setFocusHistory] = useState<string[]>([])
  const focusableElementsRef = useRef<Map<string, HTMLElement>>(new Map())

  const registerFocusableElement = useCallback((id: string, element: HTMLElement) => {
    focusableElementsRef.current.set(id, element)
  }, [])

  const unregisterFocusableElement = useCallback((id: string) => {
    focusableElementsRef.current.delete(id)
  }, [])

  const focusElement = useCallback((id: string, saveToHistory: boolean = true) => {
    const element = focusableElementsRef.current.get(id)
    if (element) {
      element.focus()
      setFocusedElement(id)

      if (saveToHistory) {
        setFocusHistory(prev => [...prev.slice(-10), id])
      }
    }
  }, [])

  const focusPrevious = useCallback(() => {
    if (focusHistory.length > 1) {
      const previousId = focusHistory[focusHistory.length - 2]
      focusElement(previousId, false)
      setFocusHistory(prev => prev.slice(0, -1))
    }
  }, [focusHistory, focusElement])

  const getFocusableElements = useCallback((): string[] => {
    return Array.from(focusableElementsRef.current.keys())
  }, [])

  return {
    focusedElement,
    focusHistory,
    registerFocusableElement,
    unregisterFocusableElement,
    focusElement,
    focusPrevious,
    getFocusableElements
  }
}

// ============================================================================
// Keyboard Navigation Hook
// ============================================================================

export function useKeyboardNavigation() {
  const [isKeyboardMode, setIsKeyboardMode] = useState(false)
  const [shortcuts, setShortcuts] = useState<Map<string, () => void>>(new Map())

  const registerShortcut = useCallback((key: string, handler: () => void, ctrlKey: boolean = false, altKey: boolean = false) => {
    const shortcutKey = `${ctrlKey ? 'ctrl+' : ''}${altKey ? 'alt+' : ''}${key.toLowerCase()}`
    setShortcuts(prev => new Map(prev).set(shortcutKey, handler))
  }, [])

  const unregisterShortcut = useCallback((key: string, ctrlKey: boolean = false, altKey: boolean = false) => {
    const shortcutKey = `${ctrlKey ? 'ctrl+' : ''}${altKey ? 'alt+' : ''}${key.toLowerCase()}`
    setShortcuts(prev => {
      const newMap = new Map(prev)
      newMap.delete(shortcutKey)
      return newMap
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Detect keyboard usage
      setIsKeyboardMode(true)

      // Build shortcut key
      const shortcutKey = `${event.ctrlKey || event.metaKey ? 'ctrl+' : ''}${event.altKey ? 'alt+' : ''}${event.key.toLowerCase()}`

      // Execute shortcut if registered
      const handler = shortcuts.get(shortcutKey)
      if (handler) {
        event.preventDefault()
        handler()
      }

      // Handle escape key globally
      if (event.key === KEYBOARD_SHORTCUTS.ESCAPE) {
        // Close any open modals, dismiss errors, etc.
        document.dispatchEvent(new CustomEvent('playground:escape'))
      }
    }

    const handleMouseDown = () => {
      setIsKeyboardMode(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [shortcuts])

  return {
    isKeyboardMode,
    registerShortcut,
    unregisterShortcut,
    shortcuts: Array.from(shortcuts.keys())
  }
}

// ============================================================================
// Screen Reader Utilities
// ============================================================================

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

export function announcePageLoad(pageName: string) {
  announceToScreenReader(`${pageName} loaded successfully`, 'polite')
}

export function announceError(error: string) {
  announceToScreenReader(`Error: ${error}`, 'assertive')
}

export function announceSuccess(message: string) {
  announceToScreenReader(`Success: ${message}`, 'polite')
}

export function announceProgress(current: number, total: number, taskName: string = 'Processing') {
  const percentage = Math.round((current / total) * 100)
  announceToScreenReader(`${taskName} ${percentage}% complete`, 'polite')
}

// ============================================================================
// Focus Trap Hook
// ============================================================================

export function useFocusTrap(isActive: boolean = false) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [isActive])

  return containerRef
}

// ============================================================================
// Motion Preferences Hook
// ============================================================================

export function useMotionPreferences() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return {
    prefersReducedMotion,
    getAnimationDuration: (defaultMs: number) => prefersReducedMotion ? 0 : defaultMs,
    shouldAnimate: !prefersReducedMotion
  }
}

// ============================================================================
// Accessibility Testing Utilities
// ============================================================================

export function validateAccessibility(element: HTMLElement): {
  isValid: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []

  // Check for alt text on images
  const images = element.querySelectorAll('img')
  images.forEach((img, index) => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      issues.push(`Image ${index + 1} missing alt text`)
      suggestions.push('Add descriptive alt text to all images')
    }
  })

  // Check for form labels
  const inputs = element.querySelectorAll('input, textarea, select')
  inputs.forEach((input, index) => {
    const hasLabel = input.getAttribute('aria-label') ||
                    input.getAttribute('aria-labelledby') ||
                    element.querySelector(`label[for="${input.id}"]`)

    if (!hasLabel) {
      issues.push(`Form input ${index + 1} missing label`)
      suggestions.push('Associate all form inputs with descriptive labels')
    }
  })

  // Check for button text
  const buttons = element.querySelectorAll('button')
  buttons.forEach((button, index) => {
    const hasText = button.textContent?.trim() ||
                   button.getAttribute('aria-label') ||
                   button.getAttribute('aria-labelledby')

    if (!hasText) {
      issues.push(`Button ${index + 1} missing accessible text`)
      suggestions.push('Ensure all buttons have descriptive text or aria-labels')
    }
  })

  // Check for heading hierarchy
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
  let previousLevel = 0
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName[1])
    if (index === 0 && level !== 1) {
      issues.push('Page should start with h1 heading')
    }
    if (level > previousLevel + 1) {
      issues.push(`Heading level ${level} skips levels (should be ${previousLevel + 1})`)
      suggestions.push('Maintain logical heading hierarchy (h1 → h2 → h3...)')
    }
    previousLevel = level
  })

  return {
    isValid: issues.length === 0,
    issues,
    suggestions: [...new Set(suggestions)] // Remove duplicates
  }
}

// ============================================================================
// ARIA Live Region Hook
// ============================================================================

export function useAriaLiveRegion() {
  const liveRegionRef = useRef<HTMLDivElement>(null)

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority)
      liveRegionRef.current.textContent = message

      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = ''
        }
      }, 1000)
    }
  }, [])

  const LiveRegion = useCallback(() => {
    return React.createElement('div', {
      ref: liveRegionRef,
      'aria-live': 'polite',
      'aria-atomic': 'true',
      className: 'sr-only'
    })
  }, [])

  return { announce, LiveRegion }
}

// ============================================================================
// Accessibility Context
// ============================================================================

export interface AccessibilityContextValue {
  focusManagement: ReturnType<typeof useFocusManagement>
  keyboardNavigation: ReturnType<typeof useKeyboardNavigation>
  motionPreferences: ReturnType<typeof useMotionPreferences>
  liveRegion: ReturnType<typeof useAriaLiveRegion>
}

export function useAccessibilityContext(): AccessibilityContextValue {
  const focusManagement = useFocusManagement()
  const keyboardNavigation = useKeyboardNavigation()
  const motionPreferences = useMotionPreferences()
  const liveRegion = useAriaLiveRegion()

  return {
    focusManagement,
    keyboardNavigation,
    motionPreferences,
    liveRegion
  }
}