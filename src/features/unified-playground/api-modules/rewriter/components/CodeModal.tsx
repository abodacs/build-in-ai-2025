/**
 * CodeModal Component - Rewriter API
 *
 * Modal dialog for viewing and copying generated Rewriter API implementation code.
 * Provides TypeScript and JavaScript code examples based on current configuration.
 *
 * @module rewriter/components/CodeModal
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
import type { RewriterConfig } from '../types';
import { generateRewriterAPITests } from '@/utils/codeGeneration/testGenerator';

// ============================================================================
// Types
// ============================================================================

export interface CodeModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Current Rewriter configuration */
  config: RewriterConfig;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Code Generation Functions
// ============================================================================

/**
 * Generate TypeScript implementation code
 */
function generateTypeScriptCode(config: RewriterConfig): string {
  const configStr = JSON.stringify(
    {
      tone: config.tone || 'as-is',
      format: config.format || 'as-is',
      length: config.length || 'as-is',
      outputLanguage: config.outputLanguage || 'en',
      ...(config.sharedContext && { sharedContext: config.sharedContext }),
    },
    null,
    2,
  );

  return `/**
 * Chrome Built-in AI - Rewriter API Implementation
 *
 * Requirements:
 * - Chrome 137+ with Rewriter API enabled
 * - Enable chrome://flags#rewriter-api
 *
 * This is a complete, self-contained implementation.
 * Copy this entire file to use in your project.
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface Rewriter {
  rewrite(text: string): Promise<string>;
  rewriteStreaming?(text: string): ReadableStream<string>;
  destroy(): void;
}

interface RewriterCreateOptions {
  tone?: 'as-is' | 'more-formal' | 'more-casual';
  format?: 'as-is' | 'plain-text' | 'markdown';
  length?: 'as-is' | 'shorter' | 'longer';
  outputLanguage?: 'en' | 'es' | 'ja';
  sharedContext?: string;
}

interface RewriterAPI {
  create(options?: RewriterCreateOptions): Promise<Rewriter>;
  availability(): Promise<'available' | 'downloadable' | 'unavailable'>;
}

declare global {
  interface Window {
    Rewriter: RewriterAPI;
  }
  const Rewriter: RewriterAPI;
}

// ============================================================================
// Configuration
// ============================================================================

const config: RewriterCreateOptions = ${configStr};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Check if Chrome AI Rewriter is available
 */
async function checkAvailability(): Promise<boolean> {
  if (!('Rewriter' in window)) {
    throw new Error(
      'Chrome AI Rewriter not supported. ' +
      'Requires Chrome 137+ with chrome://flags#rewriter-api-for-gemini-nano enabled.'
    );
  }

  const availability = await self.Rewriter.availability();

  if (availability === 'unavailable') {
    throw new Error('Chrome AI not available on this device');
  }

  if (availability === 'downloadable') {
    console.log('Model download required - this may take a few minutes');
    // Model will download automatically on first create() call
  }

  return availability === 'available';
}

/**
 * Create a new rewriter instance
 * Note: Requires user activation (must be called from user interaction like button click)
 */
async function createRewriter(): Promise<Rewriter> {
  const rewriter = await self.Rewriter.create(config);
  return rewriter;
}

/**
 * Rewrite text (non-streaming)
 */
async function rewrite(text: string): Promise<string> {
  await checkAvailability();
  const rewriter = await createRewriter();

  try {
    const rewritten = await rewriter.rewrite(text);
    return rewritten;
  } finally {
    rewriter.destroy();
  }
}

/**
 * Rewrite text with streaming (for real-time results)
 */
async function rewriteStreaming(
  text: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  await checkAvailability();
  const rewriter = await createRewriter();

  try {
    if (!rewriter.rewriteStreaming) {
      throw new Error('Streaming not supported in this version');
    }

    const stream = rewriter.rewriteStreaming(text);
    const reader = stream.getReader();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      fullText = value;
      onChunk(value);
    }

    return fullText;
  } finally {
    rewriter.destroy();
  }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Basic text rewriting
 */
async function exampleBasic() {
  const originalText = \`
    Hey there! Just wanted to let you know that the meeting got moved to
    tomorrow at 3pm. Hope that works for you!
  \`;

  try {
    const rewritten = await rewrite(originalText);
    console.log('Original:', originalText);
    console.log('Rewritten:', rewritten);
  } catch (error) {
    console.error('Rewriting failed:', error);
  }
}

/**
 * Example 2: Streaming rewriting with real-time updates
 */
async function exampleStreaming() {
  const originalText = \`Your text to be rewritten here...\`;

  try {
    const rewritten = await rewriteStreaming(originalText, (chunk) => {
      console.log('Streaming chunk:', chunk);
      // Update UI with partial results in real-time
    });
    console.log('Final rewritten text:', rewritten);
  } catch (error) {
    console.error('Streaming failed:', error);
  }
}

/**
 * Example 3: HTML Integration (Button click handler)
 */
function setupHTMLIntegration() {
  const button = document.getElementById('rewrite-btn');
  const input = document.getElementById('text-input') as HTMLTextAreaElement;
  const output = document.getElementById('rewritten-output');

  button?.addEventListener('click', async () => {
    if (!input || !output) return;

    try {
      output.textContent = 'Rewriting...';
      const rewritten = await rewrite(input.value);
      output.textContent = rewritten;
    } catch (error) {
      output.textContent = \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`;
    }
  });
}

