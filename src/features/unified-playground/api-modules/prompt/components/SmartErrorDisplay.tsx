/**
 * SmartErrorDisplay Component
 * Intelligent error display with context-aware suggestions and quick action buttons
 *
 * @module SmartErrorDisplay
 */

import { useCallback } from 'react';
import { AlertTriangle, Lightbulb, Wand2, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getErrorMessage,
  type ErrorCode,
  type ErrorMessage,
} from '../../shared/utils/errorMessages';

// ============================================================================
// Types
// ============================================================================

export interface QuickAction {
  /** Action identifier */
  id: string;

  /** Action label */
  label: string;

  /** Action description */
  description?: string;

  /** Action callback */
  action: () => void;

  /** Is this the primary/recommended action? */
  primary?: boolean;

  /** Icon component */
  icon?: React.ReactNode;

  /** Variant */
  variant?: 'default' | 'outline' | 'ghost';
}

export interface SmartErrorDisplayProps {
  /** Error code */
  errorCode: ErrorCode;

  /** Additional context for the error */
  context?: {
    currentTokens?: number;
    maxTokens?: number;
    temperature?: number;
    topK?: number;
    systemPrompt?: string;
    [key: string]: unknown;
  };

  /** Quick action callbacks */
  actions?: {
    onTrimPrompt?: (targetTokens: number) => void;
    onResetParameters?: () => void;
    onUsePreset?: (preset: string) => void;
    onLoadTemplate?: () => void;
    onDismiss?: () => void;
  };

  /** Additional CSS classes */
  className?: string;

