/**
 * PlaygroundTab Component
 *
 * Main playground interface for Chrome AI Summarizer
 * Integrates all core components into a cohesive workflow
 *
 * @module PlaygroundTab
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Loader, Radio, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/common/error-boundary/ErrorBoundary';
import { validateTextInput } from '../../../shared/utils/validation';

// Import components
import { APIActionButton, Toast, useToast } from '../../../shared/components';
import { Sparkles } from 'lucide-react';
import { SummarizerConfig } from '../SummarizerConfig';
import { SummarizerInput } from '../SummarizerInput';
import { SummarizerResults } from '../SummarizerResults';
import { ResultsSkeleton } from '../ResultsSkeleton';
import { StreamingIndicator } from '../../../shared/components/StreamingIndicator';
import { UnifiedModelManager } from '../../../shared/components';
import { QuickSamplesCard } from '../QuickSamplesCard';
import { ChunkingStrategySelector } from '../ChunkingStrategySelector';
import { CodeModal } from '../CodeModal';

// Import types
import type {
  SummarizerCreateOptions,
  SummarizeOptions,
  SummarizerMetrics,
  SummarizerError,
} from '../../types/summarizer.types';

// ============================================================================
// Types
// ============================================================================

export interface PlaygroundTabProps {
  /** Configuration */
  config: SummarizerCreateOptions;

  /** Config change handler */
  onConfigChange: (config: SummarizerCreateOptions) => void;

  /** Availability status */
  availability: 'available' | 'after-download' | 'no';

  /** Is model ready */
  isReady: boolean;

  /** Is checking availability */
  isChecking: boolean;

  /** Is downloading model */
  isDownloading: boolean;

  /** Download progress */
  downloadProgress: { percentage: number; timeRemaining?: number } | null;

  /** Start download function */
  startDownload: () => Promise<void>;

  /** Summarize function */
  summarize: (
    text: string,
    options?: SummarizeOptions,
    config?: SummarizerCreateOptions,
  ) => Promise<string>;

  /** Summarize streaming function */
  summarizeStreaming: (
    text: string,
    options?: SummarizeOptions,
    config?: SummarizerCreateOptions,
  ) => Promise<ReadableStream<string>>;

  /** Current result */
  result: string | null;

  /** Is loading */
  isLoading: boolean;

  /** Is streaming */
  isStreaming: boolean;

  /** Error */
  error: SummarizerError | null;

  /** Metrics */
  metrics: SummarizerMetrics | null;

  /** Reset function */
  reset: () => void;

  /** Input text (shared from parent) */
  inputText?: string;

  /** Input text change handler */
  onInputTextChange?: (text: string) => void;

  /** Sample selection handler */
  onSampleSelect?: (sample: import('../../types/api.types').SampleText) => void;

  /** Selected sample ID */
  selectedSampleId?: string;

  /** Chunking strategy for long content */
  chunkingStrategy?: import('../../types/chunking.types').ChunkingStrategy;

  /** Chunking strategy change handler */
  onChunkingStrategyChange?: (
    strategy: import('../../types/chunking.types').ChunkingStrategy,
  ) => void;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// PlaygroundTab Component
// ============================================================================

/**
 * Main playground interface
 *
 * @example
 * ```tsx
 * <PlaygroundTab />
 * ```
 */
