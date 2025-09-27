/**
 * Code Generation Test Mocks and Utilities
 * Specialized mocks for Epic 2: Code Generation Engine testing
 */

import { vi } from 'vitest';

// Mock generated code samples
export const mockGeneratedCode = {
  typescript: {
    simple: {
      function: `function add(a: number, b: number): number {
  return a + b;
}`,
      class: `class Calculator {
  private result: number = 0;

  add(value: number): Calculator {
    this.result += value;
    return this;
  }

  subtract(value: number): Calculator {
    this.result -= value;
    return this;
  }

  getResult(): number {
    return this.result;
  }
}`,
      interface: `interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}`,
      component: `import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {label}
    </button>
  );
};

export default Button;`
    },
    complex: {
      asyncFunction: `async function fetchUserData(userId: string): Promise<User | null> {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const userData: User = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}`,
      genericClass: `class Repository<T extends { id: string }> {
  private items: Map<string, T> = new Map();

  add(item: T): void {
    this.items.set(item.id, item);
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  getAll(): T[] {
    return Array.from(this.items.values());
  }

  remove(id: string): boolean {
    return this.items.delete(id);
  }

  update(item: T): boolean {
    if (this.items.has(item.id)) {
      this.items.set(item.id, item);
      return true;
    }
    return false;
  }
}`
    }
  },
  javascript: {
    simple: {
      function: `function add(a, b) {
  return a + b;
}`,
      class: `class Calculator {
  constructor() {
    this.result = 0;
  }

  add(value) {
    this.result += value;
    return this;
  }

  subtract(value) {
    this.result -= value;
    return this;
  }

  getResult() {
    return this.result;
  }
}`,
      arrowFunction: `const multiply = (a, b) => a * b;`,
      component: `import React from 'react';

const Button = ({ label, onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {label}
    </button>
  );
};

export default Button;`
    },
    complex: {
      asyncFunction: `async function fetchUserData(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}`,
      module: `// userService.js
export class UserService {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async getUser(id) {
    const response = await fetch(\`\${this.apiBaseUrl}/users/\${id}\`);
    return response.json();
  }

  async createUser(userData) {
    const response = await fetch(\`\${this.apiBaseUrl}/users\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }
}`
    }
  },
  errors: {
    syntax: `function broken( {
  return "missing closing parenthesis"
`,
    incomplete: `class UnfinishedClass {
  constructor() {
    // missing implementation`,
    invalid: `this is not valid code at all 123 !@#`
  }
};

// Code generation prompts for testing
export const testPrompts = {
  simple: [
    'Create a function to add two numbers',
    'Make a class for a calculator',
    'Generate a React button component',
    'Create an interface for a user object',
    'Make an arrow function to multiply numbers'
  ],
  complex: [
    'Create a TypeScript class for user authentication with JWT tokens and error handling',
    'Generate a React hook for API data fetching with loading states and error handling',
    'Build a JavaScript utility class for date manipulation with timezone support',
    'Create a generic repository pattern in TypeScript with CRUD operations',
    'Generate a React component with form validation and submission handling'
  ],
  edge_cases: [
    '', // Empty prompt
    ' ', // Whitespace only
    'a', // Single character
    'A'.repeat(10000), // Very long prompt
    '!@#$%^&*()_+{}|:<>?[]\\;\'",./`~', // Special characters
    '创建一个函数', // Non-English (Chinese)
    'créer une fonction', // Non-English (French)
    'функция для добавления', // Non-English (Russian)
    'Create\na\nmultiline\nprompt\nwith\nbreaks' // Multiline input
  ],
  patterns: {
    functions: [
      'Create a pure function',
      'Make an async function',
      'Generate a higher-order function',
      'Create a recursive function'
    ],
    classes: [
      'Create a singleton class',
      'Make an abstract class',
      'Generate a class with inheritance',
      'Create a class with private methods'
    ],
    react: [
      'Create a functional component',
      'Make a component with hooks',
      'Generate a form component',
      'Create a custom hook'
    ]
  }
};

