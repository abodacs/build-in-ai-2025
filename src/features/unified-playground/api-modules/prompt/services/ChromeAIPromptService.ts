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
} from '../types';

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
    return typeof window !== 'undefined' && 'LanguageModel' in window;
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
          'Requires Chrome 138+ (Dev/Canary) with Prompt API enabled via chrome://flags#prompt-api-for-gemini-nano',
      );
    }

    return (window as any).LanguageModel as LanguageModelAPI;
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

      return status;
    } catch {
      // Silently return 'no' on error - UI will handle messaging
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
          requiredFlags: ['prompt-api-for-gemini-nano'],
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
          requiredFlags: ['prompt-api-for-gemini-nano'],
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
          maxTemperature: 1.0,
          maxTopK: 50,
          maxTokens: 4096,
        };
      }

      return await api.capabilities();
    } catch {
      return null;
    }
  }

  // ============================================================================
  // Instance Creation
  // ============================================================================

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
        throw new Error(
          'LanguageModel API is not supported in this browser. ' +
            'Please use Chrome 138+ (Dev/Canary) and enable the API in chrome://flags#prompt-api-for-gemini-nano',
        );
      }

      // Validate options before creating instance
      if (options) {
        this.validateOptions(options);
      }

      const api = this.getAPI();
      const instance = await api.create(options);

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
            'chrome://flags#prompt-api-for-gemini-nano',
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
      if (error?.name === 'AbortError') {
        throw new Error('Prompt execution was cancelled');
      }

      if (error?.name === 'QuotaExceededError') {
        throw new Error(
          'Token limit exceeded. Please start a new conversation or shorten your prompt.',
        );
      }

      throw new Error(`Prompt failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Execute a prompt with streaming
   * @param instance - LanguageModel instance
   * @param prompt - User prompt text
   * @param options - Optional prompt options
   * @returns ReadableStream of response chunks
   */
  static promptStreaming(
    instance: LanguageModel,
    prompt: string,
    options?: PromptOptions,
  ): ReadableStream<string> {
    try {
      if (!instance.promptStreaming) {
        throw new Error(
          'Streaming is not supported by this LanguageModel instance',
        );
      }

      return instance.promptStreaming(prompt, options);
    } catch (error: any) {
      throw new Error(
        `Streaming prompt failed: ${error?.message || 'Unknown error'}`,
      );
    }
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
      const reader = stream.getReader();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          fullResponse += value;
          onChunk(value);
        }

        return fullResponse;
      } finally {
        reader.releaseLock();
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('Streaming was cancelled');
      }

      throw new Error(
        `Streaming prompt failed: ${error?.message || 'Unknown error'}`,
      );
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
        };
      }
      return null;
    } catch {
      return null;
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
        options.temperature < 0 ||
        options.temperature > 1
      ) {
        throw new Error(
          `Invalid temperature: ${options.temperature}. Must be a number between 0 and 1.`,
        );
      }
    }

    // Validate topK
    if (options.topK !== undefined) {
      if (
        typeof options.topK !== 'number' ||
        options.topK < 1 ||
        options.topK > 50 ||
        !Number.isInteger(options.topK)
      ) {
        throw new Error(
          `Invalid topK: ${options.topK}. Must be an integer between 1 and 50.`,
        );
      }
    }

    // Validate maxTokens
    if (options.maxTokens !== undefined) {
      if (
        typeof options.maxTokens !== 'number' ||
        options.maxTokens < 1 ||
        options.maxTokens > 4096 ||
        !Number.isInteger(options.maxTokens)
      ) {
        throw new Error(
          `Invalid maxTokens: ${options.maxTokens}. Must be an integer between 1 and 4096.`,
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
        systemPrompt: 'You are a helpful AI assistant.',
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
          'You are a friendly conversational AI assistant. Be helpful and engaging.',
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
        systemPrompt: 'You are a helpful AI assistant.',
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
