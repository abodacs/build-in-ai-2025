/**
 * Chrome AI Error Handler
 *
 * Centralized error handling for Chrome AI Summarizer API
 * Provides user-friendly error messages and recovery suggestions
 *
 * @module ErrorHandler
 */

import type {
  SummarizerError,
  SummarizerErrorType,
} from '../types/summarizer.types';
import {
  getErrorMessageWithContext,
  mapTechnicalErrorToCode,
  type ErrorCode,
} from '../../shared/utils/errorMessages';

// ============================================================================
// Error Handler Service
// ============================================================================

export class ErrorHandler {
  /**
   * Parse and handle Chrome AI errors
   * Converts browser errors into structured, user-friendly error objects
   *
   * @param {unknown} error - Raw error from Chrome AI API
   * @returns {SummarizerError} Structured error with recovery suggestions
   */
  static handleError(error: unknown): SummarizerError {
    // Handle DOMException errors from Chrome AI
    if (error instanceof DOMException) {
      return this.handleDOMException(error);
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      return this.handleStandardError(error);
    }

    // Handle unknown error types
    const unknownError = getErrorMessageWithContext('UNKNOWN_ERROR');
    return {
      type: 'NotSupportedError',
      message: unknownError.message,
      recoverable: false,
      suggestion: unknownError.helpText || '',
    };
  }

  /**
   * Handle DOMException errors from Chrome AI API
   *
   * @param {DOMException} error - DOM exception
   * @returns {SummarizerError} Structured error
   */
  private static handleDOMException(error: DOMException): SummarizerError {
    const errorName = error.name as SummarizerErrorType;

    // Map technical error name to user-friendly error code
    const errorCode = mapTechnicalErrorToCode(errorName);
    const errorMessage = getErrorMessageWithContext(errorCode);

    return {
      type: errorName,
      message: errorMessage.message,
      recoverable: errorMessage.severity !== 'error',
      suggestion: errorMessage.helpText || '',
    };
  }

  /**
   * Handle standard Error objects
   *
   * @param {Error} error - Standard error
   * @returns {SummarizerError} Structured error
   */
  private static handleStandardError(error: Error): SummarizerError {
    // Check for specific error messages
    const message = error.message.toLowerCase();

    // Determine error code based on error message content
    let errorCode: ErrorCode = 'UNKNOWN_ERROR';

    if (message.includes('not supported') || message.includes('undefined')) {
      errorCode = 'API_NOT_SUPPORTED';
    } else if (message.includes('download') || message.includes('network')) {
      errorCode = 'MODEL_DOWNLOAD_FAILED';
    } else if (message.includes('abort') || message.includes('cancel')) {
      errorCode = 'OPERATION_CANCELLED';
    } else if (message.includes('invalid') || message.includes('state')) {
      errorCode = 'INVALID_STATE';
    }

    // Get plain language error message
    const errorMessage = getErrorMessageWithContext(errorCode);

    // Map error code to SummarizerErrorType
    const errorType = this.mapErrorCodeToType(errorCode);

    return {
      type: errorType,
      message: errorMessage.message,
      recoverable: errorMessage.severity !== 'error',
      suggestion: errorMessage.helpText || '',
    };
  }

  /**
   * Map error code to SummarizerErrorType
   *
   * @param {ErrorCode} code - Error code
   * @returns {SummarizerErrorType} Summarizer error type
   */
  private static mapErrorCodeToType(code: ErrorCode): SummarizerErrorType {
    switch (code) {
      case 'API_NOT_SUPPORTED':
        return 'NotSupportedError';
      case 'MODEL_DOWNLOAD_FAILED':
      case 'NETWORK_ERROR':
        return 'NotReadableError';
      case 'OPERATION_CANCELLED':
        return 'AbortError';
      case 'INVALID_STATE':
        return 'InvalidStateError';
      default:
        return 'NotSupportedError';
    }
  }

  /**
   * Check if an error is recoverable
   *
   * @param {SummarizerError} error - Structured error
   * @returns {boolean} True if error is recoverable
   */
  static isRecoverable(error: SummarizerError): boolean {
    return error.recoverable;
  }

  /**
   * Get user-friendly error message
   *
   * @param {SummarizerError} error - Structured error
   * @returns {string} User-friendly message
   */
  static getUserMessage(error: SummarizerError): string {
    return `${error.message}\n\n${error.suggestion}`;
  }

  /**
   * Format error for logging
   *
   * @param {SummarizerError} error - Structured error
   * @returns {string} Formatted error log
   */
  static formatForLogging(error: SummarizerError): string {
    return `[Chrome AI Error] ${error.type}: ${error.message} | Recoverable: ${error.recoverable}`;
  }

