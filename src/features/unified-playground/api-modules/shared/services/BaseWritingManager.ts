/**
 * BaseWritingManager - Abstract Base Class for Writing APIs
 *
 * Provides common instance management, caching, download monitoring,
 * and lifecycle management for Writer and Rewriter API implementations.
 *
 * This class implements the shared logic for both APIs, reducing code
 * duplication and ensuring consistent behavior.
 *
 * @module BaseWritingManager
 * @abstract
 */

import type {
  AvailabilityStatus,
  AvailabilityCheckResult,
  DownloadProgress,
  ProgressCallback,
  InstanceMetadata,
  InstanceState,
} from '../types/writing.types';

// ============================================================================
// Abstract Base Class
// ============================================================================

/**
 * Abstract base manager for Writing APIs (Writer & Rewriter)
 *
 * Provides shared functionality:
 * - Instance lifecycle management
 * - Configuration-based caching
 * - Model download monitoring
 * - Error handling
 * - Resource cleanup
 *
 * @template TInstance - The API instance type (Writer | Rewriter)
 * @template TOptions - The create options type
 * @template TConfig - The configuration type
 *
 * @example
 * ```typescript
 * class WriterManager extends BaseWritingManager<Writer, WriterCreateOptions, WriterConfig> {
 *   getAPIName() { return 'Writer'; }
 *   async createInstance(options) { return await Writer.create(options); }
 *   // ... implement abstract methods
 * }
 * ```
 */
export abstract class BaseWritingManager<TInstance, TOptions, TConfig> {
  // ==========================================================================
  // Protected State
  // ==========================================================================

  /** Current API instance (null if not created) */
  protected instance: TInstance | null = null;

  /** Current configuration */
  protected config: TConfig | null = null;

  /** Instance creation in progress */
  protected isCreating = false;

  /** Current download progress */
  protected downloadProgress: DownloadProgress | null = null;

  /** Download start time for speed calculation */
  protected downloadStartTime = 0;

  /** Last downloaded bytes (for speed calculation) */
  protected lastLoadedBytes = 0;

  /** Last speed check timestamp */
  protected lastSpeedCheckTime = 0;

  /** Instance metadata */
  protected metadata: InstanceMetadata | null = null;

  /** Instance state */
  protected state: InstanceState = 'idle';

  /** AbortController for cancellation */
  protected abortController: AbortController | null = null;

  // ==========================================================================
  // Abstract Methods - Must be implemented by subclasses
  // ==========================================================================

  /**
   * Get the API name (e.g., 'Writer', 'Rewriter')
   * Used for logging and error messages
   */
  abstract getAPIName(): string;

  /**
   * Create an API instance with the given options
   *
   * @param options - Creation options
   * @returns Promise resolving to API instance
   * @throws Error if creation fails
   */
  abstract createInstance(options: TOptions): Promise<TInstance>;

  /**
   * Check API availability
   *
   * @returns Promise resolving to availability status
   */
  abstract checkAvailability(): Promise<AvailabilityStatus>;

  /**
   * Convert configuration to creation options
   *
   * @param config - User configuration
   * @returns Creation options for the API
   */
  protected abstract configToOptions(config: TConfig): TOptions;

  /**
   * Check if the given configuration matches current config
   * Used for instance caching
   *
   * @param config - Configuration to compare
   * @returns true if configs match
   */
  protected abstract configMatches(config: TConfig): boolean;

  // ==========================================================================
  // Public Interface
  // ==========================================================================

