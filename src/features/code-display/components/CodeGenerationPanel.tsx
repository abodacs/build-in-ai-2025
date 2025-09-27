/**
 * Code Generation Panel Component
 * Compact panel for displaying generated code in API demos
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Code2, Copy, Download } from 'lucide-react';
import { useCodeGeneration } from '../hooks/useCodeGeneration';
import { CodeDisplay } from './CodeDisplay';
import type { CodeLanguage } from '../types';

interface CodeGenerationPanelProps {
  apiName: string;
  inputText?: string;
  outputText?: string;
  className?: string;
  autoGenerate?: boolean;
  defaultExpanded?: boolean;
}

export function CodeGenerationPanel({
  apiName,
  inputText,
  outputText,
  className = '',
  autoGenerate = true,
  defaultExpanded = false
}: CodeGenerationPanelProps) {
  const {
    generatedCode,
    isGenerating,
    generateCode,
    copyToClipboard,
    downloadCode
  } = useCodeGeneration();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('typescript');

  // Auto-generate code when inputs change
  React.useEffect(() => {
    if (autoGenerate && (inputText || outputText)) {
      generateCode({
        apiName,
        language: selectedLanguage,
        format: 'snippet',
        inputText,
        outputText
      });
    }
  }, [apiName, inputText, outputText, selectedLanguage, autoGenerate, generateCode]);

  // Handle language toggle
  const toggleLanguage = () => {
    const newLanguage = selectedLanguage === 'typescript' ? 'javascript' : 'typescript';
    setSelectedLanguage(newLanguage);

    // Regenerate code with new language
    if (inputText || outputText) {
      generateCode({
        apiName,
        language: newLanguage,
        format: 'snippet',
        inputText,
        outputText
      });
    }
  };

  // Handle copy
  const handleCopy = async () => {
    if (generatedCode) {
      await copyToClipboard(generatedCode.id);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (generatedCode) {
      downloadCode(generatedCode.id);
    }
  };

  return (
    <div className={`border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-muted border-b border-border">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
        >
          <Code2 className="w-4 h-4" />
          Code Implementation
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="flex border border-border rounded overflow-hidden">
            <button
              onClick={toggleLanguage}
              className={`px-2 py-1 text-xs font-medium transition-colors ${
                selectedLanguage === 'javascript'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              JS
            </button>
            <button
              onClick={toggleLanguage}
              className={`px-2 py-1 text-xs font-medium transition-colors ${
                selectedLanguage === 'typescript'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              TS
            </button>
          </div>

          {/* Action Buttons */}
          {generatedCode && (
            <div className="flex gap-1">
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-background rounded transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={handleDownload}
                className="p-1 hover:bg-background rounded transition-colors"
                title="Download file"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3">
          {isGenerating ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
              Generating code...
            </div>
          ) : generatedCode ? (
            <CodeDisplay
              generatedCode={generatedCode}
              showActions={false}
              showMetadata={false}
              theme="auto"
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Code2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No code generated yet</p>
              <p className="text-xs">Try the API demo above</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}