/**
 * CodeModal Component - Language Detection API
 *
 * Modal dialog for viewing and copying generated Language Detection API implementation code.
 * Provides TypeScript and JavaScript code examples based on current configuration.
 *
 * @module language-detection/components/CodeModal
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
import type { DetectionConfig } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface CodeModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Current Language Detection configuration */
  config: DetectionConfig;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Code Generation Functions
// ============================================================================

/**
 * Generate TypeScript implementation code
 */
function generateTypeScriptCode(config: DetectionConfig): string {
  const configStr = JSON.stringify(
    {
      confidenceThreshold: config.confidenceThreshold,
      maxCandidates: config.maxCandidates,
      showAllCandidates: config.showAllCandidates,
    },
    null,
    2,
  );

  return `/**
 * Chrome Built-in AI - Language Detection API Implementation
 *
 * Requirements:
 * - Chrome 138+ with Language Detection API enabled
 * - Enable chrome://flags#language-detection-api
 *
 * This is a complete, self-contained implementation.
 * Copy this entire file to use in your project.
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface DetectionResult {
  detectedLanguage: string;
  confidence: number;
}

interface LanguageDetector {
  detect(input: string): Promise<DetectionResult[]>;
  destroy(): void;
}

interface LanguageDetectorCreateOptions {
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
}

interface LanguageDetectorAPI {
  create(options?: LanguageDetectorCreateOptions): Promise<LanguageDetector>;
  availability(): Promise<'available' | 'downloadable'>;
}

declare global {
  interface Window {
    LanguageDetector: LanguageDetectorAPI;
  }
}

// ============================================================================
// Configuration
// ============================================================================

const config = ${configStr};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Check if Chrome AI Language Detector is available
 */
async function checkAvailability(): Promise<boolean> {
  if (!('LanguageDetector' in window)) {
    throw new Error(
      'Chrome AI Language Detector not supported. ' +
      'Requires Chrome 138+ with chrome://flags#language-detection-api enabled.'
    );
  }

  const availability = await self.LanguageDetector.availability();

  if (availability === 'unavailable') {
    throw new Error('Language Detection not available on this device');
  }

  if (availability === 'downloadable') {
    console.log('Model download required - this may take a few minutes');
    // Model will download automatically on first create() call
  }

  return availability === 'available';
}

/**
 * Create a new language detector instance
 */
async function createDetector(): Promise<LanguageDetector> {
  const detector = await self.LanguageDetector.create();
  return detector;
}

/**
 * Detect language from text
 * Returns filtered results based on configuration
 */
async function detectLanguage(text: string): Promise<DetectionResult[]> {
  await checkAvailability();
  const detector = await createDetector();

  try {
    const results = await detector.detect(text);

    // Filter and sort results based on config
    let filteredResults = results;

    if (!config.showAllCandidates) {
      filteredResults = results.filter(
        (r) => r.confidence >= config.confidenceThreshold
      );
    }

    // Limit to max candidates
    return filteredResults.slice(0, config.maxCandidates);
  } finally {
    detector.destroy();
  }
}

/**
 * Get the top detected language
 */
async function detectTopLanguage(text: string): Promise<DetectionResult | null> {
  const results = await detectLanguage(text);
  return results.length > 0 ? results[0] : null;
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Basic language detection
 */
async function exampleBasic() {
  const text = 'Hello, how are you today?';

  try {
    const results = await detectLanguage(text);
    console.log('Detection results:', results);
    // Output: [{ detectedLanguage: 'en', confidence: 0.99 }]
  } catch (error) {
    console.error('Detection failed:', error);
  }
}

/**
 * Example 2: Get top language only
 */
async function exampleTopLanguage() {
  const text = 'Bonjour, comment allez-vous?';

  try {
    const topResult = await detectTopLanguage(text);
    if (topResult) {
      console.log(\`Detected: \${topResult.detectedLanguage} (\${(topResult.confidence * 100).toFixed(1)}%)\`);
    }
  } catch (error) {
    console.error('Detection failed:', error);
  }
}

/**
 * Example 3: HTML Integration (Text input handler)
 */
function setupHTMLIntegration() {
  const input = document.getElementById('text-input') as HTMLTextAreaElement;
  const button = document.getElementById('detect-btn');
  const output = document.getElementById('results-output');

  button?.addEventListener('click', async () => {
    if (!input || !output) return;

    try {
      output.textContent = 'Detecting...';
      const results = await detectLanguage(input.value);

      output.innerHTML = results
        .map(
          (r) =>
            \`<div>\${r.detectedLanguage}: \${(r.confidence * 100).toFixed(1)}%</div>\`
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
// exampleTopLanguage();
// setupHTMLIntegration();

export { detectLanguage, detectTopLanguage, checkAvailability };`;
}

