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
    description: 'Grammar and writing improvement',
    category: 'text',
    PlaygroundComponent: () => null, // TODO: Implement
    available: false,
  },

  prompt: {
    id: 'prompt',
    name: 'Prompt API',
    description: 'Flexible AI prompting with multimodal support',
    category: 'multimodal',
    PlaygroundComponent: () => null, // TODO: Implement
    available: false,
  },

  'language-detection': {
    id: 'language-detection',
    name: 'Language Detection',
    description: 'Automatic language identification',
    category: 'language',
    PlaygroundComponent: () => null, // TODO: Implement
    available: false,
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
