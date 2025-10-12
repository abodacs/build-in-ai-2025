/**
 * SummarizerConfig Component
 *
 * Configuration panel for Chrome AI Summarizer options
 * Supports type, format, length, and shared context
 *
 * @module SummarizerConfig
 */

import { useState } from 'react';
import {
  Settings,
  List,
  FileText,
  Eye,
  Newspaper,
  FileCode,
  AlignLeft,
  Zap,
  Scale,
  BookOpen,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ViewCodeButton } from '@/components/shared/ViewCodeButton';
import type { SummarizerCreateOptions } from '../types/summarizer.types';

// ============================================================================
// Types
// ============================================================================

export interface SummarizerConfigProps {
  /** Current configuration */
  config: SummarizerCreateOptions;

  /** Configuration change handler */
  onChange: (config: SummarizerCreateOptions) => void;

  /** Initial collapsed state */
  defaultCollapsed?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Show advanced options */
  showAdvanced?: boolean;

  /** View code handler */
  onViewCode?: () => void;
}

// ============================================================================
// SummarizerConfig Component
// ============================================================================

/**
 * Configuration panel for summarizer options
 *
 * @example
 * ```tsx
 * const [config, setConfig] = useState<SummarizerCreateOptions>({
 *   type: 'tldr',
 *   format: 'plain-text',
 *   length: 'medium',
 * });
 *
 * <SummarizerConfig config={config} onChange={setConfig} />
 * ```
 */
export function SummarizerConfig({
  config,
  onChange,
  defaultCollapsed = false,
  className,
  showAdvanced = true,
  onViewCode,
}: SummarizerConfigProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  /**
   * Update configuration field
   */
  const updateConfig = <K extends keyof SummarizerCreateOptions>(
    key: K,
    value: SummarizerCreateOptions[K],
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
            {/* Standard 3-column grid layout for config options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Summary Type */}
              <div
                className="space-y-2"
                aria-label="Choose summary type: key points, TLDR, teaser, or headline"
              >
                <Label
                  className="text-xs font-medium text-slate-700"
                  title="Select the style of summary you want to generate"
                >
                  Summary Type
                </Label>
                <p className="text-[10px] text-slate-400">Choose style</p>
                <ToggleGroup
                  type="single"
                  value={config.type || 'tldr'}
                  onValueChange={(value) => {
                    if (value)
                      updateConfig(
                        'type',
                        value as SummarizerCreateOptions['type'],
                      );
                  }}
                  className="grid grid-cols-2 gap-1"
                >
                  <ToggleGroupItem
                    value="key-points"
                    className="h-auto py-2 px-2 text-xs data-[state=on]:bg-purple-100 data-[state=on]:text-purple-900"
                  >
                    <List className="w-3 h-3 mr-1" />
                    Key Points
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="tldr"
                    className="h-auto py-2 px-2 text-xs data-[state=on]:bg-purple-100 data-[state=on]:text-purple-900"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    TL;DR
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="teaser"
                    className="h-auto py-2 px-2 text-xs data-[state=on]:bg-purple-100 data-[state=on]:text-purple-900"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Teaser
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="headline"
                    className="h-auto py-2 px-2 text-xs data-[state=on]:bg-purple-100 data-[state=on]:text-purple-900"
                  >
                    <Newspaper className="w-3 h-3 mr-1" />
                    Headline
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Output Format */}
              <div
                className="space-y-2"
                aria-label="Choose output format: markdown or plain text"
              >
                <Label
                  className="text-xs font-medium text-slate-700"
                  title="Select how the summary should be formatted"
                >
                  Output Format
                </Label>
                <p className="text-[10px] text-slate-400">Choose formatting</p>
                <ToggleGroup
                  type="single"
                  value={config.format || 'plain-text'}
                  onValueChange={(value) => {
                    if (value)
                      updateConfig(
                        'format',
                        value as SummarizerCreateOptions['format'],
                      );
                  }}
                  className="grid grid-cols-1 gap-1"
                >
                  <ToggleGroupItem
                    value="markdown"
                    className="h-auto py-2 px-2 text-xs data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900"
                  >
                    <FileCode className="w-3 h-3 mr-1" />
                    Markdown
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="plain-text"
                    className="h-auto py-2 px-2 text-xs data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900"
                  >
                    <AlignLeft className="w-3 h-3 mr-1" />
                    Plain Text
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Summary Length */}
              <div
                className="space-y-2"
                aria-label="Choose summary length: short, medium, or long"
              >
                <Label
                  className="text-xs font-medium text-slate-700"
                  title="Select the desired length of the summary"
                >
                  Summary Length
                </Label>
                <p className="text-[10px] text-slate-400">
                  Choose detail level
                </p>
                <ToggleGroup
                  type="single"
                  value={config.length || 'medium'}
                  onValueChange={(value) => {
                    if (value)
                      updateConfig(
                        'length',
                        value as SummarizerCreateOptions['length'],
                      );
                  }}
                  className="grid grid-cols-1 gap-1"
                >
                  <ToggleGroupItem
                    value="short"
                    className="h-auto py-2 px-2 text-xs data-[state=on]:bg-green-100 data-[state=on]:text-green-900"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Short
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="medium"
                    className="h-auto py-2 px-2 text-xs data-[state=on]:bg-green-100 data-[state=on]:text-green-900"
                  >
                    <Scale className="w-3 h-3 mr-1" />
                    Medium
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="long"
                    className="h-auto py-2 px-2 text-xs data-[state=on]:bg-green-100 data-[state=on]:text-green-900"
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    Long
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Shared Context (Advanced) */}
            {showAdvanced && (
              <div className="space-y-2.5 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="shared-context"
                    className="text-sm font-semibold"
                  >
                    Shared Context (Optional)
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-slate-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          Provide additional context to guide the AI. For
                          example: &ldquo;Summarize for a technical
                          audience&rdquo; or &ldquo;Focus on business
                          implications&rdquo;.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <Textarea
                  id="shared-context"
                  value={config.sharedContext || ''}
                  onChange={(e) =>
                    updateConfig('sharedContext', e.target.value)
                  }
                  placeholder="e.g., 'Summarize for a technical audience' or 'Focus on key statistics'"
                  className="min-h-[80px] resize-none"
                />

                <p className="text-xs text-slate-500">
                  This context is shared across all summarizations with this
                  configuration.
                </p>
              </div>
            )}

            {/* Quick Reset */}
            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onChange({
                    type: 'tldr',
                    format: 'plain-text',
                    length: 'medium',
                    sharedContext: '',
                  })
                }
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

export default SummarizerConfig;
