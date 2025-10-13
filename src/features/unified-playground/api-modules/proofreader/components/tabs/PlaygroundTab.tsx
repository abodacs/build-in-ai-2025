/**
 * Proofreader PlaygroundTab
 *
 * Main playground interface for the Proofreader API.
 * Integrates all proofreader components into a complete workflow.
 *
 * @module proofreader/components/tabs/PlaygroundTab
 */

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useProofreader } from '../../hooks';
import { ProofreaderConfig } from '../ProofreaderConfig';
import { ProofreaderInput } from '../ProofreaderInput';
import { ProofreaderResults } from '../ProofreaderResults';
import { InlineCorrectionPopover } from '../InlineCorrectionPopover';
import { DEFAULT_PROOFREADER_CONFIG } from '../../types';
import type { ProofreadCorrection } from '../../types';

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

  const {
    isProofreading,
    corrections,
    correctionStates,
    correctedText,
    error,
    isLoading,
    config,
    canUndo,
    canRedo,
    actions,
  } = useProofreader(DEFAULT_PROOFREADER_CONFIG);

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
        disabled={false}
        maxLength={5000}
        correctionCount={corrections.length}
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
