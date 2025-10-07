/**
 * Chrome AI Service Layer
 *
 * Abstraction layer for Chrome AI Summarizer API
 * Handles feature detection, availability checking, and model download management
 *
 * @module ChromeAIService
 */

import type {
  SummarizerAvailability,
  DownloadProgress,
  AvailabilityCheckResult,
} from '../types/summarizer.types';

// ============================================================================
// Chrome AI Service Class
// ============================================================================

export class ChromeAIService {
  private static downloadStartTime: number | null = null;
  private static downloadedBytes: number = 0;
  private static downloadSpeed: number = 0; // bytes per second

  // ============================================================================
  // Feature Detection
  // ============================================================================

  /**
   * Check if Chrome AI Summarizer API is supported
   * Checks both window.Summarizer and self.Summarizer
   *
   * @returns {boolean} True if API is available
   */
  static isSupported(): boolean {
    // Check for self.Summarizer (official Chrome AI)
    if ('Summarizer' in self) {
      return true;
    }

    // Check for window.Summarizer (playground/polyfill)
    if (typeof window !== 'undefined' && 'Summarizer' in window) {
      return true;
    }

    return false;
  }

  /**
   * Get the Summarizer API instance
   * Returns the appropriate API based on what's available
   *
   * @returns {typeof Summarizer | null} Summarizer API or null if not available
   */
  static getSummarizerAPI(): typeof Summarizer | undefined | null {
    if ('Summarizer' in self) {
      return self.Summarizer;
    }

    if (typeof window !== 'undefined' && 'Summarizer' in window) {
      return window.Summarizer;
    }

    return null;
  }

  // ============================================================================
  // Availability Checking
  // ============================================================================

  /**
   * Check Chrome AI Summarizer availability
   * Returns availability status and system requirements
   *
   * @returns {Promise<AvailabilityCheckResult>} Availability information
   */
  static async checkAvailability(): Promise<AvailabilityCheckResult> {
    // Check if API is supported at all
    if (!this.isSupported()) {
      return {
        availability: 'no',
        requirements: {
          chromeVersion: 'Chrome 138+',
          storageRequired: '22+ GB free storage',
          vramRequired: '4+ GB VRAM',
          networkRequired: true,
        },
      };
    }

    try {
      // Get the API
      const SummarizerAPI = this.getSummarizerAPI();

      if (!SummarizerAPI || !SummarizerAPI.availability) {
        return {
          availability: 'no',
          requirements: {
            chromeVersion: 'Chrome 138+',
            storageRequired: '22+ GB free storage',
            vramRequired: '4+ GB VRAM',
            networkRequired: true,
          },
        };
      }

      // Check availability
      const rawAvailability = await SummarizerAPI.availability();

      // Normalize different API responses
      let availability: SummarizerAvailability;

      // Convert to string for comparison (handles both API variations)
      const availabilityStr = String(rawAvailability);

      // Playground API might return 'available' or 'downloadable'
      if (availabilityStr === 'available') {
        availability = 'readily';
      } else if (availabilityStr === 'downloadable') {
        availability = 'after-download';
      } else if (availabilityStr === 'downloading') {
        // Model is currently downloading
        availability = 'after-download';
      } else if (availabilityStr === 'not-available') {
        availability = 'no';
      } else {
        // Official API: 'no', 'after-download', 'readily'
        availability = rawAvailability;
      }

      return {
        availability,
        requirements: {
          chromeVersion: 'Chrome 138+',
          storageRequired: '22 GB free storage',
          vramRequired: '4 GB VRAM',
          networkRequired: availability === 'after-download',
        },
      };
    } catch (error) {
      console.error('Failed to check Chrome AI availability:', error);
      return {
        availability: 'no',
        requirements: {
          chromeVersion: 'Chrome 138+',
          storageRequired: '22+ GB free storage',
          vramRequired: '4+ GB VRAM',
          networkRequired: true,
        },
      };
    }
  }

  // ============================================================================
  // Model Download Management
  // ============================================================================

