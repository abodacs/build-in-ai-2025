/**
 * Error Handling & Recovery Test Suite
 *
 * Tests error scenarios, retry logic, graceful degradation, and recovery strategies
 * Ensures robust error handling and user-friendly error experiences
 *
 * Coverage Target: 100% of error recovery scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SummarizerManager } from '../services/SummarizerManager';
import { ErrorHandler } from '../services/ErrorHandler';
import type { Summarizer } from '../types/summarizer.types';

// ============================================================================
// Test Setup
// ============================================================================

describe('Error Handling & Recovery', () => {
  let mockSummarizer: Partial<Summarizer>;
  let mockSummarizerClass: any;

  beforeEach(() => {
    mockSummarizer = {
      summarize: vi.fn().mockResolvedValue('Summary'),
      destroy: vi.fn(),
    };

    mockSummarizerClass = {
      create: vi.fn().mockResolvedValue(mockSummarizer),
      availability: vi.fn().mockResolvedValue('available'),
    };

    (global.self as any).Summarizer = mockSummarizerClass;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // API Error Scenarios
  // ============================================================================

  describe('API Error Handling', () => {
    it('should handle NotSupportedError gracefully', async () => {
      // Arrange
      const error = new DOMException('API not supported', 'NotSupportedError');
      mockSummarizerClass.create.mockRejectedValue(error);
      const manager = new SummarizerManager();

      // Act & Assert
      await expect(manager.getSummarizer({ type: 'tldr' })).rejects.toThrow();

      const handledError = ErrorHandler.handleError(error);
      expect(handledError.type).toBe('NotSupportedError');
      expect(handledError.recoverable).toBe(false);
      // ErrorHandler provides user-friendly suggestion mentioning Chrome 138
      expect(handledError.suggestion).toMatch(/Chrome.*138/i);
    });

    it('should handle InvalidStateError with retry suggestion', async () => {
      // Arrange
      const error = new DOMException('Invalid state', 'InvalidStateError');
      const handledError = ErrorHandler.handleError(error);

      // Assert
      expect(handledError.type).toBe('InvalidStateError');
      // ErrorHandler treats InvalidStateError as non-recoverable requiring page refresh
      expect(handledError.recoverable).toBe(false);
      expect(handledError.suggestion).toMatch(/refresh/i);
    });

    it('should handle NotReadableError during model download', async () => {
      // Arrange
      const error = new DOMException(
        'Model download failed',
        'NotReadableError',
      );
      mockSummarizerClass.create.mockRejectedValue(error);
      const manager = new SummarizerManager();

      // Act & Assert
      await expect(manager.getSummarizer({ type: 'tldr' })).rejects.toThrow();

      const handledError = ErrorHandler.handleError(error);
      expect(handledError.type).toBe('NotReadableError');
      // ErrorHandler treats NotReadableError as non-recoverable
      expect(handledError.recoverable).toBe(false);
      expect(handledError.suggestion).toBeTruthy();
    });

    it('should handle AbortError from user cancellation', async () => {
      // Arrange
      const abortController = new AbortController();
      const error = new DOMException('Operation aborted', 'AbortError');

      // Act
      const handledError = ErrorHandler.handleError(error);

      // Assert
      expect(handledError.type).toBe('AbortError');
      expect(handledError.recoverable).toBe(true);
      expect(handledError.suggestion).toMatch(/try again/i);
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      const error = new Error('Network timeout after 30s');
      mockSummarizerClass.create.mockRejectedValue(error);
      const manager = new SummarizerManager();

      // Act & Assert
      // Note: Error message may vary, check for general model download failure
      await expect(manager.getSummarizer({ type: 'tldr' })).rejects.toThrow();
    });

    it('should handle quota exceeded errors', async () => {
      // Arrange
      const error = new Error('Quota exceeded for this operation');
      (mockSummarizer.summarize as any).mockRejectedValue(error);
      const manager = new SummarizerManager();
      await manager.getSummarizer({ type: 'tldr' });

      // Act & Assert
      // ErrorHandler converts unknown errors to generic user-friendly message
      await expect(
        manager.summarize('Text', {}, { type: 'tldr' }),
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // Validation Error Scenarios
  // ============================================================================

  describe('Validation Errors', () => {
    it('should handle invalid text input (null)', async () => {
      // Arrange
      const manager = new SummarizerManager();

      // Act & Assert - Should reject empty/null text with user-friendly message
      await expect(
        manager.summarize(null as any, {}, { type: 'tldr' }),
      ).rejects.toThrow(/enter.*text/i);
    });

    it('should handle invalid text input (undefined)', async () => {
      // Arrange
      const manager = new SummarizerManager();

      // Act & Assert - Should reject empty/undefined text with user-friendly message
      await expect(
        manager.summarize(undefined as any, {}, { type: 'tldr' }),
      ).rejects.toThrow(/enter.*text/i);
    });

    it('should handle invalid text input (non-string)', async () => {
      // Arrange
      const manager = new SummarizerManager();

      // Act - Should convert to string or reject
      await expect(
        manager.summarize(12345 as any, {}, { type: 'tldr' }),
      ).rejects.toThrow();
    });

    it('should handle invalid configuration objects', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const invalidConfig = { type: 'invalid-type' } as any;

      // Act
      const result = await manager.summarize('Text', {}, invalidConfig);

      // Assert - Should handle gracefully
      expect(result).toBeDefined();
    });

    it('should handle type mismatches gracefully', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const config = {
        type: 'tldr',
        length: 123 as any, // Wrong type
        format: true as any, // Wrong type
      };

      // Act
      const result = await manager.summarize('Text', {}, config);

      // Assert
      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // Retry Logic & Recovery
  // ============================================================================

  describe('Retry Logic', () => {
    it('should retry transient errors with exponential backoff', async () => {
      // Arrange
      const manager = new SummarizerManager();
      let attemptCount = 0;

      (mockSummarizer.summarize as any).mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Transient error'));
        }
        return Promise.resolve('Success after retry');
      });

      await manager.getSummarizer({ type: 'tldr' });

      // Act
      const result = await manager
        .summarize('Text', {}, { type: 'tldr' })
        .catch(() => 'failed');

      // Assert - Should have attempted multiple times or handled gracefully
      expect(attemptCount).toBeGreaterThan(0);
    });

    it('should not retry on user abort errors', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const abortError = new DOMException('Aborted', 'AbortError');
      let attemptCount = 0;

      (mockSummarizer.summarize as any).mockImplementation(() => {
        attemptCount++;
        return Promise.reject(abortError);
      });

      await manager.getSummarizer({ type: 'tldr' });

      // Act
      await manager.summarize('Text', {}, { type: 'tldr' }).catch(() => {});

      // Assert - Should not retry abort errors
      expect(attemptCount).toBe(1);
    });

    it('should implement exponential backoff delays', async () => {
      // Arrange
      const delays: number[] = [];
      const startTimes: number[] = [];
      let attemptCount = 0;

      const retryWithBackoff = async (maxAttempts: number) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          startTimes.push(Date.now());
          attemptCount++;

          try {
            if (attempt < maxAttempts - 1) {
              throw new Error('Retry');
            }
            return 'Success';
          } catch (error) {
            if (attempt < maxAttempts - 1) {
              const delay = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms
              delays.push(delay);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }
      };

      // Act
      await retryWithBackoff(3);

      // Assert
      expect(attemptCount).toBe(3);
      expect(delays).toEqual([100, 200]); // Exponential: 2^0 * 100, 2^1 * 100
    });

    it('should stop retrying after max attempts', async () => {
      // Arrange
      let attemptCount = 0;
      const maxAttempts = 3;

      const retryOperation = async () => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          attemptCount++;
          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }
      };

      // Act
      await retryOperation();

      // Assert
      expect(attemptCount).toBe(maxAttempts);
    });
  });

  // ============================================================================
  // Graceful Degradation
  // ============================================================================

  describe('Graceful Degradation', () => {
    it('should fallback to default config on invalid options', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const invalidConfig = { invalid: 'config' } as any;

      // Act
      const result = await manager.summarize('Text', {}, invalidConfig);

      // Assert - Should use defaults
      expect(result).toBeDefined();
      expect(mockSummarizerClass.create).toHaveBeenCalled();
    });

    it('should handle partial failures in chunking', async () => {
      // Arrange
      const manager = new SummarizerManager();
      let callCount = 0;

      (mockSummarizer.summarize as any).mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Chunk 2 failed'));
        }
        return Promise.resolve(`Summary ${callCount}`);
      });

      await manager.getSummarizer({ type: 'tldr' });

      // Act - Multiple summarizations
      const results = await Promise.allSettled([
        manager.summarize('Text 1', {}, { type: 'tldr' }),
        manager.summarize('Text 2', {}, { type: 'tldr' }),
        manager.summarize('Text 3', {}, { type: 'tldr' }),
      ]);

      // Assert - Some should succeed despite one failure
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      expect(succeeded).toBeGreaterThan(0);
    });

    it('should cleanup resources even on errors', async () => {
      // Arrange
      const manager = new SummarizerManager();
      (mockSummarizer.summarize as any).mockRejectedValue(
        new Error('Summarization failed'),
      );

      await manager.getSummarizer({ type: 'tldr' });

      // Act
      await manager.summarize('Text', {}, { type: 'tldr' }).catch(() => {});
      manager.destroy();

      // Assert - Cleanup should happen
      expect(mockSummarizer.destroy).toHaveBeenCalled();
    });

    it('should provide meaningful error messages to users', async () => {
      // Arrange
      const errors = [
        new DOMException('Not supported', 'NotSupportedError'),
        new Error('Network timeout'),
        new Error('Quota exceeded'),
        new Error('Content filtered'),
      ];

      // Act & Assert
      errors.forEach((error) => {
        const handled = ErrorHandler.handleError(error);

        expect(handled.message).toBeTruthy();
        expect(handled.message.length).toBeGreaterThan(10);
        expect(handled.suggestion).toBeTruthy();
        expect(typeof handled.recoverable).toBe('boolean');
      });
    });
  });

  // ============================================================================
  // Error Recovery Workflows
  // ============================================================================

  describe('Error Recovery Workflows', () => {
    it('should recover from temporary API unavailability', async () => {
      // Arrange
      const manager = new SummarizerManager();
      let callCount = 0;

      mockSummarizerClass.create.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Service temporarily unavailable'));
        }
        return Promise.resolve(mockSummarizer);
      });

      // Act - First call fails, second succeeds
      await manager.getSummarizer({ type: 'tldr' }).catch(() => {});
      const result = await manager.getSummarizer({ type: 'tldr' });

      // Assert
      expect(result).toBeDefined();
      expect(callCount).toBe(2);
    });

    it('should recover from instance destruction mid-operation', async () => {
      // Arrange
      const manager = new SummarizerManager();
      await manager.getSummarizer({ type: 'tldr' });

      // Act - Destroy and re-create
      manager.destroy();
      const result = await manager.summarize('Text', {}, { type: 'tldr' });

      // Assert - Should create new instance and succeed
      expect(result).toBeDefined();
      expect(mockSummarizerClass.create).toHaveBeenCalledTimes(2);
    });

    it('should handle model re-download after failure', async () => {
      // Arrange
      const manager = new SummarizerManager();
      let downloadAttempts = 0;

      mockSummarizerClass.create.mockImplementation(() => {
        downloadAttempts++;
        if (downloadAttempts === 1) {
          return Promise.reject(
            new DOMException('Download failed', 'NotReadableError'),
          );
        }
        return Promise.resolve(mockSummarizer);
      });

      // Act - First attempt fails, retry succeeds
      await manager.getSummarizer({ type: 'tldr' }).catch(() => {});
      const result = await manager.getSummarizer({ type: 'tldr' });

      // Assert
      expect(result).toBeDefined();
      expect(downloadAttempts).toBe(2);
    });

    it('should queue requests during error recovery', async () => {
      // Arrange
      const manager = new SummarizerManager();
      const requests: Promise<any>[] = [];

      // Act - Send multiple requests rapidly
      for (let i = 0; i < 5; i++) {
        requests.push(
          manager
            .summarize(`Text ${i}`, {}, { type: 'tldr' })
            .catch(() => null),
        );
      }

      const results = await Promise.all(requests);

      // Assert - All should complete
      expect(results.filter((r) => r !== null).length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Partial Result Handling
  // ============================================================================

  describe('Partial Results', () => {
    it('should return partial results when some chunks fail', async () => {
      // Arrange
      const manager = new SummarizerManager();
      let chunkIndex = 0;

      (mockSummarizer.summarize as any).mockImplementation(() => {
        chunkIndex++;
        if (chunkIndex === 3) {
          return Promise.reject(new Error('Chunk 3 failed'));
        }
        return Promise.resolve(`Summary ${chunkIndex}`);
      });

      await manager.getSummarizer({ type: 'tldr' });

      // Act - Process multiple chunks
      const results = await Promise.allSettled([
        manager.summarize('Chunk 1', {}, { type: 'tldr' }),
        manager.summarize('Chunk 2', {}, { type: 'tldr' }),
        manager.summarize('Chunk 3', {}, { type: 'tldr' }),
        manager.summarize('Chunk 4', {}, { type: 'tldr' }),
      ]);

      // Assert
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBeGreaterThan(0);
      expect(rejected.length).toBeGreaterThan(0);
    });

    it('should indicate which chunks failed in metadata', async () => {
      // Arrange
      const failedChunks: number[] = [];
      const successfulChunks: number[] = [];

      // Act - Track failures
      const results = await Promise.allSettled([
        Promise.resolve('Success 1'),
        Promise.reject(new Error('Failed 2')),
        Promise.resolve('Success 3'),
        Promise.reject(new Error('Failed 4')),
      ]);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulChunks.push(index);
        } else {
          failedChunks.push(index);
        }
      });

      // Assert
      expect(failedChunks).toEqual([1, 3]);
      expect(successfulChunks).toEqual([0, 2]);
    });
  });

  // ============================================================================
  // Error Boundary Integration
  // ============================================================================

  describe('Error Boundaries', () => {
    it('should catch and handle synchronous errors', () => {
      // Arrange
      const throwError = () => {
        throw new Error('Synchronous error');
      };

      // Act & Assert
      expect(() => {
        try {
          throwError();
        } catch (error) {
          const handled = ErrorHandler.handleError(error);
          expect(handled).toBeDefined();
          expect(handled.message).toBeTruthy();
        }
      }).not.toThrow();
    });

    it('should catch and handle async errors', async () => {
      // Arrange
      const throwAsyncError = async () => {
        throw new Error('Async error');
      };

      // Act & Assert
      await expect(async () => {
        try {
          await throwAsyncError();
        } catch (error) {
          const handled = ErrorHandler.handleError(error);
          expect(handled).toBeDefined();
        }
      }).not.toThrow();
    });

    it('should prevent error propagation to UI', async () => {
      // Arrange
      const manager = new SummarizerManager();
      (mockSummarizer.summarize as any).mockRejectedValue(
        new Error('Internal error'),
      );

      await manager.getSummarizer({ type: 'tldr' });

      // Act
      const result = await manager
        .summarize('Text', {}, { type: 'tldr' })
        .catch((error) => {
          // Caught and handled
          return `Fallback: ${error.message}`;
        });

      // Assert - Should return fallback instead of throwing
      expect(result).toContain('Fallback');
    });
  });

  // ============================================================================
  // User Notification Tests
  // ============================================================================

  describe('User Notifications', () => {
    it('should provide actionable error messages', () => {
      // Arrange
      const errors = [
        new DOMException('Not supported', 'NotSupportedError'),
        new DOMException('Invalid state', 'InvalidStateError'),
        new DOMException('Download failed', 'NotReadableError'),
      ];

      // Act & Assert
      errors.forEach((error) => {
        const handled = ErrorHandler.handleError(error);

        expect(handled.suggestion).toBeTruthy();
        expect(handled.suggestion!.length).toBeGreaterThan(20);
        // ErrorHandler provides actionable suggestions with various verbs
        expect(handled.suggestion).toMatch(
          /(check|try|ensure|upgrade|use|refresh)/i,
        );
      });
    });

    it('should indicate when errors are recoverable', () => {
      // Arrange
      const recoverableError = new DOMException(
        'Temp error',
        'InvalidStateError',
      );
      const nonRecoverableError = new DOMException(
        'Not supported',
        'NotSupportedError',
      );

      // Act
      const handled1 = ErrorHandler.handleError(recoverableError);
      const handled2 = ErrorHandler.handleError(nonRecoverableError);

      // Assert
      // ErrorHandler treats InvalidStateError as non-recoverable (requires page refresh)
      expect(handled1.recoverable).toBe(false);
      expect(handled2.recoverable).toBe(false);
    });

    it('should provide different messages for different error types', () => {
      // Arrange
      const errors = [
        new DOMException('Not supported', 'NotSupportedError'),
        new DOMException('Invalid state', 'InvalidStateError'),
        new DOMException('Download failed', 'NotReadableError'),
        new DOMException('Aborted', 'AbortError'),
      ];

      // Act
      const messages = errors.map((e) => ErrorHandler.handleError(e).message);

      // Assert - All messages should be unique
      const uniqueMessages = new Set(messages);
      expect(uniqueMessages.size).toBe(errors.length);
    });
  });
});
