/**
 * CodeModal Component - Proofreader API
 *
 * Modal dialog for viewing and copying generated Proofreader API implementation code.
 * Provides TypeScript and JavaScript code examples based on current configuration.
 *
 * @module proofreader/components/CodeModal
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
import type { ProofreaderConfig } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface CodeModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Current Proofreader configuration */
  config: ProofreaderConfig;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Code Generation Functions
// ============================================================================

/**
 * Generate TypeScript implementation code
 */
function generateTypeScriptCode(config: ProofreaderConfig): string {
  const configStr = JSON.stringify(
    {
      expectedInputLanguages: config.expectedInputLanguages || ['en'],
    },
    null,
    2,
  );

  return `/**
 * Chrome Built-in AI - Proofreader API Implementation
 *
 * Requirements:
 * - Chrome 141+ (Origin Trial until Chrome 145)
 * - Enable Origin Trial token
 * - CSS Custom Highlights API for highlighting
 *
 * This is a complete, self-contained implementation.
 * Copy this entire file to use in your project.
 */

// ============================================================================
// Type Definitions
// ============================================================================

type CorrectionType = 'grammar' | 'spelling' | 'punctuation' | 'style' | 'clarity';
type ProofreaderLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh';

interface ProofreadResult {
  type: CorrectionType;
  start: number;
  end: number;
  originalText: string;
  suggestion: string;
  explanation?: string;
}

interface Proofreader {
  proofread(input: string): Promise<ProofreadResult[]>;
  destroy(): void;
}

interface ProofreaderCreateOptions {
  expectedInputLanguages?: ProofreaderLanguage[];
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
}

interface ProofreaderAPI {
  create(options?: ProofreaderCreateOptions): Promise<Proofreader>;
  availability(): Promise<'available' | 'after-download' | 'no'>;
}

declare global {
  interface Window {
    Proofreader: ProofreaderAPI;
  }
  const Proofreader: ProofreaderAPI;
}

// ============================================================================
// Configuration
// ============================================================================

const config: ProofreaderCreateOptions = ${configStr};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Check if Chrome AI Proofreader is available
 */
async function checkAvailability(): Promise<boolean> {
  if (!('Proofreader' in window)) {
    throw new Error(
      'Chrome AI Proofreader not supported. ' +
      'Requires Chrome 141+ with Origin Trial enabled.'
    );
  }

  const availability = await window.Proofreader.availability();

  if (availability === 'no') {
    throw new Error('Proofreader not available on this device');
  }

  if (availability === 'after-download') {
    console.log('Model download required - this may take a few minutes');
    // Model will download automatically on first create() call
  }

  return availability === 'available';
}

/**
 * Create a new proofreader instance
 * Note: Requires user activation (must be called from user interaction)
 */
async function createProofreader(): Promise<Proofreader> {
  const proofreader = await window.Proofreader.create(config);
  return proofreader;
}

/**
 * Proofread text and get corrections
 */
async function proofread(text: string): Promise<ProofreadResult[]> {
  await checkAvailability();
  const proofreader = await createProofreader();

  try {
    const corrections = await proofreader.proofread(text);
    return corrections;
  } finally {
    proofreader.destroy();
  }
}

/**
 * Apply corrections to text
 */
function applyCorrections(
  text: string,
  corrections: ProofreadResult[]
): string {
  // Sort corrections by start position (descending) to apply from end to start
  const sortedCorrections = [...corrections].sort((a, b) => b.start - a.start);

  let result = text;
  for (const correction of sortedCorrections) {
    result =
      result.slice(0, correction.start) +
      correction.suggestion +
      result.slice(correction.end);
  }

  return result;
}

// ============================================================================
// Highlighting Functions (CSS Custom Highlights API)
// ============================================================================

/**
 * Create highlights for corrections using CSS Custom Highlights API
 */
function createHighlights(
  text: string,
  corrections: ProofreadResult[],
  containerElement: HTMLElement
): void {
  if (!CSS.highlights) {
    console.warn('CSS Custom Highlights API not supported');
    return;
  }

  // Clear existing highlights
  CSS.highlights.clear();

  corrections.forEach((correction, index) => {
    const range = new Range();
    const textNode = containerElement.firstChild as Text;

    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      range.setStart(textNode, correction.start);
      range.setEnd(textNode, correction.end);

      const highlight = new Highlight(range);
      CSS.highlights.set(\`correction-\${index}\`, highlight);
    }
  });
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Basic proofreading
 */
async function exampleBasic() {
  const text = 'This is an example sentance with some erors.';

  try {
    const corrections = await proofread(text);
    console.log('Corrections found:', corrections);
    // Output: [{ type: 'spelling', start: 20, end: 28, ... }]

    const correctedText = applyCorrections(text, corrections);
    console.log('Corrected text:', correctedText);
  } catch (error) {
    console.error('Proofreading failed:', error);
  }
}

/**
 * Example 2: With highlights
 */
async function exampleWithHighlights() {
  const textElement = document.getElementById('text-content') as HTMLElement;
  const text = textElement.textContent || '';

  try {
    const corrections = await proofread(text);
    createHighlights(text, corrections, textElement);
  } catch (error) {
    console.error('Proofreading failed:', error);
  }
}

/**
 * Example 3: HTML Integration
 */
function setupHTMLIntegration() {
  const input = document.getElementById('text-input') as HTMLTextAreaElement;
  const button = document.getElementById('proofread-btn');
  const output = document.getElementById('corrections-output');

  button?.addEventListener('click', async () => {
    if (!input || !output) return;

    try {
      output.textContent = 'Proofreading...';
      const corrections = await proofread(input.value);

      output.innerHTML = corrections
        .map(
          (c) =>
            \`<div class="correction">
              <strong>\${c.type}</strong>:
              "\${c.originalText}" → "\${c.suggestion}"
              \${c.explanation ? \`<br><em>\${c.explanation}</em>\` : ''}
            </div>\`
        )
        .join('');
    } catch (error) {
      output.textContent = \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`;
    }
  });
}

