/**
 * AdvancedSettings Component
 *
 * Advanced translation settings panel
 * - Streaming mode control
 * - Translation quality/tone selector
 * - Batch concurrency control
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import {
  type StreamingMode,
  type TranslationQuality,
  type ConcurrencyLevel,
  type AdvancedSettings as AdvancedSettingsType,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface AdvancedSettingsProps {
  /** Current settings */
  settings: AdvancedSettingsType;

  /** Called when settings change */
  onSettingsChange: (settings: AdvancedSettingsType) => void;

  /** Whether settings are disabled */
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * AdvancedSettings Component
 *
 * @example
 * ```tsx
 * <AdvancedSettings
 *   settings={advancedSettings}
 *   onSettingsChange={setAdvancedSettings}
 * />
 * ```
 */
export function AdvancedSettings({
  settings,
  onSettingsChange,
  disabled = false,
}: AdvancedSettingsProps) {
  /**
   * Handle streaming mode change
   */
  const handleStreamingModeChange = (mode: StreamingMode) => {
    onSettingsChange({ ...settings, streamingMode: mode });
  };

  /**
   * Handle quality change
   */
  const handleQualityChange = (quality: TranslationQuality) => {
    onSettingsChange({ ...settings, quality });
  };

  /**
   * Handle concurrency change
   */
  const handleConcurrencyChange = (value: number[]) => {
    onSettingsChange({
      ...settings,
      concurrency: value[0] as ConcurrencyLevel,
    });
  };

  /**
   * Handle threshold change
   */
  const handleThresholdChange = (value: number[]) => {
    onSettingsChange({
      ...settings,
      streamingThreshold: value[0] ?? 100,
    });
  };

  return (
    <div className="space-y-6 rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Advanced Settings</h3>
        <Badge variant="secondary" className="text-xs">
          Optional
        </Badge>
      </div>

      {/* Streaming Mode */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="streaming-mode" className="text-sm font-medium">
            Streaming Mode
          </Label>
          <div className="group relative">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="invisible absolute left-0 top-6 z-10 w-64 rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md group-hover:visible">
              <strong>Auto:</strong> Stream for texts &gt;
              {settings.streamingThreshold} words
              <br />
              <strong>Always:</strong> Stream all translations
              <br />
              <strong>Never:</strong> Wait for complete translation
            </div>
          </div>
        </div>
        <Select
          value={settings.streamingMode}
          onValueChange={handleStreamingModeChange}
          disabled={disabled}
        >
          <SelectTrigger id="streaming-mode" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto (Smart)</SelectItem>
            <SelectItem value="always">Always Stream</SelectItem>
            <SelectItem value="never">Never Stream</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {settings.streamingMode === 'auto' &&
            `Automatically streams texts longer than ${settings.streamingThreshold} words`}
          {settings.streamingMode === 'always' &&
            'Shows translation in real-time as it generates'}
          {settings.streamingMode === 'never' &&
            'Waits for complete translation before displaying'}
        </p>
      </div>

      {/* Streaming Threshold (only show if mode is auto) */}
      {settings.streamingMode === 'auto' && (
        <div className="space-y-2">
          <Label htmlFor="threshold" className="text-sm font-medium">
            Streaming Threshold: {settings.streamingThreshold} words
          </Label>
          <Slider
            id="threshold"
            min={50}
            max={300}
            step={50}
            value={[settings.streamingThreshold]}
            onValueChange={handleThresholdChange}
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Texts longer than this will use streaming mode
          </p>
        </div>
      )}

      {/* Translation Quality/Tone */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="quality" className="text-sm font-medium">
            Translation Quality/Tone
          </Label>
          <div className="group relative">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="invisible absolute left-0 top-6 z-10 w-64 rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md group-hover:visible">
              <strong>Standard:</strong> Balanced, general-purpose
              <br />
              <strong>Formal:</strong> Professional, business-appropriate
              <br />
              <strong>Casual:</strong> Conversational, friendly
              <br />
              <strong>Technical:</strong> Precise, scientific/technical terms
            </div>
          </div>
        </div>
        <Select
          value={settings.quality}
          onValueChange={handleQualityChange}
          disabled={disabled}
        >
          <SelectTrigger id="quality" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="formal">Formal</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {settings.quality === 'standard' &&
            'Balanced translation for general use'}
          {settings.quality === 'formal' &&
            'Professional tone for business contexts'}
          {settings.quality === 'casual' &&
            'Conversational tone for friendly communication'}
          {settings.quality === 'technical' &&
            'Optimized for technical and scientific content'}
        </p>
      </div>

      {/* Batch Concurrency */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="concurrency" className="text-sm font-medium">
            Batch Concurrency: {settings.concurrency} parallel
          </Label>
          <div className="group relative">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="invisible absolute left-0 top-6 z-10 w-64 rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md group-hover:visible">
              Number of translations to process simultaneously in batch mode.
              Higher = faster but more resource-intensive.
            </div>
          </div>
        </div>
        <Slider
          id="concurrency"
          min={1}
          max={5}
          step={1}
          value={[settings.concurrency]}
          onValueChange={handleConcurrencyChange}
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 (Slower, less resources)</span>
          <span>5 (Faster, more resources)</span>
        </div>
      </div>

      {/* Settings Summary */}
      <div className="rounded-md bg-muted/50 p-3 text-xs">
        <div className="font-medium text-foreground mb-1">
          Current Settings:
        </div>
        <div className="space-y-0.5 text-muted-foreground">
          <div>• Streaming: {settings.streamingMode}</div>
          <div>• Quality: {settings.quality}</div>
          <div>• Batch concurrency: {settings.concurrency}</div>
        </div>
      </div>
    </div>
  );
}
