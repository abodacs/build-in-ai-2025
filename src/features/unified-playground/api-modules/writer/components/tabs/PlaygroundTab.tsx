/**
 * Writer PlaygroundTab Component
 *
 * Main playground interface for Writer API.
 * Integrates all Writer components into a complete working interface.
 *
 * @module writer/components/tabs/PlaygroundTab
 */

import { useState, useEffect, useRef } from 'react';
import { Wand2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  WriterConfigComponent,
  WriterInput,
  WriterResults,
  QuickTemplates,
} from '../index';
import { CodeModal } from '../CodeModal';
import {
  ContentGenerationSkeleton,
  APIActionButton,
  Toast,
  useToast,
  UnifiedModelManager,
} from '../../../shared/components';
import { useWriter, useWriterAvailability } from '../../hooks';
import { DEFAULT_WRITER_CONFIG } from '../../types';
import type { WriterTemplate } from '../../types';
import { validateTextInput } from '../../../shared/utils/validation';

// ============================================================================
// Component
// ============================================================================

/**
 * Writer API playground tab
 *
 * Complete interactive interface for the Writer API with:
 * - Configuration panel
 * - Prompt input
 * - Quick templates
 * - Results display with streaming
 * - Availability checking
 *
 * @example
 * ```tsx
 * <PlaygroundTab />
 * ```
 */
