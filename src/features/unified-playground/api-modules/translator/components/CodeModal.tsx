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
import type { LanguageCode, AdvancedSettings } from '../types';
import { SUPPORTED_LANGUAGES } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface CodeModalProps {
  /** Modal open state */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Source language */
  sourceLanguage: LanguageCode;

  /** Target language */
  targetLanguage: LanguageCode;

  /** Optional context */
  context?: string;

  /** Advanced settings */
  advancedSettings: AdvancedSettings;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Code Generation Functions
// ============================================================================

/**
 * Generate TypeScript implementation code
 */
function generateTypeScriptCode(
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  context?: string,
  advancedSettings?: AdvancedSettings,
): string {
  const hasContext = context && context.trim().length > 0;
  const settings = advancedSettings || {
    streamingMode: 'auto',
    quality: 'standard',
    concurrency: 3,
    streamingThreshold: 100,
  };

  return `/**
 * Chrome Built-in AI - Translator API Implementation
 *
 * Translation: ${sourceLanguage.toUpperCase()} → ${targetLanguage.toUpperCase()}${hasContext ? `\n * Context: "${context}"` : ''}
 * Streaming Mode: ${settings.streamingMode}
 * Quality: ${settings.quality}
 *
 * Requirements:
 * - Chrome 138+ (Stable channel)
 * - Desktop only (not available on mobile devices)
 * - Internet connection for first-time model download
 *
 * This is a complete, self-contained implementation.
 * Copy this entire file to use in your project.
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface TranslatorCreateOptions {
  sourceLanguage: string;
  targetLanguage: string;
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
}

interface TranslateOptions {
  context?: string;
  signal?: AbortSignal;
}

interface Translator {
  translate(text: string, options?: TranslateOptions): Promise<string>;
  translateStreaming(
    text: string,
    options?: TranslateOptions
  ): AsyncIterable<string>;
  destroy(): void;
}

type AvailabilityStatus = 'available' | 'downloadable';

declare global {
  interface Window {
    Translator: {
      create(options: TranslatorCreateOptions): Promise<Translator>;
      availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<AvailabilityStatus>;
    };
  }
  const Translator: Window['Translator'];
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  sourceLanguage: '${sourceLanguage}',
  targetLanguage: '${targetLanguage}',${hasContext ? `\n  context: '${context}',` : ''}
  streamingMode: '${settings.streamingMode}' as const,
  quality: '${settings.quality}' as const,
  streamingThreshold: ${settings.streamingThreshold},
  concurrency: ${settings.concurrency},
} as const;

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Check if translation is available for the language pair
 */
async function checkAvailability(): Promise<AvailabilityStatus> {
  if (!('Translator' in self)) {
    throw new Error(
      'Translator API not supported. ' +
      'Requires Chrome 138+ (Stable) on desktop devices.'
    );
  }

  try {
    const status = await self.Translator.availability({
      sourceLanguage: CONFIG.sourceLanguage,
      targetLanguage: CONFIG.targetLanguage,
    });
    console.log(\`Translation availability: \${status}\`);
    return status;
  } catch (error) {
    console.error('Availability check failed:', error);
    throw error;
  }
}

/**
 * Create a translator instance
 * Note: Requires user activation (must be called from user interaction like button click)
 */
async function createTranslator(
  signal?: AbortSignal
): Promise<Translator | null> {
  try {
    const translator = await self.Translator.create({
      sourceLanguage: CONFIG.sourceLanguage,
      targetLanguage: CONFIG.targetLanguage,
      signal,
      monitor: (m) => {
        m.addEventListener('downloadprogress', (e: Event) => {
          const event = e as { loaded: number; total: number };
          const percent = ((event.loaded / event.total) * 100).toFixed(0);
          console.log(\`Downloading model: \${percent}%\`);
        });
      },
    });

    console.log('Translator created successfully');
    return translator;
  } catch (error) {
    console.error('Failed to create translator:', error);
    return null;
  }
}

/**
 * Translate text (non-streaming)
 */
async function translate(text: string): Promise<string | null> {
  const translator = await createTranslator();
  if (!translator) return null;

  try {
    const startTime = performance.now();
    const result = await translator.translate(text, {${hasContext ? `\n      context: CONFIG.context,` : ''}
    });

    const duration = performance.now() - startTime;
    console.log(\`Translation completed in \${duration.toFixed(0)}ms\`);

    return result;
  } catch (error) {
    console.error('Translation failed:', error);
    return null;
  } finally {
    translator.destroy();
  }
}

/**
 * Translate text with streaming (for real-time results)
 */
async function translateStreaming(
  text: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const translator = await createTranslator();
  if (!translator) return;

  try {
    const startTime = performance.now();

    const stream = translator.translateStreaming(text, {${hasContext ? `\n      context: CONFIG.context,` : ''}
    });

    for await (const chunk of stream) {
      onChunk(chunk);
    }

    const duration = performance.now() - startTime;
    console.log(\`Streaming translation completed in \${duration.toFixed(0)}ms\`);
  } catch (error) {
    console.error('Streaming translation failed:', error);
  } finally {
    translator.destroy();
  }
}

/**
 * Smart translation (auto-selects streaming based on text length)
 */
async function smartTranslate(
  text: string,
  onChunk?: (chunk: string) => void
): Promise<string | null> {
  const wordCount = text.trim().split(/\\s+/).length;

  // Determine streaming based on mode and threshold
  let useStreaming = false;
  if (CONFIG.streamingMode === 'always') {
    useStreaming = true;
  } else if (CONFIG.streamingMode === 'auto') {
    useStreaming = wordCount > CONFIG.streamingThreshold;
  }

  if (useStreaming && onChunk) {
    await translateStreaming(text, onChunk);
    return null; // Result provided via chunks
  } else {
    return await translate(text);
  }
}

// ============================================================================
// Batch Translation
// ============================================================================

interface BatchItem {
  id: string;
  text: string;
  context?: string;
}

interface BatchResult {
  id: string;
  original: string;
  translated: string;
  success: boolean;
  error?: string;
}

/**
 * Translate multiple items in parallel
 */
async function batchTranslate(
  items: BatchItem[],
  onProgress?: (completed: number, total: number) => void
): Promise<BatchResult[]> {
  const translator = await createTranslator();
  if (!translator) {
    return items.map(item => ({
      id: item.id,
      original: item.text,
      translated: '',
      success: false,
      error: 'Failed to create translator',
    }));
  }

  try {
    const results: BatchResult[] = [];
    const concurrency = CONFIG.concurrency;

    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      const promises = batch.map(async (item) => {
        try {
          const translated = await translator.translate(item.text, {
            context: item.context,
          });
          return {
            id: item.id,
            original: item.text,
            translated,
            success: true,
          };
        } catch (error) {
          return {
            id: item.id,
            original: item.text,
            translated: '',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      if (onProgress) {
        onProgress(results.length, items.length);
      }
    }

    return results;
  } finally {
    translator.destroy();
  }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Basic translation
 */
async function exampleBasic() {
  const text = 'Hello, world!';

  try {
    const result = await translate(text);
    console.log('Translation:', result);
  } catch (error) {
    console.error('Translation failed:', error);
  }
}

/**
 * Example 2: Streaming translation with real-time updates
 */
async function exampleStreaming() {
  const text = 'This is a longer text that will be translated using streaming for real-time results.';

  try {
    await translateStreaming(text, (chunk) => {
      console.log('Streaming chunk:', chunk);
      // Update UI with partial results in real-time
    });
  } catch (error) {
    console.error('Streaming failed:', error);
  }
}

/**
 * Example 3: Smart translation (auto-detects streaming need)
 */
async function exampleSmart() {
  const text = 'Another text to translate';

  try {
    const result = await smartTranslate(text, (chunk) => {
      console.log('Smart chunk:', chunk);
    });
    console.log('Smart result:', result);
  } catch (error) {
    console.error('Smart translation failed:', error);
  }
}

/**
 * Example 4: Batch translation with progress tracking
 */
async function exampleBatch() {
  const items: BatchItem[] = [
    { id: '1', text: 'First sentence' },
    { id: '2', text: 'Second sentence' },
    { id: '3', text: 'Third sentence' },
  ];

  try {
    const results = await batchTranslate(items, (completed, total) => {
      console.log(\`Progress: \${completed}/\${total}\`);
    });

    console.log('Batch results:', results);
  } catch (error) {
    console.error('Batch translation failed:', error);
  }
}

/**
 * Example 5: HTML Integration (Button click handler)
 */
function setupHTMLIntegration() {
  const button = document.getElementById('translate-btn');
  const input = document.getElementById('text-input') as HTMLTextAreaElement;
  const output = document.getElementById('translation-output');

  button?.addEventListener('click', async () => {
    if (!input || !output) return;

    try {
      output.textContent = 'Translating...';
      const result = await translate(input.value);
      output.textContent = result || 'Translation failed';
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
// exampleSmart();
// exampleBatch();
// setupHTMLIntegration();

export { translate, translateStreaming, smartTranslate, batchTranslate, checkAvailability };`;
}

/**
 * Generate JavaScript implementation code
 */
function generateJavaScriptCode(
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  context?: string,
  advancedSettings?: AdvancedSettings,
): string {
  const hasContext = context && context.trim().length > 0;
  const settings = advancedSettings || {
    streamingMode: 'auto',
    quality: 'standard',
    concurrency: 3,
    streamingThreshold: 100,
  };

  return `/**
 * Chrome Built-in AI - Translator API Implementation
 *
 * Translation: ${sourceLanguage.toUpperCase()} → ${targetLanguage.toUpperCase()}${hasContext ? `\n * Context: "${context}"` : ''}
 * Streaming Mode: ${settings.streamingMode}
 * Quality: ${settings.quality}
 *
 * Requirements:
 * - Chrome 138+ with Translator API enabled
 * - Enable chrome://flags#translation-api
 *
 * This is a complete, self-contained implementation.
 * Copy this entire file to use in your project.
 */

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  sourceLanguage: '${sourceLanguage}',
  targetLanguage: '${targetLanguage}',${hasContext ? `\n  context: '${context}',` : ''}
  streamingMode: '${settings.streamingMode}',
  quality: '${settings.quality}',
  streamingThreshold: ${settings.streamingThreshold},
  concurrency: ${settings.concurrency},
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Check if translation is available for the language pair
 */
async function checkAvailability() {
  if (!('Translator' in window)) {
    throw new Error(
      'Translator API not supported. ' +
      'Requires Chrome 138+ with chrome://flags#translation-api enabled.'
    );
  }

  try {
    const status = await Translator.availability({
      sourceLanguage: CONFIG.sourceLanguage,
      targetLanguage: CONFIG.targetLanguage,
    });
    console.log(\`Translation availability: \${status}\`);
    return status;
  } catch (error) {
    console.error('Availability check failed:', error);
    return 'no';
  }
}

/**
 * Create a translator instance
 * Note: Requires user activation (must be called from user interaction like button click)
 */
async function createTranslator(signal) {
  try {
    const translator = await Translator.create({
      sourceLanguage: CONFIG.sourceLanguage,
      targetLanguage: CONFIG.targetLanguage,
      signal,
      monitor: (m) => {
        m.addEventListener('downloadprogress', (e) => {
          const percent = ((e.loaded / e.total) * 100).toFixed(0);
          console.log(\`Downloading model: \${percent}%\`);
        });
      },
    });

    console.log('Translator created successfully');
    return translator;
  } catch (error) {
    console.error('Failed to create translator:', error);
    return null;
  }
}

/**
 * Translate text (non-streaming)
 */
async function translate(text) {
  const translator = await createTranslator();
  if (!translator) return null;

  try {
    const startTime = performance.now();
    const result = await translator.translate(text, {${hasContext ? `\n      context: CONFIG.context,` : ''}
    });

    const duration = performance.now() - startTime;
    console.log(\`Translation completed in \${duration.toFixed(0)}ms\`);

    return result;
  } catch (error) {
    console.error('Translation failed:', error);
    return null;
  } finally {
    translator.destroy();
  }
}

/**
 * Translate text with streaming (for real-time results)
 */
async function translateStreaming(text, onChunk) {
  const translator = await createTranslator();
  if (!translator) return;

  try {
    const startTime = performance.now();

    const stream = translator.translateStreaming(text, {${hasContext ? `\n      context: CONFIG.context,` : ''}
    });

    for await (const chunk of stream) {
      onChunk(chunk);
    }

    const duration = performance.now() - startTime;
    console.log(\`Streaming translation completed in \${duration.toFixed(0)}ms\`);
  } catch (error) {
    console.error('Streaming translation failed:', error);
  } finally {
    translator.destroy();
  }
}

/**
 * Smart translation (auto-selects streaming based on text length)
 */
async function smartTranslate(text, onChunk) {
  const wordCount = text.trim().split(/\\s+/).length;

  // Determine streaming based on mode and threshold
  let useStreaming = false;
  if (CONFIG.streamingMode === 'always') {
    useStreaming = true;
  } else if (CONFIG.streamingMode === 'auto') {
    useStreaming = wordCount > CONFIG.streamingThreshold;
  }

  if (useStreaming && onChunk) {
    await translateStreaming(text, onChunk);
    return null; // Result provided via chunks
  } else {
    return await translate(text);
  }
}

// ============================================================================
// Batch Translation
// ============================================================================

/**
 * Translate multiple items in parallel
 */
async function batchTranslate(items, onProgress) {
  const translator = await createTranslator();
  if (!translator) {
    return items.map(item => ({
      id: item.id,
      original: item.text,
      translated: '',
      success: false,
      error: 'Failed to create translator',
    }));
  }

  try {
    const results = [];
    const concurrency = CONFIG.concurrency;

    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      const promises = batch.map(async (item) => {
        try {
          const translated = await translator.translate(item.text, {
            context: item.context,
          });
          return {
            id: item.id,
            original: item.text,
            translated,
            success: true,
          };
        } catch (error) {
          return {
            id: item.id,
            original: item.text,
            translated: '',
            success: false,
            error: error.message || 'Unknown error',
          };
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      if (onProgress) {
        onProgress(results.length, items.length);
      }
    }

    return results;
  } finally {
    translator.destroy();
  }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Basic translation
 */
async function exampleBasic() {
  const text = 'Hello, world!';

  try {
    const result = await translate(text);
    console.log('Translation:', result);
  } catch (error) {
    console.error('Translation failed:', error);
  }
}

/**
 * Example 2: Streaming translation with real-time updates
 */
async function exampleStreaming() {
  const text = 'This is a longer text that will be translated using streaming for real-time results.';

  try {
    await translateStreaming(text, (chunk) => {
      console.log('Streaming chunk:', chunk);
      // Update UI with partial results in real-time
    });
  } catch (error) {
    console.error('Streaming failed:', error);
  }
}

/**
 * Example 3: Smart translation (auto-detects streaming need)
 */
async function exampleSmart() {
  const text = 'Another text to translate';

  try {
    const result = await smartTranslate(text, (chunk) => {
      console.log('Smart chunk:', chunk);
    });
    console.log('Smart result:', result);
  } catch (error) {
    console.error('Smart translation failed:', error);
  }
}

/**
 * Example 4: Batch translation with progress tracking
 */
async function exampleBatch() {
  const items = [
    { id: '1', text: 'First sentence' },
    { id: '2', text: 'Second sentence' },
    { id: '3', text: 'Third sentence' },
  ];

  try {
    const results = await batchTranslate(items, (completed, total) => {
      console.log(\`Progress: \${completed}/\${total}\`);
    });

    console.log('Batch results:', results);
  } catch (error) {
    console.error('Batch translation failed:', error);
  }
}

/**
 * Example 5: HTML Integration (Button click handler)
 */
function setupHTMLIntegration() {
  const button = document.getElementById('translate-btn');
  const input = document.getElementById('text-input');
  const output = document.getElementById('translation-output');

  button?.addEventListener('click', async () => {
    if (!input || !output) return;

    try {
      output.textContent = 'Translating...';
      const result = await translate(input.value);
      output.textContent = result || 'Translation failed';
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
// exampleSmart();
// exampleBatch();
// setupHTMLIntegration();

export { translate, translateStreaming, smartTranslate, batchTranslate, checkAvailability };`;
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
 *   sourceLanguage="en"
 *   targetLanguage="es"
 *   advancedSettings={settings}
 * />
 * ```
 */
export function CodeModal({
  isOpen,
  onClose,
  sourceLanguage,
  targetLanguage,
  context,
  advancedSettings,
  className,
}: CodeModalProps) {
  // State
  const [requirementsOpen, setRequirementsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get language info
  const sourceInfo = SUPPORTED_LANGUAGES[sourceLanguage];
  const targetInfo = SUPPORTED_LANGUAGES[targetLanguage];

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
    () =>
      generateTypeScriptCode(
        sourceLanguage,
        targetLanguage,
        context,
        advancedSettings,
      ),
    [sourceLanguage, targetLanguage, context, advancedSettings],
  );
  const javascriptCode = useMemo(
    () =>
      generateJavaScriptCode(
        sourceLanguage,
        targetLanguage,
        context,
        advancedSettings,
      ),
    [sourceLanguage, targetLanguage, context, advancedSettings],
  );

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
              Generated Code
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs min-[375px]:text-sm">
            Implementation code for {sourceInfo.flag} {sourceInfo.name} →{' '}
            {targetInfo.flag} {targetInfo.name} translation. Copy or download to
            integrate into your project.
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
                className="mb-4"
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
                          <strong>Chrome 138+</strong> with Chrome AI Translator
                          API enabled
                        </li>
                        <li>
                          Enable flag:{' '}
                          <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded text-[10px]">
                            chrome://flags#translation-api
                          </code>
                        </li>
                        <li>Check availability before using the API</li>
                        <li>
                          <strong>User activation required:</strong> Call{' '}
                          <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded text-[10px]">
                            Translator.create()
                          </code>{' '}
                          only from user interactions (button clicks)
                        </li>
                        <li>
                          Always clean up translator instances with{' '}
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
                          Use streaming for better UX with long content (auto at
                          &gt;{advancedSettings.streamingThreshold} words)
                        </li>
                        <li>
                          Batch translation supports{' '}
                          {advancedSettings.concurrency}x parallel processing
                        </li>
                      </ul>
                    </CollapsibleContent>
                  </AlertDescription>
                </Alert>
              </Collapsible>

              {/* Configuration Display */}
              <Alert className="bg-slate-50 dark:bg-slate-900 mb-4">
                <AlertDescription className="space-y-2">
                  <div className="text-sm font-medium">
                    Current Configuration:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {sourceInfo.flag} {sourceLanguage.toUpperCase()} →{' '}
                      {targetInfo.flag} {targetLanguage.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary">
                      Streaming: {advancedSettings.streamingMode}
                    </Badge>
                    <Badge variant="secondary">
                      Quality: {advancedSettings.quality}
                    </Badge>
                    <Badge variant="secondary">
                      Concurrency: {advancedSettings.concurrency}x
                    </Badge>
                    {context && <Badge variant="secondary">Context: Yes</Badge>}
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
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Full TypeScript implementation with types, examples, and
                    batch translation
                  </div>

                  <ThemedCodeBlock
                    code={typescriptCode}
                    language="typescript"
                    filename={`translator-${sourceLanguage}-${targetLanguage}.ts`}
                    showCopyButton
                    showDownloadButton
                    showThemeToggle={false}
                    showLanguageBadge={false}
                    forceTheme="dark"
                  />
                </TabsContent>

                {/* JavaScript */}
                <TabsContent value="javascript" className="mt-0 space-y-3">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Plain JavaScript implementation with examples and batch
                    translation
                  </div>

                  <ThemedCodeBlock
                    code={javascriptCode}
                    language="javascript"
                    filename={`translator-${sourceLanguage}-${targetLanguage}.js`}
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
