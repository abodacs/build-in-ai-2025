/**
 * TranslatorConfig Component
 * Language pair selection and configuration for translation
 */

import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
} from 'lucide-react';
import { ViewCodeButton } from '@/components/shared/ViewCodeButton';
import {
  type TranslatorConfigProps,
  type LanguageCode,
  type LanguageInfo,
  type StreamingMode,
  type TranslationQuality,
  type ConcurrencyLevel,
  SUPPORTED_LANGUAGES,
} from '../types';

/**
 * TranslatorConfig Component
 *
 * Provides UI for configuring translation settings:
 * - Source language selection
 * - Target language selection
 * - Language swap functionality
 * - Optional context input
 * - Availability status display
 */
export function TranslatorConfig({
  sourceLanguage,
  targetLanguage,
  context = '',
  onSourceLanguageChange,
  onTargetLanguageChange,
  onContextChange,
  onSwapLanguages,
  availability,
  isCheckingAvailability = false,
  advancedSettings,
  onAdvancedSettingsChange,
  disabled = false,
  onViewCode,
  onRecheckAvailability,
  downloadProgress,
}: TranslatorConfigProps) {
  const [isOpen, setIsOpen] = useState(false); // Collapsed by default

  // Get language info
  const sourceInfo = SUPPORTED_LANGUAGES[sourceLanguage];
  const targetInfo = SUPPORTED_LANGUAGES[targetLanguage];

  // Get available target languages (exclude source language)
  const availableTargetLanguages = Object.values(SUPPORTED_LANGUAGES).filter(
    (lang) => lang.code !== sourceLanguage,
  );

  // Get available source languages (exclude target language)
  const availableSourceLanguages = Object.values(SUPPORTED_LANGUAGES).filter(
    (lang) => lang.code !== targetLanguage,
  );

  /**
   * Get tooltip text explaining the availability status
   */
  const getAvailabilityTooltip = (status: string) => {
    if (isCheckingAvailability) {
      return 'Checking if translation is available for this language pair...';
    }

    switch (status) {
      case 'readily':
        return 'Translation API is ready. You can translate immediately.';
      case 'after-download':
        return 'Translation model needs to be downloaded first. This will happen automatically on first use.';
      case 'no':
        return 'Translation is not available for this language pair in your browser.';
      default:
        return 'Unknown availability status. Try refreshing.';
    }
  };

  /**
   * Get availability badge variant and text
   */
  const getAvailabilityDisplay = () => {
    // Show download progress if available
    if (
      downloadProgress !== undefined &&
      downloadProgress !== null &&
      downloadProgress >= 0
    ) {
      return {
        variant: 'secondary' as const,
        text: `Downloading ${downloadProgress}%`,
        icon: '⬇️',
      };
    }

    if (isCheckingAvailability) {
      return {
        variant: 'secondary' as const,
        text: 'Checking...',
        icon: '⏳',
      };
    }

    switch (availability) {
      case 'readily':
        return {
          variant: 'default' as const,
          text: 'Ready to translate',
          icon: '✅',
        };
      case 'after-download':
        return {
          variant: 'secondary' as const,
          text: 'Download required',
          icon: '📥',
        };
      case 'no':
        return {
          variant: 'destructive' as const,
          text: 'Not available',
          icon: '❌',
        };
      default:
        return {
          variant: 'outline' as const,
          text: 'Unknown',
          icon: '❓',
        };
    }
  };

  const availabilityDisplay = getAvailabilityDisplay();

  /**
   * Format language display with flag and name
   */
  const formatLanguageDisplay = (lang: LanguageInfo) => {
    return `${lang.flag} ${lang.nativeName} (${lang.name})`;
  };

  /**
   * Handle context input with character limit
   */
  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Limit to 1000 characters
    if (value.length <= 1000) {
      onContextChange(value);
    }
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex flex-1 items-center justify-between p-2 hover:bg-accent"
          >
            <div className="flex items-center gap-2">
              <span className="text-fluid-lg font-semibold">
                ⚙️ Translation Settings
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant={availabilityDisplay.variant}
                      className="cursor-help"
                    >
                      {availabilityDisplay.icon} {availabilityDisplay.text}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      {getAvailabilityTooltip(availability)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        {/* Refresh button moved outside CollapsibleTrigger to avoid nested button violation */}
        {(availability === 'no' || availability === 'after-download') &&
          onRecheckAvailability && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRecheckAvailability}
                    disabled={isCheckingAvailability}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${isCheckingAvailability ? 'animate-spin' : ''}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Recheck availability</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

        {onViewCode && <ViewCodeButton onClick={onViewCode} />}
      </div>

      <CollapsibleContent className="mt-4 space-y-4">
        {/* Language Pair Selection */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Source Language */}
          <div className="space-y-2">
            <Label htmlFor="source-language" className="text-sm font-medium">
              Source Language
            </Label>
            <Select
              value={sourceLanguage}
              onValueChange={(value) =>
                onSourceLanguageChange(value as LanguageCode)
              }
            >
              <SelectTrigger
                id="source-language"
                className="w-full"
                data-testid="source-language-select"
              >
                <SelectValue>
                  {sourceInfo && formatLanguageDisplay(sourceInfo)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableSourceLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {formatLanguageDisplay(lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Language */}
          <div className="space-y-2">
            <Label htmlFor="target-language" className="text-sm font-medium">
              Target Language
            </Label>
            <Select
              value={targetLanguage}
              onValueChange={(value) =>
                onTargetLanguageChange(value as LanguageCode)
              }
            >
              <SelectTrigger
                id="target-language"
                className="w-full"
                data-testid="target-language-select"
              >
                <SelectValue>
                  {targetInfo && formatLanguageDisplay(targetInfo)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableTargetLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {formatLanguageDisplay(lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Languages Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onSwapLanguages}
            className="h-10 lg:h-8 gap-2 tap-fast transition-transform hover:scale-105"
            data-testid="swap-languages-btn"
            title="Swap source and target languages (Alt+S)"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Swap Languages
          </Button>
        </div>

        {/* Context Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="context" className="text-sm font-medium">
              Context (optional)
            </Label>
            <span className="text-xs text-muted-foreground">
              {context.length}/1000
            </span>
          </div>
          <Textarea
            id="context"
            placeholder="Add context to improve translation accuracy (e.g., 'financial institution' for 'bank')"
            value={context}
            onChange={handleContextChange}
            className="min-h-[80px] resize-none"
            data-testid="context-input"
            maxLength={1000}
            aria-label="Translation context"
            aria-describedby="context-description"
          />
          <p id="context-description" className="text-xs text-muted-foreground">
            Context helps disambiguate terms with multiple meanings
          </p>
        </div>

        {/* Language Pair Info */}
        <div className="rounded-md bg-muted/50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">Selected Pair:</span>
            <span>
              {sourceInfo?.flag} {sourceInfo?.code.toUpperCase()} →{' '}
              {targetInfo?.flag} {targetInfo?.code.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Advanced Options
            </span>
          </div>
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
                {advancedSettings.streamingThreshold} words
                <br />
                <strong>Always:</strong> Stream all translations
                <br />
                <strong>Never:</strong> Wait for complete translation
              </div>
            </div>
          </div>
          <Select
            value={advancedSettings.streamingMode}
            onValueChange={(value) =>
              onAdvancedSettingsChange({
                ...advancedSettings,
                streamingMode: value as StreamingMode,
              })
            }
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
            {advancedSettings.streamingMode === 'auto' &&
              `Automatically streams texts longer than ${advancedSettings.streamingThreshold} words`}
            {advancedSettings.streamingMode === 'always' &&
              'Shows translation in real-time as it generates'}
            {advancedSettings.streamingMode === 'never' &&
              'Waits for complete translation before displaying'}
          </p>
        </div>

        {/* Streaming Threshold (only show if mode is auto) */}
        {advancedSettings.streamingMode === 'auto' && (
          <div className="space-y-2">
            <Label htmlFor="threshold" className="text-sm font-medium">
              Streaming Threshold: {advancedSettings.streamingThreshold} words
            </Label>
            <Slider
              id="threshold"
              min={50}
              max={300}
              step={50}
              value={[advancedSettings.streamingThreshold]}
              onValueChange={(value) =>
                onAdvancedSettingsChange({
                  ...advancedSettings,
                  streamingThreshold: value[0] ?? 100,
                })
              }
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
            value={advancedSettings.quality}
            onValueChange={(value) =>
              onAdvancedSettingsChange({
                ...advancedSettings,
                quality: value as TranslationQuality,
              })
            }
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
            {advancedSettings.quality === 'standard' &&
              'Balanced translation for general use'}
            {advancedSettings.quality === 'formal' &&
              'Professional tone for business contexts'}
            {advancedSettings.quality === 'casual' &&
              'Conversational tone for friendly communication'}
            {advancedSettings.quality === 'technical' &&
              'Optimized for technical and scientific content'}
          </p>
        </div>

        {/* Batch Concurrency */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="concurrency" className="text-sm font-medium">
              Batch Concurrency: {advancedSettings.concurrency} parallel
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
            value={[advancedSettings.concurrency]}
            onValueChange={(value) =>
              onAdvancedSettingsChange({
                ...advancedSettings,
                concurrency: value[0] as ConcurrencyLevel,
              })
            }
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 (Slower, less resources)</span>
            <span>5 (Faster, more resources)</span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
