/**
 * Chrome AI Prompt Service
 *
 * Low-level service for interacting with Chrome's built-in LanguageModel API.
 * Handles API detection, instance creation, prompting, and error handling.
 *
 * @module prompt/services/ChromeAIPromptService
 */

import type {
  LanguageModel,
  LanguageModelAPI,
  LanguageModelCreateOptions,
  LanguageModelAvailability,
  PromptOptions,
  AvailabilityCheckResult,
  LanguageModelCapabilities,
  LanguageModelParameterBounds,
  DownloadProgress,
  SupportedLanguageCode,
  ExpectedInput,
  ExpectedOutput,
  APIMessage,
  MultimodalContent,
} from '../types';
import { SUPPORTED_OUTPUT_LANGUAGES } from '../types';
import { normalizeAvailability } from '../../shared/utils/normalizeAvailability';
import { ALLOWED_SYSTEM_PROMPTS } from '@/features/unified-playground/shared/utils/promptConstruction';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract root error message from potentially nested errors
 */
function extractErrorMessage(error: any): string {
  if (!error) return 'Unknown error';

  const message = error.message || String(error);

  // Extract the deepest error message from nested "Failed to execute" messages
  const match = message.match(/Failed to execute[^:]*:\s*(.+)/);
  if (match) {
    return extractErrorMessage({ message: match[1] });
  }

  return message;
}

/**
 * Create user-friendly error message
 */
function getUserFriendlyError(error: any): string {
  const errorName = error?.name || '';
  const errorMessage = extractErrorMessage(error).toLowerCase();

  // Handle specific error types
  if (errorName === 'AbortError' || errorMessage.includes('abort')) {
    if (errorMessage.includes('without reason')) {
      return 'Operation was stopped. This can happen if the browser is busy or if you navigated away. Please try again.';
    }
    return 'Operation was cancelled.';
  }

  if (
    errorName === 'QuotaExceededError' ||
    errorMessage.includes('quota') ||
    errorMessage.includes('limit')
  ) {
    return 'Token limit exceeded. Please start a new conversation or shorten your prompt.';
  }

  if (errorMessage.includes('user activation')) {
    return 'Please click a button to start. The Prompt API requires user interaction.';
  }

  if (errorMessage.includes('download') || errorMessage.includes('model')) {
    return 'AI model download required (~22GB). This is a one-time process. Please ensure stable internet connection.';
  }

  // Check for multimodal-specific errors (must come before generic "not available")
  if (
    errorMessage.includes('multimodal') ||
    errorMessage.includes('expectedinputs') ||
    errorMessage.includes('expected inputs') ||
    errorMessage.includes('image input') ||
    (errorMessage.includes('not supported') && errorMessage.includes('input'))
  ) {
    return 'Multimodal (image) input is not available. Text-only mode is active. The basic Prompt API works, but image support requires additional Chrome flags. Enable chrome://flags#prompt-api-for-gemini-nano-multimodal-input and restart Chrome to use images.';
  }

  if (
    errorMessage.includes('not available') ||
    errorMessage.includes('not supported')
  ) {
    return 'Prompt API is not available. Please enable it in chrome://flags#prompt-api-for-gemini-nano-multimodal-input';
  }

  if (
    errorMessage.includes('language') ||
    errorMessage.includes('supported language codes')
  ) {
    return 'Only English (en), Spanish (es), and Japanese (ja) are currently supported. Chrome Prompt API has limited language support.';
  }

  if (
    errorMessage.includes('streaming') &&
    errorMessage.includes('not supported')
  ) {
    return 'Streaming is not supported by this model instance.';
  }

  // Return cleaned error message
  return extractErrorMessage(error);
}

// ============================================================================
// Service
// ============================================================================

/**
 * Chrome AI Prompt Service
 *
 * Provides low-level access to Chrome's LanguageModel API with proper
 * error handling, availability checking, and streaming support.
 */
export class ChromeAIPromptService {
  // ============================================================================
  // API Detection and Availability
  // ============================================================================

  /**
   * Check if LanguageModel API is supported
   * @returns true if API is available in this browser
   */
  static isSupported(): boolean {
    const supported =
      typeof window !== 'undefined' && 'LanguageModel' in window;
    return supported;
  }

  /**
   * Get LanguageModel API
   * @returns LanguageModelAPI instance
   * @throws Error if API is not supported
   */
  static getAPI(): LanguageModelAPI {
    if (!this.isSupported()) {
      throw new Error(
        'LanguageModel API is not supported in this browser. ' +
          'Requires Chrome 138+ (Dev/Canary) with Prompt API enabled via chrome://flags#prompt-api-for-gemini-nano-multimodal-input',
      );
    }

    return (window as any).LanguageModel as LanguageModelAPI;
  }

  /**
   * Validate if language codes are supported by Chrome's Prompt API
   * Chrome only supports: en (English), es (Spanish), ja (Japanese)
   * @param languages - Array of language codes to validate
   * @returns Validation result with supported/unsupported languages
   */
  static validateLanguages(languages: string[]): {
    valid: boolean;
    supported: string[];
    unsupported: string[];
  } {
    const supported: string[] = [];
    const unsupported: string[] = [];

    languages.forEach((lang) => {
      if (SUPPORTED_OUTPUT_LANGUAGES.includes(lang as SupportedLanguageCode)) {
        supported.push(lang);
      } else {
        unsupported.push(lang);
      }
    });

    return {
      valid: unsupported.length === 0,
      supported,
      unsupported,
    };
  }

  /**
   * Check LanguageModel availability
   * @returns Promise resolving to availability status
   */
  static async checkAvailability(): Promise<LanguageModelAvailability> {
    try {
      if (!this.isSupported()) {
        return 'no';
      }

      const api = this.getAPI();
      const status = await api.availability();
      // Normalize Chrome API status to internal AvailabilityStatus
      const normalized = normalizeAvailability(status);
      return normalized;
    } catch {
      // Silently handle error - API not available
      return 'no';
    }
  }

