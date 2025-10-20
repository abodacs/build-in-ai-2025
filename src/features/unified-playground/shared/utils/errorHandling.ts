/**
 * Error Handling and Resilience Utilities
 * Comprehensive error handling, retry mechanisms, and recovery strategies
 */

import { TODO_TYPE } from '../../../../types/global';

import React, { useCallback, useEffect, useState, useRef } from 'react';

// ============================================================================
// Error Types and Interfaces
// ============================================================================

export interface PlaygroundError {
  id: string;
  type:
    | 'network'
    | 'api'
    | 'validation'
    | 'security'
    | 'permission'
    | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: string;
  stack?: string;
  timestamp: number;
  context?: Record<string, TODO_TYPE>;
  recoverable: boolean;
  retryable: boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: PlaygroundError) => boolean;
}

export interface ErrorRecoveryAction {
  id: string;
  label: string;
  description: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

// ============================================================================
// Error Classification
// ============================================================================

export function classifyError(error: unknown): PlaygroundError {
  const timestamp = Date.now();
  const id = `error-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      id,
      type: 'network',
      severity: 'medium',
      message: 'Network connection error',
      details:
        'Unable to connect to the AI service. Check your internet connection.',
      timestamp,
      recoverable: true,
      retryable: true,
      stack: error.stack,
    };
  }

  // Chrome AI API specific errors
  if (error instanceof Error) {
    if (
      error.message.includes('not available') ||
      error.message.includes('not supported')
    ) {
      return {
        id,
        type: 'api',
        severity: 'high',
        message: 'Chrome AI API not available',
        details:
          'This feature requires Chrome 138+ with experimental AI flags enabled.',
        timestamp,
        recoverable: false,
        retryable: false,
        stack: error.stack,
        context: {
          userAgent: navigator.userAgent,
          chromeVersion:
            navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'unknown',
        },
      };
    }

    if (
      error.message.includes('quota') ||
      error.message.includes('rate limit')
    ) {
      return {
        id,
        type: 'api',
        severity: 'medium',
        message: 'API quota exceeded',
        details: 'Too many requests. Please wait a moment before trying again.',
        timestamp,
        recoverable: true,
        retryable: true,
        stack: error.stack,
      };
    }

    if (
      error.message.includes('permission') ||
      error.message.includes('denied')
    ) {
      return {
        id,
        type: 'permission',
        severity: 'high',
        message: 'Permission denied',
        details:
          'Browser denied access to AI features. Check site permissions.',
        timestamp,
        recoverable: true,
        retryable: false,
        stack: error.stack,
      };
    }

    if (
      error.message.includes('validation') ||
      error.message.includes('invalid')
    ) {
      return {
        id,
        type: 'validation',
        severity: 'low',
        message: 'Input validation error',
        details: error.message,
        timestamp,
        recoverable: true,
        retryable: false,
        stack: error.stack,
      };
    }

    if (
      error.message.includes('unsafe') ||
      error.message.includes('security')
    ) {
      return {
        id,
        type: 'security',
        severity: 'high',
        message: 'Security validation failed',
        details: 'Input contains potentially unsafe content.',
        timestamp,
        recoverable: true,
        retryable: false,
        stack: error.stack,
      };
    }
  }

  // Generic error fallback
  return {
    id,
    type: 'unknown',
    severity: 'medium',
    message:
      error instanceof Error ? error.message : 'An unexpected error occurred',
    details: 'Please try again or contact support if the problem persists.',
    timestamp,
    recoverable: true,
    retryable: true,
    stack: error instanceof Error ? error.stack : undefined,
    context: { originalError: error },
  };
}

// ============================================================================
// Retry Mechanism
// ============================================================================

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryCondition = (error) => error.retryable,
  } = config;

  let lastError: PlaygroundError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = classifyError(error);

      // Don't retry if not retryable or on last attempt
      if (!retryCondition(lastError) || attempt === maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay,
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay;
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError!;
}

// ============================================================================
// Error Recovery Hook
// ============================================================================

export function useErrorRecovery() {
  const [errors, setErrors] = useState<PlaygroundError[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const errorLogRef = useRef<PlaygroundError[]>([]);

  const dismissError = useCallback((errorId: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== errorId));
  }, []);

  const addError = useCallback(
    (error: unknown) => {
      const classifiedError = classifyError(error);

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Playground Error:', classifiedError);
      }

      // Add to error log
      errorLogRef.current.push(classifiedError);

      // Add to visible errors
      setErrors((prev) => [...prev, classifiedError]);

      // Auto-dismiss low severity errors after 5 seconds
      if (classifiedError.severity === 'low') {
        setTimeout(() => {
          dismissError(classifiedError.id);
        }, 5000);
      }

      return classifiedError;
    },
    [dismissError],
  );

  const dismissAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const retryOperation = useCallback(
    async (operation: () => Promise<void>, errorId?: string) => {
      setIsRecovering(true);

      try {
        await withRetry(operation, {
          maxAttempts: 3,
          baseDelay: 1000,
        });

        // Dismiss specific error if successful
        if (errorId) {
          dismissError(errorId);
        }
      } catch (error) {
        addError(error);
      } finally {
        setIsRecovering(false);
      }
    },
    [addError, dismissError],
  );

  const getRecoveryActions = useCallback(
    (error: PlaygroundError): ErrorRecoveryAction[] => {
      const actions: ErrorRecoveryAction[] = [];

      switch (error.type) {
        case 'network':
          actions.push({
            id: 'retry-network',
            label: 'Retry',
            description: 'Try the operation again',
            action: () => retryOperation(() => Promise.resolve()),
            primary: true,
          });
          actions.push({
            id: 'check-connection',
            label: 'Check Connection',
            description: 'Test your internet connection',
            action: () => {
              window.open('https://www.google.com', '_blank');
            },
          });
          break;

        case 'api':
          if (error.message.includes('not available')) {
            actions.push({
              id: 'enable-flags',
              label: 'Enable AI Features',
              description: 'Learn how to enable Chrome AI features',
              action: () => {
                window.open(
                  'https://developer.chrome.com/docs/ai/built-in',
                  '_blank',
                );
              },
              primary: true,
            });
          } else {
            actions.push({
              id: 'retry-api',
              label: 'Retry',
              description: 'Try the API call again',
              action: () => retryOperation(() => Promise.resolve()),
              primary: true,
            });
          }
          break;

        case 'permission':
          actions.push({
            id: 'check-permissions',
            label: 'Check Permissions',
            description: 'Review site permissions',
            action: () => {
              // Focus on address bar for user to check permissions
              window.focus();
            },
            primary: true,
          });
          break;

        case 'validation':
          actions.push({
            id: 'fix-input',
            label: 'Fix Input',
            description: 'Correct the input and try again',
            action: () => {
              // Focus on the input element
              const input = document.querySelector(
                '[data-playground-input]',
              ) as HTMLElement;
              input?.focus();
            },
            primary: true,
          });
          break;

        case 'security':
          actions.push({
            id: 'review-input',
            label: 'Review Input',
            description: 'Check your input for security issues',
            action: () => {
              const input = document.querySelector(
                '[data-playground-input]',
              ) as HTMLElement;
              input?.focus();
            },
            primary: true,
          });
          break;

        default:
          actions.push({
            id: 'reload-page',
            label: 'Reload Page',
            description: 'Refresh the page and try again',
            action: () => window.location.reload(),
            primary: true,
          });
      }

      // Always add dismiss action
      actions.push({
        id: 'dismiss',
        label: 'Dismiss',
        description: 'Hide this error message',
        action: () => dismissError(error.id),
      });

      return actions;
    },
    [retryOperation, dismissError],
  );

  const getErrorSummary = useCallback(() => {
    const critical = errors.filter((e) => e.severity === 'critical').length;
    const high = errors.filter((e) => e.severity === 'high').length;
    const medium = errors.filter((e) => e.severity === 'medium').length;
    const low = errors.filter((e) => e.severity === 'low').length;

    return { critical, high, medium, low, total: errors.length };
  }, [errors]);

  return {
    errors,
    errorLog: errorLogRef.current,
    isRecovering,
    addError,
    dismissError,
    dismissAllErrors,
    retryOperation,
    getRecoveryActions,
    getErrorSummary,
    hasErrors: errors.length > 0,
    hasCriticalErrors: errors.some((e) => e.severity === 'critical'),
  };
}

// ============================================================================
// Offline Support Hook
// ============================================================================

export function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const queuedOperationsRef = useRef<Array<() => Promise<void>>>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);

      if (wasOffline) {
        setWasOffline(false);

        // Process queued operations
        const operations = queuedOperationsRef.current;
        queuedOperationsRef.current = [];

        operations.forEach(async (operation) => {
          try {
            await operation();
          } catch (error) {
            console.error('Failed to process queued operation:', error);
          }
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  const queueOperation = useCallback(
    (operation: () => Promise<void>) => {
      if (isOnline) {
        return operation();
      } else {
        queuedOperationsRef.current.push(operation);
        return Promise.reject(
          new Error('Operation queued for when connection is restored'),
        );
      }
    },
    [isOnline],
  );

  return {
    isOnline,
    wasOffline,
    queueOperation,
    queuedCount: queuedOperationsRef.current.length,
  };
}

// ============================================================================
// Graceful Degradation Hook
// ============================================================================

export function useGracefulDegradation() {
  const [capabilities, setCapabilities] = useState({
    chromeAI: false,
    localStorage: false,
    webWorkers: false,
    indexedDB: false,
    serviceWorker: false,
  });

  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    const checkCapabilities = async () => {
      const newCapabilities = {
        chromeAI: typeof (globalThis as TODO_TYPE) !== 'undefined',
        localStorage: typeof Storage !== 'undefined',
        webWorkers: typeof Worker !== 'undefined',
        indexedDB: typeof indexedDB !== 'undefined',
        serviceWorker: 'serviceWorker' in navigator,
      };

      setCapabilities(newCapabilities);

      // Enable fallback mode if critical features are missing
      const hasCriticalFeatures =
        newCapabilities.chromeAI || newCapabilities.localStorage;
      setFallbackMode(!hasCriticalFeatures);
    };

    checkCapabilities();
  }, []);

  const getFallbackMessage = useCallback(
    (feature: keyof typeof capabilities): string => {
      switch (feature) {
        case 'chromeAI':
          return 'Chrome AI features are not available. The playground will work in demo mode with mock responses.';
        case 'localStorage':
          return 'Local storage is not available. Settings and preferences will not be saved.';
        case 'webWorkers':
          return 'Web Workers are not available. Some operations may be slower.';
        case 'indexedDB':
          return 'IndexedDB is not available. Offline data storage is limited.';
        case 'serviceWorker':
          return 'Service Workers are not available. Offline functionality is limited.';
        default:
          return 'Some features may not work as expected in this browser.';
      }
    },
    [],
  );

  return {
    capabilities,
    fallbackMode,
    getFallbackMessage,
    hasMinimumCapabilities: capabilities.localStorage,
    hasOptimalCapabilities: Object.values(capabilities).every(Boolean),
  };
}

// ============================================================================
// Circuit Breaker Pattern
// ============================================================================

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly retryTimeout: number = 30000, // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.retryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - operation not allowed');
      }
    }

    try {
      const result = await operation();

      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      isOpen: this.state === 'OPEN',
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

// ============================================================================
// Error Boundary Helper
// ============================================================================

export function createErrorBoundary(
  fallbackComponent: React.ComponentType<{
    error: PlaygroundError;
    resetError: () => void;
  }>,
) {
  return class PlaygroundErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: PlaygroundError | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { error: null };
    }

    static getDerivedStateFromError(error: Error): { error: PlaygroundError } {
      return { error: classifyError(error) };
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);

      // Log error for telemetry
      if (process.env.NODE_ENV === 'production') {
        // @typescript-eslint/no-explicit-any
        // Send to error tracking service
        // Example: Sentry.captureException(error, { extra: errorInfo })
      }
    }

    resetError = () => {
      this.setState({ error: null });
    };

    override render() {
      if (this.state.error) {
        const FallbackComponent = fallbackComponent;
        return React.createElement(FallbackComponent, {
          error: this.state.error,
          resetError: this.resetError,
        });
      }

      return this.props.children;
    }
  };
}