  /** Show in compact mode */
  compact?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get severity styles for error display
 */
function getSeverityStyles(severity: ErrorMessage['severity']): {
  container: string;
  icon: string;
  badge: string;
} {
  switch (severity) {
    case 'error':
      return {
        container: 'border-red-500/50 bg-red-500/5 dark:bg-red-500/10',
        icon: 'text-red-600 dark:text-red-400',
        badge: 'bg-red-500 text-white',
      };
    case 'warning':
      return {
        container: 'border-yellow-500/50 bg-yellow-500/5 dark:bg-yellow-500/10',
        icon: 'text-yellow-600 dark:text-yellow-400',
        badge: 'bg-yellow-500 text-white',
      };
    case 'info':
      return {
        container: 'border-blue-500/50 bg-blue-500/5 dark:bg-blue-500/10',
        icon: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-500 text-white',
      };
  }
}

/**
 * Generate smart actions based on error code and context
 */
function generateSmartActions(
  errorCode: ErrorCode,
  context: SmartErrorDisplayProps['context'],
  callbacks: SmartErrorDisplayProps['actions'],
): QuickAction[] {
  const actions: QuickAction[] = [];

  switch (errorCode) {
    case 'CONTEXT_WINDOW_EXCEEDED':
      if (
        context?.currentTokens &&
        context?.maxTokens &&
        callbacks?.onTrimPrompt
      ) {
        const targetTokens = Math.floor(context.maxTokens * 0.7);
        const trimCallback = callbacks.onTrimPrompt;
        actions.push({
          id: 'trim-prompt',
          label: 'Auto-Trim Prompt',
          description: `Reduce to ${targetTokens} tokens`,
          action: () => trimCallback(targetTokens),
          primary: true,
          icon: <Wand2 className="w-4 h-4" />,
          variant: 'default',
        });
      }
      break;

    case 'TOKEN_LIMIT_WARNING':
      if (callbacks?.onTrimPrompt && context?.maxTokens) {
        const targetTokens = Math.floor(context.maxTokens * 0.6);
        const trimCallback = callbacks.onTrimPrompt;
        actions.push({
          id: 'optimize-prompt',
          label: 'Optimize',
          description: `Reduce to ${targetTokens} tokens`,
          action: () => trimCallback(targetTokens),
          primary: true,
          icon: <Wand2 className="w-4 h-4" />,
          variant: 'default',
        });
      }
      break;

    case 'TEMPERATURE_TOO_HIGH_FOR_TASK':
      if (callbacks?.onUsePreset) {
        actions.push({
          id: 'use-factual-preset',
          label: 'Use Factual Preset',
          description: 'Set temperature to 0.2',
          action: () => {
            if (callbacks.onUsePreset) {
              callbacks.onUsePreset('factual');
            }
          },
          primary: true,
          icon: <Lightbulb className="w-4 h-4" />,
          variant: 'default',
        });
      }
      if (callbacks?.onDismiss) {
        actions.push({
          id: 'keep-creative',
          label: 'Keep Settings',
          description: 'Continue with creative mode',
          action: () => {
            if (callbacks.onDismiss) {
              callbacks.onDismiss();
            }
          },
          icon: <RotateCcw className="w-4 h-4" />,
          variant: 'outline',
        });
      }
      break;

    case 'TEMPERATURE_TOO_LOW_FOR_TASK':
      if (callbacks?.onUsePreset) {
        const presetCallback = callbacks.onUsePreset;
        actions.push({
          id: 'use-creative-preset',
          label: 'Use Creative Preset',
          description: 'Set temperature to 0.9',
          action: () => presetCallback('creative'),
          primary: true,
          icon: <Lightbulb className="w-4 h-4" />,
          variant: 'default',
        });
      }
      break;

    case 'INVALID_PARAMETER_COMBINATION':
      if (callbacks?.onResetParameters) {
        const resetCallback = callbacks.onResetParameters;
        actions.push({
          id: 'reset-to-defaults',
          label: 'Reset to Defaults',
          description: 'Use recommended settings',
          action: () => resetCallback(),
          primary: true,
          icon: <RotateCcw className="w-4 h-4" />,
          variant: 'default',
        });
      }
      if (callbacks?.onUsePreset) {
        const presetCallback = callbacks.onUsePreset;
        actions.push({
          id: 'use-balanced-preset',
          label: 'Balanced Preset',
          description: 'Safe middle-ground settings',
          action: () => presetCallback('balanced'),
          icon: <Lightbulb className="w-4 h-4" />,
          variant: 'outline',
        });
      }
      break;

    case 'SYSTEM_PROMPT_MISSING':
      if (callbacks?.onLoadTemplate) {
        const templateCallback = callbacks.onLoadTemplate;
        actions.push({
          id: 'load-template',
          label: 'Load Template',
          description: 'Choose from examples',
          action: () => templateCallback(),
          primary: true,
          icon: <Lightbulb className="w-4 h-4" />,
          variant: 'default',
        });
      }
      break;

    default:
      // Generic retry/dismiss actions
      if (callbacks?.onResetParameters) {
        const resetCallback = callbacks.onResetParameters;
        actions.push({
          id: 'retry',
          label: 'Try Again',
          action: () => resetCallback(),
          icon: <RotateCcw className="w-4 h-4" />,
          variant: 'outline',
        });
      }
      break;
  }

  // Always add dismiss action
  if (callbacks?.onDismiss) {
    const dismissCallback = callbacks.onDismiss;
    actions.push({
      id: 'dismiss',
      label: 'Dismiss',
      action: () => dismissCallback(),
      variant: 'ghost',
    });
  }

  return actions;
}

// ============================================================================
// SmartErrorDisplay Component
// ============================================================================

/**
 * Intelligent error display with context-aware quick actions
 *
 * @example
 * ```tsx
 * <SmartErrorDisplay
 *   errorCode="CONTEXT_WINDOW_EXCEEDED"
 *   context={{ currentTokens: 1200, maxTokens: 1024 }}
 *   actions={{
 *     onTrimPrompt: (target) => handleTrim(target),
 *     onDismiss: () => setError(null),
 *   }}
 * />
 * ```
 */
export function SmartErrorDisplay({
  errorCode,
  context,
  actions,
  className,
  compact = false,
}: SmartErrorDisplayProps) {
  const errorMessage = getErrorMessage(errorCode);
  const styles = getSeverityStyles(errorMessage.severity);
  const quickActions = generateSmartActions(errorCode, context, actions);

  const handleAction = useCallback((action: QuickAction) => {
    try {
      action.action();
    } catch (error) {
      console.error('Quick action failed:', error);
    }
  }, []);

  // Primary actions (up to 2)
  const primaryActions = quickActions.filter((a) => a.primary).slice(0, 2);

  // Secondary actions
  const secondaryActions = quickActions.filter((a) => !a.primary);

  return (
    <Card
      className={cn(
        'border p-4 animate-fadeInDown',
        styles.container,
        className,
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">
                  {errorMessage.message}
                </h3>
                <Badge className={cn('text-xs', styles.badge)}>
                  {errorMessage.severity.toUpperCase()}
                </Badge>
              </div>
              {!compact && (
                <p className="text-sm text-muted-foreground">
                  {errorMessage.helpText}
                </p>
              )}
            </div>
          </div>

          {/* Context Information */}
          {!compact && context && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              {context.currentTokens !== undefined &&
                context.maxTokens !== undefined && (
                  <p>
                    Current: {context.currentTokens.toLocaleString()} /{' '}
                    {context.maxTokens.toLocaleString()} tokens (
                    {Math.round(
                      (context.currentTokens / context.maxTokens) * 100,
                    )}
                    %)
                  </p>
                )}
              {context.temperature !== undefined && (
                <p>Temperature: {context.temperature.toFixed(2)}</p>
              )}
              {context.topK !== undefined && <p>Top K: {context.topK}</p>}
            </div>
          )}

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div className="space-y-2">
              {/* Primary Actions */}
              {primaryActions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {primaryActions.map((action) => (
                    <Button
                      key={action.id}
                      size="sm"
                      variant={action.variant || 'default'}
                      onClick={() => handleAction(action)}
                      className="h-8 text-xs gap-1.5"
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Secondary Actions */}
              {secondaryActions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {secondaryActions.map((action) => (
                    <Button
                      key={action.id}
                      size="sm"
                      variant={action.variant || 'outline'}
                      onClick={() => handleAction(action)}
                      className="h-7 text-xs gap-1"
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default SmartErrorDisplay;