  /**
   * Check if multimodal input (images) is supported
   * @returns Promise resolving to availability status
   */
  static async checkMultimodalAvailability(): Promise<LanguageModelAvailability> {
    try {
      if (!this.isSupported()) {
        return 'no';
      }

      const api = this.getAPI();
      const status = await api.availability({
        expectedInputs: [{ type: 'image' }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
      });

      // Normalize Chrome API status to internal AvailabilityStatus
      return normalizeAvailability(status);
    } catch (error) {
      console.warn('Multimodal availability check failed:', error);
      return 'no';
    }
  }

  /**
   * Check if specific language output is supported
   * Validates languages before checking to prevent Chrome API errors
   * Chrome only supports: en (English), es (Spanish), ja (Japanese)
   * @param languages - Array of ISO language codes to check
   * @returns Promise with availability status and validation details
   */
  static async checkLanguageAvailability(languages: string[]): Promise<{
    availability: LanguageModelAvailability;
    validation: ReturnType<typeof ChromeAIPromptService.validateLanguages>;
  }> {
    // Validate languages first to prevent API errors
    const validation = this.validateLanguages(languages);

    // If no valid languages, return 'no' immediately
    if (validation.supported.length === 0) {
      return {
        availability: 'no',
        validation,
      };
    }

    try {
      if (!this.isSupported()) {
        return { availability: 'no', validation };
      }

      const api = this.getAPI();
      // Only pass supported languages to avoid Chrome API error
      const status = await api.availability({
        expectedOutputs: [
          {
            type: 'text',
            languages: validation.supported as SupportedLanguageCode[],
          },
        ],
      });

      return {
        availability: normalizeAvailability(status),
        validation,
      };
    } catch (error) {
      console.warn('Language availability check failed:', error);
      return { availability: 'no', validation };
    }
  }

  /**
   * Check availability with specific configuration parameters
   * More accurate than checkAvailability() - validates the exact parameters you plan to use
   *
   * This prevents false positives by checking availability with the SAME parameters
   * you'll use for create(). Recommended pattern:
   *
   * @example
   * const config = {
   *   topK: 1,
   *   temperature: 0,
   *   expectedInputs: [{ type: 'image' }],
   *   expectedOutputs: [{ type: 'text', languages: ['en'] }],
   * };
   *
   * // Check with exact config
   * const availability = await ChromeAIPromptService.checkAvailabilityWithConfig(config);
   *
   * // If available, create with SAME config
   * if (availability === 'available') {
   *   const instance = await ChromeAIPromptService.createInstance(config);
   * }
   *
   * @param options - The same configuration you plan to use for create()
   * @returns Promise resolving to availability status
   */
  static async checkAvailabilityWithConfig(
    options: LanguageModelCreateOptions,
  ): Promise<LanguageModelAvailability> {
    try {
      if (!this.isSupported()) {
        return 'no';
      }

      const api = this.getAPI();

      // Build availability check options from create options
      // Only pass parameters that are relevant to availability checking
      const checkOptions: {
        topK?: number;
        temperature?: number;
        expectedInputs?: ExpectedInput[];
        expectedOutputs?: ExpectedOutput[];
      } = {};

      // Pass topK if specified
      if (options.topK !== undefined) {
        checkOptions.topK = options.topK;
      }

      // Pass temperature if specified
      if (options.temperature !== undefined) {
        checkOptions.temperature = options.temperature;
      }

      // Pass expectedInputs if specified
      if (options.expectedInputs && options.expectedInputs.length > 0) {
        checkOptions.expectedInputs = options.expectedInputs;
      }

      // Pass expectedOutputs if specified
      if (options.expectedOutputs && options.expectedOutputs.length > 0) {
        checkOptions.expectedOutputs = options.expectedOutputs;
      }

      console.log(
        '[ChromeAIPromptService] Checking availability with config:',
        checkOptions,
      );

      // Check availability with the exact parameters
      const status = await api.availability(checkOptions);
      const normalized = normalizeAvailability(status);

      console.log(
        '[ChromeAIPromptService] Availability check result:',
        normalized,
      );

      return normalized;
    } catch (error) {
      console.warn(
        '[ChromeAIPromptService] Availability check with config failed:',
        error,
      );
      return 'no';
    }
  }

  /**
   * Check detailed availability information
   * @returns Promise resolving to detailed availability info
   */
  static async checkDetailedAvailability(): Promise<AvailabilityCheckResult> {
    try {
      const availability = await this.checkAvailability();

      return {
        availability,
        isSupported: true,
        requiresDownload: availability === 'after-download',
        requirements: {
          minChromeVersion: 138,
          requiredFlags: ['prompt-api-for-gemini-nano-multimodal-input'],
          storageRequired: '~22GB (Gemini Nano model)',
          ramRequired: '4GB minimum (8GB+ recommended)',
          networkRequired: true,
          other: [
            'User activation may be required for instance creation',
            'Model download may be required on first use',
            'Multimodal support varies by Chrome version',
          ],
        },
      };
    } catch (error) {
      return {
        availability: 'no',
        isSupported: false,
        requiresDownload: false,
        requirements: {
          minChromeVersion: 138,
          requiredFlags: ['prompt-api-for-gemini-nano-multimodal-input'],
          storageRequired: '~22GB',
          ramRequired: '4GB+',
          networkRequired: true,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get API capabilities (if supported)
   * @returns Promise resolving to capabilities or null
   */
  static async getCapabilities(): Promise<LanguageModelCapabilities | null> {
    try {
      if (!this.isSupported()) {
        return null;
      }

      const api = this.getAPI();

      if (!api.capabilities) {
        // Return default capabilities if API doesn't provide them
        return {
          supportsStreaming: true,
          supportsTokenCounting: true,
          supportsCloning: true,
          maxTemperature: 2.0,
          maxTopK: 128,
          maxTokens: 4096,
        };
      }

      return await api.capabilities();
    } catch {
      return null;
    }
  }

  /**
   * Get parameter bounds for validation and UI controls
   *
   * Retrieves minimum, maximum, and default values for all configurable parameters.
   * Uses API capabilities() for max values with sensible fallbacks.
   *
   * @returns Promise resolving to parameter bounds with min/max/default values
   *
   * @example
   * ```typescript
   * const bounds = await ChromeAIPromptService.getParameterBounds();
   * // Use for validation
   * if (temp < bounds.temperature.min || temp > bounds.temperature.max) {
   *   throw new Error('Invalid temperature');
   * }
   * // Use for UI controls
   * <Slider min={bounds.topK.min} max={bounds.topK.max} defaultValue={bounds.topK.default} />
   * ```
   */
  static async getParameterBounds(): Promise<LanguageModelParameterBounds> {
    const capabilities = await this.getCapabilities();

    return {
      temperature: {
        min: 0,
        max: capabilities?.maxTemperature ?? 2.0,
        default: 0.8,
      },
      topK: {
        min: 1,
        max: capabilities?.maxTopK ?? 128,
        default: 8,
      },
      maxTokens: {
        min: 1,
        max: capabilities?.maxTokens ?? 4096,
        default: 2048,
      },
    };
  }

  // ============================================================================
  // Instance Creation
  // ============================================================================

  /**
   * Build Chrome API options from application config
   * Filters out application-level parameters that Chrome API doesn't accept
   * and converts systemPromptId to initialPrompts format
   *
   * @param appConfig - Application configuration with both Chrome API and app-level params
   * @returns Sanitized options object containing only valid Chrome API parameters
   */
  private static buildChromeAPIOptions(
    appConfig: any,
  ): LanguageModelCreateOptions {
    const chromeOptions: any = {
      expectedInputs: [{ type: 'image' }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }],
    };

    // Sampling parameters (Chrome API)
    if (appConfig.temperature !== undefined) {
      chromeOptions.temperature = appConfig.temperature;
    }
    if (appConfig.topK !== undefined) {
      chromeOptions.topK = appConfig.topK;
    }

    // System prompt (Chrome API)
    if (appConfig.systemPrompt !== undefined) {
      chromeOptions.systemPrompt = appConfig.systemPrompt;
    }

    // Token limit (Chrome API)
    if (appConfig.maxTokens !== undefined) {
      chromeOptions.maxTokens = appConfig.maxTokens;
    }

    // Multimodal configuration (Chrome API)
    if (appConfig.expectedInputs !== undefined) {
      chromeOptions.expectedInputs = appConfig.expectedInputs;
    }
    if (appConfig.expectedOutputs !== undefined) {
      chromeOptions.expectedOutputs = appConfig.expectedOutputs;
    }

    // Control parameters (Chrome API)
    if (appConfig.signal !== undefined) {
      chromeOptions.signal = appConfig.signal;
    }
    if (appConfig.monitor !== undefined) {
      chromeOptions.monitor = appConfig.monitor;
    }

    // Advanced features (Chrome API)
    if (appConfig.tools !== undefined) {
      chromeOptions.tools = appConfig.tools;
    }

    // Convert systemPromptId to initialPrompts (Chrome API format)
    if (appConfig.systemPromptId) {
      // Validate systemPromptId before accessing
      const allowedIds = Object.keys(ALLOWED_SYSTEM_PROMPTS);
      if (!allowedIds.includes(appConfig.systemPromptId)) {
        console.warn(
          `[ChromeAIPromptService] Invalid systemPromptId: ${appConfig.systemPromptId}. Using default.`,
        );
      } else {
        const systemPromptConfig =
          ALLOWED_SYSTEM_PROMPTS[
            appConfig.systemPromptId as keyof typeof ALLOWED_SYSTEM_PROMPTS
          ];
        if (systemPromptConfig?.prompt) {
          chromeOptions.initialPrompts = [
            {
              role: 'system',
              content: systemPromptConfig.prompt,
            },
          ];
        }
      }
    }

    // If initialPrompts already provided, use it (takes precedence)
    if (appConfig.initialPrompts !== undefined) {
      chromeOptions.initialPrompts = appConfig.initialPrompts;
    }

    // Application-level parameters that should NOT be passed to Chrome API:
    // - enableStreaming, enableAutoSave, enableHistory, maxHistoryLength,
    // - enableMarkdown, enableCodeHighlight, systemPromptId
    // These are intentionally filtered out

    console.log(
      '[ChromeAIPromptService] Filtered app config → Chrome API options:',
      {
        input: appConfig,
        output: chromeOptions,
      },
    );

    return chromeOptions;
  }

  /**
   * Create LanguageModel instance
   * @param options - Creation options
   * @returns Promise resolving to LanguageModel instance
   * @throws Error if creation fails
   */
  static async createInstance(
    options?: LanguageModelCreateOptions,
  ): Promise<LanguageModel> {
    try {
      if (!this.isSupported()) {
        const error = new Error(
          'LanguageModel API is not supported in this browser. ' +
            'Please use Chrome 138+ (Dev/Canary) and enable the API in chrome://flags#prompt-api-for-gemini-nano-multimodal-input',
        );
        throw error;
      }

      // Check user activation before attempting creation
      if (typeof navigator !== 'undefined' && 'userActivation' in navigator) {
        const userActivation = (navigator as any).userActivation;

        if (!userActivation?.isActive) {
          // User activation not active - may affect creation
        }
      }

      // Validate options before creating instance
      if (options) {
        this.validateOptions(options);
      }

      // Filter and sanitize options for Chrome API
      // If no options provided, create proper default config
      const chromeOptions: LanguageModelCreateOptions = options
        ? this.buildChromeAPIOptions(options)
        : {
            expectedInputs: [{ type: 'image' as const }],
            expectedOutputs: [{ type: 'text', languages: ['en'] }],
            temperature: 0.8,
            topK: 8,
          };

      const api = this.getAPI();
      console.log(
        '[ChromeAIPromptService] Creating LanguageModel instance with filtered Chrome API options:',
        chromeOptions,
      );

      // Create instance
      const instance: LanguageModel = await api.create(chromeOptions);

      // DETAILED DIAGNOSTICS: Log everything about the instance
      console.log(
        '[ChromeAIPromptService] ========== INSTANCE DIAGNOSTICS ==========',
      );
      console.log('[ChromeAIPromptService] Instance type:', typeof instance);
      console.log(
        '[ChromeAIPromptService] Instance constructor:',
        instance?.constructor?.name,
      );

      // Check each method individually
      console.log('[ChromeAIPromptService] Method checks:');
      console.log('  append:');
      console.log('    - "append" in instance:', 'append' in instance);
      console.log(
        '    - typeof instance.append:',
        typeof (instance as any).append,
      );
      console.log('    - instance.append:', (instance as any).append);

      console.log('  appendStreaming:');
      console.log(
        '    - "appendStreaming" in instance:',
        'appendStreaming' in instance,
      );
      console.log(
        '    - typeof instance.appendStreaming:',
        typeof (instance as any).appendStreaming,
      );
      console.log(
        '    - instance.appendStreaming:',
        (instance as any).appendStreaming,
      );

      // Log all properties
      console.log(
        '[ChromeAIPromptService] Own properties:',
        Object.getOwnPropertyNames(instance),
      );
      console.log('[ChromeAIPromptService] All keys:', Object.keys(instance));

      // Check prototype chain
      const proto = Object.getPrototypeOf(instance);
      console.log(
        '[ChromeAIPromptService] Prototype properties:',
        proto ? Object.getOwnPropertyNames(proto) : 'none',
      );

      // Final validation results
      console.log('[ChromeAIPromptService] Validation results:', {
        hasAppend:
          'append' in instance && typeof instance.append === 'function',
        hasAppendStreaming:
          'appendStreaming' in instance &&
          typeof instance.appendStreaming === 'function',
        hasPrompt:
          'prompt' in instance && typeof instance.prompt === 'function',
        hasPromptStreaming:
          'promptStreaming' in instance &&
          typeof instance.promptStreaming === 'function',
      });
      console.log(
        '[ChromeAIPromptService] =====================================',
      );

      // MANDATORY: Validate multimodal support (append method required)
      // appendStreaming is optional and will be checked below
      if (!('append' in instance) || typeof instance.append !== 'function') {
        // Clean up the invalid instance before throwing
        try {
          await (instance as LanguageModel).destroy();
          console.log(
            '[ChromeAIPromptService] Destroyed invalid instance without multimodal support',
          );
        } catch (cleanupError) {
          console.warn(
            '[ChromeAIPromptService] Failed to cleanup invalid instance:',
            cleanupError,
          );
        }

        throw new Error(
          'Multimodal support (append method) not available. ' +
            'This application requires Chrome 138+ with the flag ' +
            'chrome://flags#prompt-api-for-gemini-nano-multimodal-input enabled. ' +
            'Please enable the flag and restart Chrome.',
        );
      }

      // Check for appendStreaming and add polyfill if missing
      let hasMultimodalStreaming =
        'appendStreaming' in instance &&
        typeof instance.appendStreaming === 'function';

      if (!hasMultimodalStreaming) {
        console.warn(
          '[ChromeAIPromptService] ⚠️  appendStreaming not available natively. ' +
            'Adding polyfill wrapper around append().',
        );

        // Add appendStreaming polyfill that wraps append
        (instance as any).appendStreaming = async function* (messages: any) {
          console.log('[ChromeAIPromptService] Using appendStreaming polyfill');
          const result = await (this as any).append(messages);
          yield result;
        };

        hasMultimodalStreaming = true;
        console.log(
          '[ChromeAIPromptService] ✅ appendStreaming polyfill added',
        );
      }

      console.log(
        '[ChromeAIPromptService] ✅ Instance created with multimodal support',
        {
          append: true,
          appendStreaming: hasMultimodalStreaming,
        },
      );

      return instance;
    } catch (error: any) {
      const errorMessage = error?.message?.toLowerCase() || '';

      // Enhance error messages with user-friendly guidance
      if (errorMessage.includes('user activation')) {
        throw new Error(
          'The Prompt API requires a user interaction (like clicking a button). ' +
            'Please click a button to create a prompt session.',
        );
      }

      if (errorMessage.includes('download') || errorMessage.includes('model')) {
        throw new Error(
          'AI model download required. This is a one-time process that may take several minutes. ' +
            'The model is approximately 22GB. Please ensure you have a stable internet connection.',
        );
      }

      if (
        errorMessage.includes('not available') ||
        errorMessage.includes('not supported')
      ) {
        throw new Error(
          'Prompt API is not available. Please enable it in Chrome Settings: ' +
            'chrome://flags#prompt-api-for-gemini-nano-multimodal-input',
        );
      }

      if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        throw new Error(
          'Token limit exceeded. Please start a new conversation or reduce the prompt length.',
        );
      }

      // Re-throw with enhanced message
      throw new Error(
        `Failed to create LanguageModel: ${error?.message || 'Unknown error occurred'}`,
      );
    }
  }

  /**
   * Create LanguageModel instance with download monitoring
   * @param options - Creation options
   * @param onProgress - Progress callback (loaded, total) => void
   * @returns Promise resolving to LanguageModel instance
   */
  static async createInstanceWithMonitoring(
    options: LanguageModelCreateOptions,
    onProgress: (loaded: number, total: number) => void,
  ): Promise<LanguageModel> {
    console.log(
      '[ChromeAIPromptService] Creating instance with download monitoring',
      options,
    );
    const optionsWithMonitor: LanguageModelCreateOptions = {
      ...options,
      monitor: (m: EventTarget) => {
        m.addEventListener('downloadprogress', (e: Event) => {
          const event = e as unknown as { loaded: number; total: number };
          onProgress(event.loaded, event.total);
        });
      },
    };

    return this.createInstance(optionsWithMonitor);
  }

  // ============================================================================
  // Prompt Execution
  // ============================================================================

  /**
   * Execute a prompt (non-streaming)
   * @param instance - LanguageModel instance
   * @param prompt - User prompt text
   * @param options - Optional prompt options
   * @returns Promise resolving to response string
   */
  static async prompt(
    instance: LanguageModel,
    prompt: string,
    options?: PromptOptions,
  ): Promise<string> {
    try {
      const result = await instance.prompt(prompt, options);
      return result;
    } catch (error: any) {
      // Throw user-friendly error, preserving AbortError name and stack trace
      const friendlyMessage = getUserFriendlyError(error);
      const wrappedError = new Error(friendlyMessage, { cause: error });
      // Preserve AbortError name so retry logic can detect it
      if (error?.name === 'AbortError') {
        wrappedError.name = 'AbortError';
      }
      // Preserve stack trace from original error if available
      if (error?.stack) {
        wrappedError.stack = error.stack;
      }
      throw wrappedError;
    }
  }

  /**
   * Execute a prompt with streaming
   * @param instance - LanguageModel instance
   * @param prompt - User prompt text
   * @param options - Optional prompt options
   * @returns AsyncIterable of response chunks
   */
  static promptStreaming(
    instance: LanguageModel,
    prompt: string,
    options?: PromptOptions,
  ): AsyncIterable<string> {
    if (!instance.promptStreaming) {
      throw new Error('Streaming is not supported by this model instance.');
    }

    return instance.promptStreaming(prompt, options);
  }

  /**
   * Execute a prompt with streaming and process chunks via callback
   * @param instance - LanguageModel instance
   * @param prompt - User prompt text
   * @param onChunk - Callback for each chunk
   * @param options - Optional prompt options
   * @returns Promise resolving to complete response
   */
  static async promptStreamingWithCallback(
    instance: LanguageModel,
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: PromptOptions,
  ): Promise<string> {
    try {
      const stream = this.promptStreaming(instance, prompt, options);
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;
        onChunk(chunk);
      }

      return fullResponse;
    } catch (error: any) {
      // Throw user-friendly error, preserving AbortError name
      const friendlyMessage = getUserFriendlyError(error);
      const wrappedError = new Error(friendlyMessage);
      if (error?.name === 'AbortError') {
        wrappedError.name = 'AbortError';
      }
      throw wrappedError;
    }
  }

  /**
   * Execute a prompt with conversation array (Message[])
   * Supports both text-only and multimodal content in conversation format
   *
   * @param instance - LanguageModel instance
   * @param messages - Array of conversation messages
   * @param options - Optional prompt options
   * @returns Promise resolving to response string
   *
   * @example
   * // Text-only conversation
   * const response = await ChromeAIPromptService.promptWithConversation(instance, [
   *   { role: 'user', content: 'Hello!' },
   *   { role: 'assistant', content: 'Hi there!' },
   *   { role: 'user', content: 'Tell me about AI' }
   * ]);
   *
   * @example
   * // Multimodal conversation with images
   * const response = await ChromeAIPromptService.promptWithConversation(instance, [
   *   {
   *     role: 'user',
   *     content: [
   *       { type: 'text', value: 'What is in this image?' },
   *       { type: 'image', value: imageBlob }
   *     ]
   *   }
   * ]);
   */
  static async promptWithConversation(
    instance: LanguageModel,
    messages: APIMessage[],
    options?: PromptOptions,
  ): Promise<string> {
    try {
      // Chrome's LanguageModel.prompt() natively accepts Message[]
      const result = await instance.prompt(messages, options);
      return result;
    } catch (error: any) {
      // Throw user-friendly error, preserving AbortError name and stack trace
      const friendlyMessage = getUserFriendlyError(error);
      const wrappedError = new Error(friendlyMessage, { cause: error });
      // Preserve AbortError name so retry logic can detect it
      if (error?.name === 'AbortError') {
        wrappedError.name = 'AbortError';
      }
      // Preserve stack trace from original error if available
      if (error?.stack) {
        wrappedError.stack = error.stack;
      }
      throw wrappedError;
    }
  }

  /**
   * Execute a prompt with conversation array and streaming
   * Supports both text-only and multimodal content in conversation format
   *
   * @param instance - LanguageModel instance
   * @param messages - Array of conversation messages
   * @param options - Optional prompt options
   * @returns ReadableStream of response chunks
   *
   * @example
   * // Streaming text conversation
   * const stream = ChromeAIPromptService.promptStreamingWithConversation(instance, [
   *   { role: 'user', content: 'Tell me a story' }
   * ]);
   *
   * @example
   * // Streaming multimodal conversation
   * const stream = ChromeAIPromptService.promptStreamingWithConversation(instance, [
   *   {
   *     role: 'user',
   *     content: [
   *       { type: 'text', value: 'Describe this image in detail' },
   *       { type: 'image', value: imageBlob }
   *     ]
   *   }
   * ]);
   */
  static promptStreamingWithConversation(
    instance: LanguageModel,
    messages: APIMessage[],
    options?: PromptOptions,
  ): AsyncIterable<string> {
    if (!instance.promptStreaming) {
      throw new Error('Streaming is not supported by this model instance.');
    }

    // Chrome's LanguageModel.promptStreaming() natively accepts Message[]
    return instance.promptStreaming(messages, options);
  }

  /**
   * Execute a prompt with conversation array, streaming, and process chunks via callback
   *
   * @param instance - LanguageModel instance
   * @param messages - Array of conversation messages
   * @param onChunk - Callback for each chunk
   * @param options - Optional prompt options
   * @returns Promise resolving to complete response
   *
   * @example
   * const response = await ChromeAIPromptService.promptStreamingWithConversationCallback(
   *   instance,
   *   [{ role: 'user', content: 'Tell me a story' }],
   *   (chunk) => console.log('Received:', chunk)
   * );
   */
  static async promptStreamingWithConversationCallback(
    instance: LanguageModel,
    messages: APIMessage[],
    onChunk: (chunk: string) => void,
    options?: PromptOptions,
  ): Promise<string> {
    try {
      const stream = this.promptStreamingWithConversation(
        instance,
        messages,
        options,
      );
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;
        onChunk(chunk);
      }

      return fullResponse;
    } catch (error: any) {
      // Throw user-friendly error, preserving AbortError name
      const friendlyMessage = getUserFriendlyError(error);
      const wrappedError = new Error(friendlyMessage);
      if (error?.name === 'AbortError') {
        wrappedError.name = 'AbortError';
      }
      throw wrappedError;
    }
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  /**
   * Count tokens in a text
   * @param instance - LanguageModel instance
   * @param text - Text to count tokens for
   * @returns Promise resolving to token count, or null if not supported
   */
  static async countTokens(
    instance: LanguageModel,
    text: string,
  ): Promise<number | null> {
    try {
      if (instance.countPromptTokens) {
        return await instance.countPromptTokens(text);
      }
      return null;
    } catch {
      // Return null if token counting fails
      return null;
    }
  }

  /**
   * Get token usage information
   * @param instance - LanguageModel instance
   * @returns Token usage info or null if not supported
   */
  static getTokenUsage(instance: LanguageModel): {
    maxTokens: number;
    tokensSoFar: number;
    tokensLeft: number;
    inputQuota?: number;
    inputUsage?: number;
  } | null {
    try {
      if (
        instance.maxTokens !== undefined &&
        instance.tokensSoFar !== undefined &&
        instance.tokensLeft !== undefined
      ) {
        return {
          maxTokens: instance.maxTokens,
          tokensSoFar: instance.tokensSoFar,
          tokensLeft: instance.tokensLeft,
          inputQuota: instance.inputQuota,
          inputUsage: instance.inputUsage,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Measure actual input usage using Chrome AI API
   * @param instance - LanguageModel instance
   * @param input - String or message array to measure
   * @param signal - Optional AbortSignal for cancellation
   * @returns Promise resolving to token count, or null if not supported
   */
  static async measureInputUsage(
    instance: LanguageModel,
    input: string | Array<{ role: string; content: string }>,
    signal?: AbortSignal,
  ): Promise<number | null> {
    try {
      if (instance.measureInputUsage) {
        return await instance.measureInputUsage(input, { signal });
      }
      return null;
    } catch {
      // Return null if measurement fails or not supported
      return null;
    }
  }

  /**
   * Get current input usage (real-time tracking)
   * @param instance - LanguageModel instance
   * @returns Current input usage in tokens, or null if not available
   */
  static getInputUsage(instance: LanguageModel): number | null {
    try {
      return instance.inputUsage ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Get input quota (context window size)
   * @param instance - LanguageModel instance
   * @returns Input quota in tokens, or null if not available
   */
  static getInputQuota(instance: LanguageModel): number | null {
    try {
      return instance.inputQuota ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Add quota overflow event listener
   * @param instance - LanguageModel instance
   * @param callback - Callback function to handle overflow events
   * @returns true if listener was added successfully
   */
  static addQuotaOverflowListener(
    instance: LanguageModel,
    callback: (event: Event) => void,
  ): boolean {
    try {
      if (instance.addEventListener) {
        instance.addEventListener('quotaoverflow', callback);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Remove quota overflow event listener
   * @param instance - LanguageModel instance
   * @param callback - Callback function to remove
   * @returns true if listener was removed successfully
   */
  static removeQuotaOverflowListener(
    instance: LanguageModel,
    callback: (event: Event) => void,
  ): boolean {
    try {
      if (instance.removeEventListener) {
        instance.removeEventListener('quotaoverflow', callback);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Clone a LanguageModel session
   * @param instance - LanguageModel instance to clone
   * @returns Promise resolving to cloned instance, or null if not supported
   */
  static async clone(instance: LanguageModel): Promise<LanguageModel | null> {
    try {
      if (instance.clone) {
        return await instance.clone();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Destroy LanguageModel instance and free resources
   * @param instance - LanguageModel instance to destroy
   */
  static destroy(instance: LanguageModel): void {
    try {
      instance.destroy();
    } catch {
      // Silently fail - instance cleanup is not critical
      // Error bubbled if needed via error boundaries
    }
  }

  // ============================================================================
  // Multimodal Support (Images + Audio)
  // ============================================================================

  /**
   * Build multimodal message from text, images, and audio
   * @param text - User prompt text
   * @param images - Array of ImageData
   * @param audios - Optional array of AudioData
   * @returns Multimodal message in Chrome API format
   */
  static buildMultimodalMessage(
    text: string,
    images: any[], // ImageData[]
    audios?: any[], // AudioData[]
  ): any {
    // MultimodalContent
    const content: Array<{ type: string; value: string | Blob }> = [
      { type: 'text', value: text },
    ];

    // Add images
    for (const img of images) {
      content.push({
        type: 'image',
        value: img.file, // Use original File object
      });
    }

    // Add audio files
    if (audios) {
      for (const audio of audios) {
        content.push({
          type: 'audio',
          value: audio.file, // Use original File object
        });
      }
    }

    return {
      role: 'user',
      content,
    };
  }

  /**
   * Append multimodal message(s) to the conversation (non-streaming)
   * @param instance - LanguageModel instance
   * @param messages - Array of multimodal messages
   * @param options - Optional prompt options including AbortSignal
   * @returns Promise resolving to response string
   */
  static async appendMessage(
    instance: LanguageModel,
    messages: MultimodalContent[],
    options?: PromptOptions,
  ): Promise<string> {
    try {
      if (!('append' in instance) || typeof instance.append !== 'function') {
        throw new Error(
          'Multimodal append not supported. Session must be created with expectedInputs: [{type: "image"}, {type: "audio"}]',
        );
      }

      // Create a promise that rejects when aborted
      const abortPromise = new Promise<never>((_, reject) => {
        if (options?.signal) {
          if (options.signal.aborted) {
            const abortError = new Error('Operation aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          } else {
            options.signal.addEventListener('abort', () => {
              const abortError = new Error('Operation aborted');
              abortError.name = 'AbortError';
              reject(abortError);
            });
          }
        }
      });

      const result = options?.signal
        ? await Promise.race([instance.append(messages), abortPromise])
        : await instance.append(messages);
      return result;
    } catch (error: any) {
      // Throw user-friendly error, preserving AbortError name
      const friendlyMessage = getUserFriendlyError(error);
      const wrappedError = new Error(friendlyMessage);
      if (error?.name === 'AbortError') {
        wrappedError.name = 'AbortError';
      }
      throw wrappedError;
    }
  }

  /**
   * Append multimodal message(s) with streaming
   * @param instance - LanguageModel instance
   * @param messages - Array of multimodal messages
   * @param onChunk - Callback for each chunk
   * @param options - Optional prompt options including AbortSignal
   * @returns Promise resolving to complete response
   */
  static async appendMessageStreaming(
    instance: LanguageModel,
    messages: MultimodalContent[],
    onChunk: (chunk: string) => void,
    options?: PromptOptions,
  ): Promise<string> {
    try {
      if (
        !('appendStreaming' in instance) ||
        typeof instance.appendStreaming !== 'function'
      ) {
        throw new Error(
          'Multimodal streaming not supported. Session must be created with expectedInputs and support appendStreaming.',
        );
      }

      // Check if already aborted
      if (options?.signal?.aborted) {
        const abortError = new Error('Operation aborted');
        abortError.name = 'AbortError';
        throw abortError;
      }

      const stream = instance.appendStreaming(messages);
      let fullResponse = '';
      let isAborted = false;

      // Set up abort handler - don't throw from event handler
      const abortHandler = () => {
        isAborted = true;
      };

      // Register abort listener if signal provided
      if (options?.signal) {
        options.signal.addEventListener('abort', abortHandler);
      }

      try {
        for await (const chunk of stream) {
          // Check for abort between chunks
          if (isAborted || options?.signal?.aborted) {
            const abortError = new Error('Operation aborted');
            abortError.name = 'AbortError';
            throw abortError;
          }
          fullResponse += chunk;
          onChunk(chunk);
        }
      } finally {
        // Clean up abort listener - check if signal exists before removing
        if (options?.signal && abortHandler) {
          options.signal.removeEventListener('abort', abortHandler);
        }
      }

      return fullResponse;
    } catch (error: any) {
      console.error('Error in appendMessageStreaming:', error);
      // Throw user-friendly error, preserving AbortError name
      const friendlyMessage = getUserFriendlyError(error);
      const wrappedError = new Error(friendlyMessage);
      if (error?.name === 'AbortError') {
        wrappedError.name = 'AbortError';
      }
      throw wrappedError;
    }
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Validate LanguageModel configuration options
   * @param options - Options to validate
   * @returns true if valid
   * @throws Error if invalid
   */
  static validateOptions(options: LanguageModelCreateOptions): boolean {
    // Validate temperature
    if (options.temperature !== undefined) {
      if (
        typeof options.temperature !== 'number' ||
        !Number.isFinite(options.temperature) ||
        options.temperature < 0 ||
        options.temperature > 2
      ) {
        throw new Error(
          `Invalid temperature: ${options.temperature}. Must be a finite number between 0 and 2.`,
        );
      }
    }

    // Validate topK
    if (options.topK !== undefined) {
      if (
        typeof options.topK !== 'number' ||
        !Number.isFinite(options.topK) ||
        options.topK < 1 ||
        options.topK > 128 ||
        !Number.isInteger(options.topK)
      ) {
        throw new Error(
          `Invalid topK: ${options.topK}. Must be a finite integer between 1 and 128.`,
        );
      }
    }

    // Validate maxTokens
    if (options.maxTokens !== undefined) {
      if (
        typeof options.maxTokens !== 'number' ||
        !Number.isFinite(options.maxTokens) ||
        options.maxTokens < 1 ||
        options.maxTokens > 4096 ||
        !Number.isInteger(options.maxTokens)
      ) {
        throw new Error(
          `Invalid maxTokens: ${options.maxTokens}. Must be a finite integer between 1 and 4096.`,
        );
      }
    }

    // Validate systemPrompt
    if (options.systemPrompt !== undefined) {
      if (typeof options.systemPrompt !== 'string') {
        throw new Error('Invalid systemPrompt: must be a string.');
      }
    }

    return true;
  }

  /**
   * Validate prompt input
   * @param prompt - Prompt text to validate
   * @returns true if valid
   * @throws Error if invalid
   */
  static validatePrompt(prompt: string): boolean {
    if (typeof prompt !== 'string') {
      throw new Error('Prompt must be a string');
    }

    if (prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    if (prompt.length > 100000) {
      throw new Error(
        'Prompt is too long (max 100,000 characters). Please shorten your prompt.',
      );
    }

    return true;
  }

  // ============================================================================
  // Model Download Management
  // ============================================================================

  /**
   * Download LanguageModel with progress tracking
   *
   * Creates a LanguageModel instance which triggers the model download if needed.
   *
   * @param onProgress - Progress callback
   * @returns Promise that resolves when download completes
   */
  static async downloadModel(
    onProgress: (progress: DownloadProgress) => void,
  ): Promise<void> {
    const api = this.getAPI();

    if (!api) {
      throw new Error('LanguageModel API not available');
    }

    // Check availability first
    const rawAvailability = await api.availability();

    // Check if model is already available (handles both 'available' and legacy 'readily')
    if (
      rawAvailability === 'available' ||
      (rawAvailability as any) === 'readily'
    ) {
      // Model is already ready, just complete immediately
      onProgress({
        loaded: 22 * 1024 * 1024 * 1024, // 22GB
        total: 22 * 1024 * 1024 * 1024,
        percentage: 100,
        timeRemaining: 0,
      });
      return;
    }

    // Check if unavailable (handle both Chrome API and internal values)
    const availStr = String(rawAvailability);
    if (availStr === 'unavailable' || availStr === 'no') {
      throw new Error('LanguageModel API not available on this device');
    }

    // Check for user activation (required for model download)
    if (
      typeof navigator !== 'undefined' &&
      'userActivation' in navigator &&
      !(navigator as Navigator & { userActivation?: { isActive: boolean } })
        .userActivation?.isActive
    ) {
      throw new Error(
        'Model download requires user interaction (e.g., button click)',
      );
    }

    return new Promise((resolve, reject) => {
      const downloadStartTime = Date.now();
      let downloadedBytes = 0;

      // Create LanguageModel instance with monitor to track download
      const options: LanguageModelCreateOptions = {
        systemPrompt: 'You are a helpful and friendly assistant.',
        temperature: 0.7,
        topK: 8,
        monitor(m: EventTarget) {
          m.addEventListener('downloadprogress', (e: Event) => {
            const customEvent = e as { loaded?: number; total?: number };
            const loaded = customEvent.loaded || 0;
            const total = customEvent.total || 22 * 1024 * 1024 * 1024; // Default 22GB

            downloadedBytes = loaded;

            // Calculate download speed and time remaining
            const elapsed = Date.now() - downloadStartTime;
            const downloadSpeed = elapsed > 0 ? (loaded / elapsed) * 1000 : 0;
            const remaining = total - loaded;
            const timeRemaining =
              downloadSpeed > 0 ? Math.round(remaining / downloadSpeed) : 0;

            const progress: DownloadProgress = {
              loaded,
              total,
              percentage: (loaded / total) * 100,
              timeRemaining,
            };

            onProgress(progress);
          });
        },
      };

      // Create a timeout promise that rejects after 60 minutes (3600 seconds)
      // Model download is ~22GB and can take 30+ minutes on slower connections
      // Generous timeout ensures downloads don't fail on slow internet (e.g., <1 Mbps)
      const DOWNLOAD_TIMEOUT = 60 * 60 * 1000; // 60 minutes
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              'Model download timed out after 60 minutes. Please check your internet connection and try again. If the download started, it may still be running in the background - try refreshing the page.',
            ),
          );
        }, DOWNLOAD_TIMEOUT);
      });

      // Race between create and timeout
      Promise.race([api.create(options), timeoutPromise])
        .then((model: unknown) => {
          // Use setTimeout to ensure the final progress update is processed
          setTimeout(() => {
            // Download complete - model is ready
            onProgress({
              loaded: downloadedBytes || 22 * 1024 * 1024 * 1024,
              total: 22 * 1024 * 1024 * 1024,
              percentage: 100,
              timeRemaining: 0,
            });

            // Clean up the model instance
            if (model && typeof model === 'object' && 'destroy' in model) {
              (model as { destroy: () => void }).destroy();
            }

            resolve();
          }, 100);
        })
        .catch((error: unknown) => {
          if (error instanceof Error) {
            reject(
              new Error(
                `Model download failed: ${error.message || 'Unknown error'}`,
              ),
            );
          } else {
            reject(new Error('Model download failed: Unknown error'));
          }
        });
    });
  }

  /**
   * Check if system meets requirements
   *
   * @returns Requirements check results
   */
  static async checkSystemRequirements() {
    const userAgent = navigator.userAgent;
    const isChromeOrEdge = /Chrome|Edg/.test(userAgent);

    // Extract Chrome version
    let chromeVersion = 0;
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match?.[1]) {
      chromeVersion = parseInt(match[1], 10);
    }

    // Check storage (estimate only)
    let storageEstimate = null;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        storageEstimate = await navigator.storage.estimate();
      } catch (error) {
        console.warn('Could not estimate storage:', error);
      }
    }

    return {
      browser: {
        supported: isChromeOrEdge && chromeVersion >= 138,
        version: chromeVersion,
        requiredVersion: 138,
      },
      storage: storageEstimate
        ? {
            available: storageEstimate.quota
              ? storageEstimate.quota - (storageEstimate.usage || 0)
              : 0,
            required: 22 * 1024 * 1024 * 1024, // 22GB
            sufficient: true,
          }
        : null,
      online: navigator.onLine,
    };
  }

  // ============================================================================
  // Recommended Configurations
  // ============================================================================

  /**
   * Get recommended configuration for a specific use case
   * @param useCase - Type of use case
   * @returns Recommended configuration
   */
  static getRecommendedConfig(
    useCase: 'general' | 'creative' | 'precise' | 'code' | 'chat' | 'analysis',
  ): LanguageModelCreateOptions {
    const configs: Record<string, LanguageModelCreateOptions> = {
      general: {
        systemPrompt: 'You are a helpful and friendly assistant.',
        temperature: 0.7,
        topK: 8,
        maxTokens: 2048,
      },
      creative: {
        systemPrompt:
          'You are a creative AI assistant. Generate imaginative and engaging content.',
        temperature: 0.9,
        topK: 40,
        maxTokens: 4096,
      },
      precise: {
        systemPrompt:
          'You are a precise AI assistant. Provide accurate and concise information.',
        temperature: 0.3,
        topK: 5,
        maxTokens: 2048,
      },
      code: {
        systemPrompt:
          'You are an expert programming assistant. Provide clear, efficient code with explanations.',
        temperature: 0.3,
        topK: 5,
        maxTokens: 4096,
      },
      chat: {
        systemPrompt:
          'You are a helpful and friendly assistant. Be engaging in conversations.',
        temperature: 0.8,
        topK: 20,
        maxTokens: 2048,
      },
      analysis: {
        systemPrompt:
          'You are an analytical AI assistant. Provide thorough analysis and insights.',
        temperature: 0.5,
        topK: 10,
        maxTokens: 4096,
      },
    };

    return (
      configs[useCase] || {
        systemPrompt: 'You are a helpful and friendly assistant.',
        temperature: 0.7,
        topK: 8,
        maxTokens: 2048,
      }
    );
  }
}

// ============================================================================
// Export
// ============================================================================

export default ChromeAIPromptService;
