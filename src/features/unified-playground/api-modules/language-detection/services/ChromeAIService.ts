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
import type { AvailabilityStatus } from '../../shared/types';

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
      return await api.availability();
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
}

export default ChromeAILanguageDetectionService;
