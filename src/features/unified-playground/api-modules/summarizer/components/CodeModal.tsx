/**
 * CodeModal Component
 *
 * Modal dialog for viewing and copying generated code
 * Overlays the playground interface for easy access
 *
 * @module CodeModal
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Code,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ThemedCodeBlock } from '@/components/code/ThemedCodeBlock';
import { CodeModalSkeleton } from '@/components/code/CodeModalSkeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SummarizerCreateOptions } from '../types/summarizer.types';

// ============================================================================
// Types
// ============================================================================

export interface CodeModalProps {
  /** Modal open state */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Current configuration */
  config?: SummarizerCreateOptions;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Code Generation (reused from CodeTab)
// ============================================================================

/**
 * Generate TypeScript implementation code
 */
function generateTypeScriptCode(config: SummarizerCreateOptions): string {
  const configStr = JSON.stringify(
    {
      type: config.type || 'tldr',
      format: config.format || 'plain-text',
      length: config.length || 'medium',
      outputLanguage: config.outputLanguage || 'en',
      ...(config.sharedContext && { sharedContext: config.sharedContext }),
    },
    null,
    2,
  );

  return `/**
 * Chrome AI Summarizer - Complete TypeScript Implementation
 *
 * Requirements:
 * - Chrome 138+ (Stable channel)
 * - GPU: 4GB+ VRAM (integrated GPUs not supported)
 * - RAM: 16GB+ system memory
 * - CPU: 4+ cores recommended
 * - Disk: 22GB+ free space
 * - Network: Unlimited data or unmetered connection
 *
 * This is a complete, self-contained implementation.
 * Copy this entire file to use in your project.
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface SummarizeOptions {
  context?: string;
}

interface Summarizer {
  summarize(text: string, options?: SummarizeOptions): Promise<string>;
  summarizeStreaming(text: string, options?: SummarizeOptions): ReadableStream<string>;
  destroy(): void;
}

interface SummarizerCreateOptions {
  type?: 'tldr' | 'key-points' | 'teaser' | 'headline';
  format?: 'plain-text' | 'markdown';
  length?: 'short' | 'medium' | 'long';
  sharedContext?: string;
  expectedInputLanguages?: string[];
  outputLanguage?: string;
  expectedContextLanguages?: string[];
}

interface SummarizerAPI {
  create(options?: SummarizerCreateOptions): Promise<Summarizer>;
  availability(): Promise<'unavailable' | 'downloadable'>;
}

declare global {
  interface Window {
    Summarizer: SummarizerAPI;
  }
  const Summarizer: SummarizerAPI;
}

// ============================================================================
// Configuration
// ============================================================================

const config: SummarizerCreateOptions = ${configStr};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Check if Chrome AI Summarizer is available
 */
async function checkAvailability(): Promise<boolean> {
  if (!('Summarizer' in self)) {
    throw new Error(
      'Chrome AI Summarizer not supported. ' +
      'Requires Chrome 138+ (Stable channel) with hardware requirements met.'
    );
  }

  const availability = await self.Summarizer.availability();

  if (availability === 'unavailable') {
    throw new Error(
      'Summarizer API not available on this device. ' +
      'Requires: GPU with 4GB+ VRAM (no integrated), 16GB+ RAM, 4+ CPU cores, 22GB+ free disk space'
    );
  }

  if (availability === 'downloadable') {
    console.log(
      'Model download required (22+ GB, 10-30 minutes on first use). ' +
      'Requires unlimited data or unmetered connection.'
    );
    // Model will download automatically on first create() call
  }

  return availability === 'downloadable';
}

/**
 * Create a new summarizer instance
 * Note: Requires user activation (must be called from user interaction like button click)
 */
async function createSummarizer(): Promise<Summarizer> {
  const summarizer = await self.Summarizer.create(config);
  return summarizer;
}

/**
 * Summarize text (non-streaming)
 */
async function summarize(text: string, context?: string): Promise<string> {
  await checkAvailability();
  const summarizer = await createSummarizer();

  try {
    const summary = await summarizer.summarize(text, { context, outputLanguage: 'en' });
    return summary;
  } finally {
    summarizer.destroy();
  }
}

/**
 * Summarize text with streaming (for real-time results)
 */
async function summarizeStreaming(
  text: string,
  onChunk: (chunk: string) => void,
  context?: string
): Promise<string> {
  await checkAvailability();
  const summarizer = await createSummarizer();

  try {
    const stream = summarizer.summarizeStreaming(text, { context, outputLanguage: 'en' });

    // Use for-await-of for async iteration
    let fullSummary = '';
    for await (const chunk of stream) {
      fullSummary = chunk;
      onChunk(chunk);
    }

    return fullSummary;
  } finally {
    summarizer.destroy();
  }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Basic summarization
 */
async function exampleBasic() {
  const text = \`
    Artificial intelligence has made remarkable progress in recent years,
    with breakthrough developments in natural language processing, computer vision,
    and machine learning. These advances are transforming industries from healthcare
    to transportation, enabling new possibilities that were once thought impossible.
  \`;

  try {
    const summary = await summarize(text);
    console.log('Summary:', summary);
  } catch (error) {
    console.error('Summarization failed:', error);
  }
}

/**
 * Example 2: Streaming summarization with real-time updates
 */
async function exampleStreaming() {
  const text = \`Your long text content here...\`;

  try {
    const summary = await summarizeStreaming(text, (chunk) => {
      console.log('Streaming chunk:', chunk);
      // Update UI with partial results in real-time
    });
    console.log('Final summary:', summary);
  } catch (error) {
    console.error('Streaming failed:', error);
  }
}

/**
 * Example 3: HTML Integration (Button click handler)
 */
function setupHTMLIntegration() {
  const button = document.getElementById('summarize-btn');
  const input = document.getElementById('text-input') as HTMLTextAreaElement;
  const output = document.getElementById('summary-output');

  button?.addEventListener('click', async () => {
    if (!input || !output) return;

    try {
      output.textContent = 'Summarizing...';
      const summary = await summarize(input.value);
      output.textContent = summary;
    } catch (error) {
      output.textContent = \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`;
    }
  });
}

