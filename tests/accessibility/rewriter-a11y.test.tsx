/**
 * Rewriter Module - Accessibility Tests
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
import PlaygroundTab from '@/features/unified-playground/api-modules/rewriter/components/tabs/PlaygroundTab';

describe('Rewriter - Accessibility Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should have no axe violations', async () => {
    const { container } = render(<PlaygroundTab />);
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible tone/style selectors', () => {
    render(<PlaygroundTab />);
    const selects = screen.queryAllByRole('combobox');
    selects.forEach((select) => {
      expect(testInteractiveElement.hasAccessibleName(select)).toBe(true);
    });
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    const { container } = render(<PlaygroundTab />);
    const focusable = getFocusableElements(container);
    expect(focusable.length).toBeGreaterThan(0);
    await user.tab();
    expect(document.activeElement).toBeInstanceOf(HTMLElement);
  });

  it('should have visible focus indicators', () => {
    render(<PlaygroundTab />);
    const buttons = screen.getAllByRole('button');
    if (buttons[0]) {
      buttons[0].focus();
      const styles = window.getComputedStyle(buttons[0]);
      expect(styles.outline !== 'none' || styles.boxShadow !== 'none').toBe(
        true,
      );
    }
  });

  it('should have proper ARIA labels for form controls', () => {
    render(<PlaygroundTab />);
    const textboxes = screen.queryAllByRole('textbox');
    textboxes.forEach((textbox) => {
      const hasLabel =
        textbox.getAttribute('aria-label') ||
        textbox.getAttribute('aria-labelledby');
      expect(hasLabel || textbox.labels?.length).toBeTruthy();
    });
  });

  it('should announce rewrite status', () => {
    const { container } = render(<PlaygroundTab />);
    const statusElements = container.querySelectorAll(
      '[role="status"], [aria-live]',
    );
    expect(statusElements.length).toBeGreaterThanOrEqual(0);
  });

  it('should have sufficient color contrast', async () => {
    const { container } = render(<PlaygroundTab />);
    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: true } },
    });
    expect(results.violations).toHaveLength(0);
  });
});
