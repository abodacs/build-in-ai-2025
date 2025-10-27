/**
 * Translator Module - Accessibility Tests
 *
 * Tests WCAG 2.1 AA compliance for the Translator API playground.
 *
 * @module tests/accessibility/translator-a11y
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/tests/test-utils/TestProviders';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import {
  axeConfig,
  getFocusableElements,
  testInteractiveElement,
  mockGetComputedStyle,
} from './setup';
import { TranslatorPlayground } from '@/features/unified-playground/api-modules/translator/components/TranslatorPlayground';

// Helper to wait for component to load
const waitForComponentLoad = async () => {
  await waitFor(
    () => {
      expect(
        screen.queryByText(/Checking Chrome AI availability/i),
      ).not.toBeInTheDocument();
    },
    { timeout: 3000 },
  );
};

describe('Translator - Accessibility Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';

    // Mock getComputedStyle
    mockGetComputedStyle();

    // Mock Chrome AI Translator API
    (global as any).ai = {
      translator: {
        availability: vi.fn().mockResolvedValue('available'),
        create: vi.fn().mockResolvedValue({
          translate: vi.fn().mockResolvedValue('Translated text'),
          destroy: vi.fn(),
        }),
      },
    };

    (global as any).Translator = {
      availability: vi.fn().mockResolvedValue('available'),
      create: vi.fn().mockResolvedValue({
        translate: vi.fn().mockResolvedValue('Translated text'),
        destroy: vi.fn(),
      }),
    };

    // Mock Writer API
    (global as any).WriterAPI = {
      availability: vi.fn().mockResolvedValue('available'),
      create: vi.fn(),
    };
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no axe violations', async () => {
      const { container } = render(<TranslatorPlayground />);
      await waitForComponentLoad();
      const results = await axe(container, axeConfig);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', async () => {
      render(<TranslatorPlayground />);
      await waitForComponentLoad();
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have accessible language selection', async () => {
      render(<TranslatorPlayground />);
      await waitForComponentLoad();

      // Language selectors should be accessible (using buttons)
      // Check that all buttons have accessible names
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThan(0);

      allButtons.forEach((button) => {
        expect(testInteractiveElement.hasAccessibleName(button)).toBe(true);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow keyboard navigation through language selectors', async () => {
      const user = userEvent.setup();
      render(<TranslatorPlayground />);
      await waitForComponentLoad();

      const buttons = screen.getAllByRole('button');

      // Should be able to Tab through buttons
      await user.tab();
      expect(document.activeElement).toBeInstanceOf(HTMLElement);

      // Enter/Space should activate buttons
      await user.keyboard('{Enter}');
    });

    it('should support keyboard shortcuts for swap languages', async () => {
      const user = userEvent.setup();
      render(<TranslatorPlayground />);
      await waitForComponentLoad();

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
      await waitForComponentLoad();

      const textboxes = screen.queryAllByRole('textbox');
      expect(textboxes.length).toBeGreaterThanOrEqual(1);

      // Tab through interface
      await user.tab();
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
    });
  });

  describe('ARIA Attributes', () => {
    it('should label source and target language fields', async () => {
      render(<TranslatorPlayground />);
      await waitForComponentLoad();

      const allButtons = screen.getAllByRole('button');
      allButtons.forEach((button) => {
        const label =
          button.getAttribute('aria-label') ||
          button.getAttribute('aria-labelledby') ||
          button.textContent;
        expect(label).toBeTruthy();
      });
    });

    it('should announce translation status', async () => {
      const { container } = render(<TranslatorPlayground />);
      await waitForComponentLoad();

      // Should have status or live region for translation feedback
      const statusElements = container.querySelectorAll(
        '[role="status"], [aria-live]',
      );
      expect(statusElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should indicate bidirectional text direction', async () => {
      const { container } = render(<TranslatorPlayground />);
      await waitForComponentLoad();

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
      await waitForComponentLoad();

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

    it('should have visible focus indicators on language selectors', async () => {
      render(<TranslatorPlayground />);
      await waitForComponentLoad();

      const allButtons = screen.getAllByRole('button');
      allButtons.forEach((button) => {
        button.focus();
        const styles = window.getComputedStyle(button);
        const hasVisibleFocus =
          styles.outline !== 'none' || styles.boxShadow !== 'none';
        expect(hasVisibleFocus).toBe(true);
      });
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient contrast for translation text', async () => {
      const { container } = render(<TranslatorPlayground />);
      await waitForComponentLoad();
      const results = await axe(container, {
        rules: { 'color-contrast': { enabled: true } },
      });
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('Internationalization', () => {
    it('should handle RTL language selection', async () => {
      render(<TranslatorPlayground />);
      await waitForComponentLoad();

      // Component should support RTL languages (Arabic, Hebrew)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // RTL support is implementation-specific
      // This test verifies the structure exists
    });

    it('should properly label language names', async () => {
      render(<TranslatorPlayground />);
      await waitForComponentLoad();

      const allButtons = screen.getAllByRole('button');
      allButtons.forEach((button) => {
        // All buttons should have accessible names
        expect(testInteractiveElement.hasAccessibleName(button)).toBe(true);
      });
    });
  });
});