  /**
   * Get or create an instance with the given configuration
   *
   * Implements intelligent caching:
   * - Reuses existing instance if config matches
   * - Destroys and recreates if config changed
   * - Prevents concurrent creation attempts
   *
   * IMPORTANT: For Writer/Rewriter APIs that require user activation,
   * this method starts instance creation SYNCHRONOUSLY before any async operations
   * to preserve user activation across async boundaries.
   *
   * @param config - API configuration
   * @returns Promise resolving to API instance
   * @throws Error if creation fails or already creating
   *
   * @example
   * ```typescript
   * const instance = await manager.getInstance({
   *   tone: 'formal',
   *   format: 'markdown',
   *   length: 'medium'
   * });
   * ```
   */
  async getInstance(config: TConfig): Promise<TInstance> {
    // Prevent concurrent creation
    if (this.isCreating) {
      throw new Error(
        `${this.getAPIName()} instance creation already in progress`,
      );
    }

    // Return cached instance if config matches
    if (this.instance && this.state === 'ready' && this.configMatches(config)) {
      this.updateMetadata({ lastUsedAt: Date.now(), usageCount: 1 });
      return this.instance;
    }

    // CRITICAL FIX: Start instance creation IMMEDIATELY (synchronously) before any cleanup
    // This preserves user activation for Writer/Rewriter APIs that require it
    const options = this.configToOptions(config);
    const creationPromise = this.createInstance(options);

    // Destroy old instance if exists (can happen after creation started)
    if (this.instance) {
      this.destroy();
    }

    // Create new instance
    try {
      this.isCreating = true;
      this.state = 'creating';

      // Await the creation promise that was started synchronously above
      this.instance = await creationPromise;
      this.config = config;
      this.state = 'ready';

      // Initialize metadata
      this.metadata = {
        id: this.generateInstanceId(),
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        usageCount: 0,
        state: 'ready',
        configHash: this.hashConfig(config),
      };

      return this.instance;
    } catch (error) {
      this.state = 'error';
      throw new Error(
        `Failed to create ${this.getAPIName()} instance: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      this.isCreating = false;
    }
  }

  /**
   * Monitor model download progress
   *
   * Creates an instance with download monitoring enabled.
   * Calls progress callback with download status updates.
   *
   * @param onProgress - Callback for progress updates
   * @param signal - Optional abort signal for cancellation
   * @returns Promise that resolves when download completes
   *
   * @example
   * ```typescript
   * await manager.monitorDownload((progress) => {
   *   console.log(`Downloaded: ${progress.percentage}%`);
   *   console.log(`Speed: ${(progress.speed / 1024).toFixed(0)} KB/s`);
   * });
   * ```
   */
  async monitorDownload(
    onProgress: ProgressCallback,
    signal?: AbortSignal,
  ): Promise<void> {
    if (this.isCreating) {
      throw new Error(
        `${this.getAPIName()} instance creation already in progress`,
      );
    }

    this.state = 'downloading';
    this.downloadStartTime = Date.now();
    this.lastLoadedBytes = 0;
    this.lastSpeedCheckTime = Date.now();

    // Create abort controller if signal provided
    this.abortController = signal ? null : new AbortController();
    const effectiveSignal = signal || this.abortController?.signal;

    try {
      this.isCreating = true;

      // Create options with monitor callback
      const options = {
        signal: effectiveSignal,
        monitor: (m: EventTarget) => {
          m.addEventListener('downloadprogress', (e: Event) => {
            const event = e as unknown as { loaded: number; total: number };
            const loaded = event.loaded;
            const total = event.total;
            const percentage = (loaded / total) * 100;

            // Calculate download speed
            const now = Date.now();
            const timeDelta = now - this.lastSpeedCheckTime;

            let speed = 0;
            if (timeDelta >= 500) {
              // Update speed every 500ms
              const bytesDelta = loaded - this.lastLoadedBytes;
              speed = (bytesDelta / timeDelta) * 1000; // bytes per second
              this.lastLoadedBytes = loaded;
              this.lastSpeedCheckTime = now;
            }

            // Estimate time remaining
            const remaining = total - loaded;
            const timeRemaining = speed > 0 ? remaining / speed : 0;

            const progress: DownloadProgress = {
              loaded,
              total,
              percentage,
              timeRemaining,
              speed: speed > 0 ? speed : undefined,
            };

            this.downloadProgress = progress;
            onProgress(progress);
          });
        },
      } as TOptions;

      // Trigger download by creating instance
      await this.createInstance(options);

      this.state = 'ready';
    } catch (error) {
      this.state = 'error';

      if (effectiveSignal?.aborted) {
        throw new Error('Download cancelled by user');
      }

      throw new Error(
        `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      this.isCreating = false;
      this.downloadProgress = null;
      this.abortController = null;
    }
  }

  /**
   * Check detailed availability information
   *
   * @returns Promise resolving to detailed availability info
   */
  async checkDetailedAvailability(): Promise<AvailabilityCheckResult> {
    try {
      const availability = await this.checkAvailability();

      return {
        availability,
        isSupported: availability !== 'no',
        requiresDownload: availability === 'after-download',
        requirements: {
          minChromeVersion: 128,
          requiredFlags: [`${this.getAPIName().toLowerCase()}-api`],
        },
      };
    } catch (error) {
      return {
        availability: 'no',
        isSupported: false,
        requiresDownload: false,
        error:
          error instanceof Error ? error.message : 'Availability check failed',
      };
    }
  }

  /**
   * Destroy the current instance and clean up resources
   *
   * - Calls instance.destroy() if available
   * - Resets all internal state
   * - Cancels any ongoing operations
   *
   * @example
   * ```typescript
   * // Clean up when done
   * manager.destroy();
   * ```
   */
  destroy(): void {
    try {
      // Abort any ongoing operations
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }

      // Destroy instance if it has destroy method
      if (
        this.instance &&
        typeof (this.instance as any).destroy === 'function'
      ) {
        (this.instance as any).destroy();
      }
    } catch (error) {
      console.warn(`Error destroying ${this.getAPIName()} instance:`, error);
    } finally {
      // Reset state
      this.instance = null;
      this.config = null;
      this.downloadProgress = null;
      this.metadata = null;
      this.state = 'destroyed';
      this.isCreating = false;
    }
  }

