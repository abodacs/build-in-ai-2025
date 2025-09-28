/**
 * Error Display Component
 * Enterprise-grade error display with recovery actions and user guidance
 */

// Added React and useEffect to the import
import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  RefreshCw,
  X,
  ChevronDown,
  ChevronRight,
  Shield,
  Wifi,
  WifiOff,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  useErrorRecovery,
  useOfflineSupport,
  useGracefulDegradation,
  type PlaygroundError,
  type ErrorRecoveryAction,
} from '../utils/errorHandling';

// ============================================================================
// Error Severity Styling
// ============================================================================

const getSeverityStyles = (severity: PlaygroundError['severity']) => {
  switch (severity) {
    case 'critical':
      return {
        border: 'border-red-500/50',
        background: 'bg-red-500/5',
        icon: 'text-red-600',
        badge: 'bg-red-500 text-white',
      };
    case 'high':
      return {
        border: 'border-orange-500/50',
        background: 'bg-orange-500/5',
        icon: 'text-orange-600',
        badge: 'bg-orange-500 text-white',
      };
    case 'medium':
      return {
        border: 'border-yellow-500/50',
        background: 'bg-yellow-500/5',
        icon: 'text-yellow-600',
        badge: 'bg-yellow-500 text-white',
      };
    case 'low':
      return {
        border: 'border-blue-500/50',
        background: 'bg-blue-500/5',
        icon: 'text-blue-600',
        badge: 'bg-blue-500 text-white',
      };
  }
};

const getTypeIcon = (type: PlaygroundError['type']) => {
  switch (type) {
    case 'network':
      return WifiOff;
    case 'api':
      return AlertTriangle;
    case 'security':
      return Shield;
    case 'permission':
      return Info;
    default:
      return AlertTriangle;
  }
};

// ============================================================================
// Individual Error Component
// ============================================================================

interface ErrorItemProps {
  error: PlaygroundError;
  actions: ErrorRecoveryAction[];
  onAction: (action: ErrorRecoveryAction) => void;
  onDismiss: (errorId: string) => void;
  isRecovering: boolean;
}

