/**
 * CodeTab Component
 *
 * Code generation and export for Chrome AI Summarizer
 * Generates implementation code based on current configuration
 *
 * @module CodeTab
 */

import { useState, useMemo } from 'react';
import { Code, Copy, CheckCircle2, Download } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { SummarizerCreateOptions } from '../../types/summarizer.types';

// ============================================================================
// Types
// ============================================================================

export interface CodeTabProps {
  /** Current configuration */
  config?: SummarizerCreateOptions;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Code Generation
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
      ...(config.sharedContext && { sharedContext: config.sharedContext }),
    },
    null,
    2,
  );

  return `import type { Summarizer, SummarizerCreateOptions } from './types';

// Configuration
const config: SummarizerCreateOptions = ${configStr};

// Check availability
async function checkAvailability() {
  const SummarizerAPI = (self as any).Summarizer;

  if (!SummarizerAPI) {
    throw new Error('Chrome AI Summarizer not supported');
  }

  const availability = await SummarizerAPI.availability();

  if (availability === 'no') {
    throw new Error('Chrome AI not available on this device');
  }

  if (availability === 'after-download') {
    console.log('Model download required');
    // Handle model download with progress monitoring
  }

  return availability === 'readily';
}

// Create summarizer instance
async function createSummarizer(): Promise<Summarizer> {
  const SummarizerAPI = (self as any).Summarizer;
  const summarizer = await SummarizerAPI.create(config);
  return summarizer;
}

// Summarize text
async function summarize(text: string): Promise<string> {
  // Check availability
  const isReady = await checkAvailability();

  if (!isReady) {
    throw new Error('Chrome AI not ready');
  }

  // Create summarizer
  const summarizer = await createSummarizer();

  try {
    // Perform summarization
    const summary = await summarizer.summarize(text);
    return summary;
  } finally {
    // Clean up
    summarizer.destroy();
  }
}

// Streaming summarization
async function summarizeStreaming(text: string): Promise<ReadableStream<string>> {
  const isReady = await checkAvailability();

  if (!isReady) {
    throw new Error('Chrome AI not ready');
  }

  const summarizer = await createSummarizer();

  if (!('summarizeStreaming' in summarizer)) {
    throw new Error('Streaming not supported');
  }

  return (summarizer as any).summarizeStreaming(text);
}

// Example usage
async function example() {
  const text = \`Your long text content here...\`;

  try {
    const summary = await summarize(text);
    console.log('Summary:', summary);
  } catch (error) {
    console.error('Summarization failed:', error);
  }
}

// Run example
example();`;
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
      ...(config.sharedContext && { sharedContext: config.sharedContext }),
    },
    null,
    2,
  );

  return `// Configuration
const config = ${configStr};

// Check availability
async function checkAvailability() {
  const SummarizerAPI = self.Summarizer;

  if (!SummarizerAPI) {
    throw new Error('Chrome AI Summarizer not supported');
  }

  const availability = await SummarizerAPI.availability();

  if (availability === 'no') {
    throw new Error('Chrome AI not available on this device');
  }

  if (availability === 'after-download') {
    console.log('Model download required');
    // Handle model download
  }

  return availability === 'readily';
}

// Create summarizer instance
async function createSummarizer() {
  const SummarizerAPI = self.Summarizer;
  const summarizer = await SummarizerAPI.create(config);
  return summarizer;
}

// Summarize text
async function summarize(text) {
  // Check availability
  const isReady = await checkAvailability();

  if (!isReady) {
    throw new Error('Chrome AI not ready');
  }

  // Create summarizer
  const summarizer = await createSummarizer();

  try {
    // Perform summarization
    const summary = await summarizer.summarize(text);
    return summary;
  } finally {
    // Clean up
    summarizer.destroy();
  }
}

// Streaming summarization
async function summarizeStreaming(text) {
  const isReady = await checkAvailability();

  if (!isReady) {
    throw new Error('Chrome AI not ready');
  }

  const summarizer = await createSummarizer();

  if (!summarizer.summarizeStreaming) {
    throw new Error('Streaming not supported');
  }

  return summarizer.summarizeStreaming(text);
}

// Example usage
async function example() {
  const text = \`Your long text content here...\`;

  try {
    const summary = await summarize(text);
    console.log('Summary:', summary);
  } catch (error) {
    console.error('Summarization failed:', error);
  }
}

// Run example
example();`;
}

// ============================================================================
// CodeTab Component
// ============================================================================

/**
 * Code generation and export tab
 *
 * @example
 * ```tsx
 * <CodeTab config={summarizerConfig} />
 * ```
 */
export function CodeTab({ config = {}, className }: CodeTabProps) {
  // State
  const [copiedLanguage, setCopiedLanguage] = useState<string | null>(null);

  // Generated code
  const typescriptCode = useMemo(
    () => generateTypeScriptCode(config),
    [config],
  );
  const javascriptCode = useMemo(
    () => generateJavaScriptCode(config),
    [config],
  );

  /**
   * Copy code to clipboard
   */
  const copyCode = async (code: string, language: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedLanguage(language);

      // Reset after 2 seconds
      setTimeout(() => setCopiedLanguage(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  /**
   * Download code as file
   */
  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-green-600" />
            <CardTitle className="text-lg">Generated Code</CardTitle>
          </div>
          <CardDescription>
            Implementation code based on your current configuration. Copy or
            download to integrate into your project.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configuration Display */}
      <Alert>
        <AlertDescription className="space-y-2">
          <div className="text-sm font-medium">Current Configuration:</div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Type: {config.type || 'tldr'}</Badge>
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
      <Card>
        <Tabs defaultValue="typescript" className="w-full">
          <CardHeader className="pb-4">
            <TabsList className="w-full">
              <TabsTrigger value="typescript" className="flex-1">
                TypeScript
              </TabsTrigger>
              <TabsTrigger value="javascript" className="flex-1">
                JavaScript
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-0">
            {/* TypeScript */}
            <TabsContent value="typescript" className="mt-0 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Full TypeScript implementation with types
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyCode(typescriptCode, 'typescript')}
                  >
                    {copiedLanguage === 'typescript' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadCode(typescriptCode, 'summarizer.ts')
                    }
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>

              <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs overflow-x-auto">
                <code>{typescriptCode}</code>
              </pre>
            </TabsContent>

            {/* JavaScript */}
            <TabsContent value="javascript" className="mt-0 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Plain JavaScript implementation
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyCode(javascriptCode, 'javascript')}
                  >
                    {copiedLanguage === 'javascript' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadCode(javascriptCode, 'summarizer.js')
                    }
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>

              <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs overflow-x-auto">
                <code>{javascriptCode}</code>
              </pre>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Usage Notes */}
      <Alert>
        <AlertDescription className="space-y-2 text-xs">
          <div className="font-medium text-slate-700">Integration Notes:</div>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>Requires Chrome 138+ with Chrome AI Summarizer API enabled</li>
            <li>Check availability before using the API</li>
            <li>Always clean up summarizer instances with destroy()</li>
            <li>
              Handle model download if availability is
              &lsquo;after-download&rsquo;
            </li>
            <li>Consider using streaming for better UX with long content</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default CodeTab;
