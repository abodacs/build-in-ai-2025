/**
 * Proofreader PlaygroundTab
 *
 * Main playground interface for the Proofreader API.
 * Integrates all proofreader components into a complete workflow.
 *
 * @module proofreader/components/tabs/PlaygroundTab
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useProofreader, useProofreaderAvailability } from '../../hooks';
import { ProofreaderConfig } from '../ProofreaderConfig';
import { ProofreaderInput } from '../ProofreaderInput';
import { ProofreaderResults } from '../ProofreaderResults';
import { InlineCorrectionPopover } from '../InlineCorrectionPopover';
import { CorrectionLegend } from '../CorrectionLegend';
import { QuickSamples } from '../QuickSamples';
import { UnifiedModelManager } from '../../../shared/components';
import { DEFAULT_PROOFREADER_CONFIG } from '../../types';
import type { ProofreadCorrection } from '../../types';
import type { ProofreaderTemplate } from '../../data/samples';
import { validateTextInput } from '../../../shared/utils/validation';

// ============================================================================
// Component
// ============================================================================

/**
 * Proofreader Main Playground
 */
export function ProofreaderMain() {
  const [inputText, setInputText] = useState('');
  const [selectedCorrection, setSelectedCorrection] = useState<{
    correction: ProofreadCorrection;
    index: number;
  } | null>(null);
  const [inputError, setInputError] = useState<{
    message: string;
    helpText?: string;
  } | null>(null);

  // Availability hook for model management
  const { availability, isReady, isSupported } = useProofreaderAvailability();

  const {
    isProofreading,
    corrections,
    correctionStates,
    correctedText,
    error,
    isLoading,
    loadingPhase,
    config,
    canUndo,
    canRedo,
    downloadProgress,
    actions,
  } = useProofreader(DEFAULT_PROOFREADER_CONFIG);

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
      maxLength: 5000,
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

  // Handle proofread
  const handleProofread = async () => {
    if (!inputText.trim()) {
      return;
    }

    // Check if model is ready before proofreading
    if (!isReady) {
      console.warn('[Proofreader] Model not ready, cannot proofread');
      return;
    }

    await actions.proofread(inputText);
  };

  // Handle clear
  const handleClear = () => {
    setInputText('');
    actions.reset();
    setSelectedCorrection(null);
  };

  // Handle highlight click
  const handleHighlightClick = (
    correction: ProofreadCorrection,
    index: number,
  ) => {
    setSelectedCorrection({ correction, index });
  };

  // Handle popover close
  const handlePopoverClose = () => {
    setSelectedCorrection(null);
  };

  // Handle template selection
  const handleTemplateSelect = (template: ProofreaderTemplate) => {
    setInputText(template.exampleInput);
    if (template.config) {
      actions.updateConfig(template.config);
    }
  };

  // Handle model download
  const handleStartDownload = useCallback(async () => {
    try {
      await actions.downloadModel();
    } catch (error) {
      console.error('[Proofreader] Failed to download model:', error);
    }
  }, [actions]);

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Model Download Warning */}
      {!isLoading && !isReady && availability === 'after-download' && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
            Model download required. Use the Model Management section below to
            download the Proofreader model.
          </AlertDescription>
        </Alert>
      )}

      {/* API Not Supported Warning */}
      {!isReady && availability === 'no' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Proofreader API is not supported in your browser. Requires Chrome
            141-145 with Proofreader API enabled.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Samples */}
      <QuickSamples
        onTemplateSelect={handleTemplateSelect}
        currentInput={inputText}
        disabled={isProofreading || isLoading}
      />

      {/* Config */}
      <ProofreaderConfig
        config={config}
        onChange={actions.updateConfig}
        disabled={isProofreading || isLoading}
      />

      {/* Input */}
      <ProofreaderInput
        value={inputText}
        onChange={setInputText}
        onProofread={handleProofread}
        onClear={handleClear}
        corrections={corrections}
        onHighlightClick={handleHighlightClick}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={actions.undo}
        onRedo={actions.redo}
        isProofreading={isProofreading || isLoading}
        loadingPhase={loadingPhase}
        disabled={!isReady || !isSupported}
        maxLength={5000}
        correctionCount={corrections.length}
        error={inputError?.message}
        errorHelpText={inputError?.helpText}
      />

      {/* Correction Type Legend */}
      {corrections.length > 0 && <CorrectionLegend className="mt-2" />}

      {/* Inline Correction Popover */}
      {selectedCorrection && (
        <InlineCorrectionPopover
          correction={selectedCorrection.correction}
          index={selectedCorrection.index}
          isOpen={true}
          onClose={handlePopoverClose}
          onApply={actions.applyCorrectionAtIndex}
          onIgnore={actions.ignoreCorrectionAtIndex}
        />
      )}

      {/* Results */}
      {correctedText !== null && (
        <ProofreaderResults
          originalText={inputText}
          correctedText={correctedText || inputText}
          corrections={corrections}
          correctionStates={correctionStates}
          onApplyCorrection={actions.applyCorrectionAtIndex}
          onIgnoreCorrection={actions.ignoreCorrectionAtIndex}
          onApplyAll={actions.applyAllCorrections}
          onReset={actions.reset}
          disabled={isProofreading || isLoading}
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
          apiName="Proofreader"
          availability={availability || 'no'}
          isReady={isReady}
          isLoading={isLoading}
          loadingPhase={
            isLoading && downloadProgress
              ? 'downloading'
              : isLoading
                ? 'initializing'
                : loadingPhase
          }
          downloadProgress={downloadProgress}
          error={error?.message || null}
          onStartDownload={handleStartDownload}
          modelInfo={{
            name: 'Proofreader Model',
            chromeVersion: '141-145',
            requiresOriginTrial: true,
            storageRequirement: '22GB+ free space',
            vramRequirement: '4GB+ VRAM',
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ProofreaderMain;
