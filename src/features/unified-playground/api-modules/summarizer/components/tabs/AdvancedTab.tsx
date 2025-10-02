/**
 * AdvancedTab Component
 *
 * Advanced features for power users
 * Includes quick samples, chunking strategies, and URL extraction
 *
 * @module AdvancedTab
 */

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Import components
import { QuickSamplesCard } from '../QuickSamplesCard';
import { ChunkingStrategySelector } from '../ChunkingStrategySelector';
import { URLExtractionCard } from '../URLExtractionCard';

// Import types
import type { SampleText } from '../../types/api.types';
import type { ChunkingStrategy } from '../../types/chunking.types';

// ============================================================================
// Types
// ============================================================================

export interface AdvancedTabProps {
  /** Quick sample selection handler */
  onSampleSelect?: (sample: SampleText) => void;

  /** Currently selected sample ID */
  selectedSampleId?: string;

  /** Chunking strategy */
  chunkingStrategy?: ChunkingStrategy;

  /** Chunking strategy change handler */
  onChunkingStrategyChange?: (strategy: ChunkingStrategy) => void;

  /** URL extraction handler */
  onUrlExtract?: (url: string) => Promise<void>;

  /** Is extracting URL */
  isExtractingUrl?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// AdvancedTab Component
// ============================================================================

/**
 * Advanced features tab
 *
 * @example
 * ```tsx
 * <AdvancedTab
 *   onSampleSelect={(sample) => {
 *     setInputText(sample.text);
 *     setConfig(sample.recommendedConfig);
 *   }}
 *   chunkingStrategy={chunkingStrategy}
 *   onChunkingStrategyChange={setChunkingStrategy}
 * />
 * ```
 */
export function AdvancedTab({
  onSampleSelect,
  selectedSampleId,
  chunkingStrategy = {
    type: 'recursive',
    maxChunkSize: 10000,
  },
  onChunkingStrategyChange,
  onUrlExtract,
  isExtractingUrl = false,
  className,
}: AdvancedTabProps) {
  // State
  const [url, setUrl] = useState('');

  /**
   * Handle URL extraction
   */
  const handleUrlExtract = async (extractUrl: string) => {
    if (onUrlExtract) {
      await onUrlExtract(extractUrl);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Info */}
      <Alert className="border-purple-200 bg-purple-50">
        <AlertCircle className="h-4 w-4 text-purple-600" />
        <AlertTitle className="text-purple-900">Advanced Features</AlertTitle>
        <AlertDescription className="text-purple-800 text-sm">
          Power user features for specialized use cases. Quick samples provide
          pre-configured examples, chunking handles long documents, and URL
          extraction summarizes web content.
        </AlertDescription>
      </Alert>

      {/* Quick Samples */}
      {onSampleSelect && (
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900">
              Quick Samples
            </h3>
            <p className="text-sm text-slate-600">
              Pre-configured examples to explore different summarization styles
            </p>
          </div>

          <QuickSamplesCard
            onSampleSelect={onSampleSelect}
            selectedSampleId={selectedSampleId}
          />
        </div>
      )}

      <Separator />

      {/* Chunking Strategy */}
      {onChunkingStrategyChange && (
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900">
              Long Content Processing
            </h3>
            <p className="text-sm text-slate-600">
              Configure how content exceeding 10,000 characters is split and
              processed
            </p>
          </div>

          <ChunkingStrategySelector
            strategy={chunkingStrategy}
            onChange={onChunkingStrategyChange}
            showAdvanced
          />
        </div>
      )}

      <Separator />

      {/* URL Extraction */}
      {onUrlExtract && (
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900">
              URL Extraction
            </h3>
            <p className="text-sm text-slate-600">
              Extract and summarize content directly from web pages
            </p>
          </div>

          <URLExtractionCard
            url={url}
            onUrlChange={setUrl}
            onExtract={handleUrlExtract}
            isExtracting={isExtractingUrl}
          />
        </div>
      )}

      {/* Feature Notes */}
      <div className="pt-4 border-t border-slate-200">
        <div className="space-y-2 text-xs text-slate-600">
          <p className="font-medium text-slate-700">Feature Notes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Quick Samples:</strong> Each sample includes recommended
              configuration settings for optimal results
            </li>
            <li>
              <strong>Chunking:</strong> Automatically applied to content
              &gt;10,000 characters. Recursive strategy works best for most
              cases
            </li>
            <li>
              <strong>URL Extraction:</strong> Experimental feature. Works best
              with sites that support CORS or through a proxy
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default AdvancedTab;
