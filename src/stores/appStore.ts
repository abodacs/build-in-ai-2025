import { z } from 'zod';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Zod schemas for runtime validation
export const ApiResultSchema = z.object({
  data: z.any().nullable(),
  error: z.string().nullable(),
  latency: z.number(),
  timestamp: z.number().optional(),
});

export const AppStateSchema = z.object({
  activeApi: z.string(),
  codeLanguage: z.enum(['js', 'ts']),
  apiResult: ApiResultSchema.nullable(),
  isLoading: z.boolean(),
  aiCapabilities: z
    .object({
      summarizer: z.enum(['available', 'unavailable', 'loading']),
      translator: z.enum(['available', 'unavailable', 'loading']),
      writer: z.enum(['available', 'unavailable', 'loading']),
      rewriter: z.enum(['available', 'unavailable', 'loading']),
      proofreader: z.enum(['available', 'unavailable', 'loading']),
      prompt: z.enum(['available', 'unavailable', 'loading']),
      languageDetection: z.enum(['available', 'unavailable', 'loading']),
    })
    .nullable(),
  lastInputText: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

// TypeScript types derived from Zod schemas
export type AppState = z.infer<typeof AppStateSchema>;
export type ApiResult = z.infer<typeof ApiResultSchema>;
export type AiCapabilities = NonNullable<AppState['aiCapabilities']>;
export type CodeLanguage = AppState['codeLanguage'];

// Zustand store with actions
interface AppStore extends AppState {
  // Actions
  setActiveApi: (apiId: string) => void;
  setCodeLanguage: (lang: CodeLanguage) => void;
  setApiResult: (result: ApiResult) => void;
  setLoading: (loading: boolean) => void;
  setAiCapabilities: (capabilities: AiCapabilities) => void;
  setLastInputText: (text: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  clearApiResult: () => void;
  reset: () => void;
}

// Initial state
const initialState: AppState = {
  activeApi: 'summarizer',
  codeLanguage: 'ts',
  apiResult: null,
  isLoading: false,
  aiCapabilities: null,
  lastInputText: '',
  theme: 'system',
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set) => ({
      // Initial state
      ...initialState,

      // Actions with Zod validation
      setActiveApi: (apiId: string) => {
        set({ activeApi: apiId }, false, 'setActiveApi');
      },

      setCodeLanguage: (lang: CodeLanguage) => {
        set({ codeLanguage: lang }, false, 'setCodeLanguage');
      },

      setApiResult: (result: ApiResult) => {
        try {
          const validated = ApiResultSchema.parse({
            ...result,
            timestamp: Date.now(),
          });
          set(
            { apiResult: validated, isLoading: false },
            false,
            'setApiResult',
          );
        } catch (error) {
          console.error('Invalid API result:', error);
          set(
            {
              apiResult: {
                data: null,
                error: 'Invalid result format',
                latency: 0,
                timestamp: Date.now(),
              },
              isLoading: false,
            },
            false,
            'setApiResult:error',
          );
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading }, false, 'setLoading');
      },

      setAiCapabilities: (capabilities: AiCapabilities) => {
        set({ aiCapabilities: capabilities }, false, 'setAiCapabilities');
      },

      setLastInputText: (text: string) => {
        set({ lastInputText: text }, false, 'setLastInputText');
      },

      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme }, false, 'setTheme');
      },

      clearApiResult: () => {
        set({ apiResult: null }, false, 'clearApiResult');
      },

      reset: () => {
        set(initialState, false, 'reset');
      },
    }),
    {
      name: 'chrome-ai-devbench-store',
      version: 1,
    },
  ),
);

// Selectors for better performance
export const useActiveApi = () => useAppStore((state) => state.activeApi);
export const useCodeLanguage = () => useAppStore((state) => state.codeLanguage);
export const useApiResult = () => useAppStore((state) => state.apiResult);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useAiCapabilities = () =>
  useAppStore((state) => state.aiCapabilities);
export const useLastInputText = () =>
  useAppStore((state) => state.lastInputText);
export const useTheme = () => useAppStore((state) => state.theme);
