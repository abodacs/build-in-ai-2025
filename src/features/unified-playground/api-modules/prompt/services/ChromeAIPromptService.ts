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
  DownloadProgress,
} from '../types';
import { normalizeAvailability } from '../../shared/utils/normalizeAvailability';

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

  if (
    errorMessage.includes('not available') ||
    errorMessage.includes('not supported')
  ) {
    return 'Prompt API is not available. Please enable it in chrome://flags#prompt-api-for-gemini-nano-multimodal-input';
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
          'Requires Chrome 138+ (Dev/Canary) with Prompt API enabled via chrome://flags#prompt-api-for-gemini-nano-multimodal-input',
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

      // Normalize Chrome API status to internal AvailabilityStatus
      return normalizeAvailability(status);
    } catch {
      // Silently return 'no' on error - UI will handle messaging
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
      });

      // Normalize Chrome API status to internal AvailabilityStatus
      return normalizeAvailability(status);
    } catch (error) {
      console.warn('Multimodal availability check failed:', error);
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
      console.log('Creating LanguageModel instance with options:', options);
      if (!this.isSupported()) {
        throw new Error(
          'LanguageModel API is not supported in this browser. ' +
            'Please use Chrome 138+ (Dev/Canary) and enable the API in chrome://flags#prompt-api-for-gemini-nano-multimodal-input',
        );
      }

      // Validate options before creating instance
      if (options) {
        this.validateOptions(options);
      }
      console.log('Options validated successfully.');

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
      // Throw user-friendly error without wrapping
      throw new Error(getUserFriendlyError(error));
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
      // Throw user-friendly error without wrapping
      throw new Error(getUserFriendlyError(error));
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
   * @returns Promise resolving to response string
   */
  static async appendMessage(
    instance: LanguageModel,
    messages: any[], // MultimodalContent[]
  ): Promise<string> {
    try {
      if (!instance.append) {
        throw new Error(
          'Multimodal append not supported. Session must be created with expectedInputs: [{type: "image"}, {type: "audio"}]',
        );
      }

      const result = await instance.append(messages);
      return result;
    } catch (error: any) {
      // Throw user-friendly error
      throw new Error(getUserFriendlyError(error));
    }
  }

  /**
   * Append multimodal message(s) with streaming
   * @param instance - LanguageModel instance
   * @param messages - Array of multimodal messages
   * @param onChunk - Callback for each chunk
   * @returns Promise resolving to complete response
   */
  static async appendMessageStreaming(
    instance: LanguageModel,
    messages: any[], // MultimodalContent[]
    onChunk: (chunk: string) => void,
  ): Promise<string> {
    try {
      if (!instance.appendStreaming) {
        throw new Error(
          'Multimodal streaming not supported. Session must be created with expectedInputs and support appendStreaming.',
        );
      }

      const stream = instance.appendStreaming(messages);
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
      // Throw user-friendly error
      throw new Error(getUserFriendlyError(error));
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
        systemPrompt: 'You are a helpful AI assistant.',
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

      api
        .create(options)
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
