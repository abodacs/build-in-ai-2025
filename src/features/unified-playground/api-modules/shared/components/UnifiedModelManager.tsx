/**
 * Unified Model Management Component
 *
 * Adaptive model management and download monitoring for all Chrome AI APIs.
 * Combines progressive loading UX with comprehensive model controls.
 *
 * Features:
 * - Works with/without download progress data
 * - Progressive time-based loading messages
 * - Manual model management (download, cache control)
 * - Truthful information display (no fake estimates)
 * - Consistent UX across all 7 APIs
 *
 * @module shared/components/UnifiedModelManager
 */

import { useState, useCallback } from 'react';
import {
  Download,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Info,
  Loader2,
  Clock,
  Wifi,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useProgressiveLoadingMessage } from '../../proofreader/hooks/useProgressiveLoadingMessage';
import { formatModelSize } from '../utils/modelSizeFormatter';

// ============================================================================
// Types
// ============================================================================

/**
 * Download progress data (only available for some APIs like Prompt)
 */
export interface DownloadProgress {
  /** Bytes downloaded */
  loaded: number;
  /** Total bytes to download */
  total: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Estimated time remaining in seconds */
  timeRemaining?: number;
  /** Download speed in bytes/second */
  downloadSpeed?: number;
}

/**
 * Model information configuration
 */
export interface ModelInfo {
  /** Display name of the model/API */
  name: string;
  /** Required Chrome version */
  chromeVersion: string;
  /** Requires Origin Trial registration */
  requiresOriginTrial?: boolean;
  /** Storage requirement (e.g., "22GB+ free space") - NOT model size! */
  storageRequirement?: string;
  /** VRAM requirement for optimal performance */
  vramRequirement?: string;
}

/**
 * Loading phase types
 */
export type LoadingPhase =
  | 'initializing'
  | 'downloading'
  | 'proofreading'
  | 'processing'
  | null;

/**
 * Component props
 */
export interface UnifiedModelManagerProps {
  /** API name for display */
  apiName: string;

  /** Model availability status */
  availability: 'readily' | 'after-download' | 'no';

  /** Is model ready to use */
  isReady: boolean;

  /** Is currently loading/initializing */
  isLoading: boolean;

  /** Current loading phase */
  loadingPhase?: LoadingPhase;

  /** Download progress (optional - only some APIs provide this) */
  downloadProgress?: DownloadProgress | null;

  /** Download/loading error */
  error?: string | null;

  /** Trigger model download */
  onStartDownload?: () => Promise<void>;

  /** Clear model cache */
  onClearCache?: () => Promise<void>;

