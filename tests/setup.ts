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

global.ResizeObserver = ResizeObserverMock as any;

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
  })) as any;
}

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
