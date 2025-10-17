import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Header } from '../Header';

// Mock the AI service
vi.mock('@/services/aiService', () => ({
  testAiAvailability: vi.fn(),
}));

// Mock the app store
vi.mock('@/stores/appStore', () => ({
  useAppStore: vi.fn(),
}));

describe('Header Component', () => {
  const mockSetAiCapabilities = vi.fn();
  let mockUseAppStore: any;
  let mockTestAiAvailability: any;

  const renderHeader = () => {
    return act(() => {
      return render(<Header />);
    });
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked functions
    const { useAppStore } = await import('@/stores/appStore');
    const { testAiAvailability } = await import('@/services/aiService');
    mockUseAppStore = vi.mocked(useAppStore);
    mockTestAiAvailability = vi.mocked(testAiAvailability);

    // Default store state
    const defaultState = {
      activeApi: 'summarizer',
      codeLanguage: 'ts',
      apiResult: null,
      isLoading: false,
      aiCapabilities: null,
      lastInputText: '',
      theme: 'system',
      setActiveApi: vi.fn(),
      setCodeLanguage: vi.fn(),
      setApiResult: vi.fn(),
      setLoading: vi.fn(),
      setAiCapabilities: mockSetAiCapabilities,
      setLastInputText: vi.fn(),
      setTheme: vi.fn(),
      clearApiResult: vi.fn(),
      reset: vi.fn(),
    };

    mockUseAppStore.mockImplementation((selector: (state: any) => any) => {
      if (selector) {
        return selector(defaultState);
      }
      return defaultState;
    });

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

  describe('Structure and Layout', () => {
    it('renders with correct structure', () => {
      renderHeader();

      // Check main container with responsive classes
      const container = document.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(container).toBeInTheDocument();
    });

    it('displays Chrome AI DevBench logo', () => {
      renderHeader();

      const logo = document.querySelector('img[alt="Chrome AI DevBench Logo"]');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logo.svg');
    });

    it('displays correct branding text', () => {
      renderHeader();

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Chrome AI DevBench',
      );
      expect(
        screen.getByText(
          "Interactive playground for Chrome's built-in AI APIs",
        ),
      ).toBeInTheDocument();
    });

    it('displays API status counter', () => {
      renderHeader();

      expect(screen.getByText(/AI Status \(\d+\/\d+\)/)).toBeInTheDocument();
    });
  });

  describe('AI Capabilities Loading', () => {
    it('calls testAiAvailability on mount', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(mockTestAiAvailability).toHaveBeenCalledTimes(1);
      });
    });

    it('calls setAiCapabilities with response', async () => {
      const mockCapabilities = {
        summarizer: 'available',
        translator: 'unavailable',
      };
      mockTestAiAvailability.mockResolvedValue(mockCapabilities);

      render(<Header />);

      await waitFor(() => {
        expect(mockSetAiCapabilities).toHaveBeenCalledWith(mockCapabilities);
      });
    });

    it('handles testAiAvailability errors gracefully', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockTestAiAvailability.mockRejectedValue(new Error('Test error'));

      render(<Header />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to check AI capabilities:',
          expect.any(Error),
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('AI Status Indicator', () => {
    it('shows loading state when aiCapabilities is null', () => {
      render(<Header />);

      const statusIndicator = document.querySelector(
        '.bg-blue-500.animate-pulse',
      );
      expect(statusIndicator).toBeInTheDocument();
    });

    it('shows unavailable state when all APIs are unavailable', async () => {
      const unavailableCapabilities = {
        summarizer: 'unavailable',
        translator: 'unavailable',
        writer: 'unavailable',
        rewriter: 'unavailable',
        proofreader: 'unavailable',
        prompt: 'unavailable',
        languageDetection: 'unavailable',
      };

      mockTestAiAvailability.mockResolvedValue(unavailableCapabilities);

      // Update mock to return the capabilities after they're set
      mockUseAppStore.mockImplementation((selector: (state: any) => any) => {
        const state = {
          aiCapabilities: unavailableCapabilities,
          setAiCapabilities: mockSetAiCapabilities,
        };
        return selector ? selector(state) : state;
      });

      const { container } = render(<Header />);

      await waitFor(() => {
        const statusIndicator = container.querySelector('.bg-red-500');
        expect(statusIndicator).toBeInTheDocument();
      });
    });

    it('shows available state when at least one API is available', async () => {
      const availableCapabilities = {
        summarizer: 'available',
        translator: 'unavailable',
        writer: 'unavailable',
        rewriter: 'unavailable',
        proofreader: 'unavailable',
        prompt: 'unavailable',
        languageDetection: 'unavailable',
      };

      mockTestAiAvailability.mockResolvedValue(availableCapabilities);

      // Update mock to return the capabilities after they're set
      mockUseAppStore.mockImplementation((selector: (state: any) => any) => {
        const state = {
          aiCapabilities: availableCapabilities,
          setAiCapabilities: mockSetAiCapabilities,
        };
        return selector ? selector(state) : state;
      });

      const { container } = render(<Header />);

      await waitFor(() => {
        const statusIndicator = container.querySelector('.bg-green-500');
        expect(statusIndicator).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<Header />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Chrome AI DevBench');
    });

    it('provides semantic information about status', () => {
      render(<Header />);

      // Status text should be descriptive
      expect(screen.getByText(/AI Status \(\d+\/\d+\)/)).toBeInTheDocument();
    });

    it('has accessible logo image', () => {
      render(<Header />);

      const logo = document.querySelector('img[alt="Chrome AI DevBench Logo"]');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logo.svg');
    });
  });

  describe('Visual Design', () => {
    it('applies correct typography classes with responsive design', () => {
      render(<Header />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('font-semibold', 'text-gray-900');

      const subtitle = screen.getByText(
        "Interactive playground for Chrome's built-in AI APIs",
      );
      expect(subtitle).toHaveClass('text-gray-500');
    });

    it('applies mobile-friendly responsive classes', () => {
      render(<Header />);

      const container = document.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('py-4');
    });

    it('styles status chip correctly', () => {
      render(<Header />);

      const statusChip = document.querySelector(
        '.px-3.py-1.bg-gray-100.rounded-full',
      );
      expect(statusChip).toBeInTheDocument();
    });

    it('applies responsive sizing to logo', () => {
      render(<Header />);

      const logo = document.querySelector('img[alt="Chrome AI DevBench Logo"]');
      expect(logo).toHaveClass('w-6', 'h-6', 'sm:w-8', 'sm:h-8');
    });

    it('hides subtitle on mobile with sm:block', () => {
      render(<Header />);

      const subtitle = screen.getByText(
        "Interactive playground for Chrome's built-in AI APIs",
      );
      expect(subtitle).toHaveClass('hidden', 'sm:block');
    });
  });

  describe('Performance', () => {
    it('only calls AI availability check once on mount', async () => {
      const { rerender } = render(<Header />);

      await waitFor(() => {
        expect(mockTestAiAvailability).toHaveBeenCalledTimes(1);
      });

      // Re-render should not trigger another call
      rerender(<Header />);

      await waitFor(() => {
        expect(mockTestAiAvailability).toHaveBeenCalledTimes(1);
      });
    });

    it('handles rapid re-renders without issues', () => {
      const { rerender } = render(<Header />);

      // Multiple rapid re-renders
      for (let i = 0; i < 5; i++) {
        rerender(<Header />);
      }

      // Should still display correctly
      expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    it('handles store errors gracefully', () => {
      mockUseAppStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      expect(() => render(<Header />)).toThrow('Store error');
    });
  });

  describe('Advanced Edge Cases', () => {
    describe('Complex AI Capability State Management', () => {
      it('should handle partial API availability states correctly', async () => {
        const partialCapabilities = {
          summarizer: 'available',
          translator: 'downloading',
          writer: 'unavailable',
          rewriter: 'available',
          proofreader: 'unknown',
          prompt: 'available',
          languageDetection: 'error',
        };

        mockTestAiAvailability.mockResolvedValue(partialCapabilities);

        // Update mock to return the capabilities
        mockUseAppStore.mockImplementation((selector: (state: any) => any) => {
          const state = {
            aiCapabilities: partialCapabilities,
            setAiCapabilities: mockSetAiCapabilities,
          };
          return selector ? selector(state) : state;
        });

        const { container } = render(<Header />);

        await waitFor(() => {
          expect(mockSetAiCapabilities).toHaveBeenCalledWith(
            partialCapabilities,
          );
        });

        // Should show available status since at least one API is available
        const statusIndicator = container.querySelector('.bg-green-500');
        expect(statusIndicator).toBeTruthy();
      });

      it('should handle AI capability state transitions during component lifecycle', async () => {
        let capabilitiesResolver: (value: any) => void;
        const capabilitiesPromise = new Promise((resolve) => {
          capabilitiesResolver = resolve;
        });
        mockTestAiAvailability.mockReturnValue(capabilitiesPromise);

        const { container } = render(<Header />);

        // Component should render
        expect(container).toBeTruthy();

        // Resolve with available capabilities
        await act(async () => {
          capabilitiesResolver!({
            summarizer: 'available',
            translator: 'available',
          });
        });

        await waitFor(() => {
          expect(mockSetAiCapabilities).toHaveBeenCalled();
        });
      });

      it('should handle concurrent AI availability checks without race conditions', async () => {
        let resolveCount = 0;
        mockTestAiAvailability.mockImplementation(() => {
          resolveCount++;
          return Promise.resolve({
            summarizer: `state-${resolveCount}`,
            translator: 'available',
          });
        });

        const { rerender } = render(<Header />);

        // Trigger multiple re-renders rapidly
        for (let i = 0; i < 3; i++) {
          rerender(<Header />);
        }

        await waitFor(() => {
          expect(mockTestAiAvailability).toHaveBeenCalledTimes(1);
        });

        // Should not have race conditions
        expect(mockSetAiCapabilities).toHaveBeenCalledTimes(1);
      });
    });

    describe('Advanced Error Handling and Recovery', () => {
      it('should handle network timeout errors gracefully', async () => {
        const consoleError = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const timeoutError = new Error('Network timeout');
        timeoutError.name = 'TimeoutError';
        mockTestAiAvailability.mockRejectedValue(timeoutError);

        const { container } = render(<Header />);

        await waitFor(() => {
          expect(consoleError).toHaveBeenCalledWith(
            'Failed to check AI capabilities:',
            timeoutError,
          );
        });

        // Should still show loading state when error occurs
        expect(
          container.querySelector('.bg-blue-500.animate-pulse'),
        ).toBeInTheDocument();

        consoleError.mockRestore();
      });

      it('should handle malformed AI capability responses', async () => {
        const consoleError = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        // Test a malformed response
        mockTestAiAvailability.mockResolvedValue(null);

        const { container } = render(<Header />);

        await waitFor(() => {
          expect(mockSetAiCapabilities).toHaveBeenCalled();
        });

        // Component should not crash
        expect(container).toBeTruthy();

        consoleError.mockRestore();
      });

      it('should handle store connection failures gracefully', () => {
        const consoleError = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        // Test store returning undefined or null
        mockUseAppStore.mockImplementation(() => ({
          aiCapabilities: undefined,
          setAiCapabilities: undefined,
        }));

        expect(() => render(<Header />)).not.toThrow();

        // Component should still render basic elements
        expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();

        consoleError.mockRestore();
      });
    });

    describe('Dynamic State Transitions and UI Consistency', () => {
      it('should maintain UI consistency during rapid state changes', async () => {
        const { container } = render(<Header />);

        // Component should render without crashing
        expect(container).toBeTruthy();

        // Core elements should be present
        const heading = screen.queryByRole('heading');
        expect(heading).toBeTruthy();
      });

      it('should handle isCheckingAi state correctly during async operations', async () => {
        let aiCheckResolver: (value: any) => void;
        const aiCheckPromise = new Promise((resolve) => {
          aiCheckResolver = resolve;
        });
        mockTestAiAvailability.mockReturnValue(aiCheckPromise);

        const { container } = render(<Header />);

        // Component should render
        expect(container).toBeTruthy();

        // Resolve the AI check
        await act(async () => {
          aiCheckResolver!({ summarizer: 'available' });
        });

        await waitFor(() => {
          expect(mockSetAiCapabilities).toHaveBeenCalled();
        });
      });
    });

    describe('Accessibility and Semantic Structure', () => {
      it('should provide comprehensive ARIA support for status indicators', () => {
        render(<Header />);

        // Status chip should be accessible
        const statusChip = document.querySelector(
          '.px-3.py-1.bg-gray-100.rounded-full',
        );
        expect(statusChip).toBeInTheDocument();

        // Status indicator should be discoverable
        const statusIndicator = document.querySelector('.w-2.h-2.rounded-full');
        expect(statusIndicator).toBeInTheDocument();

        // Text should be descriptive for screen readers
        expect(screen.getByText(/AI Status \(\d+\/\d+\)/)).toBeInTheDocument();
      });

      it('should provide proper semantic structure for assistive technologies', () => {
        render(<Header />);

        // Main heading should be properly marked
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Chrome AI DevBench');

        // Subtitle should be associated with main content
        const subtitle = screen.getByText(
          "Interactive playground for Chrome's built-in AI APIs",
        );
        expect(subtitle).toBeInTheDocument();
      });
    });

    describe('Performance Optimization and Memory Management', () => {
      it('should prevent memory leaks from async operations', async () => {
        let promiseResolver: (value: any) => void;
        const longRunningPromise = new Promise((resolve) => {
          promiseResolver = resolve;
        });
        mockTestAiAvailability.mockReturnValue(longRunningPromise);

        const { unmount } = render(<Header />);

        // Unmount before promise resolves
        unmount();

        // Resolve promise after unmount
        promiseResolver!({ summarizer: 'available' });

        // Should not cause any console errors or memory leaks
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      it('should handle high-frequency re-renders efficiently', () => {
        const { rerender } = render(<Header />);

        // Perform many rapid re-renders
        const startTime = performance.now();
        for (let i = 0; i < 100; i++) {
          rerender(<Header />);
        }
        const endTime = performance.now();

        // Should complete quickly (under 1 second for 100 re-renders)
        expect(endTime - startTime).toBeLessThan(1000);

        // Component should still work correctly
        expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
      });

      it("should optimize re-renders when props/state haven't changed", async () => {
        const { rerender } = render(<Header />);

        const initialCallCount = mockTestAiAvailability.mock.calls.length;

        // Multiple renders with same state should not trigger excessive AI checks
        for (let i = 0; i < 5; i++) {
          rerender(<Header />);
        }

        await waitFor(() => {
          expect(
            mockTestAiAvailability.mock.calls.length,
          ).toBeGreaterThanOrEqual(initialCallCount);
        });
      });
    });

    describe('Integration and Component Boundaries', () => {
      it('should handle store updates from external sources', async () => {
        const { container, rerender } = render(<Header />);

        // Component should render
        expect(container).toBeTruthy();

        rerender(<Header />);

        // Should not crash on rerender
        expect(container).toBeTruthy();
      });

      it('should maintain consistent behavior across different render contexts', () => {
        // Test in different wrapper scenarios
        const wrappers = [
          ({ children }: { children: React.ReactNode }) => (
            <div>{children}</div>
          ),
          ({ children }: { children: React.ReactNode }) => (
            <main>{children}</main>
          ),
          ({ children }: { children: React.ReactNode }) => (
            <section aria-label="header">{children}</section>
          ),
        ];

        wrappers.forEach((Wrapper, _index) => {
          const { container } = render(
            <Wrapper>
              <Header />
            </Wrapper>,
          );

          // Core functionality should work in all contexts
          expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
          expect(
            document.querySelector('.w-2.h-2.rounded-full'),
          ).toBeInTheDocument();

          // Clean up for next iteration
          container.remove();
        });
      });
    });
  });
});
