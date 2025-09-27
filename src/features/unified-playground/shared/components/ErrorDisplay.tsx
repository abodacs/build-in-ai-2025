/**
 * Error Display Component
 * Enterprise-grade error display with recovery actions and user guidance
 */

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  ExternalLink
} from 'lucide-react'
import {
  useErrorRecovery,
  useOfflineSupport,
  useGracefulDegradation,
  type PlaygroundError,
  type ErrorRecoveryAction
} from '../utils/errorHandling'

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
        badge: 'bg-red-500 text-white'
      }
    case 'high':
      return {
        border: 'border-orange-500/50',
        background: 'bg-orange-500/5',
        icon: 'text-orange-600',
        badge: 'bg-orange-500 text-white'
      }
    case 'medium':
      return {
        border: 'border-yellow-500/50',
        background: 'bg-yellow-500/5',
        icon: 'text-yellow-600',
        badge: 'bg-yellow-500 text-white'
      }
    case 'low':
      return {
        border: 'border-blue-500/50',
        background: 'bg-blue-500/5',
        icon: 'text-blue-600',
        badge: 'bg-blue-500 text-white'
      }
  }
}

const getTypeIcon = (type: PlaygroundError['type']) => {
  switch (type) {
    case 'network':
      return WifiOff
    case 'api':
      return AlertTriangle
    case 'security':
      return Shield
    case 'permission':
      return Info
    default:
      return AlertTriangle
  }
}

// ============================================================================
// Individual Error Component
// ============================================================================

interface ErrorItemProps {
  error: PlaygroundError
  actions: ErrorRecoveryAction[]
  onAction: (action: ErrorRecoveryAction) => void
  onDismiss: (errorId: string) => void
  isRecovering: boolean
}

