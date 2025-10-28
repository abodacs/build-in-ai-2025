/**
 * CodeModal Component
 *
 * Modal dialog for viewing and copying generated code
 * Overlays the playground interface for easy access
 *
 * @module CodeModal
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import type { PromptConfig } from '../types';
import { DEFAULT_PROMPT_CONFIG } from '../types';
import { generatePromptAPITests } from '@/utils/codeGeneration/testGenerator';
import { generatePromptAPIDocumentation } from '@/utils/codeGeneration/docsGenerator';
import { SHORTCUTS } from '@/utils/keyboard';
import '@/components/code/code-animations.css';

// ============================================================================
// Types
// ============================================================================

export interface CodeModalProps {
  /** Modal open state */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Current configuration */
  config?: PromptConfig;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Code Generation
// ============================================================================

/**
 * Generate TypeScript implementation code
 */
function generateTypeScriptCode(config: PromptConfig): string {
  const configStr = JSON.stringify(
    {
      systemPrompt:
        config.systemPrompt || 'You are a helpful and friendly assistant.',
      temperature: config.temperature ?? 1, // Default: 1, Max: 2
      topK: config.topK ?? 3, // Default: 3, Max: 128
      maxTokens: config.maxTokens || 2048,
    },
    null,
    2,
  );

  return `/**
 * Chrome AI Prompt API - Complete TypeScript Implementation
 *
 * Requirements:
 * - Chrome 138+ (Prompt API is built-in, no flag needed)
 * - 22+ GB free disk space (for model download)
 * - 16+ GB RAM, GPU with >4GB VRAM, 4+ CPU cores
 * - Unmetered internet connection (for initial download)
 *
 * This is a complete, self-contained implementation.
 * Copy this entire file to use in your project.
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PromptOptions {
  signal?: AbortSignal;
}

interface CloneOptions {
  signal?: AbortSignal;
}

interface LanguageModelParams {
  defaultTemperature: number;
  maxTemperature: number;
  defaultTopK: number;
  maxTopK: number;
}

interface LanguageModel {
  prompt(text: string, options?: PromptOptions): Promise<string>;
  promptStreaming(text: string, options?: PromptOptions): ReadableStream<string>;
  append(messages: Message[]): Promise<void>;
  clone(options?: CloneOptions): LanguageModel;
  destroy(): void;
  readonly inputUsage: number;
  readonly inputQuota: number;
}

interface LanguageModelCreateOptions {
  systemPrompt?: string;
  temperature?: number;  // Default: 1, Max: 2
  topK?: number;         // Default: 3, Max: 128
  maxTokens?: number;
  signal?: AbortSignal;
  initialPrompts?: Message[];
}

interface LanguageModelAPI {
  create(options?: LanguageModelCreateOptions): Promise<LanguageModel>;
  availability(): Promise<'unavailable' | 'downloadable' | 'downloading'>;
  params(): Promise<LanguageModelParams>;
}

declare global {
  interface Window {
    LanguageModel: LanguageModelAPI;
  }
  const LanguageModel: LanguageModelAPI;
}

// ============================================================================
// Configuration
// ============================================================================

const config: LanguageModelCreateOptions = ${configStr};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Check if Chrome AI Prompt API is available
 */
async function checkAvailability(): Promise<boolean> {
  if (!('LanguageModel' in window)) {
    throw new Error(
      'Chrome AI Prompt API not supported. ' +
      'Requires Chrome 138+ (Dev/Canary channel)'
    );
  }

  const availability = await window.LanguageModel.availability();

  if (availability === 'unavailable') {
    throw new Error(
      'Prompt API not available on this device. ' +
      'Requires: GPU with 4GB+ VRAM, 16GB+ RAM, 4+ CPU cores, 22GB+ free disk space'
    );
  }

  if (availability === 'downloadable') {
    console.log(
      'Model download required (22+ GB free space needed). ' +
      'This may take 10-30 minutes on first use.'
    );
    // Model will download automatically on first create() call
  }

  if (availability === 'downloading') {
    console.log('Model is currently downloading... Please wait.');
    // Can still proceed - create() will wait for download to complete
  }

  return availability === 'downloadable' || availability === 'downloading';
}

/**
 * Create a new language model session
 * Note: Requires user activation (must be called from user interaction like button click)
 */
async function createSession(): Promise<LanguageModel> {
  const session = await window.LanguageModel.create(config);
  return session;
}

/**
 * Send a prompt (non-streaming)
 */
async function prompt(text: string): Promise<string> {
  await checkAvailability();
  const session = await createSession();

  try {
    const response = await session.prompt(text);
    return response;
  } finally {
    session.destroy();
  }
}

/**
 * Send a prompt with streaming (for real-time results)
 */
async function promptStreaming(
  text: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  await checkAvailability();
  const session = await createSession();

  try {
    if (!session.promptStreaming) {
      throw new Error('Streaming not supported in this version');
    }

    const stream = session.promptStreaming(text);
    const reader = stream.getReader();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      fullResponse = value;
      onChunk(value);
    }

    return fullResponse;
  } finally {
    session.destroy();
  }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Basic prompt
 */
async function exampleBasic() {
  const userPrompt = 'Explain quantum computing in simple terms';

  try {
    const response = await prompt(userPrompt);
    console.log('Response:', response);
  } catch (error) {
    console.error('Prompt failed:', error);
  }
}

/**
 * Example 2: Streaming prompt with real-time updates
 */
async function exampleStreaming() {
  const userPrompt = 'Write a short story about a time traveler';

  try {
    const response = await promptStreaming(userPrompt, (chunk) => {
      console.log('Streaming chunk:', chunk);
      // Update UI with partial results in real-time
    });
    console.log('Final response:', response);
  } catch (error) {
    console.error('Streaming failed:', error);
  }
}

/**
 * Example 3: Conversational interface
 */
async function exampleConversation() {
  // For conversations, maintain session across multiple prompts
  await checkAvailability();
  const session = await createSession();

  try {
    // First message
    const response1 = await session.prompt('Hello! What can you help me with?');
    console.log('AI:', response1);

    // Follow-up message (session maintains context)
    const response2 = await session.prompt('Tell me more about that');
    console.log('AI:', response2);
  } finally {
    // Always clean up
    session.destroy();
  }
}

/**
 * Example 4: HTML Integration (Button click handler)
 */
function setupHTMLIntegration() {
  const button = document.getElementById('prompt-btn');
  const input = document.getElementById('text-input') as HTMLTextAreaElement;
  const output = document.getElementById('response-output');

  button?.addEventListener('click', async () => {
    if (!input || !output) return;

    try {
      output.textContent = 'Thinking...';
      const response = await prompt(input.value);
      output.textContent = response;
    } catch (error) {
      output.textContent = \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`;
    }
  });
}

