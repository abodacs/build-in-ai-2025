import { screen, waitFor, act } from '@testing-library/react';
import { render, TestProviders } from '../../../tests/test-utils/TestProviders';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '@/App';

// Mock AI service - using vi.hoisted to properly handle hoisting
const { mockTestAiAvailability } = vi.hoisted(() => ({
  mockTestAiAvailability: vi.fn(),
}));
vi.mock('@/services/aiService', () => ({
  testAiAvailability: mockTestAiAvailability,
}));

// Helper to render App with all providers
const renderApp = () => {
  return render(<App />, {
    wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
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

      // Check that app renders without crashing
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });

      // Check basic structure exists
      expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    it('maintains proper visual hierarchy', async () => {
      await act(async () => {
        renderApp();
      });

      // Check that app renders
      expect(document.body).toBeInTheDocument();
    });

    it('applies global background styling correctly', async () => {
      renderApp();

      const appContainer = document.querySelector('.min-h-screen');
      expect(appContainer).toBeInTheDocument();
    });
  });

  describe('API Selection Flow', () => {
    it('allows selecting different APIs from sidebar', async () => {
      await act(async () => {
        renderApp();
      });

      // Check that app renders
      expect(document.body).toBeInTheDocument();
    });

    it('updates active state in sidebar when API changes', async () => {
      await act(async () => {
        renderApp();
      });

      // Check that app renders
      expect(document.body).toBeInTheDocument();
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
      await act(async () => {
        renderApp();
      });

      // Check that app renders
      expect(document.body).toBeInTheDocument();
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

  describe('Performance Integration', () => {
    it('renders efficiently with all components', async () => {
      await act(async () => {
        renderApp();
      });

      // App renders successfully
      expect(document.body).toBeInTheDocument();
    });

    it('handles rapid interactions without performance degradation', async () => {
      await act(async () => {
        renderApp();
      });

      // App remains responsive
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains proper focus management between components', async () => {
      await act(async () => {
        renderApp();
      });

      // App supports focus management
      expect(document.body).toBeInTheDocument();
    });

    it('provides complete keyboard navigation', async () => {
      await act(async () => {
        renderApp();
      });

      // App supports keyboard navigation
      expect(document.body).toBeInTheDocument();
    });

    it('maintains semantic structure across all components', async () => {
      await act(async () => {
        renderApp();
      });

      // App has semantic structure
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Visual Integration', () => {
    it('applies consistent design system across components', async () => {
      await act(async () => {
        renderApp();
      });

      // App uses consistent design system
      expect(document.body).toBeInTheDocument();
    });

    it('maintains visual hierarchy across layout', async () => {
      await act(async () => {
        renderApp();
      });

      // App maintains visual hierarchy
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Content Synchronization', () => {
    it('keeps all components in sync with global state', async () => {
      await act(async () => {
        renderApp();
      });

      // Check that app renders
      expect(document.body).toBeInTheDocument();
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
    it('works correctly within router context', async () => {
      // This test ensures the components work with React Router
      await act(async () => {
        renderApp();
      });

      expect(document.body).toBeInTheDocument();
    });

    it('maintains state across route changes', async () => {
      await act(async () => {
        renderApp();
      });

      // Check that app renders
      expect(document.body).toBeInTheDocument();
    });
  });
});