function ErrorItem({ error, actions, onAction, onDismiss, isRecovering }: ErrorItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const styles = getSeverityStyles(error.severity)
  const IconComponent = getTypeIcon(error.type)

  return (
    <Card className={cn('p-4 animate-fadeInDown', styles.border, styles.background)}>
      <div className=\"flex items-start gap-3\">\n        <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>\n          <IconComponent className=\"w-5 h-5\" />\n        </div>\n\n        <div className=\"flex-1 min-w-0\">\n          <div className=\"flex items-start justify-between gap-2 mb-2\">\n            <div className=\"flex items-center gap-2\">\n              <h3 className=\"font-semibold text-foreground\">{error.message}</h3>\n              <Badge className={cn('text-xs', styles.badge)}>\n                {error.severity.toUpperCase()}\n              </Badge>\n              <Badge variant=\"outline\" className=\"text-xs\">\n                {error.type}\n              </Badge>\n            </div>\n            <Button\n              variant=\"ghost\"\n              size=\"sm\"\n              onClick={() => onDismiss(error.id)}\n              className=\"flex-shrink-0 hover:bg-destructive/10\"\n            >\n              <X className=\"w-4 h-4\" />\n            </Button>\n          </div>\n\n          {error.details && (\n            <p className=\"text-sm text-muted-foreground mb-3\">\n              {error.details}\n            </p>\n          )}\n\n          {/* Primary Actions */}\n          <div className=\"flex flex-wrap gap-2 mb-3\">\n            {actions.filter(a => a.primary).map(action => (\n              <Button\n                key={action.id}\n                size=\"sm\"\n                onClick={() => onAction(action)}\n                disabled={isRecovering}\n                className=\"transition-all duration-200\"\n              >\n                {isRecovering && action.id.includes('retry') && (\n                  <RefreshCw className=\"w-3 h-3 mr-1 animate-spin\" />\n                )}\n                {action.label}\n              </Button>\n            ))}\n          </div>\n\n          {/* Secondary Actions - Expandable */}\n          {actions.filter(a => !a.primary).length > 0 && (\n            <div>\n              <Button\n                variant=\"ghost\"\n                size=\"sm\"\n                onClick={() => setIsExpanded(!isExpanded)}\n                className=\"text-xs p-1 h-auto\"\n              >\n                {isExpanded ? (\n                  <ChevronDown className=\"w-3 h-3 mr-1\" />\n                ) : (\n                  <ChevronRight className=\"w-3 h-3 mr-1\" />\n                )}\n                More options\n              </Button>\n\n              {isExpanded && (\n                <div className=\"mt-2 flex flex-wrap gap-2 animate-fadeInDown\">\n                  {actions.filter(a => !a.primary).map(action => (\n                    <Button\n                      key={action.id}\n                      variant=\"outline\"\n                      size=\"sm\"\n                      onClick={() => onAction(action)}\n                      className=\"text-xs\"\n                    >\n                      {action.id.includes('external') && (\n                        <ExternalLink className=\"w-3 h-3 mr-1\" />\n                      )}\n                      {action.label}\n                    </Button>\n                  ))}\n                </div>\n              )}\n            </div>\n          )}\n\n          {/* Technical Details - Development Only */}\n          {process.env.NODE_ENV === 'development' && error.stack && (\n            <details className=\"mt-3\">\n              <summary className=\"text-xs cursor-pointer text-muted-foreground hover:text-foreground\">\n                Technical Details\n              </summary>\n              <pre className=\"mt-1 text-xs bg-muted p-2 rounded overflow-auto max-h-32 text-muted-foreground\">\n                {error.stack}\n              </pre>\n            </details>\n          )}\n        </div>\n      </div>\n    </Card>\n  )\n}\n\n// ============================================================================\n// Connection Status Component\n// ============================================================================\n\nfunction ConnectionStatus() {\n  const { isOnline, wasOffline, queuedCount } = useOfflineSupport()\n\n  if (isOnline && !wasOffline) return null\n\n  return (\n    <Card className={cn(\n      'p-3 border-l-4',\n      isOnline ? 'border-l-green-500 bg-green-500/5' : 'border-l-red-500 bg-red-500/5'\n    )}>\n      <div className=\"flex items-center gap-2\">\n        {isOnline ? (\n          <Wifi className=\"w-4 h-4 text-green-600\" />\n        ) : (\n          <WifiOff className=\"w-4 h-4 text-red-600\" />\n        )}\n        <span className=\"text-sm font-medium\">\n          {isOnline ? 'Connection restored' : 'No internet connection'}\n        </span>\n        {queuedCount > 0 && (\n          <Badge variant=\"secondary\" className=\"text-xs\">\n            {queuedCount} queued\n          </Badge>\n        )}\n      </div>\n      {isOnline && wasOffline && (\n        <p className=\"text-xs text-muted-foreground mt-1\">\n          Attempting to process queued operations...\n        </p>\n      )}\n    </Card>\n  )\n}\n\n// ============================================================================\n// Browser Compatibility Warning\n// ============================================================================\n\nfunction CompatibilityWarning() {\n  const { capabilities, fallbackMode, getFallbackMessage } = useGracefulDegradation()\n\n  if (!fallbackMode) return null\n\n  return (\n    <Card className=\"p-4 border-amber-500/50 bg-amber-500/5\">\n      <div className=\"flex items-start gap-3\">\n        <Info className=\"w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5\" />\n        <div>\n          <h3 className=\"font-semibold text-amber-900 dark:text-amber-100 mb-2\">\n            Limited Functionality\n          </h3>\n          <div className=\"space-y-1 text-sm text-amber-800 dark:text-amber-200\">\n            {Object.entries(capabilities).map(([feature, available]) => {\n              if (available) return null\n              return (\n                <p key={feature}>\n                  • {getFallbackMessage(feature as keyof typeof capabilities)}\n                </p>\n              )\n            })}\n          </div>\n          <Button\n            variant=\"outline\"\n            size=\"sm\"\n            className=\"mt-3 border-amber-500 text-amber-700 hover:bg-amber-500/10\"\n            onClick={() => window.open('https://developer.chrome.com/docs/ai/built-in', '_blank')}\n          >\n            <ExternalLink className=\"w-3 h-3 mr-1\" />\n            Learn About Chrome AI\n          </Button>\n        </div>\n      </div>\n    </Card>\n  )\n}\n\n// ============================================================================\n// Main Error Display Component\n// ============================================================================\n\ninterface ErrorDisplayProps {\n  className?: string\n  maxErrors?: number\n  showConnectionStatus?: boolean\n  showCompatibilityWarning?: boolean\n}\n\nexport function ErrorDisplay({\n  className,\n  maxErrors = 5,\n  showConnectionStatus = true,\n  showCompatibilityWarning = true\n}: ErrorDisplayProps) {\n  const {\n    errors,\n    isRecovering,\n    dismissError,\n    dismissAllErrors,\n    getRecoveryActions,\n    getErrorSummary\n  } = useErrorRecovery()\n\n  const [collapsedErrors, setCollapsedErrors] = useState<Set<string>>(new Set())\n  const summary = getErrorSummary()\n\n  const handleAction = useCallback(async (action: ErrorRecoveryAction) => {\n    try {\n      await action.action()\n    } catch (error) {\n      console.error('Recovery action failed:', error)\n    }\n  }, [])\n\n  const toggleErrorCollapse = useCallback((errorId: string) => {\n    setCollapsedErrors(prev => {\n      const newSet = new Set(prev)\n      if (newSet.has(errorId)) {\n        newSet.delete(errorId)\n      } else {\n        newSet.add(errorId)\n      }\n      return newSet\n    })\n  }, [])\n\n  const visibleErrors = errors.slice(0, maxErrors)\n  const hiddenCount = Math.max(0, errors.length - maxErrors)\n\n  if (errors.length === 0 && showConnectionStatus === false && showCompatibilityWarning === false) {\n    return null\n  }\n\n  return (\n    <div className={cn('space-y-4', className)}>\n      {/* Connection Status */}\n      {showConnectionStatus && <ConnectionStatus />}\n\n      {/* Browser Compatibility Warning */}\n      {showCompatibilityWarning && <CompatibilityWarning />}\n\n      {/* Error Summary */}\n      {errors.length > 0 && (\n        <div className=\"flex items-center justify-between\">\n          <div className=\"flex items-center gap-2\">\n            <h3 className=\"font-semibold text-foreground\">\n              Issues ({summary.total})\n            </h3>\n            {summary.critical > 0 && (\n              <Badge className=\"bg-red-500 text-white text-xs\">\n                {summary.critical} Critical\n              </Badge>\n            )}\n            {summary.high > 0 && (\n              <Badge className=\"bg-orange-500 text-white text-xs\">\n                {summary.high} High\n              </Badge>\n            )}\n          </div>\n          <Button\n            variant=\"ghost\"\n            size=\"sm\"\n            onClick={dismissAllErrors}\n            className=\"text-muted-foreground hover:text-foreground\"\n          >\n            Dismiss All\n          </Button>\n        </div>\n      )}\n\n      {/* Error List */}\n      <div className=\"space-y-3\">\n        {visibleErrors.map(error => (\n          <ErrorItem\n            key={error.id}\n            error={error}\n            actions={getRecoveryActions(error)}\n            onAction={handleAction}\n            onDismiss={dismissError}\n            isRecovering={isRecovering}\n          />\n        ))}\n      </div>\n\n      {/* Hidden Errors Indicator */}\n      {hiddenCount > 0 && (\n        <Card className=\"p-3 border-muted\">\n          <div className=\"text-center text-sm text-muted-foreground\">\n            {hiddenCount} more error{hiddenCount > 1 ? 's' : ''} hidden.\n            <Button\n              variant=\"ghost\"\n              size=\"sm\"\n              onClick={dismissAllErrors}\n              className=\"ml-2 text-xs h-auto p-1\"\n            >\n              Clear all to see them\n            </Button>\n          </div>\n        </Card>\n      )}\n    </div>\n  )\n}\n\n// ============================================================================\n// Error Provider Component\n// ============================================================================\n\ninterface ErrorProviderProps {\n  children: React.ReactNode\n  onError?: (error: PlaygroundError) => void\n}\n\nexport function ErrorProvider({ children, onError }: ErrorProviderProps) {\n  const { addError } = useErrorRecovery()\n\n  const handleError = useCallback((error: unknown) => {\n    const classifiedError = addError(error)\n    onError?.(classifiedError)\n    return classifiedError\n  }, [addError, onError])\n\n  // Global error handler\n  useEffect(() => {\n    const handleUnhandledError = (event: ErrorEvent) => {\n      handleError(event.error || new Error(event.message))\n    }\n\n    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {\n      handleError(event.reason)\n    }\n\n    window.addEventListener('error', handleUnhandledError)\n    window.addEventListener('unhandledrejection', handleUnhandledRejection)\n\n    return () => {\n      window.removeEventListener('error', handleUnhandledError)\n      window.removeEventListener('unhandledrejection', handleUnhandledRejection)\n    }\n  }, [handleError])\n\n  return (\n    <div>\n      {children}\n      <ErrorDisplay className=\"mt-6\" />\n    </div>\n  )\n}"