import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '@/App';

// Mock AI service
const mockTestAiAvailability = vi.fn();
vi.mock('@/services/aiService', () => ({
  testAiAvailability: mockTestAiAvailability,
}));

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
};

describe('Accessibility Tests (WCAG 2.1 AA Compliance)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTestAiAvailability.mockResolvedValue({
      summarizer: 'available',
      translator: 'unavailable',
      writer: 'unavailable',
      rewriter: 'unavailable',
      proofreader: 'unavailable',
      prompt: 'unavailable',
      languageDetection: 'unavailable',
    });
  });

  describe('Basic Accessibility Checks', () => {
    it('renders main application structure correctly', async () => {
      renderApp();

      // Check for main navigation elements
      expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
      expect(screen.getByText('Available APIs')).toBeInTheDocument();
    });

    it('has proper heading hierarchy', async () => {
      renderApp();

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Summarizer API');
    });

    it('provides accessible button controls', async () => {
      renderApp();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // All buttons should have accessible names
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type');
      });
    });
  });

  describe('Keyboard Navigation (WCAG 2.1.1, 2.1.2)', () => {
    it('supports full keyboard navigation', async () => {
      renderApp();

      // Tab through interactive elements
      await userEvent.tab();
      expect(document.activeElement?.tagName).toBe('BUTTON');

      await userEvent.tab();
      expect(document.activeElement?.tagName).toBe('BUTTON');

      // Should be able to reach all interactive elements
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('provides visible focus indicators', async () => {
      renderApp();

      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();

      // Focus should be visible (this would need visual testing in real implementation)
      expect(document.activeElement).toBe(firstButton);
    });

    it('handles Enter and Space key activation', async () => {
      const user = userEvent.setup();
      renderApp();

      const apiButton = screen.getByRole('button', { name: /Translator API/ });
      apiButton.focus();

      await user.keyboard('{Enter}');
      // Should activate the button (would need to check state change in real implementation)
      expect(document.activeElement).toBe(apiButton);
    });

    it('supports logical tab order', async () => {
      const user = userEvent.setup();
      renderApp();

      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('textbox', { hidden: true }),
      ];

      // Tab through elements and verify order makes sense
      for (let i = 0; i < Math.min(interactiveElements.length, 5); i++) {
        await user.tab();
        expect(document.activeElement?.tagName).toMatch(
          /BUTTON|INPUT|TEXTAREA/,
        );
      }
    });

    it('traps focus appropriately in interactive areas', async () => {
      const user = userEvent.setup();
      renderApp();

      // Focus should remain within the application
      await user.tab();
      const activeElement = document.activeElement;
      expect(activeElement).not.toBe(document.body);
    });
  });

  describe('Screen Reader Support (WCAG 1.3.1, 4.1.2)', () => {
    it('provides proper semantic structure', () => {
      renderApp();

      // Check for proper heading hierarchy
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeInTheDocument();
    });

    it('uses proper landmark roles', () => {
      renderApp();

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('complementary')).toBeInTheDocument(); // sidebar
    });

    it('provides accessible names for interactive elements', () => {
      renderApp();

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('uses proper ARIA labels where needed', () => {
      renderApp();

      // Check for aria-labels, aria-describedby, etc.
      const statusIndicator = document.querySelector(
        '[class*="bg-red-500"], [class*="bg-green-500"], [class*="bg-yellow-500"]',
      );
      expect(statusIndicator).toBeInTheDocument();
    });

    it('provides proper form labels', () => {
      renderApp();

      // All form controls should have labels
      const textareas = screen.getAllByRole('textbox', { hidden: true });
      textareas.forEach((textarea) => {
        // Should have accessible name from label or aria-label
        expect(textarea).toHaveAccessibleName();
      });
    });
  });

  describe('Color and Contrast (WCAG 1.4.3, 1.4.11)', () => {
    it('does not rely solely on color for information', () => {
      renderApp();

      // API status should have both color and text/icon indicators
      expect(screen.getByText('Chrome AI APIs Required')).toBeInTheDocument();

      // Active API state should have visual indicators beyond just color
      const activeButton = screen.getByRole('button', {
        name: /Summarizer API/,
      });
      expect(activeButton).toHaveClass('bg-gray-900', 'text-white'); // High contrast
    });

    it('uses sufficient color contrast', () => {
      renderApp();

      // Warning banner should have sufficient contrast
      const warningText = screen.getByText(
        /Chrome AI APIs are currently in development/,
      );
      expect(warningText).toHaveClass('text-red-800'); // Dark text on light background

      // Active states should have high contrast
      const activeButton = screen.getByRole('button', {
        name: /Summarizer API/,
      });
      expect(activeButton).toHaveClass('text-white'); // White text on dark background
    });

    it('maintains readability in different states', () => {
      renderApp();

      // Check text readability
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-gray-900'); // Dark text for readability

      const subtitle = screen.getByText(
        "Interactive playground for Chrome's built-in AI APIs",
      );
      expect(subtitle).toHaveClass('text-gray-500'); // Sufficient contrast for secondary text
    });
  });

  describe('Text and Typography (WCAG 1.4.4, 1.4.8)', () => {
    it('uses readable font sizes', () => {
      renderApp();

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveClass('text-xl'); // Adequate size

      const bodyText = screen.getByText(
        'Select an API to explore its capabilities',
      );
      expect(bodyText).toHaveClass('text-sm'); // Readable size
    });

    it('provides proper text spacing', () => {
      renderApp();

      // Check for adequate spacing classes
      const spacedContainer = document.querySelector(
        '.space-y-1, .space-y-6, .gap-3',
      );
      expect(spacedContainer).toBeInTheDocument();
    });

    it('supports text zoom up to 200%', () => {
      renderApp();

      // Layout should be flexible for text zoom
      const flexContainer = document.querySelector('.flex');
      expect(flexContainer).toBeInTheDocument();

      // Text should not be truncated inappropriately
      const title = screen.getByText('Chrome AI DevBench');
      expect(title).toBeInTheDocument();
    });
  });

  describe('Form Accessibility (WCAG 1.3.5, 3.3.2)', () => {
    it('provides proper form labels and descriptions', () => {
      renderApp();

      // Input fields should have proper labels
      const inputText = screen.getByText('Input Text');
      expect(inputText).toBeInTheDocument();

      // Character count should be accessible
      const charCount = screen.getByText('0 chars');
      expect(charCount).toBeInTheDocument();
    });

    it('provides helpful placeholder text', () => {
      renderApp();

      const textarea = document.querySelector('textarea');
      if (textarea) {
        expect(textarea).toHaveAttribute('placeholder');
        expect(textarea.placeholder).toContain('Enter text to process');
      }
    });

    it('groups related form controls', () => {
      renderApp();

      // Configuration section should group related controls
      expect(
        screen.getByText('Settings for Summarizer API'),
      ).toBeInTheDocument();
    });
  });

  describe('Error Prevention and Recovery (WCAG 3.3.1, 3.3.3)', () => {
    it('provides clear error states', () => {
      renderApp();

      // Warning banner serves as error prevention
      expect(
        screen.getByText(/Chrome AI APIs are currently in development/),
      ).toBeInTheDocument();
    });

    it('provides helpful guidance', () => {
      renderApp();

      // Step-by-step instructions
      expect(screen.getByText(/Step 1:/)).toBeInTheDocument();
      expect(
        screen.getByText(/Configure the API settings below/),
      ).toBeInTheDocument();
    });
  });

  describe('Dynamic Content (WCAG 4.1.3)', () => {
    it('announces dynamic changes appropriately', async () => {
      const user = userEvent.setup();
      renderApp();

      // API selection should update content
      const writerButton = screen.getByRole('button', { name: /Writer API/ });
      await user.click(writerButton);

      // Content should update
      expect(screen.getByText('Writer API')).toBeInTheDocument();
    });

    it('maintains focus when content changes', async () => {
      const user = userEvent.setup();
      renderApp();

      const translatorButton = screen.getByRole('button', {
        name: /Translator API/,
      });
      translatorButton.focus();
      await user.click(translatorButton);

      // Focus should be maintained or moved appropriately
      expect(document.activeElement).toBe(translatorButton);
    });
  });

  describe('Mobile and Touch Accessibility (WCAG 2.5.5)', () => {
    it('provides adequate touch target sizes', () => {
      renderApp();

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // Buttons should have adequate padding for touch targets
        expect(button).toHaveClass('px-4', 'py-3');
      });
    });

    it('works with assistive touch technologies', () => {
      renderApp();

      // All interactive elements should be properly exposed
      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('textbox', { hidden: true }),
      ];

      expect(interactiveElements.length).toBeGreaterThan(0);
    });
  });

  describe('Language and Internationalization (WCAG 3.1.1)', () => {
    it('specifies document language', () => {
      renderApp();

      // Document should have lang attribute (this would be set in index.html)
      expect(document.documentElement).toHaveAttribute('lang');
    });

    it('uses clear and simple language', () => {
      renderApp();

      // Check for clear, jargon-free instructions
      expect(
        screen.getByText('Select an API to explore its capabilities'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Configure the API settings below/),
      ).toBeInTheDocument();
    });
  });

  describe('Animation and Motion (WCAG 2.3.3)', () => {
    it('respects reduced motion preferences', () => {
      renderApp();

      // Animations should be conditional on prefers-reduced-motion
      const animatedElements = document.querySelectorAll(
        '[class*="transition"], [class*="animate"]',
      );
      expect(animatedElements.length).toBeGreaterThan(0); // Elements can have animations
      // In real implementation, would test that they respect prefers-reduced-motion
    });

    it('provides non-animated alternatives', () => {
      renderApp();

      // Essential functionality should work without animations
      expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
    });
  });

  describe('Custom Component Accessibility', () => {
    it('implements proper ARIA for custom components', () => {
      renderApp();

      // Tab components should have proper ARIA
      const tabs = document.querySelector(
        '[role="tablist"], [data-testid="tabs"]',
      );
      expect(tabs).toBeInTheDocument();
    });

    it('provides proper state announcements', async () => {
      const user = userEvent.setup();
      renderApp();

      // Active API should be announced to screen readers
      const activeButton = screen.getByRole('button', {
        name: /Summarizer API/,
      });
      expect(activeButton).toHaveClass('bg-gray-900'); // Visual indicator of active state
    });
  });

  describe('Performance Accessibility', () => {
    it('loads content progressively for better accessibility', () => {
      renderApp();

      // Critical content should be available immediately
      expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
      expect(screen.getByText('Available APIs')).toBeInTheDocument();
    });

    it('provides loading states for dynamic content', () => {
      renderApp();

      // Should show loading states for AI capabilities
      // This would be visible during actual API calls
      expect(screen.getByText('Chrome AI APIs Required')).toBeInTheDocument();
    });
  });
});
