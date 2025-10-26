import '@testing-library/jest-dom';
import { vi, expect } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

// Register toHaveNoViolations matcher
expect.extend(matchers);

// jsdom polyfills for browser APIs
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock HTMLElement.scrollIntoView
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = vi.fn();
}

// Mock HTMLCanvasElement.getContext for color contrast tests
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
    })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
    })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  })) as unknown as CanvasRenderingContext2D;
}

// Mock Chrome AI APIs for testing using the new global structure
Object.defineProperty(globalThis, 'Summarizer', {
  writable: true,
  configurable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
    availability: vi.fn().mockResolvedValue('available'),
  },
});

Object.defineProperty(globalThis, 'Translator', {
  writable: true,
  configurable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
    availability: vi.fn().mockResolvedValue('available'),
  },
});

Object.defineProperty(globalThis, 'Writer', {
  writable: true,
  configurable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
    availability: vi.fn().mockResolvedValue('available'),
  },
});

Object.defineProperty(globalThis, 'Rewriter', {
  writable: true,
  configurable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
    availability: vi.fn().mockResolvedValue('available'),
  },
});

Object.defineProperty(globalThis, 'Proofreader', {
  writable: true,
  configurable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
    availability: vi.fn().mockResolvedValue('available'),
  },
});

Object.defineProperty(globalThis, 'LanguageModel', {
  writable: true,
  configurable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
    availability: vi.fn().mockResolvedValue('available'),
  },
});

Object.defineProperty(globalThis, 'LanguageDetector', {
  writable: true,
  configurable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
    availability: vi.fn().mockResolvedValue('available'),
  },
});

// Mock WriterAPI (used by some components)
Object.defineProperty(globalThis, 'WriterAPI', {
  writable: true,
  configurable: true,
  value: {
    create: vi.fn(),
    capabilities: vi.fn(),
    availability: vi.fn().mockResolvedValue('available'),
  },
});

// Mock ai global object (new Chrome AI API structure)
Object.defineProperty(globalThis, 'ai', {
  writable: true,
  configurable: true,
  value: {
    summarizer: {
      create: vi.fn(),
      capabilities: vi.fn(),
      availability: vi.fn().mockResolvedValue('available'),
    },
    translator: {
      create: vi.fn(),
      capabilities: vi.fn(),
      availability: vi.fn().mockResolvedValue('available'),
    },
    writer: {
      create: vi.fn(),
      capabilities: vi.fn(),
      availability: vi.fn().mockResolvedValue('available'),
    },
    rewriter: {
      create: vi.fn(),
      capabilities: vi.fn(),
      availability: vi.fn().mockResolvedValue('available'),
    },
    languageModel: {
      create: vi.fn(),
      capabilities: vi.fn(),
      availability: vi.fn().mockResolvedValue('available'),
    },
    languageDetector: {
      create: vi.fn(),
      capabilities: vi.fn(),
      availability: vi.fn().mockResolvedValue('available'),
    },
  },
});

// Mock performance.now for testing
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
  },
});

// Mock window.getComputedStyle for jsdom
if (!window.getComputedStyle) {
  window.getComputedStyle = vi.fn((_element: Element) => {
    return {
      getPropertyValue: vi.fn((prop: string) => {
        // Return sensible defaults for common properties
        const defaults: Record<string, string> = {
          display: 'block',
          visibility: 'visible',
          opacity: '1',
          outline: '2px solid blue',
          outlineWidth: '2px',
          boxShadow: 'none',
          backgroundColor: 'rgb(255, 255, 255)',
          color: 'rgb(0, 0, 0)',
          padding: '0px',
          paddingTop: '0px',
          paddingBottom: '0px',
        };
        return defaults[prop] || '';
      }),
      // Add common properties
      display: 'block',
      visibility: 'visible',
      opacity: '1',
      outline: '2px solid blue',
      outlineWidth: '2px',
      boxShadow: 'none',
      backgroundColor: 'rgb(255, 255, 255)',
      color: 'rgb(0, 0, 0)',
      padding: '0px',
      paddingTop: '0px',
      paddingBottom: '0px',
    } as CSSStyleDeclaration;
  }) as unknown as typeof window.getComputedStyle;
}

// Set lang attribute for accessibility tests
if (document.documentElement) {
  document.documentElement.setAttribute('lang', 'en');
}

// Mock ReadableStream for streaming tests
if (typeof ReadableStream === 'undefined') {
  class MockReadableStream {
    constructor(private source: { chunks?: unknown[] } | unknown) {}

    getReader() {
      const chunks =
        (this.source as { chunks?: unknown[] }).chunks || ([] as unknown[]);
      let index = 0;

      return {
        async read() {
          if (index < chunks.length) {
            return { value: chunks[index++], done: false };
          }
          return { value: undefined, done: true };
        },
        releaseLock() {},
        cancel() {},
      };
    }

    [Symbol.asyncIterator]() {
      const reader = this.getReader();
      return {
        async next() {
          const { value, done } = await reader.read();
          return { value, done };
        },
        async return() {
          reader.releaseLock();
          return { value: undefined, done: true };
        },
      };
    }
  }

  (global as unknown as { ReadableStream: unknown }).ReadableStream =
    MockReadableStream;
}
