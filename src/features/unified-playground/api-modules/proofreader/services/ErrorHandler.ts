/**
 * Proofreader Error Handler
 *
 * Provides comprehensive error handling for the Proofreader API.
 * Maps technical errors to user-friendly messages and logging formats.
 *
 * @module proofreader/services/ErrorHandler
 */

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
      return {
        type: 'unknown',
        message: 'An unknown error occurred during proofreading',
        technicalDetails: String(error),
      };
    }

    // Not supported
    if (
      error.message.includes('not supported') ||
      (error.message.includes('Proofreader') && error.message.includes('not'))
    ) {
      return {
        type: 'not-supported',
        message:
          'Proofreader API is not supported in this browser. Chrome 141-145 required.',
        originalError: error,
        technicalDetails: error.message,
      };
    }

    // Not available
    if (error.message.includes('not available')) {
      return {
        type: 'not-available',
        message: 'Proofreader API is not available. Check system requirements.',
        originalError: error,
        technicalDetails: error.message,
      };
    }

    // Model download required
    if (
      error.message.includes('download') ||
      error.message.includes('after-download')
    ) {
      return {
        type: 'model-download',
        message: 'Proofreader model needs to be downloaded (22GB+ required).',
        originalError: error,
        technicalDetails: error.message,
      };
    }

    // Cancelled
    if (
      error.message.includes('cancelled') ||
      error.message.includes('abort') ||
      error.name === 'AbortError'
    ) {
      return {
        type: 'cancelled',
        message: 'Proofreading was cancelled.',
        originalError: error,
        technicalDetails: error.message,
      };
    }

    // Invalid input
    if (
      error.message.includes('Input') ||
      error.message.includes('invalid') ||
      error.message.includes('empty')
    ) {
      return {
        type: 'invalid-input',
        message: error.message,
        originalError: error,
        technicalDetails: `Input length: ${inputLength} chars`,
      };
    }

    // API error
    if (error.message.includes('API') || error.message.includes('instance')) {
      return {
        type: 'api-error',
        message: `Proofreader API error: ${error.message}`,
        originalError: error,
        technicalDetails: error.stack,
      };
    }

    // Unknown error
    return {
      type: 'unknown',
      message: `Proofreading error: ${error.message}`,
      originalError: error,
      technicalDetails: error.stack,
    };
  }

  /**
   * Get user-friendly message from error
   *
   * @param error - Proofreader error object
   * @returns User-friendly message
   */
  static getUserMessage(error: ProofreaderError): string {
    if (error.userMessage) {
      return error.userMessage;
    }

    switch (error.type) {
      case 'not-supported':
        return 'Proofreader API is not supported in this browser. Please use Chrome 141-145 with Origin Trial enabled.';

      case 'not-available':
        return 'Proofreader API is not available. Check chrome://on-device-internals for details.';

      case 'model-download':
        return 'Proofreader model needs to be downloaded. This requires 22GB+ storage and unmetered connection. Check chrome://on-device-internals for download status.';

      case 'cancelled':
        return 'Proofreading was cancelled.';

      case 'invalid-input':
        return error.message;

      case 'api-error':
        return `Proofreader error: ${error.message}`;

      case 'unknown':
        return 'An unexpected error occurred. Please try again.';

      default:
        return error.message;
    }
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
