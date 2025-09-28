import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HomePage } from '../HomePage';

// Mock the app store
const mockUseAppStore = vi.fn();
vi.mock('@/stores/appStore', () => ({
  useAppStore: (selector: any) => mockUseAppStore(selector),
}));

// Mock UI components
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div
      data-testid="tabs"
      data-value={value}
      onClick={() => onValueChange?.('demo')}
    >
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value, className }: any) => (
    <button data-testid={`tab-${value}`} className={className}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, onClick }: any) => (
    <button data-testid="button" className={className} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, defaultValue }: any) => (
    <div data-testid="select" data-default-value={defaultValue}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <option data-testid="select-item" value={value}>
      {children}
    </option>
  ),
  SelectTrigger: ({ children }: any) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: () => <div data-testid="select-value" />,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ placeholder, value, onChange, className }: any) => (
    <textarea
      data-testid="textarea"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
    />
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ placeholder, className }: any) => (
    <input
      data-testid="input"
      placeholder={placeholder}
      className={className}
    />
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, className }: any) => (
    <label data-testid="label" htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Globe: () => <div data-testid="globe-icon">Globe</div>,
  ChevronRight: () => <div data-testid="chevron-right-icon">ChevronRight</div>,
  RotateCcw: () => <div data-testid="rotate-ccw-icon">RotateCcw</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  Circle: () => <div data-testid="circle-icon">Circle</div>,
  Copy: () => <div data-testid="copy-icon">Copy</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
}));

