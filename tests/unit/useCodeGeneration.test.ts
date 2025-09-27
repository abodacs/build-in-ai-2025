/**
 * useCodeGeneration Hook Unit Tests
 * Tests for Epic 2: Code Generation Hook functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCodeGeneration } from '@/hooks/useCodeGeneration';
import { useAppStore } from '@/stores/appStore';
import {
  setupChromeAIMocks,
  cleanupChromeAIMocks
} from '../utils/chromeAiMocks';
import {
  mockGeneratedCode,
  testPrompts,
  createMockCodeResponse
} from '../utils/codeGenMocks';
import { mockConsole, waitFor, retryUntil } from '../utils/testHelpers';

describe('useCodeGeneration Hook - Epic 2', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    cleanupChromeAIMocks();
    useAppStore.getState().reset();
  });

  afterEach(() => {
    consoleMock.restore();
    cleanupChromeAIMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useCodeGeneration());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generatedCode).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.lastPrompt).toBe('');
      expect(result.current.generationHistory).toEqual([]);
      expect(typeof result.current.generateCode).toBe('function');
      expect(typeof result.current.clearCode).toBe('function');
      expect(typeof result.current.regenerateCode).toBe('function');
    });

    it('should sync with app store code language setting', () => {
      const { result: storeResult } = renderHook(() => useAppStore());
      const { result: hookResult } = renderHook(() => useCodeGeneration());

      // Initially TypeScript
      expect(hookResult.current.language).toBe('ts');

      // Change to JavaScript
      act(() => {
        storeResult.current.setCodeLanguage('js');
      });

      expect(hookResult.current.language).toBe('js');
    });
  });

  describe('Code Generation', () => {
    describe('generateCode Function', () => {
      it('should generate code and update state correctly', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useCodeGeneration());

        expect(result.current.isGenerating).toBe(false);

        await act(async () => {
          await result.current.generateCode('Create a function to add two numbers');
        });

        expect(result.current.isGenerating).toBe(false);
        expect(result.current.generatedCode).toBeTruthy();
        expect(result.current.error).toBeNull();
        expect(result.current.lastPrompt).toBe('Create a function to add two numbers');
        expect(result.current.generationHistory).toHaveLength(1);
      });

      it('should set loading state during generation', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useCodeGeneration());

        let loadingStates: boolean[] = [];

        // Start generation
        const generatePromise = act(async () => {
          return result.current.generateCode('Test prompt');
        });

        // Check loading state immediately
        expect(result.current.isGenerating).toBe(true);
        loadingStates.push(result.current.isGenerating);

        await generatePromise;

        // Should be false after completion
        expect(result.current.isGenerating).toBe(false);
        loadingStates.push(result.current.isGenerating);

        expect(loadingStates).toContain(true);
        expect(loadingStates[loadingStates.length - 1]).toBe(false);
      });

      it('should handle generation errors correctly', async () => {
        setupChromeAIMocks(['Writer'], false); // Will fail
        const { result } = renderHook(() => useCodeGeneration());

        await act(async () => {
          await result.current.generateCode('Test prompt');
        });

        expect(result.current.isGenerating).toBe(false);
        expect(result.current.generatedCode).toBeNull();
        expect(result.current.error).toBeTruthy();
        expect(result.current.lastPrompt).toBe('Test prompt');
      });

      it('should clear previous errors when new generation starts', async () => {
        setupChromeAIMocks(['Writer'], false); // Will fail first time
        const { result } = renderHook(() => useCodeGeneration());

        // First generation fails
        await act(async () => {
          await result.current.generateCode('Test prompt');
        });

        expect(result.current.error).toBeTruthy();

        // Fix API and try again
        setupChromeAIMocks(['Writer'], true);

        await act(async () => {
          await result.current.generateCode('Test prompt 2');
        });

        expect(result.current.error).toBeNull();
        expect(result.current.generatedCode).toBeTruthy();
      });

      it('should handle empty prompts gracefully', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useCodeGeneration());

        await act(async () => {
          await result.current.generateCode('');
        });

        expect(result.current.error).toBeTruthy();
        expect(result.current.generatedCode).toBeNull();
      });

      it('should integrate with app store for API results', async () => {
        setupChromeAIMocks(['Writer']);
        const { result: hookResult } = renderHook(() => useCodeGeneration());
        const { result: storeResult } = renderHook(() => useAppStore());

        await act(async () => {
          await hookResult.current.generateCode('Test prompt');
        });

        // Store should be updated
        expect(storeResult.current.lastInputText).toBe('Test prompt');
        expect(storeResult.current.apiResult).toBeTruthy();
        expect(storeResult.current.apiResult?.data).toBe(hookResult.current.generatedCode);
      });
    });

    describe('Language Switching', () => {
      it('should regenerate code when language changes', async () => {
        setupChromeAIMocks(['Writer']);
        const { result: hookResult } = renderHook(() => useCodeGeneration());
        const { result: storeResult } = renderHook(() => useAppStore());

        // Generate TypeScript code
        await act(async () => {
          await hookResult.current.generateCode('Create a simple function');
        });

        const tsCode = hookResult.current.generatedCode;
        expect(tsCode).toBeTruthy();

        // Switch to JavaScript
        await act(async () => {
          storeResult.current.setCodeLanguage('js');
        });

        // Should automatically regenerate for new language
        await retryUntil(
          () => hookResult.current.generatedCode,
          (code) => code !== tsCode,
          10,
          100
        );

        expect(hookResult.current.language).toBe('js');
        expect(hookResult.current.generatedCode).not.toBe(tsCode);
      });

      it('should maintain templates per language', async () => {
        setupChromeAIMocks(['Writer']);
        const { result: hookResult } = renderHook(() => useCodeGeneration());
        const { result: storeResult } = renderHook(() => useAppStore());

        // Generate TypeScript function
        await act(async () => {
          await hookResult.current.generateCode('Create a function');
        });

        const tsCode = hookResult.current.generatedCode;

        // Switch to JavaScript
        act(() => {
          storeResult.current.setCodeLanguage('js');
        });

        await act(async () => {
          await hookResult.current.generateCode('Create a function');
        });

        const jsCode = hookResult.current.generatedCode;

        // Codes should be different due to language-specific templates
        expect(tsCode).not.toBe(jsCode);
      });

      it('should handle mid-generation language switches', async () => {
        setupChromeAIMocks(['Writer']);
        const { result: hookResult } = renderHook(() => useCodeGeneration());
        const { result: storeResult } = renderHook(() => useAppStore());

        // Start generation
        const generatePromise = act(async () => {
          return hookResult.current.generateCode('Create a complex class');
        });

        // Switch language while generating
        act(() => {
          storeResult.current.setCodeLanguage('js');
        });

        await generatePromise;

        // Should handle gracefully
        expect(hookResult.current.generatedCode).toBeTruthy();
        expect(hookResult.current.language).toBe('js');
      });
    });

    describe('Template Management', () => {
      it('should apply appropriate templates for different code patterns', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useCodeGeneration());

        const patterns = [
          { prompt: 'Create a class', expected: /class/ },
          { prompt: 'Create a function', expected: /function|const.*=/ },
          { prompt: 'Create an interface', expected: /interface/ },
          { prompt: 'Create a React component', expected: /React|JSX/ }
        ];

        for (const pattern of patterns) {
          await act(async () => {
            await result.current.generateCode(pattern.prompt);
          });

          expect(result.current.generatedCode).toMatch(pattern.expected);
        }
      });

      it('should customize templates for different complexity levels', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useCodeGeneration());

        // Simple prompt
        await act(async () => {
          await result.current.generateCode('Add two numbers');
        });

        const simpleCode = result.current.generatedCode;

        // Complex prompt
        await act(async () => {
          await result.current.generateCode('Create a comprehensive class with error handling, validation, and async methods');
        });

        const complexCode = result.current.generatedCode;

        // Complex code should be longer
        expect(complexCode!.length).toBeGreaterThan(simpleCode!.length);
      });
    });
  });

  describe('Code Management', () => {
    describe('clearCode Function', () => {
      it('should clear generated code and reset state', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useCodeGeneration());

        // Generate code first
        await act(async () => {
          await result.current.generateCode('Test prompt');
        });

        expect(result.current.generatedCode).toBeTruthy();

        // Clear code
        act(() => {
          result.current.clearCode();
        });

        expect(result.current.generatedCode).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.lastPrompt).toBe('');
      });

      it('should not affect generation history', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useCodeGeneration());

        // Generate code
        await act(async () => {
          await result.current.generateCode('Test prompt');
        });

        const historyLength = result.current.generationHistory.length;

        // Clear code
        act(() => {
          result.current.clearCode();
        });

        // History should remain
        expect(result.current.generationHistory).toHaveLength(historyLength);
      });
    });

    describe('regenerateCode Function', () => {
      it('should regenerate code with last prompt', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useCodeGeneration());

        // Generate initial code
        await act(async () => {
          await result.current.generateCode('Create a function');
        });

        const originalCode = result.current.generatedCode;
        expect(originalCode).toBeTruthy();

        // Regenerate
        await act(async () => {
          await result.current.regenerateCode();
        });

        expect(result.current.generatedCode).toBeTruthy();
        expect(result.current.lastPrompt).toBe('Create a function');
        // May or may not be different code depending on API behavior
      });

      it('should handle regeneration when no previous prompt exists', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useCodeGeneration());

        // Try to regenerate without previous generation
        await act(async () => {
          await result.current.regenerateCode();
        });

        expect(result.current.error).toBeTruthy();
        expect(result.current.generatedCode).toBeNull();
      });
    });

    describe('Generation History', () => {
      it('should track generation history correctly', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useCodeGeneration());

        expect(result.current.generationHistory).toHaveLength(0);

        // Generate multiple pieces of code
        await act(async () => {
          await result.current.generateCode('First prompt');
        });

        expect(result.current.generationHistory).toHaveLength(1);

        await act(async () => {
          await result.current.generateCode('Second prompt');
        });

        expect(result.current.generationHistory).toHaveLength(2);

        // Check history content
        const history = result.current.generationHistory;
        expect(history[0].prompt).toBe('First prompt');
        expect(history[1].prompt).toBe('Second prompt');
        expect(history[0].timestamp).toBeLessThan(history[1].timestamp);
      });

      it('should limit history size to prevent memory issues', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useCodeGeneration());

        // Generate many pieces of code
        for (let i = 0; i < 15; i++) {
          await act(async () => {
            await result.current.generateCode(`Prompt ${i}`);
          });
        }

        // Should limit history size (assuming max 10)
        expect(result.current.generationHistory.length).toBeLessThanOrEqual(10);
      });

      it('should include generation metadata in history', async () => {
        setupChromeAIMocks(['Writer']);
        const { result } = renderHook(() => useCodeGeneration());

        await act(async () => {
          await result.current.generateCode('Test prompt');
        });

        const historyItem = result.current.generationHistory[0];
        expect(historyItem.prompt).toBe('Test prompt');
        expect(historyItem.language).toBe('ts');
        expect(historyItem.timestamp).toBeTruthy();
        expect(historyItem.code).toBeTruthy();
        expect(historyItem.latency).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle rapid consecutive generations', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useCodeGeneration());

      const promises = [];

      // Start multiple generations rapidly
      for (let i = 0; i < 5; i++) {
        promises.push(
          act(async () => {
            await result.current.generateCode(`Prompt ${i}`);
          })
        );
      }

      // Wait for all to complete
      await Promise.all(promises);

      // Should handle gracefully
      expect(result.current.generatedCode).toBeTruthy();
      expect(result.current.error).toBeNull();
    });

    it('should cleanup resources on unmount', async () => {
      setupChromeAIMocks(['Writer']);
      const { result, unmount } = renderHook(() => useCodeGeneration());

      // Generate code
      await act(async () => {
        await result.current.generateCode('Test prompt');
      });

      // Start another generation
      const generatePromise = act(async () => {
        return result.current.generateCode('Another prompt');
      });

      // Unmount during generation
      unmount();

      // Should not cause errors
      expect(() => generatePromise).not.toThrow();
    });

    it('should debounce rapid language switches', async () => {
      setupChromeAIMocks(['Writer']);
      const { result: hookResult } = renderHook(() => useCodeGeneration());
      const { result: storeResult } = renderHook(() => useAppStore());

      // Generate initial code
      await act(async () => {
        await hookResult.current.generateCode('Test function');
      });

      let generationCount = 0;
      const originalGenerate = hookResult.current.generateCode;

      // Mock to count calls
      vi.spyOn(hookResult.current, 'generateCode').mockImplementation(async (...args) => {
        generationCount++;
        return originalGenerate(...args);
      });

      // Rapid language switches
      act(() => {
        storeResult.current.setCodeLanguage('js');
        storeResult.current.setCodeLanguage('ts');
        storeResult.current.setCodeLanguage('js');
        storeResult.current.setCodeLanguage('ts');
      });

      await waitFor(500); // Wait for debouncing

      // Should not generate for every switch (debounced)
      expect(generationCount).toBeLessThan(4);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should recover from API failures', async () => {
      setupChromeAIMocks(['Writer'], false); // Start failing
      const { result } = renderHook(() => useCodeGeneration());

      // First generation should fail
      await act(async () => {
        await result.current.generateCode('Test prompt');
      });

      expect(result.current.error).toBeTruthy();

      // Fix API
      setupChromeAIMocks(['Writer'], true);

      // Retry should succeed
      await act(async () => {
        await result.current.generateCode('Test prompt');
      });

      expect(result.current.error).toBeNull();
      expect(result.current.generatedCode).toBeTruthy();
    });

    it('should handle concurrent error and success scenarios', async () => {
      setupChromeAIMocks(['Writer']);
      const { result } = renderHook(() => useCodeGeneration());

      // Mix of successful and failing operations
      setupChromeAIMocks(['Writer'], false);

      const failPromise = act(async () => {
        await result.current.generateCode('Fail prompt');
      });

      setupChromeAIMocks(['Writer'], true);

      const successPromise = act(async () => {
        await result.current.generateCode('Success prompt');
      });

      await Promise.all([failPromise, successPromise]);

      // Should end up in successful state
      expect(result.current.generatedCode).toBeTruthy();
      expect(result.current.lastPrompt).toBe('Success prompt');
    });

    it('should provide meaningful error messages', async () => {
      cleanupChromeAIMocks(); // No Writer API
      const { result } = renderHook(() => useCodeGeneration());

      await act(async () => {
        await result.current.generateCode('Test prompt');
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toMatch(/not supported|unavailable/i);
    });
  });

  describe('Integration with App Store', () => {
    it('should sync isLoading state with app store', async () => {
      setupChromeAIMocks(['Writer']);
      const { result: hookResult } = renderHook(() => useCodeGeneration());
      const { result: storeResult } = renderHook(() => useAppStore());

      // Start generation
      const generatePromise = act(async () => {
        return hookResult.current.generateCode('Test prompt');
      });

      // Both should show loading
      expect(hookResult.current.isGenerating).toBe(true);
      expect(storeResult.current.isLoading).toBe(true);

      await generatePromise;

      // Both should stop loading
      expect(hookResult.current.isGenerating).toBe(false);
      expect(storeResult.current.isLoading).toBe(false);
    });

    it('should update store with generation results', async () => {
      setupChromeAIMocks(['Writer']);
      const { result: hookResult } = renderHook(() => useCodeGeneration());
      const { result: storeResult } = renderHook(() => useAppStore());

      await act(async () => {
        await hookResult.current.generateCode('Test prompt');
      });

      const apiResult = storeResult.current.apiResult;
      expect(apiResult).toBeTruthy();
      expect(apiResult!.data).toBe(hookResult.current.generatedCode);
      expect(apiResult!.error).toBeNull();
      expect(storeResult.current.lastInputText).toBe('Test prompt');
    });

    it('should respect global theme changes for code display', async () => {
      setupChromeAIMocks(['Writer']);
      const { result: hookResult } = renderHook(() => useCodeGeneration());
      const { result: storeResult } = renderHook(() => useAppStore());

      await act(async () => {
        await hookResult.current.generateCode('Test prompt');
      });

      // Change theme
      act(() => {
        storeResult.current.setTheme('dark');
      });

      // Hook should be aware of theme changes for syntax highlighting
      expect(hookResult.current.theme).toBe('dark');
    });
  });
});