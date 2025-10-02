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
  PlaygroundComponent: ComponentType<any>;

  /** Advanced features component */
  AdvancedComponent?: ComponentType<any>;

  /** Code examples component */
  CodeComponent?: ComponentType<any>;

  /** Is currently available/implemented */
  available: boolean;
}

// ============================================================================
// API Modules
// ============================================================================

// Import Summarizer components lazily
import {
  PlaygroundTab as SummarizerPlayground,
  AdvancedTab as SummarizerAdvanced,
  CodeTab as SummarizerCode,
} from './summarizer';

/**
 * Registry of all available API modules
 */
export const API_MODULES: Record<string, APIModule> = {
  summarizer: {
    id: 'summarizer',
    name: 'Summarizer API',
    description: 'Content summarization and condensation with advanced chunking',
    category: 'text',
    PlaygroundComponent: SummarizerPlayground,
    AdvancedComponent: SummarizerAdvanced,
    CodeComponent: SummarizerCode,
    available: true,
  },

  // Placeholders for future API modules
  translator: {
    id: 'translator',
    name: 'Translator API',
    description: 'Real-time language translation',
    category: 'language',
    PlaygroundComponent: () => null, // TODO: Implement
    available: false,
  },

  writer: {
    id: 'writer',
    name: 'Writer API',
    description: 'Content generation and creative writing',
    category: 'text',
    PlaygroundComponent: () => null, // TODO: Implement
    available: false,
  },

  rewriter: {
    id: 'rewriter',
    name: 'Rewriter API',
    description: 'Content restructuring and style adaptation',
    category: 'text',
    PlaygroundComponent: () => null, // TODO: Implement
    available: false,
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
  return Object.values(API_MODULES).filter(module => module.available);
}

/**
 * Get modules by category
 */
export function getModulesByCategory(category: APIModule['category']): APIModule[] {
  return Object.values(API_MODULES).filter(module => module.category === category);
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
