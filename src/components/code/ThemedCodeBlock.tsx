/**
 * Themed Code Block Component
 *
 * Reusable code block with theme support and copy functionality
 * Respects the independent code theme from CodeThemeProvider
 */

import { useState } from 'react';
import { Copy, CheckCircle2, Download } from 'lucide-react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCodeTheme } from '@/providers/CodeThemeProvider';
import { CodeThemeToggle } from './CodeThemeToggle';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { vibrateSuccess } from '@/utils/hapticFeedback';
import './code-animations.css';

// Register only needed languages for optimal bundle size
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('markdown', markdown);

// ============================================================================
// Types
// ============================================================================

export interface ThemedCodeBlockProps {
  /** Code content to display */
  code: string;

  /** Programming language */
  language: 'typescript' | 'javascript' | 'json' | 'markdown';

  /** Show copy button */
  showCopyButton?: boolean;

  /** Show download button */
  showDownloadButton?: boolean;

  /** Show theme toggle */
  showThemeToggle?: boolean;

  /** Show language badge */
  showLanguageBadge?: boolean;

  /** Show line numbers */
  showLineNumbers?: boolean;

  /** Filename for download */
  filename?: string;

  /** Additional CSS classes */
  className?: string;

  /** Custom header content */
  headerContent?: React.ReactNode;

  /** Force a specific theme (overrides useCodeTheme) */
  forceTheme?: 'light' | 'dark';
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
  showLineNumbers = true,
  filename,
  className,
  headerContent,
  forceTheme,
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
      case 'markdown':
        return '.md';
      default:
        return '.txt';
    }
  };

  // Copy to clipboard with haptic feedback
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);

      // Haptic feedback for mobile devices
      vibrateSuccess();

      // Enhanced toast notification
      toast.success('Code copied to clipboard!', {
        duration: 2000,
        icon: '✨',
      });

      // Reset after 2.5 seconds
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy code');
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
  // Use forceTheme if provided, otherwise use resolvedCodeTheme
  const isDark = forceTheme
    ? forceTheme === 'dark'
    : resolvedCodeTheme === 'dark';

  const containerClasses = cn(
    'rounded-lg transition-colors duration-200',
    isDark
      ? 'dark bg-slate-900 border border-slate-700'
      : 'bg-slate-50 border border-slate-200',
    className,
  );

  const headerClasses = cn(
    'flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b',
    isDark ? 'border-slate-700' : 'border-slate-200',
  );

  const badgeVariant = isDark ? 'secondary' : 'outline';

  return (
    <div className={containerClasses}>
      {/* Header */}
      {(showLanguageBadge ||
        showThemeToggle ||
        showCopyButton ||
        showDownloadButton ||
        headerContent) && (
        <div className={headerClasses}>
          <div className="flex items-center gap-2 min-w-0">
            {showLanguageBadge && (
              <Badge
                variant={badgeVariant}
                className="text-[10px] font-mono shrink-0"
              >
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
                className={cn(
                  'h-7 px-2 shrink-0 transition-colors-smooth button-hover-lift relative',
                  copied && 'copy-success copy-success-glow',
                  copied && isDark && 'success-dark',
                  copied && !isDark && 'success-light',
                  isDark
                    ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-800'
                    : 'text-slate-700 hover:text-slate-900',
                )}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1 checkmark-pop" />
                    <span className="text-xs font-medium">Copied!</span>
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
                className={cn(
                  'h-7 px-2 shrink-0',
                  isDark
                    ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-800'
                    : 'text-slate-700 hover:text-slate-900',
                )}
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
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '13px',
            lineHeight: '2',
            background: isDark ? '#0f172a' : '#f8fafc',
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
          lineNumberStyle={{
            minWidth: '3ch',
            paddingRight: '1rem',
            color: isDark ? '#64748b' : '#94a3b8',
            opacity: 0.8,
            userSelect: 'none',
          }}
          codeTagProps={{
            style: {
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            },
          }}
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
