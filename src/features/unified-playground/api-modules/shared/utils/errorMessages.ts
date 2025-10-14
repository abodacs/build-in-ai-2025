/**
 * Error Message Dictionary
 *
 * User-friendly, plain language error messages for all error types
 * Follows best practices: clear problem statement + specific action
 *
 * @module shared/utils/errorMessages
 */

// ============================================================================
// Types
// ============================================================================

export interface ErrorMessage {
  /** Clear, plain language description of what went wrong */
  message: string;

  /** Specific, actionable step to fix the problem */
  helpText: string;

  /** Severity level */
  severity: 'error' | 'warning' | 'info';
}

export type ErrorCode =
  // API Availability Errors
  | 'API_NOT_SUPPORTED'
  | 'API_NOT_AVAILABLE'
  | 'BROWSER_TOO_OLD'
  | 'FLAG_NOT_ENABLED'

  // Model/Download Errors
  | 'MODEL_DOWNLOAD_FAILED'
  | 'INSUFFICIENT_STORAGE'
  | 'NO_INTERNET_CONNECTION'
  | 'MODEL_NOT_READY'

  // Input Validation Errors
  | 'INPUT_EMPTY'
  | 'INPUT_TOO_SHORT'
  | 'INPUT_TOO_LONG'
  | 'INVALID_FORMAT'
  | 'INVALID_LANGUAGE'

  // Operation Errors
  | 'OPERATION_FAILED'
  | 'OPERATION_ABORTED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TIMEOUT'
  | 'INVALID_STATE'

  // Permission Errors
  | 'PERMISSION_DENIED'
  | 'SECURITY_ERROR'
  | 'USER_ACTIVATION_REQUIRED'

  // API-specific Errors
  | 'MODEL_DOWNLOAD_REQUIRED'
  | 'OPERATION_CANCELLED'
  | 'INVALID_INPUT'
  | 'API_ERROR'
  | 'BROWSER_NOT_SUPPORTED'
  | 'STORAGE_ERROR'
  | 'NETWORK_ERROR'

  // Generic
  | 'UNKNOWN_ERROR';

// ============================================================================
// Error Message Dictionary
// ============================================================================

