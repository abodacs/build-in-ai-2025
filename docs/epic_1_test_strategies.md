# Epic 1: Enhanced API Service Layer - Test Strategies

## Overview
This document outlines comprehensive testing strategies for Epic 1 (Enhanced API Service Layer), covering all components, functions, and edge cases to ensure 90%+ test coverage and production readiness.

## Components Under Test

### 1. Core Service Layer (`src/services/aiService.ts`)
- ✅ **Function Coverage**: 13 functions to test
- ✅ **Error Scenarios**: API unavailability, runtime errors, validation failures
- ✅ **Performance Testing**: Timing accuracy, latency measurement
- ✅ **Type Safety**: TypeScript interface compliance

### 2. Type Definitions & Availability (`src/types/global.d.ts`)
- ✅ **Availability Detection**: 7 API availability functions
- ✅ **Browser Compatibility**: Feature detection across environments
- ✅ **Type Guards**: Runtime type checking functions

### 3. State Management (`src/stores/appStore.ts`)
- ✅ **Zustand Store**: Actions, selectors, state updates
- ✅ **Zod Validation**: Runtime schema validation
- ✅ **Error Handling**: Invalid state transitions

## Test Categories

### 🧪 Unit Tests (90%+ Coverage Target)

#### A. API Service Functions (`aiService.test.ts`)

**1. Generic Task Runner (`runAiTask`)**
```typescript
describe('runAiTask', () => {
  // ✅ Success scenarios
  test('should execute task successfully and return AiResponse', async () => {
    // Mock successful task execution
    // Verify timing, data structure, error handling
  });

  // ✅ Error scenarios
  test('should handle task failures and return error response', async () => {
    // Mock task that throws error
    // Verify error capture, timing, structured error response
  });

  // ✅ Performance testing
  test('should accurately measure execution time', async () => {
    // Mock performance.now()
    // Verify latency calculation accuracy
  });

  // ✅ AI unavailability
  test('should handle AI unavailability gracefully', async () => {
    // Mock isAiAvailable() to return false
    // Verify proper error message and handling
  });
});
```

**2. Individual API Wrappers (7 functions)**
```typescript
describe('Chrome AI API Wrappers', () => {
  // ✅ Summarizer API
  describe('summarizeText', () => {
    test('should call Summarizer.create with correct options', async () => {
      // Mock globalThis.Summarizer
      // Verify API call with proper parameters
      // Test all option combinations (type, format, length)
    });

    test('should handle summarizer creation failure', async () => {
      // Mock Summarizer.create to throw error
      // Verify error handling and cleanup
    });

    test('should destroy summarizer instance after use', async () => {
      // Verify destroy() is called in finally block
    });
  });

  // ✅ Translator API
  describe('translateText', () => {
    test('should handle translation with language options', async () => {
      // Test source/target language parameters
      // Verify language code validation
    });
  });

  // ✅ Writer API
  describe('generateText', () => {
    test('should handle tone, format, and length options', async () => {
      // Test all Writer API option combinations
    });
  });

  // ✅ Rewriter API
  describe('rewriteText', () => {
    test('should handle rewriting with style options', async () => {
      // Test tone, format, length modifications
    });
  });

  // ✅ Proofreader API
  describe('proofreadText', () => {
    test('should handle proofreading when API available', async () => {
      // Test basic proofreading functionality
    });

    test('should handle proofreader API unavailability', async () => {
      // Mock undefined Proofreader class
    });
  });

  // ✅ Prompt API (Language Model)
  describe('generatePrompt', () => {
    test('should handle system prompt and context', async () => {
      // Test system prompt configuration
      // Test context integration
    });
  });

  // ✅ Language Detection API
  describe('detectLanguage', () => {
    test('should return top confidence language result', async () => {
      // Mock detection results array
      // Verify top result selection
    });
  });
});
```

