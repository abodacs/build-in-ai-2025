/**
 * Proofreader API Module Exports
 *
 * @module proofreader
 */

// Export specific items to avoid conflicts
export type {
  ProofreaderConfig,
  ProofreadCorrection,
  ProofreadResult,
  CorrectionType,
  ProofreaderLanguage,
  CorrectionState,
  CorrectionStats,
} from './types';

export {
  DEFAULT_PROOFREADER_CONFIG,
  PROOFREADER_LANGUAGE_OPTIONS,
  CORRECTION_TYPE_OPTIONS,
  CORRECTION_MODE_OPTIONS,
} from './types';

export {
  ChromeAIProofreaderService,
  ProofreaderManager,
  ProofreaderErrorHandler,
} from './services';

export type {
  UseProofreaderReturn,
  UseProofreaderAvailabilityReturn,
} from './hooks';

export { useProofreader, useProofreaderAvailability } from './hooks';

export {
  HistoryManager,
  createProofreaderSnapshot,
  type HistoryEntry,
  type ProofreaderHistoryState,
  type HistoryManagerConfig,
} from './utils';

export {
  ProofreaderConfig as ProofreaderConfigComponent,
  ProofreaderInput,
  ProofreaderResults,
  CorrectionCard,
  ProofreaderMain,
} from './components';
