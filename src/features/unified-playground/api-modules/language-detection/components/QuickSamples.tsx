/**
 * QuickSamples Component - Language Detection
 *
 * Displays sample texts in various languages for quick testing.
 * Helps users get started quickly with ready-to-use examples.
 *
 * @module language-detection/components/QuickSamples
 */

import { useState } from 'react';
import { Sparkles, ChevronDown, Globe } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { SAMPLE_CATEGORIES } from '../data/samples';
import type { LanguageDetectionSample } from '../data/samples';

// ============================================================================
// Types
// ============================================================================

export interface QuickSamplesProps {
  /** Callback when a sample is selected */
  onSampleSelect: (sample: LanguageDetectionSample) => void;

  /** Current input text (to show if sample is active) */
  currentInput?: string;

  /** Is detection in progress */
  disabled?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * QuickSamples component for Language Detection
 *
 * Provides quick access to sample texts in various languages.
 *
 * @example
 * ```tsx
 * <QuickSamples
 *   onSampleSelect={(sample) => {
 *     setInputText(sample.text);
 *   }}
 *   disabled={isDetecting}
 * />
 * ```
 */
export function QuickSamples({
  onSampleSelect,
  currentInput,
  disabled = false,
  className,
}: QuickSamplesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(
    SAMPLE_CATEGORIES[0]?.id,
  );

  /**
   * Handle sample selection
   */
  const handleSampleClick = (sample: LanguageDetectionSample) => {
    if (disabled) return;
    onSampleSelect(sample);
    // Auto-collapse after selection for better UX
    setTimeout(() => setIsOpen(false), 300);
  };

  /**
   * Check if sample is currently active
   */
  const isSampleActive = (sample: LanguageDetectionSample) => {
    return currentInput?.trim() === sample.text.trim();
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
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                Quick Start Samples
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Try sample texts in different languages
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
            {/* Sample Templates */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Language Samples
              </h4>

              <Tabs
                value={activeCategory}
                onValueChange={setActiveCategory}
                className="w-full"
              >
                <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
                  {SAMPLE_CATEGORIES.map((category) => (
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

                {SAMPLE_CATEGORIES.map((category) => (
                  <TabsContent
                    key={category.id}
                    value={category.id}
                    className="mt-3 space-y-2"
                  >
                    {category.samples.map((sample) => {
                      const isActive = isSampleActive(sample);

                      return (
                        <button
                          key={sample.id}
                          onClick={() => handleSampleClick(sample)}
                          disabled={disabled}
                          className={cn(
                            'w-full text-left p-3 rounded-lg border transition-all duration-200',
                            'hover:bg-accent/50 hover:border-primary/50',
                            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
                            isActive &&
                              'bg-primary/10 border-primary ring-2 ring-primary/20',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{sample.icon}</span>
                                <span className="font-medium text-sm">
                                  {sample.name}
                                </span>
                                {isActive && (
                                  <Badge variant="default" className="text-xs">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {sample.description}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <Badge
                                variant="outline"
                                className="text-[10px] sm:text-xs"
                              >
                                {sample.expectedLanguage.toUpperCase()}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {sample.text.length} chars
                              </span>
                            </div>
                          </div>

                          {/* Preview Text */}
                          <div
                            className={cn(
                              'mt-2 text-xs text-muted-foreground line-clamp-1',
                              'font-mono bg-muted/30 rounded px-2 py-1',
                            )}
                          >
                            {sample.text}
                          </div>
                        </button>
                      );
                    })}
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Helper Text */}
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <p>
                💡 <strong>Tip:</strong> Click any sample to load it into the
                input field and detect its language.
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
