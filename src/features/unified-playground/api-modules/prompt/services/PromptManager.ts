/**
 * Prompt Manager
 *
 * High-level manager for LanguageModel instances. Handles instance lifecycle,
 * configuration management, retry logic, and operation coordination.
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
} from '../types';

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

  // Multimodal support flag
  private multimodalEnabled = false;

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
    console.log('PromptManager initialize.');
    try {
      this.state = 'initializing';

      // Validate configuration
      ChromeAIPromptService.validateOptions(config);

      // Create instance with download monitoring
      if (onProgress) {
        this.downloadInProgress = true;

        this.instance =
          await ChromeAIPromptService.createInstanceWithMonitoring(
            config,
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
        this.instance = await ChromeAIPromptService.createInstance(config);
      }

      this.currentConfig = config;
      this.multimodalEnabled = false;
      this.state = 'ready';
      console.log('PromptManager initialized successfully.');
      console.log('PromptManager: instance is null?', this.instance === null);
      console.log('PromptManager: state =', this.state);
      console.log(
        'PromptManager: multimodal enabled =',
        this.multimodalEnabled,
      );
    } catch (error) {
      console.error('PromptManager: Initialization FAILED:', error);
      console.error(
        'PromptManager: Error type:',
        error instanceof Error ? error.constructor.name : typeof error,
      );
      this.state = 'error';
      this.downloadInProgress = false;
      this.multimodalEnabled = false;
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
    const newConfig = { ...this.currentConfig, ...config };
    await this.reinitialize(newConfig as LanguageModelCreateOptions);
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
      ChromeAIPromptService.destroy(this.instance);
      this.instance = null;
    }

    this.cancelOperation();
    this.state = 'idle';
    this.currentConfig = null;
  }

  // ============================================================================
  // Prompt Execution
  // ============================================================================

  /**
   * Execute a prompt (non-streaming)
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
      // Create abort controller
      this.abortController = new AbortController();
      const mergedOptions = {
        ...options,
        signal: this.abortController.signal,
      };

      // Execute with retry logic
      const result = await this.withRetry(() =>
        ChromeAIPromptService.prompt(this.instance!, prompt, mergedOptions),
      );

      // Track metrics
      this.trackMetrics(startTime, true);

      this.state = 'ready';
      return result;
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
      // Create abort controller
      this.abortController = new AbortController();
      const mergedOptions = {
        ...options,
        signal: this.abortController.signal,
      };

      // Execute with retry logic
      const result = await this.withRetry(() =>
        ChromeAIPromptService.promptStreamingWithCallback(
          this.instance!,
          prompt,
          onChunk,
          mergedOptions,
        ),
      );

      // Track metrics
      this.trackMetrics(startTime, true);

      this.state = 'ready';
      return result;
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
   * @param text - User prompt text
   * @param images - Array of ImageData
   * @param audios - Optional array of AudioData
   * @returns Promise resolving to response string
   */
  async promptMultimodal(
    text: string,
    images: any[] = [], // ImageData[]
    audios: any[] = [], // AudioData[]
  ): Promise<string> {
    this.ensureReady();
    this.validatePrompt(text);

    const startTime = Date.now();
    this.lastOperationStartTime = new Date();
    this.state = 'prompting';

    try {
      // Create abort controller
      this.abortController = new AbortController();

      // Build multimodal message
      const message = ChromeAIPromptService.buildMultimodalMessage(
        text,
        images,
        audios,
      );

      // Execute with retry logic
      const result = await this.withRetry(() =>
        ChromeAIPromptService.appendMessage(this.instance!, [message]),
      );

      // Track metrics
      this.trackMetrics(startTime, true);

      this.state = 'ready';
      return result;
    } catch (error) {
      this.trackMetrics(startTime, false, error);
      this.state = 'ready';
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Execute a multimodal prompt with streaming (images and/or audio)
   * @param text - User prompt text
   * @param onChunk - Callback for each chunk
   * @param images - Array of ImageData
   * @param audios - Optional array of AudioData
   * @returns Promise resolving to complete response
   */
  async promptMultimodalStreaming(
    text: string,
    onChunk: StreamingChunkCallback,
    images: any[] = [], // ImageData[]
    audios: any[] = [], // AudioData[]
  ): Promise<string> {
    this.ensureReady();
    this.validatePrompt(text);

    const startTime = Date.now();
    this.lastOperationStartTime = new Date();
    this.state = 'prompting';

    try {
      // Create abort controller
      this.abortController = new AbortController();

      // Build multimodal message
      const message = ChromeAIPromptService.buildMultimodalMessage(
        text,
        images,
        audios,
      );

      // Execute with retry logic
      const result = await this.withRetry(() =>
        ChromeAIPromptService.appendMessageStreaming(
          this.instance!,
          [message],
          onChunk,
        ),
      );

      // Track metrics
      this.trackMetrics(startTime, true);

      this.state = 'ready';
      return result;
    } catch (error) {
      this.trackMetrics(startTime, false, error);
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
  ): void {
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    const metric: PromptMetrics = {
      executionTime,
      timeToFirstToken: null, // Not tracked in non-streaming
      tokensPerSecond: null,
      tokensUsed: 0, // Would need token counting
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
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  // ============================================================================
  // Retry Logic
  // ============================================================================

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

        // Don't retry on abort
        if (error?.name === 'AbortError') {
          throw error;
        }

        // Don't retry on validation errors
        if (error?.message?.includes('Invalid')) {
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
