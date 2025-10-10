/**
 * Writer Error Handler
 *
 * Centralized error handling for Chrome AI Writer API
 * Provides user-friendly error messages and recovery suggestions
 *
 * @module writer/services/ErrorHandler
 */

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
   */
  private static handleDOMException(error: DOMException): WriterError {
    const errorName = error.name as WriterErrorType;

    switch (errorName) {
      case 'NotSupportedError':
        return {
          type: 'NotSupportedError',
          message: 'Chrome AI Writer API is not supported in this browser',
          recoverable: false,
          suggestion:
            'Please upgrade to Chrome 137+ and enable the Writer API via chrome://flags#writer-api-for-gemini-nano',
        };

      case 'InvalidStateError':
        return {
          type: 'InvalidStateError',
          message: 'Writer is in an invalid state',
          recoverable: true,
          suggestion:
            'The writer may have been destroyed or is still initializing. Try creating a new writer instance.',
        };

      case 'NotReadableError':
        return {
          type: 'NotReadableError',
          message: 'Failed to download or read the AI model',
          recoverable: true,
          suggestion:
            'Check your internet connection and available storage. Try downloading again.',
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
   */
  private static handleStandardError(error: Error): WriterError {
    const message = error.message.toLowerCase();

    // User activation errors
    if (
      message.includes('user activation') ||
      message.includes('user gesture') ||
      message.includes('user interaction')
    ) {
      return {
        type: 'UserActivationError',
        message: 'User activation required',
        recoverable: true,
        suggestion:
          'Writer operations must be initiated from a user gesture (e.g., button click). If you clicked a button, the activation may have expired due to async operations. Please try again.',
      };
    }

    // API not supported
    if (message.includes('not supported') || message.includes('undefined')) {
      return {
        type: 'NotSupportedError',
        message: 'Chrome AI Writer API is not available',
        recoverable: false,
        suggestion:
          'Ensure you are using Chrome 137+ with the Writer API enabled in chrome://flags#writer-api-for-gemini-nano',
      };
    }

    // Download/network errors
    if (message.includes('download') || message.includes('network')) {
      return {
        type: 'NotReadableError',
        message: 'Failed to download the AI model',
        recoverable: true,
        suggestion:
          'Check your internet connection and try again. Ensure you have sufficient storage space.',
      };
    }

    // Abort errors
    if (message.includes('abort') || message.includes('cancel')) {
      return {
        type: 'AbortError',
        message: 'Operation was cancelled',
        recoverable: true,
        suggestion: 'The operation was cancelled. You can try again if needed.',
      };
    }

    // Invalid state
    if (message.includes('invalid') || message.includes('state')) {
      return {
        type: 'InvalidStateError',
        message: 'Writer is in an invalid state',
        recoverable: true,
        suggestion: 'Try creating a new writer instance.',
      };
    }

    // Configuration not set
    if (message.includes('configuration not set')) {
      return {
        type: 'InvalidStateError',
        message: 'Writer configuration not set',
        recoverable: true,
        suggestion:
          'Ensure writer instance is created before calling write operations.',
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
   * Handle write operation errors with context
   */
  static handleWriteError(
    error: unknown,
    promptLength: number = 0,
  ): WriterError {
    const baseError = this.handleError(error);

    // Add context-specific suggestions
    if (promptLength > 10000) {
      return {
        ...baseError,
        suggestion: `${baseError.suggestion}\n\nNote: Your prompt is very long (${Math.round(promptLength / 1000)}K characters). Consider breaking it into smaller prompts for better results.`,
      };
    }

    if (promptLength === 0) {
      return {
        type: 'InvalidStateError',
        message: 'Cannot write with empty prompt',
        recoverable: true,
        suggestion: 'Please provide a prompt to generate content.',
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
      const estimatedModelSize = 10 * 1024 * 1024; // ~10MB estimate
      const percentComplete = (bytesDownloaded / estimatedModelSize) * 100;

      return {
        ...baseError,
        message: `Model download failed at ${percentComplete.toFixed(1)}%`,
        suggestion:
          'Your connection may have been interrupted. Please check your internet connection and available storage, then try again.',
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