/**
 * Example 4: Using context for better summaries
 */
async function exampleWithContext() {
  const text = \`
    The new smartphone features a 6.5-inch OLED display,
    5G connectivity, and a 108MP camera system.
  \`;

  const context = \`
    This is a product review for a flagship smartphone
    targeting tech enthusiasts.
  \`;

  try {
    const summary = await summarize(text, context);
    console.log('Summary with context:', summary);
  } catch (error) {
    console.error('Summarization failed:', error);
  }
}

/**
 * Example 5: Different summary types
 */
async function exampleDifferentTypes() {
  const text = \`Long article text...\`;

  // Key points (bullet points)
  const keyPointsSummarizer = await self.Summarizer.create({
    type: 'key-points',
    format: 'markdown',
    length: 'medium',
    outputLanguage: 'en'
  });

  // TL;DR (concise sentences)
  const tldrSummarizer = await self.Summarizer.create({
    type: 'tldr',
    format: 'plain-text',
    length: 'short',
    outputLanguage: 'en'
  });

  // Headline (article title)
  const headlineSummarizer = await self.Summarizer.create({
    type: 'headline',
    length: 'short',
    outputLanguage: 'en'
  });

  // Teaser (preview text)
  const teaserSummarizer = await self.Summarizer.create({
    type: 'teaser',
    length: 'medium',
    outputLanguage: 'en'
  });

  try {
    const keyPoints = await keyPointsSummarizer.summarize(text, { outputLanguage: 'en' });
    console.log('Key Points:', keyPoints);

    const tldr = await tldrSummarizer.summarize(text, { outputLanguage: 'en' });
    console.log('TL;DR:', tldr);

    const headline = await headlineSummarizer.summarize(text, { outputLanguage: 'en' });
    console.log('Headline:', headline);

    const teaser = await teaserSummarizer.summarize(text, { outputLanguage: 'en' });
    console.log('Teaser:', teaser);

    // Clean up
    keyPointsSummarizer.destroy();
    tldrSummarizer.destroy();
    headlineSummarizer.destroy();
    teaserSummarizer.destroy();
  } catch (error) {
    console.error('Summarization failed:', error);
  }
}

/**
 * Example 6: Language-specific configuration
 */
async function exampleLanguageConfig() {
  const summarizer = await self.Summarizer.create({
    type: 'tldr',
    expectedInputLanguages: ['en', 'es'],
    outputLanguage: 'en',
    length: 'medium'
  });

  try {
    const text = \`Mixed English and Spanish content...\`;
    const summary = await summarizer.summarize(text, { outputLanguage: 'en' });
    console.log('Summary:', summary);
  } finally {
    summarizer.destroy();
  }
}

// ============================================================================
// Run Examples (uncomment to test)
// ============================================================================

// exampleBasic();
// exampleStreaming();
// setupHTMLIntegration();
// exampleWithContext();
// exampleDifferentTypes();
// exampleLanguageConfig();

export { summarize, summarizeStreaming, checkAvailability };`;
}

