/**
 * ErrorHandler Test Suite
 *
 * Production-grade tests for Chrome AI Error Handler
 * Tests error classification, user-friendly messaging, and recovery suggestions
 *
 * Coverage Target: 100%
 */

import { describe, it, expect } from 'vitest';
import { ErrorHandler } from '../services/ErrorHandler';
import type { SummarizerError } from '../types/summarizer.types';

// ============================================================================
// Error Handler Tests
// ============================================================================

describe('ErrorHandler', () => {
  // ============================================================================
  // DOMException Handling
  // ============================================================================

  describe('DOMException Handling', () => {
    it('should handle NotSupportedError correctly', () => {
      // Arrange
      const error = new DOMException('API not supported', 'NotSupportedError');

      // Act
      const result = ErrorHandler.handleError(error);

      // Assert
      expect(result).toMatchObject<SummarizerError>({
        type: 'NotSupportedError',
        message: expect.stringContaining('not supported'),
        recoverable: false,
        suggestion: expect.stringContaining('Chrome 138+'),
      });
      expect(result.suggestion).toContain('Summarization API for Gemini Nano');
    });

    it('should handle InvalidStateError correctly', () => {
      // Arrange
      const error = new DOMException('Invalid state', 'InvalidStateError');

      // Act
      const result = ErrorHandler.handleError(error);

      // Assert
      expect(result).toMatchObject<SummarizerError>({
        type: 'InvalidStateError',
        message: expect.stringContaining('invalid state'),
        recoverable: true,
        suggestion: expect.stringContaining('new summarizer instance'),
      });
    });

    it('should handle NotReadableError correctly', () => {
      // Arrange
      const error = new DOMException(
        'Failed to read model',
        'NotReadableError',
      );

      // Act
      const result = ErrorHandler.handleError(error);

      // Assert
      expect(result).toMatchObject<SummarizerError>({
        type: 'NotReadableError',
        message: expect.stringContaining('download or read'),
        recoverable: true,
      });
      expect(result.suggestion).toContain('storage');
      expect(result.suggestion).toContain('connection');
    });

    it('should handle AbortError correctly', () => {
      // Arrange
      const error = new DOMException('Operation aborted', 'AbortError');

      // Act
      const result = ErrorHandler.handleError(error);

      // Assert
      expect(result).toMatchObject<SummarizerError>({
        type: 'AbortError',
        message: expect.stringMatching(/(abort|cancel)/i),
        recoverable: true,
      });
      expect(result.suggestion).toMatch(/try again/i);
    });
  });

  // ============================================================================
  // Standard Error Handling
  // ============================================================================

  describe('Standard Error Handling', () => {
    it('should handle generic Error objects', () => {
      // Arrange
      const error = new Error('Something went wrong');

      // Act
      const result = ErrorHandler.handleError(error);

      // Assert
      expect(result).toMatchObject<SummarizerError>({
        type: 'NotSupportedError',
        message: expect.any(String),
        recoverable: expect.any(Boolean),
        suggestion: expect.any(String),
      });
    });

    it('should provide actionable error messages', () => {
      // Arrange
      const error = new Error('Test error');

      // Act
      const result = ErrorHandler.handleError(error);

      // Assert
      expect(result.message).toBeTruthy();
      expect(result.suggestion).toBeTruthy();
    });
  });

  // ============================================================================
  // Unknown Error Handling
  // ============================================================================

  describe('Unknown Error Handling', () => {
    it('should handle null errors', () => {
      // Act
      const result = ErrorHandler.handleError(null);

      // Assert
      expect(result).toMatchObject<SummarizerError>({
        type: 'NotSupportedError',
        message: 'An unknown error occurred',
        recoverable: false,
        suggestion: expect.stringContaining('reload'),
      });
    });

    it('should handle undefined errors', () => {
      // Act
      const result = ErrorHandler.handleError(undefined);

      // Assert
      expect(result).toMatchObject<SummarizerError>({
        type: 'NotSupportedError',
        message: 'An unknown error occurred',
        recoverable: false,
      });
    });
  });

  // ============================================================================
  // Error Message Quality
  // ============================================================================

  describe('Error Message Quality', () => {
    it('should provide user-friendly messages', () => {
      // Arrange
      const error = new DOMException('API not supported', 'NotSupportedError');

      // Act
      const result = ErrorHandler.handleError(error);

      // Assert
      expect(result.message).not.toContain('undefined');
      expect(result.message).not.toContain('null');
      expect(result.message.length).toBeGreaterThan(10);
    });

    it('should provide actionable suggestions', () => {
      // Arrange
      const error = new DOMException(
        'Model download failed',
        'NotReadableError',
      );

      // Act
      const result = ErrorHandler.handleError(error);

      // Assert
      expect(result.suggestion).toBeTruthy();
      expect(result.suggestion!.length).toBeGreaterThan(20);
    });

    it('should indicate recoverability correctly', () => {
      // Arrange
      const notSupportedError = new DOMException(
        'Not supported',
        'NotSupportedError',
      );
      const invalidStateError = new DOMException(
        'Invalid state',
        'InvalidStateError',
      );

      // Act
      const result1 = ErrorHandler.handleError(notSupportedError);
      const result2 = ErrorHandler.handleError(invalidStateError);

      // Assert
      expect(result1.recoverable).toBe(false); // Can't recover from unsupported API
      expect(result2.recoverable).toBe(true); // Can recover from invalid state
    });
  });

  // ============================================================================
  // Output Consistency
  // ============================================================================

  describe('Output Consistency', () => {
    it('should always return complete error objects', () => {
      // Arrange
      const testErrors = [
        new Error('Test 1'),
        new DOMException('Test 2', 'NotSupportedError'),
        null,
        undefined,
      ];

      // Act & Assert
      testErrors.forEach((error) => {
        const result = ErrorHandler.handleError(error);

        // All fields should be present
        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('recoverable');
        expect(result).toHaveProperty('suggestion');

        // Type and message should never be empty
        expect(result.type).toBeTruthy();
        expect(result.message).toBeTruthy();
        expect(typeof result.recoverable).toBe('boolean');
      });
    });
  });
});
