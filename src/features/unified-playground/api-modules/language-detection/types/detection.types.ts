/**
 * Language Detection API Types
 *
 * Type definitions for Chrome AI Language Detection API.
 *
 * @module language-detection/types
 */

// ============================================================================
// Chrome AI API Types
// ============================================================================

/**
 * Language detection result
 */
export interface DetectionResult {
  /** Detected language code (BCP 47) */
  detectedLanguage: string;

  /** Confidence score (0.0-1.0) */
  confidence: number;
}

/**
 * Options for creating Language Detector instance
 */
export interface LanguageDetectorCreateOptions {
  /** Abort signal for cancellation */
  signal?: AbortSignal;

  /** Download progress monitor */
  monitor?: (monitor: EventTarget) => void;
}

/**
 * Chrome AI Language Detector instance
 */
export interface LanguageDetector {
  /**
   * Detect language from text
   * Returns array of results sorted by confidence (highest first)
   */
  detect(input: string): Promise<DetectionResult[]>;

  /**
   * Destroy the instance
   */
  destroy(): void;
}

/**
 * Chrome AI Language Detector API
 */
export interface LanguageDetectorAPI {
  create(options?: LanguageDetectorCreateOptions): Promise<LanguageDetector>;
  availability(): Promise<'no' | 'after-download' | 'available'>;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Language Detection configuration
 */
export interface DetectionConfig {
  /** Minimum confidence threshold (0.0-1.0) */
  confidenceThreshold: number;

  /** Maximum number of candidates to show */
  maxCandidates: number;

  /** Show all candidates or only above threshold */
  showAllCandidates: boolean;
}

/**
 * Default Language Detection configuration
 */
export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  confidenceThreshold: 0.5,
  maxCandidates: 5,
  showAllCandidates: false,
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if Language Detector API is available
 */
export function isLanguageDetectorSupported(): boolean {
  return typeof window !== 'undefined' && 'LanguageDetector' in window;
}

/**
 * Get Language Detector API
 */
export function getLanguageDetectorAPI(): LanguageDetectorAPI | null {
  if (!isLanguageDetectorSupported()) {
    return null;
  }

  return (window as any).LanguageDetector as LanguageDetectorAPI;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get confidence level label
 */
export function getConfidenceLevel(
  confidence: number,
): 'very-high' | 'high' | 'medium' | 'low' | 'very-low' {
  if (confidence >= 0.9) return 'very-high';
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.5) return 'medium';
  if (confidence >= 0.3) return 'low';
  return 'very-low';
}

/**
 * Get confidence color for UI
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return 'green';
  if (confidence >= 0.7) return 'blue';
  if (confidence >= 0.5) return 'yellow';
  if (confidence >= 0.3) return 'orange';
  return 'red';
}

/**
 * Get language name from code
 */
export function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    'zh-Hant': 'Chinese (Traditional)',
    ru: 'Russian',
    ar: 'Arabic',
    hi: 'Hindi',
    nl: 'Dutch',
    sv: 'Swedish',
    no: 'Norwegian',
    da: 'Danish',
    fi: 'Finnish',
    pl: 'Polish',
    tr: 'Turkish',
    el: 'Greek',
    he: 'Hebrew',
    th: 'Thai',
    vi: 'Vietnamese',
    id: 'Indonesian',
  };

  return names[code] || code.toUpperCase();
}

// ============================================================================
// Exports
// ============================================================================

export type { DetectionConfig as LanguageDetectionConfig };
