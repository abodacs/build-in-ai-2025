/**
 * Playground State Management Hook
 * Centralized state management for the unified playground with Zustand integration
 */

import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { isAiAvailable } from '@/lib/utils';
import { ChromeAICompatibility } from '../../api-modules/summarizer/services/ChromeAICompatibility';
import {
  TODO_TYPE,
  isSummarizerSupported,
  isTranslatorSupported,
  isWriterSupported,
  isRewriterSupported,
  isProofreaderSupported,
  isLanguageModelSupported,
  isLanguageDetectorSupported,
} from '../../../../types/global';

// ============================================================================
// Debug Configuration
// ============================================================================

const DEBUG_API_DETECTION = import.meta.env.DEV; // Only debug in development mode

/**
 * Debug logger utility for structured console output
 */
function debugLog(apiName: string, stage: string, data: unknown) {
  if (!DEBUG_API_DETECTION) return;

  const emoji = {
    start: '🔍',
    available: '✓',
    unavailable: '✗',
    loading: '⏳',
    error: '⚠️',
    summary: '📊',
  };

  const icon =
    emoji[stage as keyof typeof emoji] || emoji[data as keyof typeof emoji];
  console.log(`${icon} [${apiName}] ${stage}:`, data);
}

// ============================================================================
// Types
// ============================================================================

export interface AICapability {
  name: string;
  status: 'available' | 'unavailable' | 'loading' | 'error';
  lastChecked: number;
  error?: string;
}

export interface PlaygroundState {
  activeApi: string;
  isLoading: boolean;
  capabilities: Record<string, AICapability>;
  theme: 'light' | 'dark' | 'system';
  errors: string[];
}

// ============================================================================
// AI Capability Detection
// ============================================================================

const AI_APIS = [
  'summarizer',
  'translator',
  'writer',
  'rewriter',
  'proofreader',
  'prompt',
  'languageDetection',
] as const;

/**
 * Check depth options for API availability
 * - 'basic': Fast check, only verifies API class exists in globalThis (synchronous)
 * - 'availability': Full check, calls .availability() method for detailed status (asynchronous)
 *
 * @example
 * // Quick check for UI indicators
 * await checkAPIAvailability('summarizer', 'basic');
 *
 * // Full check before using API
 * await checkAPIAvailability('summarizer', 'availability');
 */
type CheckDepth = 'basic' | 'availability';

/**
 * Centralized API configuration for consistent checking
 */
const API_CONFIG: Record<
  string,
  {
    globalName: string;
    supportCheck: () => boolean;
    hasAvailabilityMethod: boolean;
  }
> = {
  summarizer: {
    globalName: 'Summarizer',
    supportCheck: isSummarizerSupported,
    hasAvailabilityMethod: true,
  },
  translator: {
    globalName: 'Translator',
    supportCheck: isTranslatorSupported,
    hasAvailabilityMethod: true,
  },
  writer: {
    globalName: 'Writer',
    supportCheck: isWriterSupported,
    hasAvailabilityMethod: true,
  },
  rewriter: {
    globalName: 'Rewriter',
    supportCheck: isRewriterSupported,
    hasAvailabilityMethod: true,
  },
  proofreader: {
    globalName: 'Proofreader',
    supportCheck: isProofreaderSupported,
    hasAvailabilityMethod: true,
  },
  prompt: {
    globalName: 'LanguageModel',
    supportCheck: isLanguageModelSupported,
    hasAvailabilityMethod: true,
  },
  languageDetection: {
    globalName: 'LanguageDetector',
    supportCheck: isLanguageDetectorSupported,
    hasAvailabilityMethod: true,
  },
};

/**
 * Normalize availability status across all Chrome AI APIs
 *
 * Chrome AI APIs return inconsistent status values:
 * - "readily" | "available" | "after-download" → normalized to "available"
 * - Any other value → normalized to "unavailable"
 *
 * The individual API playgrounds will handle model downloads when status is "after-download".
 * This function provides a consistent boolean-like status for UI display.
 *
 * @param rawStatus - The raw status string from Chrome AI API
 * @returns Normalized status: "available" or "unavailable"
 *
 * @example
 * normalizeAvailability('readily') // Returns: 'available'
 * normalizeAvailability('available') // Returns: 'available'
 * normalizeAvailability('after-download') // Returns: 'available'
 * normalizeAvailability('no') // Returns: 'unavailable'
 */
