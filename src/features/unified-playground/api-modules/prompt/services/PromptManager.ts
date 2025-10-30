/**
 * Prompt Manager
 *
 * High-level manager for LanguageModel instances. Handles instance lifecycle,
 * configuration management, retry logic, and operation coordination.
 *
 * SECURITY: Integrated with OWASP LLM01:2025 compliant prompt injection protection
 *
 * @module prompt/services/PromptManager
 */

import { ChromeAIPromptService } from './ChromeAIPromptService';
import type {
  LanguageModel,
  LanguageModelCreateOptions,
  PromptOptions,
  DownloadProgress,
  LanguageModelAvailability,
  PromptMetrics,
  ImageContentItem,
  AudioContentItem,
} from '../types';

// Security utilities
import {
  buildSecurePrompt,
  buildMultimodalSecurePrompt,
  type SystemPromptId,
} from '../../../shared/utils/promptConstruction';
import { validateAIOutput } from '../../../shared/utils/outputValidation';
import {
  logInjectionDetected,
  logSuspiciousOutput,
  getSessionId,
} from '../../../shared/utils/securityLogger';

// ============================================================================
// Types
// ============================================================================

/**
 * Manager state
 */
type ManagerState = 'idle' | 'initializing' | 'ready' | 'prompting' | 'error';

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

/**
 * Download progress callback
 */
type DownloadProgressCallback = (progress: DownloadProgress) => void;

/**
 * Streaming chunk callback
 */
type StreamingChunkCallback = (chunk: string) => void;

// ============================================================================
// PromptManager Class
// ============================================================================

/**
 * PromptManager - High-level LanguageModel instance management
 *
 * Responsibilities:
 * - Instance creation and lifecycle management
 * - Configuration validation and updates
 * - Retry logic for operations
 * - Download progress monitoring
 * - Performance metrics tracking
 * - Error handling and recovery
 */
export class PromptManager {
  // Instance state
  private instance: LanguageModel | null = null;
  private state: ManagerState = 'idle';
  private currentConfig: LanguageModelCreateOptions | null = null;

  // Security: System prompt ID (non-user-editable)
  private systemPromptId: SystemPromptId = 'general';

  // Multimodal support flag
  private multimodalEnabled = false;

  // Cache multimodal availability to prevent loss during config updates
  private multimodalInitiallyAvailable = false;

  // Download tracking
  private downloadInProgress = false;
  private downloadProgress: DownloadProgress | null = null;

