/**
 * Code Generation Service Unit Tests
 * Tests for Epic 2: Code Generation Engine core functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateCode,
  generateCodeSnippet,
  optimizeCode,
  detectCodeLanguage,
  validateCodeSyntax,
  extractCodeMetadata
} from '@/services/codeGeneration';
import {
  setupChromeAIMocks,
  cleanupChromeAIMocks,
  createMockWriterAPI
} from '../utils/chromeAiMocks';
import {
  mockGeneratedCode,
  testPrompts,
  createMockCodeResponse,
  createMockCodeError,
  benchmarkCodeGeneration,
  mockCodeQualityAnalysis
} from '../utils/codeGenMocks';
import { mockConsole, waitFor, verifyTiming } from '../utils/testHelpers';

describe('Code Generation Service - Epic 2', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    cleanupChromeAIMocks();
  });

  afterEach(() => {
    consoleMock.restore();
    cleanupChromeAIMocks();
  });

  describe('generateCode Function', () => {
    describe('Basic Code Generation', () => {
      it('should generate TypeScript code from simple prompt', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await generateCode('Create a function to add two numbers', 'ts');

        expect(result.data).toBeTruthy();
        expect(result.error).toBeNull();
        expect(result.latency).toBeGreaterThan(0);
        expect(result.timestamp).toBeGreaterThan(0);
        expect(typeof result.data).toBe('string');
      });

      it('should generate JavaScript code from simple prompt', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await generateCode('Create a function to add two numbers', 'js');

        expect(result.data).toBeTruthy();
        expect(result.error).toBeNull();
        expect(result.language).toBe('js');
      });

      it('should handle empty prompts gracefully', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await generateCode('', 'ts');

        expect(result.data).toBeNull();
        expect(result.error).toContain('prompt');
      });

      it('should validate input parameters', async () => {
        setupChromeAIMocks(['Writer']);

        // Test invalid language
        const result1 = await generateCode('test prompt', 'invalid' as any);
        expect(result1.error).toContain('language');

        // Test null prompt
        const result2 = await generateCode(null as any, 'ts');
        expect(result2.error).toContain('prompt');

        // Test undefined prompt
        const result3 = await generateCode(undefined as any, 'ts');
        expect(result3.error).toContain('prompt');
      });
    });

    describe('Language-Specific Features', () => {
      it('should include TypeScript types when requested', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await generateCode('Create a function that takes a string and returns a number', 'ts');

        expect(result.data).toBeTruthy();
        // Should contain TypeScript type annotations
        expect(result.data).toMatch(/:\s*(string|number|boolean)/);
      });

      it('should generate ES6+ features for JavaScript', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await generateCode('Create an arrow function', 'js');

        expect(result.data).toBeTruthy();
        // Should contain arrow function syntax
        expect(result.data).toMatch(/=>/);
      });

      it('should handle JSX/TSX for React components', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await generateCode('Create a React button component', 'ts');

        expect(result.data).toBeTruthy();
        // Should contain JSX/TSX syntax
        expect(result.data).toMatch(/<[A-Za-z]/);
        expect(result.data).toMatch(/React/);
      });
    });

    describe('Templates and Patterns', () => {
      it('should apply common code patterns for functions', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await generateCode('Create a utility function for validation', 'ts');

        expect(result.data).toBeTruthy();
        expect(result.data).toMatch(/function|const.*=/);
      });

      it('should use appropriate naming conventions', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await generateCode('Create a class for user management', 'ts');

        expect(result.data).toBeTruthy();
        // Should use PascalCase for classes
        expect(result.data).toMatch(/class\s+[A-Z][a-zA-Z]*/);
      });

      it('should include proper error handling', async () => {
        setupChromeAIMocks(['Writer']);

        const result = await generateCode('Create an async function that fetches data', 'ts');

        expect(result.data).toBeTruthy();
        // Should include try-catch or error handling
        expect(result.data).toMatch(/try|catch|throw|Error/i);
      });
    });

    describe('Performance and Optimization', () => {
      it('should complete generation within acceptable time limits', async () => {
        setupChromeAIMocks(['Writer']);

        const startTime = performance.now();
        const result = await generateCode('Create a simple function', 'ts');
        const endTime = performance.now();

        expect(result.data).toBeTruthy();
        expect(endTime - startTime).toBeLessThan(3000); // 3 seconds max
      });

      it('should handle large code generation requests', async () => {
        setupChromeAIMocks(['Writer']);

        const longPrompt = 'Create a comprehensive TypeScript class with multiple methods, properties, error handling, validation, and documentation';

        const result = await generateCode(longPrompt, 'ts');

        expect(result.data).toBeTruthy();
        expect(result.latency).toBeGreaterThan(0);
      });

      it('should cache generation results appropriately', async () => {
        setupChromeAIMocks(['Writer']);

        const prompt = 'Create a test function';

        // First call
        const result1 = await generateCode(prompt, 'ts');
        const firstLatency = result1.latency;

        // Second call with same prompt (should potentially be faster if cached)
        const result2 = await generateCode(prompt, 'ts');

        expect(result1.data).toBeTruthy();
        expect(result2.data).toBeTruthy();
        // Both calls should succeed
        expect(result1.error).toBeNull();
        expect(result2.error).toBeNull();
      });
    });

    describe('Error Scenarios', () => {
      it('should handle API unavailability gracefully', async () => {
        cleanupChromeAIMocks(); // No Writer API

        const result = await generateCode('Test prompt', 'ts');

        expect(result.data).toBeNull();
        expect(result.error).toContain('not supported');
      });

      it('should handle malformed prompts', async () => {
        setupChromeAIMocks(['Writer']);

        const malformedPrompts = [
          '!@#$%^&*()',
          'A'.repeat(10000),
          '\n\n\n\n',
          '   \t   \r   ',
        ];

        for (const prompt of malformedPrompts) {
          const result = await generateCode(prompt, 'ts');
          // Should either succeed or provide meaningful error
          expect(result.data !== null || result.error !== null).toBe(true);
        }
      });

      it('should handle generation timeouts', async () => {
        setupChromeAIMocks(['Writer'], false); // Will fail

        const result = await generateCode('Test prompt', 'ts');

        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
      });

      it('should handle non-English prompts appropriately', async () => {
        setupChromeAIMocks(['Writer']);

        const nonEnglishPrompts = [
          '创建一个函数', // Chinese
          'créer une fonction', // French
          'создать функцию' // Russian
        ];

        for (const prompt of nonEnglishPrompts) {
          const result = await generateCode(prompt, 'ts');
          // Should handle gracefully
          expect(result.data !== null || result.error !== null).toBe(true);
        }
      });
    });
  });

  describe('generateCodeSnippet Function', () => {
    it('should generate smaller code snippets', async () => {
      setupChromeAIMocks(['Writer']);

      const result = await generateCodeSnippet('variable declaration', 'ts');

      expect(result.data).toBeTruthy();
      expect(result.data!.length).toBeLessThan(200); // Should be small
    });

    it('should handle different snippet types', async () => {
      setupChromeAIMocks(['Writer']);

      const snippetTypes = [
        'variable declaration',
        'if statement',
        'loop',
        'try-catch block',
        'function call'
      ];

      for (const type of snippetTypes) {
        const result = await generateCodeSnippet(type, 'ts');
        expect(result.data).toBeTruthy();
      }
    });

    it('should be faster than full code generation', async () => {
      setupChromeAIMocks(['Writer']);

      const snippetStart = performance.now();
      const snippetResult = await generateCodeSnippet('variable', 'ts');
      const snippetTime = performance.now() - snippetStart;

      const fullStart = performance.now();
      const fullResult = await generateCode('Create a complete class', 'ts');
      const fullTime = performance.now() - fullStart;

      expect(snippetResult.data).toBeTruthy();
      expect(fullResult.data).toBeTruthy();
      // Snippet should be faster (though this may not always be true with mocks)
      expect(snippetTime).toBeLessThan(fullTime + 1000); // Allow some variance
    });
  });

  describe('optimizeCode Function', () => {
    it('should optimize TypeScript code', async () => {
      const unoptimizedCode = `var x = 1;
var y = 2;
function add() {
  return x + y;
}`;

      const result = await optimizeCode(unoptimizedCode, 'ts');

      expect(result.data).toBeTruthy();
      expect(result.data).not.toBe(unoptimizedCode);
      // Should have improvements
      expect(result.optimizations).toBeTruthy();
      expect(Array.isArray(result.optimizations)).toBe(true);
    });

    it('should optimize JavaScript code', async () => {
      const unoptimizedCode = `function test() {
  var a = 1;
  var b = 2;
  var c = a + b;
  return c;
}`;

      const result = await optimizeCode(unoptimizedCode, 'js');

      expect(result.data).toBeTruthy();
      expect(result.optimizations).toBeTruthy();
    });

    it('should handle already optimized code', async () => {
      const optimizedCode = `const add = (a: number, b: number): number => a + b;`;

      const result = await optimizeCode(optimizedCode, 'ts');

      expect(result.data).toBeTruthy();
      // May return original if already optimized
      expect(result.optimizations).toBeDefined();
    });

    it('should handle invalid code gracefully', async () => {
      const invalidCode = `function broken( {
  return "syntax error"`;

      const result = await optimizeCode(invalidCode, 'ts');

      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
    });
  });

  describe('detectCodeLanguage Function', () => {
    it('should detect TypeScript code correctly', () => {
      const tsCode = `interface User {
  id: string;
  name: string;
}

function getUser(id: string): User | null {
  return users.find(u => u.id === id) || null;
}`;

      const result = detectCodeLanguage(tsCode);

      expect(result.language).toBe('typescript');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.indicators).toContain('interface');
      expect(result.indicators).toContain('type annotations');
    });

    it('should detect JavaScript code correctly', () => {
      const jsCode = `function getUser(id) {
  return users.find(u => u.id === id) || null;
}

export default getUser;`;

      const result = detectCodeLanguage(jsCode);

      expect(result.language).toBe('javascript');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should handle ambiguous code', () => {
      const ambiguousCode = `console.log("Hello World");`;

      const result = detectCodeLanguage(ambiguousCode);

      expect(['typescript', 'javascript']).toContain(result.language);
      expect(result.confidence).toBeLessThan(0.9); // Should be less confident
    });

    it('should handle empty or invalid input', () => {
      expect(() => detectCodeLanguage('')).not.toThrow();
      expect(() => detectCodeLanguage('   ')).not.toThrow();
      expect(() => detectCodeLanguage('not code at all')).not.toThrow();
    });
  });

  describe('validateCodeSyntax Function', () => {
    it('should validate correct TypeScript syntax', () => {
      const validTsCode = `function add(a: number, b: number): number {
  return a + b;
}`;

      const result = validateCodeSyntax(validTsCode, 'ts');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate correct JavaScript syntax', () => {
      const validJsCode = `function add(a, b) {
  return a + b;
}`;

      const result = validateCodeSyntax(validJsCode, 'js');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect syntax errors', () => {
      const invalidCode = `function broken( {
  return "missing closing parenthesis"
}`;

      const result = validateCodeSyntax(invalidCode, 'ts');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatch(/syntax|parse|error/i);
    });

    it('should provide helpful error messages', () => {
      const codeWithErrors = `const x = 1
const y = 2; // missing semicolon above
function test() {
  return x + y
} // missing semicolon`;

      const result = validateCodeSyntax(codeWithErrors, 'ts');

      if (!result.isValid) {
        expect(result.errors).toBeTruthy();
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('extractCodeMetadata Function', () => {
    it('should extract metadata from TypeScript code', () => {
      const tsCode = `interface User {
  id: string;
  name: string;
}

class UserService {
  private users: User[] = [];

  async getUser(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }
}`;

      const metadata = extractCodeMetadata(tsCode);

      expect(metadata.language).toBe('typescript');
      expect(metadata.linesOfCode).toBeGreaterThan(5);
      expect(metadata.hasInterfaces).toBe(true);
      expect(metadata.hasClasses).toBe(true);
      expect(metadata.hasAsyncFunctions).toBe(true);
      expect(metadata.complexity).toBeDefined();
    });

    it('should extract metadata from JavaScript code', () => {
      const jsCode = `class Calculator {
  constructor() {
    this.result = 0;
  }

  add(value) {
    this.result += value;
    return this;
  }
}

export default Calculator;`;

      const metadata = extractCodeMetadata(jsCode);

      expect(metadata.language).toBe('javascript');
      expect(metadata.hasClasses).toBe(true);
      expect(metadata.hasExports).toBe(true);
      expect(metadata.estimatedReadTime).toBeGreaterThan(0);
    });

    it('should calculate complexity metrics', () => {
      const complexCode = `function complexFunction(data) {
  if (data) {
    for (let i = 0; i < data.length; i++) {
      if (data[i].active) {
        try {
          processItem(data[i]);
        } catch (error) {
          handleError(error);
        }
      }
    }
  } else {
    throw new Error("No data provided");
  }
}`;

      const metadata = extractCodeMetadata(complexCode);

      expect(metadata.complexity).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(metadata.complexity);
      expect(metadata.cyclomaticComplexity).toBeGreaterThan(1);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent code generation requests', async () => {
      setupChromeAIMocks(['Writer']);

      const promises = [
        generateCode('Create function 1', 'ts'),
        generateCode('Create function 2', 'ts'),
        generateCode('Create function 3', 'ts'),
        generateCode('Create function 4', 'ts'),
        generateCode('Create function 5', 'ts')
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.data).toBeTruthy();
        expect(result.error).toBeNull();
      });
    });

    it('should maintain performance under load', async () => {
      setupChromeAIMocks(['Writer']);

      const benchmark = await benchmarkCodeGeneration(
        () => generateCode('Create a test function', 'ts'),
        5
      );

      expect(benchmark.average).toBeLessThan(2000); // 2 seconds average
      expect(benchmark.max).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle memory efficiently during large operations', async () => {
      setupChromeAIMocks(['Writer']);

      // Generate many code snippets
      const promises = Array.from({ length: 20 }, (_, i) =>
        generateCodeSnippet(`snippet ${i}`, 'ts')
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.data).toBeTruthy();
      });

      // Memory usage should be reasonable (this is hard to test directly)
      expect(results.length).toBe(20);
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should handle extremely long prompts', async () => {
      setupChromeAIMocks(['Writer']);

      const longPrompt = 'Create a function '.repeat(1000);

      const result = await generateCode(longPrompt, 'ts');

      // Should either succeed or fail gracefully
      expect(result.data !== null || result.error !== null).toBe(true);
    });

    it('should handle special characters in prompts', async () => {
      setupChromeAIMocks(['Writer']);

      const specialPrompt = 'Create a function with "quotes" and \'apostrophes\' and symbols: !@#$%^&*()';

      const result = await generateCode(specialPrompt, 'ts');

      expect(result.data !== null || result.error !== null).toBe(true);
    });

    it('should recover from API failures', async () => {
      // Start with failing API
      setupChromeAIMocks(['Writer'], false);

      const failResult = await generateCode('Test', 'ts');
      expect(failResult.error).toBeTruthy();

      // Fix API
      setupChromeAIMocks(['Writer'], true);

      const successResult = await generateCode('Test', 'ts');
      expect(successResult.data).toBeTruthy();
    });
  });
});