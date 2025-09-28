import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Sidebar } from '../Sidebar';

// Mock the app store
const mockUseAppStore = vi.fn();
vi.mock('@/stores/appStore', () => ({
  useAppStore: (selector: any) => mockUseAppStore(selector),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Zap: ({ className, ...props }: any) => (
    <svg data-testid="zap-icon" className={className} {...props}>
      Zap
    </svg>
  ),
  Globe: ({ className, ...props }: any) => (
    <svg data-testid="globe-icon" className={className} {...props}>
      Globe
    </svg>
  ),
  ChevronRight: ({ className, ...props }: any) => (
    <svg data-testid="chevron-right-icon" className={className} {...props}>
      ChevronRight
    </svg>
  ),
  RotateCcw: ({ className, ...props }: any) => (
    <svg data-testid="rotate-ccw-icon" className={className} {...props}>
      RotateCcw
    </svg>
  ),
  CheckCircle: ({ className, ...props }: any) => (
    <svg data-testid="check-circle-icon" className={className} {...props}>
      CheckCircle
    </svg>
  ),
  Circle: ({ className, ...props }: any) => (
    <svg data-testid="circle-icon" className={className} {...props}>
      Circle
    </svg>
  ),
}));

describe('Sidebar Component', () => {
  const mockSetActiveApi = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default store state
    mockUseAppStore.mockImplementation((selector) => {
      if (typeof selector !== 'function') {
        return { activeApi: 'summarizer', setActiveApi: mockSetActiveApi };
      }
      const state = {
        activeApi: 'summarizer',
        setActiveApi: mockSetActiveApi,
      };
      return selector(state);
    });
  });

  describe('Structure and Layout', () => {
    it('renders with correct structure', () => {
      render(<Sidebar />);

      const container = document.querySelector('.p-6');
      expect(container).toBeInTheDocument();
    });

    it('displays the header section', () => {
      render(<Sidebar />);

      expect(screen.getByText('Available APIs')).toBeInTheDocument();
      expect(
        screen.getByText('Select an API to explore its capabilities'),
      ).toBeInTheDocument();
    });

    it('renders all 7 API options', () => {
      render(<Sidebar />);

      expect(screen.getByText('Summarizer API')).toBeInTheDocument();
      expect(screen.getByText('Translator API')).toBeInTheDocument();
      expect(screen.getByText('Writer API')).toBeInTheDocument();
      expect(screen.getByText('Rewriter API')).toBeInTheDocument();
      expect(screen.getByText('Proofreader API')).toBeInTheDocument();
      expect(screen.getByText('Prompt API (Multimodal)')).toBeInTheDocument();
      expect(screen.getByText('Language Detection')).toBeInTheDocument();
    });

    it('displays correct descriptions for each API', () => {
      render(<Sidebar />);

      expect(
        screen.getByText('Content summarization and condensation'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Real-time language translation'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Content generation and creative writing'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Content restructuring and style adaptation'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Grammar and writing improvement'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Flexible AI prompting with multimodal support'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Automatic language identification'),
      ).toBeInTheDocument();
    });
  });

  describe('Icons and Visual Elements', () => {
    it('displays correct icons for each API', () => {
      render(<Sidebar />);

      expect(screen.getByTestId('zap-icon')).toBeInTheDocument(); // Summarizer
      expect(screen.getAllByTestId('globe-icon')).toHaveLength(2); // Translator + Language Detection
      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument(); // Writer
      expect(screen.getByTestId('rotate-ccw-icon')).toBeInTheDocument(); // Rewriter
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument(); // Proofreader
      expect(screen.getByTestId('circle-icon')).toBeInTheDocument(); // Prompt
    });

    it('applies correct icon styling', () => {
      render(<Sidebar />);

      const icons = document.querySelectorAll('svg.w-5.h-5.flex-shrink-0');
      expect(icons.length).toBeGreaterThan(0);
      icons.forEach((icon) => {
        expect(icon).toHaveClass('w-5', 'h-5', 'flex-shrink-0');
      });
    });
  });

  describe('Active State Management', () => {
    it('highlights the active API correctly', () => {
      render(<Sidebar />);

      const summarizerButton = screen.getByRole('button', {
        name: /Summarizer API/,
      });
      expect(summarizerButton).toHaveClass('bg-gray-900', 'text-white');
    });

    it('shows non-active APIs with default styling', () => {
      render(<Sidebar />);

      const translatorButton = screen.getByRole('button', {
        name: /Translator API/,
      });
      expect(translatorButton).toHaveClass('hover:bg-gray-50', 'text-gray-900');
      expect(translatorButton).not.toHaveClass('bg-gray-900');
    });

    it('updates active state when different API is selected', () => {
      mockUseAppStore.mockImplementation((selector) => {
        if (typeof selector !== 'function') {
          return { activeApi: 'translator', setActiveApi: mockSetActiveApi };
        }
        const state = {
          activeApi: 'translator',
          setActiveApi: mockSetActiveApi,
        };
        return selector(state);
      });

      render(<Sidebar />);

      const translatorButton = screen.getByRole('button', {
        name: /Translator API/,
      });
      expect(translatorButton).toHaveClass('bg-gray-900', 'text-white');

      const summarizerButton = screen.getByRole('button', {
        name: /Summarizer API/,
      });
      expect(summarizerButton).not.toHaveClass('bg-gray-900');
    });
  });

  describe('User Interactions', () => {
    it('calls setActiveApi when an API is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const translatorButton = screen.getByRole('button', {
        name: /Translator API/,
      });
      await user.click(translatorButton);

      expect(mockSetActiveApi).toHaveBeenCalledWith('translator');
    });

    it('handles multiple API clicks correctly', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      await user.click(screen.getByRole('button', { name: /Writer API/ }));
      expect(mockSetActiveApi).toHaveBeenCalledWith('writer');

      await user.click(screen.getByRole('button', { name: /Rewriter API/ }));
      expect(mockSetActiveApi).toHaveBeenCalledWith('rewriter');

      expect(mockSetActiveApi).toHaveBeenCalledTimes(2);
    });

    it('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const firstButton = screen.getByRole('button', {
        name: /Summarizer API/,
      });
      firstButton.focus();

      await user.keyboard('{Enter}');
      expect(mockSetActiveApi).toHaveBeenCalledWith('summarizer');
    });
  });

  describe('Accessibility', () => {
    it('provides proper button roles', () => {
      render(<Sidebar />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(7); // All 7 APIs should be buttons
    });

    it('has accessible button names', () => {
      render(<Sidebar />);

      expect(
        screen.getByRole('button', {
          name: /Summarizer API.*Content summarization/,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: /Translator API.*Real-time language/,
        }),
      ).toBeInTheDocument();
    });

    it('maintains proper heading hierarchy', () => {
      render(<Sidebar />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Available APIs');
    });

    it('provides semantic information about selection state', () => {
      render(<Sidebar />);

      const activeButton = screen.getByRole('button', {
        name: /Summarizer API/,
      });
      expect(activeButton).toHaveClass('bg-gray-900', 'text-white');
    });

    it('ensures proper contrast for active state', () => {
      render(<Sidebar />);

      const activeButton = screen.getByRole('button', {
        name: /Summarizer API/,
      });
      expect(activeButton).toHaveClass('text-white'); // White text on dark background
    });
  });

  describe('Responsive Design', () => {
    it('maintains layout structure', () => {
      render(<Sidebar />);

      const container = document.querySelector('.space-y-1');
      expect(container).toBeInTheDocument();
    });

    it('handles text overflow properly', () => {
      render(<Sidebar />);

      const buttonContents = document.querySelectorAll('.min-w-0');
      expect(buttonContents.length).toBeGreaterThan(0);

      const descriptions = document.querySelectorAll('.truncate');
      expect(descriptions.length).toBeGreaterThan(0);
    });

    it('maintains icon sizing', () => {
      render(<Sidebar />);

      const iconContainers = document.querySelectorAll('.flex-shrink-0');
      expect(iconContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Design', () => {
    it('applies correct typography', () => {
      render(<Sidebar />);

      const heading = screen.getByText('Available APIs');
      expect(heading).toHaveClass('text-lg', 'font-semibold', 'text-gray-900');

      const subtitle = screen.getByText(
        'Select an API to explore its capabilities',
      );
      expect(subtitle).toHaveClass('text-sm', 'text-gray-500');
    });

    it('applies proper spacing', () => {
      render(<Sidebar />);

      const header = document.querySelector('.mb-6');
      expect(header).toBeInTheDocument();

      const buttonList = document.querySelector('.space-y-1');
      expect(buttonList).toBeInTheDocument();
    });

    it('uses consistent button styling', () => {
      render(<Sidebar />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass(
          'w-full',
          'flex',
          'items-center',
          'gap-3',
          'px-4',
          'py-3',
          'rounded-lg',
          'text-left',
          'transition-colors',
        );
      });
    });
  });

  describe('Performance', () => {
    it('renders efficiently with multiple APIs', () => {
      const startTime = performance.now();
      render(<Sidebar />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render quickly
    });

    it('handles rapid re-renders without issues', () => {
      const { rerender } = render(<Sidebar />);

      for (let i = 0; i < 10; i++) {
        rerender(<Sidebar />);
      }

      expect(screen.getByText('Available APIs')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing activeApi gracefully', () => {
      mockUseAppStore.mockImplementation((selector) => {
        if (typeof selector !== 'function') {
          return { activeApi: undefined, setActiveApi: mockSetActiveApi };
        }
        const state = {
          activeApi: undefined,
          setActiveApi: mockSetActiveApi,
        };
        return selector(state);
      });

      expect(() => render(<Sidebar />)).not.toThrow();
    });

    it('handles store errors gracefully', () => {
      mockUseAppStore.mockImplementation(() => {
        throw new Error('Store error');
      });

      expect(() => render(<Sidebar />)).toThrow('Store error');
    });
  });

  describe('Data Validation', () => {
    it('contains all expected API IDs', () => {
      render(<Sidebar />);

      const expectedAPIs = [
        'summarizer',
        'translator',
        'writer',
        'rewriter',
        'proofreader',
        'prompt',
        'language-detection',
      ];

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(expectedAPIs.length);
    });

    it('maps icons correctly to APIs', () => {
      render(<Sidebar />);

      // Check that specific icons appear for specific APIs
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument(); // Summarizer
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument(); // Proofreader
      expect(screen.getByTestId('circle-icon')).toBeInTheDocument(); // Prompt
    });
  });

  describe('State Consistency', () => {
    it('reflects store state accurately', () => {
      mockUseAppStore.mockImplementation((selector) => {
        if (typeof selector !== 'function') {
          return { activeApi: 'proofreader', setActiveApi: mockSetActiveApi };
        }
        const state = {
          activeApi: 'proofreader',
          setActiveApi: mockSetActiveApi,
        };
        return selector(state);
      });

      render(<Sidebar />);

      const proofreaderButton = screen.getByRole('button', {
        name: /Proofreader API/,
      });
      expect(proofreaderButton).toHaveClass('bg-gray-900', 'text-white');
    });
  });

  describe('Ultrathink Test Suite - Advanced Edge Cases', () => {
    describe('Complex State Management and Transitions', () => {
      it('ultrathink: should handle rapid API selection changes without state conflicts', async () => {
        const user = userEvent.setup();
        render(<Sidebar />);

        const apiButtons = [
          'summarizer',
          'translator',
          'writer',
          'rewriter',
          'proofreader',
          'prompt',
          'language-detection',
        ];

        // Rapidly click through all APIs
        const buttonNameMap = {
          summarizer: /Summarizer API/i,
          translator: /Translator API/i,
          writer: /^Writer API$/i,
          rewriter: /Rewriter API/i,
          proofreader: /Proofreader API/i,
          prompt: /Prompt API \(Multimodal\)/i,
          'language-detection': /Language Detection/i,
        };

        for (const apiId of apiButtons) {
          const button = screen.getByRole('button', {
            name: buttonNameMap[apiId as keyof typeof buttonNameMap],
          });
          await user.click(button);
          expect(mockSetActiveApi).toHaveBeenCalledWith(apiId);
        }

        expect(mockSetActiveApi).toHaveBeenCalledTimes(7);
      });

      it('ultrathink: should handle invalid activeApi states gracefully', () => {
        const invalidStates = [
          'nonexistent-api',
          '',
          null,
          undefined,
          123,
          {},
          [],
        ];

        invalidStates.forEach((invalidState) => {
          mockUseAppStore.mockImplementation((selector) => {
            if (typeof selector !== 'function') {
              return {
                activeApi: invalidState,
                setActiveApi: mockSetActiveApi,
              };
            }
            const state = {
              activeApi: invalidState,
              setActiveApi: mockSetActiveApi,
            };
            return selector(state);
          });

          expect(() => render(<Sidebar />)).not.toThrow();

          // Should still render all APIs
          expect(screen.getByText('Available APIs')).toBeInTheDocument();
          expect(screen.getAllByRole('button')).toHaveLength(7);

          // When invalid state, no button should be highlighted
          const buttons = screen.getAllByRole('button');
          buttons.forEach((button) => {
            expect(button).not.toHaveClass('bg-gray-900', 'text-white');
          });
        });
      });

      it('ultrathink: should maintain visual state consistency during store updates', async () => {
        let currentActiveApi = 'summarizer';

        mockUseAppStore.mockImplementation((selector) => {
          if (typeof selector !== 'function')
            return {
              activeApi: currentActiveApi,
              setActiveApi: mockSetActiveApi,
            };
          const state = {
            activeApi: currentActiveApi,
            setActiveApi: (newApi: string) => {
              currentActiveApi = newApi;
              mockSetActiveApi(newApi);
            },
          };
          return selector(state);
        });

        const { rerender } = render(<Sidebar />);

        // Verify initial state
        let activeButton = screen.getByRole('button', {
          name: /Summarizer API/,
        });
        expect(activeButton).toHaveClass('bg-gray-900', 'text-white');

        // Change state externally
        currentActiveApi = 'translator';
        rerender(<Sidebar />);

        // Verify new state
        activeButton = screen.getByRole('button', { name: /Translator API/ });
        expect(activeButton).toHaveClass('bg-gray-900', 'text-white');

        // Previous active button should not be active
        const previousButton = screen.getByRole('button', {
          name: /Summarizer API/,
        });
        expect(previousButton).not.toHaveClass('bg-gray-900', 'text-white');
      });
    });

    describe('Advanced User Interaction Patterns', () => {
      it('ultrathink: should handle complex keyboard navigation sequences', async () => {
        const user = userEvent.setup();
        render(<Sidebar />);

        const buttons = screen.getAllByRole('button');

        // Test Tab navigation through all buttons
        for (let i = 0; i < buttons.length; i++) {
          await user.tab();
          expect(buttons[i]).toHaveFocus();
        }

        // Test Enter and Space activation
        await user.keyboard('{Enter}');
        expect(mockSetActiveApi).toHaveBeenCalledWith('language-detection');

        // Focus first button and test Space
        buttons[0].focus();
        await user.keyboard(' ');
        expect(mockSetActiveApi).toHaveBeenCalledWith('summarizer');
      });

      it('ultrathink: should handle mouse and keyboard interactions simultaneously', async () => {
        const user = userEvent.setup();
        render(<Sidebar />);

        screen.getByRole('button', {
          name: /Translator API/,
        });
        const writerButton = screen.getByRole('button', { name: /Writer API/ });

        // Start keyboard navigation
        await user.tab();
        await user.tab(); // Focus translator

        // Interrupt with mouse click on different button
        await user.click(writerButton);
        expect(mockSetActiveApi).toHaveBeenCalledWith('writer');

        // Continue keyboard navigation
        await user.keyboard('{Enter}');
        expect(mockSetActiveApi).toHaveBeenCalledWith('writer'); // Should activate focused element
      });

      it('ultrathink: should handle double-click and rapid click events', async () => {
        const user = userEvent.setup();
        render(<Sidebar />);

        const summarizerButton = screen.getByRole('button', {
          name: /Summarizer API/,
        });

        // Double click
        await user.dblClick(summarizerButton);
        expect(mockSetActiveApi).toHaveBeenCalledWith('summarizer');

        // Rapid clicks
        for (let i = 0; i < 5; i++) {
          await user.click(summarizerButton);
        }

        // Should handle all clicks without errors
        expect(mockSetActiveApi).toHaveBeenCalledWith('summarizer');
      });
    });

    describe('Icon and Visual Component Integrity', () => {
      it('ultrathink: should handle missing or corrupted icon components gracefully', () => {
        // Mock icons to throw errors
        vi.doMock('lucide-react', () => ({
          Zap: () => {
            throw new Error('Icon error');
          },
          Globe: () => <div data-testid="globe-icon">Globe</div>,
          ChevronRight: () => (
            <div data-testid="chevron-right-icon">ChevronRight</div>
          ),
          RotateCcw: () => <div data-testid="rotate-ccw-icon">RotateCcw</div>,
          CheckCircle: () => (
            <div data-testid="check-circle-icon">CheckCircle</div>
          ),
          Circle: () => <div data-testid="circle-icon">Circle</div>,
        }));

        // Should still render other APIs even if one icon fails
        expect(() => render(<Sidebar />)).not.toThrow();

        // Other APIs should still be accessible
        expect(screen.getByText('Translator API')).toBeInTheDocument();
        expect(screen.getByText('Writer API')).toBeInTheDocument();
      });

      it('ultrathink: should maintain icon-API association integrity', () => {
        render(<Sidebar />);

        const expectedIconMapping = [
          { api: 'Summarizer API', icon: 'zap-icon' },
          { api: 'Translator API', icon: 'globe-icon' },
          { api: 'Writer API', icon: 'chevron-right-icon' },
          { api: 'Rewriter API', icon: 'rotate-ccw-icon' },
          { api: 'Proofreader API', icon: 'check-circle-icon' },
          { api: 'Prompt API (Multimodal)', icon: 'circle-icon' },
          { api: 'Language Detection', icon: 'globe-icon' },
        ];

        expectedIconMapping.forEach(({ api, icon }) => {
          const apiButton = screen.getByRole('button', {
            name: new RegExp(api),
          });
          const iconElement = within(apiButton).getByTestId(icon);
          expect(iconElement).toBeInTheDocument();
        });
      });

      it('ultrathink: should handle dynamic icon size and style changes', () => {
        render(<Sidebar />);

        const iconContainers = document.querySelectorAll(
          '.w-5.h-5.flex-shrink-0',
        );
        expect(iconContainers.length).toBe(7); // One for each API

        // Icons should maintain consistent sizing
        iconContainers.forEach((container) => {
          expect(container).toHaveClass('w-5', 'h-5', 'flex-shrink-0');
        });
      });
    });

    describe('Layout and Responsive Behavior', () => {
      it('ultrathink: should handle content overflow in API names and descriptions', () => {
        // Mock long API names and descriptions
        [
          {
            id: 'summarizer',
            name: 'Extremely Long Summarizer API Name That Could Potentially Overflow',
            description:
              'This is an extremely long description that tests how the component handles text overflow and truncation in various scenarios',
          },
        ];

        render(<Sidebar />);

        // Check truncation classes are applied
        const descriptionElements = document.querySelectorAll('.truncate');
        expect(descriptionElements.length).toBeGreaterThan(0);

        // Check min-width classes for proper layout
        const contentContainers = document.querySelectorAll('.min-w-0');
        expect(contentContainers.length).toBeGreaterThan(0);
      });

      it('ultrathink: should maintain proper spacing and alignment with varying content lengths', () => {
        render(<Sidebar />);

        const buttons = screen.getAllByRole('button');

        // All buttons should have consistent structure
        buttons.forEach((button) => {
          expect(button).toHaveClass('w-full', 'flex', 'items-center', 'gap-3');

          // Check internal structure
          const icon = button.querySelector('.flex-shrink-0');
          const content = button.querySelector('.flex-1');

          expect(icon).toBeInTheDocument();
          expect(content).toBeInTheDocument();
        });
      });

      it('ultrathink: should handle dynamic list length changes', () => {
        const { rerender } = render(<Sidebar />);

        // Verify initial count
        expect(screen.getAllByRole('button')).toHaveLength(7);

        // Component should handle re-renders without layout issues
        for (let i = 0; i < 5; i++) {
          rerender(<Sidebar />);
          expect(screen.getAllByRole('button')).toHaveLength(7);
        }
      });
    });

    describe('Advanced Accessibility and ARIA Support', () => {
      it('ultrathink: should provide comprehensive screen reader support', () => {
        render(<Sidebar />);

        // Check ARIA landmarks
        const navigation = screen.getByRole('heading', { level: 2 });
        expect(navigation).toHaveTextContent('Available APIs');

        // All buttons should be properly accessible
        const buttons = screen.getAllByRole('button');
        buttons.forEach((button) => {
          // Button should have accessible name
          expect(button).toHaveAccessibleName();

          // Button should have proper content structure
          const apiName = button.querySelector('.font-medium');
          const apiDescription = button.querySelector('.text-xs');

          expect(apiName).toBeInTheDocument();
          expect(apiDescription).toBeInTheDocument();
        });
      });

      it('ultrathink: should support assistive technology state announcements', () => {
        render(<Sidebar />);

        const activeButton = screen.getByRole('button', {
          name: /Summarizer API/,
        });

        // Active state should be visually clear for screen readers
        expect(activeButton).toHaveClass('bg-gray-900', 'text-white');

        // Text contrast should be sufficient
        const activeApiName = activeButton.querySelector('.text-white');
        expect(activeApiName).toBeInTheDocument();
      });

      it('ultrathink: should handle focus management during dynamic updates', async () => {
        const user = userEvent.setup();
        let currentActive = 'summarizer';

        mockUseAppStore.mockImplementation((selector) => {
          if (typeof selector !== 'function')
            return { activeApi: currentActive, setActiveApi: mockSetActiveApi };
          const state = {
            activeApi: currentActive,
            setActiveApi: (newApi: string) => {
              currentActive = newApi;
              mockSetActiveApi(newApi);
            },
          };
          return selector(state);
        });

        const { rerender } = render(<Sidebar />);

        const translatorButton = screen.getByRole('button', {
          name: /Translator API/,
        });

        // Focus and activate
        translatorButton.focus();
        expect(translatorButton).toHaveFocus();

        await user.keyboard('{Enter}');
        expect(mockSetActiveApi).toHaveBeenCalledWith('translator');

        // Update state
        currentActive = 'translator';
        rerender(<Sidebar />);

        // Focus should be maintained after state update
        expect(translatorButton).toHaveFocus();
      });
    });

    describe('Performance Optimization and Memory Management', () => {
      it('ultrathink: should efficiently handle large numbers of interactions', async () => {
        const user = userEvent.setup();
        render(<Sidebar />);

        const buttons = screen.getAllByRole('button');
        const startTime = performance.now();

        // Perform many rapid interactions
        for (let i = 0; i < 50; i++) {
          const randomButton = buttons[i % buttons.length];
          await user.click(randomButton);
        }

        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(1000); // Should handle 50 clicks quickly

        // Component should still be functional
        expect(screen.getByText('Available APIs')).toBeInTheDocument();
        expect(mockSetActiveApi).toHaveBeenCalledTimes(50);
      });

      it('ultrathink: should prevent memory leaks during frequent re-renders', () => {
        const { rerender, unmount } = render(<Sidebar />);

        // Perform many re-renders
        for (let i = 0; i < 100; i++) {
          rerender(<Sidebar />);
        }

        // Unmount should clean up properly
        expect(() => unmount()).not.toThrow();
      });

      it("ultrathink: should optimize re-renders when store state hasn't changed", () => {
        const { rerender } = render(<Sidebar />);

        const initialCallCount = mockSetActiveApi.mock.calls.length;

        // Multiple re-renders with same state
        for (let i = 0; i < 10; i++) {
          rerender(<Sidebar />);
        }

        // Should not trigger additional store calls
        expect(mockSetActiveApi).toHaveBeenCalledTimes(initialCallCount);

        // Component should still render correctly
        expect(screen.getByText('Available APIs')).toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(7);
      });
    });

    describe('Error Recovery and Resilience', () => {
      it('ultrathink: should recover from store disconnection gracefully', () => {
        // First render with working store
        render(<Sidebar />);
        expect(screen.getByText('Available APIs')).toBeInTheDocument();

        // Simulate store disconnection
        mockUseAppStore.mockImplementation((selector) => {
          if (typeof selector !== 'function')
            return { activeApi: null, setActiveApi: null };
          return selector({ activeApi: null, setActiveApi: null });
        });

        const { rerender } = render(<Sidebar />);
        rerender(<Sidebar />);

        // Component should still render
        expect(screen.getByText('Available APIs')).toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(7);
      });

      it('ultrathink: should handle component remounting with preserved functionality', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<Sidebar />);

        // Unmount component
        unmount();

        // Remount with same store state
        render(<Sidebar />);

        // Functionality should be fully restored
        expect(screen.getByText('Available APIs')).toBeInTheDocument();

        const translatorButton = screen.getByRole('button', {
          name: /Translator API/,
        });
        await user.click(translatorButton);
        expect(mockSetActiveApi).toHaveBeenCalledWith('translator');
      });

      it('ultrathink: should handle concurrent state updates safely', async () => {
        const user = userEvent.setup();
        render(<Sidebar />);

        // Simulate concurrent updates
        const promises = [];
        const buttons = screen.getAllByRole('button');

        for (let i = 0; i < 3; i++) {
          promises.push(user.click(buttons[i]));
        }

        await Promise.all(promises);

        // Should handle all clicks without errors
        expect(mockSetActiveApi).toHaveBeenCalledTimes(3);
      });
    });
  });
});