export const ERROR_MESSAGES: Record<ErrorCode, ErrorMessage> = {
  // API Availability Errors
  API_NOT_SUPPORTED: {
    message: 'This feature is not available in your browser',
    helpText: 'Please use Chrome version 138 or newer to access AI features.',
    severity: 'error',
  },

  API_NOT_AVAILABLE: {
    message: 'AI features are currently unavailable',
    helpText:
      'The Chrome AI API is not ready. Try refreshing the page or check your browser settings.',
    severity: 'error',
  },

  BROWSER_TOO_OLD: {
    message: 'Your browser needs to be updated',
    helpText: 'Update to Chrome 138+ to use this feature.',
    severity: 'error',
  },

  FLAG_NOT_ENABLED: {
    message: 'AI features are not enabled',
    helpText:
      'Open chrome://flags, search for "Summarization API" (or relevant API), enable it, and restart Chrome.',
    severity: 'error',
  },

  // Model/Download Errors
  MODEL_DOWNLOAD_FAILED: {
    message: 'Failed to download the AI model',
    helpText:
      'Check your internet connection and ensure you have at least 22GB of free storage space. Then try again.',
    severity: 'error',
  },

  INSUFFICIENT_STORAGE: {
    message: 'Not enough storage space available',
    helpText:
      'Free up at least 22GB of disk space to download the AI model, then try again.',
    severity: 'error',
  },

  NO_INTERNET_CONNECTION: {
    message: 'No internet connection detected',
    helpText:
      'Connect to the internet to download the AI model. Your connection will be saved for later.',
    severity: 'warning',
  },

  MODEL_NOT_READY: {
    message: 'AI model is still loading',
    helpText:
      'Please wait a moment for the model to finish loading, then try again.',
    severity: 'info',
  },

  // Input Validation Errors
  INPUT_EMPTY: {
    message: 'Please enter some text',
    helpText: 'The input field cannot be empty. Add your text to continue.',
    severity: 'warning',
  },

  INPUT_TOO_SHORT: {
    message: 'Your input is too short',
    helpText: 'Add more text to meet the minimum length requirement.',
    severity: 'warning',
  },

  INPUT_TOO_LONG: {
    message: 'Your input is too long',
    helpText:
      'Reduce the text length to fit within the character limit, or try breaking it into smaller sections.',
    severity: 'warning',
  },

  INVALID_FORMAT: {
    message: 'The input format is not recognized',
    helpText: 'Check that your input is in the correct format and try again.',
    severity: 'warning',
  },

  INVALID_LANGUAGE: {
    message: 'This language is not supported',
    helpText: 'Choose a different language from the supported options.',
    severity: 'warning',
  },

  // Operation Errors
  OPERATION_FAILED: {
    message: 'Something went wrong',
    helpText:
      'Try again in a moment. If the problem continues, refresh the page.',
    severity: 'error',
  },

  OPERATION_ABORTED: {
    message: 'Operation was cancelled',
    helpText: "You can try again whenever you're ready.",
    severity: 'info',
  },

  RATE_LIMIT_EXCEEDED: {
    message: 'Too many requests',
    helpText: 'Wait a few seconds before trying again.',
    severity: 'warning',
  },

  TIMEOUT: {
    message: 'Request took too long',
    helpText:
      'Your input may be too large. Try with shorter text or check your connection.',
    severity: 'warning',
  },

  INVALID_STATE: {
    message: 'Service is in an unexpected state',
    helpText: 'Refresh the page to reset the service and try again.',
    severity: 'error',
  },

  // Permission Errors
  PERMISSION_DENIED: {
    message: 'Access to AI features was denied',
    helpText:
      'Click the lock icon in your address bar and enable permissions for this site.',
    severity: 'error',
  },

  SECURITY_ERROR: {
    message: 'Security check failed',
    helpText:
      'Your input may contain unsafe content. Please review and modify your text.',
    severity: 'error',
  },

  USER_ACTIVATION_REQUIRED: {
    message: 'User action required',
    helpText:
      'This feature must be triggered by a button click or other user action. Click the button to try again.',
    severity: 'warning',
  },

  // API-specific Errors
  MODEL_DOWNLOAD_REQUIRED: {
    message: 'AI model needs to be downloaded',
    helpText:
      'The AI model must be downloaded before use. This requires 22GB+ storage. Check chrome://on-device-internals for download status.',
    severity: 'info',
  },

  OPERATION_CANCELLED: {
    message: 'Operation was cancelled',
    helpText: "You can try again whenever you're ready.",
    severity: 'info',
  },

  INVALID_INPUT: {
    message: 'Input is not valid',
    helpText: 'Check your input and make sure it meets the requirements.',
    severity: 'warning',
  },

  API_ERROR: {
    message: 'API error occurred',
    helpText:
      'Try again in a moment. If the problem continues, refresh the page.',
    severity: 'error',
  },

  BROWSER_NOT_SUPPORTED: {
    message: 'Your browser is not supported',
    helpText: 'Update to the latest version of Chrome to use this feature.',
    severity: 'error',
  },

  STORAGE_ERROR: {
    message: 'Storage issue detected',
    helpText: 'Free up disk space and try again.',
    severity: 'error',
  },

  NETWORK_ERROR: {
    message: 'Network connection problem',
    helpText: 'Check your internet connection and try again.',
    severity: 'warning',
  },

  // Generic
  UNKNOWN_ERROR: {
    message: 'An unexpected problem occurred',
    helpText:
      'Try refreshing the page. If this keeps happening, check the browser console for more details.',
    severity: 'error',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get error message for a given error code
 *
 * @param code - Error code
 * @returns Error message object
 */
export function getErrorMessage(code: ErrorCode): ErrorMessage {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Create a custom error message
 *
 * @param message - Custom message
 * @param helpText - Custom help text
 * @param severity - Severity level
 * @returns Error message object
 */
export function createErrorMessage(
  message: string,
  helpText: string,
  severity: ErrorMessage['severity'] = 'error',
): ErrorMessage {
  return { message, helpText, severity };
}

/**
 * Get error message with context
 *
 * Adds contextual information to standard error messages
 *
 * @param code - Error code
 * @param context - Additional context to add
 * @returns Error message object with context
 *
 * @example
 * ```ts
 * const error = getErrorMessageWithContext('INPUT_TOO_LONG', {
 *   currentLength: 60000,
 *   maxLength: 50000
 * });
 * // Result: "Your input is too long (60,000 of 50,000 characters)"
 * ```
 */
export function getErrorMessageWithContext(
  code: ErrorCode,
  context?: Record<string, string | number>,
): ErrorMessage {
  const baseMessage = getErrorMessage(code);

  if (!context) {
    return baseMessage;
  }

  // Add context to specific error types
  let contextualMessage = baseMessage.message;
  let contextualHelp = baseMessage.helpText;

  switch (code) {
    case 'INPUT_TOO_SHORT':
      if (
        context.currentLength !== undefined &&
        context.minLength !== undefined
      ) {
        const remaining =
          Number(context.minLength) - Number(context.currentLength);
        contextualHelp = `Add ${remaining} more character${remaining === 1 ? '' : 's'} to meet the minimum of ${context.minLength}.`;
      }
      break;

    case 'INPUT_TOO_LONG':
      if (
        context.currentLength !== undefined &&
        context.maxLength !== undefined
      ) {
        const excess =
          Number(context.currentLength) - Number(context.maxLength);
        contextualMessage = `Your input is too long (${Number(context.currentLength).toLocaleString()} of ${Number(context.maxLength).toLocaleString()} characters)`;
        contextualHelp = `Remove ${excess.toLocaleString()} character${excess === 1 ? '' : 's'} to fit within the limit.`;
      }
      break;

    case 'INSUFFICIENT_STORAGE':
      if (
        context.availableGB !== undefined &&
        context.requiredGB !== undefined
      ) {
        contextualMessage = `Not enough storage space (${context.availableGB}GB available, ${context.requiredGB}GB required)`;
      }
      break;

    case 'BROWSER_TOO_OLD':
      if (
        context.currentVersion !== undefined &&
        context.requiredVersion !== undefined
      ) {
        contextualMessage = `Your browser version ${context.currentVersion} is too old`;
        contextualHelp = `Update to Chrome ${context.requiredVersion}+ to use this feature.`;
      }
      break;
  }

  return {
    ...baseMessage,
    message: contextualMessage,
    helpText: contextualHelp,
  };
}

/**
 * Map technical error names to error codes
 *
 * Converts technical error type names (e.g., "NotSupportedError") to user-friendly error codes
 *
 * @param errorName - Technical error name
 * @returns Error code
 */
export function mapTechnicalErrorToCode(errorName: string): ErrorCode {
  const lowerName = errorName.toLowerCase();

  if (
    lowerName.includes('notsupported') ||
    lowerName.includes('not supported')
  ) {
    return 'API_NOT_SUPPORTED';
  }

  if (lowerName.includes('notreadable') || lowerName.includes('download')) {
    return 'MODEL_DOWNLOAD_FAILED';
  }

  if (
    lowerName.includes('invalidstate') ||
    lowerName.includes('invalid state')
  ) {
    return 'INVALID_STATE';
  }

  if (lowerName.includes('abort')) {
    return 'OPERATION_ABORTED';
  }

  if (lowerName.includes('permission') || lowerName.includes('denied')) {
    return 'PERMISSION_DENIED';
  }

  if (lowerName.includes('security') || lowerName.includes('unsafe')) {
    return 'SECURITY_ERROR';
  }

  if (lowerName.includes('quota') || lowerName.includes('rate')) {
    return 'RATE_LIMIT_EXCEEDED';
  }

  if (lowerName.includes('timeout')) {
    return 'TIMEOUT';
  }

  if (lowerName.includes('network') || lowerName.includes('connection')) {
    return 'NO_INTERNET_CONNECTION';
  }

  return 'UNKNOWN_ERROR';
}

// ============================================================================
// Export
// ============================================================================

export default ERROR_MESSAGES;
