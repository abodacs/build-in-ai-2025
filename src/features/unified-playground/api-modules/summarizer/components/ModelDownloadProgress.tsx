/**
 * Model Download Progress Component
 *
 * Displays progress when downloading the AI model for the first time
 * Shows download size, progress bar, and estimated time remaining
 */

import { useEffect, useState } from 'react';
import { Download, X, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface DownloadProgressEvent {
  loaded: number;
  total: number;
}

export interface ModelDownloadProgressProps {
  /** Whether download is in progress */
  isDownloading: boolean;

  /** Download progress (0-100) */
  progress: number;

  /** Downloaded bytes */
  loaded?: number;

  /** Total bytes */
  total?: number;

  /** Error message */
  error?: string;

  /** Cancel handler */
  onCancel?: () => void;

  /** Retry handler */
  onRetry?: () => void;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Estimate time remaining
 */
function estimateTimeRemaining(
  loaded: number,
  total: number,
  startTime: number,
): string {
  const elapsed = (Date.now() - startTime) / 1000; // seconds
  const rate = loaded / elapsed; // bytes per second
  const remaining = (total - loaded) / rate; // seconds

  if (remaining < 60) return `${Math.round(remaining)}s`;
  if (remaining < 3600) return `${Math.round(remaining / 60)}m`;
  return `${Math.round(remaining / 3600)}h`;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Model download progress display
 *
 * @example
 * ```tsx
 * <ModelDownloadProgress
 *   isDownloading={isDownloading}
 *   progress={progress}
 *   loaded={loaded}
 *   total={total}
 *   onCancel={() => controller.abort()}
 * />
 * ```
 */
export function ModelDownloadProgress({
  isDownloading,
  progress,
  loaded = 0,
  total = 0,
  error,
  onCancel,
  onRetry,
  className,
}: ModelDownloadProgressProps) {
  const [startTime] = useState(Date.now());
  const [eta, setEta] = useState<string>('');

  // Update ETA
  useEffect(() => {
    if (isDownloading && loaded > 0 && total > 0) {
      const interval = setInterval(() => {
        setEta(estimateTimeRemaining(loaded, total, startTime));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isDownloading, loaded, total, startTime]);

  // Don't render if not downloading and no error
  if (!isDownloading && !error) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Download Failed</AlertTitle>
        <AlertDescription className="space-y-3">
          <p className="text-sm">{error}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              Retry Download
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Downloading state
  return (
    <Card className={cn('p-6 border-blue-200 bg-blue-50/50', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600 animate-bounce" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">
                Downloading AI Model
              </h3>
              <p className="text-sm text-blue-700">
                First-time setup - this only happens once
              </p>
            </div>
          </div>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-blue-600 hover:text-blue-700"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-blue-700">
            <span className="font-medium">{Math.round(progress)}%</span>
            {total > 0 && (
              <span>
                {formatBytes(loaded)} / {formatBytes(total)}
              </span>
            )}
            {eta && <span className="text-blue-600">ETA: {eta}</span>}
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-blue-600 space-y-1">
          <p>• Model size: ~1-2 GB (varies by device)</p>
          <p>• Downloaded once and cached for future use</p>
          <p>• All processing happens locally on your device</p>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ModelDownloadProgress;