/**
 * Example 4: Batch rewriting multiple texts
 */
async function exampleBatch() {
  const texts = [
    'Hey, can you send me that file?',
    'Thanks a bunch for your help!',
    'Let me know if you have any questions.'
  ];

  try {
    const results = await Promise.all(
      texts.map(async (text) => {
        const rewritten = await rewrite(text);
        return { original: text, rewritten };
      })
    );

    console.log('Batch rewriting results:', results);
  } catch (error) {
    console.error('Batch rewriting failed:', error);
  }
}

// ============================================================================
// Run Examples (uncomment to test)
// ============================================================================

// exampleBasic();
// exampleStreaming();
// setupHTMLIntegration();
// exampleBatch();

export { rewrite, rewriteStreaming, checkAvailability };`;
}

/**
 * Generate JavaScript implementation code
 */
function generateJavaScriptCode(config: RewriterConfig): string {
  const configStr = JSON.stringify(
    {
      tone: config.tone || 'as-is',
      format: config.format || 'as-is',
      length: config.length || 'as-is',
      outputLanguage: config.outputLanguage || 'en',
      ...(config.sharedContext && { sharedContext: config.sharedContext }),
    },
    null,
    2,
  );

  return `/**
 * Chrome Built-in AI - Rewriter API Implementation
 *
 * Requirements:
 * - Chrome 137+ with Rewriter API enabled
 * - Enable chrome://flags#rewriter-api
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
 * Check if Chrome AI Rewriter is available
 */
async function checkAvailability() {
  if (!('Rewriter' in window)) {
    throw new Error(
      'Chrome AI Rewriter not supported. ' +
      'Requires Chrome 137+ with chrome://flags#rewriter-api-for-gemini-nano enabled.'
    );
  }

  const availability = await self.Rewriter.availability();

  if (availability === 'unavailable') {
    throw new Error('Chrome AI not available on this device');
  }

  if (availability === 'downloadable') {
    console.log('Model download required - this may take a few minutes');
    // Model will download automatically on first create() call
  }

  return availability === 'available';
}

/**
 * Create a new rewriter instance
 * Note: Requires user activation (must be called from user interaction like button click)
 */
async function createRewriter() {
  const rewriter = await self.Rewriter.create(config);
  return rewriter;
}

/**
 * Rewrite text (non-streaming)
 */
async function rewrite(text) {
  await checkAvailability();
  const rewriter = await createRewriter();

  try {
    const rewritten = await rewriter.rewrite(text);
    return rewritten;
  } finally {
    rewriter.destroy();
  }
}

/**
 * Rewrite text with streaming (for real-time results)
 */
async function rewriteStreaming(text, onChunk) {
  await checkAvailability();
  const rewriter = await createRewriter();

  try {
    if (!rewriter.rewriteStreaming) {
      throw new Error('Streaming not supported in this version');
    }

    const stream = rewriter.rewriteStreaming(text);
    const reader = stream.getReader();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      fullText = value;
      onChunk(value);
    }

    return fullText;
  } finally {
    rewriter.destroy();
  }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Basic text rewriting
 */
async function exampleBasic() {
  const originalText = \`
    Hey there! Just wanted to let you know that the meeting got moved to
    tomorrow at 3pm. Hope that works for you!
  \`;

  try {
    const rewritten = await rewrite(originalText);
    console.log('Original:', originalText);
    console.log('Rewritten:', rewritten);
  } catch (error) {
    console.error('Rewriting failed:', error);
  }
}

/**
 * Example 2: Streaming rewriting with real-time updates
 */
async function exampleStreaming() {
  const originalText = \`Your text to be rewritten here...\`;

  try {
    const rewritten = await rewriteStreaming(originalText, (chunk) => {
      console.log('Streaming chunk:', chunk);
      // Update UI with partial results in real-time
    });
    console.log('Final rewritten text:', rewritten);
  } catch (error) {
    console.error('Streaming failed:', error);
  }
}

/**
 * Example 3: HTML Integration (Button click handler)
 */
function setupHTMLIntegration() {
  const button = document.getElementById('rewrite-btn');
  const input = document.getElementById('text-input');
  const output = document.getElementById('rewritten-output');

  button?.addEventListener('click', async () => {
    if (!input || !output) return;

    try {
      output.textContent = 'Rewriting...';
      const rewritten = await rewrite(input.value);
      output.textContent = rewritten;
    } catch (error) {
      output.textContent = \`Error: \${error.message || 'Unknown error'}\`;
    }
  });
}

/**
 * Example 4: Batch rewriting multiple texts
 */
async function exampleBatch() {
  const texts = [
    'Hey, can you send me that file?',
    'Thanks a bunch for your help!',
    'Let me know if you have any questions.'
  ];

  try {
    const results = await Promise.all(
      texts.map(async (text) => {
        const rewritten = await rewrite(text);
        return { original: text, rewritten };
      })
    );

    console.log('Batch rewriting results:', results);
  } catch (error) {
    console.error('Batch rewriting failed:', error);
  }
}

// ============================================================================
// Run Examples (uncomment to test)
// ============================================================================

// exampleBasic();
// exampleStreaming();
// setupHTMLIntegration();
// exampleBatch();

export { rewrite, rewriteStreaming, checkAvailability };`;
}

