import { z } from 'zod';
import {
  isSummarizerSupported,
  isRewriterSupported,
  isWriterSupported,
  isLanguageModelSupported,
  isTranslatorSupported,
  isLanguageDetectorSupported,
} from '@/types/global';
import { TODO_TYPE } from '../types/global';

// Type definitions for AI API responses
export interface AiResponse<T = TODO_TYPE> {
  data: T | null;
  error: string | null;
  latency: number;
}

// Chrome AI API method parameters
export interface SummarizerOptions {
  input: string;
  type?: 'key-points' | 'tl-dr' | 'teaser' | 'headline';
  format?: 'plain-text' | 'markdown';
  length?: 'short' | 'medium' | 'long';
}

export interface TranslatorOptions {
  input: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

export interface WriterOptions {
  input: string;
  tone?: 'formal' | 'casual' | 'neutral';
  format?: 'plain-text' | 'markdown';
  length?: 'short' | 'medium' | 'long';
}

export interface RewriterOptions {
  input: string;
  tone?: 'as-is' | 'more-formal' | 'more-casual';
  format?: 'as-is' | 'plain-text' | 'markdown';
  length?: 'as-is' | 'shorter' | 'longer';
}

export interface ProofreaderOptions {
  input: string;
}

export interface PromptOptions {
  input: string;
  context?: string;
  systemPrompt?: string;
}

// Validation schemas
const AiResponseSchema = z.object({
  data: z.union([z.unknown(), z.null()]),
  error: z.string().nullable(),
  latency: z.number().min(0),
});

/**
 * Checks for Chrome AI availability using the new API structure
 */
export function isAiAvailable(): boolean {
  return (
    isSummarizerSupported() ||
    isRewriterSupported() ||
    isWriterSupported() ||
    isLanguageModelSupported() ||
    isTranslatorSupported() ||
    isLanguageDetectorSupported()
  );
}

/**
 * A generic function to handle any AI API call with timing and error handling
 */
export async function runAiTask<T>(
  taskName: string,
  task: () => Promise<T>,
): Promise<AiResponse<T>> {
  const startTime = performance.now();

  try {
    if (!isAiAvailable()) {
      throw new Error(
        'Chrome AI APIs not available. Please use Chrome 138+ with AI features enabled.',
      );
    }

    const result = await task();
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    const response: AiResponse<T> = {
      data: result,
      error: null,
      latency,
    };

    // Validate response structure
    AiResponseSchema.parse(response);
    return response;
  } catch (error) {
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    console.error(`AI Task "${taskName}" failed:`, error);

    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      latency,
    };
  }
}

/**
 * Summarizer API wrapper
 */
export async function summarizeText(
  options: SummarizerOptions,
): Promise<AiResponse<string>> {
  return runAiTask('summarizeText', async () => {
    if (!isSummarizerSupported()) {
      throw new Error('Summarizer API not available');
    }

    const summarizerClass = (globalThis as TODO_TYPE).Summarizer;
    const summarizer = await summarizerClass.create({
      type: options.type || 'tl-dr',
      format: options.format || 'plain-text',
      length: options.length || 'medium',
    });

    try {
      const result = await summarizer.summarize(options.input);
      return result;
    } finally {
      summarizer.destroy();
    }
  });
}

/**
 * Translator API wrapper
 */
export async function translateText(
  options: TranslatorOptions,
): Promise<AiResponse<string>> {
  return runAiTask('translateText', async () => {
    if (!isTranslatorSupported()) {
      throw new Error('Translator API not available');
    }

    const translatorClass = (globalThis as TODO_TYPE).Translator;
    const translator = await translatorClass.create({
      sourceLanguage: options.sourceLanguage || 'en',
      targetLanguage: options.targetLanguage,
    });

    try {
      const result = await translator.translate(options.input);
      return result;
    } finally {
      translator.destroy();
    }
  });
}

/**
 * Writer API wrapper
 */
export async function generateText(
  options: WriterOptions,
): Promise<AiResponse<string>> {
  return runAiTask('generateText', async () => {
    if (!isWriterSupported()) {
      throw new Error('Writer API not available');
    }

    const writerClass = (globalThis as TODO_TYPE).Writer;
    const writer = await writerClass.create({
      tone: options.tone || 'neutral',
      format: options.format || 'plain-text',
      length: options.length || 'medium',
    });

    try {
      const result = await writer.write(options.input);
      return result;
    } finally {
      writer.destroy();
    }
  });
}

/**
 * Rewriter API wrapper
 */
