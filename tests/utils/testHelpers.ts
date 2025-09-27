/**
 * Test Helpers and Utilities
 * Common utilities for testing across the application
 */

import { vi } from 'vitest';
import type { ApiResult } from '@/stores/appStore';

// Helper to create valid ApiResult objects
export const createMockApiResult = (overrides: Partial<ApiResult> = {}): ApiResult => ({
  data: "Mock API response data",
  error: null,
  latency: 150,
  timestamp: Date.now(),
  ...overrides
});

// Helper to create error ApiResult objects
export const createMockApiError = (errorMessage: string = "Mock API error", latency: number = 100): ApiResult => ({
  data: null,
  error: errorMessage,
  latency,
  timestamp: Date.now()
});

// Helper to wait for async operations in tests
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to create mock promise that resolves after specified time
export const createTimedPromise = <T>(value: T, delay: number = 100): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(value), delay));

// Helper to create mock promise that rejects after specified time
export const createTimedRejection = (error: string | Error, delay: number = 100): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(typeof error === 'string' ? new Error(error) : error), delay));

// Mock console methods to avoid test output pollution
export const mockConsole = () => {
  const originalConsole = { ...console };

  const mocks = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  };

  Object.assign(console, mocks);

  return {
    mocks,
    restore: () => Object.assign(console, originalConsole)
  };
};

// Helper to test async functions that should throw
export const expectAsyncError = async (asyncFn: () => Promise<any>, expectedError?: string) => {
  let error: Error | null = null;

  try {
    await asyncFn();
  } catch (e) {
    error = e as Error;
  }

  expect(error).toBeTruthy();
  if (expectedError) {
    expect(error?.message).toContain(expectedError);
  }
};

// Helper to verify timing measurements
export const verifyTiming = (actual: number, expected: number, tolerance: number = 10) => {
  expect(actual).toBeGreaterThanOrEqual(expected - tolerance);
  expect(actual).toBeLessThanOrEqual(expected + tolerance);
};

// Helper to create mock store state
export const createMockStoreState = (overrides: any = {}) => ({
  activeApi: 'summarizer',
  codeLanguage: 'ts' as const,
  apiResult: null,
  isLoading: false,
  aiCapabilities: null,
  lastInputText: '',
  theme: 'system' as const,
  ...overrides
});

// Helper to test Zod schema validation
export const testZodSchema = (schema: any, validData: any, invalidData: any[]) => {
  // Test valid data
  expect(() => schema.parse(validData)).not.toThrow();

  // Test invalid data cases
  invalidData.forEach((data, index) => {
    expect(() => schema.parse(data)).toThrow(`Invalid data case ${index + 1}`);
  });
};

// Helper for testing React hooks
export const renderHookWithCleanup = <T>(hook: () => T) => {
  let result: T;
  let cleanup: (() => void) | undefined;

  const TestComponent = () => {
    result = hook();
    return null;
  };

  // This would typically use @testing-library/react-hooks or similar
  // For now, providing the structure for when implemented
  return {
    result: () => result!,
    cleanup: () => cleanup?.()
  };
};

// Helper to generate test IDs
export const generateTestId = (component: string, element?: string, modifier?: string) => {
  const parts = [component, element, modifier].filter(Boolean);
  return `test-${parts.join('-')}`;
};

// Helper for retry logic in tests
export const retryUntil = async <T>(
  fn: () => T | Promise<T>,
  condition: (result: T) => boolean,
  maxAttempts: number = 5,
  delay: number = 100
): Promise<T> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await fn();

    if (condition(result)) {
      return result;
    }

    if (attempt < maxAttempts) {
      await waitFor(delay);
    }
  }

  throw new Error(`Condition not met after ${maxAttempts} attempts`);
};

// Helper to test function call counts and arguments
export const verifyMockCalls = (mockFn: any, expectedCalls: any[][]) => {
  expect(mockFn).toHaveBeenCalledTimes(expectedCalls.length);

  expectedCalls.forEach((expectedArgs, index) => {
    expect(mockFn).toHaveBeenNthCalledWith(index + 1, ...expectedArgs);
  });
};

// Helper to create performance benchmark tests
export const benchmarkFunction = async (
  fn: () => Promise<any> | any,
  iterations: number = 10
): Promise<{ average: number; min: number; max: number; times: number[] }> => {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  return {
    times,
    average: times.reduce((sum, time) => sum + time, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times)
  };
};

// Helper to test error boundaries
export const createErrorBoundaryTest = (errorComponent: any) => {
  const mockError = new Error('Test error');
  let errorInfo: any = null;

  const ErrorBoundaryWrapper = ({ children }: { children: React.ReactNode }) => {
    try {
      return <>{children}</>;
    } catch (error) {
      errorInfo = error;
      return <div>Error caught</div>;
    }
  };

  return { ErrorBoundaryWrapper, mockError, getErrorInfo: () => errorInfo };
};

// Test data generators
export const testDataGenerators = {
  // Generate random string of specified length
  randomString: (length: number = 10): string =>
    Math.random().toString(36).substring(2, length + 2),

  // Generate random number within range
  randomNumber: (min: number = 0, max: number = 100): number =>
    Math.floor(Math.random() * (max - min + 1)) + min,

  // Generate random boolean
  randomBoolean: (): boolean => Math.random() > 0.5,

  // Generate random array of specified length
  randomArray: <T>(generator: () => T, length: number = 5): T[] =>
    Array.from({ length }, generator),

  // Generate random object with specified keys
  randomObject: (keys: string[]): Record<string, any> =>
    keys.reduce((obj, key) => ({ ...obj, [key]: testDataGenerators.randomString() }), {})
};