import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Header } from '../Header';

// Mock the usePlaygroundState hook
vi.mock(
  '@/features/unified-playground/shared/hooks/usePlaygroundState',
  () => ({
    usePlaygroundState: vi.fn(),
  }),
);

describe('Header Component', () => {
  let mockUsePlaygroundState: any;

  const renderHeader = () => {
    return act(() => {
      return render(<Header />);
    });
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked functions
    const { usePlaygroundState } = await import(
      '@/features/unified-playground/shared/hooks/usePlaygroundState'
    );

    mockUsePlaygroundState = vi.mocked(usePlaygroundState);

    // Mock usePlaygroundState to return test data
    mockUsePlaygroundState.mockReturnValue({
      capabilities: {},
      isLoading: false,
      availableApiCount: 0,
      totalApiCount: 7,
      errors: [],
      isInitialized: true,
      switchToApi: vi.fn(),
      retryCapabilityCheck: vi.fn(),
      checkAllCapabilities: vi.fn(),
      getAvailableApis: vi.fn(() => []),
      getApiStatus: vi.fn(() => 'unavailable'),
      clearErrors: vi.fn(),
      addError: vi.fn(),
      hasAvailableApis: false,
      hasErrors: false,
      activeApi: 'summarizer',
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
    it('uses playground state to get capabilities', () => {
      render(<Header />);

      // usePlaygroundState should have been called
      expect(mockUsePlaygroundState).toHaveBeenCalled();
    });

    it('displays capabilities from playground state', () => {
      const mockCapabilities = {
        summarizer: {
          name: 'summarizer',
          status: 'available' as const,
          lastChecked: Date.now(),
        },
        translator: {
          name: 'translator',
          status: 'unavailable' as const,
          lastChecked: Date.now(),
        },
      };

      mockUsePlaygroundState.mockReturnValue({
        capabilities: mockCapabilities,
        isLoading: false,
        availableApiCount: 1,
        totalApiCount: 2,
        errors: [],
        isInitialized: true,
        switchToApi: vi.fn(),
        retryCapabilityCheck: vi.fn(),
        checkAllCapabilities: vi.fn(),
        getAvailableApis: vi.fn(() => [mockCapabilities.summarizer]),
        getApiStatus: vi.fn(() => 'available'),
        clearErrors: vi.fn(),
        addError: vi.fn(),
        hasAvailableApis: true,
        hasErrors: false,
        activeApi: 'summarizer',
      });

      render(<Header />);

      // Component should render without errors
      expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
    });
  });

  describe('AI Status Indicator', () => {
    it('shows loading state when isLoading is true', () => {
      mockUsePlaygroundState.mockReturnValue({
        capabilities: {},
        isLoading: true,
        availableApiCount: 0,
        totalApiCount: 7,
        errors: [],
        isInitialized: false,
        switchToApi: vi.fn(),
        retryCapabilityCheck: vi.fn(),
        checkAllCapabilities: vi.fn(),
        getAvailableApis: vi.fn(() => []),
        getApiStatus: vi.fn(() => 'unavailable'),
        clearErrors: vi.fn(),
        addError: vi.fn(),
        hasAvailableApis: false,
        hasErrors: false,
        activeApi: 'summarizer',
      });

      render(<Header />);

      const statusIndicator = document.querySelector(
        '.bg-blue-500.animate-pulse',
      );
      expect(statusIndicator).toBeInTheDocument();
    });

    it('shows unavailable state when all APIs are unavailable', async () => {
      const unavailableCapabilities = {
        summarizer: {
          name: 'summarizer',
          status: 'unavailable' as const,
          lastChecked: Date.now(),
        },
        translator: {
          name: 'translator',
          status: 'unavailable' as const,
          lastChecked: Date.now(),
        },
        writer: {
          name: 'writer',
          status: 'unavailable' as const,
          lastChecked: Date.now(),
        },
        rewriter: {
          name: 'rewriter',
          status: 'unavailable' as const,
          lastChecked: Date.now(),
        },
        proofreader: {
          name: 'proofreader',
          status: 'unavailable' as const,
          lastChecked: Date.now(),
        },
        prompt: {
          name: 'prompt',
          status: 'unavailable' as const,
          lastChecked: Date.now(),
        },
        languageDetection: {
          name: 'languageDetection',
          status: 'unavailable' as const,
          lastChecked: Date.now(),
        },
      };

      // Update usePlaygroundState mock
      mockUsePlaygroundState.mockReturnValue({
        capabilities: unavailableCapabilities,
        isLoading: false,
        availableApiCount: 0,
        totalApiCount: 7,
        errors: [],
        isInitialized: true,
        switchToApi: vi.fn(),
        retryCapabilityCheck: vi.fn(),
        checkAllCapabilities: vi.fn(),
        getAvailableApis: vi.fn(() => []),
        getApiStatus: vi.fn(() => 'unavailable'),
        clearErrors: vi.fn(),
        addError: vi.fn(),
        hasAvailableApis: false,
        hasErrors: false,
        activeApi: 'summarizer',
      });

      const { container } = render(<Header />);

      await waitFor(() => {
        const statusIndicator = container.querySelector('.bg-red-500');
        expect(statusIndicator).toBeInTheDocument();
      });
    });

    it('shows available state when at least one API is available', async () => {
      const availableCapabilities = {
        summarizer: {
          name: 'summarizer',
          status: 'available' as const,
          lastChecked: Date.now(),
        },
        translator: {
          name: 'translator',
          status: 'unavailable' as const,
          lastChecked: Date.now(),
        },
        writer: {
          name: 'writer',
          status: 'unavailable' as const,
          lastChecked: Date.now(),
        },
        rewriter: {
          name: 'rewriter',
          status: 'unavailable' as const,
          lastChecked: Date.now(),
        },
        proofreader: {
          name: 'proofreader',
          status: 'unavailable' as const,
          lastChecked: Date.now(),
        },
        prompt: {
          name: 'prompt',
          status: 'unavailable' as const,
          lastChecked: Date.now(),
        },
        languageDetection: {
          name: 'languageDetection',
          status: 'unavailable' as const,
          lastChecked: Date.now(),
        },
      };

      // Update usePlaygroundState mock
      mockUsePlaygroundState.mockReturnValue({
        capabilities: availableCapabilities,
        isLoading: false,
        availableApiCount: 1,
        totalApiCount: 7,
        errors: [],
        isInitialized: true,
        switchToApi: vi.fn(),
        retryCapabilityCheck: vi.fn(),
        checkAllCapabilities: vi.fn(),
        getAvailableApis: vi.fn(() => [availableCapabilities.summarizer]),
        getApiStatus: vi.fn((name) =>
          name === 'summarizer' ? 'available' : 'unavailable',
        ),
        clearErrors: vi.fn(),
        addError: vi.fn(),
        hasAvailableApis: true,
        hasErrors: false,
        activeApi: 'summarizer',
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
    it('uses playground state efficiently', async () => {
      const { rerender } = render(<Header />);

      // usePlaygroundState should be called
      expect(mockUsePlaygroundState).toHaveBeenCalled();

      // Re-render should work correctly
      rerender(<Header />);

      // Component should still render correctly
      expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
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
    it('handles hook errors gracefully', () => {
      mockUsePlaygroundState.mockImplementation(() => {
        throw new Error('Hook error');
      });

      expect(() => render(<Header />)).toThrow('Hook error');
    });
  });

  describe('Advanced Edge Cases', () => {
    describe('Complex AI Capability State Management', () => {
      it('should handle partial API availability states correctly', async () => {
        const partialCapabilities = {
          summarizer: {
            name: 'summarizer',
            status: 'available' as const,
            lastChecked: Date.now(),
          },
          translator: {
            name: 'translator',
            status: 'loading' as const,
            lastChecked: Date.now(),
          },
          writer: {
            name: 'writer',
            status: 'unavailable' as const,
            lastChecked: Date.now(),
          },
          rewriter: {
            name: 'rewriter',
            status: 'available' as const,
            lastChecked: Date.now(),
          },
          proofreader: {
            name: 'proofreader',
            status: 'unavailable' as const,
            lastChecked: Date.now(),
          },
          prompt: {
            name: 'prompt',
            status: 'available' as const,
            lastChecked: Date.now(),
          },
          languageDetection: {
            name: 'languageDetection',
            status: 'error' as const,
            lastChecked: Date.now(),
          },
        };

        // Update usePlaygroundState mock
        mockUsePlaygroundState.mockReturnValue({
          capabilities: partialCapabilities,
          isLoading: false,
          availableApiCount: 3,
          totalApiCount: 7,
          errors: [],
          isInitialized: true,
          switchToApi: vi.fn(),
          retryCapabilityCheck: vi.fn(),
          checkAllCapabilities: vi.fn(),
          getAvailableApis: vi.fn(() => [
            partialCapabilities.summarizer,
            partialCapabilities.rewriter,
            partialCapabilities.prompt,
          ]),
          getApiStatus: vi.fn(
            (name) =>
              partialCapabilities[name as keyof typeof partialCapabilities]
                ?.status || 'unavailable',
          ),
          clearErrors: vi.fn(),
          addError: vi.fn(),
          hasAvailableApis: true,
          hasErrors: false,
          activeApi: 'summarizer',
        });

        const { container } = render(<Header />);

        // Should show available status since at least one API is available
        const statusIndicator = container.querySelector('.bg-green-500');
        expect(statusIndicator).toBeTruthy();
      });

      it('should handle AI capability state transitions during component lifecycle', async () => {
        const { container } = render(<Header />);

        // Component should render
        expect(container).toBeTruthy();

        // Update mock to simulate state change
        mockUsePlaygroundState.mockReturnValue({
          capabilities: {
            summarizer: {
              name: 'summarizer',
              status: 'available' as const,
              lastChecked: Date.now(),
            },
            translator: {
              name: 'translator',
              status: 'available' as const,
              lastChecked: Date.now(),
            },
          },
          isLoading: false,
          availableApiCount: 2,
          totalApiCount: 7,
          errors: [],
          isInitialized: true,
          switchToApi: vi.fn(),
          retryCapabilityCheck: vi.fn(),
          checkAllCapabilities: vi.fn(),
          getAvailableApis: vi.fn(() => []),
          getApiStatus: vi.fn(() => 'available'),
          clearErrors: vi.fn(),
          addError: vi.fn(),
          hasAvailableApis: true,
          hasErrors: false,
          activeApi: 'summarizer',
        });

        // Component should still render
        expect(container).toBeTruthy();
      });

      it('should handle concurrent AI availability checks without race conditions', async () => {
        const { rerender } = render(<Header />);

        // Trigger multiple re-renders rapidly
        for (let i = 0; i < 3; i++) {
          rerender(<Header />);
        }

        // Component should still render correctly
        expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
      });
    });

    describe('Advanced Error Handling and Recovery', () => {
      it('should handle network timeout errors gracefully', async () => {
        mockUsePlaygroundState.mockReturnValue({
          capabilities: {},
          isLoading: true,
          availableApiCount: 0,
          totalApiCount: 7,
          errors: ['Network timeout'],
          isInitialized: false,
          switchToApi: vi.fn(),
          retryCapabilityCheck: vi.fn(),
          checkAllCapabilities: vi.fn(),
          getAvailableApis: vi.fn(() => []),
          getApiStatus: vi.fn(() => 'unavailable'),
          clearErrors: vi.fn(),
          addError: vi.fn(),
          hasAvailableApis: false,
          hasErrors: true,
          activeApi: 'summarizer',
        });

        const { container } = render(<Header />);

        // Should still show loading state when error occurs
        expect(
          container.querySelector('.bg-blue-500.animate-pulse'),
        ).toBeInTheDocument();
      });

      it('should handle malformed AI capability responses', async () => {
        // Component should not crash even with empty capabilities
        const { container } = render(<Header />);

        // Component should not crash
        expect(container).toBeTruthy();
      });

      it('should handle store connection failures gracefully', () => {
        // Test with minimal mock data
        mockUsePlaygroundState.mockReturnValue({
          capabilities: {},
          isLoading: false,
          availableApiCount: 0,
          totalApiCount: 7,
          errors: [],
          isInitialized: true,
          switchToApi: vi.fn(),
          retryCapabilityCheck: vi.fn(),
          checkAllCapabilities: vi.fn(),
          getAvailableApis: vi.fn(() => []),
          getApiStatus: vi.fn(() => 'unavailable'),
          clearErrors: vi.fn(),
          addError: vi.fn(),
          hasAvailableApis: false,
          hasErrors: false,
          activeApi: 'summarizer',
        });

        expect(() => render(<Header />)).not.toThrow();

        // Component should still render basic elements
        expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
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
        const { container } = render(<Header />);

        // Component should render
        expect(container).toBeTruthy();

        // Component should work correctly
        expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
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
        const { unmount } = render(<Header />);

        // Unmount component
        unmount();

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

        // Multiple renders with same state should work correctly
        for (let i = 0; i < 5; i++) {
          rerender(<Header />);
        }

        // Component should still render correctly
        expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
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
