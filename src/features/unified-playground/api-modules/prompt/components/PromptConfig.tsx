/**
 * PromptConfig Component
 *
 * Configuration panel for Chrome AI Prompt API options
 * Supports system prompt, temperature, topK, max tokens, and streaming settings
 *
 * @module PromptConfig
 */

import { useState, useMemo, memo } from 'react';
import { Settings, Thermometer, Hash, FileText, Info } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ViewCodeButton } from '@/components/shared/ViewCodeButton';
import { ValidationMessage } from '../../../shared/components/ValidationMessage';
import { useFieldValidation } from '../../../shared/hooks/useFieldValidation';
import { validationRules } from '../../../shared/utils/validationRules';
import { ParameterTooltip } from './ParameterTooltip';
import { ParameterPresets } from './ParameterPresets';
import type { PromptConfig as PromptConfigType } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface PromptConfigProps {
  /** Current configuration */
  config: PromptConfigType;

  /** Configuration change handler */
  onChange: (config: Partial<PromptConfigType>) => void;

  /** Initial collapsed state */
  defaultCollapsed?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** View code handler */
  onViewCode?: () => void;

  /** Disabled state */
  disabled?: boolean;

  /** Reset handler (called when Reset to Defaults is clicked) */
  onReset?: () => void;
}

// ============================================================================
// PromptConfig Component
// ============================================================================

/**
 * Configuration panel for Prompt API options
 *
 * @example
 * ```tsx
 * const [config, setConfig] = useState<PromptConfigType>({
 *   systemPrompt: 'You are a helpful AI assistant.',
 *   temperature: 0.8,
 *   topK: 8,
 *   maxTokens: 2048,
 *   enableStreaming: true,
 * });
 *
 * <PromptConfig config={config} onChange={setConfig} />
 * ```
 */