export function PlaygroundTab() {
  // Local state for UI
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [inputError, setInputError] = useState<{
    message: string;
    helpText?: string;
  } | null>(null);

  // Writer hook
  const {
    isWriting,
    isStreaming,
    content,
    error,
    isLoading,
    config,
    metrics,
    actions,
  } = useWriter(DEFAULT_WRITER_CONFIG);

  // Debug: Log content state changes
  useEffect(() => {
    console.log('📝 PlaygroundTab: content state changed:', {
      hasContent: !!content,
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 50) || '(empty)',
      isWriting,
      isStreaming,
      isLoading,
    });
  }, [content, isWriting, isStreaming, isLoading]);

  // Availability hook
  const {
    availability,
    isChecking,
    error: availabilityError,
    isSupported,
    requiresDownload,
  } = useWriterAvailability();

  // Derive isReady state for UnifiedModelManager
  const isReady = availability === 'readily';

  // Toast hook
  const { toast, open, showToast, hideToast } = useToast();

  /**
   * Validate prompt input
   */
  useEffect(() => {
    if (prompt.length === 0) {
      setInputError(null); // No error for empty input
      return;
    }

    const validation = validateTextInput(prompt, {
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
  }, [prompt]);

  /**
   * Handle template selection
   */
  const handleSelectTemplate = (template: WriterTemplate) => {
    setPrompt(template.prompt);

    // Scroll to input
    document.getElementById('writer-prompt')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  /**
   * Handle generate action
   */
  const handleGenerate = async () => {
    console.log('🎯 handleGenerate called!');
    console.log('  → Prompt length:', prompt.length);
    console.log('  → Context length:', context?.length || 0);
    console.log('  → isWriting:', isWriting);
    console.log('  → isLoading:', isLoading);
    console.log('  → isSupported:', isSupported);
    console.log('  → canGenerate:', canGenerate);

    if (!prompt.trim()) {
      console.warn('⚠️ No prompt provided, aborting');
      return;
    }

    console.log('✅ Starting content generation...');

    try {
      // Stream content for best UX - real-time display as it generates
      await actions.writeStreaming(
        prompt,
        (chunk) => {
          // Content streams to UI automatically via hook's internal setContent()
          console.log(`📦 Chunk received: ${chunk.length} chars`);
        },
        context || undefined,
      );
      console.log('✅ handleGenerate completed successfully');
    } catch (err) {
      // Error is already handled by the hook
      console.error('❌ Writer generation failed in handleGenerate:', err);
    }
  };

  /**
   * Handle copy action
   */
  const handleCopy = async () => {
    if (content) {
      try {
        await navigator.clipboard.writeText(content);
        showToast({
          variant: 'success',
          message: 'Content copied to clipboard',
          description: `${content.length} characters copied`,
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
        a.download = `writer-output-${Date.now()}.txt`;
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
    if (prompt.trim()) {
      handleGenerate();
    }
  };

  // Check if can generate
  const canGenerate =
    !isWriting && !isLoading && prompt.trim().length > 0 && isSupported;

  // Ref to hold latest handlers - prevents stale closures in event listeners
  const handlersRef = useRef({
    handleGenerate,
    canGenerate,
    isWriting,
    cancelFn: actions.cancel,
  });

  // Keep ref in sync with latest values
  useEffect(() => {
    handlersRef.current = {
      handleGenerate,
      canGenerate,
      isWriting,
      cancelFn: actions.cancel,
    };
  }, [handleGenerate, canGenerate, isWriting, actions.cancel]);

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

      // Escape: Cancel generation
      if (e.key === 'Escape' && handlersRef.current.isWriting) {
        e.preventDefault();
        handlersRef.current.cancelFn();
      }
    };

    // Listen for Cmd+Enter from WriterInput
    const handleWriterGenerate = () => {
      if (handlersRef.current.canGenerate) {
        handlersRef.current.handleGenerate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('writer-generate', handleWriterGenerate);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('writer-generate', handleWriterGenerate);
    };
  }, []); // No deps needed - handlers accessed via ref

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Availability Warning */}
      {!isChecking && !isSupported && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Writer API is not supported in your browser. Requires Chrome 137+
            with Writer API enabled via{' '}
            <code className="px-1 py-0.5 bg-destructive/20 rounded text-xs">
              chrome://flags#writer-api-for-gemini-nano
            </code>
          </AlertDescription>
        </Alert>
      )}

      {!isChecking && requiresDownload && !isLoading && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
            Model download required. Click Generate to start download (may take
            a few moments on first use).
          </AlertDescription>
        </Alert>
      )}

      {/* Availability Error */}
      {availabilityError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {availabilityError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Templates */}
      <QuickTemplates
        onSelectTemplate={handleSelectTemplate}
        onConfigUpdate={actions.updateConfig}
        disabled={isWriting}
        defaultCollapsed={true}
      />

      {/* Configuration */}
      <WriterConfigComponent
        config={config}
        onChange={actions.updateConfig}
        disabled={isWriting}
        defaultCollapsed={true}
        onViewCode={() => setIsCodeModalOpen(true)}
      />

      {/* Prompt Input */}
      <WriterInput
        value={prompt}
        onChange={setPrompt}
        contextValue={context}
        onContextChange={setContext}
        disabled={isWriting}
        showCharacterCount
        error={inputError?.message}
        errorHelpText={inputError?.helpText}
      />

      {/* Generate Button */}
      <div className="flex justify-end">
        <APIActionButton
          variant="write"
          icon={Wand2}
          text="Generate Content"
          processingText={isLoading ? 'Preparing...' : 'Generating...'}
          onClick={handleGenerate}
          disabled={!canGenerate}
          isProcessing={isLoading || isWriting}
          showCancel={isWriting}
          onCancel={actions.cancel}
          showShortcutHint
        />
      </div>

      {/* Error Display */}
      {error && !isWriting && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <div className="font-medium mb-1">Generation Failed</div>
            <div>{error.message}</div>
            {error.message.includes('user activation') && (
              <div className="mt-2 text-xs">
                Note: The Writer API requires user activation. Make sure you
                clicked the Generate button.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Results - Show skeleton only when loading with no content yet */}
      {(() => {
        const showSkeleton = !content && (isLoading || isWriting);
        const showResults = !!content;

        console.log('🎬 Render decision:', {
          content: content ? `${content.length} chars` : 'null',
          isLoading,
          isWriting,
          isStreaming,
          showSkeleton,
          showResults,
        });

        if (showSkeleton) {
          console.log('→ Rendering skeleton');
          return (
            <ContentGenerationSkeleton
              text={isStreaming ? 'Generating content...' : 'Preparing...'}
              showCancel={!!actions.cancel}
              onCancel={actions.cancel}
              paragraphs={3}
            />
          );
        }

        if (showResults) {
          console.log(
            '→ Rendering WriterResults with content:',
            content.substring(0, 50),
          );
          return (
            <WriterResults
              content={content}
              isWriting={isWriting}
              isStreaming={isStreaming}
              metrics={metrics}
              onCopy={handleCopy}
              onDownload={handleDownload}
              onRetry={handleRetry}
              onCancel={isStreaming ? actions.cancel : undefined}
            />
          );
        }

        console.log('→ Rendering nothing');
        return null;
      })()}

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
          apiName="Writer"
          availability={availability || 'no'}
          isReady={isReady}
          isLoading={isLoading}
          loadingPhase={isLoading ? 'initializing' : null}
          error={error?.message || availabilityError?.message || null}
          modelInfo={{
            name: 'Writer Model',
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
