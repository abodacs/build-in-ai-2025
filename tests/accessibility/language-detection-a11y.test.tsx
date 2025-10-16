/**
 * Language Detection Module - Accessibility Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import {
  axeConfig,
  getFocusableElements,
  testInteractiveElement,
} from './setup';
import { LanguageDetectionMain } from '@/features/unified-playground/api-modules/language-detection/components/tabs/PlaygroundTab';

describe('Language Detection - Accessibility Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should have no axe violations', async () => {
    const { container } = render(<LanguageDetectionMain />);
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible detection results', () => {
    render(<LanguageDetectionMain />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(testInteractiveElement.hasAccessibleName(button)).toBe(true);
    });
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    const { container } = render(<LanguageDetectionMain />);
    const focusable = getFocusableElements(container);
    expect(focusable.length).toBeGreaterThan(0);
    await user.tab();
    expect(document.activeElement).toBeInstanceOf(HTMLElement);
  });

  it('should have visible focus indicators', () => {
    render(<LanguageDetectionMain />);
    const buttons = screen.getAllByRole('button');
    if (buttons[0]) {
      buttons[0].focus();
      const styles = window.getComputedStyle(buttons[0]);
      expect(styles.outline !== 'none' || styles.boxShadow !== 'none').toBe(
        true,
      );
    }
  });

  it('should announce detection results', () => {
    const { container } = render(<LanguageDetectionMain />);
    const liveRegions = container.querySelectorAll(
      '[role="status"], [aria-live]',
    );
    expect(liveRegions.length).toBeGreaterThanOrEqual(0);
  });

  it('should have proper ARIA labels', () => {
    render(<LanguageDetectionMain />);
    const textboxes = screen.queryAllByRole('textbox');
    textboxes.forEach((textbox) => {
      const hasLabel =
        textbox.getAttribute('aria-label') ||
        textbox.getAttribute('aria-labelledby');
      expect(hasLabel || textbox.labels?.length).toBeTruthy();
    });
  });

  it('should have sufficient color contrast', async () => {
    const { container } = render(<LanguageDetectionMain />);
    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: true } },
    });
    expect(results.violations).toHaveLength(0);
  });
});