/**
 * Generate JavaScript implementation code
 */
function generateJavaScriptCode(config: DetectionConfig): string {
  const configStr = JSON.stringify(
    {
      confidenceThreshold: config.confidenceThreshold,
      maxCandidates: config.maxCandidates,
      showAllCandidates: config.showAllCandidates,
    },
    null,
    2,
  );

  return `/**
 * Chrome Built-in AI - Language Detection API Implementation
 *
 * Requirements:
 * - Chrome 138+ with Language Detection API enabled
 * - Enable chrome://flags#language-detection-api
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
 * Check if Chrome AI Language Detector is available
 */
async function checkAvailability() {
  if (!('LanguageDetector' in window)) {
    throw new Error(
      'Chrome AI Language Detector not supported. ' +
      'Requires Chrome 138+ with chrome://flags#language-detection-api enabled.'
    );
  }

  const availability = await self.LanguageDetector.availability();

  if (availability === 'unavailable') {
    throw new Error('Language Detection not available on this device');
  }

  if (availability === 'downloadable') {
    console.log('Model download required - this may take a few minutes');
    // Model will download automatically on first create() call
  }

  return availability === 'available';
}

/**
 * Create a new language detector instance
 */
async function createDetector() {
  const detector = await self.LanguageDetector.create();
  return detector;
}

/**
 * Detect language from text
 * Returns filtered results based on configuration
 */
async function detectLanguage(text) {
  await checkAvailability();
  const detector = await createDetector();

  try {
    const results = await detector.detect(text);

    // Filter and sort results based on config
    let filteredResults = results;

    if (!config.showAllCandidates) {
      filteredResults = results.filter(
        (r) => r.confidence >= config.confidenceThreshold
      );
    }

    // Limit to max candidates
    return filteredResults.slice(0, config.maxCandidates);
  } finally {
    detector.destroy();
  }
}

/**
 * Get the top detected language
 */
async function detectTopLanguage(text) {
  const results = await detectLanguage(text);
  return results.length > 0 ? results[0] : null;
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Basic language detection
 */
async function exampleBasic() {
  const text = 'Hello, how are you today?';

  try {
    const results = await detectLanguage(text);
    console.log('Detection results:', results);
    // Output: [{ detectedLanguage: 'en', confidence: 0.99 }]
  } catch (error) {
    console.error('Detection failed:', error);
  }
}

/**
 * Example 2: Get top language only
 */
async function exampleTopLanguage() {
  const text = 'Bonjour, comment allez-vous?';

  try {
    const topResult = await detectTopLanguage(text);
    if (topResult) {
      console.log(\`Detected: \${topResult.detectedLanguage} (\${(topResult.confidence * 100).toFixed(1)}%)\`);
    }
  } catch (error) {
    console.error('Detection failed:', error);
  }
}

/**
 * Example 3: HTML Integration (Text input handler)
 */
function setupHTMLIntegration() {
  const input = document.getElementById('text-input');
  const button = document.getElementById('detect-btn');
  const output = document.getElementById('results-output');

  button?.addEventListener('click', async () => {
    if (!input || !output) return;

    try {
      output.textContent = 'Detecting...';
      const results = await detectLanguage(input.value);

      output.innerHTML = results
        .map(
          (r) =>
            \`<div>\${r.detectedLanguage}: \${(r.confidence * 100).toFixed(1)}%</div>\`
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
// exampleTopLanguage();
// setupHTMLIntegration();

export { detectLanguage, detectTopLanguage, checkAvailability };`;
}

// ============================================================================
// CodeModal Component
// ============================================================================

/**
 * Code generation and export modal for Language Detection API
 *
 * @example
 * ```tsx
 * <CodeModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   config={detectionConfig}
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
              Generated Code - Language Detection API
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
                          <strong>Chrome 138+</strong> with Language Detection
                          API enabled
                        </li>
                        <li>
                          Enable flag:{' '}
                          <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded text-[10px]">
                            chrome://flags#language-detection-api
                          </code>
                        </li>
                        <li>Check availability before using the API</li>
                        <li>
                          Always clean up detector instances with{' '}
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
                          Results are sorted by confidence (highest first)
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
                      Threshold: {(config.confidenceThreshold * 100).toFixed(0)}
                      %
                    </Badge>
                    <Badge variant="secondary">
                      Max Candidates: {config.maxCandidates}
                    </Badge>
                    <Badge variant="secondary">
                      Show All: {config.showAllCandidates ? 'Yes' : 'No'}
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
                    Full TypeScript implementation with types and examples
                  </div>

                  <ThemedCodeBlock
                    code={typescriptCode}
                    language="typescript"
                    filename="language-detection.ts"
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
                    filename="language-detection.js"
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