/**
 * Generate JavaScript implementation code
 */
function generateJavaScriptCode(config: SummarizerCreateOptions): string {
  const configStr = JSON.stringify(
    {
      type: config.type || 'tldr',
      format: config.format || 'plain-text',
      length: config.length || 'medium',
      outputLanguage: config.outputLanguage || 'en',
      ...(config.sharedContext && { sharedContext: config.sharedContext }),
    },
    null,
    2,
  );

  return `/**
 * Chrome AI Summarizer - Complete JavaScript Implementation
 *
 * Requirements:
 * - Chrome 138+ (Stable channel)
 * - GPU: 4GB+ VRAM (integrated GPUs not supported)
 * - RAM: 16GB+ system memory
 * - CPU: 4+ cores recommended
 * - Disk: 22GB+ free space
 * - Network: Unlimited data or unmetered connection
 *
 * This is a complete, self-contained implementation.
 * Copy this entire file to use in your project.
 */

// ============================================================================
// Configuration
// ============================================================================

const config = ${configStr};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Check if Chrome AI Summarizer is available
 */
async function checkAvailability() {
  if (!('Summarizer' in self)) {
    throw new Error(
      'Chrome AI Summarizer not supported. ' +
      'Requires Chrome 138+ (Stable channel) with hardware requirements met.'
    );
  }

  const availability = await self.Summarizer.availability();

  if (availability === 'unavailable') {
    throw new Error(
      'Summarizer API not available on this device. ' +
      'Requires: GPU with 4GB+ VRAM (no integrated), 16GB+ RAM, 4+ CPU cores, 22GB+ free disk space'
    );
  }

  if (availability === 'downloadable') {
    console.log(
      'Model download required (22+ GB, 10-30 minutes on first use). ' +
      'Requires unlimited data or unmetered connection.'
    );
    // Model will download automatically on first create() call
  }

  return availability === 'downloadable';
}

/**
 * Create a new summarizer instance
 * Note: Requires user activation (must be called from user interaction like button click)
 */
async function createSummarizer() {
  const summarizer = await self.Summarizer.create(config);
  return summarizer;
}

/**
 * Summarize text (non-streaming)
 */
async function summarize(text, context) {
  await checkAvailability();
  const summarizer = await createSummarizer();

  try {
    const summary = await summarizer.summarize(text, { context, outputLanguage: 'en' });
    return summary;
  } finally {
    summarizer.destroy();
  }
}

/**
 * Summarize text with streaming (for real-time results)
 */
async function summarizeStreaming(text, onChunk, context) {
  await checkAvailability();
  const summarizer = await createSummarizer();

  try {
    const stream = summarizer.summarizeStreaming(text, { context, outputLanguage: 'en' });

    // Use for-await-of for async iteration
    let fullSummary = '';
    for await (const chunk of stream) {
      fullSummary = chunk;
      onChunk(chunk);
    }

    return fullSummary;
  } finally {
    summarizer.destroy();
  }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Basic summarization
 */
async function exampleBasic() {
  const text = \`
    Artificial intelligence has made remarkable progress in recent years,
    with breakthrough developments in natural language processing, computer vision,
    and machine learning. These advances are transforming industries from healthcare
    to transportation, enabling new possibilities that were once thought impossible.
  \`;

  try {
    const summary = await summarize(text);
    console.log('Summary:', summary);
  } catch (error) {
    console.error('Summarization failed:', error);
  }
}

/**
 * Example 2: Streaming summarization with real-time updates
 */
async function exampleStreaming() {
  const text = \`Your long text content here...\`;

  try {
    const summary = await summarizeStreaming(text, (chunk) => {
      console.log('Streaming chunk:', chunk);
      // Update UI with partial results in real-time
    });
    console.log('Final summary:', summary);
  } catch (error) {
    console.error('Streaming failed:', error);
  }
}

/**
 * Example 3: HTML Integration (Button click handler)
 */
function setupHTMLIntegration() {
  const button = document.getElementById('summarize-btn');
  const input = document.getElementById('text-input');
  const output = document.getElementById('summary-output');

  button?.addEventListener('click', async () => {
    if (!input || !output) return;

    try {
      output.textContent = 'Summarizing...';
      const summary = await summarize(input.value);
      output.textContent = summary;
    } catch (error) {
      output.textContent = \`Error: \${error.message || 'Unknown error'}\`;
    }
  });
}

/**
 * Example 4: Using context for better summaries
 */
async function exampleWithContext() {
  const text = \`
    The new smartphone features a 6.5-inch OLED display,
    5G connectivity, and a 108MP camera system.
  \`;

  const context = \`
    This is a product review for a flagship smartphone
    targeting tech enthusiasts.
  \`;

  try {
    const summary = await summarize(text, context);
    console.log('Summary with context:', summary);
  } catch (error) {
    console.error('Summarization failed:', error);
  }
}

/**
 * Example 5: Different summary types
 */
async function exampleDifferentTypes() {
  const text = \`Long article text...\`;

  // Key points (bullet points)
  const keyPointsSummarizer = await self.Summarizer.create({
    type: 'key-points',
    format: 'markdown',
    length: 'medium',
    outputLanguage: 'en'
  });

  // TL;DR (concise sentences)
  const tldrSummarizer = await self.Summarizer.create({
    type: 'tldr',
    format: 'plain-text',
    length: 'short',
    outputLanguage: 'en'
  });

  // Headline (article title)
  const headlineSummarizer = await self.Summarizer.create({
    type: 'headline',
    length: 'short',
    outputLanguage: 'en'
  });

  // Teaser (preview text)
  const teaserSummarizer = await self.Summarizer.create({
    type: 'teaser',
    length: 'medium',
    outputLanguage: 'en'
  });

  try {
    const keyPoints = await keyPointsSummarizer.summarize(text, { outputLanguage: 'en' });
    console.log('Key Points:', keyPoints);

    const tldr = await tldrSummarizer.summarize(text, { outputLanguage: 'en' });
    console.log('TL;DR:', tldr);

    const headline = await headlineSummarizer.summarize(text, { outputLanguage: 'en' });
    console.log('Headline:', headline);

    const teaser = await teaserSummarizer.summarize(text, { outputLanguage: 'en' });
    console.log('Teaser:', teaser);

    // Clean up
    keyPointsSummarizer.destroy();
    tldrSummarizer.destroy();
    headlineSummarizer.destroy();
    teaserSummarizer.destroy();
  } catch (error) {
    console.error('Summarization failed:', error);
  }
}

/**
 * Example 6: Language-specific configuration
 */
async function exampleLanguageConfig() {
  const summarizer = await self.Summarizer.create({
    type: 'tldr',
    expectedInputLanguages: ['en', 'es'],
    outputLanguage: 'en',
    length: 'medium'
  });

  try {
    const text = \`Mixed English and Spanish content...\`;
    const summary = await summarizer.summarize(text, { outputLanguage: 'en' });
    console.log('Summary:', summary);
  } finally {
    summarizer.destroy();
  }
}

// ============================================================================
// Run Examples (uncomment to test)
// ============================================================================

// exampleBasic();
// exampleStreaming();
// setupHTMLIntegration();
// exampleWithContext();
// exampleDifferentTypes();
// exampleLanguageConfig();

export { summarize, summarizeStreaming, checkAvailability };`;
}

