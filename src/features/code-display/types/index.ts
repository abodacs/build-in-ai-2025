/**
 * Code Generation Types
 * Defines interfaces for code generation and template system
 */

export type CodeLanguage = 'javascript' | 'typescript';
export type CodeFormat = 'standalone' | 'npm-package' | 'module' | 'snippet';

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  language: CodeLanguage;
  template: string;
  variables: Record<string, any>;
}

export interface GeneratedCode {
  id: string;
  apiName: string;
  language: CodeLanguage;
  format: CodeFormat;
  code: string;
  template: CodeTemplate;
  timestamp: number;
}

export interface CodeGenerationOptions {
  apiName: string;
  language: CodeLanguage;
  format: CodeFormat;
  inputText?: string;
  outputText?: string;
  options?: Record<string, any>;
  includeErrorHandling?: boolean;
  includeComments?: boolean;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'object';
  defaultValue?: any;
  description?: string;
  required?: boolean;
}

export interface ApiCodeExample {
  apiName: string;
  description: string;
  inputExample: string;
  outputExample: string;
  options?: Record<string, any>;
}