  /**
   * Cancel ongoing download or creation
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.state === 'downloading' || this.state === 'creating') {
      this.destroy();
    }
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  /**
   * Get current download progress
   *
   * @returns Download progress or null if not downloading
   */
  getDownloadProgress(): DownloadProgress | null {
    return this.downloadProgress;
  }

  /**
   * Check if instance exists and is ready
   *
   * @returns true if instance is ready to use
   */
  hasInstance(): boolean {
    return this.instance !== null && this.state === 'ready';
  }

  /**
   * Get current instance state
   *
   * @returns Current state
   */
  getState(): InstanceState {
    return this.state;
  }

  /**
   * Get instance metadata
   *
   * @returns Instance metadata or null if no instance
   */
  getMetadata(): InstanceMetadata | null {
    return this.metadata;
  }

  /**
   * Get current configuration
   *
   * @returns Current config or null if not set
   */
  getConfig(): TConfig | null {
    return this.config;
  }

  /**
   * Check if currently creating instance
   *
   * @returns true if creation in progress
   */
  isCreatingInstance(): boolean {
    return this.isCreating;
  }

  // ==========================================================================
  // Protected Utility Methods
  // ==========================================================================

  /**
   * Generate unique instance ID
   */
  protected generateInstanceId(): string {
    return `${this.getAPIName().toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Hash configuration for caching
   * Simple hash implementation - can be overridden for custom hashing
   *
   * @param config - Configuration to hash
   * @returns Hash string
   */
  protected hashConfig(config: TConfig): string {
    return JSON.stringify(config);
  }

  /**
   * Update instance metadata
   *
   * @param updates - Partial metadata updates
   */
  protected updateMetadata(updates: Partial<InstanceMetadata>): void {
    if (this.metadata) {
      this.metadata = {
        ...this.metadata,
        ...updates,
        usageCount:
          updates.usageCount !== undefined
            ? this.metadata.usageCount + updates.usageCount
            : this.metadata.usageCount,
      };
    }
  }

  /**
   * Set instance state
   *
   * @param state - New state
   */
  protected setState(state: InstanceState): void {
    this.state = state;
    if (this.metadata) {
      this.metadata.state = state;
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export default BaseWritingManager;