/**
 * Example 5: Clone session for parallel processing
 */
async function exampleClone() {
  await checkAvailability();
  const session = await createSession();

  try {
    // Clone the session to process multiple prompts in parallel
    const clonedSession = session.clone();

    // Both sessions can be used independently
    const [response1, response2] = await Promise.all([
      session.prompt('What is AI?'),
      clonedSession.prompt('What is machine learning?')
    ]);

    console.log('Session 1:', response1);
    console.log('Session 2:', response2);

    // Clean up both sessions
    clonedSession.destroy();
  } finally {
    session.destroy();
  }
}

/**
 * Example 6: Append messages for conversation context
 */
async function exampleAppend() {
  await checkAvailability();
  const session = await createSession();

  try {
    // Append conversation history
    await session.append([
      { role: 'user', content: 'Hello!' },
      { role: 'assistant', content: 'Hi! How can I help you today?' },
      { role: 'user', content: 'Tell me about JavaScript.' }
    ]);

    // Continue conversation with context
    const response = await session.prompt('Can you give me an example?');
    console.log('Response:', response);
  } finally {
    session.destroy();
  }
}

/**
 * Example 7: Abort long-running prompts with AbortSignal
 */
async function exampleAbort() {
  await checkAvailability();
  const session = await createSession();

  try {
    // Create abort controller
    const controller = new AbortController();

    // Set a timeout to abort after 5 seconds
    setTimeout(() => controller.abort(), 5000);

    // Send prompt with abort signal
    const response = await session.prompt(
      'Write a very long essay about the history of computing',
      { signal: controller.signal }
    );

    console.log('Response:', response);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Prompt was aborted');
    } else {
      throw error;
    }
  } finally {
    session.destroy();
  }
}

/**
 * Example 8: Monitor token quota usage
 */
async function exampleQuota() {
  await checkAvailability();
  const session = await createSession();

  try {
    console.log('Initial quota:', session.inputQuota);
    console.log('Initial usage:', session.tokensSoFar);

    const response = await session.prompt('Hello!');
    console.log('Response:', response);

    console.log('After prompt quota:', session.inputQuota);
    console.log('After prompt usage:', session.tokensSoFar);
    console.log('Remaining tokens:', session.inputQuota - session.tokensSoFar);

    // Check if approaching quota limit
    if (session.tokensSoFar / session.inputQuota > 0.8) {
      console.warn('Warning: Approaching token quota limit!');
    }
  } finally {
    session.destroy();
  }
}