function PromptConfigComponent({
  config,
  onChange,
  defaultCollapsed = false,
  className,
  onViewCode,
  disabled = false,
  onReset,
}: PromptConfigProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  // Validation for temperature (memoized to prevent infinite loops)
  // The validation rules array must be stable to avoid re-triggering validation
  const temperatureRules = useMemo(
    () => validationRules.temperature(config.temperature || 0.8),
    [config.temperature],
  );

  const temperatureValidation = useFieldValidation(
    config.temperature || 0.8,
    temperatureRules,
    { debounceMs: 100, skipInitialValidation: true },
  );

  /**
   * Update configuration field
   */
  const updateConfig = <K extends keyof PromptConfigType>(
    key: K,
    value: PromptConfigType[K],
  ) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  return (
    <Card className={cn('border-slate-200 shadow-sm', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CollapsibleTrigger
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-all duration-200 group px-2 py-1 -ml-2 rounded flex-1"
              aria-label={
                isOpen
                  ? 'Hide configuration options'
                  : 'Show configuration options'
              }
            >
              <Settings className="w-4 h-4 text-slate-600 group-hover:text-slate-700 transition-colors" />
              <span className="text-sm font-medium text-slate-700">
                {isOpen ? 'Hide' : 'Show'} Configuration
              </span>
            </CollapsibleTrigger>

            {/* View Code Button */}
            {onViewCode && <ViewCodeButton onClick={onViewCode} />}
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-3">
            {/* Quick Presets */}
            <ParameterPresets
              currentConfig={config}
              onSelectPreset={(preset) => {
                onChange({
                  ...config,
                  ...preset.config,
                });
              }}
              mode="compact"
            />

            {/* System Prompt - Full Width */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="system-prompt"
                  className="text-sm font-semibold"
                >
                  System Prompt
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center"
                        aria-label="More information about system prompts"
                      >
                        <Info
                          className="w-4 h-4 text-slate-400 cursor-help"
                          aria-hidden="true"
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Define the AI&apos;s behavior and personality. This
                        context is applied to all conversations.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Textarea
                id="system-prompt"
                value={config.systemPrompt || ''}
                onChange={(e) => updateConfig('systemPrompt', e.target.value)}
                placeholder="You are a helpful AI assistant..."
                className="min-h-[80px] resize-none"
                disabled={disabled}
                aria-describedby="system-prompt-help"
                aria-label="System prompt text area"
              />

              <p id="system-prompt-help" className="text-xs text-slate-500">
                Sets the context and instructions for the AI model
              </p>
            </div>

            {/* 3-column grid for numeric settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Temperature */}
              <ParameterTooltip
                name="Temperature"
                value={config.temperature || 0.8}
                range={{
                  min: 0,
                  max: 1,
                  recommendedMin: 0.3,
                  recommendedMax: 0.9,
                }}
                description="Controls randomness in output generation"
                currentValueExplanation={
                  (config.temperature || 0.8) < 0.3
                    ? 'Deterministic - Same input always produces similar output. Great for factual tasks.'
                    : (config.temperature || 0.8) < 0.7
                      ? 'Balanced - Mix of consistency and variety. Good for most use cases.'
                      : 'Creative - More diverse and unpredictable outputs. Perfect for brainstorming and creative writing.'
                }
                example={{
                  input: 'The sky is',
                  lowOutput: 'blue',
                  highOutput: 'a canvas of endless azure possibilities',
                }}
                icon={<Thermometer className="w-4 h-4 text-orange-500" />}
              >
                <div
                  className="space-y-2"
                  role="group"
                  aria-labelledby="temperature-label"
                >
                  <div className="flex items-center gap-2">
                    <Thermometer
                      className="w-3 h-3 text-orange-500"
                      aria-hidden="true"
                    />
                    <Label
                      id="temperature-label"
                      htmlFor="temperature-slider"
                      className="text-xs font-medium text-slate-700"
                    >
                      Temperature
                    </Label>
                  </div>
                  <p
                    id="temperature-value"
                    className="text-[10px] text-slate-400"
                    aria-live="polite"
                  >
                    {config.temperature?.toFixed(2) || '0.80'}
                  </p>
                  <Slider
                    id="temperature-slider"
                    value={[config.temperature || 0.8]}
                    onValueChange={(value) =>
                      updateConfig('temperature', value[0])
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    disabled={disabled}
                    className="w-full"
                    aria-label="Temperature slider"
                    aria-valuemin={0}
                    aria-valuemax={1}
                    aria-valuenow={config.temperature || 0.8}
                    aria-valuetext={`Temperature: ${(config.temperature || 0.8).toFixed(2)}. Controls randomness: 0 is deterministic, 1 is creative`}
                    aria-describedby={
                      !temperatureValidation.isValid
                        ? 'temp-validation temperature-help'
                        : 'temperature-help'
                    }
                  />

                  {/* Real-time validation feedback */}
                  {!temperatureValidation.isValid &&
                    temperatureValidation.message && (
                      <ValidationMessage
                        id="temp-validation"
                        type={temperatureValidation.type || 'info'}
                        showIcon={false}
                        className="text-[10px] py-1 px-2"
                      >
                        {temperatureValidation.message}
                      </ValidationMessage>
                    )}

                  {temperatureValidation.isValid && (
                    <p
                      id="temperature-help"
                      className="text-[10px] text-slate-500"
                    >
                      Lower = focused, Higher = creative
                    </p>
                  )}
                </div>
              </ParameterTooltip>

              {/* Top K */}
              <ParameterTooltip
                name="Top K"
                value={config.topK || 8}
                range={{
                  min: 1,
                  max: 50,
                  recommendedMin: 5,
                  recommendedMax: 40,
                }}
                description="Limits the number of word choices the model considers"
                currentValueExplanation={
                  (config.topK || 8) <= 10
                    ? 'Conservative - Selects from top few words only. More focused and predictable.'
                    : (config.topK || 8) <= 30
                      ? 'Moderate - Balances vocabulary diversity. Good middle ground.'
                      : 'Diverse - Wider vocabulary selection. More varied word choices.'
                }
                example={{
                  input: 'She felt',
                  lowOutput: 'happy / sad',
                  highOutput: 'ecstatic / melancholy / anxious / excited',
                }}
                icon={<Hash className="w-4 h-4 text-blue-500" />}
              >
                <div
                  className="space-y-2"
                  role="group"
                  aria-labelledby="topk-label"
                >
                  <div className="flex items-center gap-2">
                    <Hash
                      className="w-3 h-3 text-blue-500"
                      aria-hidden="true"
                    />
                    <Label
                      id="topk-label"
                      htmlFor="topk-slider"
                      className="text-xs font-medium text-slate-700"
                    >
                      Top K
                    </Label>
                  </div>
                  <p
                    className="text-[10px] text-slate-400"
                    aria-live="polite"
                    id="topk-value"
                  >
                    {config.topK || 8}
                  </p>
                  <Slider
                    id="topk-slider"
                    value={[config.topK || 8]}
                    onValueChange={(value) => updateConfig('topK', value[0])}
                    min={1}
                    max={50}
                    step={1}
                    disabled={disabled}
                    className="w-full"
                    aria-label="Top K slider"
                    aria-valuemin={1}
                    aria-valuemax={50}
                    aria-valuenow={config.topK || 8}
                    aria-valuetext={`Top K: ${config.topK || 8}. Limits vocabulary choices`}
                    aria-describedby="topk-help"
                  />
                  <p id="topk-help" className="text-[10px] text-slate-500">
                    Limits vocabulary choices
                  </p>
                </div>
              </ParameterTooltip>

              {/* Max Tokens */}
              <div
                className="space-y-2"
                role="group"
                aria-labelledby="maxtokens-label"
              >
                <div className="flex items-center gap-2">
                  <FileText
                    className="w-3 h-3 text-green-500"
                    aria-hidden="true"
                  />
                  <Label
                    id="maxtokens-label"
                    htmlFor="maxtokens-slider"
                    className="text-xs font-medium text-slate-700"
                  >
                    Max Tokens
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center"
                          aria-label="More information about max tokens"
                        >
                          <Info
                            className="w-3 h-3 text-slate-400 cursor-help"
                            aria-hidden="true"
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Gemini Nano typically supports up to 1024 tokens for
                          responses. Higher values may fail or be truncated.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p
                  className="text-[10px] text-slate-400"
                  aria-live="polite"
                  id="maxtokens-value"
                >
                  {config.maxTokens || 512}
                </p>
                <Slider
                  id="maxtokens-slider"
                  value={[config.maxTokens || 512]}
                  onValueChange={(value) => updateConfig('maxTokens', value[0])}
                  min={256}
                  max={1024}
                  step={128}
                  disabled={disabled}
                  className="w-full"
                  aria-label="Max tokens slider"
                  aria-valuemin={256}
                  aria-valuemax={1024}
                  aria-valuenow={config.maxTokens || 512}
                  aria-valuetext={`Max tokens: ${config.maxTokens || 512}. Maximum response length`}
                  aria-describedby="maxtokens-help"
                />
                <p id="maxtokens-help" className="text-[10px] text-slate-500">
                  Maximum response length (default: 512, max: 1024)
                </p>
              </div>
            </div>

            {/* Quick Reset */}
            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange({
                    systemPrompt: 'You are a helpful AI assistant.',
                    temperature: 0.8,
                    topK: 8,
                    maxTokens: 512, // Default max tokens (max allowed: 1024)
                    enableStreaming: true,
                  });
                  onReset?.(); // Call reset handler if provided
                }}
                disabled={disabled}
                className="text-xs"
              >
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

// Memoize component - only re-render if config or onChange changes
// Most config changes will be driven by user interaction anyway
export const PromptConfig = memo(PromptConfigComponent);
PromptConfig.displayName = 'PromptConfig';

export default PromptConfig;