function ErrorItem({
  error,
  actions,
  onAction,
  onDismiss,
  isRecovering,
}: ErrorItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = getSeverityStyles(error.severity);
  const IconComponent = getTypeIcon(error.type);

  return (
    <Card
      className={cn('p-4 animate-fadeInDown', styles.border, styles.background)}
    >
      {/* FIX: The following block was a broken string literal. It's now valid JSX. */}
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
          <IconComponent className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{error.message}</h3>
              <Badge className={cn('text-xs', styles.badge)}>
                {error.severity.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {error.type}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(error.id)}
              className="flex-shrink-0 hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {error.details && (
            <p className="text-sm text-muted-foreground mb-3">
              {error.details}
            </p>
          )}

          {/* Primary Actions */}
          <div className="flex flex-wrap gap-2 mb-3">
            {actions
              .filter((a) => a.primary)
              .map((action) => (
                <Button
                  key={action.id}
                  size="sm"
                  onClick={() => onAction(action)}
                  disabled={isRecovering}
                  className="transition-all duration-200"
                >
                  {isRecovering && action.id.includes('retry') && (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  )}
                  {action.label}
                </Button>
              ))}
          </div>

          {/* Secondary Actions - Expandable */}
          {actions.filter((a) => !a.primary).length > 0 && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs p-1 h-auto"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 mr-1" />
                ) : (
                  <ChevronRight className="w-3 h-3 mr-1" />
                )}
                More options
              </Button>

              {isExpanded && (
                <div className="mt-2 flex flex-wrap gap-2 animate-fadeInDown">
                  {actions
                    .filter((a) => !a.primary)
                    .map((action) => (
                      <Button
                        key={action.id}
                        variant="outline"
                        size="sm"
                        onClick={() => onAction(action)}
                        className="text-xs"
                      >
                        {action.id.includes('external') && (
                          <ExternalLink className="w-3 h-3 mr-1" />
                        )}
                        {action.label}
                      </Button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Technical Details - Development Only */}
          {process.env.NODE_ENV === 'development' && error.stack && (
            <details className="mt-3">
              <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto max-h-32 text-muted-foreground">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// Connection Status Component
// ============================================================================

function ConnectionStatus() {
  const { isOnline, wasOffline, queuedCount } = useOfflineSupport();

  if (isOnline && !wasOffline) return null;

  return (
    <Card
      className={cn(
        'p-3 border-l-4',
        isOnline
          ? 'border-l-green-500 bg-green-500/5'
          : 'border-l-red-500 bg-red-500/5',
      )}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-600" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-600" />
        )}
        <span className="text-sm font-medium">
          {isOnline ? 'Connection restored' : 'No internet connection'}
        </span>
        {queuedCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {queuedCount} queued
          </Badge>
        )}
      </div>
      {isOnline && wasOffline && (
        <p className="text-xs text-muted-foreground mt-1">
          Attempting to process queued operations...
        </p>
      )}
    </Card>
  );
}

// ============================================================================
// Browser Compatibility Warning
// ============================================================================

function CompatibilityWarning() {
  const { capabilities, fallbackMode, getFallbackMessage } =
    useGracefulDegradation();

  if (!fallbackMode) return null;

  return (
    <Card className="p-4 border-amber-500/50 bg-amber-500/5">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
            Limited Functionality
          </h3>
          <div className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
            {Object.entries(capabilities).map(([feature, available]) => {
              if (available) return null;
              return (
                <p key={feature}>
                  • {getFallbackMessage(feature as keyof typeof capabilities)}
                </p>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-amber-500 text-amber-700 hover:bg-amber-500/10"
            onClick={() =>
              window.open(
                'https://developer.chrome.com/docs/ai/built-in',
                '_blank',
              )
            }
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Learn About Chrome AI
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// Main Error Display Component
// ============================================================================

interface ErrorDisplayProps {
  className?: string;
  maxErrors?: number;
  showConnectionStatus?: boolean;
  showCompatibilityWarning?: boolean;
}

export function ErrorDisplay({
  className,
  maxErrors = 5,
  showConnectionStatus = true,
  showCompatibilityWarning = true,
}: ErrorDisplayProps) {
  const {
    errors,
    isRecovering,
    dismissError,
    dismissAllErrors,
    getRecoveryActions,
    getErrorSummary,
  } = useErrorRecovery();

  const [_collapsedErrors, setCollapsedErrors] = useState<Set<string>>(
    new Set(),
  );
  const summary = getErrorSummary();

  const handleAction = useCallback(async (action: ErrorRecoveryAction) => {
    try {
      await action.action();
    } catch (error) {
      console.error('Recovery action failed:', error);
    }
  }, []);

  useCallback((errorId: string) => {
    setCollapsedErrors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(errorId)) {
        newSet.delete(errorId);
      } else {
        newSet.add(errorId);
      }
      return newSet;
    });
  }, []);

  const visibleErrors = errors.slice(0, maxErrors);
  const hiddenCount = Math.max(0, errors.length - maxErrors);

  if (
    errors.length === 0 &&
    showConnectionStatus === false &&
    showCompatibilityWarning === false
  ) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Connection Status */}
      {showConnectionStatus && <ConnectionStatus />}

      {/* Browser Compatibility Warning */}
      {showCompatibilityWarning && <CompatibilityWarning />}

      {/* Error Summary */}
      {errors.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">
              Issues ({summary.total})
            </h3>
            {summary.critical > 0 && (
              <Badge className="bg-red-500 text-white text-xs">
                {summary.critical} Critical
              </Badge>
            )}
            {summary.high > 0 && (
              <Badge className="bg-orange-500 text-white text-xs">
                {summary.high} High
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissAllErrors}
            className="text-muted-foreground hover:text-foreground"
          >
            Dismiss All
          </Button>
        </div>
      )}

      {/* Error List */}
      <div className="space-y-3">
        {visibleErrors.map((error) => (
          <ErrorItem
            key={error.id}
            error={error}
            actions={getRecoveryActions(error)}
            onAction={handleAction}
            onDismiss={dismissError}
            isRecovering={isRecovering}
          />
        ))}
      </div>

      {/* Hidden Errors Indicator */}
      {hiddenCount > 0 && (
        <Card className="p-3 border-muted">
          <div className="text-center text-sm text-muted-foreground">
            {hiddenCount} more error{hiddenCount > 1 ? 's' : ''} hidden.
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissAllErrors}
              className="ml-2 text-xs h-auto p-1"
            >
              Clear all to see them
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Error Provider Component
// ============================================================================

interface ErrorProviderProps {
  children: React.ReactNode;
  onError?: (error: PlaygroundError) => void;
}

export function ErrorProvider({ children, onError }: ErrorProviderProps) {
  const { addError } = useErrorRecovery();

  const handleError = useCallback(
    (error: unknown) => {
      const classifiedError = addError(error);
      onError?.(classifiedError);
      return classifiedError;
    },
    [addError, onError],
  );

  // Global error handler
  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      handleError(event.error || new Error(event.message));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(event.reason);
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection,
      );
    };
  }, [handleError]);

  return (
    <div>
      {children}
      <ErrorDisplay className="mt-6" />
    </div>
  );
}
