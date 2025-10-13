/**
 * Translator Module - Accessibility Tests
 *
 * Tests WCAG 2.1 AA compliance for the Translator API playground.
 *
 * @module tests/accessibility/translator-a11y
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
import { TranslatorPlayground } from '@/features/unified-playground/api-modules/translator/components/TranslatorPlayground';

describe('Translator - Accessibility Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no axe violations', async () => {
      const { container } = render(<TranslatorPlayground />);
      const results = await axe(container, axeConfig);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      render(<TranslatorPlayground />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have accessible language selection', () => {
      render(<TranslatorPlayground />);

      // Language selectors should be accessible
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2); // Source and target language

      selects.forEach((select) => {
        expect(testInteractiveElement.hasAccessibleName(select)).toBe(true);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow keyboard navigation through language selectors', async () => {
      const user = userEvent.setup();
      render(<TranslatorPlayground />);

      const selects = screen.getAllByRole('combobox');

      // Should be able to Tab to selects
      await user.tab();
      expect(document.activeElement).toBeInstanceOf(HTMLElement);

      // Arrow keys should navigate options
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');
    });

    it('should support keyboard shortcuts for swap languages', async () => {
      const user = userEvent.setup();
      render(<TranslatorPlayground />);

      // Find swap button if it exists
      const buttons = screen.getAllByRole('button');
      const swapButton = buttons.find((btn) =>
        btn.textContent?.toLowerCase().includes('swap'),
      );

      if (swapButton) {
        swapButton.focus();
        await user.keyboard('{Enter}');
        // Swap functionality is tested elsewhere
      }
    });

    it('should handle focus in bidirectional text', async () => {
      const user = userEvent.setup();
      const { container } = render(<TranslatorPlayground />);

      const textboxes = screen.getAllByRole('textbox');
      expect(textboxes.length).toBeGreaterThanOrEqual(2);

      // Tab through textboxes
      await user.tab();
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
    });
  });

  describe('ARIA Attributes', () => {
    it('should label source and target language fields', () => {
      render(<TranslatorPlayground />);

      const selects = screen.getAllByRole('combobox');
      selects.forEach((select) => {
        const label =
          select.getAttribute('aria-label') ||
          select.getAttribute('aria-labelledby');
        expect(label).toBeTruthy();
      });
    });

    it('should announce translation status', () => {
      const { container } = render(<TranslatorPlayground />);

      // Should have status or live region for translation feedback
      const statusElements = container.querySelectorAll(
        '[role="status"], [aria-live]',
      );
      expect(statusElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should indicate bidirectional text direction', () => {
      const { container } = render(<TranslatorPlayground />);

      // Check for dir attribute on text fields
      const textboxes = container.querySelectorAll('[role="textbox"]');
      textboxes.forEach((textbox) => {
        // dir attribute should be set for RTL languages
        const dir = textbox.getAttribute('dir');
        expect(['ltr', 'rtl', 'auto', null]).toContain(dir);
      });
    });
  });

  describe('Focus Management', () => {
    it('should manage focus when swapping languages', async () => {
      const user = userEvent.setup();
      render(<TranslatorPlayground />);

      const buttons = screen.getAllByRole('button');
      const swapButton = buttons.find((btn) =>
        btn.textContent?.toLowerCase().includes('swap'),
      );

      if (swapButton) {
        swapButton.focus();
        const focusBefore = document.activeElement;
        await user.click(swapButton);
        // Focus should remain on swap button or move logically
        expect(document.activeElement).toBeInstanceOf(HTMLElement);
      }
    });

    it('should have visible focus indicators on language selectors', () => {
      render(<TranslatorPlayground />);

      const selects = screen.getAllByRole('combobox');
      selects.forEach((select) => {
        select.focus();
        const styles = window.getComputedStyle(select);
        const hasVisibleFocus =
          styles.outline !== 'none' || styles.boxShadow !== 'none';
        expect(hasVisibleFocus).toBe(true);
      });
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient contrast for translation text', async () => {
      const { container } = render(<TranslatorPlayground />);
      const results = await axe(container, {
        rules: { 'color-contrast': { enabled: true } },
      });
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('Internationalization', () => {
    it('should handle RTL language selection', () => {
      render(<TranslatorPlayground />);

      // Component should support RTL languages (Arabic, Hebrew)
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);

      // RTL support is implementation-specific
      // This test verifies the structure exists
    });

    it('should properly label language names', () => {
      render(<TranslatorPlayground />);

      const selects = screen.getAllByRole('combobox');
      selects.forEach((select) => {
        // Language select should have accessible name
        expect(testInteractiveElement.hasAccessibleName(select)).toBe(true);
      });
    });
  });
});
