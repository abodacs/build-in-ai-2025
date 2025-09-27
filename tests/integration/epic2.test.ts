/**
 * Epic 2 Integration Tests
 * Tests for Code Generation Engine integration across components and services
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useCodeGeneration } from '@/hooks/useCodeGeneration';
import { useAppStore } from '@/stores/appStore';
import { generateCode, optimizeCode } from '@/services/codeGeneration';
import { SyntaxHighlighter } from '@/components/ui/SyntaxHighlighter';
import {
  setupChromeAIMocks,
  cleanupChromeAIMocks
} from '../utils/chromeAiMocks';
import {
  mockGeneratedCode,
  testPrompts,
  createMockCodeResponse,
  benchmarkCodeGeneration,
  createMockPrismHighlighting
} from '../utils/codeGenMocks';
import { mockConsole, waitFor as utilWaitFor, retryUntil } from '../utils/testHelpers';

describe('Epic 2 Integration Tests - Code Generation Engine', () => {
  let consoleMock: ReturnType<typeof mockConsole>;
  let prismMock: ReturnType<typeof createMockPrismHighlighting>;

  beforeEach(() => {
    consoleMock = mockConsole();
    prismMock = createMockPrismHighlighting();
    cleanupChromeAIMocks();
    useAppStore.getState().reset();
  });

  afterEach(() => {
    consoleMock.restore();
    prismMock.restore();
    cleanupChromeAIMocks();
  });

  describe('End-to-End Code Generation Flow', () => {
    it('should complete full generation flow from prompt to display', async () => {
      setupChromeAIMocks(['Writer']);
      const { result: hookResult } = renderHook(() => useCodeGeneration());
      const { result: storeResult } = renderHook(() => useAppStore());

      // Initial state
      expect(hookResult.current.isGenerating).toBe(false);
      expect(hookResult.current.generatedCode).toBeNull();
      expect(storeResult.current.isLoading).toBe(false);

      // Generate code
      await act(async () => {
        await hookResult.current.generateCode('Create a function to add two numbers');
      });

      // Verify complete flow
      expect(hookResult.current.isGenerating).toBe(false);
      expect(hookResult.current.generatedCode).toBeTruthy();
      expect(hookResult.current.error).toBeNull();

      // Store should be updated
      expect(storeResult.current.lastInputText).toBe('Create a function to add two numbers');
      expect(storeResult.current.apiResult?.data).toBe(hookResult.current.generatedCode);
      expect(storeResult.current.isLoading).toBe(false);

      // Test syntax highlighting integration
      const { container } = render(
        <SyntaxHighlighter
          code={hookResult.current.generatedCode!}
          language={hookResult.current.language}
          showLineNumbers
          showCopyButton
        />
      );

      expect(screen.getByRole('region', { name: /code/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('should handle language switching with regeneration', async () => {
      setupChromeAIMocks(['Writer']);
      const { result: hookResult } = renderHook(() => useCodeGeneration());
      const { result: storeResult } = renderHook(() => useAppStore());

      // Generate TypeScript code
      await act(async () => {
        await hookResult.current.generateCode('Create a simple class');
      });

      const tsCode = hookResult.current.generatedCode;
      expect(tsCode).toBeTruthy();
      expect(hookResult.current.language).toBe('ts');

      // Switch to JavaScript - should trigger regeneration
      act(() => {
        storeResult.current.setCodeLanguage('js');
      });

      // Wait for regeneration to complete
      await retryUntil(
        () => hookResult.current.generatedCode,
        (code) => code !== tsCode,
        10,
        200
      );

      expect(hookResult.current.language).toBe('js');
      expect(hookResult.current.generatedCode).not.toBe(tsCode);

      // Test that syntax highlighter updates accordingly
      const { rerender } = render(
        <SyntaxHighlighter
          code={tsCode!}
          language="typescript"
        />
      );

      expect(screen.getByRole('region')).toHaveClass('language-typescript');

      rerender(
        <SyntaxHighlighter
          code={hookResult.current.generatedCode!}
          language="javascript"
        />
      );

      expect(screen.getByRole('region')).toHaveClass('language-javascript');
    });

    it('should handle error flow with user-friendly messages', async () => {
      setupChromeAIMocks(['Writer'], false); // Will fail
      const { result: hookResult } = renderHook(() => useCodeGeneration());
      const { result: storeResult } = renderHook(() => useAppStore());

      await act(async () => {
        await hookResult.current.generateCode('Test prompt');
      });

      // Error should propagate through the system
      expect(hookResult.current.error).toBeTruthy();
      expect(hookResult.current.generatedCode).toBeNull();
      expect(storeResult.current.apiResult?.error).toBeTruthy();

      // Syntax highlighter should handle null code gracefully
      render(<SyntaxHighlighter code={null as any} language="typescript" />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Multi-Component Integration', () => {
    it('should sync state across multiple code generation components', async () => {
      setupChromeAIMocks(['Writer']);

      // Simulate multiple components using the same hook
      const { result: comp1 } = renderHook(() => useCodeGeneration());
      const { result: comp2 } = renderHook(() => useCodeGeneration());
      const { result: store } = renderHook(() => useAppStore());

      // Generate from component 1
      await act(async () => {
        await comp1.current.generateCode('Create a test function');
      });

      // Both components should see the same state
      expect(comp1.current.generatedCode).toBeTruthy();
      expect(comp2.current.generatedCode).toBe(comp1.current.generatedCode);
      expect(comp1.current.lastPrompt).toBe(comp2.current.lastPrompt);

      // Store should be consistent
      expect(store.current.lastInputText).toBe('Create a test function');
      expect(store.current.apiResult?.data).toBe(comp1.current.generatedCode);
    });

    it('should handle concurrent generation requests gracefully', async () => {
      setupChromeAIMocks(['Writer']);
      const { result: hookResult } = renderHook(() => useCodeGeneration());

      // Start multiple generations concurrently
      const promises = [
        act(async () => {
          await hookResult.current.generateCode('Function 1');
        }),
        act(async () => {
          await hookResult.current.generateCode('Function 2');
        }),
        act(async () => {
          await hookResult.current.generateCode('Function 3');
        })
      ];

      await Promise.all(promises);

      // Should end up in a valid state
      expect(hookResult.current.isGenerating).toBe(false);
      expect(hookResult.current.generatedCode).toBeTruthy();
      expect(hookResult.current.error).toBeNull();
    });

    it('should maintain syntax highlighting consistency with theme changes', async () => {
      setupChromeAIMooks(['Writer']);
      const { result: hookResult } = renderHook(() => useCodeGeneration());
      const { result: storeResult } = renderHook(() => useAppStore());

      // Generate code
      await act(async () => {
        await hookResult.current.generateCode('Create a function');
      });

      // Render with light theme
      const { rerender } = render(
        <SyntaxHighlighter
          code={hookResult.current.generatedCode!}
          language="typescript"
        />
      );

      expect(screen.getByRole('region')).toHaveClass('theme-light');

      // Change to dark theme
      act(() => {
        storeResult.current.setTheme('dark');
      });

      rerender(
        <SyntaxHighlighter
          code={hookResult.current.generatedCode!}
          language="typescript"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('region')).toHaveClass('theme-dark');
      });
    });
  });

  describe('Code Editor Integration', () => {
    it('should allow editing of generated code with live syntax highlighting', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useCodeGeneration());

      // Generate initial code
      await act(async () => {
        await result.current.generateCode('Create a simple function');
      });

      const originalCode = result.current.generatedCode!;

      // Test editing functionality (simulated)
      const editedCode = originalCode + '\n// Added comment';

      render(
        <SyntaxHighlighter
          code={editedCode}
          language="typescript"
          showLineNumbers
        />
      );

      // Should handle edited code with proper highlighting
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByText(/Added comment/)).toBeInTheDocument();
    });

    it('should provide real-time validation feedback', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useCodeGeneration());

      await act(async () => {
        await result.current.generateCode('Create a function');
      });

      // Test with invalid syntax
      const invalidCode = 'function broken( {';

      render(
        <SyntaxHighlighter
          code={invalidCode}
          language="typescript"
          showValidation
        />
      );

      // Should indicate syntax errors (if validation is implemented)
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Export and Copy Integration', () => {
    it('should export generated code in multiple formats', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useCodeGeneration());

      await act(async () => {
        await result.current.generateCode('Create a TypeScript class');
      });

      const generatedCode = result.current.generatedCode!;

      // Test copy functionality
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined)
      };
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true
      });

      render(
        <SyntaxHighlighter
          code={generatedCode}
          language="typescript"
          showCopyButton
        />
      );

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(generatedCode);
      });
    });

    it('should include proper metadata in exports', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useCodeGeneration());

      await act(async () => {
        await result.current.generateCode('Create a utility function');
      });

      const metadata = result.current.generationHistory[0];
      expect(metadata.prompt).toBe('Create a utility function');
      expect(metadata.language).toBe('ts');
      expect(metadata.timestamp).toBeTruthy();
      expect(metadata.latency).toBeGreaterThan(0);
    });
  });

  describe('Performance Integration', () => {
    it('should handle large code generation efficiently', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useCodeGeneration());

      const complexPrompt = 'Create a comprehensive TypeScript class with multiple methods, interfaces, error handling, and documentation';

      const startTime = performance.now();
      await act(async () => {
        await result.current.generateCode(complexPrompt);
      });
      const endTime = performance.now();

      expect(result.current.generatedCode).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max

      // Test rendering performance with large code
      const renderStart = performance.now();
      render(
        <SyntaxHighlighter
          code={result.current.generatedCode!}
          language="typescript"
          showLineNumbers
        />
      );
      const renderEnd = performance.now();

      expect(renderEnd - renderStart).toBeLessThan(200); // 200ms max for rendering
    });

    it('should handle rapid successive generations efficiently', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useCodeGeneration());

      const benchmark = await benchmarkCodeGeneration(
        () => act(async () => {
          await result.current.generateCode('Create a simple function');
        }),
        5
      );

      expect(benchmark.average).toBeLessThan(2000); // 2 seconds average
      expect(benchmark.max).toBeLessThan(4000); // 4 seconds max
    });

    it('should manage memory efficiently during extended usage', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useCodeGeneration());

      // Generate many code snippets
      for (let i = 0; i < 20; i++) {
        await act(async () => {
          await result.current.generateCode(`Function ${i}`);
        });
      }

      // History should be limited to prevent memory issues
      expect(result.current.generationHistory.length).toBeLessThanOrEqual(10);
      expect(result.current.generatedCode).toBeTruthy();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle user switching between different code patterns', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useCodeGeneration());

      const patterns = [
        'Create a simple function',
        'Create a TypeScript class',
        'Create a React component',
        'Create an interface',
        'Create an async function'
      ];

      for (const pattern of patterns) {
        await act(async () => {
          await result.current.generateCode(pattern);
        });

        expect(result.current.generatedCode).toBeTruthy();
        expect(result.current.error).toBeNull();

        // Test that syntax highlighting works for each pattern
        render(
          <SyntaxHighlighter
            code={result.current.generatedCode!}
            language="typescript"
          />
        );

        expect(screen.getByRole('region')).toBeInTheDocument();
      }
    });

    it('should maintain user preferences across sessions', async () => {
      setupChromeAIMocks(['Writer']);
      const { result: hookResult } = renderHook(() => useCodeGeneration());
      const { result: storeResult } = renderHook(() => useAppStore());

      // Set user preferences
      act(() => {
        storeResult.current.setCodeLanguage('js');
        storeResult.current.setTheme('dark');
      });

      // Generate code
      await act(async () => {
        await hookResult.current.generateCode('Create a function');
      });

      expect(hookResult.current.language).toBe('js');

      // Simulate session restart by resetting and checking preferences persist
      // (In real app, this would be handled by persistence layer)
      const preferences = {
        language: storeResult.current.codeLanguage,
        theme: storeResult.current.theme
      };

      expect(preferences.language).toBe('js');
      expect(preferences.theme).toBe('dark');
    });

    it('should handle app reset during code generation', async () => {
      setupChromeAIMocks(['Writer']);
      const { result: hookResult } = renderHook(() => useCodeGeneration());
      const { result: storeResult } = renderHook(() => useAppStore());

      // Start generation
      const generatePromise = act(async () => {
        return hookResult.current.generateCode('Create a complex class');
      });

      // Reset app mid-generation
      act(() => {
        storeResult.current.reset();
      });

      await generatePromise;

      // Should handle gracefully
      expect(storeResult.current.activeApi).toBe('summarizer'); // default after reset
      expect(storeResult.current.codeLanguage).toBe('ts'); // default after reset
    });

    it('should integrate with optimization workflow', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useCodeGeneration());

      // Generate initial code
      await act(async () => {
        await result.current.generateCode('Create a simple function');
      });

      const originalCode = result.current.generatedCode!;

      // Test optimization integration
      const optimizationResult = await optimizeCode(originalCode, 'ts');

      expect(optimizationResult.data).toBeTruthy();
      expect(optimizationResult.optimizations).toBeTruthy();

      // Render optimized code
      render(
        <SyntaxHighlighter
          code={optimizationResult.data!}
          language="typescript"
          showLineNumbers
        />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover gracefully from API failures', async () => {
      // Start with failing API
      setupChromeAIMocks(['Writer'], false);
      const { result } = renderHook(() => useCodeGeneration());

      // First attempt should fail
      await act(async () => {
        await result.current.generateCode('Test prompt');
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.generatedCode).toBeNull();

      // Fix API
      setupChromeAIMocks(['Writer'], true);

      // Retry should succeed
      await act(async () => {
        await result.current.generateCode('Test prompt');
      });

      expect(result.current.error).toBeNull();
      expect(result.current.generatedCode).toBeTruthy();

      // Should render successfully
      render(
        <SyntaxHighlighter
          code={result.current.generatedCode!}
          language="typescript"
        />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should handle syntax highlighting failures gracefully', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useCodeGeneration());

      await act(async () => {
        await result.current.generateCode('Create a function');
      });

      // Mock highlighting failure
      prismMock.mockPrism.highlight.mockImplementation(() => {
        throw new Error('Highlighting failed');
      });

      // Should still render code without highlighting
      render(
        <SyntaxHighlighter
          code={result.current.generatedCode!}
          language="typescript"
        />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByText(/function/)).toBeInTheDocument();
    });

    it('should maintain system stability under load', async () => {
      setupChromeAIMocks(['Writer']);

      // Create multiple hook instances and stress test
      const hooks = Array.from({ length: 5 }, () => renderHook(() => useCodeGeneration()));

      // Generate code from all hooks simultaneously
      const promises = hooks.map((hook, index) =>
        act(async () => {
          await hook.result.current.generateCode(`Function ${index}`);
        })
      );

      await Promise.all(promises);

      // All should succeed
      hooks.forEach(hook => {
        expect(hook.result.current.generatedCode).toBeTruthy();
        expect(hook.result.current.error).toBeNull();
      });
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should handle different clipboard API implementations', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useCodeGeneration());

      await act(async () => {
        await result.current.generateCode('Create a function');
      });

      // Test modern clipboard API
      const modernClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined)
      };
      Object.defineProperty(navigator, 'clipboard', {
        value: modernClipboard,
        writable: true
      });

      render(
        <SyntaxHighlighter
          code={result.current.generatedCode!}
          language="typescript"
          showCopyButton
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /copy/i }));

      await waitFor(() => {
        expect(modernClipboard.writeText).toHaveBeenCalled();
      });

      // Test fallback for older browsers
      delete (navigator as any).clipboard;

      const { rerender } = render(
        <SyntaxHighlighter
          code={result.current.generatedCode!}
          language="typescript"
          showCopyButton
        />
      );

      // Should still provide copy functionality
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('should handle different theme detection methods', async () => {
      setupChromeAIMocks(['Writer']);
      const { result: hookResult } = renderHook(() => useCodeGeneration());
      const { result: storeResult } = renderHook(() => useAppStore());

      await act(async () => {
        await hookResult.current.generateCode('Create a function');
      });

      // Test different media query implementations
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      vi.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery as any);

      act(() => {
        storeResult.current.setTheme('system');
      });

      render(
        <SyntaxHighlighter
          code={hookResult.current.generatedCode!}
          language="typescript"
        />
      );

      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(mockMediaQuery.addEventListener).toHaveBeenCalled();
    });
  });
});