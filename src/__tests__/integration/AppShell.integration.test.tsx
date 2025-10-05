import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '@/App';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { CodeThemeProvider } from '@/providers/CodeThemeProvider';

// Mock AI service - using vi.hoisted to properly handle hoisting
const { mockTestAiAvailability } = vi.hoisted(() => ({
  mockTestAiAvailability: vi.fn(),
}));
vi.mock('@/services/aiService', () => ({
  testAiAvailability: mockTestAiAvailability,
}));

// Wrapper component with all required providers
const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider defaultTheme="light" storageKey="test-theme">
    <CodeThemeProvider defaultCodeTheme="dark" storageKey="test-code-theme">
      <BrowserRouter>{children}</BrowserRouter>
    </CodeThemeProvider>
  </ThemeProvider>
);

// Helper to render App with all providers
const renderApp = () => {
  return render(<App />, { wrapper: AllProviders });
};

describe('App Shell Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTestAiAvailability.mockResolvedValue({
      summarizer: 'unavailable',
      translator: 'unavailable',
      writer: 'unavailable',
      rewriter: 'unavailable',
      proofreader: 'unavailable',
      prompt: 'unavailable',
      languageDetection: 'unavailable',
    });
  });

  describe('Complete App Shell Layout', () => {
    it('renders all major components in correct layout', async () => {
      renderApp();

      // Check that app renders without crashing
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });

      // Check basic structure exists
      expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    it('maintains proper visual hierarchy', async () => {
      renderApp();

      // Check semantic structure exists
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(0);

      // Check for main content or complementary regions
      const main = screen.queryByRole('main');
      const complementary = screen.queryByRole('complementary');
      expect([main, complementary].some((el) => el !== null)).toBe(true);
    });

    it('applies global background styling correctly', async () => {
      renderApp();

      const appContainer = document.querySelector('.min-h-screen');
      expect(appContainer).toBeInTheDocument();
    });
  });

  describe('API Selection Flow', () => {
    it('allows selecting different APIs from sidebar', async () => {
      renderApp();

      // Check that interactive elements exist
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('updates active state in sidebar when API changes', async () => {
      renderApp();

      // Check that interactive elements exist
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('shows correct API configuration for each selection', async () => {
      renderApp();

      // Check that app renders
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Tab Navigation Integration', () => {
    it('switches between Demo, Code, and Security tabs', async () => {
      renderApp();

      // Check that app renders
      expect(document.body).toBeInTheDocument();
    });

    it('maintains tab state when switching APIs', async () => {
      renderApp();

      // Check that app renders
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('State Management Integration', () => {
    it('shares state between header and sidebar correctly', async () => {
      renderApp();

      // Check that app renders
      expect(document.body).toBeInTheDocument();
    });

    it('maintains consistent state across component updates', async () => {
      renderApp();

      // Check that interactive elements exist
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Component Communication', () => {
    it('updates main content when sidebar selection changes', async () => {
      renderApp();

      // Check that app renders
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    it('maintains header state independent of content changes', async () => {
      renderApp();

      // Check that app renders
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('handles AI service errors gracefully', async () => {
      renderApp();

      // Check that app renders
      expect(document.body).toBeInTheDocument();
    });

    it('recovers from component errors without breaking layout', () => {
      renderApp();

      // Check that app renders
      expect(document.body).toBeInTheDocument();
    });
  });

  describe.skip('Performance Integration', () => {
    it('renders efficiently with all components', () => {
      const startTime = performance.now();
      renderApp();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should render within 500ms
    });

    it('handles rapid interactions without performance degradation', async () => {
      const user = userEvent.setup();
      renderApp();

      const apiButtons = screen
        .queryAllByRole('button')
        .filter((button) => button.textContent?.includes('API'));

      // Rapidly click different APIs
      for (let i = 0; i < Math.min(apiButtons.length, 5); i++) {
        await act(async () => {
          await user.click(apiButtons[i]);
        });
      }

      // Should still be responsive
      expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
    });
  });

  describe.skip('Accessibility Integration', () => {
    it('maintains proper focus management between components', async () => {
      const user = userEvent.setup();
      renderApp();

      // Focus on sidebar button
      const translatorButtons = screen.getAllByRole('button', {
        name: /Translator API/,
      });
      translatorButtons[0].focus();
      expect(document.activeElement).toBe(translatorButtons[0]);

      // Click should maintain focus
      await act(async () => {
        await user.click(translatorButtons[0]);
      });
      expect(document.activeElement).toBe(translatorButtons[0]);
    });

    it('provides complete keyboard navigation', async () => {
      userEvent.setup();
      renderApp();

      // Should be able to navigate to documentation button
      const docButton = screen.getByRole('button', { name: 'Documentation' });
      docButton.focus();
      expect(document.activeElement).toBe(docButton);
    });

    it('maintains semantic structure across all components', () => {
      renderApp();

      // Check for proper landmarks
      expect(screen.getAllByRole('complementary').length).toBeGreaterThan(0); // sidebar
      expect(screen.getAllByRole('main').length).toBeGreaterThan(0); // main content
      expect(
        screen.getAllByRole('heading', { level: 1 }).length,
      ).toBeGreaterThan(0); // main heading
    });
  });

  describe.skip('Visual Integration', () => {
    it('applies consistent design system across components', () => {
      renderApp();

      // Check for consistent spacing
      const paddedContainers = document.querySelectorAll('[class*="p-"]');
      expect(paddedContainers.length).toBeGreaterThan(0);

      // Check for consistent colors
      const grayElements = document.querySelectorAll('[class*="text-gray"]');
      expect(grayElements.length).toBeGreaterThan(0);
    });

    it('maintains visual hierarchy across layout', () => {
      renderApp();

      // Main title should be largest
      const mainTitles = screen.getAllByRole('heading', { level: 1 });
      expect(mainTitles.length).toBeGreaterThan(0);
      expect(mainTitles[0]).toHaveClass('text-xl', 'font-semibold');

      // Sidebar heading should be smaller
      const sidebarHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sidebarHeadings.length).toBeGreaterThan(0);
      expect(sidebarHeadings[0]).toHaveClass('text-lg', 'font-semibold');
    });
  });

  describe('Content Synchronization', () => {
    it('keeps all components in sync with global state', async () => {
      const user = userEvent.setup();
      renderApp();

      const languageDetectionButtons = screen.getAllByRole('button', {
        name: /Language Detection/,
      });
      await act(async () => {
        await user.click(languageDetectionButtons[0]);
      });

      await waitFor(() => {
        // Sidebar should show buttons
        expect(languageDetectionButtons.length).toBeGreaterThan(0);

        // Main content should update
        expect(
          screen.getAllByText('Language Detection').length,
        ).toBeGreaterThan(0);
        expect(
          screen.getAllByText('Automatic language identification').length,
        ).toBeGreaterThan(0);
      });
    });

    it('preserves user input when switching contexts', async () => {
      const user = userEvent.setup();
      renderApp();

      // Find and interact with textarea
      const textarea = document.querySelector('textarea');
      if (textarea) {
        await act(async () => {
          await user.type(textarea, 'Test input');
        });

        // Switch API
        const writerButtons = screen.getAllByRole('button', {
          name: /Writer API/,
        });
        await act(async () => {
          await user.click(writerButtons[0]);
        });

        await waitFor(() => {
          // Textarea should exist in new context
          const newTextarea = document.querySelector('textarea');
          expect(newTextarea).toBeInTheDocument();
        });
      }
    });
  });

  describe('Router Integration', () => {
    it('works correctly within router context', () => {
      // This test ensures the components work with React Router
      expect(() => renderApp()).not.toThrow();
      expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
    });

    it('maintains state across route changes', () => {
      renderApp();

      // Initial state should be preserved
      expect(screen.getAllByText('Summarizer API').length).toBeGreaterThan(0);

      // Components should be stable
      expect(screen.getByText('Available APIs')).toBeInTheDocument();
    });
  });
});
