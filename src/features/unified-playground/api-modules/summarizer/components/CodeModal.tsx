/**
 * CodeModal Component
 *
 * Modal dialog for viewing and copying generated code
 * Overlays the playground interface for easy access
 *
 * @module CodeModal
 */

import { useState, useMemo } from 'react';
import { Code, Copy, CheckCircle2, Download, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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

  // Check for user activation (required for model creation/download)
  if (navigator.userActivation && !navigator.userActivation.isActive) {
    throw new Error('Model creation requires user interaction (e.g., button click)');
  }

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
      outputLanguage: config.outputLanguage || 'en',
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

  // Check for user activation (required for model creation/download)
  if (navigator.userActivation && !navigator.userActivation.isActive) {
    throw new Error('Model creation requires user interaction (e.g., button click)');
  }

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
  config = {},
  className,
}: CodeModalProps) {
  // State
  const [copiedLanguage, setCopiedLanguage] = useState<string | null>(null);
  const [requirementsOpen, setRequirementsOpen] = useState(true);

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        'w-[95vw] max-w-[90vw] xl:max-w-[1400px] h-[90vh] max-h-[90vh] p-0 gap-0 flex flex-col',
        className
      )}>
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-green-600" />
            <DialogTitle>Generated Code</DialogTitle>
          </div>
          <DialogDescription>
            Implementation code based on your current configuration. Copy or
            download to integrate into your project.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Requirements & Setup - Collapsible */}
          <Collapsible open={requirementsOpen} onOpenChange={setRequirementsOpen} className="mb-4">
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
                    <li><strong>Chrome 138+</strong> with Chrome AI Summarizer API enabled</li>
                    <li>Enable flag: <code className="px-1 py-0.5 bg-amber-100 rounded text-[10px]">chrome://flags#summarization-api-for-gemini-nano</code></li>
                    <li>Check availability before using the API</li>
                    <li><strong>User activation required:</strong> Call <code className="px-1 py-0.5 bg-amber-100 rounded text-[10px]">Summarizer.create()</code> only from user interactions (button clicks)</li>
                    <li>Always clean up summarizer instances with <code className="px-1 py-0.5 bg-amber-100 rounded text-[10px]">destroy()</code></li>
                    <li>Handle model download if availability is <code className="px-1 py-0.5 bg-amber-100 rounded text-[10px]">'after-download'</code></li>
                    <li>Consider using streaming for better UX with long content</li>
                  </ul>
                </CollapsibleContent>
              </AlertDescription>
            </Alert>
          </Collapsible>

          {/* Configuration Display */}
          <Alert className="bg-slate-50 mb-4">
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
          <Tabs defaultValue="typescript" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="typescript">
                TypeScript
              </TabsTrigger>
              <TabsTrigger value="javascript">
                JavaScript
              </TabsTrigger>
            </TabsList>

            {/* TypeScript */}
            <TabsContent value="typescript" className="mt-0 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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

              <div className="rounded-lg bg-slate-900 p-4 overflow-hidden">
                <pre className="text-slate-100 text-[11px] leading-relaxed overflow-x-auto">
                  <code>{typescriptCode}</code>
                </pre>
              </div>
            </TabsContent>

            {/* JavaScript */}
            <TabsContent value="javascript" className="mt-0 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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

              <div className="rounded-lg bg-slate-900 p-4 overflow-hidden">
                <pre className="text-slate-100 text-[11px] leading-relaxed overflow-x-auto">
                  <code>{javascriptCode}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Export
// ============================================================================

export default CodeModal;
