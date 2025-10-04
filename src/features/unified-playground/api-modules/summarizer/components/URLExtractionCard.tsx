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
   * Note: Disabled due to CORS restrictions
   */
  const handleExtract = async () => {
    const normalized = normalizeURL(url);
    if (!normalized) return;

    await onExtract(normalized);
  };

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
        {/* URL Input - Disabled due to CORS */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/article"
              disabled={true}
              className="flex-1 opacity-50"
              title="Direct URL extraction disabled due to CORS restrictions"
            />
            <Button
              onClick={handleExtract}
              disabled={true}
              variant="default"
              className="bg-slate-400 hover:bg-slate-400 cursor-not-allowed"
              title="Direct URL extraction disabled due to CORS restrictions"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Extract (Disabled)
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

        {/* CORS Info & Workaround */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-800 space-y-2">
            <div>
              <strong>Browser Limitation:</strong> Direct URL extraction is
              blocked by CORS (Cross-Origin Resource Sharing) security policies
              in most browsers.
            </div>
            <div className="pt-1">
              <strong>Workaround:</strong> Copy the article text manually and
              paste it into the input area above, then click &quot;Run
              Summarizer&quot;.
            </div>
          </AlertDescription>
        </Alert>

        {/* Supported Sites with Example URLs */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-700">
            Example Articles to Test:
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              {
                name: 'Wikipedia',
                url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
              },
              {
                name: 'Medium',
                url: 'https://medium.com/tag/technology',
              },
              {
                name: 'Dev.to',
                url: 'https://dev.to/olaleyeblessing/create-dynamic-urls-with-url-constructor-in-javascript-2o9l',
              },
              {
                name: 'GitHub',
                url: 'https://github.com/facebook/react/blob/main/README.md',
              },
              {
                name: 'Stack Overflow',
                url: 'https://stackoverflow.com/questions/tagged/javascript?tab=Votes',
              },
              {
                name: 'Substack',
                url: 'https://platformer.news/',
              },
              { name: 'ArXiv', url: 'https://arxiv.org/abs/2509.02661' },
              { name: 'BBC News', url: 'https://www.bbc.com/news/technology' },
            ].map(({ name, url: exampleUrl }) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => window.open(exampleUrl, '_blank')}
                className="text-xs h-7 px-2 hover:bg-blue-50 hover:border-blue-300"
              >
                {name}
              </Button>
            ))}
          </div>
          <div className="text-xs text-slate-500 italic">
            Click to open article → copy text → paste into input above
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
