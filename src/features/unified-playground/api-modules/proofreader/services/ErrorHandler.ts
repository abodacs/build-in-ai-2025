/**
 * Proofreader Error Handler
 *
 * Provides comprehensive error handling for the Proofreader API.
 * Maps technical errors to user-friendly messages and logging formats.
 *
 * @module proofreader/services/ErrorHandler
 */

import {
  getErrorMessageWithContext,
  type ErrorCode,
} from '../../shared/utils/errorMessages';

// ============================================================================
// Types
// ============================================================================

export type ProofreaderErrorType =
  | 'not-supported'
  | 'not-available'
  | 'model-download'
  | 'cancelled'
  | 'invalid-input'
  | 'api-error'
  | 'unknown';

export interface ProofreaderError {
  type: ProofreaderErrorType;
  message: string;
  originalError?: Error;
  technicalDetails?: string;
  userMessage?: string;
}

// ============================================================================
// Error Handler
// ============================================================================

/**
 * Proofreader Error Handler
 *
 * Handles all error scenarios for the Proofreader API
 */
export class ProofreaderErrorHandler {
  /**
   * Handle proofreading errors
   *
   * @param error - Error object
   * @param inputLength - Length of input text
   * @returns Structured error object
   */
  static handleProofreadError(
    error: unknown,
    inputLength: number,
  ): ProofreaderError {
    if (!(error instanceof Error)) {
      const unknownError = getErrorMessageWithContext('UNKNOWN_ERROR');
      return {
        type: 'unknown',
        message: unknownError.message,
        technicalDetails: String(error),
        userMessage: unknownError.helpText,
      };
    }

    // Determine error code based on error message
    let errorCode: ErrorCode = 'UNKNOWN_ERROR';
    let errorType: ProofreaderErrorType = 'unknown';

    // Not supported
    if (
      error.message.includes('not supported') ||
      (error.message.includes('Proofreader') && error.message.includes('not'))
    ) {
      errorCode = 'API_NOT_SUPPORTED';
      errorType = 'not-supported';
    }
    // Not available
    else if (error.message.includes('not available')) {
      errorCode = 'API_NOT_AVAILABLE';
      errorType = 'not-available';
    }
    // Model download required
    else if (
      error.message.includes('download') ||
      error.message.includes('after-download')
    ) {
      errorCode = 'MODEL_DOWNLOAD_REQUIRED';
      errorType = 'model-download';
    }
    // Cancelled
    else if (
      error.message.includes('cancelled') ||
      error.message.includes('abort') ||
      error.name === 'AbortError'
    ) {
      errorCode = 'OPERATION_CANCELLED';
      errorType = 'cancelled';
    }
    // Invalid input
    else if (
      error.message.includes('Input') ||
      error.message.includes('invalid') ||
      error.message.includes('empty')
    ) {
      errorCode = inputLength === 0 ? 'INPUT_EMPTY' : 'INVALID_INPUT';
      errorType = 'invalid-input';
    }
    // API error
    else if (
      error.message.includes('API') ||
      error.message.includes('instance')
    ) {
      errorCode = 'API_ERROR';
      errorType = 'api-error';
    }

    // Get plain language error message
    const errorMessage = getErrorMessageWithContext(errorCode, {
      currentLength: inputLength,
    });

    return {
      type: errorType,
      message: errorMessage.message,
      originalError: error,
      technicalDetails: error.message,
      userMessage: errorMessage.helpText,
    };
  }

  /**
   * Get user-friendly message from error
   *
   * @param error - Proofreader error object
   * @returns User-friendly message
   */
  static getUserMessage(error: ProofreaderError): string {
    // Use userMessage if available (contains plain language help text)
    if (error.userMessage) {
      return `${error.message}\n\n${error.userMessage}`;
    }

    // Fallback to just the message
    return error.message;
  }

  /**
   * Format error for logging
   *
   * @param error - Proofreader error object
   * @returns Formatted log message
   */
  static formatForLogging(error: ProofreaderError): string {
    const parts = [
      `[ProofreaderError] Type: ${error.type}`,
      `Message: ${error.message}`,
    ];

    if (error.technicalDetails) {
      parts.push(`Details: ${error.technicalDetails}`);
    }

    if (error.originalError?.stack) {
      parts.push(`Stack: ${error.originalError.stack}`);
    }

    return parts.join('\n');
  }

  /**
   * Check if error is recoverable
   *
   * @param error - Proofreader error object
   * @returns true if user can retry
   */
  static isRecoverable(error: ProofreaderError): boolean {
    switch (error.type) {
      case 'cancelled':
      case 'invalid-input':
      case 'api-error':
      case 'unknown':
        return true;

      case 'not-supported':
      case 'not-available':
      case 'model-download':
        return false;

      default:
        return false;
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export default ProofreaderErrorHandler;