// ============================================================================
// Run Examples (uncomment to test)
// ============================================================================

// exampleBasic();
// exampleWithHighlights();
// setupHTMLIntegration();

export { proofread, applyCorrections, createHighlights, checkAvailability };`;
}

/**
 * Generate JavaScript implementation code
 */
function generateJavaScriptCode(config: ProofreaderConfig): string {
  const configStr = JSON.stringify(
    {
      expectedInputLanguages: config.expectedInputLanguages || ['en'],
    },
    null,
    2,
  );

  return `/**
 * Chrome Built-in AI - Proofreader API Implementation
 *
 * Requirements:
 * - Chrome 141+ (Origin Trial until Chrome 145)
 * - Enable Origin Trial token
 * - CSS Custom Highlights API for highlighting
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
 * Check if Chrome AI Proofreader is available
 */
async function checkAvailability() {
  if (!('Proofreader' in window)) {
    throw new Error(
      'Chrome AI Proofreader not supported. ' +
      'Requires Chrome 141+ with Origin Trial enabled.'
    );
  }

  const availability = await window.Proofreader.availability();

  if (availability === 'no') {
    throw new Error('Proofreader not available on this device');
  }

  if (availability === 'after-download') {
    console.log('Model download required - this may take a few minutes');
    // Model will download automatically on first create() call
  }

  return availability === 'available';
}

/**
 * Create a new proofreader instance
 * Note: Requires user activation (must be called from user interaction)
 */
async function createProofreader() {
  const proofreader = await window.Proofreader.create(config);
  return proofreader;
}

/**
 * Proofread text and get corrections
 */
async function proofread(text) {
  await checkAvailability();
  const proofreader = await createProofreader();

  try {
    const corrections = await proofreader.proofread(text);
    return corrections;
  } finally {
    proofreader.destroy();
  }
}

/**
 * Apply corrections to text
 */
function applyCorrections(text, corrections) {
  // Sort corrections by start position (descending) to apply from end to start
  const sortedCorrections = [...corrections].sort((a, b) => b.start - a.start);

  let result = text;
  for (const correction of sortedCorrections) {
    result =
      result.slice(0, correction.start) +
      correction.suggestion +
      result.slice(correction.end);
  }

  return result;
}

// ============================================================================
// Highlighting Functions (CSS Custom Highlights API)
// ============================================================================

/**
 * Create highlights for corrections using CSS Custom Highlights API
 */