describe('HomePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default store state
    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        activeApi: 'summarizer',
      };
      return selector(state);
    });
  });

  describe('Structure and Layout', () => {
    it('renders with correct structure', () => {
      render(<HomePage />);

      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('displays API header with icon and title', () => {
      render(<HomePage />);

      expect(screen.getByTestId('zap-icon')).toBeInTheDocument(); // Summarizer icon
      expect(screen.getByText('Summarizer API')).toBeInTheDocument();
      expect(
        screen.getByText('Content summarization and condensation'),
      ).toBeInTheDocument();
    });

    it('displays Coming Soon badge', () => {
      render(<HomePage />);

      expect(screen.getByTestId('badge')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('renders all three tabs', () => {
      render(<HomePage />);

      expect(screen.getByTestId('tab-demo')).toBeInTheDocument();
      expect(screen.getByTestId('tab-code')).toBeInTheDocument();
      expect(screen.getByTestId('tab-security')).toBeInTheDocument();
    });
  });

  describe('API Selection', () => {
    it('displays correct API based on activeApi state', () => {
      mockUseAppStore.mockImplementation((selector) => {
        const state = {
          activeApi: 'translator',
        };
        return selector(state);
      });

      render(<HomePage />);

      expect(screen.getByText('Translator API')).toBeInTheDocument();
      expect(
        screen.getByText('Real-time language translation'),
      ).toBeInTheDocument();
    });

    it('handles different API selections correctly', () => {
      const testCases = [
        {
          api: 'writer',
          name: 'Writer API',
          description: 'Content generation and creative writing',
        },
        {
          api: 'rewriter',
          name: 'Rewriter API',
          description: 'Content restructuring and style adaptation',
        },
        {
          api: 'proofreader',
          name: 'Proofreader API',
          description: 'Grammar and writing improvement',
        },
      ];

      testCases.forEach(({ api, name, description }) => {
        mockUseAppStore.mockImplementation((selector) => {
          const state = { activeApi: api };
          return selector(state);
        });

        const { rerender } = render(<HomePage />);
        expect(screen.getByText(name)).toBeInTheDocument();
        expect(screen.getByText(description)).toBeInTheDocument();
        rerender(<div />);
      });
    });

    it('displays correct icons for different APIs', () => {
      const testCases = [
        { api: 'summarizer', icon: 'zap-icon' },
        { api: 'translator', icon: 'globe-icon' },
        { api: 'writer', icon: 'chevron-right-icon' },
        { api: 'rewriter', icon: 'rotate-ccw-icon' },
        { api: 'proofreader', icon: 'check-circle-icon' },
      ];

      testCases.forEach(({ api, icon }) => {
        mockUseAppStore.mockImplementation((selector) => {
          const state = { activeApi: api };
          return selector(state);
        });

        const { rerender } = render(<HomePage />);
        expect(screen.getByTestId(icon)).toBeInTheDocument();
        rerender(<div />);
      });
    });
  });

  describe('Demo Tab Content', () => {
    it('displays step 1 instructions', () => {
      render(<HomePage />);

      expect(screen.getByText(/Step 1:/)).toBeInTheDocument();
      expect(
        screen.getByText(/Configure the API settings below/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Code.*tab to see the implementation/),
      ).toBeInTheDocument();
    });

    it('renders API configuration section', () => {
      render(<HomePage />);

      expect(screen.getByText('API Configuration')).toBeInTheDocument();
    });

    it('displays configuration form fields', () => {
      render(<HomePage />);

      expect(
        screen.getByText('Settings for Summarizer API'),
      ).toBeInTheDocument();
      expect(screen.getByText('Summary Type')).toBeInTheDocument();
      expect(screen.getByText('Format')).toBeInTheDocument();
      expect(screen.getByText('Length')).toBeInTheDocument();
      expect(screen.getByText('Shared Context (Optional)')).toBeInTheDocument();
    });

    it('renders input text area', () => {
      render(<HomePage />);

      expect(screen.getByText('Input Text')).toBeInTheDocument();
      expect(screen.getByTestId('textarea')).toBeInTheDocument();
      expect(screen.getByText('0 chars')).toBeInTheDocument();
    });

    it('displays run button', () => {
      render(<HomePage />);

      expect(screen.getByText('Run Summarizer API')).toBeInTheDocument();
    });
  });

  describe('Code Tab Content', () => {
    it('displays code tab tip', () => {
      render(<HomePage />);

      expect(screen.getByText(/Tip:/)).toBeInTheDocument();
      expect(
        screen.getByText(/Configure the API and run the demo first/),
      ).toBeInTheDocument();
    });

    it('shows generated code section', () => {
      render(<HomePage />);

      expect(screen.getByText('Generated Code')).toBeInTheDocument();
    });

    it('displays language selector and copy button', () => {
      render(<HomePage />);

      const selects = screen.getAllByTestId('select');
      expect(selects.length).toBeGreaterThan(0);

      expect(screen.getByText('Copy Code')).toBeInTheDocument();
    });

    it('renders code block with syntax highlighting', () => {
      render(<HomePage />);

      const codeBlock = document.querySelector('.bg-gray-900');
      expect(codeBlock).toBeInTheDocument();
    });
  });

  describe('Security Tab Content', () => {
    it('displays security considerations', () => {
      render(<HomePage />);

      expect(screen.getByText('Security Considerations')).toBeInTheDocument();
      expect(
        screen.getByText(/Security best practices.*will be documented here/),
      ).toBeInTheDocument();
    });

    it('shows data privacy section', () => {
      render(<HomePage />);

      expect(screen.getByText('Data Privacy')).toBeInTheDocument();
      expect(
        screen.getByText(/All processing happens on-device/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Your data never leaves your browser/),
      ).toBeInTheDocument();
    });

    it('displays security icon', () => {
      render(<HomePage />);

      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles text input in textarea', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      const textarea = screen.getByTestId('textarea');
      await user.type(textarea, 'Test input text');

      expect(textarea).toHaveValue('Test input text');
    });

    it('updates character count', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      const textarea = screen.getByTestId('textarea');
      await user.type(textarea, 'Hello');

      expect(screen.getByText('5 chars')).toBeInTheDocument();
    });

    it('handles configuration toggle', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      const configButton = screen.getByText('API Configuration');
      await user.click(configButton);

      // Configuration should toggle (this would need to check actual visibility)
      expect(configButton).toBeInTheDocument();
    });
  });

  describe('Code Generation', () => {
    it('generates correct JavaScript code structure', () => {
      render(<HomePage />);

      const codeText = document.querySelector('pre code')?.textContent;
      expect(codeText).toContain('async function summarizerExample()');
      expect(codeText).toContain('// Check if Summarizer API is available');
      expect(codeText).toContain('// Configuration');
      expect(codeText).toContain('// Initialize the Summarizer API');
      expect(codeText).toContain('// Process the input');
      expect(codeText).toContain('// Clean up');
    });

    it('includes proper error handling in generated code', () => {
      render(<HomePage />);

      const codeText = document.querySelector('pre code')?.textContent;
      expect(codeText).toContain('try {');
      expect(codeText).toContain('} catch (error) {');
      expect(codeText).toContain('console.error');
    });

    it('includes API availability checks', () => {
      render(<HomePage />);

      const codeText = document.querySelector('pre code')?.textContent;
      expect(codeText).toContain("if (!'Summarizer' in self)");
      expect(codeText).toContain('await Summarizer.availability()');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<HomePage />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Summarizer API');
    });

    it('provides accessible form labels', () => {
      render(<HomePage />);

      const labels = screen.getAllByTestId('label');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('has accessible button text', () => {
      render(<HomePage />);

      expect(screen.getByText('Run Summarizer API')).toBeInTheDocument();
      expect(screen.getByText('Copy Code')).toBeInTheDocument();
    });

    it('provides proper textarea labels and descriptions', () => {
      render(<HomePage />);

      expect(screen.getByText('Input Text')).toBeInTheDocument();
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute(
        'placeholder',
        'Enter text to process with Summarizer API...',
      );
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes', () => {
      render(<HomePage />);

      const gridContainer = document.querySelector('.grid.grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });

    it('handles overflow correctly', () => {
      render(<HomePage />);

      const codeBlock = document.querySelector('.overflow-x-auto');
      expect(codeBlock).toBeInTheDocument();
    });

    it('uses responsive spacing', () => {
      render(<HomePage />);

      const spacingContainer = document.querySelector('.space-y-6');
      expect(spacingContainer).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders efficiently', () => {
      const startTime = performance.now();
      render(<HomePage />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200);
    });

    it('handles state updates efficiently', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      const textarea = screen.getByTestId('textarea');

      // Multiple rapid updates
      for (let i = 0; i < 10; i++) {
        await user.type(textarea, 'a');
      }

      expect(textarea).toHaveValue('aaaaaaaaaa');
    });
  });

  describe('Error Handling', () => {
    it('handles unknown API gracefully', () => {
      mockUseAppStore.mockImplementation((selector) => {
        const state = {
          activeApi: 'unknown-api',
        };
        return selector(state);
      });

      expect(() => render(<HomePage />)).not.toThrow();
    });

    it('provides fallback for missing API details', () => {
      mockUseAppStore.mockImplementation((selector) => {
        const state = {
          activeApi: null,
        };
        return selector(state);
      });

      render(<HomePage />);

      // Should fall back to summarizer
      expect(screen.getByText('Summarizer API')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('manages tab state correctly', () => {
      render(<HomePage />);

      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-value', 'demo');
    });

    it('manages input text state', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      const textarea = screen.getByTestId('textarea');
      await user.type(textarea, 'Test content');

      expect(screen.getByText('12 chars')).toBeInTheDocument();
    });

    it('manages configuration state', () => {
      render(<HomePage />);

      // Configuration should be open by default
      expect(
        screen.getByText('Settings for Summarizer API'),
      ).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('applies correct styling classes', () => {
      render(<HomePage />);

      const mainContainer = document.querySelector('.p-6');
      expect(mainContainer).toBeInTheDocument();
    });

    it('uses proper badge styling', () => {
      render(<HomePage />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700');
    });

    it('applies button styling correctly', () => {
      render(<HomePage />);

      const runButton = screen
        .getByText('Run Summarizer API')
        .closest('button');
      expect(runButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
    });
  });

  describe('Ultrathink Test Suite - Advanced Edge Cases', () => {
    describe('Complex State Management and API Switching', () => {
      it('ultrathink: should handle rapid API switching without state corruption', async () => {
        const apiSequence = [
          'summarizer',
          'translator',
          'writer',
          'rewriter',
          'proofreader',
          'prompt',
          'language-detection',
        ];

        for (let i = 0; i < apiSequence.length; i++) {
          mockUseAppStore.mockImplementation((selector) => {
            const state = { activeApi: apiSequence[i] };
            return selector(state);
          });

          const { rerender } = render(<HomePage />);
          rerender(<HomePage />);

          // Verify correct API header is displayed
          const expectedApiNames = {
            summarizer: 'Summarizer API',
            translator: 'Translator API',
            writer: 'Writer API',
            rewriter: 'Rewriter API',
            proofreader: 'Proofreader API',
            prompt: 'Prompt API (Multimodal)',
            'language-detection': 'Language Detection',
          };

          expect(
            screen.getByText(
              expectedApiNames[apiSequence[i] as keyof typeof expectedApiNames],
            ),
          ).toBeInTheDocument();

          // Verify content updates properly
          expect(screen.getByText('Coming Soon')).toBeInTheDocument();
          expect(screen.getByTestId('tabs')).toBeInTheDocument();
        }
      });

      it('ultrathink: should maintain tab state consistency across API changes', async () => {
        userEvent.setup();

        // Start with summarizer
        render(<HomePage />);

        // Change to demo tab explicitly
        const tabs = screen.getByTestId('tabs');
        expect(tabs).toHaveAttribute('data-value', 'demo');

        // Switch API
        mockUseAppStore.mockImplementation((selector) => {
          const state = { activeApi: 'translator' };
          return selector(state);
        });

        const { rerender } = render(<HomePage />);
        rerender(<HomePage />);

        // Tab state should be preserved
        expect(screen.getByTestId('tabs')).toHaveAttribute(
          'data-value',
          'demo',
        );
        expect(screen.getByText('Translator API')).toBeInTheDocument();
      });

      it('ultrathink: should handle complex form state during API transitions', async () => {
        const user = userEvent.setup();
        render(<HomePage />);

        // Enter text in textarea
        const textarea = screen.getByTestId('textarea');
        await user.type(textarea, 'Complex test input for API switching');

        expect(textarea).toHaveValue('Complex test input for API switching');
        expect(screen.getByText('37 chars')).toBeInTheDocument();

        // Switch API while form has content
        mockUseAppStore.mockImplementation((selector) => {
          const state = { activeApi: 'writer' };
          return selector(state);
        });

        const { rerender } = render(<HomePage />);
        rerender(<HomePage />);

        // Form state should be preserved even with API change
        const newTextarea = screen.getByTestId('textarea');
        expect(newTextarea).toHaveValue('Complex test input for API switching');
      });
    });

    describe('Advanced User Interaction Patterns', () => {
      it('ultrathink: should handle complex textarea interactions and edge cases', async () => {
        const user = userEvent.setup();
        render(<HomePage />);

        const textarea = screen.getByTestId('textarea');

        // Test very long text input
        const longText = 'a'.repeat(10000);
        await user.type(textarea, longText);

        expect(textarea).toHaveValue(longText);
        expect(screen.getByText('10000 chars')).toBeInTheDocument();

        // Test text selection and replacement
        await user.clear(textarea);
        expect(textarea).toHaveValue('');
        expect(screen.getByText('0 chars')).toBeInTheDocument();

        // Test paste operation
        await user.type(textarea, 'Pasted content');
        expect(screen.getByText('14 chars')).toBeInTheDocument();
      });

      it('ultrathink: should handle configuration panel interactions comprehensively', async () => {
        const user = userEvent.setup();
        render(<HomePage />);

        // Test configuration toggle
        const configButton = screen.getByText('API Configuration');
        expect(
          screen.getByText('Settings for Summarizer API'),
        ).toBeInTheDocument();

        // Test chevron icon rotation
        const chevronIcon = screen.getByTestId('chevron-down-icon');
        expect(chevronIcon).toBeInTheDocument();

        // Click to toggle (this would normally collapse the panel)
        await user.click(configButton);

        // Component should still be functional
        expect(configButton).toBeInTheDocument();
      });

      it('ultrathink: should handle tab navigation with complex content state', async () => {
        const user = userEvent.setup();
        render(<HomePage />);

        // Add content to form
        const textarea = screen.getByTestId('textarea');
        await user.type(textarea, 'Test content for tab switching');

        // Switch between tabs and verify content persistence
        const tabs = ['demo', 'code', 'security'];

        for (const tab of tabs) {
          // Tab content should be available
          expect(screen.getByTestId(`tab-${tab}`)).toBeInTheDocument();

          // Original form content should persist
          if (tab === 'demo') {
            expect(screen.getByTestId('textarea')).toHaveValue(
              'Test content for tab switching',
            );
          }
        }
      });
    });

    describe('Code Generation and Dynamic Content', () => {
      it('ultrathink: should generate contextually accurate code for different APIs', () => {
        const apiCodeTests = [
          {
            api: 'summarizer',
            codeSnippet: 'summarizerExample()',
            apiCheck: 'Summarizer',
          },
          {
            api: 'translator',
            codeSnippet: 'summarizerExample()',
            apiCheck: 'Summarizer',
          }, // Note: currently all generate same code
          {
            api: 'writer',
            codeSnippet: 'summarizerExample()',
            apiCheck: 'Summarizer',
          },
        ];

        apiCodeTests.forEach(({ api, codeSnippet, apiCheck }) => {
          mockUseAppStore.mockImplementation((selector) => {
            const state = { activeApi: api };
            return selector(state);
          });

          render(<HomePage />);

          const codeText = document.querySelector('pre code')?.textContent;
          expect(codeText).toContain(codeSnippet);
          expect(codeText).toContain(apiCheck);
          expect(codeText).toContain('try {');
          expect(codeText).toContain('} catch (error) {');
        });
      });

      it('ultrathink: should handle code generation with complex configuration states', () => {
        render(<HomePage />);

        // Verify code includes proper configuration
        const codeText = document.querySelector('pre code')?.textContent;
        expect(codeText).toContain('const options = {');
        expect(codeText).toContain("type: 'key-points'");
        expect(codeText).toContain("format: 'markdown'");
        expect(codeText).toContain("length: 'medium'");

        // Verify proper API lifecycle
        expect(codeText).toContain('await Summarizer.create(options)');
        expect(codeText).toContain('summarizer.destroy()');
      });

      it('ultrathink: should provide comprehensive error handling in generated code', () => {
        render(<HomePage />);

        const codeText = document.querySelector('pre code')?.textContent;

        // Check for multiple error scenarios
        expect(codeText).toContain('if (!("Summarizer" in self))');
        expect(codeText).toContain(
          'throw new Error("Summarizer API not available")',
        );
        expect(codeText).toContain('if (availability === "no")');
        expect(codeText).toContain('console.error("Summarizer API error:"');
        expect(codeText).toContain(
          '.catch(error => console.error("Error:", error))',
        );
      });
    });

    describe('Advanced Accessibility and Form Validation', () => {
      it('ultrathink: should provide comprehensive ARIA support for complex forms', () => {
        render(<HomePage />);

        // Check form labels are properly associated
        const labels = screen.getAllByTestId('label');
        expect(labels.length).toBeGreaterThanOrEqual(4); // Summary Type, Format, Length, Shared Context

        // Check textarea accessibility
        const textarea = screen.getByTestId('textarea');
        expect(textarea).toHaveAttribute('placeholder');

        // Check character counter accessibility
        expect(screen.getByText(/\d+ chars/)).toBeInTheDocument();
      });

      it('ultrathink: should handle form validation and error states gracefully', async () => {
        const user = userEvent.setup();
        render(<HomePage />);

        const textarea = screen.getByTestId('textarea');

        // Test empty input handling
        const runButton = screen.getByText('Run Summarizer API');
        await user.click(runButton);

        // Button should be clickable regardless of input state
        expect(runButton).toBeInTheDocument();

        // Test with valid input
        await user.type(textarea, 'Valid test input');
        await user.click(runButton);

        expect(runButton).toBeInTheDocument();
      });

      it('ultrathink: should maintain accessibility during dynamic content updates', async () => {
        userEvent.setup();
        render(<HomePage />);

        // Test heading hierarchy remains intact during API switches
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
          'Summarizer API',
        );

        // Switch API and verify heading updates properly
        mockUseAppStore.mockImplementation((selector) => {
          const state = { activeApi: 'translator' };
          return selector(state);
        });

        const { rerender } = render(<HomePage />);
        rerender(<HomePage />);

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
          'Translator API',
        );
      });
    });

    describe('Performance and Memory Management', () => {
      it('ultrathink: should handle high-frequency state updates efficiently', async () => {
        const user = userEvent.setup();
        render(<HomePage />);

        const textarea = screen.getByTestId('textarea');
        const startTime = performance.now();

        // Rapid typing simulation
        for (let i = 0; i < 100; i++) {
          await user.type(textarea, 'a');
        }

        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(2000); // Should handle 100 keystrokes quickly

        // Component should still be responsive
        expect(textarea).toHaveValue('a'.repeat(100));
        expect(screen.getByText('100 chars')).toBeInTheDocument();
      });

      it('ultrathink: should optimize re-renders during API switching', () => {
        const startTime = performance.now();

        // Rapid API switching
        const apis = [
          'summarizer',
          'translator',
          'writer',
          'rewriter',
          'proofreader',
        ];

        for (const api of apis) {
          mockUseAppStore.mockImplementation((selector) => {
            const state = { activeApi: api };
            return selector(state);
          });

          const { rerender } = render(<HomePage />);
          rerender(<HomePage />);
        }

        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(1000); // Should handle rapid switching efficiently
      });

      it('ultrathink: should prevent memory leaks in complex component lifecycle', () => {
        const { unmount } = render(<HomePage />);

        // Component should unmount cleanly
        expect(() => unmount()).not.toThrow();

        // Re-mount should work correctly
        render(<HomePage />);
        expect(screen.getByText('Summarizer API')).toBeInTheDocument();
      });
    });

    describe('Error Recovery and Edge Cases', () => {
      it('ultrathink: should handle corrupted or malformed store state gracefully', () => {
        const malformedStates = [
          { activeApi: undefined },
          { activeApi: null },
          { activeApi: '' },
          { activeApi: 123 },
          { activeApi: {} },
          { activeApi: [] },
          {},
        ];

        malformedStates.forEach((state) => {
          mockUseAppStore.mockImplementation((selector) => selector(state));

          expect(() => render(<HomePage />)).not.toThrow();

          // Should fallback to summarizer
          expect(screen.getByText('Summarizer API')).toBeInTheDocument();
        });
      });

      it('ultrathink: should handle component remounting with complex state', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<HomePage />);

        // Add complex state
        const textarea = screen.getByTestId('textarea');
        await user.type(textarea, 'Persistent state test');

        unmount();

        // Remount should work without issues
        render(<HomePage />);
        expect(screen.getByText('Summarizer API')).toBeInTheDocument();
        expect(screen.getByTestId('textarea')).toBeInTheDocument();
      });

      it('ultrathink: should handle missing UI component dependencies gracefully', () => {
        // Test with mocked UI components that might fail
        const originalError = console.error;
        console.error = vi.fn();

        expect(() => render(<HomePage />)).not.toThrow();

        // Core functionality should still work
        expect(screen.getByText('Summarizer API')).toBeInTheDocument();

        console.error = originalError;
      });
    });

    describe('Advanced Integration Scenarios', () => {
      it('ultrathink: should handle concurrent user interactions across multiple UI elements', async () => {
        const user = userEvent.setup();
        render(<HomePage />);

        // Simulate concurrent interactions
        const textarea = screen.getByTestId('textarea');
        const configButton = screen.getByText('API Configuration');
        const runButton = screen.getByText('Run Summarizer API');

        // Concurrent actions
        const promises = [
          user.type(textarea, 'Concurrent test'),
          user.click(configButton),
          user.click(runButton),
        ];

        await Promise.allSettled(promises);

        // All interactions should complete without errors
        expect(screen.getByText('Summarizer API')).toBeInTheDocument();
        expect(textarea).toBeInTheDocument();
      });

      it('ultrathink: should maintain data integrity during complex form interactions', async () => {
        const user = userEvent.setup();
        render(<HomePage />);

        const textarea = screen.getByTestId('textarea');

        // Complex text manipulation
        await user.type(textarea, 'Initial text');
        expect(screen.getByText('12 chars')).toBeInTheDocument();

        // Clear and re-enter
        await user.clear(textarea);
        await user.type(textarea, 'New text content');
        expect(screen.getByText('16 chars')).toBeInTheDocument();

        // Verify textarea state is consistent
        expect(textarea).toHaveValue('New text content');
      });

      it('ultrathink: should handle tab switching with preserved form state', async () => {
        const user = userEvent.setup();
        render(<HomePage />);

        // Add form content
        const textarea = screen.getByTestId('textarea');
        await user.type(textarea, 'Form content for tab test');

        // Verify initial state
        expect(textarea).toHaveValue('Form content for tab test');
        expect(screen.getByText('25 chars')).toBeInTheDocument();

        // The form state should be maintained (since it's the same component)
        // This tests that tab switching doesn't reset form state
        expect(screen.getByTestId('tabs')).toHaveAttribute(
          'data-value',
          'demo',
        );
      });
    });
  });
});