  /** Model information */
  modelInfo: ModelInfo;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get status badge component
 */
function getStatusBadge(
  availability: string,
  isReady: boolean,
  isLoading: boolean,
) {
  if (isLoading) {
    return (
      <Badge className="bg-blue-500 text-white">
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Loading
      </Badge>
    );
  }

  if (isReady && availability === 'readily') {
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
        <Download className="w-3 h-3 mr-1" />
        Needs Download
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-red-500 text-red-700">
      <AlertCircle className="w-3 h-3 mr-1" />
      Not Available
    </Badge>
  );
}

/**
 * Format elapsed time as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Unified Model Manager
 *
 * Adaptive component that works for all Chrome AI APIs, showing appropriate
 * information based on what's available from each API.
 *
 * @example
 * ```tsx
 * // For API with download progress (Prompt API)
 * <UnifiedModelManager
 *   apiName="Prompt"
 *   availability={availability}
 *   isReady={isReady}
 *   isLoading={isLoading}
 *   loadingPhase={loadingPhase}
 *   downloadProgress={downloadProgress}
 *   onStartDownload={handleDownload}
 *   onClearCache={handleClearCache}
 *   modelInfo={{
 *     name: 'Gemini Nano',
 *     chromeVersion: '128+',
 *     storageRequirement: '22GB+ free space'
 *   }}
 * />
 *
 * // For API without download progress (Proofreader)
 * <UnifiedModelManager
 *   apiName="Proofreader"
 *   availability={availability}
 *   isReady={isReady}
 *   isLoading={isLoading}
 *   loadingPhase={loadingPhase}
 *   modelInfo={{
 *     name: 'Proofreader Model',
 *     chromeVersion: '141-145',
 *     requiresOriginTrial: true,
 *     storageRequirement: '22GB+ free space'
 *   }}
 * />
 * ```
 */
export function UnifiedModelManager({
  apiName,
  availability,
  isReady,
  isLoading,
  loadingPhase,
  downloadProgress,
  error,
  onStartDownload,
  onClearCache,
  modelInfo,
  className,
}: UnifiedModelManagerProps) {
  const [isClearing, setIsClearing] = useState(false);

  // Progressive loading messages (escalate over time)
  const messageType =
    loadingPhase === 'initializing' || loadingPhase === 'downloading'
      ? 'proofreader-init'
      : 'proofreading';
  const { currentMessage, elapsedTime } = useProgressiveLoadingMessage(
    isLoading || false,
    messageType,
  );

  /**
   * Handle download trigger
   */
  const handleStartDownload = useCallback(async () => {
    if (onStartDownload) {
      try {
        await onStartDownload();
      } catch (error) {
        console.error(`[${apiName}] Failed to start download:`, error);
      }
    }
  }, [onStartDownload, apiName]);

  /**
   * Handle cache clear
   */
  const handleClearCache = useCallback(async () => {
    if (
      onClearCache &&
      window.confirm(
        `Are you sure you want to clear the ${modelInfo.name} cache? This will require re-downloading the model.`,
      )
    ) {
      try {
        setIsClearing(true);
        await onClearCache();
      } catch (error) {
        console.error(`[${apiName}] Failed to clear cache:`, error);
      } finally {
        setIsClearing(false);
      }
    }
  }, [onClearCache, apiName, modelInfo.name]);

  // Determine if we should show the loading state
  const showLoadingState = isLoading && loadingPhase;

  // Get level-specific styles for loading state
  const getLevelStyles = () => {
    if (!showLoadingState) return null;

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

  const levelStyles = getLevelStyles();

  return (
    <Card
      className={cn(
        'border-slate-200',
        showLoadingState &&
          levelStyles &&
          `border-2 ${levelStyles.borderColor}`,
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {showLoadingState ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                {currentMessage.message}
              </>
            ) : (
              <>
                <HardDrive className="w-5 h-5 text-slate-600" />
                {modelInfo.name} Status
              </>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {showLoadingState && levelStyles && (
              <Badge variant={levelStyles.badgeVariant} className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(elapsedTime)}
              </Badge>
            )}
            {getStatusBadge(availability, isReady, isLoading)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Progressive Loading State */}
        {showLoadingState && levelStyles && (
          <div className={cn('p-3 rounded-lg', levelStyles.bgColor)}>
            <div className="flex items-start gap-3">
              <div className="flex gap-1 pt-1">
                {/* Animated loading dots */}
                <div
                  className={cn(
                    'w-2 h-2 rounded-full animate-pulse',
                    levelStyles.textColor,
                  )}
                  style={{ animationDelay: '0ms', animationDuration: '1s' }}
                />
                <div
                  className={cn(
                    'w-2 h-2 rounded-full animate-pulse',
                    levelStyles.textColor,
                  )}
                  style={{ animationDelay: '200ms', animationDuration: '1s' }}
                />
                <div
                  className={cn(
                    'w-2 h-2 rounded-full animate-pulse',
                    levelStyles.textColor,
                  )}
                  style={{ animationDelay: '400ms', animationDuration: '1s' }}
                />
              </div>

              <div className="flex-1 space-y-1">
                {currentMessage.subtitle && (
                  <p
                    className={cn('text-sm font-medium', levelStyles.textColor)}
                  >
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
        )}

        {/* Active Download Progress (only if API provides real data) */}
        {downloadProgress &&
          downloadProgress.loaded &&
          downloadProgress.total && (
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
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {formatModelSize(downloadProgress.loaded)} /{' '}
                  {formatModelSize(downloadProgress.total)}
                </span>
                {downloadProgress.downloadSpeed && (
                  <span>
                    {formatModelSize(downloadProgress.downloadSpeed)}/s
                  </span>
                )}
              </div>
            </div>
          )}

        {/* Model Information Grid */}
        {!showLoadingState && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-slate-500 text-xs">API Type</p>
                <p className="font-medium text-slate-900">{apiName} API</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-xs">Chrome Version</p>
                <p className="font-medium text-slate-900">
                  {modelInfo.chromeVersion}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-xs">Status</p>
                <p className="font-medium text-slate-900">
                  {isReady ? 'Downloaded' : 'Not Downloaded'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-xs">Storage Location</p>
                <p className="font-medium text-slate-900 text-xs truncate">
                  Browser Cache
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Alert - System Requirements */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs text-blue-800">
            <ul className="list-disc list-inside space-y-1">
              <li>Model is downloaded once and cached locally</li>
              <li>All processing happens on your device</li>
              <li>No data is sent to external servers</li>
              {modelInfo.storageRequirement && (
                <li>Requires {modelInfo.storageRequirement}</li>
              )}
              {modelInfo.vramRequirement && (
                <li>Optimal with {modelInfo.vramRequirement}</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>

        {/* Progressive Requirements (show during long initialization) */}
        {showLoadingState &&
          (loadingPhase === 'initializing' || loadingPhase === 'downloading') &&
          elapsedTime >= 10 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    First-Time Requirements:
                  </p>
                  <ul className="text-xs space-y-1.5 ml-4">
                    {modelInfo.storageRequirement && (
                      <li className="flex items-center gap-2">
                        <HardDrive className="w-3 h-3 text-muted-foreground" />
                        <span>{modelInfo.storageRequirement}</span>
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <Wifi className="w-3 h-3 text-muted-foreground" />
                      <span>Unmetered Wi-Fi connection</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 text-muted-foreground" />
                      <span>Chrome {modelInfo.chromeVersion}</span>
                    </li>
                    {modelInfo.requiresOriginTrial && (
                      <li className="flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 text-muted-foreground" />
                        <span>Origin Trial enabled</span>
                      </li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

        {/* Troubleshooting (show after 60s of loading) */}
        {showLoadingState &&
          (loadingPhase === 'initializing' || loadingPhase === 'downloading') &&
          elapsedTime >= 60 && (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Taking Longer Than Expected?
                  </p>
                  <ul className="text-xs space-y-1 ml-4 list-disc">
                    {modelInfo.storageRequirement && (
                      <li>Verify {modelInfo.storageRequirement} available</li>
                    )}
                    <li>Ensure stable, unmetered internet connection</li>
                    <li>
                      Check{' '}
                      <code className="px-1 py-0.5 bg-muted rounded text-xs">
                        chrome://on-device-internals
                      </code>{' '}
                      for download status
                    </li>
                    {modelInfo.requiresOriginTrial && (
                      <li>Verify Origin Trial is enabled</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

        {/* Action Buttons */}
        {!showLoadingState && (
          <div className="flex items-center gap-2 pt-2">
            {availability === 'after-download' && (
              <Button
                onClick={handleStartDownload}
                size="sm"
                className="flex-1"
                disabled={isLoading}
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
                  disabled={isLoading}
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
                    disabled={isClearing || isLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Cache
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {/* Link to Chrome internals */}
        {!showLoadingState && (
          <div className="pt-2 border-t border-slate-200">
            <a
              href="chrome://on-device-internals"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View detailed status in Chrome Internals
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default UnifiedModelManager;
