/**
 * QuickTemplates Component
 *
 * Quick template selector for Writer API.
 * Displays categorized prompt templates with search and filtering.
 *
 * @module writer/components/QuickTemplates
 */

import { useState } from 'react';
import { Sparkles, Search, ChevronDown } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  TEMPLATE_CATEGORIES,
  searchTemplates,
  type WriterTemplate,
} from '../utils/promptTemplates';
import type { WriterConfig } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface QuickTemplatesProps {
  /** Template selection handler */
  onSelectTemplate: (template: WriterTemplate) => void;

  /** Configuration update handler (when template has recommended config) */
  onConfigUpdate?: (config: Partial<WriterConfig>) => void;

  /** Disabled state */
  disabled?: boolean;

  /** Initial collapsed state */
  defaultCollapsed?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Quick template selector component
 *
 * Provides a searchable, categorized list of prompt templates
 * for quick content generation.
 *
 * @example
 * ```tsx
 * <QuickTemplates
 *   onSelectTemplate={(template) => {
 *     setPrompt(template.prompt);
 *     if (template.config) {
 *       setConfig({ ...config, ...template.config });
 *     }
 *   }}
 *   onConfigUpdate={(newConfig) => setConfig({ ...config, ...newConfig })}
 * />
 * ```
 */
export function QuickTemplates({
  onSelectTemplate,
  onConfigUpdate,
  disabled = false,
  defaultCollapsed = false,
  className,
}: QuickTemplatesProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter templates based on search and category
  const filteredTemplates = searchQuery
    ? searchTemplates(searchQuery)
    : selectedCategory
      ? TEMPLATE_CATEGORIES.find((c) => c.id === selectedCategory)?.templates ||
        []
      : [];

  const handleSelectTemplate = (template: WriterTemplate) => {
    // Apply template
    onSelectTemplate(template);

    // Update config if recommended
    if (template.config && onConfigUpdate) {
      onConfigUpdate(template.config);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CollapsibleTrigger
            asChild
            aria-label={
              isOpen ? 'Hide quick templates' : 'Show quick templates'
            }
          >
            <button
              type="button"
              className="flex items-center justify-between cursor-pointer group w-full hover:bg-accent/50 rounded-md px-2 py-1 -mx-2 -my-1 transition-all duration-200"
            >
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 group-hover:text-yellow-600 transition-colors" />
                  Quick Templates
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  Start with pre-made prompts
                </CardDescription>
              </div>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-muted-foreground transition-transform duration-200 ml-2 shrink-0',
                  'group-hover:text-foreground',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedCategory(null);
                }}
                disabled={disabled}
                className="pl-9"
              />
            </div>

            {/* Category Filters */}
            {!searchQuery && (
              <div className="flex flex-wrap touch-gap">
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  disabled={disabled}
                  className="h-10 lg:h-8 text-xs tap-fast"
                >
                  All Categories
                </Button>
                {TEMPLATE_CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategory === category.id ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    disabled={disabled}
                    className="h-10 lg:h-8 text-xs tap-fast"
                  >
                    {category.icon} {category.name}
                  </Button>
                ))}
              </div>
            )}

            {/* Template List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    onClick={() => handleSelectTemplate(template)}
                    disabled={disabled}
                    className={cn(
                      'w-full h-auto p-3 justify-start items-start',
                      'hover:bg-muted/50 transition-colors',
                    )}
                  >
                    <div className="flex gap-3 w-full text-left">
                      {/* Icon */}
                      <div className="text-2xl shrink-0">{template.icon}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="font-medium text-sm">
                          {template.name}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </div>

                        {/* Config Badges */}
                        {template.config && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {template.config.tone && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-4"
                              >
                                {template.config.tone}
                              </Badge>
                            )}
                            {template.config.format && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-4"
                              >
                                {template.config.format}
                              </Badge>
                            )}
                            {template.config.length && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-4"
                              >
                                {template.config.length}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? (
                    <div className="space-y-2">
                      <p className="text-sm">
                        No templates found for &quot;{searchQuery}&quot;
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                        className="text-xs"
                      >
                        Clear search
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm">
                      Select a category or search for templates
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Template Count */}
            {filteredTemplates.length > 0 && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Showing {filteredTemplates.length} template
                {filteredTemplates.length !== 1 ? 's' : ''}
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

export default QuickTemplates;
