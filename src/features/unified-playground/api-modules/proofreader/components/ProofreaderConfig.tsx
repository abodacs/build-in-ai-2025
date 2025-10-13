/**
 * ProofreaderConfig Component
 *
 * Configuration panel for Proofreader API settings.
 *
 * @module proofreader/components/ProofreaderConfig
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PROOFREADER_LANGUAGE_OPTIONS,
  CORRECTION_TYPE_OPTIONS,
  CORRECTION_MODE_OPTIONS,
  type ProofreaderConfig as ProofreaderConfigType,
  type ProofreaderLanguage,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface ProofreaderConfigProps {
  /** Current configuration */
  config: ProofreaderConfigType;

  /** Configuration change handler */
  onChange: (config: Partial<ProofreaderConfigType>) => void;

  /** Is disabled */
  disabled?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProofreaderConfig component
 *
 * @example
 * ```tsx
 * <ProofreaderConfig
 *   config={config}
 *   onChange={(updates) => setConfig({...config, ...updates})}
 * />
 * ```
 */
export function ProofreaderConfig({
  config,
  onChange,
  disabled = false,
  className = '',
}: ProofreaderConfigProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Expected Language */}
        <div className="space-y-2">
          <Label htmlFor="expected-language">Expected Language</Label>
          <Select
            disabled={disabled}
            value={config.expectedInputLanguages[0] || 'en'}
            onValueChange={(value) =>
              onChange({
                expectedInputLanguages: [value as ProofreaderLanguage],
              })
            }
          >
            <SelectTrigger id="expected-language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {PROOFREADER_LANGUAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Language of the text to proofread
          </p>
        </div>

        {/* Correction Mode */}
        <div className="space-y-2">
          <Label htmlFor="correction-mode">Correction Mode</Label>
          <Select
            disabled={disabled}
            value={config.correctionMode}
            onValueChange={(value) =>
              onChange({
                correctionMode: value as 'light' | 'standard' | 'thorough',
              })
            }
          >
            <SelectTrigger id="correction-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CORRECTION_MODE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Correction Type Filter */}
        <div className="space-y-2">
          <Label>Correction Types</Label>
          <div className="flex flex-wrap gap-2">
            {CORRECTION_TYPE_OPTIONS.map((option) => {
              const isSelected = config.correctionTypeFilter.includes(
                option.value,
              );
              const isEmpty = config.correctionTypeFilter.length === 0;

              return (
                <Badge
                  key={option.value}
                  variant={isSelected || isEmpty ? 'default' : 'outline'}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => {
                    if (disabled) return;

                    const newTypes = isSelected
                      ? config.correctionTypeFilter.filter(
                          (t) => t !== option.value,
                        )
                      : [...config.correctionTypeFilter, option.value];

                    onChange({ correctionTypeFilter: newTypes });
                  }}
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                </Badge>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {config.correctionTypeFilter.length === 0
              ? 'All types enabled'
              : `${config.correctionTypeFilter.length} type(s) selected`}
          </p>
        </div>

        {/* Auto-apply */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-apply">Auto-apply Corrections</Label>
            <p className="text-xs text-muted-foreground">
              Automatically apply all corrections
            </p>
          </div>
          <Switch
            id="auto-apply"
            checked={config.autoApply}
            onCheckedChange={(checked) => onChange({ autoApply: checked })}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ProofreaderConfig;
