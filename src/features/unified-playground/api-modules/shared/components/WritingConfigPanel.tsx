/**
 * WritingConfigPanel Component
 *
 * Reusable configuration panel for Writer and Rewriter APIs.
 * Provides UI for tone, format, length, and shared context settings.
 *
 * Features:
 * - Responsive grid layout
 * - Collapsible design
 * - Tooltips for guidance
 * - Accessible form controls
 * - Type-safe configuration
 *
 * @module WritingConfigPanel
 */

import { useState } from 'react';
import { Settings, ChevronDown, Info, Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ViewCodeButton } from '@/components/shared/ViewCodeButton';
import { cn } from '@/lib/utils';
import type { ConfigOption } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Base config type for writing configuration
 */
export interface BaseWritingConfig {
  tone: string;
  format: string;
  length: string;
  outputLanguage?: string;
  sharedContext?: string;
}

/**
 * WritingConfigPanel component props
 */
export interface WritingConfigPanelProps<
  T extends BaseWritingConfig = BaseWritingConfig,
> {
  /** Current configuration */
  config: T;

  /** Configuration change handler */
  onChange: (config: T) => void;

  /** Available tone options */
  toneOptions: readonly ConfigOption[];

  /** Available format options */
  formatOptions: readonly ConfigOption[];

  /** Available length options */
  lengthOptions: readonly ConfigOption[];

  /** Available output language options (optional, for Rewriter) */
  languageOptions?: readonly ConfigOption[];

  /** Panel title */
  title?: string;

  /** Panel description */
  description?: string;

  /** Show advanced settings (shared context) */
  showAdvanced?: boolean;

  /** Initial collapsed state */
  defaultCollapsed?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Disable all inputs */
  disabled?: boolean;

  /** View code handler */
  onViewCode?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Reusable configuration panel for writing APIs
 *
 * Provides a consistent UI for configuring Writer and Rewriter APIs.
 *
 * @example
 * ```tsx
 * <WritingConfigPanel
 *   config={config}
 *   onChange={setConfig}
 *   toneOptions={[
 *     { value: 'formal', label: 'Formal', description: 'Professional tone' },
 *     { value: 'neutral', label: 'Neutral', description: 'Balanced tone' },
 *     { value: 'casual', label: 'Casual', description: 'Relaxed tone' }
 *   ]}
 *   formatOptions={[
 *     { value: 'markdown', label: 'Markdown' },
 *     { value: 'plain-text', label: 'Plain Text' }
 *   ]}
 *   lengthOptions={[
 *     { value: 'short', label: 'Short', description: '~100 words' },
 *     { value: 'medium', label: 'Medium', description: '~250 words' },
 *     { value: 'long', label: 'Long', description: '~500+ words' }
 *   ]}
 *   title="Writer Configuration"
 *   description="Configure content generation settings"
 *   showAdvanced
 * />
 * ```
 */
export function WritingConfigPanel<
  T extends BaseWritingConfig = BaseWritingConfig,
>({
  config,
  onChange,
  toneOptions,
  formatOptions,
  lengthOptions,
  languageOptions,
  title = 'Configuration',
  description = 'Configure writing settings',
  showAdvanced = false,
  defaultCollapsed = false,
  className,
  disabled = false,
  onViewCode,
}: WritingConfigPanelProps<T>) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CollapsibleTrigger
              asChild
              aria-label={
                isOpen
                  ? `Hide ${title.toLowerCase()}`
                  : `Show ${title.toLowerCase()}`
              }
            >
              <div className="flex items-center cursor-pointer group flex-1 hover:bg-accent/50 rounded-md px-2 py-1 -mx-2 -my-1 transition-all duration-200">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    {title}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    {description}
                  </CardDescription>
                </div>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-muted-foreground transition-transform duration-200 ml-2',
                    'group-hover:text-foreground',
                    isOpen && 'rotate-180',
                  )}
                />
              </div>
            </CollapsibleTrigger>

            {/* View Code Button */}
            {onViewCode && <ViewCodeButton onClick={onViewCode} />}
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Main Configuration Grid */}
            <div
              className={cn(
                'grid grid-cols-1 gap-4',
                languageOptions ? 'md:grid-cols-4' : 'md:grid-cols-3',
              )}
            >
              {/* Tone Selector */}
              <div className="space-y-2">
                <Label
                  htmlFor="tone"
                  className="flex items-center gap-1 text-xs sm:text-sm"
                >
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  Tone
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">
                          Writing style and formality level. Choose the tone
                          that best matches your use case.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select
                  value={config.tone}
                  onValueChange={(tone) => onChange({ ...config, tone })}
                  disabled={disabled}
                >
                  <SelectTrigger id="tone" className="w-full">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            {option.icon && <span>{option.icon}</span>}
                            <span>{option.label}</span>
                          </div>
                          {option.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Format Selector */}
              <div className="space-y-2">
                <Label
                  htmlFor="format"
                  className="flex items-center gap-1 text-xs sm:text-sm"
                >
                  📝 Format
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">
                          Output text format. Markdown includes formatting like
                          headings and lists, while plain text is unformatted.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select
                  value={config.format}
                  onValueChange={(format) => onChange({ ...config, format })}
                  disabled={disabled}
                >
                  <SelectTrigger id="format" className="w-full">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            {option.icon && <span>{option.icon}</span>}
                            <span>{option.label}</span>
                          </div>
                          {option.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Length Selector */}
              <div className="space-y-2">
                <Label
                  htmlFor="length"
                  className="flex items-center gap-1 text-xs sm:text-sm"
                >
                  📏 Length
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">
                          Target content length. The AI will aim for this length
                          but may vary slightly based on context.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select
                  value={config.length}
                  onValueChange={(length) => onChange({ ...config, length })}
                  disabled={disabled}
                >
                  <SelectTrigger id="length" className="w-full">
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    {lengthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            {option.icon && <span>{option.icon}</span>}
                            <span>{option.label}</span>
                          </div>
                          {option.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Output Language Selector (optional, for Rewriter) */}
              {languageOptions && config.outputLanguage !== undefined && (
                <div className="space-y-2">
                  <Label
                    htmlFor="outputLanguage"
                    className="flex items-center gap-1 text-xs sm:text-sm"
                  >
                    🌍 Language
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">
                            Output language for the rewritten text. Specifying
                            the language improves quality and safety of the
                            results.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Select
                    value={config.outputLanguage}
                    onValueChange={(outputLanguage) =>
                      onChange({ ...config, outputLanguage })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger id="outputLanguage" className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              {option.icon && <span>{option.icon}</span>}
                              <span>{option.label}</span>
                            </div>
                            {option.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {option.description}
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Shared Context (Advanced) */}
            {showAdvanced && (
              <div className="space-y-2 pt-2 border-t">
                <Label
                  htmlFor="context"
                  className="flex items-center gap-1 text-xs sm:text-sm"
                >
                  💡 Shared Context{' '}
                  <span className="text-muted-foreground">(Optional)</span>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">
                          Overarching context applied to ALL writing/rewriting
                          tasks in this session. For example: &quot;This is for
                          publishing on a business-focused platform&quot; or
                          &quot;Content for a tech startup blog&quot;. Use this
                          for consistent context across multiple generations.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Textarea
                  id="context"
                  value={config.sharedContext || ''}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      sharedContext: e.target.value,
                    })
                  }
                  placeholder="e.g., 'Business communication for a tech company', 'Casual blog for millennials'"
                  rows={2}
                  className="resize-none text-sm"
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  This context applies to ALL generations in this session. For
                  task-specific context, use the context field in the input
                  area.
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ============================================================================
// Export
// ============================================================================

export default WritingConfigPanel;
