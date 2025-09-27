/**
 * Code Templates for Chrome AI APIs
 * Template definitions for generating JavaScript and TypeScript code
 */

import type { CodeTemplate, ApiCodeExample } from '../types';

// Template engine helper function
export function renderTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

// JavaScript Templates
export const javascriptTemplates: Record<string, CodeTemplate> = {
  summarizer: {
    id: 'summarizer-js',
    name: 'Summarizer API - JavaScript',
    description: 'Generate text summaries using Chrome AI Summarizer',
    language: 'javascript',
    template: `// Chrome AI Summarizer Example
async function summarizeText() {
  try {
    // Check if Summarizer API is available
    if (typeof globalThis.Summarizer === 'undefined') {
      throw new Error('Summarizer API not available');
    }

    const summarizer = await globalThis.Summarizer.create({
      type: '{{summaryType}}',
      format: '{{outputFormat}}',
      length: '{{summaryLength}}'
    });

    const inputText = {{inputText}};
    const summary = await summarizer.summarize(inputText);

    console.log('Summary:', summary);
    return summary;
  } catch (error) {
    console.error('Summarization failed:', error);
    throw error;
  } finally {
    if (summarizer) {
      summarizer.destroy();
    }
  }
}

// Usage
summarizeText().then(result => {
  document.getElementById('output').textContent = result;
});`,
    variables: {
      summaryType: 'tl-dr',
      outputFormat: 'plain-text',
      summaryLength: 'medium',
      inputText: '"Your input text here..."'
    }
  },

  translator: {
    id: 'translator-js',
    name: 'Translator API - JavaScript',
    description: 'Translate text between languages using Chrome AI',
    language: 'javascript',
    template: `// Chrome AI Translator Example
async function translateText() {
  try {
    // Check if Translator API is available
    if (typeof globalThis.Translator === 'undefined') {
      throw new Error('Translator API not available');
    }

    const translator = await globalThis.Translator.create({
      sourceLanguage: '{{sourceLanguage}}',
      targetLanguage: '{{targetLanguage}}'
    });

    const inputText = {{inputText}};
    const translation = await translator.translate(inputText);

    console.log('Translation:', translation);
    return translation;
  } catch (error) {
    console.error('Translation failed:', error);
    throw error;
  } finally {
    if (translator) {
      translator.destroy();
    }
  }
}

// Usage
translateText().then(result => {
  document.getElementById('output').textContent = result;
});`,
    variables: {
      sourceLanguage: 'en',
      targetLanguage: 'es',
      inputText: '"Hello, how are you today?"'
    }
  },

  prompt: {
    id: 'prompt-js',
    name: 'Prompt API - JavaScript',
    description: 'Generate AI responses using Chrome AI Language Model',
    language: 'javascript',
    template: `// Chrome AI Prompt API Example
async function generateResponse() {
  try {
    // Check if Language Model API is available
    if (typeof globalThis.LanguageModel === 'undefined') {
      throw new Error('Language Model API not available');
    }

    const session = await globalThis.LanguageModel.create({
      systemPrompt: {{systemPrompt}}
    });

    const userPrompt = {{userPrompt}};
    const response = await session.prompt(userPrompt);

    console.log('AI Response:', response);
    return response;
  } catch (error) {
    console.error('Prompt generation failed:', error);
    throw error;
  } finally {
    if (session) {
      session.destroy();
    }
  }
}

// Usage
generateResponse().then(result => {
  document.getElementById('output').textContent = result;
});`,
    variables: {
      systemPrompt: '"You are a helpful assistant."',
      userPrompt: '"Explain quantum computing in simple terms."'
    }
  }
};

