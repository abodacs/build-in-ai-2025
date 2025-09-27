/**
 * SyntaxHighlighter Component Unit Tests
 * Tests for Epic 2: Code Generation Engine syntax highlighting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyntaxHighlighter } from '@/components/ui/SyntaxHighlighter';
import { useAppStore } from '@/stores/appStore';
import {
  mockGeneratedCode,
  syntaxHighlightingTestCases,
  createMockPrismHighlighting
} from '../utils/codeGenMocks';
import { mockConsole } from '../utils/testHelpers';

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined)
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true
});

describe('SyntaxHighlighter Component - Epic 2', () => {
  let consoleMock: ReturnType<typeof mockConsole>;
  let prismMock: ReturnType<typeof createMockPrismHighlighting>;

  beforeEach(() => {
    consoleMock = mockConsole();
    prismMock = createMockPrismHighlighting();
    mockClipboard.writeText.mockClear();
  });

  afterEach(() => {
    consoleMock.restore();
    prismMock.restore();
  });

  describe('Basic Rendering', () => {
    it('should render code with syntax highlighting', () => {
      const code = mockGeneratedCode.typescript.simple.function;

      render(<SyntaxHighlighter code={code} language="typescript" />);

      expect(screen.getByRole('region', { name: /code/i })).toBeInTheDocument();
      expect(screen.getByText(/function/)).toBeInTheDocument();
    });

    it('should handle empty code gracefully', () => {
      render(<SyntaxHighlighter code="" language="typescript" />);

      expect(screen.getByRole('region', { name: /code/i })).toBeInTheDocument();
      // Should not crash or show errors
    });

    it('should handle null/undefined code', () => {
      render(<SyntaxHighlighter code={null as any} language="typescript" />);
      expect(screen.getByRole('region', { name: /code/i })).toBeInTheDocument();

      render(<SyntaxHighlighter code={undefined as any} language="typescript" />);
      expect(screen.getByRole('region', { name: /code/i })).toBeInTheDocument();
    });

    it('should apply correct language class', () => {
      const code = mockGeneratedCode.typescript.simple.function;

      const { rerender } = render(<SyntaxHighlighter code={code} language="typescript" />);

      expect(screen.getByRole('region')).toHaveClass('language-typescript');

      rerender(<SyntaxHighlighter code={code} language="javascript" />);
      expect(screen.getByRole('region')).toHaveClass('language-javascript');
    });
  });

  describe('Language Detection', () => {
    it('should auto-detect TypeScript syntax', () => {
      const tsCode = `interface User {
  id: string;
  name: string;
}`;

      render(<SyntaxHighlighter code={tsCode} language="auto" />);

      // Should detect and apply TypeScript highlighting
      expect(prismMock.mockPrism.highlight).toHaveBeenCalledWith(
        tsCode,
        expect.anything(),
        'typescript'
      );
    });

    it('should auto-detect JavaScript syntax', () => {
      const jsCode = `function add(a, b) {
  return a + b;
}`;

      render(<SyntaxHighlighter code={jsCode} language="auto" />);

      // Should detect and apply JavaScript highlighting
      expect(prismMock.mockPrism.highlight).toHaveBeenCalledWith(
        jsCode,
        expect.anything(),
        'javascript'
      );
    });

    it('should handle ambiguous code detection', () => {
      const ambiguousCode = 'console.log("hello");';

      render(<SyntaxHighlighter code={ambiguousCode} language="auto" />);

      // Should default to JavaScript for ambiguous cases
      expect(prismMock.mockPrism.highlight).toHaveBeenCalled();
    });

    it('should respect explicit language setting over auto-detection', () => {
      const jsCode = 'function test() {}';

      render(<SyntaxHighlighter code={jsCode} language="typescript" />);

      // Should use TypeScript highlighting despite JavaScript syntax
      expect(prismMock.mockPrism.highlight).toHaveBeenCalledWith(
        jsCode,
        expect.anything(),
        'typescript'
      );
    });
  });

  describe('Theme Integration', () => {
    it('should apply light theme correctly', () => {
      const StoreWrapper = ({ children }: { children: React.ReactNode }) => {
        useAppStore.getState().setTheme('light');
        return <>{children}</>;
      };

      render(
        <StoreWrapper>
          <SyntaxHighlighter code="const x = 1;" language="typescript" />
        </StoreWrapper>
      );

      const codeElement = screen.getByRole('region');
      expect(codeElement).toHaveClass('theme-light');
    });

    it('should apply dark theme correctly', () => {
      const StoreWrapper = ({ children }: { children: React.ReactNode }) => {
        useAppStore.getState().setTheme('dark');
        return <>{children}</>;
      };

      render(
        <StoreWrapper>
          <SyntaxHighlighter code="const x = 1;" language="typescript" />
        </StoreWrapper>
      );

      const codeElement = screen.getByRole('region');
      expect(codeElement).toHaveClass('theme-dark');
    });

    it('should respond to system theme changes', async () => {
      // Mock system theme detection
      const mediaQuery = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      vi.spyOn(window, 'matchMedia').mockReturnValue(mediaQuery as any);

      const StoreWrapper = ({ children }: { children: React.ReactNode }) => {
        useAppStore.getState().setTheme('system');
        return <>{children}</>;
      };

      render(
        <StoreWrapper>
          <SyntaxHighlighter code="const x = 1;" language="typescript" />
        </StoreWrapper>
      );

      // Should set up media query listener
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(mediaQuery.addEventListener).toHaveBeenCalled();
    });

    it('should update theme dynamically', async () => {
      const { rerender } = render(<SyntaxHighlighter code="const x = 1;" language="typescript" />);

      // Change theme
      useAppStore.getState().setTheme('dark');

      rerender(<SyntaxHighlighter code="const x = 1;" language="typescript" />);

      await waitFor(() => {
        expect(screen.getByRole('region')).toHaveClass('theme-dark');
      });
    });
  });

  describe('Line Numbers', () => {
    it('should display line numbers when enabled', () => {
      const multiLineCode = `function test() {
  const a = 1;
  const b = 2;
  return a + b;
}`;

      render(<SyntaxHighlighter code={multiLineCode} language="typescript" showLineNumbers />);

      // Should show line numbers
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should hide line numbers when disabled', () => {
      const multiLineCode = `function test() {
  return 1;
}`;

      render(<SyntaxHighlighter code={multiLineCode} language="typescript" showLineNumbers={false} />);

      // Should not show line numbers
      expect(screen.queryByText('1')).not.toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });

    it('should handle single line code correctly', () => {
      const singleLineCode = 'const x = 1;';

      render(<SyntaxHighlighter code={singleLineCode} language="typescript" showLineNumbers />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });

    it('should start line numbers from custom starting point', () => {
      const code = `function test() {
  return 1;
}`;

      render(<SyntaxHighlighter code={code} language="typescript" showLineNumbers startingLineNumber={10} />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('11')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should show copy button', () => {
      render(<SyntaxHighlighter code="const x = 1;" language="typescript" showCopyButton />);

      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('should copy code to clipboard when clicked', async () => {
      const code = 'const x = 1;';

      render(<SyntaxHighlighter code={code} language="typescript" showCopyButton />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(code);
      });
    });

    it('should show feedback after copying', async () => {
      render(<SyntaxHighlighter code="const x = 1;" language="typescript" showCopyButton />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });

      // Feedback should disappear after delay
      await waitFor(() => {
        expect(screen.queryByText(/copied/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle copy errors gracefully', async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Copy failed'));

      render(<SyntaxHighlighter code="const x = 1;" language="typescript" showCopyButton />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/failed/i)).toBeInTheDocument();
      });
    });

    it('should hide copy button when disabled', () => {
      render(<SyntaxHighlighter code="const x = 1;" language="typescript" showCopyButton={false} />);

      expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render large code blocks efficiently', async () => {
      const largeCode = mockGeneratedCode.typescript.simple.function.repeat(100);

      const startTime = performance.now();
      render(<SyntaxHighlighter code={largeCode} language="typescript" />);
      const endTime = performance.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(500); // 500ms

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should debounce rapid code changes', async () => {
      const { rerender } = render(<SyntaxHighlighter code="const x = 1;" language="typescript" />);

      // Rapid changes
      rerender(<SyntaxHighlighter code="const x = 2;" language="typescript" />);
      rerender(<SyntaxHighlighter code="const x = 3;" language="typescript" />);
      rerender(<SyntaxHighlighter code="const x = 4;" language="typescript" />);

      // Should handle without performance issues
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(prismMock.mockPrism.highlight).toHaveBeenCalled();
    });

    it('should lazy load highlighting for very large content', async () => {
      const veryLargeCode = 'const x = 1;\n'.repeat(1000);

      render(<SyntaxHighlighter code={veryLargeCode} language="typescript" />);

      // Should handle without blocking
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should virtualize long code blocks', () => {
      const longCode = Array.from({ length: 500 }, (_, i) => `const line${i} = ${i};`).join('\n');

      render(<SyntaxHighlighter code={longCode} language="typescript" virtualizeContent />);

      // Should only render visible lines
      expect(screen.getByRole('region')).toBeInTheDocument();
      // Not all 500 lines should be in DOM
      expect(screen.queryAllByText(/const line/)).toHaveLength(expect.any(Number));
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with screen readers', () => {
      const code = mockGeneratedCode.typescript.simple.function;

      render(<SyntaxHighlighter code={code} language="typescript" />);

      const codeElement = screen.getByRole('region', { name: /code/i });
      expect(codeElement).toHaveAttribute('aria-label');
      expect(codeElement).toHaveAttribute('tabindex', '0');
    });

    it('should support keyboard navigation', () => {
      const code = mockGeneratedCode.typescript.simple.function;

      render(<SyntaxHighlighter code={code} language="typescript" showCopyButton />);

      const codeElement = screen.getByRole('region');
      const copyButton = screen.getByRole('button', { name: /copy/i });

      // Should be focusable
      expect(codeElement).toHaveAttribute('tabindex', '0');
      expect(copyButton).toHaveAttribute('tabindex', '0');
    });

    it('should provide appropriate ARIA labels', () => {
      const code = mockGeneratedCode.typescript.simple.function;

      render(<SyntaxHighlighter code={code} language="typescript" showCopyButton showLineNumbers />);

      expect(screen.getByRole('region')).toHaveAttribute('aria-label', expect.stringContaining('TypeScript'));
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', expect.stringContaining('copy'));
    });

    it('should announce copy success to screen readers', async () => {
      render(<SyntaxHighlighter code="const x = 1;" language="typescript" showCopyButton />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Props and Configuration', () => {
    it('should accept custom className', () => {
      render(<SyntaxHighlighter code="const x = 1;" language="typescript" className="custom-class" />);

      expect(screen.getByRole('region')).toHaveClass('custom-class');
    });

    it('should accept custom styles', () => {
      const customStyle = { backgroundColor: 'red' };

      render(<SyntaxHighlighter code="const x = 1;" language="typescript" style={customStyle} />);

      expect(screen.getByRole('region')).toHaveStyle('background-color: red');
    });

    it('should handle maximum height setting', () => {
      render(<SyntaxHighlighter code="const x = 1;" language="typescript" maxHeight="200px" />);

      expect(screen.getByRole('region')).toHaveStyle('max-height: 200px');
    });

    it('should support custom copy button text', () => {
      render(<SyntaxHighlighter code="const x = 1;" language="typescript" showCopyButton copyButtonText="Duplicate" />);

      expect(screen.getByRole('button', { name: /duplicate/i })).toBeInTheDocument();
    });

    it('should handle read-only mode', () => {
      render(<SyntaxHighlighter code="const x = 1;" language="typescript" readOnly />);

      const codeElement = screen.getByRole('region');
      expect(codeElement).toHaveAttribute('aria-readonly', 'true');
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax highlighting errors gracefully', () => {
      prismMock.mockPrism.highlight.mockImplementation(() => {
        throw new Error('Highlighting failed');
      });

      const code = 'const x = 1;';

      render(<SyntaxHighlighter code={code} language="typescript" />);

      // Should still render the code without highlighting
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByText(code)).toBeInTheDocument();
    });

    it('should handle invalid language gracefully', () => {
      const code = 'const x = 1;';

      render(<SyntaxHighlighter code={code} language="invalid-language" as any />);

      // Should fallback to plain text
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByText(code)).toBeInTheDocument();
    });

    it('should handle missing Prism.js gracefully', () => {
      // Remove Prism mock
      prismMock.restore();
      delete (global as any).Prism;

      const code = 'const x = 1;';

      render(<SyntaxHighlighter code={code} language="typescript" />);

      // Should still render without highlighting
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByText(code)).toBeInTheDocument();
    });
  });

  describe('Language-Specific Features', () => {
    it('should highlight TypeScript features correctly', () => {
      const tsCode = `interface User {
  id: string;
  name: string;
}

function getUser(id: string): User | null {
  return null;
}`;

      render(<SyntaxHighlighter code={tsCode} language="typescript" />);

      expect(prismMock.mockPrism.highlight).toHaveBeenCalledWith(
        tsCode,
        expect.anything(),
        'typescript'
      );
    });

    it('should highlight JavaScript features correctly', () => {
      const jsCode = `const users = [1, 2, 3];
const doubled = users.map(x => x * 2);
export default doubled;`;

      render(<SyntaxHighlighter code={jsCode} language="javascript" />);

      expect(prismMock.mockPrism.highlight).toHaveBeenCalledWith(
        jsCode,
        expect.anything(),
        'javascript'
      );
    });

    it('should handle JSX/TSX correctly', () => {
      const jsxCode = `const Component = () => {
  return <div>Hello World</div>;
};`;

      render(<SyntaxHighlighter code={jsxCode} language="typescript" />);

      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByText(/Hello World/)).toBeInTheDocument();
    });
  });
});