  // Retry configuration
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  };

  // Abort control
  private abortController: AbortController | null = null;

  // Performance tracking
  private metrics: PromptMetrics[] = [];
  private lastOperationStartTime: Date | null = null;

  // Quota overflow event tracking
  private quotaOverflowListeners: Set<(event: Event) => void> = new Set();

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(retryConfig?: Partial<RetryConfig>) {
    if (retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...retryConfig };
    }
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Get current manager state
   */
  getState(): ManagerState {
    return this.state;
  }

  /**
   * Check if manager is initialized (has an instance)
   */
  isInitialized(): boolean {
    return this.instance !== null;
  }

  /**
   * Check if manager is ready for prompts
   */
  isReady(): boolean {
    return this.state === 'ready' && this.instance !== null;
  }

  /**
   * Check if download is in progress
   */
  isDownloading(): boolean {
    return this.downloadInProgress;
  }

  /**
   * Get current download progress
   */
  getDownloadProgress(): DownloadProgress | null {
    return this.downloadProgress;
  }

  /**
   * Set system prompt ID (security: only predefined prompts allowed)
   * @param promptId - ID of predefined system prompt
   */
  setSystemPromptId(promptId: SystemPromptId): void {
    this.systemPromptId = promptId;
  }

  /**
   * Get current system prompt ID
   */
  getSystemPromptId(): SystemPromptId {
    return this.systemPromptId;
  }

  // ============================================================================
  // Availability Checking
  // ============================================================================

  /**
   * Check if LanguageModel API is available
   */
  static async checkAvailability(): Promise<LanguageModelAvailability> {
    return await ChromeAIPromptService.checkAvailability();
  }

  /**
   * Check if API is supported
   */
  static isSupported(): boolean {
    return ChromeAIPromptService.isSupported();
  }

  // ============================================================================
  // Instance Management
  // ============================================================================

  /**
   * Create and initialize a LanguageModel instance
   * @param config - Configuration options
   * @param onProgress - Optional download progress callback
   */
  async initialize(
    config: LanguageModelCreateOptions,
    onProgress?: DownloadProgressCallback,
  ): Promise<void> {
    try {
      this.state = 'initializing';

      // Validate configuration
      ChromeAIPromptService.validateOptions(config);

      // Check multimodal availability using Chrome AI's availability() API
      // This is for diagnostic purposes - we'll try with expectedInputs regardless
      console.log(
        '[PromptManager] Checking multimodal availability with config:',
        config,
      );

      const api = ChromeAIPromptService.getAPI();
      let availabilityCheckPassed = false;

      try {
        const multimodalAvailability = await api.availability({
          topK: config.topK || 1,
          temperature: config.temperature || 0,
          expectedInputs: [{ type: 'image' }],
          expectedOutputs: [{ type: 'text', languages: ['en'] }],
        });

        availabilityCheckPassed =
          multimodalAvailability === 'available' ||
          multimodalAvailability === 'after-download';

        console.log(
          '[PromptManager] Multimodal availability check result:',
          multimodalAvailability,
          '| Check passed:',
          availabilityCheckPassed,
        );
      } catch (error) {
        console.warn(
          '[PromptManager] Multimodal availability check failed:',
          error,
        );
      }

      // ALWAYS create session with expectedInputs (optimistic approach)
      // Chrome will gracefully ignore if not supported
      const sessionConfig: LanguageModelCreateOptions = {
        ...config,
        expectedInputs: [{ type: 'image' }],
      };

      console.log(
        '[PromptManager] Creating session with MULTIMODAL support (always includes expectedInputs)',
        availabilityCheckPassed
          ? '- Availability check passed'
          : '- Availability check did not pass, but trying anyway',
      );

      // Create instance with appropriate config (multimodal or text-only)
      if (onProgress) {
        this.downloadInProgress = true;

        this.instance =
          await ChromeAIPromptService.createInstanceWithMonitoring(
            sessionConfig,
            (loaded, total) => {
              const progress: DownloadProgress = {
                loaded,
                total,
                percentage: (loaded / total) * 100,
              };
              this.downloadProgress = progress;
              onProgress(progress);
            },
          );

        this.downloadInProgress = false;
        this.downloadProgress = null;
      } else {
        this.instance =
          await ChromeAIPromptService.createInstance(sessionConfig);
      }

      this.currentConfig = sessionConfig;

      // Detect if multimodal is actually supported by checking appendStreaming existence
      // The availability check provides diagnostic info, but actual capability is determined
      // by whether the instance has the appendStreaming method
      // Use 'in' operator to check prototype chain, not direct property access
      const hasAppendStreaming =
        'appendStreaming' in this.instance &&
        typeof this.instance.appendStreaming === 'function';

      this.multimodalEnabled = hasAppendStreaming;

      // Cache the initial multimodal status
      if (this.multimodalEnabled && !this.multimodalInitiallyAvailable) {
        this.multimodalInitiallyAvailable = true;
      }

      console.log(
        '[PromptManager] Session created. Multimodal streaming available:',
        this.multimodalEnabled,
        '| Availability check passed:',
        availabilityCheckPassed,
        '| Has appendStreaming:',
        hasAppendStreaming,
      );

      this.state = 'ready';

      // Context window and token information available
      // - this.instance.inputQuota: Total context window size
      // - this.instance.maxTokens: Maximum response length
      // - this.instance.tokensSoFar: Tokens used so far
      // - this.instance.tokensLeft: Remaining tokens
    } catch (error) {
      console.error('PromptManager: Initialization FAILED:', error);
      console.error(
        'PromptManager: Error type:',
        error instanceof Error ? error.constructor.name : typeof error,
      );
      this.state = 'error';
      this.downloadInProgress = false;
      this.multimodalEnabled = false; // Reset on error
      throw error;
    }
  }

  /**
   * Reinitialize with new configuration
   * @param config - New configuration
   * @param onProgress - Optional download progress callback
   */
  async reinitialize(
    config: LanguageModelCreateOptions,
    onProgress?: DownloadProgressCallback,
  ): Promise<void> {
    // Destroy existing instance
    this.destroy();

    // Initialize with new config
    await this.initialize(config, onProgress);
  }

  /**
   * Update configuration (requires reinitialization)
   * @param config - New configuration
   */
  async updateConfig(
    config: Partial<LanguageModelCreateOptions>,
  ): Promise<void> {
    // Validate current config exists before updating
    if (!this.currentConfig) {
      throw new Error(
        'Cannot update config: Manager not initialized. Call initialize() first.',
      );
    }

    const wasMultimodal = this.multimodalEnabled;
    const newConfig = { ...this.currentConfig, ...config };

    await this.reinitialize(newConfig as LanguageModelCreateOptions);

    // Warn if multimodal support was lost during config update
    if (wasMultimodal && !this.multimodalEnabled) {
      console.warn(
        '[PromptManager] WARNING: Multimodal support was lost during config update. ' +
          'This may indicate an incompatible parameter combination or temporary API issue.',
      );
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): LanguageModelCreateOptions | null {
    return this.currentConfig;
  }

  /**
   * Clone current instance (if supported)
   */
  async clone(): Promise<LanguageModel | null> {
    if (!this.instance) {
      throw new Error('No instance to clone. Call initialize() first.');
    }

    return await ChromeAIPromptService.clone(this.instance);
  }

  /**
   * Destroy the current instance and clean up
   */
  destroy(): void {
    if (this.instance) {
      // Store reference before clearing to prevent race conditions
      const instanceToDestroy = this.instance;

      // Set to null first to prevent any new operations
      this.instance = null;

      // Clean up all quota overflow listeners on the stored instance
      this.quotaOverflowListeners.forEach((callback) => {
        ChromeAIPromptService.removeQuotaOverflowListener(
          instanceToDestroy,
          callback,
        );
      });
      this.quotaOverflowListeners.clear();

      // Destroy the instance last
      ChromeAIPromptService.destroy(instanceToDestroy);
    }

    this.cancelOperation();
    this.state = 'idle';
    this.currentConfig = null;
    // Note: We intentionally preserve multimodalInitiallyAvailable
    // so it persists across reinitializations
  }

  // ============================================================================
  // Prompt Execution
  // ============================================================================

  /**
   * Execute a prompt (non-streaming)
   * SECURITY: Integrated with prompt injection detection and output validation
   * @param prompt - User prompt text
   * @param options - Optional prompt options
   * @returns Promise resolving to response string
   */
  async prompt(prompt: string, options?: PromptOptions): Promise<string> {
    this.ensureReady();
    this.validatePrompt(prompt);

    const startTime = Date.now();
    this.lastOperationStartTime = new Date();
    this.state = 'prompting';

    try {
      // SECURITY: Build secure prompt with delimiter-based isolation
      const securePromptResult = buildSecurePrompt(
        this.systemPromptId,
        prompt,
        undefined, // No context for basic prompts
        {
          validateInput: true,
          sanitizeInput: true,
          throwOnInjection: false, // Log but don't block to maintain UX
        },
      );

      // SECURITY: Log injection detection if found
      if (securePromptResult.detectionResult?.isInjection) {
        logInjectionDetected(
          getSessionId(),
          prompt,
          securePromptResult.detectionResult.category!,
          securePromptResult.detectionResult.confidence,
          false, // Not blocking, just detecting
          'prompt-api',
        );

        // Warn user in console
        console.warn(
          `[SECURITY] Potential prompt injection detected:`,
          securePromptResult.detectionResult.category,
          `(confidence: ${(securePromptResult.detectionResult.confidence * 100).toFixed(1)}%)`,
        );
      }

      // Create abort controller
      this.abortController = new AbortController();
      const mergedOptions = {
        ...options,
        signal: this.abortController.signal,
      };

      // Execute with retry logic using secured prompt
      const result = await this.withRetry(() =>
        ChromeAIPromptService.prompt(
          this.instance!,
          securePromptResult.prompt,
          mergedOptions,
        ),
      );

      // SECURITY: Validate AI output
      const outputValidation = validateAIOutput(result, prompt, {
        strictMode: false,
        sanitizeHtmlContent: true,
      });

      if (!outputValidation.safe) {
        logSuspiciousOutput(
          getSessionId(),
          result,
          outputValidation.reason || 'Output validation failed',
          'prompt-api',
        );

        console.warn(
          `[SECURITY] Suspicious output detected:`,
          outputValidation.reason,
        );
      }

      // Track metrics
      this.trackMetrics(startTime, true);

      this.state = 'ready';

      // Return sanitized output
      return outputValidation.sanitized;
    } catch (error) {
      this.trackMetrics(startTime, false, error);
      this.state = 'ready';
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Execute a prompt with streaming
   * SECURITY: Integrated with prompt injection detection and output validation
   * @param prompt - User prompt text
   * @param onChunk - Callback for each chunk
   * @param options - Optional prompt options
   * @returns Promise resolving to complete response
   */
  async promptStreaming(
    prompt: string,
    onChunk: StreamingChunkCallback,
    options?: PromptOptions,
  ): Promise<string> {
    this.ensureReady();
    this.validatePrompt(prompt);

    const startTime = Date.now();
    this.lastOperationStartTime = new Date();
    this.state = 'prompting';

    try {
      // SECURITY: Build secure prompt with delimiter-based isolation
      const securePromptResult = buildSecurePrompt(
        this.systemPromptId,
        prompt,
        undefined,
        {
          validateInput: true,
          sanitizeInput: true,
          throwOnInjection: false,
        },
      );

      // SECURITY: Log injection detection if found
      if (securePromptResult.detectionResult?.isInjection) {
        logInjectionDetected(
          getSessionId(),
          prompt,
          securePromptResult.detectionResult.category!,
          securePromptResult.detectionResult.confidence,
          false,
          'prompt-api-streaming',
        );

        console.warn(
          `[SECURITY] Potential prompt injection detected in streaming:`,
          securePromptResult.detectionResult.category,
        );
      }

      // Create abort controller
      this.abortController = new AbortController();
      const mergedOptions = {
        ...options,
        signal: this.abortController.signal,
      };

      // Execute with retry logic using secured prompt
      const result = await this.withRetry(() =>
        ChromeAIPromptService.promptStreamingWithCallback(
          this.instance!,
          securePromptResult.prompt,
          onChunk,
          mergedOptions,
        ),
      );

      // SECURITY: Validate AI output
      const outputValidation = validateAIOutput(result, prompt, {
        strictMode: false,
        sanitizeHtmlContent: true,
      });

      if (!outputValidation.safe) {
        logSuspiciousOutput(
          getSessionId(),
          result,
          outputValidation.reason || 'Output validation failed',
          'prompt-api-streaming',
        );

        console.warn(
          `[SECURITY] Suspicious streaming output:`,
          outputValidation.reason,
        );
      }

      // Track metrics
      this.trackMetrics(startTime, true);

      this.state = 'ready';

      // Return sanitized output
      return outputValidation.sanitized;
    } catch (error) {
      this.trackMetrics(startTime, false, error);
      this.state = 'ready';
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Execute a multimodal prompt with images and/or audio (non-streaming)
   * SECURITY: Integrated with multimodal prompt injection detection and output validation
   * @param text - User prompt text
   * @param images - Array of ImageContentItem
   * @param audios - Optional array of AudioContentItem
   * @returns Promise resolving to response string
   */
  async promptMultimodal(
    text: string,
    images: ImageContentItem[] = [],
    audios: AudioContentItem[] = [],
  ): Promise<string> {
    this.ensureReady();
    this.validatePrompt(text);

    // Check if multimodal is supported
    if (!this.multimodalEnabled) {
      throw new Error(
        'Multimodal input is not supported. Please ensure chrome://flags#prompt-api-for-gemini-nano-multimodal-input is enabled and restart Chrome.',
      );
    }

    const startTime = Date.now();
    this.lastOperationStartTime = new Date();
    this.state = 'prompting';

    try {
      // SECURITY: Build secure multimodal prompt
      const imageDescriptions = images.map(
        (_, idx) => `Image ${idx + 1} uploaded`,
      );
      const securePromptResult = buildMultimodalSecurePrompt(
        this.systemPromptId,
        text,
        imageDescriptions,
        undefined,
        {
          validateInput: true,
          sanitizeInput: true,
          throwOnInjection: false,
        },
      );

      // SECURITY: Log injection detection if found
      if (securePromptResult.detectionResult?.isInjection) {
        logInjectionDetected(
          getSessionId(),
          text,
          securePromptResult.detectionResult.category!,
          securePromptResult.detectionResult.confidence,
          false,
          'prompt-api-multimodal',
        );

        console.warn(
          `[SECURITY] Potential prompt injection detected in multimodal:`,
          securePromptResult.detectionResult.category,
        );
      }

      // Create abort controller
      this.abortController = new AbortController();

      // Build multimodal message with secured text
      const message = ChromeAIPromptService.buildMultimodalMessage(
        securePromptResult.prompt,
        images,
        audios,
      );

      // Execute with retry logic
      const result = await this.withRetry(() =>
        ChromeAIPromptService.appendMessage(this.instance!, [message], {
          signal: this.abortController!.signal,
        }),
      );

      // SECURITY: Validate AI output
      const outputValidation = validateAIOutput(result, text, {
        strictMode: false,
        sanitizeHtmlContent: true,
      });

      if (!outputValidation.safe) {
        logSuspiciousOutput(
          getSessionId(),
          result,
          outputValidation.reason || 'Output validation failed',
          'prompt-api-multimodal',
        );

        console.warn(
          `[SECURITY] Suspicious multimodal output:`,
          outputValidation.reason,
        );
      }

      // Track metrics with image count
      this.trackMetrics(startTime, true, undefined, images.length);

      this.state = 'ready';

      // Return sanitized output
      return outputValidation.sanitized;
    } catch (error) {
      this.trackMetrics(startTime, false, error, images.length);
      this.state = 'ready';
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Execute a multimodal prompt with streaming (images and/or audio)
   * SECURITY: Integrated with multimodal prompt injection detection and output validation
   * @param text - User prompt text
   * @param onChunk - Callback for each chunk
   * @param images - Array of ImageContentItem
   * @param audios - Optional array of AudioContentItem
   * @returns Promise resolving to complete response
   */
  async promptMultimodalStreaming(
    text: string,
    onChunk: StreamingChunkCallback,
    images: ImageContentItem[] = [],
    audios: AudioContentItem[] = [],
  ): Promise<string> {
    this.ensureReady();
    this.validatePrompt(text);

    // Check if multimodal is supported
    if (!this.multimodalEnabled) {
      throw new Error(
        'Multimodal input is not supported. Please ensure chrome://flags#prompt-api-for-gemini-nano-multimodal-input is enabled and restart Chrome.',
      );
    }

    const startTime = Date.now();
    this.lastOperationStartTime = new Date();
    this.state = 'prompting';

    try {
      // SECURITY: Build secure multimodal prompt
      const imageDescriptions = images.map(
        (_, idx) => `Image ${idx + 1} uploaded`,
      );
      const securePromptResult = buildMultimodalSecurePrompt(
        this.systemPromptId,
        text,
        imageDescriptions,
        undefined,
        {
          validateInput: true,
          sanitizeInput: true,
          throwOnInjection: false,
        },
      );

      // SECURITY: Log injection detection if found
      if (securePromptResult.detectionResult?.isInjection) {
        logInjectionDetected(
          getSessionId(),
          text,
          securePromptResult.detectionResult.category!,
          securePromptResult.detectionResult.confidence,
          false,
          'prompt-api-multimodal-streaming',
        );

        console.warn(
          `[SECURITY] Potential prompt injection detected in multimodal streaming:`,
          securePromptResult.detectionResult.category,
        );
      }

      // Create abort controller
      this.abortController = new AbortController();

      // Build multimodal message with secured text
      const message = ChromeAIPromptService.buildMultimodalMessage(
        securePromptResult.prompt,
        images,
        audios,
      );

      // Execute with retry logic
      const result = await this.withRetry(() =>
        ChromeAIPromptService.appendMessageStreaming(
          this.instance!,
          [message],
          onChunk,
          {
            signal: this.abortController!.signal,
          },
        ),
      );

      // SECURITY: Validate AI output
      const outputValidation = validateAIOutput(result, text, {
        strictMode: false,
        sanitizeHtmlContent: true,
      });

      if (!outputValidation.safe) {
        logSuspiciousOutput(
          getSessionId(),
          result,
          outputValidation.reason || 'Output validation failed',
          'prompt-api-multimodal-streaming',
        );

        console.warn(
          `[SECURITY] Suspicious multimodal streaming output:`,
          outputValidation.reason,
        );
      }

      // Track metrics with image count
      this.trackMetrics(startTime, true, undefined, images.length);

      this.state = 'ready';

      // Return sanitized output
      return outputValidation.sanitized;
    } catch (error) {
      this.trackMetrics(startTime, false, error, images.length);
      this.state = 'ready';
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancel the current operation
   */
  cancelOperation(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  /**
   * Count tokens in text
   * @param text - Text to count tokens for
   * @returns Promise resolving to token count or null
   */
  async countTokens(text: string): Promise<number | null> {
    this.ensureReady();
    return await ChromeAIPromptService.countTokens(this.instance!, text);
  }

  /**
   * Get current token usage
   * @returns Token usage info or null
   */
  getTokenUsage(): {
    maxTokens: number;
    tokensSoFar: number;
    tokensLeft: number;
  } | null {
    if (!this.instance) {
      return null;
    }

    return ChromeAIPromptService.getTokenUsage(this.instance);
  }

  /**
   * Check if near token limit
   * @param threshold - Percentage threshold (0-1)
   * @returns true if near limit
   */
  isNearTokenLimit(threshold = 0.9): boolean {
    const usage = this.getTokenUsage();

    if (!usage) {
      return false;
    }

    const percentUsed = usage.tokensSoFar / usage.maxTokens;
    return percentUsed >= threshold;
  }

  // ============================================================================
  // Performance Metrics
  // ============================================================================

  /**
   * Track operation metrics
   */
  private trackMetrics(
    startTime: number,
    success: boolean,
    error?: unknown,
    imageCount = 0,
  ): void {
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Estimate tokens for images (approximate 200 tokens per image based on vision models)
    const estimatedImageTokens = imageCount * 200;

    const metric: PromptMetrics = {
      executionTime,
      timeToFirstToken: null, // Not tracked in non-streaming
      tokensPerSecond: null,
      tokensUsed: estimatedImageTokens, // Estimated tokens for images
      initTime: null,
      startTime: this.lastOperationStartTime!,
      endTime: new Date(endTime),
      success,
      error: error instanceof Error ? error.message : undefined,
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PromptMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get average execution time
   */
  getAverageExecutionTime(): number {
    if (this.metrics.length === 0) {
      return 0;
    }

    const sum = this.metrics.reduce((acc, m) => acc + m.executionTime, 0);
    return sum / this.metrics.length;
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.metrics.length === 0) {
      return 0;
    }

    const successful = this.metrics.filter((m) => m.success).length;
    return successful / this.metrics.length;
  }

  /**
   * Get input quota (context window size in tokens)
   * Returns the total available context window for the model
   * For Gemini Nano: typically 6144 tokens
   * @returns Input quota in tokens, or 6144 as default if not available
   */
  getInputQuota(): number {
    if (!this.instance) {
      return 6144; // Default for Gemini Nano
    }
    return this.instance.inputQuota || 6144;
  }

  /**
   * Measure actual input usage using Chrome AI API
   * @param input - String or message array to measure
   * @param signal - Optional AbortSignal for cancellation
   * @returns Promise resolving to token count, or null if not supported
   */
  async measureInputUsage(
    input: string | Array<{ role: string; content: string }>,
    signal?: AbortSignal,
  ): Promise<number | null> {
    if (!this.instance) {
      throw new Error('Manager not initialized');
    }

    return await ChromeAIPromptService.measureInputUsage(
      this.instance,
      input,
      signal,
    );
  }

  /**
   * Get current input usage (real-time tracking)
   * @returns Current input usage in tokens, or null if not available
   */
  getInputUsage(): number | null {
    if (!this.instance) {
      return null;
    }

    return ChromeAIPromptService.getInputUsage(this.instance);
  }

  /**
   * Register callback for quota overflow events
   * @param callback - Function to call when quota is exceeded
   */
  onQuotaOverflow(callback: (event: Event) => void): void {
    if (!this.instance) {
      console.warn('Cannot register quotaoverflow listener: No instance');
      return;
    }

    // Add to our tracking set
    this.quotaOverflowListeners.add(callback);

    // Register with the instance
    ChromeAIPromptService.addQuotaOverflowListener(this.instance, callback);
  }

  /**
   * Unregister callback for quota overflow events
   * @param callback - Function to remove
   */
  offQuotaOverflow(callback: (event: Event) => void): void {
    if (!this.instance) {
      return;
    }

    // Remove from our tracking set
    this.quotaOverflowListeners.delete(callback);

    // Unregister from the instance
    ChromeAIPromptService.removeQuotaOverflowListener(this.instance, callback);
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  // ============================================================================
  // Retry Logic
  // ============================================================================

  /**
   * Check if error is retriable (network/transient) vs permanent (validation/abort)
   */
  private isRetriableError(error: any): boolean {
    if (!error) return false;

    // Don't retry on abort
    if (error?.name === 'AbortError') {
      return false;
    }

    // Don't retry on validation errors
    if (
      error?.message?.includes('Invalid') ||
      error?.message?.includes('not supported') ||
      error?.message?.includes('not initialized') ||
      error?.message?.includes('not available')
    ) {
      return false;
    }

    // Don't retry on quota exceeded errors
    if (
      error?.message?.includes('quota') ||
      error?.message?.includes('Quota')
    ) {
      return false;
    }

    // Don't retry on permission errors
    if (
      error?.message?.includes('permission') ||
      error?.message?.includes('Permission')
    ) {
      return false;
    }

    // Retry on network errors, timeouts, and other transient issues
    return true;
  }

  /**
   * Execute operation with retry logic
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    let delay = this.retryConfig.retryDelay;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Check if error is retriable
        if (!this.isRetriableError(error)) {
          throw error;
        }

        // Last attempt - throw error
        if (attempt === this.retryConfig.maxRetries) {
          throw error;
        }

        // Wait before retry
        await this.sleep(delay);
        delay *= this.retryConfig.backoffMultiplier;
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Ensure manager is ready
   */
  private ensureReady(): void {
    if (!this.instance) {
      throw new Error(
        'LanguageModel instance not initialized. Call initialize() first.',
      );
    }

    if (this.state === 'error') {
      throw new Error(
        'Manager is in error state. Call initialize() to recover.',
      );
    }
  }

  /**
   * Validate prompt
   */
  private validatePrompt(prompt: string): void {
    ChromeAIPromptService.validatePrompt(prompt);
  }

  // ============================================================================
  // Static Utilities
  // ============================================================================

  /**
   * Get recommended configuration for use case
   */
  static getRecommendedConfig(
    useCase: 'general' | 'creative' | 'precise' | 'code' | 'chat' | 'analysis',
  ): LanguageModelCreateOptions {
    return ChromeAIPromptService.getRecommendedConfig(useCase);
  }
}

// ============================================================================
// Export
// ============================================================================

export default PromptManager;