  /**
   * Create a custom error with context
   *
   * @param {string} message - Error message
   * @param {string} context - Additional context
   * @returns {SummarizerError} Structured error
   */
  static createContextualError(
    message: string,
    context: string,
  ): SummarizerError {
    return {
      type: 'NotSupportedError',
      message: `${message} (Context: ${context})`,
      recoverable: false,
      suggestion: 'Please check your configuration and try again.',
    };
  }

  /**
   * Handle model download errors specifically
   *
   * @param {unknown} error - Raw error
   * @param {number} bytesDownloaded - Bytes downloaded before failure
   * @returns {SummarizerError} Structured error
   */
  static handleDownloadError(
    error: unknown,
    bytesDownloaded: number = 0,
  ): SummarizerError {
    const baseError = this.handleError(error);

    if (baseError.type === 'NotReadableError') {
      const percentComplete =
        (bytesDownloaded / (22 * 1024 * 1024 * 1024)) * 100;
      const errorMessage = getErrorMessageWithContext('MODEL_DOWNLOAD_FAILED', {
        progress: percentComplete.toFixed(1),
      });

      return {
        ...baseError,
        message: errorMessage.message,
        suggestion: errorMessage.helpText || baseError.suggestion,
      };
    }

    return baseError;
  }

  /**
   * Handle summarization errors with input context
   *
   * @param {unknown} error - Raw error
   * @param {number} inputLength - Length of input text
   * @returns {SummarizerError} Structured error
   */
  static handleSummarizationError(
    error: unknown,
    inputLength: number = 0,
  ): SummarizerError {
    // Handle empty input
    if (inputLength === 0) {
      const emptyError = getErrorMessageWithContext('INPUT_EMPTY');
      return {
        type: 'InvalidStateError',
        message: emptyError.message,
        recoverable: true,
        suggestion: emptyError.helpText || '',
      };
    }

    const baseError = this.handleError(error);

    // Add context-specific suggestions for very long input
    if (inputLength > 100000) {
      const lengthWarning = getErrorMessageWithContext('INPUT_TOO_LONG', {
        currentLength: inputLength,
        maxLength: 100000,
      });

      return {
        ...baseError,
        suggestion: `${baseError.suggestion}\n\n${lengthWarning.helpText}`,
      };
    }

    return baseError;
  }

  /**
   * Validate system requirements and return structured error if failed
   *
   * @param {object} requirements - System requirements check result
   * @returns {SummarizerError | null} Error if requirements not met, null otherwise
   */
  static validateSystemRequirements(requirements: {
    browser: { supported: boolean; version: number; requiredVersion: number };
    storage: {
      available: number;
      required: number;
      sufficient: boolean;
    } | null;
    online: boolean;
  }): SummarizerError | null {
    if (!requirements.browser.supported) {
      const browserError = getErrorMessageWithContext('BROWSER_NOT_SUPPORTED', {
        currentVersion: requirements.browser.version,
        requiredVersion: requirements.browser.requiredVersion,
      });

      return {
        type: 'NotSupportedError',
        message: browserError.message,
        recoverable: false,
        suggestion: browserError.helpText || '',
      };
    }

    if (requirements.storage && !requirements.storage.sufficient) {
      const availableGB = (
        requirements.storage.available /
        (1024 * 1024 * 1024)
      ).toFixed(1);
      const requiredGB = (
        requirements.storage.required /
        (1024 * 1024 * 1024)
      ).toFixed(1);

      const storageError = getErrorMessageWithContext('STORAGE_ERROR', {
        available: availableGB,
        required: requiredGB,
      });

      return {
        type: 'NotReadableError',
        message: storageError.message,
        recoverable: true,
        suggestion: storageError.helpText || '',
      };
    }

    if (!requirements.online) {
      const networkError = getErrorMessageWithContext('NETWORK_ERROR');

      return {
        type: 'NotReadableError',
        message: networkError.message,
        recoverable: true,
        suggestion: networkError.helpText || '',
      };
    }

    return null;
  }

  /**
   * Create recovery action for common errors
   *
   * @param {SummarizerError} error - Structured error
   * @returns {(() => Promise<void>) | undefined} Recovery action if available
   */
  static getRecoveryAction(
    error: SummarizerError,
  ): (() => Promise<void>) | undefined {
    if (!error.recoverable) {
      return undefined;
    }

    switch (error.type) {
      case 'InvalidStateError':
        return async () => {
          console.log(
            'Recovery: Attempting to create new summarizer instance...',
          );
          // This would be implemented by the caller
          // Return a promise that the UI can use to trigger recreation
        };

      case 'NotReadableError':
        return async () => {
          console.log('Recovery: Attempting to retry download...');
          // This would be implemented by the caller
          // Return a promise that the UI can use to trigger retry
        };

      case 'AbortError':
        return async () => {
          console.log('Recovery: Ready to retry operation...');
          // Simple recovery - just indicate readiness to retry
        };

      default:
        return undefined;
    }
  }
}

export default ErrorHandler;
