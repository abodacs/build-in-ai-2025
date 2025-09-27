/**
 * Code Display Component
 * Displays generated code with syntax highlighting and action buttons
 */

import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Download, Check, AlertCircle } from 'lucide-react';
import { useCodeGeneration } from '../hooks/useCodeGeneration';
import type { GeneratedCode, CodeFormat } from '../types';

interface CodeDisplayProps {
  generatedCode?: GeneratedCode | null;
  className?: string;
  showActions?: boolean;
  showMetadata?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export function CodeDisplay({
  generatedCode: externalCode,
  className = '',
  showActions = true,
  showMetadata = true,
  theme = 'auto'
}: CodeDisplayProps) {
  const { generatedCode: hookCode, copyToClipboard, downloadCode } = useCodeGeneration();
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');

  // Use provided code or fall back to hook code
  const displayCode = externalCode || hookCode;

  if (!displayCode) {
    return (
      <div className={`flex items-center justify-center p-8 text-muted-foreground border border-dashed border-border rounded-lg ${className}`}>
        <div className="text-center space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto opacity-50" />
          <p>No code generated yet</p>
          <p className="text-sm">Try an API demo to generate code snippets</p>
        </div>
      </div>
    );
  }

  // Determine syntax highlighting theme
  const getHighlighterTheme = () => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? oneDark : oneLight;
    }
    return theme === 'dark' ? oneDark : oneLight;
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    setCopyStatus('copying');
    try {
      const success = await copyToClipboard(displayCode.id);
      setCopyStatus(success ? 'success' : 'error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  // Handle download
  const handleDownload = () => {
    setDownloadStatus('downloading');
    try {
      const success = downloadCode(displayCode.id);
      setDownloadStatus(success ? 'success' : 'error');
      setTimeout(() => setDownloadStatus('idle'), 2000);
    } catch (error) {
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus('idle'), 2000);
    }
  };

  // Get file extension for language
  const getFileExtension = () => {
    return displayCode.language === 'typescript' ? 'ts' : 'js';
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get format badge color
  const getFormatBadgeColor = (format: CodeFormat) => {
    const colors = {
      snippet: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      standalone: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'npm-package': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      module: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return colors[format] || colors.snippet;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Metadata */}
      {showMetadata && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-t-lg border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {displayCode.template.name}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFormatBadgeColor(displayCode.format)}`}>
              {displayCode.format}
            </span>
            <span className="text-xs text-muted-foreground">
              .{getFileExtension()}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(displayCode.timestamp)}
          </span>
        </div>
      )}

      {/* Code Display */}
      <div className="relative">
        <SyntaxHighlighter
          language={displayCode.language === 'typescript' ? 'typescript' : 'javascript'}
          style={getHighlighterTheme()}
          className="!m-0 !bg-transparent border border-border rounded-lg"
          showLineNumbers
          wrapLines
        >
          {displayCode.code}
        </SyntaxHighlighter>

        {/* Action Buttons */}
        {showActions && (
          <div className="absolute top-3 right-3 flex gap-2">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              disabled={copyStatus === 'copying'}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-background/80 hover:bg-background border border-border rounded transition-colors"
              title="Copy to clipboard"
            >
              {copyStatus === 'success' ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : copyStatus === 'error' ? (
                <AlertCircle className="w-3 h-3 text-red-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">
                {copyStatus === 'copying' ? 'Copying...' :
                 copyStatus === 'success' ? 'Copied!' :
                 copyStatus === 'error' ? 'Error' : 'Copy'}
              </span>
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={downloadStatus === 'downloading'}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-background/80 hover:bg-background border border-border rounded transition-colors"
              title="Download as file"
            >
              {downloadStatus === 'success' ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : downloadStatus === 'error' ? (
                <AlertCircle className="w-3 h-3 text-red-600" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">
                {downloadStatus === 'downloading' ? 'Downloading...' :
                 downloadStatus === 'success' ? 'Downloaded!' :
                 downloadStatus === 'error' ? 'Error' : 'Download'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {showMetadata && displayCode.template.description && (
        <p className="text-sm text-muted-foreground px-3 pb-3">
          {displayCode.template.description}
        </p>
      )}
    </div>
  );
}