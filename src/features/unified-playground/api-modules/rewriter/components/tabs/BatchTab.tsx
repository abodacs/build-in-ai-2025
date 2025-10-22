/**
 * Rewriter BatchTab Component
 *
 * Batch rewriting interface for processing multiple texts.
 * Integrates all batch components into a complete working interface.
 *
 * @module rewriter/components/tabs/BatchTab
 */

import { useState, useCallback } from 'react';
import { Play, Pause, Square, AlertCircle, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  BatchRewriteInput,
  BatchProgressBar,
  BatchRewriteResults,
  RewriterConfigComponent,
  CodeModal,
} from '../index';
import { APIActionButton, Toast, useToast } from '../../../shared/components';
import { useBatchRewrite } from '../../hooks/useBatchRewrite';
import { useRewriterAvailability } from '../../hooks';
import {
  parseBatchFile,
  exportBatchResults,
  downloadBatchResults,
} from '../../utils';
import { DEFAULT_REWRITER_CONFIG } from '../../types';
import type {
  BatchInputFormat,
  BatchExportOptions,
} from '../../types/batch.types';

// ============================================================================
// Component
// ============================================================================

/**
 * Rewriter API batch processing tab
 *
 * Complete interface for batch rewriting operations with:
 * - Batch input management
 * - Progress tracking
 * - Results display and export
 * - Configuration options
 *
 * @example
 * ```tsx
 * <BatchTab />
 * ```
 */
