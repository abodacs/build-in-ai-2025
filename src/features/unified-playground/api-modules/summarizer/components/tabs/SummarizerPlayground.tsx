/**
 * Summarizer Playground Container
 *
 * Container component that manages shared state for all summarizer tabs
 * Handles tab navigation and passes state to child components
 *
 * @module SummarizerPlayground
 */

import { useState, useEffect } from 'react';

// Import tab components
import { PlaygroundTab } from './PlaygroundTab';

// Import hooks
import { useSummarizer } from '../../hooks/useSummarizer';
import { useSummarizerAvailability } from '../../hooks/useSummarizerAvailability';

// Import types
import type { SummarizerCreateOptions } from '../../types/summarizer.types';
import type { ChunkingStrategy } from '../../types/chunking.types';
import type { SampleText } from '../../types/api.types';

// Import samples
import { QUICK_SAMPLES } from '../QuickSamplesCard';

// ============================================================================
// Types
// ============================================================================

export interface SummarizerPlaygroundProps {
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// SummarizerPlayground Container
// ============================================================================

/**
 * Main container for summarizer playground
 * Manages shared state and renders internal tabs
 *
 * @example
 * ```tsx
 * <SummarizerPlayground />
 * ```
 */
export function SummarizerPlayground({ className }: SummarizerPlaygroundProps) {
  // ============================================================================
  // State Management
  // ============================================================================

  // Load config from localStorage
  const loadSavedConfig = (): SummarizerCreateOptions => {
    try {
      const saved = localStorage.getItem('summarizer-config');
      if (saved) {
        const parsed = JSON.parse(saved);
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

  // Configuration state
  const [config, setConfig] =
    useState<SummarizerCreateOptions>(loadSavedConfig);

  // Input text state (shared with PlaygroundTab)
  const [inputText, setInputText] = useState('');

  // Selected sample ID for visual feedback
  const [selectedSampleId, setSelectedSampleId] = useState<
    string | undefined
  >();

  // Chunking strategy for advanced features
  const [chunkingStrategy, setChunkingStrategy] = useState<ChunkingStrategy>({
    type: 'recursive',
    maxChunkSize: 10000,
  });

  // ============================================================================
  // Hooks - Shared State
  // ============================================================================

  // Model availability and download
  const {
    availability,
    isReady,
    isChecking,
    isDownloading,
    downloadProgress,
    startDownload,
  } = useSummarizerAvailability();

  // Summarizer operations
  const {
    summarize,
    summarizeStreaming,
    result,
    isLoading,
    isStreaming,
    error: summarizerError,
    metrics,
    reset,
  } = useSummarizer({
    config,
    trackPerformance: true,
    autoCleanup: true,
    chunkingStrategy,
  });

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle config change
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
   * Handle sample selection
   */
  const handleSampleSelect = (sample: SampleText) => {
    console.log('[SummarizerPlayground] Sample selected:', sample.id);

    // Set the input text
    setInputText(sample.text);

    // Update selected sample ID for visual feedback
    setSelectedSampleId(sample.id);

    // Update config with sample's recommended config
    if (sample.recommendedConfig) {
      handleConfigChange(sample.recommendedConfig);
    }
  };

  // ============================================================================
  // Auto-load First Sample (Endowed Progress Effect)
  // ============================================================================

  /**
   * Auto-load the Article sample on first session visit
   * Implements the Endowed Progress Effect from UX psychology
   */
  useEffect(() => {
    try {
      const hasAutoLoaded = sessionStorage.getItem('summarizer-autoload');

      // Only auto-load if:
      // 1. Haven't auto-loaded this session
      // 2. No text in input (blank slate)
      // 3. We have samples to load
      if (!hasAutoLoaded && !inputText && QUICK_SAMPLES.length > 0) {
        const articleSample = QUICK_SAMPLES[0]; // First sample is "Article"
        if (articleSample) {
          handleSampleSelect(articleSample);
          sessionStorage.setItem('summarizer-autoload', 'true');
          console.log(
            '[SummarizerPlayground] Auto-loaded Article sample for first-time UX',
          );
        }
      }
    } catch (error) {
      // sessionStorage may not be available in strict privacy mode
      console.warn(
        '[SummarizerPlayground] sessionStorage not available:',
        error,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - intentionally ignoring dependencies

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={className}>
      <PlaygroundTab
        // Pass all shared state
        config={config}
        onConfigChange={handleConfigChange}
        availability={availability}
        isReady={isReady}
        isChecking={isChecking}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        startDownload={startDownload}
        summarize={summarize}
        summarizeStreaming={summarizeStreaming}
        result={result}
        isLoading={isLoading}
        isStreaming={isStreaming}
        error={summarizerError}
        metrics={metrics}
        reset={reset}
        inputText={inputText}
        onInputTextChange={setInputText}
        onSampleSelect={handleSampleSelect}
        selectedSampleId={selectedSampleId}
        chunkingStrategy={chunkingStrategy}
        onChunkingStrategyChange={setChunkingStrategy}
      />
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default SummarizerPlayground;