  /**
   * Download Chrome AI model with progress tracking
   * Creates a summarizer instance which triggers the model download
   *
   * @param {function} onProgress - Progress callback
   * @returns {Promise<void>}
   */
  static async downloadModel(
    onProgress: (progress: DownloadProgress) => void,
  ): Promise<void> {
    const SummarizerAPI = this.getSummarizerAPI();

    if (!SummarizerAPI) {
      throw new Error('Summarizer API not available');
    }

    // Check availability first
    const availability = await SummarizerAPI.availability();
    console.log('[ChromeAIService] Current availability:', availability);

    if (availability === 'readily') {
      console.log(
        '[ChromeAIService] Model already available, no download needed',
      );
      // Model is already ready, just complete immediately
      onProgress({
        loaded: 22 * 1024 * 1024,
        total: 22 * 1024 * 1024,
        percentage: 100,
        timeRemaining: 0,
      });
      return;
    }

    if (availability === 'no') {
      throw new Error('Summarizer API not available on this device');
    }

    // Check for user activation (required for model download)
    if (
      typeof navigator !== 'undefined' &&
      'userActivation' in navigator &&
      !(navigator as Navigator & { userActivation?: { isActive: boolean } })
        .userActivation?.isActive
    ) {
      console.warn(
        '[ChromeAIService] User activation required for model download',
      );
      throw new Error(
        'Model download requires user interaction (e.g., button click)',
      );
    }

    console.log('[ChromeAIService] Starting model download...');

    return new Promise((resolve, reject) => {
      this.downloadStartTime = Date.now();
      this.downloadedBytes = 0;

      // Create summarizer which triggers download if needed
      // Include default options to ensure create() works properly
      const options = {
        type: 'tldr' as const,
        format: 'plain-text' as const,
        length: 'medium' as const,
        sharedContext: '',
        outputLanguage: 'en' as const,
        monitor(m: EventTarget) {
          console.log('[ChromeAIService] Monitor callback invoked');
          // Download progress event
          m.addEventListener('downloadprogress', (e: Event) => {
            const customEvent = e as { loaded?: number; total?: number };
            console.log('[ChromeAIService] Download progress:', {
              loaded: customEvent.loaded,
              total: customEvent.total,
            });

            const loaded = customEvent.loaded || 0;
            const total = customEvent.total || 22 * 1024 * 1024; // Default 22MB

            // Calculate download speed
            const elapsed =
              Date.now() - (ChromeAIService.downloadStartTime || Date.now());
            if (elapsed > 0) {
              ChromeAIService.downloadSpeed = (loaded / elapsed) * 1000; // bytes per second
            }

            // Update downloaded bytes
            ChromeAIService.downloadedBytes = loaded;

            const progress: DownloadProgress = {
              loaded,
              total,
              percentage: (loaded / total) * 100,
              timeRemaining: ChromeAIService.calculateTimeRemaining(
                loaded,
                total,
              ),
            };

            onProgress(progress);
          });
        },
      };

      console.log('[ChromeAIService] Calling Summarizer.create with options:', {
        type: options.type,
        format: options.format,
        length: options.length,
        outputLanguage: options.outputLanguage,
        hasMonitor: !!options.monitor,
      });

      // Create a timeout promise that rejects after 5 minutes (300 seconds)
      // Model download is ~22MB and can take several minutes on slower connections
      const DOWNLOAD_TIMEOUT = 5 * 60 * 1000; // 5 minutes
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              'Model download timed out after 5 minutes. Please check your internet connection and try again. If the download started, it may still be running in the background - try refreshing the page in a few minutes.',
            ),
          );
        }, DOWNLOAD_TIMEOUT);
      });

      // Race between create and timeout
      Promise.race([SummarizerAPI.create(options), timeoutPromise])
        .then((summarizer: unknown) => {
          console.log('[ChromeAIService] Summarizer created successfully');
          console.log(
            '[ChromeAIService] Final downloaded bytes:',
            ChromeAIService.downloadedBytes,
          );

          // Use setTimeout to ensure the final progress update is processed
          setTimeout(() => {
            // Download complete - model is ready
            onProgress({
              loaded: ChromeAIService.downloadedBytes || 22 * 1024 * 1024,
              total: 22 * 1024 * 1024,
              percentage: 100,
              timeRemaining: 0,
            });

            // Clean up the summarizer instance
            if (
              summarizer &&
              typeof summarizer === 'object' &&
              'destroy' in summarizer
            ) {
              console.log('[ChromeAIService] Destroying summarizer instance');
              (summarizer as { destroy: () => void }).destroy();
            }

            console.log('[ChromeAIService] Resolving promise');
            resolve();
          }, 100);
        })
        .catch((error: unknown) => {
          console.error('[ChromeAIService] Download failed:', error);
          if (error instanceof Error) {
            console.error('[ChromeAIService] Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack,
            });
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
   * Calculate estimated time remaining for download
   *
   * @param {number} loaded - Bytes downloaded
   * @param {number} total - Total bytes
   * @returns {number} Estimated seconds remaining
   */
  private static calculateTimeRemaining(loaded: number, total: number): number {
    if (loaded === 0 || this.downloadSpeed === 0) {
      return 0;
    }

    const remaining = total - loaded;
    const timeRemaining = remaining / this.downloadSpeed; // seconds

    return Math.round(timeRemaining);
  }

  // ============================================================================
  // Model Information
  // ============================================================================

  /**
   * Get model information
   *
   * @returns {object} Model information
   */
  static getModelInfo() {
    return {
      estimatedSize: 22 * 1024 * 1024, // 22MB
      estimatedSizeMB: 22,
      requirements: {
        chrome: '138+',
        storage: '22+ GB',
        vram: '4+ GB',
      },
    };
  }

  // ============================================================================
  // System Requirements Checker
  // ============================================================================

  /**
   * Check if system meets requirements
   * Note: This is a best-effort check, not guaranteed to be accurate
   * Storage check is informational only - Chrome manages model storage separately
   *
   * @returns {object} Requirements check results
   */
  static async checkSystemRequirements() {
    const userAgent = navigator.userAgent;
    const isChromeOrEdge = /Chrome|Edg/.test(userAgent);

    // Extract Chrome version
    let chromeVersion = 0;
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match) {
      chromeVersion = parseInt(match[1], 10);
    }

    // Check storage (estimate only)
    // Note: Browser storage quota is different from disk space
    // Chrome AI models are stored separately and managed by Chrome itself
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
            required: 22 * 1024 * 1024, // 22MB (actual model size, not 22GB)
            // Don't block based on browser storage quota
            // Chrome manages AI model storage separately from browser storage
            sufficient: true,
          }
        : null,
      online: navigator.onLine,
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Format bytes to human readable string
   *
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format time to human readable string
   *
   * @param {number} seconds - Seconds to format
   * @returns {string} Formatted string
   */
  static formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);

    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}m`;
  }
}

export default ChromeAIService;
