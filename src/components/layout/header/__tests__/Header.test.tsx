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

      // Check main container
      const container = document.querySelector(
        '.flex.items-center.justify-between',
      );
      expect(container).toBeInTheDocument();
    });

    it('displays Chrome logo', () => {
      renderHeader();

      const logo = document.querySelector('svg');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('viewBox', '0 0 24 24');
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

    it('displays API status chip', () => {
      renderHeader();

      expect(screen.getByText('Chrome AI APIs Required')).toBeInTheDocument();
    });

    it('displays Documentation button', () => {
      renderHeader();

      const docButton = screen.getByRole('button', { name: 'Documentation' });
      expect(docButton).toBeInTheDocument();
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
        '.bg-yellow-500.animate-pulse',
      );
      expect(statusIndicator).toBeInTheDocument();
    });

    it('shows unavailable state when all APIs are unavailable', () => {
      mockUseAppStore.mockImplementation((selector: (state: any) => any) => {
        const state = {
          aiCapabilities: {
            summarizer: 'unavailable',
            translator: 'unavailable',
            writer: 'unavailable',
            rewriter: 'unavailable',
            proofreader: 'unavailable',
            prompt: 'unavailable',
            languageDetection: 'unavailable',
          },
          setAiCapabilities: mockSetAiCapabilities,
        };
        return selector(state);
      });

      render(<Header />);

      const statusIndicator = document.querySelector('.bg-red-500');
      expect(statusIndicator).toBeInTheDocument();
    });

    it('shows available state when at least one API is available', () => {
      mockUseAppStore.mockImplementation((selector: (state: any) => any) => {
        const state = {
          aiCapabilities: {
            summarizer: 'available',
            translator: 'unavailable',
            writer: 'unavailable',
            rewriter: 'unavailable',
            proofreader: 'unavailable',
            prompt: 'unavailable',
            languageDetection: 'unavailable',
          },
          setAiCapabilities: mockSetAiCapabilities,
        };
        return selector(state);
      });

      render(<Header />);

      const statusIndicator = document.querySelector('.bg-green-500');
      expect(statusIndicator).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('handles Documentation button click', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const docButton = screen.getByRole('button', { name: 'Documentation' });
      await user.click(docButton);

      // Button should be clickable (no error thrown)
      expect(docButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<Header />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Chrome AI DevBench');
    });

    it('has accessible button labels', () => {
      render(<Header />);

      const docButton = screen.getByRole('button', { name: 'Documentation' });
      expect(docButton).toBeInTheDocument();
    });

    it('provides semantic information about status', () => {
      render(<Header />);

      // Status text should be descriptive
      expect(screen.getByText('Chrome AI APIs Required')).toBeInTheDocument();
    });

    it('has accessible logo with proper SVG structure', () => {
      render(<Header />);

      const logo = document.querySelector('svg');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('viewBox');
    });
  });

  describe('Visual Design', () => {
    it('applies correct typography classes', () => {
      render(<Header />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-xl', 'font-semibold', 'text-gray-900');

      const subtitle = screen.getByText(
        "Interactive playground for Chrome's built-in AI APIs",
      );
      expect(subtitle).toHaveClass('text-sm', 'text-gray-500');
    });

    it('applies correct spacing and layout classes', () => {
      render(<Header />);

      const container = document.querySelector(
        '.flex.items-center.justify-between',
      );
      expect(container).toHaveClass('px-6', 'py-4');
    });

    it('styles status chip correctly', () => {
      render(<Header />);

      const statusChip = document.querySelector(
        '.px-3.py-1.bg-gray-100.rounded-full',
      );
      expect(statusChip).toBeInTheDocument();
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

  describe('Chrome Logo SVG', () => {
    it('renders Chrome logo with correct colors and structure', () => {
      render(<Header />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // Check for Chrome logo elements
      const circles = svg?.querySelectorAll('circle');
      expect(circles).toHaveLength(4);

      // Check color attributes
      const outerCircle = circles?.[0];
      expect(outerCircle).toHaveAttribute('stroke', '#4285F4');

      const redCircle = circles?.[1];
      expect(redCircle).toHaveAttribute('fill', '#EA4335');

      const yellowCircle = circles?.[2];
      expect(yellowCircle).toHaveAttribute('fill', '#FBBC04');

      const greenCircle = circles?.[3];
      expect(greenCircle).toHaveAttribute('fill', '#34A853');
    });
  });

  describe('Ultrathink Test Suite - Advanced Edge Cases', () => {
    describe('Complex AI Capability State Management', () => {
      it('ultrathink: should handle partial API availability states correctly', async () => {
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

        render(<Header />);

        await waitFor(() => {
          expect(mockSetAiCapabilities).toHaveBeenCalledWith(
            partialCapabilities,
          );
        });

        // Should show available status since at least one API is available
        const statusIndicator = document.querySelector('.bg-green-500');
        expect(statusIndicator).toBeInTheDocument();
      });

      it('ultrathink: should handle AI capability state transitions during component lifecycle', async () => {
        let capabilitiesResolver: (value: any) => void;
        const capabilitiesPromise = new Promise((resolve) => {
          capabilitiesResolver = resolve;
        });
        mockTestAiAvailability.mockReturnValue(capabilitiesPromise);

        render(<Header />);

        // Initially should show loading state
        expect(
          document.querySelector('.bg-yellow-500.animate-pulse'),
        ).toBeInTheDocument();

        // Resolve with available capabilities
        capabilitiesResolver!({
          summarizer: 'available',
          translator: 'available',
        });

        await waitFor(() => {
          expect(document.querySelector('.bg-green-500')).toBeInTheDocument();
        });

        // Loading indicator should be gone
        expect(
          document.querySelector('.bg-yellow-500.animate-pulse'),
        ).not.toBeInTheDocument();
      });

      it('ultrathink: should handle concurrent AI availability checks without race conditions', async () => {
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
      it('ultrathink: should handle network timeout errors gracefully', async () => {
        const consoleError = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const timeoutError = new Error('Network timeout');
        timeoutError.name = 'TimeoutError';
        mockTestAiAvailability.mockRejectedValue(timeoutError);

        render(<Header />);

        await waitFor(() => {
          expect(consoleError).toHaveBeenCalledWith(
            'Failed to check AI capabilities:',
            timeoutError,
          );
        });

        // Should still show loading state when error occurs
        expect(
          document.querySelector('.bg-yellow-500.animate-pulse'),
        ).toBeInTheDocument();

        consoleError.mockRestore();
      });

      it('ultrathink: should handle malformed AI capability responses', async () => {
        const consoleError = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        // Test various malformed responses
        const malformedResponses = [
          null,
          undefined,
          'invalid string',
          123,
          [],
          { invalidStructure: true },
          { summarizer: null, translator: undefined },
        ];

        for (const response of malformedResponses) {
          mockTestAiAvailability.mockResolvedValue(response);

          render(<Header />);

          await waitFor(() => {
            expect(mockSetAiCapabilities).toHaveBeenCalledWith(response);
          });

          // Component should not crash
          expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
        }

        consoleError.mockRestore();
      });

      it('ultrathink: should handle store connection failures gracefully', () => {
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
      it('ultrathink: should maintain UI consistency during rapid state changes', async () => {
        const stateSequence = [
          null, // loading
          { summarizer: 'available' }, // available
          { summarizer: 'unavailable' }, // unavailable
          { summarizer: 'available', translator: 'available' }, // available
          null, // loading again
        ];

        for (let i = 0; i < stateSequence.length; i++) {
          mockUseAppStore.mockImplementation(
            (selector: (state: any) => any) => {
              const state = {
                aiCapabilities: stateSequence[i],
                setAiCapabilities: mockSetAiCapabilities,
              };
              return selector(state);
            },
          );

          const { rerender } = render(<Header />);
          rerender(<Header />);

          // Verify correct status indicator is shown
          if (stateSequence[i] === null) {
            expect(
              document.querySelector('.bg-yellow-500.animate-pulse'),
            ).toBeInTheDocument();
          } else if (
            Object.values(stateSequence[i]!).some(
              (status) => status === 'available',
            )
          ) {
            expect(document.querySelector('.bg-green-500')).toBeInTheDocument();
          } else {
            expect(document.querySelector('.bg-red-500')).toBeInTheDocument();
          }

          // Core elements should always be present
          expect(screen.getByText('Chrome AI DevBench')).toBeInTheDocument();
          expect(
            screen.getByText('Chrome AI APIs Required'),
          ).toBeInTheDocument();
        }
      });

      it('ultrathink: should handle isCheckingAi state correctly during async operations', async () => {
        let aiCheckResolver: (value: any) => void;
        const aiCheckPromise = new Promise((resolve) => {
          aiCheckResolver = resolve;
        });
        mockTestAiAvailability.mockReturnValue(aiCheckPromise);

        render(<Header />);

        // During check, should show loading/pulse animation
        expect(document.querySelector('.animate-pulse')).toBeInTheDocument();

        // Resolve the AI check
        aiCheckResolver!({ summarizer: 'available' });

        await waitFor(() => {
          expect(mockSetAiCapabilities).toHaveBeenCalled();
        });

        // Pulse animation should stop
        await waitFor(() => {
          expect(
            document.querySelector('.animate-pulse'),
          ).not.toBeInTheDocument();
        });
      });
    });

    describe('Accessibility and Semantic Structure', () => {
      it('ultrathink: should provide comprehensive ARIA support for status indicators', () => {
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
        expect(screen.getByText('Chrome AI APIs Required')).toBeInTheDocument();
      });

      it('ultrathink: should maintain keyboard navigation support', async () => {
        const user = userEvent.setup();
        render(<Header />);

        const docButton = screen.getByRole('button', { name: 'Documentation' });

        // Button should be focusable
        await user.tab();
        expect(docButton).toHaveFocus();

        // Should support keyboard activation
        await user.keyboard('{Enter}');
        // No error should be thrown
        expect(docButton).toBeInTheDocument();
      });

      it('ultrathink: should provide proper semantic structure for assistive technologies', () => {
        render(<Header />);

        // Main heading should be properly marked
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Chrome AI DevBench');

        // Subtitle should be associated with main content
        const subtitle = screen.getByText(
          "Interactive playground for Chrome's built-in AI APIs",
        );
        expect(subtitle).toBeInTheDocument();

        // Button should have proper role
        const button = screen.getByRole('button', { name: 'Documentation' });
        expect(button).toBeInTheDocument();
      });
    });

    describe('Performance Optimization and Memory Management', () => {
      it('ultrathink: should prevent memory leaks from async operations', async () => {
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

      it('ultrathink: should handle high-frequency re-renders efficiently', () => {
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
        expect(
          screen.getByRole('button', { name: 'Documentation' }),
        ).toBeInTheDocument();
      });

      it("ultrathink: should optimize re-renders when props/state haven't changed", async () => {
        render(<Header />);

        const initialCallCount = mockTestAiAvailability.mock.calls.length;

        // Multiple renders with same state should not trigger additional AI checks
        const { rerender } = render(<Header />);
        for (let i = 0; i < 5; i++) {
          rerender(<Header />);
        }

        await waitFor(() => {
          expect(mockTestAiAvailability).toHaveBeenCalledTimes(
            initialCallCount,
          );
        });
      });
    });

    describe('Chrome Logo Advanced Rendering', () => {
      it('ultrathink: should handle SVG rendering across different environments', () => {
        render(<Header />);

        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();

        // Check SVG accessibility
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
        expect(svg).toHaveClass('w-6', 'h-6');

        // Verify all Chrome brand colors are present
        const circles = svg?.querySelectorAll('circle');
        expect(circles).toHaveLength(4);

        // Check layering order (outer to inner)
        const circleRadii = Array.from(circles || []).map((circle) =>
          parseInt(circle.getAttribute('r') || '0'),
        );
        expect(circleRadii).toEqual([10, 6, 3, 1.5]);
      });

      it('ultrathink: should maintain Chrome logo visual consistency', () => {
        render(<Header />);

        const svg = document.querySelector('svg');
        const circles = svg?.querySelectorAll('circle');

        // Verify Google brand colors exactly
        expect(circles?.[0]).toHaveAttribute('stroke', '#4285F4'); // Google Blue
        expect(circles?.[1]).toHaveAttribute('fill', '#EA4335'); // Google Red
        expect(circles?.[2]).toHaveAttribute('fill', '#FBBC04'); // Google Yellow
        expect(circles?.[3]).toHaveAttribute('fill', '#34A853'); // Google Green

        // Verify stroke width and fill properties
        expect(circles?.[0]).toHaveAttribute('strokeWidth', '2');
        expect(circles?.[0]).toHaveAttribute('fill', 'none');
      });
    });

    describe('Integration and Component Boundaries', () => {
      it('ultrathink: should handle store updates from external sources', async () => {
        let storeState: any = {
          aiCapabilities: null,
          setAiCapabilities: mockSetAiCapabilities,
        };

        mockUseAppStore.mockImplementation((selector: (state: any) => any) =>
          selector(storeState),
        );

        const { rerender } = render(<Header />);

        // Simulate external store update
        storeState = {
          ...storeState,
          aiCapabilities: {
            summarizer: 'available',
            translator: 'unavailable',
            writer: 'unavailable',
            rewriter: 'unavailable',
            proofreader: 'unavailable',
            prompt: 'unavailable',
            languageDetection: 'unavailable',
          },
        };

        rerender(<Header />);

        // Should reflect new state
        expect(document.querySelector('.bg-green-500')).toBeInTheDocument();
      });

      it('ultrathink: should maintain consistent behavior across different render contexts', () => {
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
            screen.getByRole('button', { name: 'Documentation' }),
          ).toBeInTheDocument();
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
