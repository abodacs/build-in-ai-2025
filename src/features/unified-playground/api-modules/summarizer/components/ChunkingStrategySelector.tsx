/**
 * ChunkingStrategySelector Component
 *
 * UI for selecting and configuring chunking strategies
 * for long content that exceeds model context limits
 *
 * @module ChunkingStrategySelector
 */

import { Layers, Info } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type {
  ChunkingStrategy,
  ChunkingStrategyType,
} from '../types/chunking.types';

// ============================================================================
// Types
// ============================================================================

export interface ChunkingStrategySelectorProps {
  /** Current strategy */
  strategy: ChunkingStrategy;

  /** Strategy change handler */
  onChange: (strategy: ChunkingStrategy) => void;

  /** Additional CSS classes */
  className?: string;

  /** Show advanced options */
  showAdvanced?: boolean;
}

// ============================================================================
// Strategy Descriptions
// ============================================================================

const STRATEGY_DESCRIPTIONS: Record<
  ChunkingStrategyType,
  { title: string; description: string; recommended: string }
> = {
  recursive: {
    title: 'Recursive',
    description: 'Hierarchical processing with recursive summarization',
    recommended: 'Best for most content types. Efficient and reliable.',
  },
  'sliding-window': {
    title: 'Sliding Window',
    description: 'Overlapping windows for continuity preservation',
    recommended: 'Best for continuous narratives and stories.',
  },
  semantic: {
    title: 'Semantic',
    description: 'Boundary-aware splits at natural break points',
    recommended: 'Best for well-structured documents with clear sections.',
  },
};

// ============================================================================
// ChunkingStrategySelector Component
// ============================================================================

/**
 * Chunking strategy selector
 *
 * @example
 * ```tsx
 * const [strategy, setStrategy] = useState<ChunkingStrategy>({
 *   type: 'recursive',
 *   maxChunkSize: 10000,
 * });
 *
 * <ChunkingStrategySelector
 *   strategy={strategy}
 *   onChange={setStrategy}
 *   showAdvanced
 * />
 * ```
 */
export function ChunkingStrategySelector({
  strategy,
  onChange,
  className,
  showAdvanced = true,
}: ChunkingStrategySelectorProps) {
  /**
   * Update strategy field
   */
  const updateStrategy = <K extends keyof ChunkingStrategy>(
    key: K,
    value: ChunkingStrategy[K],
  ) => {
    onChange({
      ...strategy,
      [key]: value,
    });
  };

  return (
    <Card className={cn('border-indigo-200 bg-indigo-50/30', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <CardTitle className="text-lg">Chunking Strategy</CardTitle>
          <Badge variant="secondary" className="ml-auto text-xs">
            For Long Content
          </Badge>
        </div>
        <CardDescription>
          Configure how long content (&gt;10,000 characters) is split and
          processed
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Strategy Type */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="strategy-type" className="text-sm font-medium">
              Strategy Type
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Choose how the AI splits long content into manageable chunks
                    for processing.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Select
            value={strategy.type}
            onValueChange={(value) =>
              updateStrategy('type', value as ChunkingStrategyType)
            }
          >
            <SelectTrigger id="strategy-type" className="w-full">
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.keys(STRATEGY_DESCRIPTIONS) as ChunkingStrategyType[]
              ).map((type) => {
                const info = STRATEGY_DESCRIPTIONS[type];
                return (
                  <SelectItem key={type} value={type}>
                    <div className="flex flex-col items-start py-1">
                      <span className="font-medium">{info.title}</span>
                      <span className="text-xs text-slate-500">
                        {info.description}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Recommendation */}
          <div className="text-xs text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-200">
            💡 {STRATEGY_DESCRIPTIONS[strategy.type].recommended}
          </div>
        </div>

        {/* Max Chunk Size */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="max-chunk-size" className="text-sm font-medium">
              Max Chunk Size
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Maximum size of each chunk in characters. Default is 10,000
                    (recommended).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-2">
            <Input
              id="max-chunk-size"
              type="number"
              min={1000}
              max={20000}
              step={1000}
              value={strategy.maxChunkSize}
              onChange={(e) =>
                updateStrategy('maxChunkSize', parseInt(e.target.value, 10))
              }
              className="flex-1"
            />
            <span className="text-sm text-slate-600 whitespace-nowrap">
              characters
            </span>
          </div>

          <div className="text-xs text-slate-500">
            Recommended: 10,000 characters (~1,500 words)
          </div>
        </div>

        {/* Sliding Window: Overlap Size */}
        {strategy.type === 'sliding-window' && showAdvanced && (
          <div className="space-y-2 pt-2 border-t border-indigo-200">
            <div className="flex items-center gap-2">
              <Label htmlFor="overlap-size" className="text-sm font-medium">
                Overlap Size
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Number of characters that overlap between consecutive
                      chunks. Higher overlap preserves more context but
                      increases processing time.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-2">
              <Input
                id="overlap-size"
                type="number"
                min={0}
                max={strategy.maxChunkSize / 2}
                step={100}
                value={strategy.overlapSize || 500}
                onChange={(e) =>
                  updateStrategy('overlapSize', parseInt(e.target.value, 10))
                }
                className="flex-1"
              />
              <span className="text-sm text-slate-600 whitespace-nowrap">
                characters
              </span>
            </div>

            <div className="text-xs text-slate-500">
              Recommended: 500-2,000 characters (5-20% of chunk size)
            </div>
          </div>
        )}

        {/* Semantic: Separators */}
        {strategy.type === 'semantic' && showAdvanced && (
          <div className="space-y-2 pt-2 border-t border-indigo-200">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Semantic Separators</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Patterns used to find natural break points in the text.
                      Priority order: paragraphs → lines → sentences.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                strategy.semanticSeparators || [
                  '\\n\\n',
                  '\\n',
                  '. ',
                  '! ',
                  '? ',
                ]
              ).map((sep, i) => (
                <Badge key={i} variant="outline" className="text-xs font-mono">
                  {sep === '\\n\\n' ? '¶¶' : sep === '\\n' ? '¶' : sep}
                </Badge>
              ))}
            </div>

            <div className="text-xs text-slate-500">
              Configured separators: Paragraph breaks, line breaks, sentence
              endings
            </div>
          </div>
        )}

        {/* Estimated chunks info */}
        <div className="pt-2 border-t border-slate-200">
          <div className="text-xs text-slate-600">
            <strong>Note:</strong> Chunking is automatically applied to content
            exceeding {strategy.maxChunkSize.toLocaleString()} characters.
            Smaller content is processed normally.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ChunkingStrategySelector;
