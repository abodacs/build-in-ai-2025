/**
 * QuickSamples Component
 *
 * Displays sample texts, templates, and quick presets for the Rewriter API.
 * Helps users get started quickly with ready-to-use examples.
 *
 * @module rewriter/components/QuickSamples
 */

import { useState } from 'react';
import { Sparkles, ChevronDown, FileText } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { TEMPLATE_CATEGORIES, QUICK_PRESETS } from '../data/samples';
import type { RewriterConfig, RewriterTemplate } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface QuickSamplesProps {
  /** Callback when a template is selected */
  onTemplateSelect: (template: RewriterTemplate) => void;

  /** Callback when a quick preset is selected */
  onPresetSelect: (
    presetConfig: Partial<RewriterConfig>,
    presetName: string,
  ) => void;

  /** Current input text (to show if sample is active) */
  currentInput?: string;

  /** Is rewriting in progress */
  disabled?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * QuickSamples component
 *
 * Provides quick access to sample texts and preset configurations.
 *
 * @example
 * ```tsx
 * <QuickSamples
 *   onTemplateSelect={(template) => {
 *     setInputText(template.exampleInput);
 *     setConfig(template.config);
 *   }}
 *   onPresetSelect={(config, name) => {
 *     updateConfig(config);
 *   }}
 *   disabled={isRewriting}
 * />
 * ```
 */
export function QuickSamples({
  onTemplateSelect,
  onPresetSelect,
  currentInput,
  disabled = false,
  className,
}: QuickSamplesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(
    TEMPLATE_CATEGORIES[0]?.id,
  );

  /**
   * Handle template selection
   */
  const handleTemplateClick = (template: RewriterTemplate) => {
    if (disabled) return;
    onTemplateSelect(template);
    // Auto-collapse after selection for better UX
    setTimeout(() => setIsOpen(false), 300);
  };

  /**
   * Handle preset selection
   */
  const handlePresetClick = (
    presetConfig: Partial<RewriterConfig>,
    presetName: string,
  ) => {
    if (disabled) return;
    onPresetSelect(presetConfig, presetName);
  };

  return (
    <Card className={cn('w-full', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger
            className="flex items-start justify-between gap-4 w-full cursor-pointer hover:bg-accent/50 rounded-md px-2 py-1 -mx-2 -my-1 transition-all duration-200 group"
            aria-label={
              isOpen ? 'Hide quick start samples' : 'Show quick start samples'
            }
          >
            <div className="flex-1 text-left">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 group-hover:text-amber-600 transition-colors" />
                Quick Start Samples
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Try sample texts or apply quick transformations
              </CardDescription>
            </div>

            <ChevronDown
              className={cn(
                'h-5 w-5 text-muted-foreground transition-transform duration-200 shrink-0 mt-1',
                'group-hover:text-foreground',
                isOpen && 'rotate-180',
              )}
            />
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Quick Presets */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <span>⚡</span>
                Quick Presets
                <Badge variant="secondary" className="text-[10px] h-4 ml-1">
                  One-Click
                </Badge>
              </h4>
              <div className="flex flex-wrap gap-2">
                {QUICK_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePresetClick(preset.config, preset.name)
                    }
                    disabled={disabled}
                    className="text-xs h-8"
                    title={preset.description}
                  >
                    <span className="mr-1.5">{preset.icon}</span>
                    {preset.name}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Apply these presets to your current text, or try a sample below
              </p>
            </div>

            {/* Sample Templates */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Sample Templates
              </h4>

              <Tabs
                value={activeCategory}
                onValueChange={setActiveCategory}
                className="w-full"
              >
                <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="text-xs flex items-center gap-1 px-2 py-1"
                      disabled={disabled}
                    >
                      <span>{category.icon}</span>
                      <span className="hidden sm:inline">{category.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {TEMPLATE_CATEGORIES.map((category) => (
                  <TabsContent
                    key={category.id}
                    value={category.id}
                    className="mt-3 space-y-2"
                  >
                    <div className="grid gap-2">
                      {category.templates.map((template) => {
                        const isActive =
                          currentInput?.trim() === template.exampleInput.trim();

                        return (
                          <button
                            key={template.id}
                            onClick={() => handleTemplateClick(template)}
                            disabled={disabled}
                            className={cn(
                              'group relative w-full text-left rounded-lg border p-3',
                              'transition-all duration-200',
                              'hover:border-primary hover:shadow-sm',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                              'disabled:opacity-50 disabled:cursor-not-allowed',
                              isActive &&
                                'border-primary bg-primary/5 shadow-sm',
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-base">
                                    {template.icon}
                                  </span>
                                  <h5 className="font-medium text-sm truncate">
                                    {template.name}
                                  </h5>
                                  {isActive && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] h-4"
                                    >
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {template.description}
                                </p>

                                {/* Preview */}
                                <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground line-clamp-2">
                                  {template.exampleInput}
                                </div>

                                {/* Config Preview */}
                                {template.config && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] h-4"
                                    >
                                      {template.config.tone || 'as-is'}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] h-4"
                                    >
                                      {template.config.length || 'as-is'}
                                    </Badge>
                                    {template.config.format !==
                                      'plain-text' && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] h-4"
                                      >
                                        {template.config.format}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Hover indicator */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronDown className="w-4 h-4 text-primary rotate-[-90deg]" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {category.templates.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No templates in this category yet
                      </p>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Help Text */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Click a template to load it, or use
                quick presets to transform your own text. Each template shows
                the recommended configuration.
              </p>
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

export default QuickSamples;