// ============================================================================
// Run Examples (uncomment to test)
// ============================================================================

// exampleBasic();
// exampleStreaming();
// exampleConversation();
// setupHTMLIntegration();
// exampleClone();
// exampleAppend();
// exampleAbort();
// exampleQuota();

export { prompt, promptStreaming, checkAvailability, createSession };`;
}

/**
 * Generate JavaScript implementation code
 */
function generateJavaScriptCode(config: PromptConfig): string {
  const configStr = JSON.stringify(
    {
      systemPrompt:
        config.systemPrompt || 'You are a helpful and friendly assistant.',
      temperature: config.temperature ?? 1,
      topK: config.topK ?? 3,
      maxTokens: config.maxTokens || 2048,
    },
    null,
    2,
  );

  return `/**
 * Chrome AI Prompt API - Complete JavaScript Implementation
 *
 * Requirements:
 * - Chrome 138+ (Dev/Canary channel)
 * - GPU: 4GB+ VRAM
 * - RAM: 16GB+
 * - CPU: 4+ cores
 * - Disk: 22GB+ free space
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
 * Check if Chrome AI Prompt API is available
 */
async function checkAvailability() {
  if (!('LanguageModel' in window)) {
    throw new Error(
      'Chrome AI Prompt API not supported. ' +
      'Requires Chrome 138+ (Dev/Canary channel)'
    );
  }

  const availability = await window.LanguageModel.availability();

  if (availability === 'unavailable') {
    throw new Error(
      'Prompt API not available on this device. ' +
      'Requires: GPU with 4GB+ VRAM, 16GB+ RAM, 4+ CPU cores, 22GB+ free disk space'
    );
  }

  if (availability === 'downloadable') {
    console.log(
      'Model download required (22+ GB free space needed). ' +
      'This may take 10-30 minutes on first use.'
    );
    // Model will download automatically on first create() call
  }

  if (availability === 'downloading') {
    console.log('Model is currently downloading... Please wait.');
    // Can still proceed - create() will wait for download to complete
  }

  return availability === 'downloadable' || availability === 'downloading';
}

/**
 * Create a new language model session
 * Note: Requires user activation (must be called from user interaction like button click)
 */
async function createSession() {
  const session = await window.LanguageModel.create(config);
  return session;
}

/**
 * Send a prompt (non-streaming)
 */
async function prompt(text) {
  await checkAvailability();
  const session = await createSession();

  try {
    const response = await session.prompt(text);
    return response;
  } finally {
    session.destroy();
  }
}

/**
 * Send a prompt with streaming (for real-time results)
 */
async function promptStreaming(text, onChunk) {
  await checkAvailability();
  const session = await createSession();

  try {
    if (!session.promptStreaming) {
      throw new Error('Streaming not supported in this version');
    }

    const stream = session.promptStreaming(text);
    const reader = stream.getReader();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      fullResponse = value;
      onChunk(value);
    }

    return fullResponse;
  } finally {
    session.destroy();
  }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example 1: Basic prompt
 */
async function exampleBasic() {
  const userPrompt = 'Explain quantum computing in simple terms';

  try {
    const response = await prompt(userPrompt);
    console.log('Response:', response);
  } catch (error) {
    console.error('Prompt failed:', error);
  }
}

/**
 * Example 2: Streaming prompt with real-time updates
 */
async function exampleStreaming() {
  const userPrompt = 'Write a short story about a time traveler';

  try {
    const response = await promptStreaming(userPrompt, (chunk) => {
      console.log('Streaming chunk:', chunk);
      // Update UI with partial results in real-time
    });
    console.log('Final response:', response);
  } catch (error) {
    console.error('Streaming failed:', error);
  }
}

/**
 * Example 3: Conversational interface
 */
async function exampleConversation() {
  // For conversations, maintain session across multiple prompts
  await checkAvailability();
  const session = await createSession();

  try {
    // First message
    const response1 = await session.prompt('Hello! What can you help me with?');
    console.log('AI:', response1);

    // Follow-up message (session maintains context)
    const response2 = await session.prompt('Tell me more about that');
    console.log('AI:', response2);
  } finally {
    // Always clean up
    session.destroy();
  }
}

/**
 * Example 4: HTML Integration (Button click handler)
 */
