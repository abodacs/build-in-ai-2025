/**
 * BCP 47 Utilities Test Suite
 *
 * Tests BCP 47 language code validation and utilities
 *
 * Coverage: 8 tests (5 happy path + 3 edge cases)
 */

import { describe, it, expect } from 'vitest';
import {
  isValidLanguageCode,
  getLanguageInfo,
  getSupportedLanguageCodes,
  formatLanguageCode,
  getLanguagePairKey,
  parseLanguagePairKey,
  isRTLLanguage,
  getTextDirection,
} from '../../utils/bcp47';

describe('BCP 47 Utilities', () => {
  // ==========================================================================
  // Happy Path Tests (5 tests)
  // ==========================================================================

  describe('Happy Path', () => {
    it('validates supported language codes', () => {
      // Act & Assert
      expect(isValidLanguageCode('en')).toBe(true);
      expect(isValidLanguageCode('es')).toBe(true);
      expect(isValidLanguageCode('zh')).toBe(true);
      expect(isValidLanguageCode('invalid')).toBe(false);
    });

    it('returns language info for valid code', () => {
      // Act
      const enInfo = getLanguageInfo('en');

      // Assert
      expect(enInfo).toBeDefined();
      expect(enInfo.code).toBe('en');
      expect(enInfo.name).toBe('English');
      expect(enInfo.nativeName).toBe('English');
      expect(enInfo.flag).toBe('🇬🇧');
      expect(enInfo.isRTL).toBe(false);
    });

    it('lists all supported language codes', () => {
      // Act
      const codes = getSupportedLanguageCodes();

      // Assert
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
      expect(codes).toContain('en');
      expect(codes).toContain('es');
      expect(codes).toContain('zh');
    });

    it('formats language code for display', () => {
      // Act
      const enDisplay = formatLanguageCode('en');
      const esDisplay = formatLanguageCode('es');

      // Assert
      expect(enDisplay).toContain('English');
      expect(enDisplay).toContain('en');
      expect(enDisplay).toContain('🇬🇧');
      expect(esDisplay).toContain('Spanish');
      expect(esDisplay).toContain('es');
    });

    it('creates and parses language pair keys', () => {
      // Act
      const key = getLanguagePairKey('en', 'es');
      const parsed = parseLanguagePairKey(key);

      // Assert
      expect(key).toBe('en→es');
      expect(parsed).toBeDefined();
      expect(parsed?.source).toBe('en');
      expect(parsed?.target).toBe('es');
    });
  });

  // ==========================================================================
  // Edge Cases (3 tests)
  // ==========================================================================

  describe('Edge Cases', () => {
    it('identifies RTL languages correctly', () => {
      // Act & Assert
      expect(isRTLLanguage('ar')).toBe(true);
      expect(isRTLLanguage('en')).toBe(false);
      expect(isRTLLanguage('es')).toBe(false);
      expect(isRTLLanguage('zh')).toBe(false);
    });

    it('returns correct text direction', () => {
      // Act & Assert
      expect(getTextDirection('ar')).toBe('rtl');
      expect(getTextDirection('en')).toBe('ltr');
      expect(getTextDirection('es')).toBe('ltr');
      expect(getTextDirection('ja')).toBe('ltr');
    });

    it('returns null for invalid language pair key', () => {
      // Act
      const invalid1 = parseLanguagePairKey('invalid');
      const invalid2 = parseLanguagePairKey('en');
      const invalid3 = parseLanguagePairKey('xx→yy');

      // Assert
      expect(invalid1).toBeNull();
      expect(invalid2).toBeNull();
      expect(invalid3).toBeNull();
    });
  });
});
