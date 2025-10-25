/**
 * Chrome AI Language Detection Service
 *
 * @module language-detection/services/ChromeAIService
 */

import type {
  LanguageDetector,
  LanguageDetectorAPI,
  LanguageDetectorCreateOptions,
  DetectionResult,
} from '../types';
import type { AvailabilityStatus, DownloadProgress } from '../../shared/types';
import { normalizeAvailability } from '../../shared/utils/normalizeAvailability';

export class ChromeAILanguageDetectionService {
  // ============================================================================
  // Download Tracking Properties
  // ============================================================================

  /** Download start timestamp for speed calculation */
  private static downloadStartTime: number | null = null;

  /** Current downloaded bytes for progress tracking */
  private static downloadedBytes: number = 0;

  /** Current download speed in bytes per second */
  private static downloadSpeed: number = 0;

  // ============================================================================
  // Public Methods
  // ============================================================================

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'LanguageDetector' in window;
  }

  private static getAPI(): LanguageDetectorAPI {
    if (!this.isSupported()) {
      throw new Error('LanguageDetector API not supported in this browser.');
    }
    return (window as any).LanguageDetector as LanguageDetectorAPI;
  }

  static async checkAvailability(): Promise<AvailabilityStatus> {
    try {
      if (!this.isSupported()) return 'no';
      const api = this.getAPI();
      const status = await api.availability();
      // Normalize Chrome API status to internal AvailabilityStatus
      return normalizeAvailability(status);
    } catch (error) {
      console.error(
        '[ChromeAILanguageDetectionService] Availability check failed:',
        error,
      );
      return 'no';
    }
  }

  static async createInstance(
    options: LanguageDetectorCreateOptions = {},
  ): Promise<LanguageDetector> {
    const api = this.getAPI();
    return await api.create(options);
  }

  static async detect(
    instance: LanguageDetector,
    input: string,
  ): Promise<DetectionResult[]> {
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      throw new Error('Input must be a non-empty string');
    }
    return await instance.detect(input);
  }

  static destroy(instance: LanguageDetector): void {
    try {
      instance.destroy();
    } catch (error) {
      console.error(
        '[ChromeAILanguageDetectionService] Error destroying instance:',
        error,
      );
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Format bytes to human-readable size
   *
   * @param bytes - Number of bytes
   * @returns Formatted string (e.g., "22.5 MB")
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Calculate estimated time remaining for download
   *
   * @param loaded - Bytes downloaded so far
   * @param total - Total bytes to download
   * @returns Estimated seconds remaining (0 if speed is unknown)
   */
  private static calculateTimeRemaining(loaded: number, total: number): number {
    if (this.downloadSpeed === 0) return 0;
    const remaining = total - loaded;
    return Math.round(remaining / this.downloadSpeed);
  }

  // ============================================================================
  // Download Methods
  // ============================================================================

  /**
   * Download LanguageDetector model with progress tracking
   *
   * Creates a LanguageDetector instance which triggers the model download if needed.
   *
   * @param onProgress - Progress callback
   * @returns Promise that resolves when download completes
   */
  static async downloadModel(
    onProgress: (progress: DownloadProgress) => void,
  ): Promise<void> {
    const api = this.getAPI();

    // Check availability first
    const rawAvailability = await api.availability();
    console.log(
      '[ChromeAILanguageDetectionService] Raw availability:',
      rawAvailability,
    );

    // Check if model is already available (handles both 'available' and legacy 'readily')
    if (
      rawAvailability === 'available' ||
      (rawAvailability as any) === 'readily'
    ) {
      console.log(
        '[ChromeAILanguageDetectionService] Model already available, no download needed',
      );
      // Model is already ready, just complete immediately
      onProgress({
        loaded: 22 * 1024 * 1024,
        total: 22 * 1024 * 1024,
        percentage: 100,
        speed: 0,
        timeRemaining: 0,
      });
      return;
    }

    // Check if unavailable (handle both Chrome API and internal values)
    const availStr = String(rawAvailability);
    if (availStr === 'unavailable' || availStr === 'no') {
      throw new Error('LanguageDetector API not available on this device');
    }

    // Check for user activation (required for model download)
    if (
      typeof navigator !== 'undefined' &&
      'userActivation' in navigator &&
      !(navigator as Navigator & { userActivation?: { isActive: boolean } })
        .userActivation?.isActive
    ) {
      console.warn(
        '[ChromeAILanguageDetectionService] User activation required for model download',
      );
      throw new Error(
        'Model download requires user interaction (e.g., button click)',
      );
    }

    console.log(
      '[ChromeAILanguageDetectionService] Starting model download...',
    );

    return new Promise((resolve, reject) => {
      this.downloadStartTime = Date.now();
      this.downloadedBytes = 0;

      // Create LanguageDetector instance with monitor to track download
      const options: LanguageDetectorCreateOptions = {
        monitor(m: EventTarget) {
          console.log(
            '[ChromeAILanguageDetectionService] Monitor callback invoked',
          );

          // Download progress event
          m.addEventListener('downloadprogress', (e: Event) => {
            const customEvent = e as { loaded?: number; total?: number };
            console.log(
              '[ChromeAILanguageDetectionService] Download progress:',
              {
                loaded: customEvent.loaded,
                total: customEvent.total,
              },
            );

            const loaded = customEvent.loaded || 0;
            const total = customEvent.total || 22 * 1024 * 1024; // Default 22MB

            // Calculate download speed
            const elapsed =
              Date.now() -
              (ChromeAILanguageDetectionService.downloadStartTime ||
                Date.now());
            if (elapsed > 0) {
              ChromeAILanguageDetectionService.downloadSpeed =
                (loaded / elapsed) * 1000; // bytes per second
            }

            // Update downloaded bytes
            ChromeAILanguageDetectionService.downloadedBytes = loaded;

            const progress: DownloadProgress = {
              loaded,
              total,
              percentage: (loaded / total) * 100,
              speed: ChromeAILanguageDetectionService.downloadSpeed,
              timeRemaining:
                ChromeAILanguageDetectionService.calculateTimeRemaining(
                  loaded,
                  total,
                ),
            };

            console.log(
              `[ChromeAILanguageDetectionService] Progress: ${progress.percentage.toFixed(1)}% ` +
                `(${ChromeAILanguageDetectionService.formatBytes(loaded)} / ${ChromeAILanguageDetectionService.formatBytes(total)}) ` +
                `Speed: ${ChromeAILanguageDetectionService.formatBytes(progress.speed || 0)}/s ` +
                `ETA: ${progress.timeRemaining}s`,
            );

            onProgress(progress);
          });

          // Download complete event
          m.addEventListener('downloadcomplete', () => {
            console.log(
              '[ChromeAILanguageDetectionService] Download complete event received',
            );
          });

          // Download error event
          m.addEventListener('downloaderror', (e: Event) => {
            const errorEvent = e as { detail?: { message?: string } };
            console.error(
              '[ChromeAILanguageDetectionService] Download error event:',
              errorEvent.detail?.message || 'Unknown error',
            );
          });
        },
      };

      console.log(
        '[ChromeAILanguageDetectionService] Calling LanguageDetector.create with monitor',
      );

      // Create a timeout promise that rejects after 2 minutes
      // Model download is ~22MB and should complete quickly on most connections
      const DOWNLOAD_TIMEOUT = 2 * 60 * 1000; // 2 minutes
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              'Model download timed out after 2 minutes. Please check your internet connection and try again. If the download started, it may still be running in the background - try refreshing the page in a few minutes.',
            ),
          );
        }, DOWNLOAD_TIMEOUT);
      });

      console.log(
        '[ChromeAILanguageDetectionService] Starting create() with 2-minute timeout',
      );

      // Race between create and timeout
      Promise.race([api.create(options), timeoutPromise])
        .then((detector: unknown) => {
          console.log(
            '[ChromeAILanguageDetectionService] Instance created successfully',
          );

          // Use setTimeout to ensure the final progress update is processed
          setTimeout(() => {
            console.log(
              '[ChromeAILanguageDetectionService] Sending final progress update',
            );

            // Download complete - model is ready
            onProgress({
              loaded:
                ChromeAILanguageDetectionService.downloadedBytes ||
                22 * 1024 * 1024,
              total: 22 * 1024 * 1024,
              percentage: 100,
              speed: ChromeAILanguageDetectionService.downloadSpeed,
              timeRemaining: 0,
            });

            console.log(
              '[ChromeAILanguageDetectionService] Cleaning up detector instance',
            );

            // Clean up the detector instance
            if (
              detector &&
              typeof detector === 'object' &&
              'destroy' in detector
            ) {
              (detector as { destroy: () => void }).destroy();
            }

            console.log(
              '[ChromeAILanguageDetectionService] Download complete, resolving promise',
            );
            resolve();
          }, 100);
        })
        .catch((error: unknown) => {
          console.error(
            '[ChromeAILanguageDetectionService] Download failed:',
            error,
          );

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
            required: 22 * 1024 * 1024, // 22MB
            sufficient: true,
          }
        : null,
      online: navigator.onLine,
    };
  }
}

export default ChromeAILanguageDetectionService;
