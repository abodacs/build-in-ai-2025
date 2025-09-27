/**
 * Code Generator Component
 * Interactive interface for generating code snippets from API interactions
 */

import React, { useState } from 'react';
import { Play, Settings, Download, Copy, RefreshCw } from 'lucide-react';
import { useCodeGeneration, useCodeTemplates } from '../hooks/useCodeGeneration';
import { CodeDisplay } from './CodeDisplay';
import type { CodeLanguage, CodeFormat } from '../types';

interface CodeGeneratorProps {
  apiName?: string;
  inputText?: string;
  outputText?: string;
  className?: string;
}

export function CodeGenerator({
  apiName,
  inputText,
  outputText,
  className = ''
}: CodeGeneratorProps) {
  const {
    generatedCode,
    isGenerating,
    error,
    generateCode,
    clearCodes
  } = useCodeGeneration();

  const { availableApis } = useCodeTemplates();

  const [selectedApi, setSelectedApi] = useState(apiName || 'summarizer');
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('typescript');
  const [selectedFormat, setSelectedFormat] = useState<CodeFormat>('snippet');
  const [customInput, setCustomInput] = useState(inputText || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle code generation
  const handleGenerate = async () => {
    await generateCode({
      apiName: selectedApi,
      language: selectedLanguage,
      format: selectedFormat,
      inputText: customInput || inputText,
      outputText
    });
  };

  // Handle clear codes
  const handleClear = () => {
    clearCodes();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Code Generator</h3>
          <p className="text-sm text-muted-foreground">
            Generate implementation code for Chrome AI APIs
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-3 py-1 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4" />
            {showAdvanced ? 'Hide' : 'Show'} Options
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-1 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
        {/* API Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">API</label>
          <select
            value={selectedApi}
            onChange={(e) => setSelectedApi(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
          >
            {availableApis.map((api) => (
              <option key={api} value={api}>
                {api.charAt(0).toUpperCase() + api.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Language</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as CodeLanguage)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
          >
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Format</label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as CodeFormat)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
          >
            <option value="snippet">Snippet</option>
            <option value="standalone">Standalone HTML</option>
            <option value="module">ES Module</option>
            <option value="npm-package">NPM Package</option>
          </select>
        </div>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 p-4 border border-border rounded-lg">
          <h4 className="font-medium">Advanced Options</h4>

          {/* Custom Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Input Text</label>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter custom input text for the example..."
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play className="w-4 h-4" />
          {isGenerating ? 'Generating...' : 'Generate Code'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Generated Code Display */}
      {generatedCode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Generated Code</h4>
            <div className="flex gap-2">
              <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                Ready
              </span>
            </div>
          </div>
          <CodeDisplay generatedCode={generatedCode} />
        </div>
      )}

      {/* Usage Instructions */}
      {!generatedCode && !isGenerating && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            How to Use
          </h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>1. Select the Chrome AI API you want to use</li>
            <li>2. Choose your preferred language (TypeScript/JavaScript)</li>
            <li>3. Pick the output format that suits your needs</li>
            <li>4. Click "Generate Code" to create your implementation</li>
            <li>5. Copy or download the generated code for your project</li>
          </ol>
        </div>
      )}
    </div>
  );
}