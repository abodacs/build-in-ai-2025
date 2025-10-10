/**
 * CodeModal Component - Writer API
 *
 * Modal dialog for viewing and copying generated Writer API implementation code.
 * Provides TypeScript and JavaScript code examples based on current configuration.
 *
 * @module writer/components/CodeModal
 */

import { useState, useMemo } from 'react';
import { Code, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { WriterConfig } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface CodeModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Current Writer configuration */
  config: WriterConfig;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Code Generation Functions
// ============================================================================

/**
 * Generate TypeScript implementation code
 */
function generateTypeScriptCode(config: WriterConfig): string {
  const configStr = JSON.stringify(
    {
      tone: config.tone || 'neutral',
      format: config.format || 'plain-text',
      length: config.length || 'medium',
      outputLanguage: config.outputLanguage || 'en',
      ...(config.sharedContext && { sharedContext: config.sharedContext }),
    },
    null,
    2,
  );

  return `/**
 * Chrome Built-in AI - Writer API Implementation
 *
 * Requirements:
 * - Chrome 137+ with Writer API enabled
 * - Enable chrome://flags#writer-api-for-gemini-nano
 *
 * This is a complete, self-contained implementation.
 * Copy this entire file to use in your project.
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface Writer {
  write(prompt: string): Promise<string>;
  writeStreaming?(prompt: string): ReadableStream<string>;
  destroy(): void;
}

interface WriterCreateOptions {
  tone?: 'formal' | 'neutral' | 'casual';
  format?: 'plain-text' | 'markdown';
  length?: 'short' | 'medium' | 'long';
  outputLanguage?: 'en' | 'es' | 'ja';
  sharedContext?: string;
}

interface WriterAPI {
  create(options?: WriterCreateOptions): Promise<Writer>;
  availability(): Promise<'readily' | 'after-download' | 'no'>;
}

declare global {
  interface Window {
    Writer: WriterAPI;
  }
  const Writer: WriterAPI;
}

// ============================================================================
// Configuration
// ============================================================================

const config: WriterCreateOptions = ${configStr};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Check if Chrome AI Writer is available
 */
async function checkAvailability(): Promise<boolean> {
  if (!('Writer' in window)) {
    throw new Error(
      'Chrome AI Writer not supported. ' +
      'Requires Chrome 137+ with chrome://flags#writer-api-for-gemini-nano enabled.'
    );
  }

  const availability = await window.Writer.availability();

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
 * Create a new writer instance
 * Note: Requires user activation (must be called from user interaction like button click)
 */
async function createWriter(): Promise<Writer> {
  const writer = await window.Writer.create(config);
  return writer;
}

/**
 * Generate content (non-streaming)
 */
async function write(prompt: string): Promise<string> {
  await checkAvailability();
  const writer = await createWriter();

  try {
    const content = await writer.write(prompt);
    return content;
  } finally {
    writer.destroy();
  }
}

/**
 * Generate content with streaming (for real-time results)
 */
async function writeStreaming(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  await checkAvailability();
  const writer = await createWriter();

  try {
    if (!writer.writeStreaming) {
      throw new Error('Streaming not supported in this version');
    }

    const stream = writer.writeStreaming(prompt);
    const reader = stream.getReader();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      fullContent = value;
      onChunk(value);
    }

    return fullContent;
  } finally {
    writer.destroy();
  }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Basic content generation
 */
async function exampleBasic() {
  const prompt = 'Write a brief introduction to artificial intelligence';

  try {
    const content = await write(prompt);
    console.log('Generated content:', content);
  } catch (error) {
    console.error('Content generation failed:', error);
  }
}

/**
 * Example 2: Streaming content generation with real-time updates
 */
async function exampleStreaming() {
  const prompt = 'Write a detailed guide about machine learning';

  try {
    const content = await writeStreaming(prompt, (chunk) => {
      console.log('Streaming chunk:', chunk);
      // Update UI with partial results in real-time
    });
    console.log('Final content:', content);
  } catch (error) {
    console.error('Streaming failed:', error);
  }
}

/**
 * Example 3: HTML Integration (Button click handler)
 */
function setupHTMLIntegration() {
  const button = document.getElementById('generate-btn');
  const input = document.getElementById('prompt-input') as HTMLTextAreaElement;
  const output = document.getElementById('content-output');

  button?.addEventListener('click', async () => {
    if (!input || !output) return;

    try {
      output.textContent = 'Generating...';
      const content = await write(input.value);
      output.textContent = content;
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

export { write, writeStreaming, checkAvailability };`;
}

/**
 * Generate JavaScript implementation code
 */
function generateJavaScriptCode(config: WriterConfig): string {
  const configStr = JSON.stringify(
    {
      tone: config.tone || 'neutral',
      format: config.format || 'plain-text',
      length: config.length || 'medium',
      outputLanguage: config.outputLanguage || 'en',
      ...(config.sharedContext && { sharedContext: config.sharedContext }),
    },
    null,
    2,
  );

  return `/**
 * Chrome Built-in AI - Writer API Implementation
 *
 * Requirements:
 * - Chrome 137+ with Writer API enabled
 * - Enable chrome://flags#writer-api-for-gemini-nano
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
 * Check if Chrome AI Writer is available
 */
async function checkAvailability() {
  if (!('Writer' in window)) {
    throw new Error(
      'Chrome AI Writer not supported. ' +
      'Requires Chrome 137+ with chrome://flags#writer-api-for-gemini-nano enabled.'
    );
  }

  const availability = await window.Writer.availability();

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
 * Create a new writer instance
 * Note: Requires user activation (must be called from user interaction like button click)
 */
async function createWriter() {
  const writer = await window.Writer.create(config);
  return writer;
}

/**
 * Generate content (non-streaming)
 */
async function write(prompt) {
  await checkAvailability();
  const writer = await createWriter();

  try {
    const content = await writer.write(prompt);
    return content;
  } finally {
    writer.destroy();
  }
}

/**
 * Generate content with streaming (for real-time results)
 */
async function writeStreaming(prompt, onChunk) {
  await checkAvailability();
  const writer = await createWriter();

  try {
    if (!writer.writeStreaming) {
      throw new Error('Streaming not supported in this version');
    }

    const stream = writer.writeStreaming(prompt);
    const reader = stream.getReader();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      fullContent = value;
      onChunk(value);
    }

    return fullContent;
  } finally {
    writer.destroy();
  }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Basic content generation
 */
async function exampleBasic() {
  const prompt = 'Write a brief introduction to artificial intelligence';

  try {
    const content = await write(prompt);
    console.log('Generated content:', content);
  } catch (error) {
    console.error('Content generation failed:', error);
  }
}

/**
 * Example 2: Streaming content generation with real-time updates
 */
async function exampleStreaming() {
  const prompt = 'Write a detailed guide about machine learning';

  try {
    const content = await writeStreaming(prompt, (chunk) => {
      console.log('Streaming chunk:', chunk);
      // Update UI with partial results in real-time
    });
    console.log('Final content:', content);
  } catch (error) {
    console.error('Streaming failed:', error);
  }
}

/**
 * Example 3: HTML Integration (Button click handler)
 */
function setupHTMLIntegration() {
  const button = document.getElementById('generate-btn');
  const input = document.getElementById('prompt-input');
  const output = document.getElementById('content-output');

  button?.addEventListener('click', async () => {
    if (!input || !output) return;

    try {
      output.textContent = 'Generating...';
      const content = await write(input.value);
      output.textContent = content;
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

export { write, writeStreaming, checkAvailability };`;
}

// ============================================================================
// CodeModal Component
// ============================================================================

/**
 * Code generation and export modal for Writer API
 *
 * @example
 * ```tsx
 * <CodeModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   config={writerConfig}
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'w-[calc(100vw-2rem)] sm:w-[95vw] max-w-4xl xl:max-w-[1400px] h-[85vh] sm:h-[90vh] max-h-[90vh] p-0 gap-0 flex flex-col',
          className,
        )}
      >
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-green-600" />
            <DialogTitle>Generated Code - Writer API</DialogTitle>
          </div>
          <DialogDescription>
            Implementation code based on your current configuration. Copy or
            download to integrate into your project.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
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
                      <strong>Chrome 137+</strong> with Writer API enabled
                    </li>
                    <li>
                      Enable flag:{' '}
                      <code>chrome://flags#writer-api-for-gemini-nano</code>
                    </li>
                    <li>Check availability before using the API</li>
                    <li>
                      <strong>User activation required</strong>: Call from user
                      interactions (button clicks, etc.)
                    </li>
                    <li>
                      Always clean up instances with <code>destroy()</code>
                    </li>
                    <li>
                      Handle model download if availability is
                      &lsquo;after-download&rsquo;
                    </li>
                    <li>
                      Consider using streaming for better UX with long content
                    </li>
                  </ul>
                </CollapsibleContent>
              </AlertDescription>
            </Alert>
          </Collapsible>

          {/* Configuration Display */}
          <Alert className="bg-slate-50 dark:bg-slate-900">
            <AlertDescription className="space-y-2">
              <div className="text-sm font-medium">Current Configuration:</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Tone: {config.tone || 'neutral'}
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
          <Tabs defaultValue="typescript" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="typescript">TypeScript</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            </TabsList>

            {/* TypeScript */}
            <TabsContent value="typescript" className="mt-4 space-y-3">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Full TypeScript implementation with types and examples
              </div>

              <ThemedCodeBlock
                code={typescriptCode}
                language="typescript"
                filename="writer.ts"
                showCopyButton
                showDownloadButton
                showThemeToggle
                showLanguageBadge={false}
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
                filename="writer.js"
                showCopyButton
                showDownloadButton
                showThemeToggle
                showLanguageBadge={false}
              />
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
