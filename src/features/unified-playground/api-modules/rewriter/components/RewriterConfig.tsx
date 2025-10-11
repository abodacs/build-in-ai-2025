/**
 * RewriterConfig Component
 *
 * Configuration panel for Rewriter API.
 * Uses the shared WritingConfigPanel with Rewriter-specific options.
 *
 * @module rewriter/components/RewriterConfig
 */

import { WritingConfigPanel } from '../../shared/components';
import type { RewriterConfig as RewriterConfigType } from '../types';
import {
  REWRITER_TONE_OPTIONS,
  REWRITER_FORMAT_OPTIONS,
  REWRITER_LENGTH_OPTIONS,
  REWRITER_LANGUAGE_OPTIONS,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface RewriterConfigProps {
  /** Current configuration */
  config: RewriterConfigType;

  /** Configuration change handler */
  onChange: (config: RewriterConfigType) => void;

  /** Disable all inputs */
  disabled?: boolean;

  /** Initial collapsed state */
  defaultCollapsed?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** View code handler */
  onViewCode?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Rewriter configuration component
 *
 * Provides UI for configuring Rewriter API settings.
 * Reuses shared WritingConfigPanel for consistency.
 *
 * @example
 * ```tsx
 * <RewriterConfig
 *   config={config}
 *   onChange={(newConfig) => setConfig(newConfig)}
 *   disabled={isRewriting}
 * />
 * ```
 */
export function RewriterConfig({
  config,
  onChange,
  disabled = false,
  defaultCollapsed = false,
  className,
  onViewCode,
}: RewriterConfigProps) {
  return (
    <WritingConfigPanel
      config={config}
      onChange={onChange}
      toneOptions={REWRITER_TONE_OPTIONS}
      formatOptions={REWRITER_FORMAT_OPTIONS}
      lengthOptions={REWRITER_LENGTH_OPTIONS}
      languageOptions={REWRITER_LANGUAGE_OPTIONS}
      title="Rewriter Configuration"
      description="Configure text transformation settings"
      showAdvanced
      defaultCollapsed={defaultCollapsed}
      disabled={disabled}
      className={className}
      onViewCode={onViewCode}
    />
  );
}

// ============================================================================
// Export
// ============================================================================

export default RewriterConfig;
