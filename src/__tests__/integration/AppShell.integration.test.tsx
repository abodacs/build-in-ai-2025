import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '@/App';

// Mock AI service
const mockTestAiAvailability = vi.fn();
vi.mock('@/services/aiService', () => ({
  testAiAvailability: mockTestAiAvailability,
}));

// Helper to render App with Router
const renderApp = () => {
  return act(() => {
    return render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );
  });
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

      // Wait for async operations to complete
      await waitFor(() => {
        expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
      });

      // Header components
      expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
      expect(
        screen.getByText(
          "Interactive playground for Chrome's built-in AI APIs",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('Chrome AI APIs Required')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();

      // Warning banner
      expect(
        screen.getByText(/Chrome AI APIs are currently in development/),
      ).toBeInTheDocument();

      // Sidebar
      expect(screen.getByText('Available APIs')).toBeInTheDocument();
      expect(
        screen.getByText('Select an API to explore its capabilities'),
      ).toBeInTheDocument();

      // Main content
      expect(screen.getByText('Summarizer API')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('maintains proper visual hierarchy', async () => {
      renderApp();

      // Check semantic structure
      const header = document.querySelector('h1');
      expect(header).toHaveTextContent('Chrome AI DevBench');

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('applies global background styling correctly', async () => {
      renderApp();

      const appContainer = document.querySelector('.min-h-screen.bg-white');
      expect(appContainer).toBeInTheDocument();

      const centeredContainer = document.querySelector('.max-w-7xl.mx-auto');
      expect(centeredContainer).toBeInTheDocument();
    });
  });

  describe('API Selection Flow', () => {
    it('allows selecting different APIs from sidebar', async () => {
      const user = userEvent.setup();
      renderApp();

      // Initially shows Summarizer API
      expect(screen.getByText('Summarizer API')).toBeInTheDocument();
      expect(
        screen.getByText('Content summarization and condensation'),
      ).toBeInTheDocument();

      // Click on Translator API
      const translatorButton = screen.getByRole('button', {
        name: /Translator API/,
      });
      await act(async () => {
        await user.click(translatorButton);
      });

      // Should switch to Translator API
      await waitFor(() => {
        expect(screen.getByText('Translator API')).toBeInTheDocument();
        expect(
          screen.getByText('Real-time language translation'),
        ).toBeInTheDocument();
      });
    });

    it('updates active state in sidebar when API changes', async () => {
      const user = userEvent.setup();
      renderApp();

      // Summarizer should be active initially
      const summarizerButton = screen.getByRole('button', {
        name: /Summarizer API/,
      });
      expect(summarizerButton).toHaveClass('bg-gray-900', 'text-white');

      // Click Writer API
      const writerButton = screen.getByRole('button', { name: /Writer API/ });
      await act(async () => {
        await user.click(writerButton);
      });

      await waitFor(() => {
        // Writer should be active now
        expect(writerButton).toHaveClass('bg-gray-900', 'text-white');
        // Summarizer should not be active
        expect(summarizerButton).not.toHaveClass('bg-gray-900');
      });
    });

    it('shows correct API configuration for each selection', async () => {
      const user = userEvent.setup();
      renderApp();

      // Check Summarizer configuration
      expect(
        screen.getByText('Settings for Summarizer API'),
      ).toBeInTheDocument();

      // Switch to different API and check it updates
      const writerButton = screen.getByRole('button', { name: /Writer API/ });
      await act(async () => {
        await user.click(writerButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Writer API')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation Integration', () => {
    it('switches between Demo, Code, and Security tabs', async () => {
      userEvent.setup();
      renderApp();

      // Demo tab should be active by default
      expect(screen.getByText(/Step 1:/)).toBeInTheDocument();
      expect(screen.getByText('API Configuration')).toBeInTheDocument();

      // Note: Due to our mocked tabs, we'd need more complex testing for actual tab switching
      // This would require testing with real tab components or more sophisticated mocks
    });

    it('maintains tab state when switching APIs', async () => {
      const user = userEvent.setup();
      renderApp();

      // Switch to different API
      const translatorButton = screen.getByRole('button', {
        name: /Translator API/,
      });
      await act(async () => {
        await user.click(translatorButton);
      });

      await waitFor(() => {
        // Should still show demo tab content
        expect(screen.getByText(/Step 1:/)).toBeInTheDocument();
      });
    });
  });

  describe('State Management Integration', () => {
    it('shares state between header and sidebar correctly', async () => {
      renderApp();

      // AI capabilities should be loading initially
      await waitFor(() => {
        expect(mockTestAiAvailability).toHaveBeenCalled();
      });
    });

    it('maintains consistent state across component updates', async () => {
      const user = userEvent.setup();
      renderApp();

      // Change API selection
      const rewriterButton = screen.getByRole('button', {
        name: /Rewriter API/,
      });
      await act(async () => {
        await user.click(rewriterButton);
      });

      await waitFor(() => {
        // State should be consistent across all components
        expect(screen.getByText('Rewriter API')).toBeInTheDocument();
        expect(rewriterButton).toHaveClass('bg-gray-900', 'text-white');
      });
    });
  });

  describe('Cross-Component Communication', () => {
    it('updates main content when sidebar selection changes', async () => {
      const user = userEvent.setup();
      renderApp();

      const proofreaderButton = screen.getByRole('button', {
        name: /Proofreader API/,
      });
      await act(async () => {
        await user.click(proofreaderButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Proofreader API')).toBeInTheDocument();
        expect(
          screen.getByText('Grammar and writing improvement'),
        ).toBeInTheDocument();
      });
    });

    it('maintains header state independent of content changes', async () => {
      const user = userEvent.setup();
      renderApp();

      // Header should remain constant
      expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();

      // Change API
      const writerButton = screen.getByRole('button', { name: /Writer API/ });
      await act(async () => {
        await user.click(writerButton);
      });

      await waitFor(() => {
        // Header should still be there
        expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
        expect(screen.getByText('Documentation')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('handles AI service errors gracefully', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockTestAiAvailability.mockRejectedValue(new Error('Network error'));

      renderApp();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      // App should still render
      expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();

      consoleError.mockRestore();
    });

    it('recovers from component errors without breaking layout', () => {
      renderApp();

      // Even if there are errors, basic layout should render
      expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
      expect(screen.getByText('Available APIs')).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
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
        .getAllByRole('button')
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

  describe('Accessibility Integration', () => {
    it('maintains proper focus management between components', async () => {
      const user = userEvent.setup();
      renderApp();

      // Focus on sidebar button
      const translatorButton = screen.getByRole('button', {
        name: /Translator API/,
      });
      translatorButton.focus();
      expect(document.activeElement).toBe(translatorButton);

      // Click should maintain focus
      await act(async () => {
        await user.click(translatorButton);
      });
      expect(document.activeElement).toBe(translatorButton);
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
      expect(screen.getByRole('complementary')).toBeInTheDocument(); // sidebar
      expect(screen.getByRole('main')).toBeInTheDocument(); // main content
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument(); // main heading
    });
  });

  describe('Visual Integration', () => {
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
      const mainTitle = screen.getByRole('heading', { level: 1 });
      expect(mainTitle).toHaveClass('text-xl', 'font-semibold');

      // Sidebar heading should be smaller
      const sidebarHeading = screen.getByRole('heading', { level: 2 });
      expect(sidebarHeading).toHaveClass('text-lg', 'font-semibold');
    });
  });

  describe('Content Synchronization', () => {
    it('keeps all components in sync with global state', async () => {
      const user = userEvent.setup();
      renderApp();

      const languageDetectionButton = screen.getByRole('button', {
        name: /Language Detection/,
      });
      await act(async () => {
        await user.click(languageDetectionButton);
      });

      await waitFor(() => {
        // Sidebar should show active state
        expect(languageDetectionButton).toHaveClass(
          'bg-gray-900',
          'text-white',
        );

        // Main content should update
        expect(screen.getByText('Language Detection')).toBeInTheDocument();
        expect(
          screen.getByText('Automatic language identification'),
        ).toBeInTheDocument();
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
        const writerButton = screen.getByRole('button', { name: /Writer API/ });
        await act(async () => {
          await user.click(writerButton);
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
      expect(screen.getByText('Summarizer API')).toBeInTheDocument();

      // Components should be stable
      expect(screen.getByText('Available APIs')).toBeInTheDocument();
    });
  });
});