export function BatchTab() {
  // Batch rewrite hook
  const { items, progress, status, config, actions } = useBatchRewrite(
    DEFAULT_REWRITER_CONFIG,
  );

  // Availability hook
  const {
    isChecking,
    error: availabilityError,
    isSupported,
    requiresDownload,
  } = useRewriterAvailability();

  // Toast hook
  const { toast, open, showToast, hideToast } = useToast();

  // Code modal state
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  /**
   * Handle file import
   */
  const handleImportFile = useCallback(
    async (file: File, format: BatchInputFormat) => {
      try {
        const { texts, contexts } = await parseBatchFile(file, { format });

        actions.addItems(texts, contexts);

        showToast({
          variant: 'success',
          message: 'File imported successfully',
          description: `Added ${texts.length} items from ${file.name}`,
        });
      } catch (error) {
        showToast({
          variant: 'error',
          message: 'Import failed',
          description:
            error instanceof Error ? error.message : 'Failed to import file',
        });
        throw error;
      }
    },
    [actions, showToast],
  );

  /**
   * Handle export results
   */
  const handleExportResults = useCallback(
    (options?: Partial<BatchExportOptions>) => {
      try {
        const exportOptions = {
          format: 'csv' as const,
          includeOriginal: true,
          includeMetrics: true,
          onlySuccessful: false,
          ...options,
        };

        const content = exportBatchResults(items, exportOptions);
        const fileName = `batch-results-${Date.now()}`;

        downloadBatchResults(content, fileName, exportOptions.format);

        showToast({
          variant: 'success',
          message: 'Results exported',
          description: `${items.length} items exported as ${exportOptions.format.toUpperCase()}`,
        });
      } catch (error) {
        showToast({
          variant: 'error',
          message: 'Export failed',
          description:
            error instanceof Error ? error.message : 'Failed to export results',
        });
      }
    },
    [items, showToast],
  );

  /**
   * Handle start batch processing
   */
  const handleStart = useCallback(async () => {
    if (items.length === 0) {
      showToast({
        variant: 'error',
        message: 'No items to process',
        description: 'Please add items before starting',
      });
      return;
    }

    try {
      await actions.start();

      showToast({
        variant: 'success',
        message: 'Batch processing started',
        description: `Processing ${items.length} items`,
      });
    } catch (error) {
      showToast({
        variant: 'error',
        message: 'Failed to start',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to start batch processing',
      });
    }
  }, [items.length, actions, showToast]);

  /**
   * Handle pause batch processing
   */
  const handlePause = useCallback(() => {
    actions.pause();
    showToast({
      variant: 'info',
      message: 'Batch processing paused',
      description: 'You can resume processing later',
    });
  }, [actions, showToast]);

  /**
   * Handle resume batch processing
   */
  const handleResume = useCallback(async () => {
    try {
      await actions.resume();
      showToast({
        variant: 'success',
        message: 'Batch processing resumed',
        description: 'Continuing from where you left off',
      });
    } catch (error) {
      showToast({
        variant: 'error',
        message: 'Failed to resume',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to resume batch processing',
      });
    }
  }, [actions, showToast]);

  /**
   * Handle cancel batch processing
   */
  const handleCancel = useCallback(() => {
    actions.cancel();
    showToast({
      variant: 'info',
      message: 'Batch processing cancelled',
      description: 'Remaining items were cancelled',
    });
  }, [actions, showToast]);

  /**
   * Handle retry failed items
   */
  const handleRetryFailed = useCallback(async () => {
    try {
      await actions.retryFailed();
      showToast({
        variant: 'success',
        message: 'Retrying failed items',
        description: 'Processing failed items again',
      });
    } catch (error) {
      showToast({
        variant: 'error',
        message: 'Retry failed',
        description:
          error instanceof Error ? error.message : 'Failed to retry items',
      });
    }
  }, [actions, showToast]);

  /**
   * Handle copy text
   */
  const handleCopyText = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast({
          variant: 'success',
          message: 'Text copied',
          description: `${text.length} characters copied to clipboard`,
        });
      } catch (err) {
        console.error('Failed to copy:', err);
        showToast({
          variant: 'error',
          message: 'Failed to copy',
          description: 'Please try again or copy manually',
        });
      }
    },
    [showToast],
  );

  // Check if can start
  const canStart = status === 'idle' && items.length > 0 && isSupported;
  const isProcessing = status === 'running';
  const isPaused = status === 'paused';
  const hasResults = items.length > 0;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Availability Warning */}
      {!isChecking && !isSupported && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Rewriter API is not supported in your browser. Requires Chrome 137+
            with Rewriter API enabled via{' '}
            <code className="px-1 py-0.5 bg-destructive/20 rounded text-xs">
              chrome://flags#rewriter-api-for-gemini-nano
            </code>
          </AlertDescription>
        </Alert>
      )}

      {!isChecking && requiresDownload && status === 'idle' && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
            Model download required. Click Start to begin download (may take a
            few moments on first use).
          </AlertDescription>
        </Alert>
      )}

      {/* Availability Error */}
      {availabilityError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {availabilityError}
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration */}
      <RewriterConfigComponent
        config={config}
        onChange={actions.updateConfig}
        disabled={isProcessing}
        defaultCollapsed={true}
        onViewCode={() => setIsCodeModalOpen(true)}
      />

      {/* Batch Input */}
      <BatchRewriteInput
        items={items}
        onAddItems={actions.addItems}
        onRemoveItem={actions.removeItem}
        onClearAll={actions.clearItems}
        onImportFile={handleImportFile}
        disabled={isProcessing}
      />

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Start Button */}
        {status === 'idle' && (
          <APIActionButton
            variant="rewrite"
            icon={Play}
            text={`Start Batch (${items.length} items)`}
            processingText="Starting..."
            onClick={handleStart}
            disabled={!canStart}
            isProcessing={false}
            showShortcutHint={false}
          />
        )}

        {/* Pause Button */}
        {isProcessing && (
          <Button variant="outline" size="default" onClick={handlePause}>
            <Pause className="w-4 h-4 mr-2" />
            Pause
          </Button>
        )}

        {/* Resume Button */}
        {isPaused && (
          <APIActionButton
            variant="rewrite"
            icon={Play}
            text="Resume"
            processingText="Resuming..."
            onClick={handleResume}
            disabled={false}
            isProcessing={false}
            showShortcutHint={false}
          />
        )}

        {/* Cancel Button */}
        {(isProcessing || isPaused) && (
          <Button variant="outline" size="default" onClick={handleCancel}>
            <Square className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}

        {/* Export Button */}
        {hasResults && progress.completed > 0 && (
          <Button
            variant="outline"
            size="default"
            onClick={() => handleExportResults()}
            className="ml-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Results
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {(isProcessing || isPaused || status === 'completed') && (
        <BatchProgressBar progress={progress} status={status} showDetails />
      )}

      {/* Results */}
      {hasResults && (
        <BatchRewriteResults
          items={items}
          onExport={handleExportResults}
          onCopyText={handleCopyText}
          onRetryFailed={progress.failed > 0 ? handleRetryFailed : undefined}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          variant={toast.variant}
          message={toast.message}
          description={toast.description}
          action={toast.action}
          open={open}
          onClose={hideToast}
        />
      )}

      {/* Code Modal */}
      <CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        config={config}
      />
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default BatchTab;