// ============================================================================
// CodeModal Component
// ============================================================================

/**
 * Modal dialog for code generation and export
 *
 * @example
 * ```tsx
 * <CodeModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   config={config}
 * />
 * ```
 */
export function CodeModal({
  isOpen,
  onClose,
  config = { outputLanguage: 'en' },
  className,
}: CodeModalProps) {
  // State
  const [requirementsOpen, setRequirementsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate code with loading simulation and error handling
  const generateCode = () => {
    setIsLoading(true);
    setError(null);

    // Simulate code generation with potential delay
    const timer = setTimeout(() => {
      try {
        // Code generation happens here (instantaneous in practice)
        // The loading state ensures we show skeleton for at least 200ms
        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Code generation failed. Please try again.',
        );
        setIsLoading(false);
      }
    }, 200); // Show skeleton for minimum 200ms

    return () => clearTimeout(timer);
  };

  // Trigger code generation when modal opens
  useEffect(() => {
    if (isOpen) {
      generateCode();
    }
  }, [isOpen]);

  // Retry code generation
  const handleRetry = () => {
    generateCode();
  };

  // Generated code (memoized for performance)
  const typescriptCode = useMemo(
    () => generateTypeScriptCode(config),
    [config],
  );
  const javascriptCode = useMemo(
    () => generateJavaScriptCode(config),
    [config],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent
        className={cn(
          // Responsive widths - works down to 320px
          'w-[calc(100vw-1rem)] min-[375px]:w-[calc(100vw-2rem)] sm:w-[95vw]',
          'max-w-4xl xl:max-w-[1400px]',
          // Heights
          'h-[85vh] sm:h-[90vh] max-h-[90vh]',
          // Layout
          'p-0 gap-0 flex flex-col',
          // Ensure proper overflow
          'overflow-hidden',
          className,
        )}
      >
        <DialogHeader className="px-4 min-[375px]:px-6 pt-4 min-[375px]:pt-6 pb-3 min-[375px]:pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 min-[375px]:w-5 min-[375px]:h-5 text-green-600" />
            <DialogTitle className="text-base min-[375px]:text-lg">
              Generated Code
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs min-[375px]:text-sm">
            Implementation code based on your current configuration. Copy or
            download to integrate into your project.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 min-[375px]:px-6 pb-4 min-[375px]:pb-6 space-y-4">
          {/* Loading State */}
          {isLoading && <CodeModalSkeleton />}

          {/* Error State */}
          {error && !isLoading && (
            <Alert className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="flex flex-col gap-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    Code Generation Failed
                  </p>
                  <p className="text-xs text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleRetry}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                  >
                    Retry
                  </Button>
                  <Button
                    onClick={onClose}
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                  >
                    Close
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success State - Show Code */}
          {!isLoading && !error && (
            <>
              {/* Requirements & Setup - Collapsible */}
              <Collapsible
                open={requirementsOpen}
                onOpenChange={setRequirementsOpen}
              >
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                      <span className="text-sm font-medium text-amber-900">
                        Requirements & Setup
                      </span>
                      {requirementsOpen ? (
                        <ChevronUp className="h-4 w-4 text-amber-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-amber-600" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2 text-xs text-amber-800">
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          <strong>Chrome 138+</strong> with Chrome AI Summarizer
                          API enabled
                        </li>
                        <li>
                          Enable flag:{' '}
                          <code className="px-1 py-0.5 bg-amber-100 rounded text-[10px]">
                            chrome://flags#summarization-api-for-gemini-nano
                          </code>
                        </li>
                        <li>Check availability before using the API</li>
                        <li>
                          <strong>User activation required:</strong> Call{' '}
                          <code className="px-1 py-0.5 bg-amber-100 rounded text-[10px]">
                            Summarizer.create()
                          </code>{' '}
                          only from user interactions (button clicks)
                        </li>
                        <li>
                          Always clean up summarizer instances with{' '}
                          <code className="px-1 py-0.5 bg-amber-100 rounded text-[10px]">
                            destroy()
                          </code>
                        </li>
                        <li>
                          Handle model download if availability is{' '}
                          <code className="px-1 py-0.5 bg-amber-100 rounded text-[10px]">
                            &apos;after-download&apos;
                          </code>
                        </li>
                        <li>
                          Consider using streaming for better UX with long
                          content
                        </li>
                      </ul>
                    </CollapsibleContent>
                  </AlertDescription>
                </Alert>
              </Collapsible>

              {/* Configuration Display */}
              <Alert className="bg-slate-50 mb-4">
                <AlertDescription className="space-y-2">
                  <div className="text-sm font-medium">
                    Current Configuration:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      Type: {config.type || 'tldr'}
                    </Badge>
                    <Badge variant="secondary">
                      Format: {config.format || 'plain-text'}
                    </Badge>
                    <Badge variant="secondary">
                      Length: {config.length || 'medium'}
                    </Badge>
                    {config.sharedContext && (
                      <Badge variant="secondary">Shared Context: Yes</Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Code Tabs */}
              <Tabs defaultValue="javascript" className="w-full">
                <TabsList className="w-full grid grid-cols-2 mb-4">
                  <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                </TabsList>

                {/* TypeScript */}
                <TabsContent value="typescript" className="mt-0 space-y-3">
                  <div className="text-sm text-slate-600">
                    Full TypeScript implementation with types
                  </div>

                  <ThemedCodeBlock
                    code={typescriptCode}
                    language="typescript"
                    filename="summarizer.ts"
                    showCopyButton
                    showDownloadButton
                    showThemeToggle={false}
                    showLanguageBadge={false}
                    forceTheme="dark"
                  />
                </TabsContent>

                {/* JavaScript */}
                <TabsContent value="javascript" className="mt-0 space-y-3">
                  <div className="text-sm text-slate-600">
                    Plain JavaScript implementation
                  </div>

                  <ThemedCodeBlock
                    code={javascriptCode}
                    language="javascript"
                    filename="summarizer.js"
                    showCopyButton
                    showDownloadButton
                    showThemeToggle={false}
                    showLanguageBadge={false}
                    forceTheme="dark"
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Export
// ============================================================================

export default CodeModal;
