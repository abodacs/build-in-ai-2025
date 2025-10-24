/**
 * Rewriter Error Handler
 *
 * Centralized error handling for Chrome AI Rewriter API
 * Provides user-friendly error messages and recovery suggestions
 *
 * @module rewriter/services/ErrorHandler
 */

import {
  getErrorMessageWithContext,
  mapTechnicalErrorToCode,
  type ErrorCode,
} from '../../shared/utils/errorMessages';

// ============================================================================
// Types
// ============================================================================

export type RewriterErrorType =
  | 'NotSupportedError'
  | 'InvalidStateError'
  | 'NotReadableError'
  | 'AbortError'
  | 'UserActivationError';

export interface RewriterError {
  type: RewriterErrorType;
  message: string;
  recoverable: boolean;
  suggestion: string;
}

// ============================================================================
// Error Handler Service
// ============================================================================

export class RewriterErrorHandler {
  /**
   * Parse and handle Chrome AI Rewriter errors
   * Converts browser errors into structured, user-friendly error objects
   *
   * @param error - Raw error from Chrome AI API
   * @returns Structured error with recovery suggestions
   */
  static handleError(error: unknown): RewriterError {
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
  private static handleDOMException(error: DOMException): RewriterError {
    const errorName = error.name as RewriterErrorType;

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
  private static handleStandardError(error: Error): RewriterError {
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

    // Map error code to RewriterErrorType
    const errorType = this.mapErrorCodeToType(errorCode);

    return {
      type: errorType,
      message: errorMessage.message,
      recoverable: errorMessage.severity !== 'error',
      suggestion: errorMessage.helpText || '',
    };
  }

  /**
   * Map error code to RewriterErrorType
   */
  private static mapErrorCodeToType(code: ErrorCode): RewriterErrorType {
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
   * Handle rewrite operation errors with context
   */
  static handleRewriteError(
    error: unknown,
    inputLength: number = 0,
  ): RewriterError {
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
    if (inputLength > 10000) {
      const lengthWarning = getErrorMessageWithContext('INPUT_TOO_LONG', {
        currentLength: inputLength,
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
  ): RewriterError {
    const baseError = this.handleError(error);

    if (baseError.type === 'NotReadableError') {
      // Estimate model size (Rewriter model size)
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
  static isRecoverable(error: RewriterError): boolean {
    return error.recoverable;
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: RewriterError): string {
    return `${error.message}\n\n${error.suggestion}`;
  }

  /**
   * Format error for logging
   */
  static formatForLogging(error: RewriterError): string {
    return `[Rewriter Error] ${error.type}: ${error.message} | Recoverable: ${error.recoverable}`;
  }

  /**
   * Handle runtime errors (null access, type errors, etc.)
   * Provides user-friendly messages for unexpected JavaScript errors
   */
  static handleRuntimeError(error: unknown): RewriterError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const lowerMessage = errorMessage.toLowerCase();

    // Detect common runtime errors
    if (
      lowerMessage.includes('cannot read propert') ||
      lowerMessage.includes('null') ||
      lowerMessage.includes('undefined')
    ) {
      return {
        type: 'InvalidStateError',
        message: 'An error occurred processing this item',
        recoverable: true,
        suggestion:
          'Please try again. If the problem continues, check that your input is properly formatted.',
      };
    }

    if (
      lowerMessage.includes('type error') ||
      lowerMessage.includes('is not a function')
    ) {
      return {
        type: 'InvalidStateError',
        message: 'An unexpected error occurred',
        recoverable: true,
        suggestion:
          'Try refreshing the page and trying again. If this persists, please report the issue.',
      };
    }

    // Fall back to generic error handling
    return this.handleError(error);
  }

  /**
   * Handle batch processing errors with better context
   */
  static handleBatchError(error: unknown, itemIndex?: number): RewriterError {
    const baseError = this.handleRuntimeError(error);

    if (itemIndex !== undefined) {
      return {
        ...baseError,
        message: `Item ${itemIndex + 1}: ${baseError.message}`,
      };
    }

    return baseError;
  }
}

// ============================================================================
// Export
// ============================================================================

export default RewriterErrorHandler;
