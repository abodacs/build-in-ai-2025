/**
 * Rewriter PlaygroundTab Component
 *
 * Main playground interface for Rewriter API.
 * Integrates all Rewriter components into a complete working interface.
 *
 * @module rewriter/components/tabs/PlaygroundTab
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, AlertCircle, X, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  RewriterConfigComponent,
  RewriterInput,
  RewriterResults,
  QuickSamples,
} from '../index';
import { CodeModal } from '../CodeModal';
import {
  APIActionButton,
  Toast,
  useToast,
  UnifiedModelManager,
} from '../../../shared/components';
import { useRewriter, useRewriterAvailability } from '../../hooks';
import {
  DEFAULT_REWRITER_CONFIG,
  type RewriterTemplate,
  type RewriterConfig,
} from '../../types';
import { validateTextInput } from '../../../shared/utils/validation';

// ============================================================================
// Component
// ============================================================================

/**
 * Rewriter API playground tab
 *
 * Complete interactive interface for the Rewriter API with:
 * - Configuration panel
 * - Input text area
 * - Results display with diff view
 * - Availability checking
 *
 * @example
 * ```tsx
 * <PlaygroundTab />
 * ```
 */
export function PlaygroundTab() {
  // Local state for UI
  const [inputText, setInputText] = useState('');
  const [context, setContext] = useState('');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [inputError, setInputError] = useState<{
    message: string;
    helpText?: string;
  } | null>(null);

  // Rewriter hook
  const {
    isRewriting,
    isStreaming,
    content,
    originalInput,
    error,
    isLoading,
    config,
    metrics,
    actions,
  } = useRewriter(DEFAULT_REWRITER_CONFIG);

  // Availability hook
  const {
    availability,
    isChecking,
    error: availabilityError,
    isSupported,
    requiresDownload,
    isReady,
    startDownload,
  } = useRewriterAvailability();

  // Toast hook
  const { toast, open, showToast, hideToast } = useToast();

  /**
   * Validate input text
   */
  useEffect(() => {
    if (inputText.length === 0) {
      setInputError(null); // No error for empty input
      return;
    }

    const validation = validateTextInput(inputText, {
      minLength: 10,
      maxLength: 10000,
      required: false,
    });

    if (!validation.valid && validation.error) {
      setInputError({
        message: validation.error.message,
        helpText: validation.error.helpText,
      });
    } else {
      setInputError(null);
    }
  }, [inputText]);

  /**
   * Handle rewrite action
   */
  const handleRewrite = useCallback(async () => {
    if (!inputText.trim()) {
      showToast({
        variant: 'error',
        message: 'Input required',
        description: 'Please enter some text to rewrite',
      });
      return;
    }

    // Use streaming for better UX
    // Pass context (optional) for task-specific guidance
    await actions.rewriteStreaming(
      inputText,
      (chunk) => {
        // Chunk received - UI updates automatically via hook
        // The chunk parameter is available here if needed for custom handling
        console.log('Streaming chunk received:', chunk.length, 'chars');
      },
      context || undefined, // Pass context if provided
    );
  }, [inputText, context, actions, showToast]);

  /**
   * Handle copy rewritten text
   */
  const handleCopyRewritten = async () => {
    if (content) {
      try {
        await navigator.clipboard.writeText(content);
        showToast({
          variant: 'success',
          message: 'Rewritten text copied',
          description: `${content.length} characters copied to clipboard`,
        });
      } catch (err) {
        console.error('Failed to copy:', err);
        showToast({
          variant: 'error',
          message: 'Failed to copy content',
          description: 'Please try again or copy manually',
        });
      }
    }
  };

  /**
   * Handle copy original text
   */
  const handleCopyOriginal = async () => {
    if (originalInput) {
      try {
        await navigator.clipboard.writeText(originalInput);
        showToast({
          variant: 'success',
          message: 'Original text copied',
          description: `${originalInput.length} characters copied to clipboard`,
        });
      } catch (err) {
        console.error('Failed to copy:', err);
        showToast({
          variant: 'error',
          message: 'Failed to copy content',
          description: 'Please try again or copy manually',
        });
      }
    }
  };

  /**
   * Handle download action
   */
  const handleDownload = () => {
    if (content) {
      try {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rewriter-output-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast({
          variant: 'success',
          message: 'File downloaded successfully',
          description: 'Content saved to your downloads folder',
        });
      } catch (err) {
        console.error('Failed to download:', err);
        showToast({
          variant: 'error',
          message: 'Failed to download file',
          description: 'Please try again',
        });
      }
    }
  };

  /**
   * Handle retry action
   */
  const handleRetry = () => {
    actions.reset();
    if (inputText.trim()) {
      handleRewrite();
    }
  };

  /**
   * Handle template selection
   */
  const handleTemplateSelect = (template: RewriterTemplate) => {
    // Load template input
    setInputText(template.exampleInput);

    // Apply template configuration if available
    if (template.config) {
      actions.updateConfig(template.config as Partial<RewriterConfig>);
    }

    // Set context if provided
    if (template.instructions) {
      setContext(template.instructions);
    }

    // Show toast
    showToast({
      variant: 'success',
      message: 'Template loaded',
      description: `"${template.name}" sample is ready to rewrite`,
    });
  };

  /**
   * Handle preset selection
   */
  const handlePresetSelect = (
    presetConfig: Partial<RewriterConfig>,
    presetName: string,
  ) => {
    // Apply preset configuration
    actions.updateConfig(presetConfig);

    // Show toast
    showToast({
      variant: 'success',
      message: 'Preset applied',
      description: `"${presetName}" configuration applied`,
    });
  };

  // Check if can rewrite
  const canRewrite =
    !isRewriting && !isLoading && inputText.trim().length > 0 && isSupported;

  // Ref to hold latest handlers - prevents stale closures in event listeners
  const handlersRef = useRef({
    handleRewrite,
    canRewrite,
    isRewriting,
    cancelFn: actions.cancel,
  });

  // Keep ref in sync with latest values
  useEffect(() => {
    handlersRef.current = {
      handleRewrite,
      canRewrite,
      isRewriting,
      cancelFn: actions.cancel,
    };
  }, [handleRewrite, canRewrite, isRewriting, actions.cancel]);

  /**
   * Keyboard shortcuts
   * Uses handlersRef to avoid stale closures while maintaining stable event listeners
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K: Open code modal
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCodeModalOpen((prev) => !prev);
      }

      // Escape: Cancel rewriting
      if (e.key === 'Escape' && handlersRef.current.isRewriting) {
        e.preventDefault();
        handlersRef.current.cancelFn();
      }
    };

    // Listen for Cmd+Enter from RewriterInput
    const handleRewriterRewrite = () => {
      if (handlersRef.current.canRewrite) {
        handlersRef.current.handleRewrite();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('rewriter-rewrite', handleRewriterRewrite);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('rewriter-rewrite', handleRewriterRewrite);
    };
  }, []); // No deps needed - handlers accessed via ref

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

      {!isChecking && requiresDownload && !isLoading && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
            Model download required. Click Rewrite to start download (may take a
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

      {/* Quick Samples */}
      <QuickSamples
        onTemplateSelect={handleTemplateSelect}
        onPresetSelect={handlePresetSelect}
        currentInput={inputText}
        disabled={isRewriting}
      />

      {/* Configuration */}
      <RewriterConfigComponent
        config={config}
        onChange={actions.updateConfig}
        disabled={isRewriting}
        defaultCollapsed={true}
        onViewCode={() => setIsCodeModalOpen(true)}
      />

      {/* Input Text */}
      <RewriterInput
        value={inputText}
        onChange={setInputText}
        contextValue={context}
        onContextChange={setContext}
        disabled={isRewriting}
        showCharacterCount
        error={inputError?.message}
        errorHelpText={inputError?.helpText}
      />

      {/* Rewrite Button */}
      <div className="flex justify-end">
        <APIActionButton
          variant="rewrite"
          icon={RefreshCw}
          text="Rewrite Text"
          processingText={isLoading ? 'Preparing...' : 'Rewriting...'}
          onClick={handleRewrite}
          disabled={!canRewrite}
          isProcessing={isLoading || isRewriting}
          showCancel={isRewriting}
          onCancel={actions.cancel}
          showShortcutHint
        />
      </div>

      {/* Enhanced Error Display with Actions */}
      {error && !isRewriting && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div>
              <div className="font-medium mb-1">Rewrite Failed</div>
              <div className="text-sm">{error.message}</div>
            </div>

            {/* Error-specific guidance and actions */}
            <div className="space-y-2">
              {/* User Activation Error */}
              {error.message.includes('user activation') && (
                <div className="space-y-2">
                  <p className="text-xs">
                    💡 <strong>Solution:</strong> The API requires a user
                    interaction. Click the &quot;Rewrite Text&quot; button to
                    try again.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="h-8 text-xs bg-background"
                  >
                    <RotateCcw className="w-3 h-3 mr-1.5" />
                    Try Again
                  </Button>
                </div>
              )}

              {/* Download/Model Error */}
              {(error.message.includes('download') ||
                error.message.includes('model')) && (
                <div className="space-y-2">
                  <p className="text-xs">
                    💡 <strong>Solution:</strong> The AI model needs to be
                    downloaded first. This is a one-time process.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="h-8 text-xs bg-background"
                    >
                      <RotateCcw className="w-3 h-3 mr-1.5" />
                      Retry Download
                    </Button>
                  </div>
                </div>
              )}

              {/* API Not Available */}
              {error.message.includes('not available') && (
                <div className="space-y-2">
                  <p className="text-xs">
                    💡 <strong>Solution:</strong> Enable the Rewriter API in
                    Chrome flags.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          'chrome://flags#rewriter-api-for-gemini-nano',
                        );
                        showToast({
                          variant: 'success',
                          message: 'Copied to clipboard',
                          description: 'Paste this URL in your browser',
                        });
                      }}
                      className="h-8 text-xs bg-background"
                    >
                      📋 Copy Chrome Flags URL
                    </Button>
                  </div>
                </div>
              )}

              {/* Input Too Long */}
              {(error.message.includes('too long') ||
                error.message.includes('limit')) && (
                <div className="space-y-2">
                  <p className="text-xs">
                    💡 <strong>Solution:</strong> Try shortening your input text
                    or using the &quot;Make Concise&quot; preset first.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const shortened = inputText.slice(0, 5000);
                        setInputText(shortened);
                        showToast({
                          variant: 'success',
                          message: 'Text shortened',
                          description: 'Trimmed to 5000 characters',
                        });
                      }}
                      className="h-8 text-xs bg-background"
                    >
                      ✂️ Shorten Text
                    </Button>
                  </div>
                </div>
              )}

              {/* Generic Error */}
              {!error.message.includes('user activation') &&
                !error.message.includes('download') &&
                !error.message.includes('not available') &&
                !error.message.includes('too long') && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="h-8 text-xs bg-background"
                    >
                      <RotateCcw className="w-3 h-3 mr-1.5" />
                      Try Again
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        actions.reset();
                        showToast({
                          variant: 'success',
                          message: 'Reset complete',
                          description: 'You can start over',
                        });
                      }}
                      className="h-8 text-xs bg-background"
                    >
                      <X className="w-3 h-3 mr-1.5" />
                      Reset
                    </Button>
                  </div>
                )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Results - Only show when there's content or actively rewriting */}
      {(content || isRewriting) && (
        <RewriterResults
          originalText={originalInput}
          content={content}
          isRewriting={isRewriting}
          isStreaming={isStreaming}
          metrics={metrics}
          onCopyOriginal={handleCopyOriginal}
          onCopyRewritten={handleCopyRewritten}
          onDownload={handleDownload}
          onRetry={handleRetry}
          onCancel={isStreaming ? actions.cancel : undefined}
        />
      )}

      {/* Model Management */}
      <div className="space-y-3 pt-6 border-t">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900">
            Model Management
          </h3>
          <p className="text-sm text-slate-600">
            Monitor and manage AI model status
          </p>
        </div>

        <UnifiedModelManager
          apiName="Rewriter"
          availability={availability || 'no'}
          isReady={isReady}
          isLoading={isLoading}
          loadingPhase={isLoading ? 'initializing' : null}
          error={error?.message || availabilityError || null}
          onStartDownload={startDownload}
          modelInfo={{
            name: 'Rewriter Model',
            chromeVersion: '138+',
            requiresOriginTrial: false,
            storageRequirement: '22GB+ free space',
            vramRequirement: '4GB+ VRAM',
          }}
        />
      </div>

      {/* Code Modal */}
      <CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        config={config}
      />

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
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default PlaygroundTab;
