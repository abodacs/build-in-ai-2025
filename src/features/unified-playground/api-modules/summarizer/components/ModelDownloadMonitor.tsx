/**
 * Model Download Monitor Component
 *
 * Advanced monitoring and management for AI model downloads
 * Displays download status, cache info, and manual controls
 *
 * @module ModelDownloadMonitor
 */

import { useState } from 'react';
import {
  Download,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ModelDownloadMonitorProps {
  /** Download status */
  isDownloading?: boolean;

  /** Download progress info */
  downloadProgress?: {
    percentage: number;
    timeRemaining?: number;
  } | null;

  /** Download error */
  downloadError?: string | null;

  /** Model availability status */
  availability?: 'available' | 'after-download' | 'no';

  /** Is model ready */
  isReady?: boolean;

  /** Trigger download */
  onStartDownload?: () => Promise<void>;

  /** Clear cache/re-download */
  onClearCache?: () => Promise<void>;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get status badge
 */
function getStatusBadge(
  availability?: string,
  isReady?: boolean,
  isDownloading?: boolean,
) {
  if (isDownloading) {
    return (
      <Badge className="bg-blue-500 text-white">
        <Download className="w-3 h-3 mr-1 animate-bounce" />
        Downloading
      </Badge>
    );
  }

  if (isReady && availability === 'available') {
    return (
      <Badge className="bg-green-500 text-white">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Ready
      </Badge>
    );
  }

  if (availability === 'after-download') {
    return (
      <Badge variant="outline" className="border-orange-500 text-orange-700">
        <AlertCircle className="w-3 h-3 mr-1" />
        Needs Download
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-red-500 text-red-700">
      <AlertCircle className="w-3 h-3 mr-1" />
      Not Supported
    </Badge>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * Model download monitor and management
 *
 * @example
 * ```tsx
 * <ModelDownloadMonitor
 *   isDownloading={isDownloading}
 *   downloadProgress={downloadProgress}
 *   availability={availability}
 *   isReady={isReady}
 *   onStartDownload={startDownload}
 * />
 * ```
 */
export function ModelDownloadMonitor({
  isDownloading = false,
  downloadProgress,
  downloadError,
  availability = 'no',
  isReady = false,
  onStartDownload,
  onClearCache,
  className,
}: ModelDownloadMonitorProps) {
  const [isClearing, setIsClearing] = useState(false);

  /**
   * Handle download trigger
   */
  const handleStartDownload = async () => {
    if (onStartDownload) {
      try {
        await onStartDownload();
      } catch (error) {
        console.error('Failed to start download:', error);
      }
    }
  };

  /**
   * Handle cache clear
   */
  const handleClearCache = async () => {
    if (
      onClearCache &&
      window.confirm(
        'Are you sure you want to clear the model cache? This will require re-downloading the model.',
      )
    ) {
      try {
        setIsClearing(true);
        await onClearCache();
      } catch (error) {
        console.error('Failed to clear cache:', error);
      } finally {
        setIsClearing(false);
      }
    }
  };

  // Estimate model size (Chrome AI Summarizer is ~1-2GB)
  const estimatedModelSize = '1-2 GB';

  return (
    <Card className={cn('border-slate-200', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-slate-600" />
            Model Status & Management
          </CardTitle>
          {getStatusBadge(availability, isReady, isDownloading)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Download Error */}
        {downloadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {downloadError}
            </AlertDescription>
          </Alert>
        )}

        {/* Active Download Progress */}
        {isDownloading && downloadProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                Downloading model...
              </span>
              <span className="text-slate-600">
                {downloadProgress.percentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={downloadProgress.percentage} className="h-2" />
            {downloadProgress.timeRemaining && (
              <p className="text-xs text-slate-500">
                Estimated time remaining: {downloadProgress.timeRemaining}s
              </p>
            )}
          </div>
        )}

        {/* Model Information */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-slate-500 text-xs">Model Type</p>
              <p className="font-medium text-slate-900">Chrome AI Summarizer</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 text-xs">Estimated Size</p>
              <p className="font-medium text-slate-900">{estimatedModelSize}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 text-xs">Storage Location</p>
              <p className="font-medium text-slate-900 text-xs truncate">
                Browser Cache
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 text-xs">Status</p>
              <p className="font-medium text-slate-900">
                {isReady ? 'Cached' : 'Not Downloaded'}
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs text-blue-800">
            <ul className="list-disc list-inside space-y-1">
              <li>Model is downloaded once and cached locally</li>
              <li>All processing happens on your device</li>
              <li>No data is sent to external servers</li>
              <li>Download required only on first use or after cache clear</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {availability === 'after-download' && !isDownloading && (
            <Button
              onClick={handleStartDownload}
              size="sm"
              className="flex-1"
              disabled={isDownloading}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Model
            </Button>
          )}

          {isReady && (
            <>
              <Button
                onClick={handleStartDownload}
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={isDownloading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-download
              </Button>
              {onClearCache && (
                <Button
                  onClick={handleClearCache}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={isClearing || isDownloading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cache
                </Button>
              )}
            </>
          )}
        </div>

        {/* System Requirements */}
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-700 mb-2">
            System Requirements:
          </p>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Chrome 138+ or Edge Canary</li>
            <li>• 22+ GB free disk space</li>
            <li>• 4+ GB VRAM (for optimal performance)</li>
            <li>• Stable internet connection (for download)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ModelDownloadMonitor;
