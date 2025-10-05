import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Chrome AI APIs for testing using the new global structure
Object.defineProperty(globalThis, 'Summarizer', {
  writable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
  },
});

Object.defineProperty(globalThis, 'Translator', {
  writable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
  },
});

Object.defineProperty(globalThis, 'Writer', {
  writable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
  },
});

Object.defineProperty(globalThis, 'Rewriter', {
  writable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
  },
});

Object.defineProperty(globalThis, 'Proofreader', {
  writable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
  },
});

Object.defineProperty(globalThis, 'LanguageModel', {
  writable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
  },
});

Object.defineProperty(globalThis, 'LanguageDetector', {
  writable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
  },
});

// Mock performance.now for testing
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
  },
});

// Set lang attribute for accessibility tests
if (document.documentElement) {
  document.documentElement.setAttribute('lang', 'en');
}