// ============================================================================
// CodeModal Component
// ============================================================================

/**
 * Code generation and export modal for Rewriter API
 *
 * @example
 * ```tsx
 * <CodeModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   config={rewriterConfig}
 * />
 * ```
 */
export function CodeModal({
  isOpen,
  onClose,
  config,
  className,
}: CodeModalProps) {
  const [requirementsOpen, setRequirementsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate code with loading simulation and error handling
  const generateCode = () => {
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      try {
        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Code generation failed. Please try again.',
        );
        setIsLoading(false);
      }
    }, 200);

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
  const testsCode = useMemo(() => generateRewriterAPITests(config), [config]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent
        className={cn(
          'w-[calc(100vw-1rem)] min-[375px]:w-[calc(100vw-2rem)] sm:w-[95vw]',
          'max-w-4xl xl:max-w-[1400px]',
          'h-[85vh] sm:h-[90vh] max-h-[90vh]',
          'p-0 gap-0 flex flex-col overflow-hidden',
          className,
        )}
      >
        <DialogHeader className="px-4 min-[375px]:px-6 pt-4 min-[375px]:pt-6 pb-3 min-[375px]:pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 min-[375px]:w-5 min-[375px]:h-5 text-green-600" />
            <DialogTitle className="text-base min-[375px]:text-lg">
              Generated Code - Rewriter API
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
                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription>
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Requirements & Setup
                      </span>
                      {requirementsOpen ? (
                        <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2 text-xs text-amber-800 dark:text-amber-200">
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          <strong>Chrome 137+</strong> with Rewriter API enabled
                        </li>
                        <li>
                          Enable flag:{' '}
                          <code>
                            chrome://flags#rewriter-api-for-gemini-nano
                          </code>
                        </li>
                        <li>Check availability before using the API</li>
                        <li>
                          <strong>User activation required</strong>: Call from
                          user interactions (button clicks, etc.)
                        </li>
                        <li>
                          Always clean up instances with <code>destroy()</code>
                        </li>
                        <li>
                          Handle model download if availability is
                          &lsquo;after-download&rsquo;
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
              <Alert className="bg-slate-50 dark:bg-slate-900">
                <AlertDescription className="space-y-2">
                  <div className="text-sm font-medium">
                    Current Configuration:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      Tone: {config.tone || 'as-is'}
                    </Badge>
                    <Badge variant="secondary">
                      Format: {config.format || 'as-is'}
                    </Badge>
                    <Badge variant="secondary">
                      Length: {config.length || 'as-is'}
                    </Badge>
                    {config.sharedContext && (
                      <Badge variant="secondary">Shared Context: Yes</Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Code Tabs */}
              <Tabs defaultValue="javascript" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="tests">Tests</TabsTrigger>
                </TabsList>

                {/* TypeScript */}
                <TabsContent value="typescript" className="mt-4 space-y-3">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Full TypeScript implementation with types and examples
                  </div>

                  <ThemedCodeBlock
                    code={typescriptCode}
                    language="typescript"
                    filename="rewriter.ts"
                    showCopyButton
                    showDownloadButton
                    showThemeToggle={false}
                    showLanguageBadge={false}
                    forceTheme="dark"
                  />
                </TabsContent>

                {/* JavaScript */}
                <TabsContent value="javascript" className="mt-4 space-y-3">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Plain JavaScript implementation with examples
                  </div>

                  <ThemedCodeBlock
                    code={javascriptCode}
                    language="javascript"
                    filename="rewriter.js"
                    showCopyButton
                    showDownloadButton
                    showThemeToggle={false}
                    showLanguageBadge={false}
                    forceTheme="dark"
                  />
                </TabsContent>

                {/* Tests */}
                <TabsContent value="tests" className="mt-4 space-y-3">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Concise Vitest test suite with type validation
                  </div>

                  <ThemedCodeBlock
                    code={testsCode}
                    language="typescript"
                    filename="rewriter-api.test.ts"
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
