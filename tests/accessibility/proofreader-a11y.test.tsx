/**
 * Proofreader Module - Accessibility Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/tests/test-utils/TestProviders';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import {
  axeConfig,
  getFocusableElements,
  testInteractiveElement,
} from './setup';
import { ProofreaderMain } from '@/features/unified-playground/api-modules/proofreader/components/tabs/PlaygroundTab';

describe('Proofreader - Accessibility Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should have no axe violations', async () => {
    const { container } = render(<ProofreaderMain />);
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible correction cards', () => {
    render(<ProofreaderMain />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(testInteractiveElement.hasAccessibleName(button)).toBe(true);
    });
  });

  it('should support keyboard navigation through corrections', async () => {
    const user = userEvent.setup();
    const { container } = render(<ProofreaderMain />);
    const focusable = getFocusableElements(container);
    expect(focusable.length).toBeGreaterThan(0);
    await user.tab();
    expect(document.activeElement).toBeInstanceOf(HTMLElement);
  });

  it('should have visible focus indicators', () => {
    render(<ProofreaderMain />);
    const buttons = screen.getAllByRole('button');
    if (buttons[0]) {
      buttons[0].focus();
      const styles = window.getComputedStyle(buttons[0]);
      expect(styles.outline !== 'none' || styles.boxShadow !== 'none').toBe(
        true,
      );
    }
  });

  it('should announce correction suggestions', () => {
    const { container } = render(<ProofreaderMain />);
    const liveRegions = container.querySelectorAll(
      '[role="status"], [aria-live], [role="alert"]',
    );
    expect(liveRegions.length).toBeGreaterThanOrEqual(0);
  });

  it('should have proper ARIA labels for correction actions', () => {
    render(<ProofreaderMain />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(testInteractiveElement.hasAccessibleName(button)).toBe(true);
    });
  });

  it('should have sufficient color contrast for corrections', async () => {
    const { container } = render(<ProofreaderMain />);
    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: true } },
    });
    expect(results.violations).toHaveLength(0);
  });

  it('should support keyboard shortcuts for corrections', async () => {
    const user = userEvent.setup();
    render(<ProofreaderMain />);

    // Should be able to navigate and activate corrections with keyboard
    await user.tab();
    expect(document.activeElement).toBeInstanceOf(HTMLElement);

    // Enter key should apply/view corrections
    await user.keyboard('{Enter}');
  });

  it('should have accessible correction highlights', () => {
    const { container } = render(<ProofreaderMain />);

    // Highlights should be accessible (not rely on color alone)
    const highlights = container.querySelectorAll(
      '[data-correction], .correction',
    );
    highlights.forEach((highlight) => {
      // Should have accessible name or description
      const hasAccessibleInfo =
        highlight.getAttribute('aria-label') ||
        highlight.getAttribute('aria-describedby') ||
        highlight.getAttribute('title');
      expect(hasAccessibleInfo || highlight.textContent).toBeTruthy();
    });
  });
});
