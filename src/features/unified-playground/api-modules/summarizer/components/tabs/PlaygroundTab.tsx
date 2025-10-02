/**
 * PlaygroundTab Component
 *
 * Main playground interface for Chrome AI Summarizer
 * Integrates all core components into a cohesive workflow
 *
 * @module PlaygroundTab
 */

import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Import components
import { SparkButton } from '../SparkButton';
import { SummarizerConfig } from '../SummarizerConfig';
import { SummarizerInput } from '../SummarizerInput';
import { SummarizerResults } from '../SummarizerResults';
import { CodeModal } from '../CodeModal';

// Import hooks
import { useSummarizer } from '../../hooks/useSummarizer';
import { useSummarizerAvailability } from '../../hooks/useSummarizerAvailability';

// Import types
import type { SummarizerCreateOptions } from '../../types/summarizer.types';

// ============================================================================
// Types
// ============================================================================

export interface PlaygroundTabProps {
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
export function PlaygroundTab({ className }: PlaygroundTabProps) {
  // Load config from localStorage on mount
  const loadSavedConfig = (): SummarizerCreateOptions => {
    try {
      const saved = localStorage.getItem('summarizer-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure outputLanguage is set
        return {
          ...parsed,
          outputLanguage: parsed.outputLanguage || 'en',
        };
      }
    } catch (error) {
      console.warn('Failed to load saved config:', error);
    }
    return {
      type: 'tldr',
      format: 'plain-text',
      length: 'medium',
      outputLanguage: 'en',
    };
  };

  // State
  const [config, setConfig] = useState<SummarizerCreateOptions>(loadSavedConfig);
  const [inputText, setInputText] = useState('');
  const [pendingSummarization, setPendingSummarization] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  // Hooks
  const {
    availability,
    isReady,
    isChecking,
    isDownloading,
    downloadProgress,
    startDownload,
  } = useSummarizerAvailability();

  const {
    summarize,
    result,
    isLoading,
    error: summarizerError,
    metrics,
    updateConfig,
    reset,
  } = useSummarizer({
    config,
    trackPerformance: true,
    autoCleanup: true,
  });

  // Track previous availability for auto-run after download
  const previousAvailability = useRef(availability);

  // Default shared context for better summaries
  const DEFAULT_SUMMARY_CONTEXT =
    "Avoid jargon, use correct grammar, focus on clarity, " +
    "and ensure the user can grasp the article's purpose " +
    "without needing to open the original content.";

  /**
   * Handle summarization with lazy download support
   */
  const handleSummarize = async () => {
    try {
      // Check if model needs to be downloaded first
      if (availability === 'after-download' && !isDownloading) {
        console.log('[PlaygroundTab] Model download required, triggering download...');
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

      console.log('[PlaygroundTab] Starting summarization with config:', finalConfig);
      await summarize(inputText, {}, finalConfig);
    } catch (error) {
      console.error('Summarization failed:', error);
    } finally {
      setPendingSummarization(false);
    }
  };

  /**
   * Auto-run summarization after download completes
   */
  useEffect(() => {
    // Check if availability just changed from 'after-download' to 'readily'
    if (
      previousAvailability.current === 'after-download' &&
      availability === 'readily' &&
      pendingSummarization &&
      inputText.length >= 100
    ) {
      console.log('[PlaygroundTab] Download complete, auto-running summarization...');
      handleSummarize();
    }

    previousAvailability.current = availability;
  }, [availability, pendingSummarization, inputText]);

  /**
   * Keyboard shortcut handler (Cmd/Ctrl+K)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCodeModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Handle config change and persist to localStorage
   */
  const handleConfigChange = (newConfig: SummarizerCreateOptions) => {
    setConfig(newConfig);

    // Save to localStorage
    try {
      localStorage.setItem('summarizer-config', JSON.stringify(newConfig));
    } catch (error) {
      console.warn('Failed to save config to localStorage:', error);
    }

    // Reset results when config changes
    reset();
  };

  /**
   * Can summarize check - allow if model ready OR needs download (lazy download)
   */
  console.log({ isReady, availability, inputTextLength: inputText.length, isLoading, isDownloading, canSummarize: (isReady || availability === 'after-download') && inputText.length >= 100 && !isLoading && !isDownloading });
  const canSummarize =
    (isReady || availability === 'after-download') &&
    inputText.length >= 10 && // Lowered for testing (normally 100)
    !isLoading &&
    !isDownloading;

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
          <AlertTitle>Summarizer API Not Available</AlertTitle>
          <AlertDescription>
            The Chrome AI Summarizer is not available in your browser.
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
              💡 Tip: All processing happens locally on your device - no data is sent
              to servers.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================================================
  // Render: Main Playground
  // ============================================================================

  return (
    <div className={cn('space-y-6', className)}>
      {/* Download progress (inline) */}
      {isDownloading && (
        <Alert className="border-purple-200 bg-purple-50">
          <Loader className="h-4 w-4 text-purple-600 animate-spin" />
          <AlertTitle className="text-purple-900">Downloading AI Model...</AlertTitle>
          <AlertDescription className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-purple-800">
                <span className="font-medium">
                  Downloading model...
                </span>
                <span>
                  {downloadProgress
                    ? `${downloadProgress.percentage.toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <Progress
                value={downloadProgress?.percentage || 0}
                className="h-2"
              />
            </div>
            {downloadProgress && downloadProgress.timeRemaining ? (
              <p className="text-xs text-purple-700">
                Estimated time remaining: {downloadProgress.timeRemaining} seconds
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration */}
      <SummarizerConfig
        config={config}
        onChange={handleConfigChange}
        defaultCollapsed={true}
        showAdvanced
        onViewCode={() => setIsCodeModalOpen(true)}
      />

      {/* Input */}
      <SummarizerInput
        value={inputText}
        onChange={setInputText}
        showValidation
        showWordCount
        showSmartDetection
      />

      {/* SparkButton */}
      <div className="flex justify-end">
        <SparkButton
          onClick={handleSummarize}
          disabled={!canSummarize}
          isProcessing={isLoading || isDownloading}
          text={availability === 'after-download' && !isReady ? "Download & Summarize" : "Run Summarizer"}
          processingText={isDownloading ? "Downloading Model..." : "Summarizing..."}
          fullWidth={false}
        />
      </div>

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
      {result && (
        <SummarizerResults
          result={result}
          isStreaming={isLoading}
          metrics={metrics}
          showMetrics
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

export default PlaygroundTab;
