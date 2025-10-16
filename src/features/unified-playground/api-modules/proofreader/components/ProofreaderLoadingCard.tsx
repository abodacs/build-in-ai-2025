/**
 * ProofreaderLoadingCard Component
 *
 * Displays contextual loading information during proofreader operations.
 * Provides progressive disclosure of helpful information as time passes.
 *
 * @module proofreader/components/ProofreaderLoadingCard
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  AlertCircle,
  Clock,
  HardDrive,
  Wifi,
  Info,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressiveLoadingMessage } from '../hooks/useProgressiveLoadingMessage';

// ============================================================================
// Types
// ============================================================================

export interface ProofreaderLoadingCardProps {
  /** Is currently loading */
  isLoading: boolean;

  /** Loading phase */
  phase: 'initializing' | 'proofreading';

  /** Optional custom title */
  title?: string;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Proofreader Loading Card
 *
 * Shows contextual loading information with progressive disclosure.
 *
 * @example
 * ```tsx
 * <ProofreaderLoadingCard
 *   isLoading={isLoading}
 *   phase="initializing"
 * />
 * ```
 */
export function ProofreaderLoadingCard({
  isLoading,
  phase,
  title,
  className,
}: ProofreaderLoadingCardProps) {
  const { currentMessage, elapsedTime } = useProgressiveLoadingMessage(
    isLoading,
    phase === 'initializing' ? 'proofreader-init' : 'proofreading',
  );

  if (!isLoading) {
    return null;
  }

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get level-specific styles
  const getLevelStyles = () => {
    switch (currentMessage.level) {
      case 'urgent':
        return {
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          badgeVariant: 'destructive' as const,
        };
      case 'warning':
        return {
          borderColor: 'border-yellow-200',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          badgeVariant: 'default' as const,
        };
      default:
        return {
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          badgeVariant: 'secondary' as const,
        };
    }
  };

  const styles = getLevelStyles();

  return (
    <Card className={cn('border-2', styles.borderColor, className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            {title || currentMessage.message}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={styles.badgeVariant} className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {formatTime(elapsedTime)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Status */}
        <div className={cn('p-3 rounded-lg', styles.bgColor)}>
          <div className="flex items-start gap-3">
            <div className="flex gap-1 pt-1">
              {/* Animated loading dots */}
              <div
                className={cn(
                  'w-2 h-2 rounded-full animate-pulse',
                  styles.textColor,
                )}
                style={{ animationDelay: '0ms', animationDuration: '1s' }}
              />
              <div
                className={cn(
                  'w-2 h-2 rounded-full animate-pulse',
                  styles.textColor,
                )}
                style={{ animationDelay: '200ms', animationDuration: '1s' }}
              />
              <div
                className={cn(
                  'w-2 h-2 rounded-full animate-pulse',
                  styles.textColor,
                )}
                style={{ animationDelay: '400ms', animationDuration: '1s' }}
              />
            </div>

            <div className="flex-1 space-y-1">
              {currentMessage.subtitle && (
                <p className={cn('text-sm font-medium', styles.textColor)}>
                  {currentMessage.subtitle}
                </p>
              )}

              {currentMessage.helpText && (
                <p className="text-xs text-muted-foreground">
                  {currentMessage.helpText}
                </p>
              )}

              {currentMessage.actionLink && (
                <a
                  href={currentMessage.actionLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-2"
                >
                  {currentMessage.actionLink.text}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* First-time requirements (only show during initialization after 10s) */}
        {phase === 'initializing' && elapsedTime >= 10 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="text-sm font-medium">First-Time Requirements:</p>
                <ul className="text-xs space-y-1.5 ml-4">
                  <li className="flex items-center gap-2">
                    <HardDrive className="w-3 h-3 text-muted-foreground" />
                    <span>22GB+ free disk space</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Wifi className="w-3 h-3 text-muted-foreground" />
                    <span>Unmetered Wi-Fi connection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-muted-foreground" />
                    <span>Chrome 141-145 (Origin Trial)</span>
                  </li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Troubleshooting tips (show after 60s) */}
        {phase === 'initializing' && elapsedTime >= 60 && (
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Taking Longer Than Expected?
                </p>
                <ul className="text-xs space-y-1 ml-4 list-disc">
                  <li>Verify 22GB+ free storage and 4GB+ VRAM</li>
                  <li>Ensure stable, unmetered internet connection</li>
                  <li>
                    Check{' '}
                    <code className="px-1 py-0.5 bg-muted rounded text-xs">
                      chrome://on-device-internals
                    </code>{' '}
                    for download status
                  </li>
                  <li>Verify Origin Trial is enabled for Chrome 141-145</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Simple proofreading phase message */}
        {phase === 'proofreading' && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              Analyzing text for grammar, spelling, and style corrections...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ProofreaderLoadingCard;
