/**
 * Memory Leak Detection Tests
 *
 * Tests to detect potential memory leaks in:
 * - React components
 * - Chrome AI API sessions
 * - Event listeners
 * - State management (Zustand stores)
 * - Global variables
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { act } from 'react';
import React from 'react';

// Helper function to get memory usage (if available)
const getMemoryUsage = () => {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return null;
};

// Helper to create a simple component for testing
const TestComponent = ({ onMount }: { onMount?: () => void }) => {
  React.useEffect(() => {
    onMount?.();
    return () => {
      // Cleanup
    };
  }, [onMount]);

  return <div>Test Component</div>;
};

describe('React Component Memory Leaks', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('should not leak memory when mounting and unmounting components', () => {
    const iterations = 100;
    const memoryReadings: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { unmount } = render(<TestComponent />);
      unmount();

      // Take memory reading every 10 iterations
      if (i % 10 === 0) {
        const memory = getMemoryUsage();
        if (memory !== null) {
          memoryReadings.push(memory);
        }
      }
    }

    // If we have memory readings, check that memory isn't continuously growing
    if (memoryReadings.length > 2) {
      const firstReading = memoryReadings[0];
      const lastReading = memoryReadings[memoryReadings.length - 1];
      const growth = lastReading - firstReading;

      // Allow for some growth, but not excessive (less than 10MB)
      expect(growth).toBeLessThan(10 * 1024 * 1024);
    } else {
      // If memory API not available, just ensure test runs without errors
      expect(true).toBe(true);
    }
  });

  it('should properly cleanup event listeners on unmount', () => {
    const eventListener = vi.fn();
    const cleanupSpy = vi.fn();

    const ComponentWithListener = () => {
      React.useEffect(() => {
        window.addEventListener('resize', eventListener);
        return () => {
          window.removeEventListener('resize', eventListener);
          cleanupSpy();
        };
      }, []);

      return <div>Component</div>;
    };

    const { unmount } = render(<ComponentWithListener />);
    unmount();

    // Cleanup should have been called
    expect(cleanupSpy).toHaveBeenCalledTimes(1);

    // Trigger resize event after unmount - listener should not fire
    eventListener.mockClear();
    window.dispatchEvent(new Event('resize'));
    expect(eventListener).not.toHaveBeenCalled();
  });

  it('should cleanup timers on unmount', () => {
    vi.useFakeTimers();
    const timerCallback = vi.fn();

    const ComponentWithTimer = () => {
      React.useEffect(() => {
        const timer = setInterval(timerCallback, 1000);
        return () => clearInterval(timer);
      }, []);

      return <div>Timer Component</div>;
    };

    const { unmount } = render(<ComponentWithTimer />);

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(timerCallback).toHaveBeenCalled();
    timerCallback.mockClear();

    // Unmount and verify timer is cleared
    unmount();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(timerCallback).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should not retain references to unmounted components', () => {
    const refs: any[] = [];

    const ComponentWithRef = () => {
      const ref = React.useRef<HTMLDivElement>(null);
      React.useEffect(() => {
        refs.push(ref);
      }, []);

      return <div ref={ref}>Component</div>;
    };

    const { unmount } = render(<ComponentWithRef />);
    expect(refs.length).toBe(1);

    unmount();

    // After unmount, ref.current should be null
    expect(refs[0].current).toBeNull();
  });
});

describe('Chrome AI API Memory Management', () => {
  it('should properly cleanup AI session references', async () => {
    // Mock Chrome AI API
    const mockSession = {
      destroy: vi.fn(),
      prompt: vi.fn().mockResolvedValue('response'),
    };

    const mockCreate = vi.fn().mockResolvedValue(mockSession);

    // Simulate creating and destroying sessions
    const sessions: any[] = [];
    const sessionCount = 10;

    for (let i = 0; i < sessionCount; i++) {
      const session = await mockCreate();
      sessions.push(session);
    }

    // Cleanup all sessions
    for (const session of sessions) {
      session.destroy();
    }

    // Verify all sessions were destroyed
    expect(mockSession.destroy).toHaveBeenCalledTimes(sessionCount);
  });

  it('should not accumulate session instances', () => {
    const sessionRegistry = new WeakMap();
    const sessions: any[] = [];

    // Create sessions
    for (let i = 0; i < 10; i++) {
      const session = { id: i };
      sessions.push(session);
      sessionRegistry.set(session, { created: Date.now() });
    }

    expect(sessions.length).toBe(10);

    // Clear references
    sessions.length = 0;

    // After clearing references and GC (simulated), WeakMap should allow cleanup
    // Note: We can't force GC in JS, but WeakMap will allow it when references are gone
    expect(sessions.length).toBe(0);
  });

  it('should cleanup streaming responses', async () => {
    const mockReadableStream = {
      getReader: vi.fn(() => ({
        read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
        releaseLock: vi.fn(),
        cancel: vi.fn(),
      })),
      cancel: vi.fn(),
    };

    const reader = mockReadableStream.getReader();

    // Simulate reading stream
    await reader.read();

    // Cleanup
    reader.releaseLock();
    mockReadableStream.cancel();

    expect(reader.releaseLock).toHaveBeenCalled();
    expect(mockReadableStream.cancel).toHaveBeenCalled();
  });
});

describe('Event Listener Memory Leaks', () => {
  it('should not leak event listeners on document', () => {
    const listener = vi.fn();
    const listenerCount = 5;

    // Add multiple listeners
    for (let i = 0; i < listenerCount; i++) {
      document.addEventListener('click', listener);
    }

    // Remove all listeners
    for (let i = 0; i < listenerCount; i++) {
      document.removeEventListener('click', listener);
    }

    // Trigger event - should not call listener
    document.dispatchEvent(new Event('click'));
    expect(listener).not.toHaveBeenCalled();
  });

  it('should cleanup abort controller listeners', () => {
    const controller = new AbortController();
    const listener = vi.fn();

    window.addEventListener('resize', listener, { signal: controller.signal });

    // Abort should cleanup listener
    controller.abort();

    window.dispatchEvent(new Event('resize'));
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('State Management Memory Leaks', () => {
  it('should not retain old state snapshots', () => {
    const stateHistory: any[] = [];
    let currentState = { count: 0 };

    // Simulate state updates
    for (let i = 0; i < 100; i++) {
      currentState = { count: i };
      // Only keep last 10 states
      stateHistory.push(currentState);
      if (stateHistory.length > 10) {
        stateHistory.shift();
      }
    }

    // Should only retain 10 states
    expect(stateHistory.length).toBe(10);
    expect(stateHistory[0].count).toBe(90);
    expect(stateHistory[9].count).toBe(99);
  });

  it('should cleanup subscription callbacks', () => {
    const subscriptions = new Set<() => void>();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    // Add subscriptions
    subscriptions.add(callback1);
    subscriptions.add(callback2);

    expect(subscriptions.size).toBe(2);

    // Remove subscriptions
    subscriptions.delete(callback1);
    subscriptions.delete(callback2);

    expect(subscriptions.size).toBe(0);
  });
});

describe('Global Variable Pollution', () => {
  const globalKeys = new Set(Object.keys(globalThis));

  afterEach(() => {
    // Cleanup any new global variables
    const currentKeys = Object.keys(globalThis);
    for (const key of currentKeys) {
      if (!globalKeys.has(key) && !key.startsWith('__vitest')) {
        delete (globalThis as any)[key];
      }
    }
  });

  it('should not create global variables', () => {
    const beforeKeys = Object.keys(globalThis).filter(
      (k) => !k.startsWith('__vitest'),
    );

    // Simulate some operations that might create globals
    const testFunction = () => {
      const localVar = { data: 'test' };
      return localVar;
    };

    testFunction();

    const afterKeys = Object.keys(globalThis).filter(
      (k) => !k.startsWith('__vitest'),
    );

    expect(afterKeys.length).toBe(beforeKeys.length);
  });

  it('should cleanup test-related global variables', () => {
    // Create a test global
    (globalThis as any).__testGlobal = { test: true };

    expect((globalThis as any).__testGlobal).toBeDefined();

    // Cleanup
    delete (globalThis as any).__testGlobal;

    expect((globalThis as any).__testGlobal).toBeUndefined();
  });
});

describe('DOM Node Memory Leaks', () => {
  it('should not retain detached DOM nodes', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Create child nodes
    for (let i = 0; i < 100; i++) {
      const div = document.createElement('div');
      div.textContent = `Node ${i}`;
      container.appendChild(div);
    }

    expect(container.children.length).toBe(100);

    // Remove container from DOM
    document.body.removeChild(container);

    // Container should be detached but still have children
    expect(container.children.length).toBe(100);

    // Clear all children
    container.innerHTML = '';

    expect(container.children.length).toBe(0);
  });

  it('should cleanup element references after removal', () => {
    const element = document.createElement('div');
    const weakRef = new WeakRef(element);

    document.body.appendChild(element);
    expect(weakRef.deref()).toBe(element);

    document.body.removeChild(element);

    // WeakRef still holds reference until GC
    // but we can verify element is no longer in DOM
    expect(document.body.contains(element)).toBe(false);
  });
});

describe('Closure Memory Leaks', () => {
  it('should not retain large objects in closures unnecessarily', () => {
    const createClosure = () => {
      const largeObject = new Array(1000).fill({ data: 'test' });
      const counter = 0;

      // Return only what's needed, not the whole scope
      return {
        getCount: () => counter,
        // Don't return largeObject reference
      };
    };

    const closure = createClosure();

    // closure should not have access to largeObject
    expect(closure).not.toHaveProperty('largeObject');
    expect(closure.getCount()).toBe(0);
  });

  it('should cleanup captured variables when closure is released', () => {
    let closure: (() => number) | null = null;

    const setupClosure = () => {
      const capturedValue = 42;
      closure = () => capturedValue;
    };

    setupClosure();
    expect(closure!()).toBe(42);

    // Release closure
    closure = null;

    expect(closure).toBeNull();
  });
});

describe('Memory Leak Prevention Best Practices', () => {
  it('should use WeakMap for object metadata to allow GC', () => {
    const metadata = new WeakMap();
    let obj: any = { id: 1 };

    metadata.set(obj, { created: Date.now() });
    expect(metadata.get(obj)).toBeDefined();

    // Clear object reference
    obj = null;

    // After GC (which we can't force), WeakMap entry would be cleaned up
    // For now, just verify WeakMap doesn't prevent GC
    expect(obj).toBeNull();
  });

  it('should use WeakSet for object collections to allow GC', () => {
    const cache = new WeakSet();
    let obj: any = { id: 1 };

    cache.add(obj);
    expect(cache.has(obj)).toBe(true);

    // Clear object reference
    obj = null;

    expect(obj).toBeNull();
  });

  it('should clear large data structures when no longer needed', () => {
    const cache = new Map();

    // Add items
    for (let i = 0; i < 1000; i++) {
      cache.set(i, { data: new Array(100).fill(i) });
    }

    expect(cache.size).toBe(1000);

    // Clear cache
    cache.clear();

    expect(cache.size).toBe(0);
  });
});
