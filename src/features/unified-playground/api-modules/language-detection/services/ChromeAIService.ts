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

export class ChromeAILanguageDetectionService {
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
      // Normalize 'readily' to 'available' for consistency
      return (status as any) === 'readily' ? 'available' : status;
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
    // Normalize 'readily' to 'available' for consistency
    const availability =
      (rawAvailability as any) === 'readily' ? 'available' : rawAvailability;

    if (availability === 'available') {
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
      throw new Error('LanguageDetector API not available on this device');
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

      // Create LanguageDetector instance with monitor to track download
      const options: LanguageDetectorCreateOptions = {
        monitor(m: EventTarget) {
          m.addEventListener('downloadprogress', (e: Event) => {
            const customEvent = e as { loaded?: number; total?: number };
            const loaded = customEvent.loaded || 0;
            const total = customEvent.total || 22 * 1024 * 1024; // Default 22MB

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
        .then((detector: unknown) => {
          // Use setTimeout to ensure the final progress update is processed
          setTimeout(() => {
            // Download complete - model is ready
            onProgress({
              loaded: downloadedBytes || 22 * 1024 * 1024,
              total: 22 * 1024 * 1024,
              percentage: 100,
              timeRemaining: 0,
            });

            // Clean up the detector instance
            if (
              detector &&
              typeof detector === 'object' &&
              'destroy' in detector
            ) {
              (detector as { destroy: () => void }).destroy();
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
            required: 22 * 1024 * 1024, // 22MB
            sufficient: true,
          }
        : null,
      online: navigator.onLine,
    };
  }
}

export default ChromeAILanguageDetectionService;