function createHighlights(text, corrections, containerElement) {
  if (!CSS.highlights) {
    console.warn('CSS Custom Highlights API not supported');
    return;
  }

  // Clear existing highlights
  CSS.highlights.clear();

  corrections.forEach((correction, index) => {
    const range = new Range();
    const textNode = containerElement.firstChild;

    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      range.setStart(textNode, correction.start);
      range.setEnd(textNode, correction.end);

      const highlight = new Highlight(range);
      CSS.highlights.set(\`correction-\${index}\`, highlight);
    }
  });
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Basic proofreading
 */
async function exampleBasic() {
  const text = 'This is an example sentance with some erors.';

  try {
    const corrections = await proofread(text);
    console.log('Corrections found:', corrections);
    // Output: [{ type: 'spelling', start: 20, end: 28, ... }]

    const correctedText = applyCorrections(text, corrections);
    console.log('Corrected text:', correctedText);
  } catch (error) {
    console.error('Proofreading failed:', error);
  }
}

/**
 * Example 2: With highlights
 */
async function exampleWithHighlights() {
  const textElement = document.getElementById('text-content');
  const text = textElement.textContent || '';

  try {
    const corrections = await proofread(text);
    createHighlights(text, corrections, textElement);
  } catch (error) {
    console.error('Proofreading failed:', error);
  }
}

/**
 * Example 3: HTML Integration
 */
function setupHTMLIntegration() {
  const input = document.getElementById('text-input');
  const button = document.getElementById('proofread-btn');
  const output = document.getElementById('corrections-output');

  button?.addEventListener('click', async () => {
    if (!input || !output) return;

    try {
      output.textContent = 'Proofreading...';
      const corrections = await proofread(input.value);

      output.innerHTML = corrections
        .map(
          (c) =>
            \`<div class="correction">
              <strong>\${c.type}</strong>:
              "\${c.originalText}" → "\${c.suggestion}"
              \${c.explanation ? \`<br><em>\${c.explanation}</em>\` : ''}
            </div>\`
        )
        .join('');
    } catch (error) {
      output.textContent = \`Error: \${error.message || 'Unknown error'}\`;
    }
  });
}

// ============================================================================
// Run Examples (uncomment to test)
// ============================================================================

// exampleBasic();
// exampleWithHighlights();
// setupHTMLIntegration();

export { proofread, applyCorrections, createHighlights, checkAvailability };`;
}

// ============================================================================
// CodeModal Component
// ============================================================================

/**
 * Code generation and export modal for Proofreader API
 *
 * @example
 * ```tsx
 * <CodeModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   config={proofreaderConfig}
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'w-[calc(100vw-1rem)] min-[375px]:w-[calc(100vw-2rem)] sm:w-[95vw]',
          'max-w-4xl xl:max-w-[1400px]',
          'h-[85vh] sm:h-[90vh] max-h-[90vh]',
          'p-0 gap-0 flex flex-col overflow-hidden',
          className,
        )}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="px-4 min-[375px]:px-6 pt-4 min-[375px]:pt-6 pb-3 min-[375px]:pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 min-[375px]:w-5 min-[375px]:h-5 text-green-600" />
            <DialogTitle className="text-base min-[375px]:text-lg">
              Generated Code - Proofreader API
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
                          <strong>Chrome 141-145</strong> (Origin Trial)
                        </li>
                        <li>
                          Register for Origin Trial and add token to your site
                        </li>
                        <li>
                          Supports CSS Custom Highlights API for visual feedback
                        </li>
                        <li>
                          <strong>User activation required:</strong> Call from
                          user interactions
                        </li>
                        <li>
                          Always clean up instances with{' '}
                          <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded text-[10px]">
                            destroy()
                          </code>
                        </li>
                        <li>
                          Handle model download if availability is{' '}
                          <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded text-[10px]">
                            &apos;after-download&apos;
                          </code>
                        </li>
                        <li>
                          Apply corrections from end to start to maintain
                          positions
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
                      Languages:{' '}
                      {config.expectedInputLanguages?.join(', ') || 'en'}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Code Tabs */}
              <Tabs defaultValue="javascript" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                </TabsList>

                {/* TypeScript */}
                <TabsContent value="typescript" className="mt-4 space-y-3">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Full TypeScript implementation with types, highlighting, and
                    examples
                  </div>

                  <ThemedCodeBlock
                    code={typescriptCode}
                    language="typescript"
                    filename="proofreader.ts"
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
                    Plain JavaScript implementation with highlighting and
                    examples
                  </div>

                  <ThemedCodeBlock
                    code={javascriptCode}
                    language="javascript"
                    filename="proofreader.js"
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
