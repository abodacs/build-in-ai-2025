/**
 * Translator Playground
 *
 * Main playground component for the Translator API
 * Single unified interface following the Summarizer pattern
 *
 * @module TranslatorPlayground
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, RotateCcw, Package } from 'lucide-react';
import { TranslatorConfig } from './TranslatorConfig';
import { TranslatorInput } from './TranslatorInput';
import { TranslatorResults } from './TranslatorResults';
import { LanguagePairSelector } from './LanguagePairSelector';
import { CodeModal } from './CodeModal';
import { BatchTranslationCard } from './BatchTranslationCard';
import {
  APIActionButton,
  Toast,
  useToast,
  UnifiedModelManager,
} from '../../shared/components';
import { useTranslator, useTranslatorAvailability } from '../hooks';
import {
  type LanguageCode,
  type AdvancedSettings,
  type BatchItem,
  DEFAULT_ADVANCED_SETTINGS,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface TranslatorPlaygroundProps {
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// TranslatorPlayground Component
// ============================================================================

/**
 * Main playground for translator
 *
 * @example
 * ```tsx
 * <TranslatorPlayground />
 * ```
 */
export function TranslatorPlayground({ className }: TranslatorPlaygroundProps) {
  // ============================================================================
  // State Management
  // ============================================================================

  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>('en');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>('es');
  const [context, setContext] = useState('');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(
    DEFAULT_ADVANCED_SETTINGS,
  );
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [showBatchTranslation, setShowBatchTranslation] = useState(false);
  const [isBatchTranslating, setIsBatchTranslating] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // ============================================================================
  // Hooks
  // ============================================================================

  const {
    availability,
    isChecking,
    error: availabilityError,
    isReady,
    requiresDownload: _requiresDownload, // Available but not currently used in UI
    recheck,
    downloadProgress,
  } = useTranslatorAvailability(sourceLanguage, targetLanguage);

  const {
    translate,
    translateStreaming,
    isLoading,
    error,
    result,
    reset,
    cancel,
  } = useTranslator({
    sourceLanguage,
    targetLanguage,
    context,
  });

  // Toast hook
  const { toast, open, showToast, hideToast } = useToast();

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle language swap
   */
  const handleSwapLanguages = useCallback(() => {
    const tempSource = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(tempSource);

    // Also swap the text if we have a previous translation
    if (translatedText) {
      const tempInput = inputText;
      setInputText(translatedText);
      setTranslatedText(tempInput);
    }
  }, [sourceLanguage, targetLanguage, inputText, translatedText]);

  /**
   * Handle language pair selection
   */
  const handleSelectPair = useCallback(
    (source: LanguageCode, target: LanguageCode) => {
      setSourceLanguage(source);
      setTargetLanguage(target);
      setTranslatedText(''); // Clear previous translation
    },
    [],
  );

  /**
   * Handle translation
   */
  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) {
      return;
    }

    setTranslatedText('');

    // Determine if streaming should be used based on advanced settings
    const wordCount = inputText.trim().split(/\s+/).length;
    let useStreaming = false;

    if (advancedSettings.streamingMode === 'always') {
      useStreaming = true;
    } else if (advancedSettings.streamingMode === 'auto') {
      useStreaming = wordCount > advancedSettings.streamingThreshold;
    }
    // 'never' mode keeps useStreaming as false

    if (useStreaming) {
      setIsStreaming(true);
      await translateStreaming(inputText, (chunk) => {
        setTranslatedText(chunk);
      });
      setIsStreaming(false);
    } else {
      const translation = await translate(inputText);
      if (translation) {
        setTranslatedText(translation);
      }
    }
  }, [inputText, advancedSettings, translate, translateStreaming]);

  /**
   * Handle reset
   */
  const handleReset = useCallback(() => {
    setInputText('');
    setTranslatedText('');
    setContext('');
    reset();
  }, [reset]);

  /**
   * Handle copy
   */
  const handleCopy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast({
          variant: 'success',
          message: 'Translation copied to clipboard',
          description: `${text.length} characters copied`,
        });
      } catch (err) {
        console.error('Failed to copy:', err);
        showToast({
          variant: 'error',
          message: 'Failed to copy translation',
          description: 'Please try again or copy manually',
        });
      }
    },
    [showToast],
  );

  /**
   * Handle download
   */
  const handleDownload = useCallback(() => {
    if (!result) return;

    try {
      const data = JSON.stringify(result, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translation-${sourceLanguage}-${targetLanguage}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast({
        variant: 'success',
        message: 'Translation downloaded successfully',
        description: 'JSON file saved to your downloads folder',
      });
    } catch (err) {
      console.error('Failed to download:', err);
      showToast({
        variant: 'error',
        message: 'Failed to download translation',
        description: 'Please try again',
      });
    }
  }, [result, sourceLanguage, targetLanguage, showToast]);

  /**
   * Handle retry
   */
  const handleRetry = useCallback(() => {
    handleTranslate();
  }, [handleTranslate]);

  /**
   * Handle batch translation
   */
  const handleBatchTranslate = useCallback(
    async (items: BatchItem[]) => {
      setIsBatchTranslating(true);
      setBatchProgress(0);

      try {
        const total = items.length;
        const results = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item) continue;

          const translation = await translate(item.text);
          results.push({
            ...item,
            translation: translation || '',
          });

          // Update progress
          setBatchProgress(((i + 1) / total) * 100);
        }

        console.log('Batch translation complete:', results);
      } catch (error) {
        console.error('Batch translation error:', error);
      } finally {
        setIsBatchTranslating(false);
        setBatchProgress(0);
      }
    },
    [translate],
  );

  // Check if can translate
  const canTranslate =
    !isLoading && !isStreaming && inputText.trim().length > 0;

  // Ref to hold latest handlers - prevents stale closures in event listeners
  const handlersRef = useRef({
    handleTranslate,
    cancel,
    canTranslate,
    isStreaming,
  });

  // Keep ref in sync with latest values
  useEffect(() => {
    handlersRef.current = {
      handleTranslate,
      cancel,
      canTranslate,
      isStreaming,
    };
  }, [handleTranslate, cancel, canTranslate, isStreaming]);

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

      // Escape: Cancel translation
      if (e.key === 'Escape' && handlersRef.current.isStreaming) {
        e.preventDefault();
        handlersRef.current.cancel();
      }
    };

    // Listen for Cmd+Enter from TranslatorInput
    const handleTranslatorTranslate = () => {
      if (handlersRef.current.canTranslate) {
        handlersRef.current.handleTranslate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener(
      'translator-translate',
      handleTranslatorTranslate,
    );

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener(
        'translator-translate',
        handleTranslatorTranslate,
      );
    };
  }, []); // No deps needed - handlers accessed via ref

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Popular Language Pairs */}
      <LanguagePairSelector
        onSelectPair={handleSelectPair}
        currentSource={sourceLanguage}
        currentTarget={targetLanguage}
      />

      {/* Configuration (includes Advanced Settings) */}
      <TranslatorConfig
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        context={context}
        onSourceLanguageChange={setSourceLanguage}
        onTargetLanguageChange={setTargetLanguage}
        onContextChange={setContext}
        onSwapLanguages={handleSwapLanguages}
        availability={availability || 'no'}
        isCheckingAvailability={isChecking}
        advancedSettings={advancedSettings}
        onAdvancedSettingsChange={setAdvancedSettings}
        disabled={isLoading || isStreaming}
        onViewCode={() => setIsCodeModalOpen(true)}
        onRecheckAvailability={recheck}
        downloadProgress={downloadProgress}
      />

      {/* Input */}
      <TranslatorInput
        value={inputText}
        onChange={setInputText}
        placeholder="Paste or type text to translate..."
        disabled={isLoading || isStreaming}
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <APIActionButton
          variant="translate"
          icon={Zap}
          text="Translate"
          processingText="Translating..."
          onClick={handleTranslate}
          disabled={!canTranslate}
          isProcessing={isLoading || isStreaming}
          showCancel={isStreaming}
          onCancel={cancel}
          showShortcutHint
          data-testid="translate-btn"
        />

        {(inputText || translatedText) && (
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="gap-2"
            data-testid="reset-btn"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        )}

        <Button
          onClick={() => setShowBatchTranslation(!showBatchTranslation)}
          variant="outline"
          size="lg"
          className="gap-2"
          data-testid="toggle-batch-btn"
        >
          <Package className="h-4 w-4" />
          {showBatchTranslation ? 'Hide' : 'Show'} Batch
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            Translation Error: {error.message}
          </p>
        </div>
      )}

      {/* Results */}
      {(translatedText || isStreaming) && (
        <TranslatorResults
          originalText={inputText}
          translatedText={translatedText}
          isStreaming={isStreaming}
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          performance={result?.performance}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onRetry={handleRetry}
        />
      )}

      {/* Batch Translation */}
      {showBatchTranslation && (
        <BatchTranslationCard
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onTranslate={handleBatchTranslate}
          isTranslating={isBatchTranslating}
          progress={batchProgress}
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
          apiName="Translator"
          availability={availability || 'no'}
          isReady={isReady}
          isLoading={isLoading}
          loadingPhase={isLoading ? 'initializing' : null}
          error={error?.message || availabilityError?.message || null}
          modelInfo={{
            name: 'Translator Model',
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
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        context={context}
        advancedSettings={advancedSettings}
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