**3. Utility Functions**
```typescript
describe('Utility Functions', () => {
  // ✅ Availability checking
  describe('isAiAvailable', () => {
    test('should return true when any API is available', () => {
      // Mock some APIs as available
    });

    test('should return false when no APIs are available', () => {
      // Mock all APIs as unavailable
    });
  });

  // ✅ Error simulation
  describe('simulateError', () => {
    test('should simulate API error with timing', async () => {
      // Verify error simulation behavior
    });
  });

  // ✅ Availability testing
  describe('testAiAvailability', () => {
    test('should check all 7 APIs and return status', async () => {
      // Mock various API availability states
      // Verify comprehensive status reporting
    });
  });
});
```

#### B. Type System & Availability (`global.test.ts`)

```typescript
describe('Chrome AI Type System', () => {
  // ✅ Individual API detection
  describe('API Availability Functions', () => {
    const apiTests = [
      { name: 'isSummarizerSupported', global: 'Summarizer' },
      { name: 'isRewriterSupported', global: 'Rewriter' },
      { name: 'isWriterSupported', global: 'Writer' },
      { name: 'isLanguageModelSupported', global: 'LanguageModel' },
      { name: 'isProofreaderSupported', global: 'Proofreader' },
      { name: 'isTranslatorSupported', global: 'Translator' },
      { name: 'isLanguageDetectorSupported', global: 'LanguageDetector' }
    ];

    apiTests.forEach(({ name, global }) => {
      test(`${name} should detect ${global} availability`, () => {
        // Mock globalThis[global]
        // Test detection accuracy
      });

      test(`${name} should handle undefined ${global}`, () => {
        // Mock undefined global
        // Verify false return
      });
    });
  });

  // ✅ Overall availability
  describe('isChromeAISupported', () => {
    test('should return true if any API is available', () => {
      // Mock mixed API availability
    });

    test('should return false if no APIs are available', () => {
      // Mock all APIs unavailable
    });
  });

  // ✅ API enumeration
  describe('getAllSupportedAPIs', () => {
    test('should return array of available API names', () => {
      // Mock specific APIs as available
      // Verify correct API names returned
    });

    test('should return empty array when no APIs available', () => {
      // Mock all APIs unavailable
    });
  });

  // ✅ Type guards
  describe('isAIServiceError', () => {
    test('should identify valid AIServiceError objects', () => {
      // Test valid error object structure
    });

    test('should reject invalid error objects', () => {
      // Test various invalid structures
    });
  });
});
```

#### C. State Management (`appStore.test.ts`)

```typescript
describe('App Store (Zustand + Zod)', () => {
  // ✅ State initialization
  describe('Initial State', () => {
    test('should initialize with correct default values', () => {
      // Verify initial state structure
    });
  });

  // ✅ Actions
  describe('Store Actions', () => {
    test('setActiveApi should update activeApi state', () => {
      // Test state update
    });

    test('setCodeLanguage should update codeLanguage', () => {
      // Test language switching
    });

    test('setApiResult should validate and store result', () => {
      // Test Zod validation success
      // Verify timestamp addition
    });

    test('setApiResult should handle invalid result format', () => {
      // Test Zod validation failure
      // Verify error state creation
    });

    test('setLoading should update loading state', () => {
      // Test loading state management
    });

    test('setAiCapabilities should store capabilities', () => {
      // Test capabilities state update
    });

    test('clearApiResult should reset result state', () => {
      // Test state clearing
    });

    test('reset should restore initial state', () => {
      // Test complete state reset
    });
  });

  // ✅ Selectors
  describe('Store Selectors', () => {
    test('useActiveApi should return current active API', () => {
      // Test selector functionality
    });

    test('useApiResult should return current result', () => {
      // Test result selector
    });

    // Test all 7 selectors...
  });

  // ✅ Zod Validation
  describe('Zod Schema Validation', () => {
    test('ApiResultSchema should validate valid results', () => {
      // Test schema with valid data
    });

    test('ApiResultSchema should reject invalid results', () => {
      // Test schema with invalid data
    });

    test('AppStateSchema should validate complete state', () => {
      // Test full state validation
    });
  });
});
```

### 🔗 Integration Tests