// Mock templates for code generation
export const mockTemplates = {
  typescript: {
    function: {
      basic: 'function ${name}(${params}): ${returnType} {\n  ${body}\n}',
      async: 'async function ${name}(${params}): Promise<${returnType}> {\n  ${body}\n}',
      arrow: 'const ${name} = (${params}): ${returnType} => {\n  ${body}\n};'
    },
    class: {
      basic: 'class ${name} {\n  ${properties}\n\n  ${methods}\n}',
      abstract: 'abstract class ${name} {\n  ${properties}\n\n  ${methods}\n}',
      generic: 'class ${name}<${generics}> {\n  ${properties}\n\n  ${methods}\n}'
    },
    interface: {
      basic: 'interface ${name} {\n  ${properties}\n}',
      generic: 'interface ${name}<${generics}> {\n  ${properties}\n}',
      extending: 'interface ${name} extends ${base} {\n  ${properties}\n}'
    },
    react: {
      functional: 'const ${name}: React.FC<${props}> = (${params}) => {\n  ${body}\n};',
      withHooks: 'const ${name}: React.FC<${props}> = (${params}) => {\n  ${hooks}\n\n  ${body}\n};'
    }
  },
  javascript: {
    function: {
      basic: 'function ${name}(${params}) {\n  ${body}\n}',
      async: 'async function ${name}(${params}) {\n  ${body}\n}',
      arrow: 'const ${name} = (${params}) => {\n  ${body}\n};'
    },
    class: {
      basic: 'class ${name} {\n  ${constructor}\n\n  ${methods}\n}',
      module: 'export class ${name} {\n  ${constructor}\n\n  ${methods}\n}'
    },
    react: {
      functional: 'const ${name} = (${params}) => {\n  ${body}\n};',
      withHooks: 'const ${name} = (${params}) => {\n  ${hooks}\n\n  ${body}\n};'
    }
  }
};

// Mock code generation responses with timing
export const createMockCodeResponse = (
  prompt: string,
  language: 'ts' | 'js' = 'ts',
  complexity: 'simple' | 'complex' = 'simple',
  pattern: string = 'function'
) => {
  const baseLatency = complexity === 'simple' ? 800 : 1500;
  const randomVariation = Math.floor(Math.random() * 500);

  let code = '';

  if (language === 'ts') {
    if (pattern === 'function') {
      code = complexity === 'simple'
        ? mockGeneratedCode.typescript.simple.function
        : mockGeneratedCode.typescript.complex.asyncFunction;
    } else if (pattern === 'class') {
      code = complexity === 'simple'
        ? mockGeneratedCode.typescript.simple.class
        : mockGeneratedCode.typescript.complex.genericClass;
    } else if (pattern === 'component') {
      code = mockGeneratedCode.typescript.simple.component;
    }
  } else {
    if (pattern === 'function') {
      code = complexity === 'simple'
        ? mockGeneratedCode.javascript.simple.function
        : mockGeneratedCode.javascript.complex.asyncFunction;
    } else if (pattern === 'class') {
      code = complexity === 'simple'
        ? mockGeneratedCode.javascript.simple.class
        : mockGeneratedCode.javascript.complex.module;
    } else if (pattern === 'component') {
      code = mockGeneratedCode.javascript.simple.component;
    }
  }

  return {
    data: code,
    error: null,
    latency: baseLatency + randomVariation,
    timestamp: Date.now(),
    metadata: {
      prompt,
      language,
      complexity,
      pattern,
      linesOfCode: code.split('\n').length,
      estimatedReadTime: Math.ceil(code.length / 100) // rough estimate
    }
  };
};

// Mock error responses
export const createMockCodeError = (
  errorType: 'timeout' | 'invalid' | 'api_unavailable' | 'malformed',
  prompt: string = 'test prompt'
) => {
  const errorMessages = {
    timeout: 'Code generation request timed out',
    invalid: 'Invalid or unclear code generation prompt',
    api_unavailable: 'Writer API is not available',
    malformed: 'Malformed response from code generation service'
  };

  const latencies = {
    timeout: 5000,
    invalid: 100,
    api_unavailable: 50,
    malformed: 1200
  };

  return {
    data: null,
    error: errorMessages[errorType],
    latency: latencies[errorType],
    timestamp: Date.now(),
    metadata: {
      prompt,
      errorType,
      retryable: errorType === 'timeout' || errorType === 'api_unavailable'
    }
  };
};

// Mock Writer API for code generation
export const createMockWriterAPI = (shouldSucceed: boolean = true, responseType: string = 'function') => {
  return {
    create: vi.fn().mockImplementation(async (options?: any) => {
      if (!shouldSucceed) {
        throw new Error('Writer API creation failed');
      }

      return {
        write: vi.fn().mockImplementation(async (prompt: string) => {
          if (!shouldSucceed) {
            throw new Error('Code generation failed');
          }

          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 100));

          // Analyze prompt to determine response type
          let pattern = 'function';
          let complexity = 'simple';
          let language = options?.tone?.includes('typescript') ? 'ts' : 'js';

          if (prompt.toLowerCase().includes('class')) pattern = 'class';
          if (prompt.toLowerCase().includes('component')) pattern = 'component';
          if (prompt.toLowerCase().includes('interface')) pattern = 'interface';

          if (prompt.length > 100 || prompt.toLowerCase().includes('complex')) {
            complexity = 'complex';
          }

          const response = createMockCodeResponse(prompt, language, complexity, pattern);
          return response.data;
        }),
        destroy: vi.fn()
      };
    })
  };
};

// Performance benchmarking utilities
export const benchmarkCodeGeneration = async (
  generateFn: () => Promise<any>,
  iterations: number = 5
) => {
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await generateFn();
    const end = performance.now();
    results.push(end - start);
  }

  return {
    times: results,
    average: results.reduce((sum, time) => sum + time, 0) / results.length,
    min: Math.min(...results),
    max: Math.max(...results),
    median: results.sort((a, b) => a - b)[Math.floor(results.length / 2)]
  };
};

