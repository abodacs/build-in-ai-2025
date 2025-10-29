/**
 * API Modules Registry
 *
 * Central registry for all Chrome AI API modules in the unified playground
 * Provides type-safe API configuration and component mapping
 *
 * @module api-modules
 */

import type { ComponentType } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for API playground components
 */
export interface PlaygroundComponentProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * API Module Configuration
 */
export interface APIModule {
  /** Unique API identifier */
  id: string;

  /** Display name */
  name: string;

  /** Short description */
  description: string;

  /** API category */
  category: 'text' | 'language' | 'multimodal';

  /** Main playground component */
  PlaygroundComponent: ComponentType<PlaygroundComponentProps>;

  /** Advanced features component */
  AdvancedComponent?: ComponentType<PlaygroundComponentProps>;

  /** Code examples component */
  CodeComponent?: ComponentType<PlaygroundComponentProps>;

  /** Is currently available/implemented */
  available: boolean;
}

// ============================================================================
// API Modules
// ============================================================================

// Import API playground components
import { SummarizerPlayground } from './summarizer';
import { TranslatorPlayground } from './translator';
import { PlaygroundTab as WriterPlayground } from './writer/components/tabs';
import { RewriterMain as RewriterPlayground } from './rewriter/components';
import { ProofreaderMain } from './proofreader/components/tabs/PlaygroundTab';
import { LanguageDetectionMain } from './language-detection/components/tabs/PlaygroundTab';
import { PlaygroundTab as PromptPlaygroundRaw } from './prompt/components/tabs/PlaygroundTab';
import { ErrorBoundary } from '@/components/common/error-boundary/ErrorBoundary';
import React from 'react';

// Fallback component for Prompt Playground errors
const PromptPlaygroundFallback = ({
  error,
  resetError,
}: {
  error?: Error;
  resetError: () => void;
}) => (
  <div className="p-6">
    <h2 className="text-lg font-semibold text-destructive">
      Prompt Playground Error
    </h2>
    <p className="text-sm text-muted-foreground mt-2">
      {error?.message || 'An unexpected error occurred'}
    </p>
    <button
      onClick={resetError}
      className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
    >
      Reset
    </button>
  </div>
);

// Wrap Prompt Playground with ErrorBoundary
const PromptPlayground: React.FC<PlaygroundComponentProps> = () => (
  <ErrorBoundary fallback={PromptPlaygroundFallback}>
    <PromptPlaygroundRaw />
  </ErrorBoundary>
);

/**
 * Registry of all available API modules
 */
export const API_MODULES: Record<string, APIModule> = {
  summarizer: {
    id: 'summarizer',
    name: 'Summarizer API',
    description:
      'Content summarization and condensation with advanced chunking',
    category: 'text',
    PlaygroundComponent: SummarizerPlayground,
    available: true,
  },

  translator: {
    id: 'translator',
    name: 'Translator API',
    description:
      'Real-time on-device language translation with streaming support',
    category: 'language',
    PlaygroundComponent: TranslatorPlayground,
    available: true,
  },

  writer: {
    id: 'writer',
    name: 'Writer API',
    description: 'Content generation and creative writing',
    category: 'text',
    PlaygroundComponent: WriterPlayground,
    available: true,
  },

  rewriter: {
    id: 'rewriter',
    name: 'Rewriter API',
    description: 'Content restructuring and style adaptation',
    category: 'text',
    PlaygroundComponent: RewriterPlayground,
    available: true,
  },

  proofreader: {
    id: 'proofreader',
    name: 'Proofreader API',
    description: 'Grammar and writing improvement with correction suggestions',
    category: 'text',
    PlaygroundComponent: ProofreaderMain,
    available: true,
  },

  'language-detection': {
    id: 'language-detection',
    name: 'Language Detection',
    description: 'Automatic language identification with confidence scores',
    category: 'language',
    PlaygroundComponent: LanguageDetectionMain,
    available: true,
  },

  prompt: {
    id: 'prompt',
    name: 'Prompt API',
    description: 'Flexible AI prompting with multimodal support',
    category: 'multimodal',
    PlaygroundComponent: PromptPlayground,
    available: true,
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get API module by ID
 */
export function getAPIModule(id: string): APIModule | undefined {
  return API_MODULES[id];
}

/**
 * Get all available API modules
 */
export function getAvailableModules(): APIModule[] {
  return Object.values(API_MODULES).filter((module) => module.available);
}

/**
 * Get modules by category
 */
export function getModulesByCategory(
  category: APIModule['category'],
): APIModule[] {
  return Object.values(API_MODULES).filter(
    (module) => module.category === category,
  );
}

/**
 * Check if API module exists and is available
 */
export function isModuleAvailable(id: string): boolean {
  const module = API_MODULES[id];
  return module?.available ?? false;
}

// ============================================================================
// Exports
// ============================================================================

export default API_MODULES;
