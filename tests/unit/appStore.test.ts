/**
 * App Store Unit Tests (Zustand + Zod)
 * Tests for state management layer of Epic 1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useAppStore,
  useActiveApi,
  useCodeLanguage,
  useApiResult,
  useIsLoading,
  useAiCapabilities,
  useLastInputText,
  useTheme,
  ApiResultSchema,
  AppStateSchema,
  type ApiResult,
  type AiCapabilities,
  type CodeLanguage
} from '@/stores/appStore';
import { createMockApiResult, createMockApiError, mockConsole, testZodSchema } from '../utils/testHelpers';

describe('App Store (Zustand + Zod) - Epic 1', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    // Reset store to initial state
    useAppStore.getState().reset();
  });

  afterEach(() => {
    consoleMock.restore();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const state = useAppStore.getState();

      expect(state.activeApi).toBe('summarizer');
      expect(state.codeLanguage).toBe('ts');
      expect(state.apiResult).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.aiCapabilities).toBeNull();
      expect(state.lastInputText).toBe('');
      expect(state.theme).toBe('system');
    });

    it('should have all required action methods', () => {
      const state = useAppStore.getState();

      expect(typeof state.setActiveApi).toBe('function');
      expect(typeof state.setCodeLanguage).toBe('function');
      expect(typeof state.setApiResult).toBe('function');
      expect(typeof state.setLoading).toBe('function');
      expect(typeof state.setAiCapabilities).toBe('function');
      expect(typeof state.setLastInputText).toBe('function');
      expect(typeof state.setTheme).toBe('function');
      expect(typeof state.clearApiResult).toBe('function');
      expect(typeof state.reset).toBe('function');
    });

    it('should validate initial state against schema', () => {
      const state = useAppStore.getState();
      const { setActiveApi, setCodeLanguage, setApiResult, setLoading, setAiCapabilities, setLastInputText, setTheme, clearApiResult, reset, ...stateData } = state;

      expect(() => AppStateSchema.parse(stateData)).not.toThrow();
    });
  });

  describe('Store Actions', () => {
    describe('setActiveApi', () => {
      it('should update activeApi state', () => {
        const { result } = renderHook(() => useAppStore());

        act(() => {
          result.current.setActiveApi('translator');
        });

        expect(result.current.activeApi).toBe('translator');
      });

      it('should handle different API names', () => {
        const apiNames = ['summarizer', 'translator', 'writer', 'rewriter', 'proofreader', 'prompt', 'languageDetection'];
        const store = useAppStore.getState();

        apiNames.forEach(apiName => {
          act(() => {
            store.setActiveApi(apiName);
          });

          expect(useAppStore.getState().activeApi).toBe(apiName);
        });
      });

      it('should handle empty string API name', () => {
        const store = useAppStore.getState();

        act(() => {
          store.setActiveApi('');
        });

        expect(useAppStore.getState().activeApi).toBe('');
      });
    });

    describe('setCodeLanguage', () => {
      it('should update codeLanguage to js', () => {
        const store = useAppStore.getState();

        act(() => {
          store.setCodeLanguage('js');
        });

        expect(useAppStore.getState().codeLanguage).toBe('js');
      });

      it('should update codeLanguage to ts', () => {
        const store = useAppStore.getState();

        act(() => {
          store.setCodeLanguage('ts');
        });

        expect(useAppStore.getState().codeLanguage).toBe('ts');
      });

      it('should toggle between js and ts', () => {
        const store = useAppStore.getState();

        // Start with default 'ts'
        expect(useAppStore.getState().codeLanguage).toBe('ts');

        // Switch to 'js'
        act(() => {
          store.setCodeLanguage('js');
        });
        expect(useAppStore.getState().codeLanguage).toBe('js');

        // Switch back to 'ts'
        act(() => {
          store.setCodeLanguage('ts');
        });
        expect(useAppStore.getState().codeLanguage).toBe('ts');
      });
    });

    describe('setApiResult', () => {
      it('should validate and store valid result with timestamp', () => {
        const store = useAppStore.getState();
        const mockResult = createMockApiResult();
        const timestampBefore = Date.now();

        act(() => {
          store.setApiResult(mockResult);
        });

        const storedResult = useAppStore.getState().apiResult;
        expect(storedResult).toBeTruthy();
        expect(storedResult!.data).toBe(mockResult.data);
        expect(storedResult!.error).toBe(mockResult.error);
        expect(storedResult!.latency).toBe(mockResult.latency);
        expect(storedResult!.timestamp).toBeGreaterThanOrEqual(timestampBefore);
        expect(useAppStore.getState().isLoading).toBe(false);
      });

      it('should handle error results correctly', () => {
        const store = useAppStore.getState();
        const errorResult = createMockApiError('Test error', 200);

        act(() => {
          store.setApiResult(errorResult);
        });

        const storedResult = useAppStore.getState().apiResult;
        expect(storedResult!.data).toBeNull();
        expect(storedResult!.error).toBe('Test error');
        expect(storedResult!.latency).toBe(200);
        expect(useAppStore.getState().isLoading).toBe(false);
      });

      it('should handle invalid result format and create error state', () => {
        const store = useAppStore.getState();
        const invalidResult = { invalid: 'data' } as any;

        act(() => {
          store.setApiResult(invalidResult);
        });

        const storedResult = useAppStore.getState().apiResult;
        expect(storedResult!.data).toBeNull();
        expect(storedResult!.error).toBe('Invalid result format');
        expect(storedResult!.latency).toBe(0);
        expect(useAppStore.getState().isLoading).toBe(false);
        expect(consoleMock.mocks.error).toHaveBeenCalledWith('Invalid API result:', expect.any(Error));
      });

      it('should preserve timestamp from existing result if provided', () => {
        const store = useAppStore.getState();
        const existingTimestamp = 1234567890;
        const resultWithTimestamp = createMockApiResult({ timestamp: existingTimestamp });

        act(() => {
          store.setApiResult(resultWithTimestamp);
        });

        const storedResult = useAppStore.getState().apiResult;
        expect(storedResult!.timestamp).toBe(existingTimestamp);
      });

      it('should auto-set loading to false when result is set', () => {
        const store = useAppStore.getState();

        // First set loading to true
        act(() => {
          store.setLoading(true);
        });
        expect(useAppStore.getState().isLoading).toBe(true);

        // Then set result
        act(() => {
          store.setApiResult(createMockApiResult());
        });

        expect(useAppStore.getState().isLoading).toBe(false);
      });
    });

    describe('setLoading', () => {
      it('should update loading state to true', () => {
        const store = useAppStore.getState();

        act(() => {
          store.setLoading(true);
        });

        expect(useAppStore.getState().isLoading).toBe(true);
      });

      it('should update loading state to false', () => {
        const store = useAppStore.getState();

        // First set to true
        act(() => {
          store.setLoading(true);
        });

        // Then set to false
        act(() => {
          store.setLoading(false);
        });

        expect(useAppStore.getState().isLoading).toBe(false);
      });

      it('should handle rapid loading state changes', () => {
        const store = useAppStore.getState();

        // Rapid changes
        act(() => {
          store.setLoading(true);
          store.setLoading(false);
          store.setLoading(true);
        });

        expect(useAppStore.getState().isLoading).toBe(true);
      });
    });

    describe('setAiCapabilities', () => {
      it('should store AI capabilities', () => {
        const store = useAppStore.getState();
        const capabilities: AiCapabilities = {
          summarizer: 'available',
          translator: 'available',
          writer: 'unavailable',
          rewriter: 'loading',
          proofreader: 'unavailable',
          prompt: 'available',
          languageDetection: 'available'
        };

        act(() => {
          store.setAiCapabilities(capabilities);
        });

        expect(useAppStore.getState().aiCapabilities).toEqual(capabilities);
      });

      it('should handle all capability states', () => {
        const store = useAppStore.getState();
        const states: Array<'available' | 'unavailable' | 'loading'> = ['available', 'unavailable', 'loading'];

        states.forEach(state => {
          const capabilities: AiCapabilities = {
            summarizer: state,
            translator: state,
            writer: state,
            rewriter: state,
            proofreader: state,
            prompt: state,
            languageDetection: state
          };

          act(() => {
            store.setAiCapabilities(capabilities);
          });

          expect(useAppStore.getState().aiCapabilities).toEqual(capabilities);
        });
      });

      it('should handle mixed capability states', () => {
        const store = useAppStore.getState();
        const mixedCapabilities: AiCapabilities = {
          summarizer: 'available',
          translator: 'loading',
          writer: 'unavailable',
          rewriter: 'available',
          proofreader: 'loading',
          prompt: 'unavailable',
          languageDetection: 'available'
        };

        act(() => {
          store.setAiCapabilities(mixedCapabilities);
        });

        expect(useAppStore.getState().aiCapabilities).toEqual(mixedCapabilities);
      });
    });

    describe('setLastInputText', () => {
      it('should store input text', () => {
        const store = useAppStore.getState();
        const inputText = 'This is test input text for the AI';

        act(() => {
          store.setLastInputText(inputText);
        });

        expect(useAppStore.getState().lastInputText).toBe(inputText);
      });

      it('should handle empty string', () => {
        const store = useAppStore.getState();

        act(() => {
          store.setLastInputText('');
        });

        expect(useAppStore.getState().lastInputText).toBe('');
      });

      it('should handle very long text', () => {
        const store = useAppStore.getState();
        const longText = 'A'.repeat(10000);

        act(() => {
          store.setLastInputText(longText);
        });

        expect(useAppStore.getState().lastInputText).toBe(longText);
      });

      it('should handle special characters and unicode', () => {
        const store = useAppStore.getState();
        const specialText = 'Special chars: !@#$%^&*()_+ 中文 🚀 emoji';

        act(() => {
          store.setLastInputText(specialText);
        });

        expect(useAppStore.getState().lastInputText).toBe(specialText);
      });
    });

    describe('setTheme', () => {
      it('should update theme to light', () => {
        const store = useAppStore.getState();

        act(() => {
          store.setTheme('light');
        });

        expect(useAppStore.getState().theme).toBe('light');
      });

      it('should update theme to dark', () => {
        const store = useAppStore.getState();

        act(() => {
          store.setTheme('dark');
        });

        expect(useAppStore.getState().theme).toBe('dark');
      });

      it('should update theme to system', () => {
        const store = useAppStore.getState();

        act(() => {
          store.setTheme('system');
        });

        expect(useAppStore.getState().theme).toBe('system');
      });

      it('should cycle through all theme options', () => {
        const store = useAppStore.getState();
        const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];

        themes.forEach(theme => {
          act(() => {
            store.setTheme(theme);
          });

          expect(useAppStore.getState().theme).toBe(theme);
        });
      });
    });

    describe('clearApiResult', () => {
      it('should reset apiResult to null', () => {
        const store = useAppStore.getState();

        // First set a result
        act(() => {
          store.setApiResult(createMockApiResult());
        });
        expect(useAppStore.getState().apiResult).not.toBeNull();

        // Then clear it
        act(() => {
          store.clearApiResult();
        });

        expect(useAppStore.getState().apiResult).toBeNull();
      });

      it('should not affect other state properties', () => {
        const store = useAppStore.getState();

        // Set various state properties
        act(() => {
          store.setActiveApi('translator');
          store.setCodeLanguage('js');
          store.setLoading(true);
          store.setLastInputText('test input');
          store.setApiResult(createMockApiResult());
        });

        const stateBefore = useAppStore.getState();

        // Clear API result
        act(() => {
          store.clearApiResult();
        });

        const stateAfter = useAppStore.getState();

        expect(stateAfter.activeApi).toBe(stateBefore.activeApi);
        expect(stateAfter.codeLanguage).toBe(stateBefore.codeLanguage);
        expect(stateAfter.isLoading).toBe(stateBefore.isLoading);
        expect(stateAfter.lastInputText).toBe(stateBefore.lastInputText);
        expect(stateAfter.apiResult).toBeNull();
      });
    });

    describe('reset', () => {
      it('should restore initial state', () => {
        const store = useAppStore.getState();
        const initialState = { ...store };
        delete (initialState as any).setActiveApi;
        delete (initialState as any).setCodeLanguage;
        delete (initialState as any).setApiResult;
        delete (initialState as any).setLoading;
        delete (initialState as any).setAiCapabilities;
        delete (initialState as any).setLastInputText;
        delete (initialState as any).setTheme;
        delete (initialState as any).clearApiResult;
        delete (initialState as any).reset;

        // Modify all state properties
        act(() => {
          store.setActiveApi('translator');
          store.setCodeLanguage('js');
          store.setApiResult(createMockApiResult());
          store.setLoading(true);
          store.setAiCapabilities({
            summarizer: 'available',
            translator: 'available',
            writer: 'unavailable',
            rewriter: 'loading',
            proofreader: 'unavailable',
            prompt: 'available',
            languageDetection: 'available'
          });
          store.setLastInputText('modified text');
          store.setTheme('dark');
        });

        // Verify state was modified
        const modifiedState = useAppStore.getState();
        expect(modifiedState.activeApi).not.toBe('summarizer');
        expect(modifiedState.apiResult).not.toBeNull();

        // Reset
        act(() => {
          store.reset();
        });

        // Verify state was reset
        const resetState = useAppStore.getState();
        expect(resetState.activeApi).toBe('summarizer');
        expect(resetState.codeLanguage).toBe('ts');
        expect(resetState.apiResult).toBeNull();
        expect(resetState.isLoading).toBe(false);
        expect(resetState.aiCapabilities).toBeNull();
        expect(resetState.lastInputText).toBe('');
        expect(resetState.theme).toBe('system');
      });
    });
  });

  describe('Store Selectors', () => {
    describe('useActiveApi', () => {
      it('should return current active API', () => {
        const { result } = renderHook(() => useActiveApi());
        const store = useAppStore.getState();

        expect(result.current).toBe('summarizer');

        act(() => {
          store.setActiveApi('translator');
        });

        expect(result.current).toBe('translator');
      });
    });

    describe('useCodeLanguage', () => {
      it('should return current code language', () => {
        const { result } = renderHook(() => useCodeLanguage());
        const store = useAppStore.getState();

        expect(result.current).toBe('ts');

        act(() => {
          store.setCodeLanguage('js');
        });

        expect(result.current).toBe('js');
      });
    });

    describe('useApiResult', () => {
      it('should return current API result', () => {
        const { result } = renderHook(() => useApiResult());
        const store = useAppStore.getState();

        expect(result.current).toBeNull();

        const mockResult = createMockApiResult();
        act(() => {
          store.setApiResult(mockResult);
        });

        expect(result.current).toBeTruthy();
        expect(result.current!.data).toBe(mockResult.data);
      });
    });

    describe('useIsLoading', () => {
      it('should return current loading state', () => {
        const { result } = renderHook(() => useIsLoading());
        const store = useAppStore.getState();

        expect(result.current).toBe(false);

        act(() => {
          store.setLoading(true);
        });

        expect(result.current).toBe(true);
      });
    });

    describe('useAiCapabilities', () => {
      it('should return current AI capabilities', () => {
        const { result } = renderHook(() => useAiCapabilities());
        const store = useAppStore.getState();

        expect(result.current).toBeNull();

        const capabilities: AiCapabilities = {
          summarizer: 'available',
          translator: 'available',
          writer: 'unavailable',
          rewriter: 'loading',
          proofreader: 'unavailable',
          prompt: 'available',
          languageDetection: 'available'
        };

        act(() => {
          store.setAiCapabilities(capabilities);
        });

        expect(result.current).toEqual(capabilities);
      });
    });

    describe('useLastInputText', () => {
      it('should return current input text', () => {
        const { result } = renderHook(() => useLastInputText());
        const store = useAppStore.getState();

        expect(result.current).toBe('');

        act(() => {
          store.setLastInputText('test input');
        });

        expect(result.current).toBe('test input');
      });
    });

    describe('useTheme', () => {
      it('should return current theme', () => {
        const { result } = renderHook(() => useTheme());
        const store = useAppStore.getState();

        expect(result.current).toBe('system');

        act(() => {
          store.setTheme('dark');
        });

        expect(result.current).toBe('dark');
      });
    });
  });

  describe('Zod Schema Validation', () => {
    describe('ApiResultSchema', () => {
      it('should validate valid API results', () => {
        const validResults = [
          createMockApiResult(),
          createMockApiResult({ data: null, error: 'Test error' }),
          createMockApiResult({ latency: 0 }),
          createMockApiResult({ timestamp: Date.now() })
        ];

        validResults.forEach(result => {
          expect(() => ApiResultSchema.parse(result)).not.toThrow();
        });
      });

      it('should reject invalid API results', () => {
        const invalidResults = [
          { data: 'test' }, // missing error and latency
          { error: null }, // missing data and latency
          { data: null, error: null }, // missing latency
          { data: null, error: null, latency: -1 }, // negative latency
          { data: null, error: 123, latency: 100 }, // non-string error
          null,
          undefined,
          'string',
          123
        ];

        invalidResults.forEach(result => {
          expect(() => ApiResultSchema.parse(result)).toThrow();
        });
      });

      it('should handle optional timestamp field', () => {
        const withTimestamp = createMockApiResult({ timestamp: Date.now() });
        const withoutTimestamp = { data: 'test', error: null, latency: 100 };

        expect(() => ApiResultSchema.parse(withTimestamp)).not.toThrow();
        expect(() => ApiResultSchema.parse(withoutTimestamp)).not.toThrow();
      });
    });

    describe('AppStateSchema', () => {
      it('should validate valid app state', () => {
        const validState = {
          activeApi: 'summarizer',
          codeLanguage: 'ts' as CodeLanguage,
          apiResult: createMockApiResult(),
          isLoading: false,
          aiCapabilities: {
            summarizer: 'available' as const,
            translator: 'available' as const,
            writer: 'unavailable' as const,
            rewriter: 'loading' as const,
            proofreader: 'unavailable' as const,
            prompt: 'available' as const,
            languageDetection: 'available' as const
          },
          lastInputText: 'test',
          theme: 'system' as const
        };

        expect(() => AppStateSchema.parse(validState)).not.toThrow();
      });

      it('should validate state with null values', () => {
        const stateWithNulls = {
          activeApi: 'summarizer',
          codeLanguage: 'ts' as CodeLanguage,
          apiResult: null,
          isLoading: false,
          aiCapabilities: null,
          lastInputText: '',
          theme: 'system' as const
        };

        expect(() => AppStateSchema.parse(stateWithNulls)).not.toThrow();
      });

      it('should reject invalid app state', () => {
        const invalidStates = [
          { activeApi: 123 }, // non-string activeApi
          { codeLanguage: 'invalid' }, // invalid codeLanguage
          { isLoading: 'true' }, // non-boolean isLoading
          { theme: 'invalid' }, // invalid theme
          null,
          undefined,
          'string'
        ];

        invalidStates.forEach(state => {
          expect(() => AppStateSchema.parse(state)).toThrow();
        });
      });
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous actions', () => {
      const store = useAppStore.getState();

      // Simulate rapid concurrent actions
      act(() => {
        store.setActiveApi('translator');
        store.setCodeLanguage('js');
        store.setLoading(true);
        store.setLastInputText('concurrent test');
        store.setApiResult(createMockApiResult());
      });

      const finalState = useAppStore.getState();
      expect(finalState.activeApi).toBe('translator');
      expect(finalState.codeLanguage).toBe('js');
      expect(finalState.isLoading).toBe(false); // Should be false due to setApiResult
      expect(finalState.lastInputText).toBe('concurrent test');
      expect(finalState.apiResult).toBeTruthy();
    });

    it('should maintain consistency across multiple selector hooks', () => {
      const { result: activeApiResult } = renderHook(() => useActiveApi());
      const { result: loadingResult } = renderHook(() => useIsLoading());
      const { result: apiResultResult } = renderHook(() => useApiResult());

      const store = useAppStore.getState();

      act(() => {
        store.setActiveApi('writer');
        store.setLoading(true);
        store.setApiResult(createMockApiResult());
      });

      expect(activeApiResult.current).toBe('writer');
      expect(loadingResult.current).toBe(false); // Auto-set by setApiResult
      expect(apiResultResult.current).toBeTruthy();
    });
  });
});