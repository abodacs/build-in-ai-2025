/**
 * Proofreader PlaygroundTab
 *
 * Main playground interface for the Proofreader API.
 * Integrates all proofreader components into a complete workflow.
 *
 * @module proofreader/components/tabs/PlaygroundTab
 */

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useProofreader, useProofreaderAvailability } from '../../hooks';
import { ProofreaderConfig } from '../ProofreaderConfig';
import { ProofreaderInput } from '../ProofreaderInput';
import { ProofreaderResults } from '../ProofreaderResults';
import { InlineCorrectionPopover } from '../InlineCorrectionPopover';
import { UnifiedModelManager } from '../../../shared/components';
import { DEFAULT_PROOFREADER_CONFIG } from '../../types';
import type { ProofreadCorrection } from '../../types';
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
  const { availability, isReady } = useProofreaderAvailability({
    checkOnMount: true,
  });

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

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Config */}
      <ProofreaderConfig
        config={config}
        onChange={actions.updateConfig}
        disabled={isProofreading || isLoading}
      />

      {/* Unified Model Management */}
      <UnifiedModelManager
        apiName="Proofreader"
        availability={availability || 'no'}
        isReady={isReady}
        isLoading={isLoading}
        loadingPhase={loadingPhase}
        error={error?.message || null}
        modelInfo={{
          name: 'Proofreader Model',
          chromeVersion: '141-145',
          requiresOriginTrial: true,
          storageRequirement: '22GB+ free space',
          vramRequirement: '4GB+ VRAM',
        }}
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
        disabled={false}
        maxLength={5000}
        correctionCount={corrections.length}
        error={inputError?.message}
        errorHelpText={inputError?.helpText}
      />

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
      {corrections.length > 0 && (
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
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ProofreaderMain;
