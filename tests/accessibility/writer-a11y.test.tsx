/**
 * Writer Module - Accessibility Tests
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
import PlaygroundTab from '@/features/unified-playground/api-modules/writer/components/tabs/PlaygroundTab';

describe('Writer - Accessibility Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should have no axe violations', async () => {
    const { container } = render(<PlaygroundTab />);
    const results = await axe(container, axeConfig);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible form controls', () => {
    render(<PlaygroundTab />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(testInteractiveElement.hasAccessibleName(button)).toBe(true);
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
    buttons[0]?.focus();
    if (buttons[0]) {
      const styles = window.getComputedStyle(buttons[0]);
      expect(styles.outline !== 'none' || styles.boxShadow !== 'none').toBe(
        true,
      );
    }
  });

  it('should have proper ARIA labels', () => {
    render(<PlaygroundTab />);
    const textboxes = screen.queryAllByRole('textbox');
    textboxes.forEach((textbox) => {
      const hasLabel =
        textbox.getAttribute('aria-label') ||
        textbox.getAttribute('aria-labelledby');
      expect(hasLabel || textbox.labels?.length).toBeTruthy();
    });
  });

  it('should have sufficient color contrast', async () => {
    const { container } = render(<PlaygroundTab />);
    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: true } },
    });
    expect(results.violations).toHaveLength(0);
  });
});
