/**
 * URLExtractionCard Component
 *
 * Interface for extracting and summarizing web content from URLs
 * Supports detection of content types and extraction strategies
 *
 * @module URLExtractionCard
 */

import { useState } from 'react';
import {
  Link as LinkIcon,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { normalizeURL, getURLMetadata } from '../utils/urlParser';

// ============================================================================
// Types
// ============================================================================

export interface URLExtractionCardProps {
  /** URL input value */
  url: string;

  /** URL change handler */
  onUrlChange: (url: string) => void;

  /** Extract and summarize handler */
  onExtract: (url: string) => Promise<void>;

  /** Is currently extracting */
  isExtracting?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// URLExtractionCard Component
// ============================================================================

/**
 * URL extraction and summarization interface
 *
 * @example
 * ```tsx
 * const [url, setUrl] = useState('');
 *
 * <URLExtractionCard
 *   url={url}
 *   onUrlChange={setUrl}
 *   onExtract={async (url) => {
 *     const result = await extractAndSummarize(url);
 *     // Handle result
 *   }}
 *   isExtracting={isLoading}
 * />
 * ```
 */
export function URLExtractionCard({
  url,
  onUrlChange,
  onExtract,
  isExtracting = false,
  className,
}: URLExtractionCardProps) {
  // State
  const [urlMetadata, setUrlMetadata] = useState<ReturnType<
    typeof getURLMetadata
  > | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  /**
   * Analyze URL
   */
  const analyzeURL = (inputUrl: string) => {
    if (!inputUrl || inputUrl.trim().length === 0) {
      setUrlMetadata(null);
      setShowPreview(false);
      return;
    }

    const normalized = normalizeURL(inputUrl);
    if (!normalized) {
      setUrlMetadata(null);
      setShowPreview(false);
      return;
    }

    const metadata = getURLMetadata(normalized);
    setUrlMetadata(metadata);
    setShowPreview(metadata !== null && metadata.isContentSite);
  };

  /**
   * Handle URL input change
   */
  const handleUrlChange = (value: string) => {
    onUrlChange(value);
    analyzeURL(value);
  };

  /**
   * Handle extract button click
   */
  const handleExtract = async () => {
    const normalized = normalizeURL(url);
    if (!normalized) return;

    await onExtract(normalized);
  };

  /**
   * Check if can extract
   */
  const canExtract = urlMetadata !== null && !isExtracting;

  return (
    <Card className={cn('border-blue-200 bg-blue-50/30', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">URL Extraction</CardTitle>
        </div>
        <CardDescription>
          Extract and summarize content from web pages (experimental)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* URL Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/article"
              disabled={isExtracting}
              className="flex-1"
            />
            <Button
              onClick={handleExtract}
              disabled={!canExtract}
              variant="default"
              className={cn(
                'bg-blue-600 hover:bg-blue-700',
                isExtracting && 'bg-purple-600 hover:bg-purple-700',
              )}
            >
              {isExtracting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Extract & Summarize
                </>
              )}
            </Button>
          </div>
        </div>

        {/* URL Preview */}
        {showPreview && urlMetadata && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-green-800">
                  {urlMetadata.domain}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {urlMetadata.contentType}
                </Badge>
                {urlMetadata.isContentSite && (
                  <Badge
                    variant="outline"
                    className="text-xs text-green-700 border-green-300"
                  >
                    ✓ Supported
                  </Badge>
                )}
              </div>
              <div className="text-xs text-green-700">
                Extraction strategy: {urlMetadata.extractionStrategy.strategy}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Invalid URL */}
        {url && !urlMetadata && !isExtracting && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              Please enter a valid URL (e.g., https://example.com/article)
            </AlertDescription>
          </Alert>
        )}

        {/* CORS Warning */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-xs text-blue-800">
            <strong>Note:</strong> URL extraction works best with sites that
            support CORS or when using a proxy service. Some sites may block
            direct extraction for security reasons.
          </AlertDescription>
        </Alert>

        {/* Supported Sites */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-700">
            Supported Content Sites:
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'Wikipedia',
              'Medium',
              'Dev.to',
              'GitHub',
              'Stack Overflow',
              'Substack',
              'ArXiv',
              'News Sites',
            ].map((site) => (
              <Badge key={site} variant="outline" className="text-xs">
                {site}
              </Badge>
            ))}
          </div>
        </div>

        {/* Examples */}
        <div className="pt-2 border-t border-blue-200">
          <div className="text-xs text-slate-600">
            <strong>Example URLs:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500">
              <li>Wikipedia articles</li>
              <li>Medium blog posts</li>
              <li>Technical documentation</li>
              <li>News articles</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default URLExtractionCard;
