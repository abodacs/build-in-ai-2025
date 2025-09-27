/**
 * Epic 1 Integration Tests
 * Tests for service-store-component integration of Enhanced API Service Layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useAppStore,
  useActiveApi,
  useApiResult,
  useIsLoading,
  useAiCapabilities
} from '@/stores/appStore';
import {
  summarizeText,
  translateText,
  generateText,
  rewriteText,
  proofreadText,
  promptLanguageModel,
  detectLanguage,
  checkAiCapabilities,
  useAiService,
  useCodeGeneration
} from '@/services/aiService';
import {
  setupChromeAIMocks,
  cleanupChromeAIMocks,
  mockApiResponses,
  errorScenarios
} from '../utils/chromeAiMocks';
import { mockConsole, waitFor, retryUntil } from '../utils/testHelpers';

describe('Epic 1 Integration Tests - Enhanced API Service Layer', () => {
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

  describe('Service-Store Integration', () => {
    describe('End-to-End API Flow', () => {
      it('should complete full summarizer flow from API call to state update', async () => {
        setupChromeAIMocks(['Summarizer']);
        const { result: storeResult } = renderHook(() => useAppStore());
        const { result: serviceResult } = renderHook(() => useAiService());

        // Initial state
        expect(storeResult.current.isLoading).toBe(false);
        expect(storeResult.current.apiResult).toBeNull();

        // Set active API
        act(() => {
          storeResult.current.setActiveApi('summarizer');
        });

        // Call service method and track state changes
        let loadingStateChanges: boolean[] = [];
        const unsubscribe = useAppStore.subscribe((state) => {
          loadingStateChanges.push(state.isLoading);
        });

        const result = await act(async () => {
          return await serviceResult.current.callCurrentApi('Test text for summarization');
        });

        unsubscribe();

        // Verify the complete flow
        expect(result.data).toBe(mockApiResponses.summarizer.success);
        expect(result.error).toBeNull();
        expect(result.latency).toBeGreaterThan(0);
        expect(result.timestamp).toBeGreaterThan(0);

        // Verify state updates
        expect(storeResult.current.isLoading).toBe(false);
        expect(storeResult.current.apiResult).toEqual(result);
        expect(storeResult.current.lastInputText).toBe('Test text for summarization');

        // Verify loading state transitions
        expect(loadingStateChanges).toContain(true);
        expect(loadingStateChanges[loadingStateChanges.length - 1]).toBe(false);
      });

      it('should handle error flow from API to state correctly', async () => {
        setupChromeAIMocks(['Summarizer'], false); // Will fail
        const { result: storeResult } = renderHook(() => useAppStore());
        const { result: serviceResult } = renderHook(() => useAiService());

        act(() => {
          storeResult.current.setActiveApi('summarizer');
        });

        const result = await act(async () => {
          return await serviceResult.current.callCurrentApi('Test text');
        });

        // Verify error handling
        expect(result.data).toBeNull();
        expect(result.error).toContain('Summarizer API error');
        expect(storeResult.current.apiResult).toEqual(result);
        expect(storeResult.current.isLoading).toBe(false);
      });

      it('should handle multiple rapid API calls correctly', async () => {
        setupChromeAIMocks(['Summarizer', 'Translator']);
        const { result: storeResult } = renderHook(() => useAppStore());
        const { result: serviceResult } = renderHook(() => useAiService());

        // Rapid API switches and calls
        const promises = [
          act(async () => {
            storeResult.current.setActiveApi('summarizer');
            return await serviceResult.current.callCurrentApi('Text 1');
          }),
          act(async () => {
            storeResult.current.setActiveApi('translator');
            return await serviceResult.current.callCurrentApi('Text 2');
          }),
          act(async () => {
            storeResult.current.setActiveApi('summarizer');
            return await serviceResult.current.callCurrentApi('Text 3');
          })
        ];

        const results = await Promise.all(promises);

        // Verify all calls completed
        results.forEach(result => {
          expect(result.data).toBeTruthy();
          expect(result.error).toBeNull();
        });

        // Verify final state is consistent
        expect(storeResult.current.isLoading).toBe(false);
        expect(storeResult.current.apiResult).toBeTruthy();
      });
    });

    describe('Capability Detection Integration', () => {
      it('should update store capabilities when detection completes', async () => {
        setupChromeAIMocks(['Summarizer', 'Translator', 'Writer']);
        const { result } = renderHook(() => useAiCapabilities());

        expect(result.current).toBeNull();

        // Run capability detection
        const capabilities = await checkAiCapabilities();

        // Wait for store to update
        await retryUntil(
          () => useAppStore.getState().aiCapabilities,
          (caps) => caps !== null,
          10,
          50
        );

        expect(result.current).toEqual({
          summarizer: 'available',
          translator: 'available',
          writer: 'available',
          rewriter: 'unavailable',
          proofreader: 'unavailable',
          prompt: 'unavailable',
          languageDetection: 'unavailable'
        });
      });

      it('should handle mixed capability states correctly', async () => {
        setupChromeAIMocks(['Summarizer']); // Only one API available
        const { result } = renderHook(() => useAiCapabilities());

        await checkAiCapabilities();

        await retryUntil(
          () => useAppStore.getState().aiCapabilities,
          (caps) => caps !== null,
          10,
          50
        );

        expect(result.current?.summarizer).toBe('available');
        expect(result.current?.translator).toBe('unavailable');
        expect(result.current?.writer).toBe('unavailable');
      });
    });

    describe('Code Generation Integration', () => {
      it('should integrate code generation with store state', async () => {
        setupChromeAIMocks(['Writer']);
        const { result: storeResult } = renderHook(() => useAppStore());
        const { result: codeGenResult } = renderHook(() => useCodeGeneration());

        // Set TypeScript language
        act(() => {
          storeResult.current.setCodeLanguage('ts');
        });

        const code = await act(async () => {
          return await codeGenResult.current.generateCode('Create a function to add two numbers');
        });

        expect(code).toBeTruthy();
        expect(storeResult.current.lastInputText).toBe('Create a function to add two numbers');
        expect(storeResult.current.apiResult?.data).toBe(code);
      });

      it('should handle language switching during code generation', async () => {
        setupChromeAIMocks(['Writer']);
        const { result: storeResult } = renderHook(() => useAppStore());
        const { result: codeGenResult } = renderHook(() => useCodeGeneration());

        // Generate TypeScript code
        act(() => {
          storeResult.current.setCodeLanguage('ts');
        });

        const tsCode = await act(async () => {
          return await codeGenResult.current.generateCode('Create a simple class');
        });

        // Switch to JavaScript
        act(() => {
          storeResult.current.setCodeLanguage('js');
        });

        const jsCode = await act(async () => {
          return await codeGenResult.current.generateCode('Create a simple function');
        });

        expect(tsCode).toBeTruthy();
        expect(jsCode).toBeTruthy();
        expect(storeResult.current.codeLanguage).toBe('js');
      });
    });
  });

  describe('Cross-Browser Compatibility', () => {
    describe('Chrome AI API Availability', () => {
      it('should gracefully handle missing Chrome AI APIs', async () => {
        cleanupChromeAIMocks(); // No APIs available

        const capabilities = await checkAiCapabilities();

        expect(capabilities.summarizer).toBe('unavailable');
        expect(capabilities.translator).toBe('unavailable');
        expect(capabilities.writer).toBe('unavailable');
        expect(capabilities.rewriter).toBe('unavailable');
        expect(capabilities.proofreader).toBe('unavailable');
        expect(capabilities.prompt).toBe('unavailable');
        expect(capabilities.languageDetection).toBe('unavailable');
      });

      it('should handle partial API availability', async () => {
        setupChromeAIMocks(['Summarizer', 'Writer']); // Only some APIs

        const capabilities = await checkAiCapabilities();

        expect(capabilities.summarizer).toBe('available');
        expect(capabilities.writer).toBe('available');
        expect(capabilities.translator).toBe('unavailable');
        expect(capabilities.rewriter).toBe('unavailable');
      });

      it('should handle globalThis availability issues', async () => {
        const originalGlobalThis = globalThis;

        try {
          // Simulate browser without globalThis
          (global as any).globalThis = undefined;

          const capabilities = await checkAiCapabilities();

          // Should handle gracefully
          expect(capabilities.summarizer).toBe('unavailable');
          expect(capabilities.translator).toBe('unavailable');
        } finally {
          (global as any).globalThis = originalGlobalThis;
        }
      });
    });

    describe('Fallback Behavior', () => {
      it('should provide appropriate error messages when APIs unavailable', async () => {
        cleanupChromeAIMocks();

        const result = await summarizeText('Test text');

        expect(result.data).toBeNull();
        expect(result.error).toContain('not supported');
      });

      it('should maintain app functionality when some APIs fail', async () => {
        setupChromeAIMocks(['Summarizer'], true);
        setupChromeAIMocks(['Translator'], false); // Translator fails

        const summarizeResult = await summarizeText('Test text');
        const translateResult = await translateText('Test text', 'en', 'es');

        expect(summarizeResult.data).toBeTruthy();
        expect(summarizeResult.error).toBeNull();

        expect(translateResult.data).toBeNull();
        expect(translateResult.error).toBeTruthy();
      });
    });
  });

  describe('React Hook Integration', () => {
    describe('Hook Composition', () => {
      it('should maintain consistency across multiple hooks', async () => {
        setupChromeAIMocks(['Summarizer']);

        const { result: apiResult } = renderHook(() => useApiResult());
        const { result: loadingResult } = renderHook(() => useIsLoading());
        const { result: activeApiResult } = renderHook(() => useActiveApi());
        const { result: serviceResult } = renderHook(() => useAiService());

        // Initial state consistency
        expect(apiResult.current).toBeNull();
        expect(loadingResult.current).toBe(false);
        expect(activeApiResult.current).toBe('summarizer');

        // Change active API and call service
        act(() => {
          useAppStore.getState().setActiveApi('summarizer');
        });

        await act(async () => {
          await serviceResult.current.callCurrentApi('Test text');
        });

        // Verify all hooks reflect the same state
        expect(loadingResult.current).toBe(false);
        expect(apiResult.current).toBeTruthy();
        expect(activeApiResult.current).toBe('summarizer');
      });

      it('should handle hook lifecycle correctly during unmount', () => {
        const { result, unmount } = renderHook(() => useAppStore());

        act(() => {
          result.current.setActiveApi('translator');
          result.current.setLoading(true);
        });

        expect(result.current.activeApi).toBe('translator');
        expect(result.current.isLoading).toBe(true);

        // Unmount should not cause errors
        expect(() => unmount()).not.toThrow();
      });
    });

    describe('State Synchronization', () => {
      it('should synchronize state changes across multiple components', async () => {
        setupChromeAIMocks(['Summarizer']);

        // Simulate multiple components using the same hooks
        const { result: comp1 } = renderHook(() => ({
          activeApi: useActiveApi(),
          isLoading: useIsLoading(),
          apiResult: useApiResult()
        }));

        const { result: comp2 } = renderHook(() => ({
          activeApi: useActiveApi(),
          isLoading: useIsLoading(),
          apiResult: useApiResult()
        }));

        const { result: service } = renderHook(() => useAiService());

        // Change state from one component
        act(() => {
          useAppStore.getState().setActiveApi('summarizer');
        });

        // Both components should see the change
        expect(comp1.current.activeApi).toBe('summarizer');
        expect(comp2.current.activeApi).toBe('summarizer');

        // Call API from service
        await act(async () => {
          await service.current.callCurrentApi('Test text');
        });

        // Both components should see the result
        expect(comp1.current.apiResult).toBeTruthy();
        expect(comp2.current.apiResult).toBeTruthy();
        expect(comp1.current.isLoading).toBe(false);
        expect(comp2.current.isLoading).toBe(false);

        // Results should be identical
        expect(comp1.current.apiResult).toEqual(comp2.current.apiResult);
      });

      it('should handle rapid state changes without race conditions', async () => {
        setupChromeAIMocks(['Summarizer', 'Translator']);
        const { result } = renderHook(() => useAiService());

        let stateSnapshots: any[] = [];
        const unsubscribe = useAppStore.subscribe((state) => {
          stateSnapshots.push({
            activeApi: state.activeApi,
            isLoading: state.isLoading,
            hasResult: state.apiResult !== null,
            timestamp: Date.now()
          });
        });

        // Rapid state changes
        const rapidChanges = async () => {
          useAppStore.getState().setActiveApi('summarizer');
          await result.current.callCurrentApi('Text 1');

          useAppStore.getState().setActiveApi('translator');
          await result.current.callCurrentApi('Text 2');

          useAppStore.getState().setActiveApi('summarizer');
          await result.current.callCurrentApi('Text 3');
        };

        await act(async () => {
          await rapidChanges();
        });

        unsubscribe();

        // Verify no inconsistent states
        const finalState = useAppStore.getState();
        expect(finalState.isLoading).toBe(false);
        expect(finalState.apiResult).toBeTruthy();

        // Verify state transitions were logical
        const loadingStates = stateSnapshots.map(s => s.isLoading);
        expect(loadingStates[loadingStates.length - 1]).toBe(false);
      });
    });
  });

  describe('Error Propagation and Recovery', () => {
    it('should propagate errors through the entire system', async () => {
      setupChromeAIMocks(['Summarizer'], false);
      const { result: storeResult } = renderHook(() => useAppStore());
      const { result: serviceResult } = renderHook(() => useAiService());

      act(() => {
        storeResult.current.setActiveApi('summarizer');
      });

      await act(async () => {
        await serviceResult.current.callCurrentApi('Test text');
      });

      // Error should be in store
      expect(storeResult.current.apiResult?.error).toBeTruthy();
      expect(storeResult.current.isLoading).toBe(false);
    });

    it('should recover gracefully from errors', async () => {
      // Start with failing API
      setupChromeAIMocks(['Summarizer'], false);
      const { result: serviceResult } = renderHook(() => useAiService());

      const failingResult = await act(async () => {
        return await serviceResult.current.callCurrentApi('Test text');
      });

      expect(failingResult.error).toBeTruthy();

      // Fix the API
      setupChromeAIMocks(['Summarizer'], true);

      const successResult = await act(async () => {
        return await serviceResult.current.callCurrentApi('Test text');
      });

      expect(successResult.error).toBeNull();
      expect(successResult.data).toBeTruthy();
    });

    it('should handle network timeouts and retries', async () => {
      setupChromeAIMocks(['Summarizer']);
      const mockApi = (globalThis as any).Summarizer;

      // Mock a timeout scenario
      let callCount = 0;
      mockApi.create = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // First call times out
          throw new Error('Request timeout');
        }
        // Second call succeeds
        return {
          summarize: vi.fn().mockResolvedValue(mockApiResponses.summarizer.success),
          destroy: vi.fn()
        };
      });

      // First call should fail
      const firstResult = await summarizeText('Test text');
      expect(firstResult.error).toContain('timeout');

      // Second call should succeed
      const secondResult = await summarizeText('Test text');
      expect(secondResult.data).toBeTruthy();
      expect(secondResult.error).toBeNull();
    });
  });

  describe('Performance and Memory', () => {
    it('should properly cleanup resources', async () => {
      setupChromeAIMocks(['Summarizer']);
      const destroySpies: any[] = [];

      // Override mock to track destroy calls
      const originalCreate = (globalThis as any).Summarizer.create;
      (globalThis as any).Summarizer.create = vi.fn().mockImplementation(async () => {
        const destroySpy = vi.fn();
        destroySpies.push(destroySpy);
        return {
          summarize: vi.fn().mockResolvedValue(mockApiResponses.summarizer.success),
          destroy: destroySpy
        };
      });

      // Make multiple API calls
      await summarizeText('Text 1');
      await summarizeText('Text 2');
      await summarizeText('Text 3');

      // All instances should have been destroyed
      destroySpies.forEach(spy => {
        expect(spy).toHaveBeenCalled();
      });

      // Restore original
      (globalThis as any).Summarizer.create = originalCreate;
    });

    it('should handle high-frequency API calls efficiently', async () => {
      setupChromeAIMocks(['Summarizer']);
      const startTime = performance.now();

      // Make many rapid calls
      const promises = Array.from({ length: 20 }, (_, i) =>
        summarizeText(`Test text ${i}`)
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();

      // All should succeed
      results.forEach(result => {
        expect(result.data).toBeTruthy();
        expect(result.error).toBeNull();
      });

      // Should complete in reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle user switching APIs during loading', async () => {
      setupChromeAIMocks(['Summarizer', 'Translator']);
      const { result: storeResult } = renderHook(() => useAppStore());
      const { result: serviceResult } = renderHook(() => useAiService());

      // Start a summarizer call
      act(() => {
        storeResult.current.setActiveApi('summarizer');
      });

      const summarizerPromise = serviceResult.current.callCurrentApi('Long text for summarization');

      // User switches to translator while summarizer is still running
      act(() => {
        storeResult.current.setActiveApi('translator');
      });

      const translatorPromise = serviceResult.current.callCurrentApi('Text to translate');

      // Both should complete successfully
      const [summarizerResult, translatorResult] = await Promise.all([
        summarizerPromise,
        translatorPromise
      ]);

      expect(summarizerResult.data).toBeTruthy();
      expect(translatorResult.data).toBeTruthy();
      expect(storeResult.current.activeApi).toBe('translator');
    });

    it('should handle app reset during active operations', async () => {
      setupChromeAIMocks(['Summarizer']);
      const { result: storeResult } = renderHook(() => useAppStore());
      const { result: serviceResult } = renderHook(() => useAiService());

      // Start an operation
      act(() => {
        storeResult.current.setLoading(true);
        storeResult.current.setLastInputText('Test input');
      });

      // Reset store mid-operation
      act(() => {
        storeResult.current.reset();
      });

      // Verify reset worked
      expect(storeResult.current.isLoading).toBe(false);
      expect(storeResult.current.lastInputText).toBe('');
      expect(storeResult.current.apiResult).toBeNull();

      // New operations should still work
      const result = await act(async () => {
        return await serviceResult.current.callCurrentApi('New test text');
      });

      expect(result.data).toBeTruthy();
    });

    it('should maintain data integrity across page refreshes simulation', () => {
      setupChromeAIMocks(['Summarizer']);
      const { result: store1 } = renderHook(() => useAppStore());

      // Set some state
      act(() => {
        store1.current.setActiveApi('summarizer');
        store1.current.setLastInputText('Test text');
        store1.current.setTheme('dark');
      });

      // Simulate page refresh by creating new hook instances
      const { result: store2 } = renderHook(() => useAppStore());

      // State should be reset to defaults (simulating fresh page load)
      expect(store2.current.activeApi).toBe('summarizer'); // default
      expect(store2.current.lastInputText).toBe(''); // default
      expect(store2.current.theme).toBe('system'); // default
    });
  });
});