export async function rewriteText(
  options: RewriterOptions,
): Promise<AiResponse<string>> {
  return runAiTask('rewriteText', async () => {
    if (!isRewriterSupported()) {
      throw new Error('Rewriter API not available');
    }

    const rewriterClass = (globalThis as TODO_TYPE).Rewriter;
    const rewriter = await rewriterClass.create({
      tone: options.tone || 'as-is',
      format: options.format || 'as-is',
      length: options.length || 'as-is',
    });

    try {
      const result = await rewriter.rewrite(options.input);
      return result;
    } finally {
      rewriter.destroy();
    }
  });
}

/**
 * Proofreader API wrapper
 */
export async function proofreadText(
  options: ProofreaderOptions,
): Promise<AiResponse<string>> {
  return runAiTask('proofreadText', async () => {
    // Proofreader API might not be available yet, check for it
    const proofreaderClass = (globalThis as TODO_TYPE).Proofreader;
    if (!proofreaderClass) {
      throw new Error('Proofreader API not available');
    }

    const proofreader = await proofreaderClass.create();

    try {
      const result = await proofreader.proofread(options.input);
      return result;
    } finally {
      proofreader.destroy();
    }
  });
}

/**
 * Prompt API wrapper (Language Model)
 */
export async function generatePrompt(
  options: PromptOptions,
): Promise<AiResponse<string>> {
  return runAiTask('generatePrompt', async () => {
    if (!isLanguageModelSupported()) {
      throw new Error('Prompt API (Language Model) not available');
    }

    const languageModelClass = (globalThis as TODO_TYPE).LanguageModel;
    const session = await languageModelClass.create({
      systemPrompt: options.systemPrompt,
    });

    try {
      const prompt = options.context
        ? `Context: ${options.context}\n\nInput: ${options.input}`
        : options.input;

      const result = await session.prompt(prompt);
      return result;
    } finally {
      session.destroy();
    }
  });
}

/**
 * Language Detection API wrapper
 */
export async function detectLanguage(
  text: string,
): Promise<AiResponse<string>> {
  return runAiTask('detectLanguage', async () => {
    if (!isLanguageDetectorSupported()) {
      throw new Error('Language Detection API not available');
    }

    const languageDetectorClass = (globalThis as TODO_TYPE).LanguageDetector;
    const detector = await languageDetectorClass.create();

    try {
      const results = await detector.detect(text);
      // Return the most confident result
      const topResult = results[0];
      return topResult?.detectedLanguage || 'unknown';
    } finally {
      detector.destroy();
    }
  });
}

/**
 * Simulate API error for testing error handling
 */
export async function simulateError(): Promise<AiResponse<never>> {
  return runAiTask('simulateError', async () => {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
    throw new Error('Simulated API error for testing purposes');
  });
}

/**
 * Test AI API availability
 */
export async function testAiAvailability() {
  const checkCapability = async (
    apiName: string,
    checkFunction: () => boolean,
  ) => {
    try {
      console.log(`Checking availability for ${apiName}...`);
      if (!checkFunction()) return 'unavailable';
      // For now, assume it's available if the support check passes
      return 'available';
    } catch {
      return 'unavailable';
    }
  };

  const [
    summarizer,
    translator,
    writer,
    rewriter,
    proofreader,
    prompt,
    languageDetection,
  ] = await Promise.allSettled([
    checkCapability('Summarizer', isSummarizerSupported),
    checkCapability('Translator', isTranslatorSupported),
    checkCapability('Writer', isWriterSupported),
    checkCapability('Rewriter', isRewriterSupported),
    checkCapability(
      'Proofreader',
      () => typeof (globalThis as TODO_TYPE).Proofreader !== 'undefined',
    ),
    checkCapability('LanguageModel', isLanguageModelSupported),
    checkCapability('LanguageDetector', isLanguageDetectorSupported),
  ]);

  return {
    summarizer:
      summarizer.status === 'fulfilled' ? summarizer.value : 'unavailable',
    translator:
      translator.status === 'fulfilled' ? translator.value : 'unavailable',
    writer: writer.status === 'fulfilled' ? writer.value : 'unavailable',
    rewriter: rewriter.status === 'fulfilled' ? rewriter.value : 'unavailable',
    proofreader:
      proofreader.status === 'fulfilled' ? proofreader.value : 'unavailable',
    prompt: prompt.status === 'fulfilled' ? prompt.value : 'unavailable',
    languageDetection:
      languageDetection.status === 'fulfilled'
        ? languageDetection.value
        : 'unavailable',
  };
}
