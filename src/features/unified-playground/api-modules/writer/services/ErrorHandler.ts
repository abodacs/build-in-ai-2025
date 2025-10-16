/**
 * Writer Error Handler
 *
 * Centralized error handling for Chrome AI Writer API
 * Provides user-friendly error messages and recovery suggestions
 *
 * @module writer/services/ErrorHandler
 */

import {
  getErrorMessageWithContext,
  mapTechnicalErrorToCode,
  type ErrorCode,
} from '../../shared/utils/errorMessages';

// ============================================================================
// Types
// ============================================================================

export type WriterErrorType =
  | 'NotSupportedError'
  | 'InvalidStateError'
  | 'NotReadableError'
  | 'AbortError'
  | 'UserActivationError';

export interface WriterError {
  type: WriterErrorType;
  message: string;
  recoverable: boolean;
  suggestion: string;
}

// ============================================================================
// Error Handler Service
// ============================================================================

export class WriterErrorHandler {
  /**
   * Parse and handle Chrome AI Writer errors
   * Converts browser errors into structured, user-friendly error objects
   *
   * @param error - Raw error from Chrome AI API
   * @returns Structured error with recovery suggestions
   */
  static handleError(error: unknown): WriterError {
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
   */
  private static handleDOMException(error: DOMException): WriterError {
    const errorName = error.name as WriterErrorType;

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
   */
  private static handleStandardError(error: Error): WriterError {
    const message = error.message.toLowerCase();

    // Determine error code based on error message content
    let errorCode: ErrorCode = 'UNKNOWN_ERROR';

    // User activation errors
    if (
      message.includes('user activation') ||
      message.includes('user gesture') ||
      message.includes('user interaction')
    ) {
      errorCode = 'USER_ACTIVATION_REQUIRED';
    }
    // API not supported
    else if (
      message.includes('not supported') ||
      message.includes('undefined')
    ) {
      errorCode = 'API_NOT_SUPPORTED';
    }
    // Download/network errors
    else if (message.includes('download') || message.includes('network')) {
      errorCode = 'MODEL_DOWNLOAD_FAILED';
    }
    // Abort errors
    else if (message.includes('abort') || message.includes('cancel')) {
      errorCode = 'OPERATION_CANCELLED';
    }
    // Invalid state
    else if (message.includes('invalid') || message.includes('state')) {
      errorCode = 'INVALID_STATE';
    }
    // Configuration not set
    else if (message.includes('configuration not set')) {
      errorCode = 'INVALID_STATE';
    }

    // Get plain language error message
    const errorMessage = getErrorMessageWithContext(errorCode);

    // Map error code to WriterErrorType
    const errorType = this.mapErrorCodeToType(errorCode);

    return {
      type: errorType,
      message: errorMessage.message,
      recoverable: errorMessage.severity !== 'error',
      suggestion: errorMessage.helpText || '',
    };
  }

  /**
   * Map error code to WriterErrorType
   */
  private static mapErrorCodeToType(code: ErrorCode): WriterErrorType {
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
      case 'USER_ACTIVATION_REQUIRED':
        return 'UserActivationError';
      default:
        return 'NotSupportedError';
    }
  }

  /**
   * Handle write operation errors with context
   */
  static handleWriteError(
    error: unknown,
    promptLength: number = 0,
  ): WriterError {
    // Handle empty input
    if (promptLength === 0) {
      const emptyError = getErrorMessageWithContext('INPUT_EMPTY');
      return {
        type: 'InvalidStateError',
        message: emptyError.message,
        recoverable: true,
        suggestion: emptyError.helpText || '',
      };
    }

    const baseError = this.handleError(error);

    // Add context-specific suggestions for very long prompts
    if (promptLength > 10000) {
      const lengthWarning = getErrorMessageWithContext('INPUT_TOO_LONG', {
        currentLength: promptLength,
        maxLength: 10000,
      });

      return {
        ...baseError,
        suggestion: `${baseError.suggestion}\n\n${lengthWarning.helpText}`,
      };
    }

    return baseError;
  }

  /**
   * Handle model download errors
   */
  static handleDownloadError(
    error: unknown,
    bytesDownloaded: number = 0,
  ): WriterError {
    const baseError = this.handleError(error);

    if (baseError.type === 'NotReadableError') {
      // Estimate model size (Writer model is smaller than Summarizer)
      const estimatedModelSize = 10 * 1024 * 1024 * 1024; // ~10GB estimate
      const percentComplete = (bytesDownloaded / estimatedModelSize) * 100;

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
   * Check if an error is recoverable
   */
  static isRecoverable(error: WriterError): boolean {
    return error.recoverable;
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: WriterError): string {
    return `${error.message}\n\n${error.suggestion}`;
  }

  /**
   * Format error for logging
   */
  static formatForLogging(error: WriterError): string {
    return `[Writer Error] ${error.type}: ${error.message} | Recoverable: ${error.recoverable}`;
  }
}

// ============================================================================
// Export
// ============================================================================

export default WriterErrorHandler;