#### A. Service-Store Integration (`integration.test.ts`)
```typescript
describe('Service-Store Integration', () => {
  test('should flow from API call to store update', async () => {
    // Mock Chrome AI APIs
    // Call API service function
    // Verify store state update
    // Check Zod validation in flow
  });

  test('should handle API errors and update store accordingly', async () => {
    // Mock API failure
    // Verify error state in store
  });

  test('should maintain performance timing through flow', async () => {
    // Verify timing accuracy from service to store
  });
});
```

#### B. Cross-Browser Compatibility (`compatibility.test.ts`)
```typescript
describe('Browser Compatibility', () => {
  test('should handle missing Chrome AI APIs gracefully', () => {
    // Mock browser without Chrome AI
    // Verify graceful degradation
  });

  test('should detect partial API availability', () => {
    // Mock some APIs available, others not
    // Verify accurate detection
  });
});
```

### 🎭 Mock Strategies

#### A. Chrome AI API Mocks
```typescript
// Mock strategy for globalThis Chrome AI APIs
const mockChromeAI = {
  Summarizer: {
    create: jest.fn(),
  },
  Translator: {
    create: jest.fn(),
  },
  // ... all 7 APIs
};

// Performance timing mocks
const mockPerformance = {
  now: jest.fn()
};
```

#### B. Test Data Sets
```typescript
// Sample inputs for each API type
const testData = {
  summarizer: {
    input: "Long text to summarize...",
    options: [
      { type: 'tl-dr', format: 'plain-text', length: 'medium' },
      { type: 'key-points', format: 'markdown', length: 'short' }
    ]
  },
  translator: {
    input: "Hello world",
    options: [
      { sourceLanguage: 'en', targetLanguage: 'es' },
      { sourceLanguage: 'en', targetLanguage: 'fr' }
    ]
  },
  // ... test data for all APIs
};
```

### 🚨 Error Scenarios

#### A. API Unavailability
- Chrome AI not supported in browser
- Specific API not available
- API creation failure
- Runtime API errors

#### B. Network & Performance
- Slow API responses
- Memory constraints
- Concurrent API calls
- Performance timing edge cases

#### C. Input Validation
- Invalid input parameters
- Malformed options objects
- Edge case inputs (empty strings, very long text)
- Type mismatches

### 📊 Coverage Targets

#### A. Function Coverage: 90%+
- All 13 API service functions
- All 9 availability detection functions
- All 8 store actions
- All 7 store selectors

#### B. Branch Coverage: 85%+
- All error handling branches
- All conditional logic paths
- All API availability checks

#### C. Statement Coverage: 95%+
- All code statements executed
- All error cases tested
- All success paths verified

### 🔧 Test Environment Setup

#### A. Test Dependencies
```json
{
  "devDependencies": {
    "vitest": "^2.1.8",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^26.1.0"
  }
}
```

#### B. Test Configuration
- Vitest configuration for React/TypeScript
- JSDOM environment for browser APIs
- Mock setup for Chrome AI globals
- Coverage reporting configuration

#### C. CI/CD Integration
- Automated test runs on PR
- Coverage reporting to 90%+ gate
- Performance benchmarking
- Cross-browser testing matrix

### 🎯 Success Criteria

#### A. Quantitative Metrics
- ✅ 90%+ function coverage
- ✅ 85%+ branch coverage
- ✅ 95%+ statement coverage
- ✅ 0 critical bugs
- ✅ All 29 API functions tested

#### B. Qualitative Metrics
- ✅ All error scenarios covered
- ✅ Performance timing validated
- ✅ Type safety verified
- ✅ Cross-browser compatibility
- ✅ Production-ready reliability

### 📋 Implementation Checklist

- [ ] Setup test environment and configuration
- [ ] Create comprehensive mocks for Chrome AI APIs
- [ ] Implement unit tests for all 13 API service functions
- [ ] Implement unit tests for all 9 availability functions
- [ ] Implement unit tests for all store actions and selectors
- [ ] Create integration tests for service-store flow
- [ ] Add error scenario testing
- [ ] Add performance timing tests
- [ ] Add cross-browser compatibility tests
- [ ] Setup coverage reporting and CI/CD gates
- [ ] Document test execution and maintenance procedures

This strategy ensures Epic 1 achieves production-ready quality with comprehensive test coverage across all critical functionality.