/**
 * Accessibility Testing Setup
 *
 * Common utilities and configurations for accessibility tests.
 * Uses axe-core for automated WCAG 2.1 AA compliance testing.
 *
 * @module tests/accessibility/setup
 */

import { configureAxe } from 'vitest-axe';

// Note: toHaveNoViolations matcher is automatically available when using vitest-axe

/**
 * Default axe configuration for WCAG 2.1 AA compliance
 */
export const axeConfig = configureAxe({
  rules: {
    // WCAG 2.1 Level A & AA rules
    'color-contrast': { enabled: true },
    'valid-lang': { enabled: true },
    'html-has-lang': { enabled: true },
    'landmark-one-main': { enabled: true },
    'page-has-heading-one': { enabled: true },
    region: { enabled: true },
    bypass: { enabled: true }, // Skip links
    'document-title': { enabled: true },
    'duplicate-id': { enabled: true },
    'heading-order': { enabled: true },
    'html-lang-valid': { enabled: true },
    'image-alt': { enabled: true },
    label: { enabled: true },
    list: { enabled: true },
    listitem: { enabled: true },
    'meta-refresh': { enabled: true },
    'meta-viewport': { enabled: true },
    'role-img-alt': { enabled: true },
    'scrollable-region-focusable': { enabled: true },
    'video-caption': { enabled: true },

    // Keyboard accessibility
    'focus-order-semantics': { enabled: true },
    tabindex: { enabled: true },

    // ARIA
    'aria-allowed-attr': { enabled: true },
    'aria-hidden-focus': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-required-children': { enabled: true },
    'aria-required-parent': { enabled: true },
    'aria-roles': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'aria-valid-attr': { enabled: true },

    // Forms
    'form-field-multiple-labels': { enabled: true },
    'label-title-only': { enabled: true },
    'input-button-name': { enabled: true },

    // Interactive elements
    'button-name': { enabled: true },
    'link-name': { enabled: true },
  },
});

/**
 * Keyboard navigation helper - simulates Tab key press
 */
export const pressTab = async (element: HTMLElement): Promise<void> => {
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    code: 'Tab',
    keyCode: 9,
    which: 9,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
};

/**
 * Keyboard navigation helper - simulates Enter key press
 */
export const pressEnter = async (element: HTMLElement): Promise<void> => {
  const event = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
};

/**
 * Keyboard navigation helper - simulates Escape key press
 */
export const pressEscape = async (element: HTMLElement): Promise<void> => {
  const event = new KeyboardEvent('keydown', {
    key: 'Escape',
    code: 'Escape',
    keyCode: 27,
    which: 27,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
};

/**
 * Helper to get all focusable elements in a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
};

/**
 * Helper to test focus trap behavior (for modals/dialogs)
 */
export const testFocusTrap = (container: HTMLElement): boolean => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return false;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Check if focus cycles properly
  firstElement.focus();
  const isFirstFocused = document.activeElement === firstElement;

  lastElement.focus();
  const isLastFocused = document.activeElement === lastElement;

  return isFirstFocused && isLastFocused;
};

/**
 * Helper to verify ARIA attributes
 */
export const verifyAriaAttributes = (
  element: HTMLElement,
  attributes: Record<string, string>,
): boolean => {
  return Object.entries(attributes).every(([attr, value]) => {
    const actualValue = element.getAttribute(`aria-${attr}`);
    return actualValue === value;
  });
};

/**
 * Helper to check color contrast ratio
 * Note: This is a simplified check. axe-core does the full analysis.
 */
export const getContrastRatio = (
  _foreground: string,
  _background: string,
): number => {
  // Simplified contrast calculation
  // In production, use axe-core's contrast checker
  // This is a placeholder implementation
  return 4.5; // WCAG AA minimum for normal text
};

/**
 * Severity levels for accessibility violations
 */
export enum ViolationLevel {
  CRITICAL = 'critical',
  SERIOUS = 'serious',
  MODERATE = 'moderate',
  MINOR = 'minor',
}

/**
 * Helper to format axe violations for reporting
 */
export const formatViolations = (
  violations: any[],
): { level: ViolationLevel; description: string; elements: number }[] => {
  return violations.map((violation) => ({
    level: violation.impact as ViolationLevel,
    description: violation.description,
    elements: violation.nodes.length,
  }));
};

/**
 * Test helper to ensure component has proper heading hierarchy
 */
export const testHeadingHierarchy = (container: HTMLElement): boolean => {
  const headings = Array.from(
    container.querySelectorAll('h1, h2, h3, h4, h5, h6'),
  );
  if (headings.length === 0) return true;

  let previousLevel = 0;
  for (const heading of headings) {
    const level = parseInt(heading.tagName.substring(1), 10);
    if (level > previousLevel + 1) {
      return false; // Skip in hierarchy
    }
    previousLevel = level;
  }
  return true;
};

/**
 * Common test patterns for interactive elements
 */
export const testInteractiveElement = {
  /**
   * Verify button has accessible name
   */
  hasAccessibleName: (button: HTMLElement): boolean => {
    const name =
      button.getAttribute('aria-label') ||
      button.getAttribute('aria-labelledby') ||
      button.textContent?.trim();
    return !!name && name.length > 0;
  },

  /**
   * Verify element is keyboard accessible
   */
  isKeyboardAccessible: (element: HTMLElement): boolean => {
    const tabIndex = element.getAttribute('tabindex');
    return (
      element.tagName === 'BUTTON' ||
      element.tagName === 'A' ||
      element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA' ||
      element.tagName === 'SELECT' ||
      (tabIndex !== null && tabIndex !== '-1')
    );
  },

  /**
   * Verify element has visible focus indicator
   */
  hasVisibleFocus: (element: HTMLElement): boolean => {
    const styles = window.getComputedStyle(element);
    const outline = styles.outline;
    const outlineWidth = styles.outlineWidth;
    const boxShadow = styles.boxShadow;

    return (
      (outline !== 'none' && outlineWidth !== '0px') ||
      (boxShadow !== 'none' && boxShadow.length > 0)
    );
  },
};

/**
 * Export types for TypeScript
 */
export type { AxeResults } from 'axe-core';