export function PlaygroundTab({
  config,
  onConfigChange,
  availability,
  isReady,
  isChecking,
  isDownloading,
  downloadProgress,
  startDownload,
  summarize,
  summarizeStreaming,
  result,
  isLoading,
  isStreaming,
  error: summarizerError,
  metrics,
  inputText: externalInputText,
  onInputTextChange,
  onSampleSelect,
  selectedSampleId,
  chunkingStrategy,
  onChunkingStrategyChange,
  className,
}: PlaygroundTabProps) {
  // State (only UI-specific state, not shared state)
  const [localInputText, setLocalInputText] = useState('');
  const [pendingSummarization, setPendingSummarization] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [streamingMode, setStreamingMode] = useState(false);
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false);
  const [inputError, setInputError] = useState<{
    message: string;
    helpText?: string;
  } | null>(null);
  const [showButtonCue, setShowButtonCue] = useState(false);

  // Toast for first-time UX guidance
  const { toast, open, showToast, hideToast } = useToast();

  // Use external input text if provided, otherwise use local state
  const inputText =
    externalInputText !== undefined ? externalInputText : localInputText;
  const setInputText = onInputTextChange || setLocalInputText;

  // Track previous availability for auto-run after download
  const previousAvailability = useRef(availability);

  // Default shared context for better summaries
  const DEFAULT_SUMMARY_CONTEXT =
    'Avoid jargon, use correct grammar, focus on clarity, ' +
    "and ensure the user can grasp the article's purpose " +
    'without needing to open the original content.';

  /**
   * Validate input text
   */
  useEffect(() => {
    if (inputText.length === 0) {
      setInputError(null); // No error for empty input (not yet submitted)
      return;
    }

    const validation = validateTextInput(inputText, {
      minLength: 100,
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
   * Show button cue for auto-loaded content (Endowed Progress Effect)
   */
  useEffect(() => {
    try {
      const hasAutoLoaded = sessionStorage.getItem('summarizer-autoload');
      const hasRun = sessionStorage.getItem('summarizer-ran');

      // Show cue if: auto-loaded, hasn't run yet, has valid text, model ready
      if (hasAutoLoaded && !hasRun && inputText.length >= 100 && isReady) {
        setShowButtonCue(true);
      } else {
        setShowButtonCue(false);
      }
    } catch (error) {
      // sessionStorage may not be available
      console.warn('[PlaygroundTab] sessionStorage not available:', error);
      setShowButtonCue(false);
    }
  }, [inputText, isReady]);

  /**
   * Track first run, hide button cue, and show Advanced Options tip (Zeigarnik Effect)
   */
  useEffect(() => {
    try {
      const hasSeenTip = sessionStorage.getItem('summarizer-tip');

      if (result && showButtonCue) {
        // Mark as run
        sessionStorage.setItem('summarizer-ran', 'true');
        setShowButtonCue(false);

        // Show tip about Advanced Options (once per session)
        if (!hasSeenTip) {
          // Delay for better UX - let user see results first
          const timeoutId = setTimeout(() => {
            showToast({
              variant: 'info',
              message: 'Pro Tip: Advanced Options',
              description:
                'For long documents, try different Chunking Strategies in Advanced Options for optimal results.',
            });
            try {
              sessionStorage.setItem('summarizer-tip', 'true');
            } catch (_e) {
              // Ignore if sessionStorage unavailable
              console.warn('[PlaygroundTab] sessionStorage not available:', _e);
            }
          }, 2000); // 2 seconds after first summary

          // Cleanup timeout on unmount
          return () => clearTimeout(timeoutId);
        }
      }
    } catch (error) {
      // sessionStorage may not be available
      console.warn('[PlaygroundTab] sessionStorage not available:', error);
    }
  }, [result, showButtonCue, showToast]);

  /**
   * Can summarize check - allow if model ready OR needs download (lazy download)
   * IMPORTANT: This must be declared BEFORE useEffect to avoid TDZ errors
   */
  const canSummarize =
    (isReady || availability === 'after-download') &&
    inputText.length >= 100 &&
    !isLoading &&
    !isDownloading;

  /**
   * Handle summarization with lazy download support
   */
  const handleSummarize = useCallback(async () => {
    try {
      // Check if model needs to be downloaded first
      if (availability === 'after-download' && !isDownloading) {
        // Model download required, triggering download
        setPendingSummarization(true); // Mark that we want to summarize after download
        await startDownload();
        return; // Exit - the useEffect will handle running summarization after download
      }

      // Ensure we have the model ready
      if (!isReady) {
        console.warn('[PlaygroundTab] Model not ready yet');
        return;
      }

      // Add default context and ensure outputLanguage is set
      const finalConfig: SummarizerCreateOptions = {
        ...config,
        sharedContext: config.sharedContext || DEFAULT_SUMMARY_CONTEXT,
        outputLanguage: config.outputLanguage || 'en',
      };

      // Use streaming or regular mode based on toggle
      if (streamingMode) {
        await summarizeStreaming(
          inputText,
          { outputLanguage: 'en' },
          finalConfig,
        );
      } else {
        await summarize(inputText, { outputLanguage: 'en' }, finalConfig);
      }
    } catch (error) {
      console.error('Summarization failed:', error);
    } finally {
      setPendingSummarization(false);
    }
  }, [
    availability,
    isDownloading,
    isReady,
    config,
    DEFAULT_SUMMARY_CONTEXT,
    streamingMode,
    inputText,
    startDownload,
    summarizeStreaming,
    summarize,
  ]);

  // Ref to hold latest handlers - prevents stale closures
  const handlersRef = useRef({
    handleSummarize,
    canSummarize,
    isLoading,
    isStreaming,
  });

  // Keep ref in sync with latest values
  useEffect(() => {
    handlersRef.current = {
      handleSummarize,
      canSummarize,
      isLoading,
      isStreaming,
    };
  }, [handleSummarize, canSummarize, isLoading, isStreaming]);

  /**
   * Auto-run summarization after download completes
   * Uses handlersRef to access latest handleSummarize
   */
  useEffect(() => {
    // Check if availability just changed from 'after-download' to 'available'
    if (
      previousAvailability.current === 'after-download' &&
      availability === 'available' &&
      pendingSummarization &&
      inputText.length >= 100
    ) {
      // Download complete, auto-running summarization
      handlersRef.current.handleSummarize();
    }

    previousAvailability.current = availability;
  }, [availability, pendingSummarization, inputText.length]);

  /**
   * Keyboard shortcuts (Cmd/Ctrl+K, Cmd/Ctrl+Enter, Escape)
   * Uses handlersRef to avoid stale closures while maintaining stable event listeners
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K: Open code modal
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCodeModalOpen((prev) => !prev);
      }

      // Escape: Cancel summarization (if streaming/loading)
      if (
        e.key === 'Escape' &&
        (handlersRef.current.isLoading || handlersRef.current.isStreaming)
      ) {
        e.preventDefault();
        // Note: Summarizer doesn't have explicit cancel yet
        console.log('Escape pressed - cancel not implemented');
      }
    };

    // Listen for Cmd+Enter from SummarizerInput
    const handleSummarizerSummarize = () => {
      if (handlersRef.current.canSummarize) {
        handlersRef.current.handleSummarize();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener(
      'summarizer-summarize',
      handleSummarizerSummarize,
    );

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener(
        'summarizer-summarize',
        handleSummarizerSummarize,
      );
    };
  }, []); // No deps needed - handlers accessed via ref

  /**
   * Handle config change (delegated to parent)
   */
  const handleConfigChange = (newConfig: SummarizerCreateOptions) => {
    onConfigChange(newConfig);
  };

  // ============================================================================
  // Render: Checking Availability
  // ============================================================================

  if (isChecking) {
    return (
      <div
        className={cn(
          'flex items-center justify-center min-h-[400px]',
          className,
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-slate-600">
            Checking Chrome AI availability...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Not Available
  // ============================================================================

  if (availability === 'no') {
    return (
      <div className={cn('space-y-4', className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Summarizer API Not Supported</AlertTitle>
          <AlertDescription>
            The Chrome AI Summarizer is not supported in your browser.
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Quick Setup</AlertTitle>
          <AlertDescription className="space-y-3">
            <div className="space-y-2">
              <p className="font-medium text-sm">Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Chrome 138+ or Edge Canary</li>
                <li>22+ GB free disk space</li>
                <li>4+ GB VRAM</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <p className="font-medium text-sm">Enable the API:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-sm">
                <li>
                  Open{' '}
                  <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                    chrome://flags
                  </code>
                </li>
                <li>
                  Search for{' '}
                  <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                    Summarization API
                  </code>
                </li>
                <li>Enable the flag and restart Chrome</li>
                <li>Reload this page</li>
              </ol>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              💡 Tip: All processing happens locally on your device - no data is
              sent to servers.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================================================
  // Render: Main Playground
  // ============================================================================

  // Check if this is first session (for UX onboarding)
  let isFirstSession = false;
  try {
    isFirstSession = !sessionStorage.getItem('summarizer-ran');
  } catch (error) {
    // sessionStorage may not be available in strict privacy mode
    console.warn('[PlaygroundTab] sessionStorage not available:', error);
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Quick Samples */}
      {onSampleSelect && (
        <QuickSamplesCard
          onSampleSelect={onSampleSelect}
          selectedSampleId={selectedSampleId}
          defaultCollapsed={!isFirstSession}
        />
      )}

      {/* Configuration */}
      <ErrorBoundary>
        <SummarizerConfig
          config={config}
          onChange={handleConfigChange}
          defaultCollapsed={true}
          showAdvanced
          onViewCode={() => setIsCodeModalOpen(true)}
        />
      </ErrorBoundary>

      {/* Input */}
      <ErrorBoundary>
        <SummarizerInput
          value={inputText}
          onChange={setInputText}
          showValidation
          showWordCount
          showSmartDetection
          error={inputError?.message}
          errorHelpText={inputError?.helpText}
        />
      </ErrorBoundary>

      {/* Advanced Options - Collapsible */}
      <ErrorBoundary>
        <Collapsible
          open={advancedOptionsOpen}
          onOpenChange={setAdvancedOptionsOpen}
          className="border border-slate-200 rounded-lg"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-slate-50">
            <div className="flex items-center gap-2">
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  advancedOptionsOpen && 'transform rotate-180',
                )}
              />
              <span className="font-medium">Advanced Options</span>
              <Badge variant="secondary" className="text-xs">
                2 features
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {advancedOptionsOpen ? 'Hide' : 'Show'}
            </span>
          </CollapsibleTrigger>

          <CollapsibleContent className="px-4 pb-4 space-y-4">
            {/* Chunking Strategy - First: Process long content */}
            {onChunkingStrategyChange && chunkingStrategy && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Long Content Processing</h4>
                <p className="text-xs text-muted-foreground">
                  Automatically applied to content exceeding 10,000 characters
                </p>
                <ChunkingStrategySelector
                  strategy={chunkingStrategy}
                  onChange={onChunkingStrategyChange}
                  showAdvanced={false}
                />
              </div>
            )}

            {/* Streaming Mode - Second: Display option */}
            <div className="space-y-2 pt-2 border-t">
              <div
                className="text-sm font-medium"
                id="summarizer-streaming-mode-label"
              >
                Streaming Mode
              </div>
              <div
                className="flex items-center gap-2"
                role="group"
                aria-labelledby="summarizer-streaming-mode-label"
              >
                <Button
                  variant={streamingMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStreamingMode(!streamingMode)}
                  className="text-xs"
                >
                  <Radio className="w-3 h-3 mr-1" />
                  {streamingMode ? 'Streaming Enabled' : 'Standard Mode'}
                </Button>
                {streamingMode && (
                  <span className="text-xs text-muted-foreground">
                    Real-time streaming enabled
                  </span>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </ErrorBoundary>

      {/* Run Button */}
      <div className="flex justify-end">
        <APIActionButton
          variant="summarize"
          icon={Sparkles}
          text={
            availability === 'after-download' && !isReady
              ? 'Download & Summarize'
              : 'Run Summarizer'
          }
          processingText={
            isDownloading
              ? 'Downloading Model...'
              : isStreaming
                ? 'Streaming...'
                : 'Summarizing...'
          }
          onClick={handleSummarize}
          disabled={!canSummarize}
          isProcessing={isLoading || isDownloading}
          showCancel={false}
          showShortcutHint
          className={cn(showButtonCue && 'animate-buttonCue')}
        />
      </div>

      {/* Streaming Status Indicator */}
      {isStreaming && (
        <StreamingIndicator
          text={`Streaming... (${result?.length || 0} characters received)`}
          variant="default"
        />
      )}

      {/* Error Alert */}
      {summarizerError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Summarization Error</AlertTitle>
          <AlertDescription>
            {summarizerError.message}
            {summarizerError.suggestion && (
              <>
                <br />
                <span className="text-xs mt-2 block">
                  {summarizerError.suggestion}
                </span>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      <ErrorBoundary>
        {isLoading && !result ? (
          <ResultsSkeleton
            showMetrics={false}
            inputLength={inputText.length}
            isStreamingMode={streamingMode}
          />
        ) : result ? (
          <SummarizerResults
            result={result}
            isStreaming={isStreaming}
            metrics={metrics}
            showMetrics={false}
          />
        ) : null}
      </ErrorBoundary>

      {/* Model Management (moved to bottom for better UX) */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900">
            Model Management
          </h3>
          <p className="text-sm text-slate-600">
            Monitor and manage AI model downloads and cache
          </p>
        </div>

        <UnifiedModelManager
          apiName="Summarizer"
          availability={availability}
          isReady={isReady}
          isLoading={isDownloading}
          loadingPhase={isDownloading ? 'downloading' : null}
          downloadProgress={
            downloadProgress
              ? {
                  loaded: 0,
                  total: 0,
                  percentage: downloadProgress.percentage,
                  timeRemaining: downloadProgress.timeRemaining,
                }
              : null
          }
          error={summarizerError?.message || null}
          onStartDownload={startDownload}
          modelInfo={{
            name: 'Summarizer Model',
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

      {/* Toast for UX guidance */}
      {toast && (
        <Toast
          variant={toast.variant}
          message={toast.message}
          description={toast.description}
          open={open}
          onClose={hideToast}
          duration={5000}
        />
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default PlaygroundTab;