function normalizeAvailability(rawStatus: string): 'available' | 'unavailable' {
  if (
    rawStatus === 'readily' ||
    rawStatus === 'available' ||
    rawStatus === 'after-download' ||
    rawStatus === 'downloadable'
  ) {
    return 'available';
  }
  return 'unavailable';
}

/**
 * Check Chrome AI API availability with configurable depth
 *
 * Single source of truth for all API capability detection in the application.
 * Performs multi-stage verification:
 * 1. Check if Chrome AI is globally available (Chrome 138+)
 * 2. Check if specific API class exists in globalThis
 * 3. Optionally call .availability() method for detailed status
 *
 * @param apiName - The API to check (e.g., 'summarizer', 'translator')
 * @param depth - Check depth: 'basic' for existence only, 'availability' for full check
 * @returns Promise<AICapability> with status, error message, and timestamp
 *
 * @example
 * // Quick check
 * const status = await checkAPIAvailability('summarizer', 'basic');
 *
 * // Full check with availability() call
 * const status = await checkAPIAvailability('translator', 'availability');
 */
async function checkAPIAvailability(
  apiName: string,
  depth: CheckDepth = 'availability',
): Promise<AICapability> {
  const startTime = Date.now();

  if (DEBUG_API_DETECTION) {
    console.group(`🔍 API Detection: ${apiName}`);
    debugLog(apiName, 'start', { depth, timestamp: new Date().toISOString() });
  }

  try {
    // Check if Chrome AI APIs are available at all
    const chromeAiAvailable = isAiAvailable();
    debugLog(
      apiName,
      'Chrome AI Available',
      chromeAiAvailable ? '✓ Yes' : '✗ No',
    );

    if (!chromeAiAvailable) {
      debugLog(
        apiName,
        'error',
        'Chrome AI APIs not available. Requires Chrome 138+ with flags enabled.',
      );
      if (DEBUG_API_DETECTION) console.groupEnd();
      return {
        name: apiName,
        status: 'unavailable',
        lastChecked: startTime,
        error:
          'Chrome AI APIs not available. Requires Chrome 138+ with flags enabled.',
      };
    }

    console.log('hereherehereherehere', apiName);

    // Get API configuration
    const config = API_CONFIG[apiName];
    debugLog(
      apiName,
      'Config Found',
      config ? `✓ ${config.globalName}` : '✗ Unknown API',
    );

    if (!config) {
      if (DEBUG_API_DETECTION) console.groupEnd();
      return {
        name: apiName,
        status: 'unavailable',
        lastChecked: Date.now(),
        error: 'Unknown API',
      };
    }

    // Step 1: Basic check - Does the API class exist?
    const supportCheckResult = config.supportCheck();
    debugLog(
      apiName,
      'Support Check',
      supportCheckResult
        ? `✓ globalThis.${config.globalName} exists`
        : `✗ globalThis.${config.globalName} not found`,
    );

    if (!supportCheckResult) {
      debugLog(
        apiName,
        'unavailable',
        `Enable in chrome://flags/#optimization-guide-on-device-model`,
      );
      if (DEBUG_API_DETECTION) {
        console.groupEnd();
      }
      return {
        name: apiName,
        status: 'unavailable',
        lastChecked: Date.now(),
        error: `${config.globalName} API not available. Enable in chrome://flags`,
      };
    }

    // Step 2: If basic check only, return available
    if (depth === 'basic') {
      debugLog(apiName, 'available', 'Basic check passed (depth=basic)');
      if (DEBUG_API_DETECTION) {
        console.groupEnd();
      }
      return {
        name: apiName,
        status: 'available',
        lastChecked: Date.now(),
        error: undefined,
      };
    }

    // Step 3: Deep check - Call .availability() method if available
    if (config.hasAvailabilityMethod && depth === 'availability') {
      debugLog(apiName, 'loading', 'Calling .availability() method...');

      try {
        // Special handling for Summarizer (uses ChromeAICompatibility)
        if (apiName === 'summarizer') {
          const availability = await ChromeAICompatibility.checkAvailability();
          debugLog(apiName, 'Raw Availability Response', availability);

          const status = normalizeAvailability(availability);
          debugLog(apiName, 'Normalized Status', status);

          const duration = Date.now() - startTime;
          debugLog(apiName, 'Check Duration', `${duration}ms`);

          if (DEBUG_API_DETECTION) {
            console.groupEnd();
          }

          return {
            name: apiName,
            status,
            lastChecked: Date.now(),
            error:
              status === 'available'
                ? undefined
                : availability === 'after-download'
                  ? 'Model download required'
                  : 'Summarizer model not available',
          };
        }

        // Special handling for Translator (requires language pair params)
        if (apiName === 'translator') {
          const globalAPI = (globalThis as TODO_TYPE)[config.globalName];
          debugLog(
            apiName,
            'loading',
            'Calling Translator.availability({sourceLanguage: "en", targetLanguage: "es"})...',
          );

          const rawStatus = await globalAPI.availability({
            sourceLanguage: 'en',
            targetLanguage: 'es',
          });
          debugLog(apiName, 'Raw Availability Response', rawStatus);

          const status = normalizeAvailability(rawStatus);
          debugLog(apiName, 'Normalized Status', status);

          const duration = Date.now() - startTime;
          debugLog(apiName, 'Check Duration', `${duration}ms`);

          if (DEBUG_API_DETECTION) {
            console.groupEnd();
          }

          return {
            name: apiName,
            status,
            lastChecked: Date.now(),
            error:
              status === 'available'
                ? undefined
                : rawStatus === 'after-download'
                  ? 'Model download required'
                  : 'Translator model not available',
          };
        }
        // Special handling for Proofreader
        if (apiName === 'Proofreader') {
          const globalAPI = (globalThis as TODO_TYPE)[config.globalName];
          debugLog(
            apiName,
            'loading',
            'Calling Proofreader.availability({expectedInputLanguages: "en"})...',
          );

          const rawStatus = await globalAPI.availability({
            expectedInputLanguages: ['en'],
            outputLanguage: 'en',
          });
          debugLog(apiName, 'Raw Availability Response', rawStatus);

          const status = normalizeAvailability(rawStatus);
          debugLog(apiName, 'Normalized Status', status);

          const duration = Date.now() - startTime;
          debugLog(apiName, 'Check Duration', `${duration}ms`);

          if (DEBUG_API_DETECTION) {
            console.groupEnd();
          }

          return {
            name: apiName,
            status,
            lastChecked: Date.now(),
            error:
              status === 'available'
                ? undefined
                : rawStatus === 'after-download'
                  ? 'Model download required'
                  : 'Translator model not available',
          };
        }

        // Standard availability check for other APIs
        const globalAPI = (globalThis as TODO_TYPE)[config.globalName];
        debugLog(
          apiName,
          'Global API Check',
          globalAPI
            ? `✓ globalThis.${config.globalName} exists`
            : `✗ globalThis.${config.globalName} not found`,
        );
        debugLog(
          apiName,
          'Availability Method',
          typeof globalAPI?.availability === 'function'
            ? '✓ .availability() method exists'
            : '✗ .availability() method not found',
        );

        if (globalAPI && typeof globalAPI.availability === 'function') {
          debugLog(
            apiName,
            'loading',
            `Calling ${config.globalName}.availability()...`,
          );

          const rawStatus = await globalAPI.availability();
          debugLog(apiName, 'Raw Availability Response', rawStatus);

          const status = normalizeAvailability(rawStatus);
          debugLog(apiName, 'Normalized Status', status);

          const duration = Date.now() - startTime;
          debugLog(apiName, 'Check Duration', `${duration}ms`);

          if (DEBUG_API_DETECTION) {
            console.groupEnd();
          }

          return {
            name: apiName,
            status,
            lastChecked: Date.now(),
            error:
              status === 'available'
                ? undefined
                : rawStatus === 'after-download'
                  ? 'Model download required'
                  : `${config.globalName} model not available`,
          };
        }

        // Fallback: If availability() not found, assume available if class exists
        debugLog(
          apiName,
          'available',
          'Fallback: Class exists but no .availability() method',
        );

        if (DEBUG_API_DETECTION) {
          console.groupEnd();
        }

        return {
          name: apiName,
          status: 'available',
          lastChecked: Date.now(),
          error: undefined,
        };
      } catch (error) {
        debugLog(
          apiName,
          'error',
          `Failed to check availability: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );

        if (DEBUG_API_DETECTION) {
          console.groupEnd();
        }

        return {
          name: apiName,
          status: 'unavailable',
          lastChecked: Date.now(),
          error: `Failed to check ${config.globalName} availability: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    // Default: API exists but no deep check performed
    debugLog(apiName, 'available', 'No deep check required');

    if (DEBUG_API_DETECTION) {
      console.groupEnd();
    }

    return {
      name: apiName,
      status: 'available',
      lastChecked: Date.now(),
      error: undefined,
    };
  } catch (error) {
    debugLog(
      apiName,
      'error',
      error instanceof Error ? error.message : 'Unknown error occurred',
    );

    if (DEBUG_API_DETECTION) {
      console.groupEnd();
    }

    return {
      name: apiName,
      status: 'error',
      lastChecked: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Legacy alias for backwards compatibility
async function checkAICapability(apiName: string): Promise<AICapability> {
  return checkAPIAvailability(apiName, 'availability');
}

// ============================================================================
// Main Hook
// ============================================================================

export function usePlaygroundState() {
  // Zustand store integration
  const activeApi = useAppStore((state) => state.activeApi);
  const setActiveApi = useAppStore((state) => state.setActiveApi);
  const isLoading = useAppStore((state) => state.isLoading);
  const setIsLoading = useAppStore((state) => state.setLoading);

  // Local state for capabilities and errors
  const [capabilities, setCapabilities] = useState<
    Record<string, AICapability>
  >({});
  const [errors, setErrors] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // ============================================================================
  // Capability Detection
  // ============================================================================

  const checkAllCapabilities = useCallback(async () => {
    setIsLoading(true);
    setErrors([]);

    if (DEBUG_API_DETECTION) {
      console.group('📊 API Detection Summary - Starting...');
    }

    try {
      const capabilityChecks = AI_APIS.map((apiName) =>
        checkAICapability(apiName),
      );
      const results = await Promise.allSettled(capabilityChecks);
      console.log('capabilityChecks:::results', results);

      const newCapabilities: Record<string, AICapability> = {};
      const newErrors: string[] = [];

      results.forEach((result, index) => {
        const apiName = AI_APIS[index];
        if (!apiName) return;

        if (result.status === 'fulfilled') {
          newCapabilities[apiName] = result.value;
          if (result.value.error) {
            newErrors.push(`${apiName}: ${result.value.error}`);
          }
        } else {
          newCapabilities[apiName] = {
            name: apiName,
            status: 'error',
            lastChecked: Date.now(),
            error: result.reason?.message || 'Failed to check capability',
          };
          newErrors.push(`${apiName}: Failed to check capability`);
        }
      });

      // Log summary table
      if (DEBUG_API_DETECTION) {
        console.groupEnd();
        console.group('📊 API Detection Summary - Results');

        const tableData = AI_APIS.map((apiName) => {
          const cap = newCapabilities[apiName];
          const config = API_CONFIG[apiName];

          return {
            API: apiName,
            'Global Name': config?.globalName || 'Unknown',
            Status: cap?.status ?? 'unknown',
            Error: cap?.error || 'None',
          };
        });

        console.table(tableData);

        const availableCount = Object.values(newCapabilities).filter(
          (cap) => cap.status === 'available',
        ).length;

        console.log(`✓ Available: ${availableCount}/${AI_APIS.length}`);
        console.log(
          `✗ Unavailable: ${AI_APIS.length - availableCount}/${AI_APIS.length}`,
        );
        console.groupEnd();
      }

      setCapabilities(newCapabilities);
      setErrors(newErrors);
      setIsInitialized(true);
    } catch {
      setErrors(['Failed to initialize AI capabilities']);
      if (DEBUG_API_DETECTION) {
        console.groupEnd();
      }
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  // ============================================================================
  // API Management
  // ============================================================================

  const switchToApi = useCallback(
    (apiName: string) => {
      const capability = capabilities[apiName];

      if (!capability) {
        setErrors((prev) => [...prev, `API ${apiName} not found`]);
        return false;
      }

      if (capability.status !== 'available') {
        setErrors((prev) => [
          ...prev,
          `API ${apiName} is not available: ${capability.error || 'Unknown error'}`,
        ]);
        return false;
      }

      setActiveApi(apiName);
      setErrors((prev) => prev.filter((e) => !e.includes(apiName)));
      return true;
    },
    [capabilities, setActiveApi],
  );

  const retryCapabilityCheck = useCallback(async (apiName: string) => {
    setCapabilities((prev) => {
      const currentCap = prev[apiName];
      return {
        ...prev,
        [apiName]: {
          name: apiName,
          status: 'loading',
          lastChecked: Date.now(),
          ...currentCap,
        },
      };
    });

    try {
      const result = await checkAICapability(apiName);
      setCapabilities((prev) => ({
        ...prev,
        [apiName]: result,
      }));

      if (result.error) {
        setErrors((prev) =>
          prev
            .filter((e) => !e.includes(apiName))
            .concat(`${apiName}: ${result.error}`),
        );
      } else {
        setErrors((prev) => prev.filter((e) => !e.includes(apiName)));
      }
    } catch (error) {
      setCapabilities((prev) => {
        const currentCap = prev[apiName];
        return {
          ...prev,
          [apiName]: {
            name: apiName,
            status: 'error',
            lastChecked: Date.now(),
            error: error instanceof Error ? error.message : 'Unknown error',
            ...currentCap,
          },
        };
      });
    }
  }, []);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const getAvailableApis = useCallback(() => {
    return Object.values(capabilities).filter(
      (cap) => cap.status === 'available',
    );
  }, [capabilities]);

  const getApiStatus = useCallback(
    (apiName: string) => {
      return capabilities[apiName]?.status || 'unavailable';
    },
    [capabilities],
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const addError = useCallback((error: string) => {
    setErrors((prev) => [...prev, error]);
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  // Initialize capabilities on mount
  useEffect(() => {
    if (!isInitialized) {
      checkAllCapabilities();
    }
  }, [isInitialized, checkAllCapabilities]);

  // Periodically refresh capabilities (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(
      () => {
        checkAllCapabilities();
      },
      5 * 60 * 1000,
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [checkAllCapabilities]);

  // ============================================================================
  // Return State and Actions
  // ============================================================================

  return {
    // State
    activeApi,
    isLoading,
    capabilities,
    errors,
    isInitialized,

    // API Management
    switchToApi,
    retryCapabilityCheck,
    checkAllCapabilities,

    // Utilities
    getAvailableApis,
    getApiStatus,
    clearErrors,
    addError,

    // Computed values
    hasAvailableApis: getAvailableApis().length > 0,
    availableApiCount: getAvailableApis().length,
    totalApiCount: AI_APIS.length,
    hasErrors: errors.length > 0,
  };
}

// ============================================================================
// Utility Hook for Theme Management
// ============================================================================

export function usePlaygroundTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme =
      (localStorage.getItem('playground-theme') as
        | 'light'
        | 'dark'
        | 'system') || 'system';
    setTheme(savedTheme);

    const updateResolvedTheme = () => {
      if (savedTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
          .matches
          ? 'dark'
          : 'light';
        setResolvedTheme(systemTheme);
      } else {
        setResolvedTheme(savedTheme);
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateResolvedTheme);

    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, []);

  const updateTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('playground-theme', newTheme);

    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      setResolvedTheme(systemTheme);
    } else {
      root.classList.add(newTheme);
      setResolvedTheme(newTheme);
    }
  }, []);

  return {
    theme,
    resolvedTheme,
    updateTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  };
}
