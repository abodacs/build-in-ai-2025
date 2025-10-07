/**
 * Language Detection Utilities
 *
 * Utilities for language detection and confidence scoring
 * @module utils/languageDetection
 */

import { type LanguageCode } from '../types';

/**
 * Language detection result
 */
export interface DetectionResult {
  /** Detected language code */
  language: LanguageCode;

  /** Confidence score (0-1) */
  confidence: number;

  /** Is detection reliable? */
  reliable: boolean;
}

/**
 * Simple heuristic-based language detection
 * This is a placeholder until Chrome AI Language Detector API is integrated
 */
export function detectLanguage(text: string): DetectionResult | null {
  if (!text || text.trim().length === 0) {
    return null;
  }

  // Simple heuristic detection
  const trimmedText = text.trim();

  // Check for Arabic script
  if (/[\u0600-\u06FF]/.test(trimmedText)) {
    return {
      language: 'ar',
      confidence: 0.9,
      reliable: true,
    };
  }

  // Check for Chinese characters
  if (/[\u4E00-\u9FFF]/.test(trimmedText)) {
    // Simplified vs Traditional is complex, default to simplified
    return {
      language: 'zh',
      confidence: 0.85,
      reliable: true,
    };
  }

  // Check for Japanese (Hiragana/Katakana)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmedText)) {
    return {
      language: 'ja',
      confidence: 0.9,
      reliable: true,
    };
  }

  // Check for Korean (Hangul)
  if (/[\uAC00-\uD7AF]/.test(trimmedText)) {
    return {
      language: 'ko',
      confidence: 0.9,
      reliable: true,
    };
  }

  // Check for Cyrillic script (Russian)
  if (/[\u0400-\u04FF]/.test(trimmedText)) {
    return {
      language: 'ru',
      confidence: 0.85,
      reliable: true,
    };
  }

  // Check for Hindi (Devanagari)
  if (/[\u0900-\u097F]/.test(trimmedText)) {
    return {
      language: 'hi',
      confidence: 0.9,
      reliable: true,
    };
  }

  // Default to English for Latin script
  return {
    language: 'en',
    confidence: 0.7,
    reliable: false,
  };
}

/**
 * Format confidence score for display
 */
export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(0)}%`;
}

/**
 * Get confidence level label
 */
export function getConfidenceLevel(
  confidence: number,
): 'high' | 'medium' | 'low' {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

/**
 * Estimate text complexity (for determining streaming threshold)
 */
export function estimateTextComplexity(text: string): {
  wordCount: number;
  charCount: number;
  complexity: 'simple' | 'moderate' | 'complex';
} {
  const charCount = text.length;
  const wordCount = text.trim().split(/\s+/).length;

  let complexity: 'simple' | 'moderate' | 'complex';
  if (wordCount < 50) {
    complexity = 'simple';
  } else if (wordCount < 100) {
    complexity = 'moderate';
  } else {
    complexity = 'complex';
  }

  return { wordCount, charCount, complexity };
}
