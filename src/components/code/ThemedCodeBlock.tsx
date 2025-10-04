/**
 * Themed Code Block Component
 *
 * Reusable code block with theme support and copy functionality
 * Respects the independent code theme from CodeThemeProvider
 */

import { useState } from 'react';
import { Copy, CheckCircle2, Download } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCodeTheme } from '@/providers/CodeThemeProvider';
import { CodeThemeToggle } from './CodeThemeToggle';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ThemedCodeBlockProps {
  /** Code content to display */
  code: string;

  /** Programming language */
  language: 'typescript' | 'javascript' | 'json' | 'bash';

  /** Show copy button */
  showCopyButton?: boolean;

  /** Show download button */
  showDownloadButton?: boolean;

  /** Show theme toggle */
  showThemeToggle?: boolean;

  /** Show language badge */
  showLanguageBadge?: boolean;

  /** Filename for download */
  filename?: string;

  /** Additional CSS classes */
  className?: string;

  /** Custom header content */
  headerContent?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Themed code block with syntax highlighting support
 *
 * @example
 * ```tsx
 * <ThemedCodeBlock
 *   code={code}
 *   language="typescript"
 *   showCopyButton
 *   showThemeToggle
 * />
 * ```
 */
export function ThemedCodeBlock({
  code,
  language,
  showCopyButton = true,
  showDownloadButton = false,
  showThemeToggle = true,
  showLanguageBadge = true,
  filename,
  className,
  headerContent,
}: ThemedCodeBlockProps) {
  const { resolvedCodeTheme } = useCodeTheme();
  const [copied, setCopied] = useState(false);

  // Get file extension
  const getFileExtension = () => {
    switch (language) {
      case 'typescript':
        return '.ts';
      case 'javascript':
        return '.js';
      case 'json':
        return '.json';
      case 'bash':
        return '.sh';
      default:
        return '.txt';
    }
  };

  // Copy to clipboard
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Download code as file
  const downloadCode = () => {
    const finalFilename = filename || `code${getFileExtension()}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Theme-specific classes
  const isDark = resolvedCodeTheme === 'dark';

  const containerClasses = cn(
    'rounded-lg transition-colors duration-200',
    isDark
      ? 'bg-slate-900 border border-slate-700'
      : 'bg-slate-50 border border-slate-200',
    className
  );

  const headerClasses = cn(
    'flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b',
    isDark ? 'border-slate-700' : 'border-slate-200'
  );

  const badgeVariant = isDark ? 'secondary' : 'outline';

  return (
    <div className={containerClasses}>
      {/* Header */}
      {(showLanguageBadge || showThemeToggle || showCopyButton || showDownloadButton || headerContent) && (
        <div className={headerClasses}>
          <div className="flex items-center gap-2 min-w-0">
            {showLanguageBadge && (
              <Badge variant={badgeVariant} className="text-[10px] font-mono shrink-0">
                {language}
              </Badge>
            )}
            {headerContent}
          </div>

          <div className="flex items-center gap-1 ml-auto shrink-0">
            {showThemeToggle && <CodeThemeToggle size="sm" />}

            {showCopyButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyCode}
                className="h-7 px-2 shrink-0"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    <span className="text-xs">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </Button>
            )}

            {showDownloadButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadCode}
                className="h-7 px-2 shrink-0"
              >
                <Download className="w-3 h-3 mr-1" />
                <span className="text-xs">Download</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Code Content with Syntax Highlighting */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={isDark ? vscDarkPlus : vs}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '11px',
            lineHeight: '1.625',
            background: isDark ? 'rgb(15 23 42)' : 'rgb(248 250 252)',
            border: 'none',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }
          }}
          showLineNumbers={false}
          wrapLines={false}
          wrapLongLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ThemedCodeBlock;