// TypeScript Templates
export const typescriptTemplates: Record<string, CodeTemplate> = {
  summarizer: {
    id: 'summarizer-ts',
    name: 'Summarizer API - TypeScript',
    description: 'Generate text summaries using Chrome AI Summarizer with full type safety',
    language: 'typescript',
    template: `// Chrome AI Summarizer Example with TypeScript
interface SummarizerOptions {
  type: 'key-points' | 'tl-dr' | 'teaser' | 'headline';
  format: 'plain-text' | 'markdown';
  length: 'short' | 'medium' | 'long';
}

interface Summarizer {
  summarize(input: string): Promise<string>;
  destroy(): void;
}

declare global {
  const Summarizer: {
    create(options: SummarizerOptions): Promise<Summarizer>;
  };
}

async function summarizeText(): Promise<string> {
  let summarizer: Summarizer | null = null;

  try {
    // Check if Summarizer API is available
    if (typeof globalThis.Summarizer === 'undefined') {
      throw new Error('Summarizer API not available');
    }

    summarizer = await globalThis.Summarizer.create({
      type: '{{summaryType}}' as const,
      format: '{{outputFormat}}' as const,
      length: '{{summaryLength}}' as const
    });

    const inputText: string = {{inputText}};
    const summary: string = await summarizer.summarize(inputText);

    console.log('Summary:', summary);
    return summary;
  } catch (error) {
    console.error('Summarization failed:', error);
    throw error;
  } finally {
    if (summarizer) {
      summarizer.destroy();
    }
  }
}

// Usage with proper error handling
summarizeText()
  .then((result: string) => {
    const outputElement = document.getElementById('output');
    if (outputElement) {
      outputElement.textContent = result;
    }
  })
  .catch((error: Error) => {
    console.error('Failed to summarize:', error.message);
  });`,
    variables: {
      summaryType: 'tl-dr',
      outputFormat: 'plain-text',
      summaryLength: 'medium',
      inputText: '"Your input text here..."'
    }
  },

  translator: {
    id: 'translator-ts',
    name: 'Translator API - TypeScript',
    description: 'Translate text between languages with full type safety',
    language: 'typescript',
    template: `// Chrome AI Translator Example with TypeScript
interface TranslatorOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

interface Translator {
  translate(input: string): Promise<string>;
  destroy(): void;
}

declare global {
  const Translator: {
    create(options: TranslatorOptions): Promise<Translator>;
  };
}

async function translateText(): Promise<string> {
  let translator: Translator | null = null;

  try {
    // Check if Translator API is available
    if (typeof globalThis.Translator === 'undefined') {
      throw new Error('Translator API not available');
    }

    translator = await globalThis.Translator.create({
      sourceLanguage: '{{sourceLanguage}}',
      targetLanguage: '{{targetLanguage}}'
    });

    const inputText: string = {{inputText}};
    const translation: string = await translator.translate(inputText);

    console.log('Translation:', translation);
    return translation;
  } catch (error) {
    console.error('Translation failed:', error);
    throw error;
  } finally {
    if (translator) {
      translator.destroy();
    }
  }
}

// Usage with proper error handling
translateText()
  .then((result: string) => {
    const outputElement = document.getElementById('output');
    if (outputElement) {
      outputElement.textContent = result;
    }
  })
  .catch((error: Error) => {
    console.error('Translation failed:', error.message);
  });`,
    variables: {
      sourceLanguage: 'en',
      targetLanguage: 'es',
      inputText: '"Hello, how are you today?"'
    }
  },

  prompt: {
    id: 'prompt-ts',
    name: 'Prompt API - TypeScript',
    description: 'Generate AI responses using Chrome AI Language Model with type safety',
    language: 'typescript',
    template: `// Chrome AI Prompt API Example with TypeScript
interface LanguageModelOptions {
  systemPrompt?: string;
}

interface LanguageModelSession {
  prompt(input: string): Promise<string>;
  destroy(): void;
}

declare global {
  const LanguageModel: {
    create(options?: LanguageModelOptions): Promise<LanguageModelSession>;
  };
}

async function generateResponse(): Promise<string> {
  let session: LanguageModelSession | null = null;

  try {
    // Check if Language Model API is available
    if (typeof globalThis.LanguageModel === 'undefined') {
      throw new Error('Language Model API not available');
    }

    session = await globalThis.LanguageModel.create({
      systemPrompt: {{systemPrompt}}
    });

    const userPrompt: string = {{userPrompt}};
    const response: string = await session.prompt(userPrompt);

    console.log('AI Response:', response);
    return response;
  } catch (error) {
    console.error('Prompt generation failed:', error);
    throw error;
  } finally {
    if (session) {
      session.destroy();
    }
  }
}

// Usage with proper error handling
generateResponse()
  .then((result: string) => {
    const outputElement = document.getElementById('output');
    if (outputElement) {
      outputElement.textContent = result;
    }
  })
  .catch((error: Error) => {
    console.error('AI generation failed:', error.message);
  });`,
    variables: {
      systemPrompt: '"You are a helpful assistant."',
      userPrompt: '"Explain quantum computing in simple terms."'
    }
  }
};

// Combined template collections
export const allTemplates = {
  javascript: javascriptTemplates,
  typescript: typescriptTemplates
};

// API Examples for documentation
export const apiExamples: Record<string, ApiCodeExample> = {
  summarizer: {
    apiName: 'Summarizer',
    description: 'Condense long text into key points or brief summaries',
    inputExample: 'Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals...',
    outputExample: 'AI is machine intelligence that contrasts with natural intelligence from humans and animals.'
  },
  translator: {
    apiName: 'Translator',
    description: 'Translate text between different languages',
    inputExample: 'Hello, how are you today?',
    outputExample: 'Hola, ¿cómo estás hoy?'
  },
  prompt: {
    apiName: 'Prompt API',
    description: 'Generate AI responses to text prompts',
    inputExample: 'Explain quantum computing in simple terms',
    outputExample: 'Quantum computing uses quantum mechanics principles to process information in ways that could solve certain problems much faster than classical computers.'
  }
};