/**
 * ProofreaderLoadingCard Component
 *
 * Displays contextual loading information during proofreader operations.
 * Provides progressive disclosure of helpful information as time passes.
 *
 * @module proofreader/components/ProofreaderLoadingCard
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  AlertCircle,
  Clock,
  HardDrive,
  Wifi,
  Info,
  Copy,
  Check,
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

  /** Download progress (if available) */
  downloadProgress?: {
    loaded: number;
    total: number;
    percentage: number;
    speed?: number;
    timeRemaining?: number;
  } | null;

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
  downloadProgress,
  className,
}: ProofreaderLoadingCardProps) {
  const { currentMessage, elapsedTime } = useProgressiveLoadingMessage(
    isLoading,
    phase === 'initializing' ? 'proofreader-init' : 'proofreading',
  );
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!isLoading) {
    return null;
  }

  // Handle copying URL to clipboard
  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: 'URL Copied!',
        description:
          "Paste it in your browser's address bar to check download status",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      console.error('Failed to copy URL:', _err);
      toast({
        title: 'Copy Failed',
        description: `Please copy manually: ${url}`,
        variant: 'destructive',
      });
    }
  };

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format bytes to human-readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Format seconds to human-readable duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
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

              {currentMessage.copyableUrl && (
                <div className="mt-2 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {currentMessage.copyableUrl.text}:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1 bg-muted rounded text-xs font-mono">
                      {currentMessage.copyableUrl.url}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopyUrl(currentMessage.copyableUrl!.url)
                      }
                      className="h-7 px-2 flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Copy and paste this URL in your browser&apos;s address bar
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Download Progress Display (if available) */}
        {downloadProgress && phase === 'initializing' && elapsedTime >= 10 && (
          <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">
                Model Download Progress
              </span>
              <span className="font-mono text-primary font-semibold">
                {downloadProgress.percentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={downloadProgress.percentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="font-mono">
                {formatBytes(downloadProgress.loaded)} /{' '}
                {formatBytes(downloadProgress.total)}
              </span>
              {downloadProgress.speed && (
                <span className="font-mono text-primary">
                  {formatBytes(downloadProgress.speed)}/s
                </span>
              )}
            </div>
            {downloadProgress.timeRemaining != null && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                Estimated time remaining:{' '}
                <span className="font-medium">
                  {formatDuration(downloadProgress.timeRemaining)}
                </span>
              </p>
            )}
          </div>
        )}

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
