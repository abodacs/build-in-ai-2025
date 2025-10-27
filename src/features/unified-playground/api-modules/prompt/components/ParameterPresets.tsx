/**
 * ParameterPresets Component
 * Quick preset buttons for optimal parameter configurations
 *
 * @module ParameterPresets
 */

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PromptConfig } from '../types';
import { PARAMETER_PRESETS } from '../constants/parameterPresets';

// ============================================================================
// Types
// ============================================================================

export interface Preset {
  /** Preset identifier */
  id: string;

  /** Preset name */
  name: string;

  /** Preset description */
  description: string;

  /** Icon/emoji */
  icon: string;

  /** Use case examples */
  useCases: string[];

  /** Parameter configuration */
  config: Partial<PromptConfig>;

  /** Badge color */
  badgeColor?: string;
}

export interface ParameterPresetsProps {
  /** Current configuration */
  currentConfig: Partial<PromptConfig>;

  /** Preset selection callback */
  onSelectPreset: (preset: Preset) => void;

  /** Additional CSS classes */
  className?: string;

  /** Display mode */
  mode?: 'compact' | 'expanded';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if current config matches a preset
 */
function isPresetActive(
  preset: Preset,
  currentConfig: Partial<PromptConfig>,
): boolean {
  const tempMatch =
    preset.config.temperature === undefined ||
    Math.abs(
      (preset.config.temperature || 0) - (currentConfig.temperature || 0),
    ) < 0.05;

  const topKMatch =
    preset.config.topK === undefined ||
    preset.config.topK === currentConfig.topK;

  return tempMatch && topKMatch;
}

// ============================================================================
// PresetCard Component
// ============================================================================

interface PresetCardProps {
  preset: Preset;
  isActive: boolean;
  onSelect: () => void;
  mode: 'compact' | 'expanded';
}

function PresetCard({ preset, isActive, onSelect, mode }: PresetCardProps) {
  if (mode === 'compact') {
    return (
      <Button
        variant={isActive ? 'default' : 'outline'}
        size="sm"
        onClick={onSelect}
        className={cn(
          'h-auto flex-col items-start gap-1 p-3 text-left transition-all',
          isActive && 'ring-2 ring-offset-2',
        )}
      >
        <div className="flex items-center gap-2 w-full">
          <span className="text-lg" aria-hidden="true">
            {preset.icon}
          </span>
          <span className="font-semibold text-sm">{preset.name}</span>
          {isActive && <Check className="w-4 h-4 ml-auto" />}
        </div>
        <span className="text-xs text-muted-foreground">
          {preset.description}
        </span>
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all hover:shadow-md',
        isActive && 'ring-2 ring-primary ring-offset-2',
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={isActive}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              {preset.icon}
            </span>
            <div>
              <h3 className="font-semibold text-sm">{preset.name}</h3>
              <p className="text-xs text-muted-foreground">
                {preset.description}
              </p>
            </div>
          </div>
          {isActive && (
            <Badge className={cn('text-xs', preset.badgeColor, 'text-white')}>
              Active
            </Badge>
          )}
        </div>

        {/* Parameters */}
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Temp:</span>
            <code className="font-mono font-semibold">
              {preset.config.temperature?.toFixed(1)}
            </code>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Top K:</span>
            <code className="font-mono font-semibold">
              {preset.config.topK}
            </code>
          </div>
        </div>

        {/* Use Cases */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Best for:</p>
          <div className="flex flex-wrap gap-1">
            {preset.useCases.map((useCase) => (
              <Badge
                key={useCase}
                variant="secondary"
                className="text-[10px] font-normal"
              >
                {useCase}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// ParameterPresets Component
// ============================================================================

/**
 * Quick preset selector for parameter configurations
 *
 * @example
 * ```tsx
 * <ParameterPresets
 *   currentConfig={{ temperature: 0.7, topK: 20 }}
 *   onSelectPreset={(preset) => {
 *     setConfig(preset.config);
 *   }}
 *   mode="expanded"
 * />
 * ```
 */
export function ParameterPresets({
  currentConfig,
  onSelectPreset,
  className,
  mode = 'compact',
}: ParameterPresetsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Quick Presets</h3>
          <p className="text-xs text-muted-foreground">
            Optimal settings for common use cases
          </p>
        </div>
      </div>

      {/* Preset Grid */}
      <div
        className={cn(
          'grid gap-3',
          mode === 'compact'
            ? 'grid-cols-2 md:grid-cols-4'
            : 'grid-cols-1 md:grid-cols-2',
        )}
      >
        {PARAMETER_PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isActive={isPresetActive(preset, currentConfig)}
            onSelect={() => onSelectPreset(preset)}
            mode={mode}
          />
        ))}
      </div>

      {/* Help Text */}
      {mode === 'expanded' && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          💡 Tip: Hover over Temperature and Top K sliders for detailed
          explanations
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ParameterPresets;
