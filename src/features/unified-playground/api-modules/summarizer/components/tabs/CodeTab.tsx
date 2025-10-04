/**
 * CodeTab Component
 *
 * Code generation and export for Chrome AI Summarizer
 * Generates implementation code based on current configuration
 *
 * @module CodeTab
 */

import { useMemo } from 'react';
import { Code } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemedCodeBlock } from '@/components/code/ThemedCodeBlock';
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

  return `/**
 * Chrome AI Summarizer - Complete TypeScript Implementation
 *
 * Requirements:
 * - Chrome 138+ with Summarizer API enabled
 * - Enable chrome://flags#summarization-api-for-gemini-nano
 *
 * This is a complete, self-contained implementation.
 * Copy this entire file to use in your project.
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface Summarizer {
  summarize(text: string): Promise<string>;
  summarizeStreaming?(text: string): ReadableStream<string>;
  destroy(): void;
}

interface SummarizerCreateOptions {
  type?: 'tldr' | 'key-points' | 'teaser' | 'headline';
  format?: 'plain-text' | 'markdown';
  length?: 'short' | 'medium' | 'long';
  sharedContext?: string;
}

interface SummarizerAPI {
  create(options?: SummarizerCreateOptions): Promise<Summarizer>;
  availability(): Promise<'readily' | 'after-download' | 'no'>;
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
  if (!('Summarizer' in window)) {
    throw new Error(
      'Chrome AI Summarizer not supported. ' +
      'Requires Chrome 138+ with chrome://flags#summarization-api-for-gemini-nano enabled.'
    );
  }

  const availability = await window.Summarizer.availability();

  if (availability === 'no') {
    throw new Error('Chrome AI not available on this device');
  }

  if (availability === 'after-download') {
    console.log('Model download required - this may take a few minutes');
    // Model will download automatically on first create() call
  }

  return availability === 'readily';
}

/**
 * Create a new summarizer instance
 * Note: Requires user activation (must be called from user interaction like button click)
 */
async function createSummarizer(): Promise<Summarizer> {
  const summarizer = await window.Summarizer.create(config);
  return summarizer;
}

/**
 * Summarize text (non-streaming)
 */
async function summarize(text: string): Promise<string> {
  await checkAvailability();
  const summarizer = await createSummarizer();

  try {
    const summary = await summarizer.summarize(text);
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
  onChunk: (chunk: string) => void
): Promise<string> {
  await checkAvailability();
  const summarizer = await createSummarizer();

  try {
    if (!summarizer.summarizeStreaming) {
      throw new Error('Streaming not supported in this version');
    }

    const stream = summarizer.summarizeStreaming(text);
    const reader = stream.getReader();
    let fullSummary = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      fullSummary = value;
      onChunk(value);
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

// ============================================================================
// Run Examples (uncomment to test)
// ============================================================================

// exampleBasic();
// exampleStreaming();
// setupHTMLIntegration();

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
      ...(config.sharedContext && { sharedContext: config.sharedContext }),
    },
    null,
    2,
  );

  return `/**
 * Chrome AI Summarizer - Complete JavaScript Implementation
 *
 * Requirements:
 * - Chrome 138+ with Summarizer API enabled
 * - Enable chrome://flags#summarization-api-for-gemini-nano
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
  if (!('Summarizer' in window)) {
    throw new Error(
      'Chrome AI Summarizer not supported. ' +
      'Requires Chrome 138+ with chrome://flags#summarization-api-for-gemini-nano enabled.'
    );
  }

  const availability = await window.Summarizer.availability();

  if (availability === 'no') {
    throw new Error('Chrome AI not available on this device');
  }

  if (availability === 'after-download') {
    console.log('Model download required - this may take a few minutes');
    // Model will download automatically on first create() call
  }

  return availability === 'readily';
}

/**
 * Create a new summarizer instance
 * Note: Requires user activation (must be called from user interaction like button click)
 */
async function createSummarizer() {
  const summarizer = await window.Summarizer.create(config);
  return summarizer;
}

/**
 * Summarize text (non-streaming)
 */
async function summarize(text) {
  await checkAvailability();
  const summarizer = await createSummarizer();

  try {
    const summary = await summarizer.summarize(text);
    return summary;
  } finally {
    summarizer.destroy();
  }
}

/**
 * Summarize text with streaming (for real-time results)
 */
async function summarizeStreaming(text, onChunk) {
  await checkAvailability();
  const summarizer = await createSummarizer();

  try {
    if (!summarizer.summarizeStreaming) {
      throw new Error('Streaming not supported in this version');
    }

    const stream = summarizer.summarizeStreaming(text);
    const reader = stream.getReader();
    let fullSummary = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      fullSummary = value;
      onChunk(value);
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

// ============================================================================
// Run Examples (uncomment to test)
// ============================================================================

// exampleBasic();
// exampleStreaming();
// setupHTMLIntegration();

export { summarize, summarizeStreaming, checkAvailability };`;
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
  // Generated code
  const typescriptCode = useMemo(
    () => generateTypeScriptCode(config),
    [config],
  );
  const javascriptCode = useMemo(
    () => generateJavaScriptCode(config),
    [config],
  );

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
              <div className="text-sm text-slate-600">
                Full TypeScript implementation with types
              </div>

              <ThemedCodeBlock
                code={typescriptCode}
                language="typescript"
                filename="summarizer.ts"
                showCopyButton
                showDownloadButton
                showThemeToggle
                showLanguageBadge={false}
              />
            </TabsContent>

            {/* JavaScript */}
            <TabsContent value="javascript" className="mt-0 space-y-4">
              <div className="text-sm text-slate-600">
                Plain JavaScript implementation
              </div>

              <ThemedCodeBlock
                code={javascriptCode}
                language="javascript"
                filename="summarizer.js"
                showCopyButton
                showDownloadButton
                showThemeToggle
                showLanguageBadge={false}
              />
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
