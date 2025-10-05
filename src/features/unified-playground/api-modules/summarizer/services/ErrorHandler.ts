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
    return {
      type: 'NotSupportedError',
      message: 'An unknown error occurred',
      recoverable: false,
      suggestion:
        'Please try reloading the page. If the issue persists, check your browser version.',
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

    switch (errorName) {
      case 'NotSupportedError':
        return {
          type: 'NotSupportedError',
          message: 'Chrome AI Summarizer API is not supported in this browser',
          recoverable: false,
          suggestion:
            'Please upgrade to Chrome 138+ or ensure the Chrome AI origin trial is enabled. Visit chrome://flags and enable "Summarization API for Gemini Nano".',
        };

      case 'InvalidStateError':
        return {
          type: 'InvalidStateError',
          message: 'Summarizer is in an invalid state',
          recoverable: true,
          suggestion:
            'The summarizer may have been destroyed or is still initializing. Try creating a new summarizer instance.',
        };

      case 'NotReadableError':
        return {
          type: 'NotReadableError',
          message: 'Failed to download or read the AI model',
          recoverable: true,
          suggestion:
            'Check your internet connection and available storage (22GB+ required). Ensure you have 4GB+ VRAM. Try downloading again.',
        };

      case 'AbortError':
        return {
          type: 'AbortError',
          message: 'Operation was aborted',
          recoverable: true,
          suggestion:
            'The operation was cancelled. You can try again if needed.',
        };

      default:
        return {
          type: 'NotSupportedError',
          message: error.message || 'An unknown error occurred',
          recoverable: false,
          suggestion: 'Please check the browser console for more details.',
        };
    }
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

    if (message.includes('not supported') || message.includes('undefined')) {
      return {
        type: 'NotSupportedError',
        message: 'Chrome AI Summarizer API is not available',
        recoverable: false,
        suggestion:
          'Ensure you are using Chrome 138+ with the Summarization API enabled in chrome://flags.',
      };
    }

    if (message.includes('download') || message.includes('network')) {
      return {
        type: 'NotReadableError',
        message: 'Failed to download the AI model',
        recoverable: true,
        suggestion:
          'Check your internet connection and try again. Ensure you have 22GB+ free storage.',
      };
    }

    if (message.includes('abort') || message.includes('cancel')) {
      return {
        type: 'AbortError',
        message: 'Operation was cancelled',
        recoverable: true,
        suggestion: 'The operation was cancelled. You can try again if needed.',
      };
    }

    if (message.includes('invalid') || message.includes('state')) {
      return {
        type: 'InvalidStateError',
        message: 'Summarizer is in an invalid state',
        recoverable: true,
        suggestion: 'Try creating a new summarizer instance.',
      };
    }

    // Generic error fallback
    return {
      type: 'NotSupportedError',
      message: error.message || 'An unexpected error occurred',
      recoverable: false,
      suggestion:
        'Please check the browser console for more details and try reloading the page.',
    };
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
      const percentComplete = (bytesDownloaded / (22 * 1024 * 1024)) * 100;

      return {
        ...baseError,
        message: `Model download failed at ${percentComplete.toFixed(1)}%`,
        suggestion:
          'Your connection may have been interrupted. Please check your internet connection and available storage (22GB+ required), then try again.',
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
    const baseError = this.handleError(error);

    // Add context-specific suggestions
    if (inputLength > 100000) {
      return {
        ...baseError,
        suggestion: `${baseError.suggestion}\n\nNote: Your input is very long (${Math.round(inputLength / 1000)}K characters). Consider using chunking strategies for better results.`,
      };
    }

    if (inputLength === 0) {
      return {
        type: 'InvalidStateError',
        message: 'Cannot summarize empty text',
        recoverable: true,
        suggestion: 'Please provide some text to summarize.',
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
      return {
        type: 'NotSupportedError',
        message: `Chrome ${requirements.browser.version} is not supported`,
        recoverable: false,
        suggestion: `Please upgrade to Chrome ${requirements.browser.requiredVersion}+ to use Chrome AI Summarizer.`,
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

      return {
        type: 'NotReadableError',
        message: `Insufficient storage: ${availableGB}GB available, ${requiredGB}GB required`,
        recoverable: true,
        suggestion: 'Please free up storage space and try again.',
      };
    }

    if (!requirements.online) {
      return {
        type: 'NotReadableError',
        message: 'No internet connection',
        recoverable: true,
        suggestion:
          'Model download requires an internet connection. Please check your connection and try again.',
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
