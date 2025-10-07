/**
 * Language Detection Utilities Test Suite
 *
 * Tests heuristic-based language detection utilities
 *
 * Coverage: 6 tests (4 happy path + 2 edge cases)
 */

import { describe, it, expect } from 'vitest';
import {
  detectLanguage,
  formatConfidence,
  getConfidenceLevel,
  estimateTextComplexity,
} from '../../utils/languageDetection';

describe('Language Detection Utilities', () => {
  // ==========================================================================
  // Happy Path Tests (4 tests)
  // ==========================================================================

  describe('Happy Path', () => {
    it('detects English text (default for Latin script)', () => {
      // Arrange
      const text = 'Hello, this is English text.';

      // Act
      const result = detectLanguage(text);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.language).toBe('en');
      expect(result?.confidence).toBe(0.7);
      expect(result?.reliable).toBe(false);
    });

    it('detects Arabic text with high confidence', () => {
      // Arrange
      const text = 'مرحبا بك في العالم';

      // Act
      const result = detectLanguage(text);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.language).toBe('ar');
      expect(result?.confidence).toBe(0.9);
      expect(result?.reliable).toBe(true);
    });

    it('detects Japanese text with Hiragana', () => {
      // Arrange
      const text = 'こんにちは'; // Hiragana only

      // Act
      const result = detectLanguage(text);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.language).toBe('ja');
      expect(result?.confidence).toBe(0.9);
      expect(result?.reliable).toBe(true);
    });

    it('formats confidence score as percentage', () => {
      // Act
      const high = formatConfidence(0.95);
      const medium = formatConfidence(0.65);
      const low = formatConfidence(0.35);

      // Assert
      expect(high).toBe('95%');
      expect(medium).toBe('65%');
      expect(low).toBe('35%');
    });
  });

  // ==========================================================================
  // Edge Cases (2 tests)
  // ==========================================================================

  describe('Edge Cases', () => {
    it('returns null for empty text', () => {
      // Act
      const empty = detectLanguage('');
      const whitespace = detectLanguage('   ');

      // Assert
      expect(empty).toBeNull();
      expect(whitespace).toBeNull();
    });

    it('estimates text complexity correctly', () => {
      // Arrange
      const simpleText = 'Hello world';
      const moderateText = Array(60).fill('word').join(' '); // 60 words
      const complexText = Array(120).fill('word').join(' '); // 120 words

      // Act
      const simple = estimateTextComplexity(simpleText);
      const moderate = estimateTextComplexity(moderateText);
      const complex = estimateTextComplexity(complexText);

      // Assert
      expect(simple.complexity).toBe('simple');
      expect(simple.wordCount).toBeLessThan(50);

      expect(moderate.complexity).toBe('moderate');
      expect(moderate.wordCount).toBeGreaterThanOrEqual(50);
      expect(moderate.wordCount).toBeLessThan(100);

      expect(complex.complexity).toBe('complex');
      expect(complex.wordCount).toBeGreaterThanOrEqual(100);
    });
  });
});
