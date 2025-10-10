/**
 * WriterConfig Component
 *
 * Configuration panel for Writer API.
 * Uses the shared WritingConfigPanel with Writer-specific options.
 *
 * @module writer/components/WriterConfig
 */

import { WritingConfigPanel } from '../../shared/components';
import type { WriterConfig as WriterConfigType } from '../types';
import {
  WRITER_TONE_OPTIONS,
  WRITER_FORMAT_OPTIONS,
  WRITER_LENGTH_OPTIONS,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface WriterConfigProps {
  /** Current configuration */
  config: WriterConfigType;

  /** Configuration change handler */
  onChange: (config: WriterConfigType) => void;

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
 * Writer configuration panel
 *
 * Provides UI for configuring Writer API parameters using the
 * shared WritingConfigPanel component with Writer-specific options.
 *
 * @example
 * ```tsx
 * const [config, setConfig] = useState<WriterConfig>({
 *   tone: 'neutral',
 *   format: 'plain-text',
 *   length: 'medium',
 *   sharedContext: '',
 * });
 *
 * <WriterConfig
 *   config={config}
 *   onChange={setConfig}
 * />
 * ```
 */
export function WriterConfig({
  config,
  onChange,
  disabled = false,
  defaultCollapsed = false,
  className,
  onViewCode,
}: WriterConfigProps) {
  return (
    <WritingConfigPanel
      config={config}
      onChange={onChange}
      toneOptions={WRITER_TONE_OPTIONS}
      formatOptions={WRITER_FORMAT_OPTIONS}
      lengthOptions={WRITER_LENGTH_OPTIONS}
      title="Writer Configuration"
      description="Configure content generation settings"
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

export default WriterConfig;