// Code quality analysis mocks
export const mockCodeQualityAnalysis = {
  typescript: {
    good: {
      score: 95,
      issues: [],
      suggestions: ['Consider adding JSDoc comments'],
      hasTypes: true,
      followsConventions: true,
      complexity: 'low'
    },
    poor: {
      score: 45,
      issues: ['Missing type annotations', 'Unused variables', 'No error handling'],
      suggestions: ['Add proper TypeScript types', 'Remove unused code', 'Add try-catch blocks'],
      hasTypes: false,
      followsConventions: false,
      complexity: 'high'
    }
  },
  javascript: {
    good: {
      score: 88,
      issues: [],
      suggestions: ['Consider using const instead of let', 'Add JSDoc comments'],
      usesModernSyntax: true,
      followsConventions: true,
      complexity: 'low'
    },
    poor: {
      score: 35,
      issues: ['Uses var instead of const/let', 'No error handling', 'Poor naming'],
      suggestions: ['Use modern ES6+ syntax', 'Add proper error handling', 'Improve variable names'],
      usesModernSyntax: false,
      followsConventions: false,
      complexity: 'high'
    }
  }
};

// Syntax highlighting test data
export const syntaxHighlightingTestCases = {
  typescript: {
    keywords: ['function', 'class', 'interface', 'type', 'const', 'let', 'var'],
    types: ['string', 'number', 'boolean', 'Array', 'Promise'],
    operators: ['=>', '===', '!==', '&&', '||', '?:', '??'],
    comments: ['// Single line comment', '/* Multi line comment */'],
    strings: ['"double quotes"', "'single quotes'", '`template literal`']
  },
  javascript: {
    keywords: ['function', 'class', 'const', 'let', 'var', 'async', 'await'],
    operators: ['=>', '===', '!==', '&&', '||', '?:', '??'],
    comments: ['// Single line comment', '/* Multi line comment */'],
    strings: ['"double quotes"', "'single quotes'", '`template literal`']
  }
};

// Helper to create mock Prism.js highlighting
export const createMockPrismHighlighting = () => {
  const originalPrism = (global as any).Prism;

  const mockPrism = {
    highlight: vi.fn().mockImplementation((code: string, grammar: any, language: string) => {
      // Simple mock highlighting - just wrap keywords
      return code.replace(
        /(function|class|const|let|var|if|else|return)/g,
        '<span class="token keyword">$1</span>'
      );
    }),
    languages: {
      typescript: {},
      javascript: {}
    }
  };

  (global as any).Prism = mockPrism;

  return {
    restore: () => {
      (global as any).Prism = originalPrism;
    },
    mockPrism
  };
};

// Template validation utilities
export const validateTemplate = (template: string, variables: string[]) => {
  const errors = [];

  // Check for required variables
  variables.forEach(variable => {
    if (!template.includes(`\${${variable}}`)) {
      errors.push(`Missing variable: ${variable}`);
    }
  });

  // Check for unknown variables
  const templateVariables = template.match(/\$\{([^}]+)\}/g) || [];
  templateVariables.forEach(templateVar => {
    const varName = templateVar.slice(2, -1);
    if (!variables.includes(varName)) {
      errors.push(`Unknown variable: ${varName}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Language detection test helpers
export const languageDetectionTests = {
  typescript: [
    'interface User { id: string; }',
    'function add(a: number, b: number): number',
    'const user: User = { id: "123" };',
    'class Service<T> { private items: T[] = []; }'
  ],
  javascript: [
    'function add(a, b) { return a + b; }',
    'const users = [1, 2, 3];',
    'class Calculator { constructor() {} }',
    'export default function() {}'
  ],
  ambiguous: [
    'console.log("hello");',
    'const x = 5;',
    'if (true) { return false; }',
    '// This could be either language'
  ]
};

// Export test data generators
export const codeTestDataGenerators = {
  randomPrompt: (length: number = 50) => {
    const prompts = [
      'Create a function',
      'Make a class',
      'Generate a component',
      'Build a utility',
      'Design a service'
    ];
    const actions = ['that handles', 'for managing', 'to process', 'which validates', 'that transforms'];
    const objects = ['users', 'data', 'files', 'requests', 'events', 'configurations'];

    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const object = objects[Math.floor(Math.random() * objects.length)];

    return `${prompt} ${action} ${object}`;
  },

  randomCodeSnippet: (language: 'ts' | 'js', lines: number = 10) => {
    const snippets = language === 'ts'
      ? Object.values(mockGeneratedCode.typescript.simple)
      : Object.values(mockGeneratedCode.javascript.simple);

    return snippets[Math.floor(Math.random() * snippets.length)];
  },

  randomComplexity: () => {
    return Math.random() > 0.5 ? 'complex' : 'simple';
  }
};