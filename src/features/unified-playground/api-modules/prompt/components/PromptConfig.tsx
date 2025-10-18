/**
 * PromptConfig Component
 *
 * Configuration panel for Chrome AI Prompt API options
 * Supports system prompt, temperature, topK, max tokens, and streaming settings
 *
 * @module PromptConfig
 */

import { useState } from 'react';
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
export function PromptConfig({
  config,
  onChange,
  defaultCollapsed = false,
  className,
  onViewCode,
  disabled = false,
  onReset,
}: PromptConfigProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  // Validation for temperature
  const temperatureValidation = useFieldValidation(
    config.temperature || 0.8,
    validationRules.temperature(config.temperature || 0.8),
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
                      <Info className="w-4 h-4 text-slate-400 cursor-help" />
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
              />

              <p className="text-xs text-slate-500">
                Sets the context and instructions for the AI model
              </p>
            </div>

            {/* 3-column grid for numeric settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Temperature */}
              <div
                className="space-y-2"
                aria-label="Temperature controls randomness and creativity"
              >
                <div className="flex items-center gap-2">
                  <Thermometer className="w-3 h-3 text-orange-500" />
                  <Label
                    className="text-xs font-medium text-slate-700"
                    title="Controls randomness: 0 = deterministic, 1 = creative"
                  >
                    Temperature
                  </Label>
                </div>
                <p className="text-[10px] text-slate-400">
                  {config.temperature?.toFixed(2) || '0.80'}
                </p>
                <Slider
                  value={[config.temperature || 0.8]}
                  onValueChange={(value) =>
                    updateConfig('temperature', value[0])
                  }
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={disabled}
                  className="w-full"
                  aria-describedby={
                    !temperatureValidation.isValid
                      ? 'temp-validation'
                      : undefined
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
                  <p className="text-[10px] text-slate-500">
                    Lower = focused, Higher = creative
                  </p>
                )}
              </div>

              {/* Top K */}
              <div
                className="space-y-2"
                aria-label="Top K limits vocabulary selection"
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-3 h-3 text-blue-500" />
                  <Label
                    className="text-xs font-medium text-slate-700"
                    title="Number of top tokens to consider"
                  >
                    Top K
                  </Label>
                </div>
                <p className="text-[10px] text-slate-400">{config.topK || 8}</p>
                <Slider
                  value={[config.topK || 8]}
                  onValueChange={(value) => updateConfig('topK', value[0])}
                  min={1}
                  max={50}
                  step={1}
                  disabled={disabled}
                  className="w-full"
                />
                <p className="text-[10px] text-slate-500">
                  Limits vocabulary choices
                </p>
              </div>

              {/* Max Tokens */}
              <div
                className="space-y-2"
                aria-label="Max tokens controls response length"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-green-500" />
                  <Label
                    className="text-xs font-medium text-slate-700"
                    title="Maximum response length in tokens"
                  >
                    Max Tokens
                  </Label>
                </div>
                <p className="text-[10px] text-slate-400">
                  {config.maxTokens || 2048}
                </p>
                <Slider
                  value={[config.maxTokens || 2048]}
                  onValueChange={(value) => updateConfig('maxTokens', value[0])}
                  min={256}
                  max={4096}
                  step={256}
                  disabled={disabled}
                  className="w-full"
                />
                <p className="text-[10px] text-slate-500">
                  Maximum response length
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
                    maxTokens: 2048,
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

export default PromptConfig;