function setupHTMLIntegration() {
  const button = document.getElementById('prompt-btn');
  const input = document.getElementById('text-input');
  const output = document.getElementById('response-output');

  button?.addEventListener('click', async () => {
    if (!input || !output) return;

    try {
      output.textContent = 'Thinking...';
      const response = await prompt(input.value);
      output.textContent = response;
    } catch (error) {
      output.textContent = \`Error: \${error.message || 'Unknown error'}\`;
    }
  });
}

/**
 * Example 5: Clone session for parallel processing
 */
async function exampleClone() {
  await checkAvailability();
  const session = await createSession();

  try {
    // Clone the session to process multiple prompts in parallel
    const clonedSession = session.clone();

    // Both sessions can be used independently
    const [response1, response2] = await Promise.all([
      session.prompt('What is AI?'),
      clonedSession.prompt('What is machine learning?')
    ]);

    console.log('Session 1:', response1);
    console.log('Session 2:', response2);

    // Clean up both sessions
    clonedSession.destroy();
  } finally {
    session.destroy();
  }
}

/**
 * Example 6: Append messages for conversation context
 */
async function exampleAppend() {
  await checkAvailability();
  const session = await createSession();

  try {
    // Append conversation history
    await session.append([
      { role: 'user', content: 'Hello!' },
      { role: 'assistant', content: 'Hi! How can I help you today?' },
      { role: 'user', content: 'Tell me about JavaScript.' }
    ]);

    // Continue conversation with context
    const response = await session.prompt('Can you give me an example?');
    console.log('Response:', response);
  } finally {
    session.destroy();
  }
}

/**
 * Example 7: Abort long-running prompts with AbortSignal
 */
async function exampleAbort() {
  await checkAvailability();
  const session = await createSession();

  try {
    // Create abort controller
    const controller = new AbortController();

    // Set a timeout to abort after 5 seconds
    setTimeout(() => controller.abort(), 5000);

    // Send prompt with abort signal
    const response = await session.prompt(
      'Write a very long essay about the history of computing',
      { signal: controller.signal }
    );

    console.log('Response:', response);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Prompt was aborted');
    } else {
      throw error;
    }
  } finally {
    session.destroy();
  }
}

/**
 * Example 8: Monitor token quota usage
 */
async function exampleQuota() {
  await checkAvailability();
  const session = await createSession();

  try {
    console.log('Initial quota:', session.inputQuota);
    console.log('Initial usage:', session.tokensSoFar);

    const response = await session.prompt('Hello!');
    console.log('Response:', response);

    console.log('After prompt quota:', session.inputQuota);
    console.log('After prompt usage:', session.tokensSoFar);
    console.log('Remaining tokens:', session.inputQuota - session.tokensSoFar);

    // Check if approaching quota limit
    if (session.tokensSoFar / session.inputQuota > 0.8) {
      console.warn('Warning: Approaching token quota limit!');
    }
  } finally {
    session.destroy();
  }
}

// ============================================================================
// Run Examples (uncomment to test)
// ============================================================================

// exampleBasic();
// exampleStreaming();
// exampleConversation();
// setupHTMLIntegration();
// exampleClone();
// exampleAppend();
// exampleAbort();
// exampleQuota();

export { prompt, promptStreaming, checkAvailability, createSession };`;
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
  config = DEFAULT_PROMPT_CONFIG,
  className,
}: CodeModalProps) {
  // State
  const [requirementsOpen, setRequirementsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('javascript');

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
  const testsCode = useMemo(() => generatePromptAPITests(config), [config]);
  const docsCode = useMemo(
    () => generatePromptAPIDocumentation(config),
    [config],
  );

  // Download current tab
  const downloadCurrentTab = useCallback(() => {
    const downloads = {
      typescript: { code: typescriptCode, filename: 'prompt-api.ts' },
      javascript: { code: javascriptCode, filename: 'prompt-api.js' },
      tests: { code: testsCode, filename: 'prompt-api.test.ts' },
      docs: { code: docsCode, filename: 'README.md' },
    };

    const current = downloads[activeTab as keyof typeof downloads];
    if (!current) return;

    const blob = new Blob([current.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = current.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeTab, typescriptCode, javascriptCode, testsCode, docsCode]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab navigation (without modifier keys)
      if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const tabs = ['typescript', 'javascript', 'tests', 'docs'] as const;
        const currentIndex = tabs.indexOf(activeTab as (typeof tabs)[number]);
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + tabs.length) % tabs.length
          : (currentIndex + 1) % tabs.length;
        const nextTab = tabs[nextIndex];
        if (nextTab) setActiveTab(nextTab);
      }

      // Download current tab (Cmd+D or Ctrl+D)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        downloadCurrentTab();
      }

      // Close modal (Escape)
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, onClose, downloadCurrentTab]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent
        className={cn(
          'w-[calc(100vw-1rem)] min-[375px]:w-[calc(100vw-2rem)] sm:w-[95vw]',
          'max-w-4xl xl:max-w-[1400px]',
          'h-[85vh] sm:h-[90vh] max-h-[90vh]',
          'p-0 gap-0 flex flex-col overflow-hidden',
          'modal-enter', // Slide-up animation
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
          <DialogDescription className="text-xs min-[375px]:text-sm space-y-2">
            <div>
              Implementation code based on your current configuration. Copy or
              download to integrate into your project.
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 font-mono">
                Tab
              </kbd>
              <span>Switch tabs</span>
              <span className="text-slate-400">•</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 font-mono">
                {SHORTCUTS.download()}
              </kbd>
              <span>Download</span>
              <span className="text-slate-400">•</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 font-mono">
                {SHORTCUTS.close()}
              </kbd>
              <span>Close</span>
            </div>
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
                          <strong>Chrome 138+</strong> with Chrome AI Prompt API
                          enabled
                        </li>
                        <li>
                          Enable flag:{' '}
                          <code className="px-1 py-0.5 bg-amber-100 rounded text-[10px]">
                            chrome://flags#prompt-api-for-gemini-nano-multimodal-input
                          </code>
                        </li>
                        <li>Check availability before using the API</li>
                        <li>
                          <strong>User activation required:</strong> Call{' '}
                          <code className="px-1 py-0.5 bg-amber-100 rounded text-[10px]">
                            LanguageModel.create()
                          </code>{' '}
                          only from user interactions (button clicks)
                        </li>
                        <li>
                          Always clean up sessions with{' '}
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
                        <li>Use streaming for better UX with long responses</li>
                        <li>
                          For conversations, maintain session across multiple
                          prompts instead of creating new sessions
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
                      Temperature: {config.temperature?.toFixed(2) || '0.80'}
                    </Badge>
                    <Badge variant="secondary">Top K: {config.topK || 8}</Badge>
                    <Badge variant="secondary">
                      Max Tokens: {config.maxTokens || 2048}
                    </Badge>
                    <Badge variant="secondary">
                      Streaming:{' '}
                      {config.enableStreaming !== false ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Code Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="w-full grid grid-cols-4 mb-4">
                  <TabsTrigger value="typescript" className="tab-indicator">
                    TypeScript
                  </TabsTrigger>
                  <TabsTrigger value="javascript" className="tab-indicator">
                    JavaScript
                  </TabsTrigger>
                  <TabsTrigger value="tests" className="tab-indicator">
                    Tests
                  </TabsTrigger>
                  <TabsTrigger value="docs" className="tab-indicator">
                    Docs
                  </TabsTrigger>
                </TabsList>

                {/* TypeScript */}
                <TabsContent
                  value="typescript"
                  className="mt-0 space-y-3 tab-content-enter"
                >
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Full TypeScript implementation with types
                  </div>

                  <ThemedCodeBlock
                    code={typescriptCode}
                    language="typescript"
                    filename="prompt-api.ts"
                    showCopyButton
                    showDownloadButton
                    showThemeToggle={false}
                    showLanguageBadge={false}
                    forceTheme="dark"
                  />
                </TabsContent>

                {/* JavaScript */}
                <TabsContent
                  value="javascript"
                  className="mt-0 space-y-3 tab-content-enter"
                >
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Plain JavaScript implementation
                  </div>

                  <ThemedCodeBlock
                    code={javascriptCode}
                    language="javascript"
                    filename="prompt-api.js"
                    showCopyButton
                    showDownloadButton
                    showThemeToggle={false}
                    showLanguageBadge={false}
                    forceTheme="dark"
                  />
                </TabsContent>

                {/* Tests */}
                <TabsContent
                  value="tests"
                  className="mt-0 space-y-3 tab-content-enter"
                >
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Comprehensive Vitest test suite
                  </div>

                  <ThemedCodeBlock
                    code={testsCode}
                    language="typescript"
                    filename="prompt-api.test.ts"
                    showCopyButton
                    showDownloadButton
                    showThemeToggle={false}
                    showLanguageBadge={false}
                    forceTheme="dark"
                  />
                </TabsContent>

                {/* Docs */}
                <TabsContent
                  value="docs"
                  className="mt-0 space-y-3 tab-content-enter"
                >
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Complete documentation and usage guide
                  </div>

                  <ThemedCodeBlock
                    code={docsCode}
                    language="markdown"
                    filename="README.md"
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
