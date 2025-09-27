/**
 * Code Generation Service
 * Core service for generating code snippets from Chrome AI API interactions
 */

import type {
  CodeGenerationOptions,
  GeneratedCode,
  CodeTemplate,
  CodeLanguage,
  CodeFormat
} from '../types';
import { allTemplates, renderTemplate } from '../utils/templates';

export class CodeGeneratorService {
  private generatedCodes: Map<string, GeneratedCode> = new Map();

  /**
   * Generate code snippet from API interaction
   */
  generateCode(options: CodeGenerationOptions): GeneratedCode {
    const template = this.getTemplate(options.apiName, options.language);
    if (!template) {
      throw new Error(`Template not found for ${options.apiName} in ${options.language}`);
    }

    // Prepare template variables based on options
    const variables = this.prepareTemplateVariables(template, options);

    // Render the template with variables
    const code = renderTemplate(template.template, variables);

    // Format code based on requested format
    const formattedCode = this.formatCode(code, options.format);

    const generatedCode: GeneratedCode = {
      id: this.generateId(),
      apiName: options.apiName,
      language: options.language,
      format: options.format,
      code: formattedCode,
      template,
      timestamp: Date.now()
    };

    // Store generated code
    this.generatedCodes.set(generatedCode.id, generatedCode);

    return generatedCode;
  }

  /**
   * Get template for specific API and language
   */
  private getTemplate(apiName: string, language: CodeLanguage): CodeTemplate | null {
    const templates = allTemplates[language];
    return templates[apiName] || null;
  }

  /**
   * Prepare template variables from generation options
   */
  private prepareTemplateVariables(template: CodeTemplate, options: CodeGenerationOptions): Record<string, any> {
    const variables = { ...template.variables };

    // Override with user-provided options
    if (options.inputText) {
      variables.inputText = JSON.stringify(options.inputText);
    }

    // Apply API-specific options
    if (options.options) {
      Object.assign(variables, options.options);
    }

    return variables;
  }

  /**
   * Format code based on requested format
   */
  private formatCode(code: string, format: CodeFormat): string {
    switch (format) {
      case 'standalone':
        return this.wrapAsStandalone(code);
      case 'npm-package':
        return this.wrapAsNpmPackage(code);
      case 'module':
        return this.wrapAsModule(code);
      case 'snippet':
      default:
        return code;
    }
  }

  /**
   * Wrap code as standalone HTML file
   */
  private wrapAsStandalone(code: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chrome AI Demo</title>
</head>
<body>
    <h1>Chrome AI API Demo</h1>
    <div id="output"></div>

    <script>
${code}
    </script>
</body>
</html>`;
  }

  /**
   * Wrap code as NPM package structure
   */
  private wrapAsNpmPackage(code: string): string {
    const packageJson = {
      name: "chrome-ai-demo",
      version: "1.0.0",
      description: "Chrome AI API demonstration",
      main: "index.js",
      type: "module",
      dependencies: {},
      scripts: {
        start: "node index.js"
      }
    };

    return `// package.json
${JSON.stringify(packageJson, null, 2)}

// index.js
${code}

// README.md
# Chrome AI Demo

This package demonstrates the use of Chrome's built-in AI APIs.

## Usage

\`\`\`bash
npm start
\`\`\`

## Requirements

- Chrome 136.0.7103.0+ (Canary) with AI features enabled
`;
  }

  /**
   * Wrap code as ES module
   */
  private wrapAsModule(code: string): string {
    return `// chrome-ai-module.js
${code}

export {
  summarizeText,
  translateText,
  generateResponse
};`;
  }

  /**
   * Generate unique ID for code snippets
   */
  private generateId(): string {
    return `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get generated code by ID
   */
  getGeneratedCode(id: string): GeneratedCode | null {
    return this.generatedCodes.get(id) || null;
  }

  /**
   * Get all generated codes
   */
  getAllGeneratedCodes(): GeneratedCode[] {
    return Array.from(this.generatedCodes.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear generated codes
   */
  clearGeneratedCodes(): void {
    this.generatedCodes.clear();
  }

  /**
   * Get available APIs for code generation
   */
  getAvailableApis(): string[] {
    return Object.keys(allTemplates.typescript);
  }

  /**
   * Get available templates for a specific language
   */
  getTemplatesForLanguage(language: CodeLanguage): CodeTemplate[] {
    const templates = allTemplates[language];
    return Object.values(templates);
  }

  /**
   * Export code to clipboard
   */
  async copyToClipboard(codeId: string): Promise<boolean> {
    const generatedCode = this.getGeneratedCode(codeId);
    if (!generatedCode) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(generatedCode.code);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Download code as file
   */
  downloadCode(codeId: string, filename?: string): boolean {
    const generatedCode = this.getGeneratedCode(codeId);
    if (!generatedCode) {
      return false;
    }

    const extension = generatedCode.language === 'typescript' ? '.ts' : '.js';
    const defaultFilename = `chrome-ai-${generatedCode.apiName}${extension}`;
    const finalFilename = filename || defaultFilename;

    try {
      const blob = new Blob([generatedCode.code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Failed to download code:', error);
      return false;
    }
  }
}

// Export singleton instance
export const codeGenerator = new CodeGeneratorService();