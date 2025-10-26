/**
 * MessageBubble Component
 * Individual message display with markdown support
 * PERFORMANCE OPTIMIZED: Memoized to prevent unnecessary re-renders
 */

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  memo,
} from 'react';
import DOMPurify from 'dompurify';
import { Copy, Edit, RotateCcw, Trash2, MoreVertical } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '../types';
import type { Components } from 'react-markdown';

// Register only needed languages for optimal bundle size
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('json', json);

interface MessageBubbleProps {
  message: Message;
  onCopy?: (content: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  isStreaming?: boolean;
}

/**
 * Custom markdown components for Streamdown
 * Provides syntax highlighting for TypeScript and JavaScript only
 */
const createMarkdownComponents = (
  isDarkMode: boolean,
): Partial<Components> => ({
  // Use div instead of p to avoid invalid nesting of <pre> inside <p>
  p: ({ children, ...props }) => (
    <div className="my-2" {...props}>
      {children}
    </div>
  ),
  code: ({
    inline,
    className,
    children,
    ref: _ref,
    ...props
  }: React.ClassAttributes<HTMLElement> &
    React.HTMLAttributes<HTMLElement> & {
      inline?: boolean;
      node?: unknown;
    }) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match?.[1] ?? '';

    // Only support TypeScript, JavaScript, and JSON
    const supportedLanguages = [
      'typescript',
      'ts',
      'javascript',
      'js',
      'tsx',
      'jsx',
      'json',
    ];
    const normalizedLang = language.toLowerCase();
    const isSupported = supportedLanguages.includes(normalizedLang);

    if (!inline && isSupported) {
      const displayLang =
        normalizedLang === 'ts' || normalizedLang === 'tsx'
          ? 'typescript'
          : normalizedLang === 'js' || normalizedLang === 'jsx'
            ? 'javascript'
            : normalizedLang;

      return (
        <div className="relative group my-4">
          <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded z-10">
            {displayLang}
          </div>
          <SyntaxHighlighter
            language={displayLang}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={isDarkMode ? (oneDark as any) : (oneLight as any)}
            customStyle={{
              margin: 0,
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              padding: '1rem',
            }}
            showLineNumbers
            {...(props as React.HTMLAttributes<HTMLElement>)}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    }

    // Inline code or unsupported language
    if (!inline) {
      return (
        <pre className="bg-gray-800 dark:bg-gray-900 rounded p-4 overflow-x-auto my-4">
          <code className="text-sm text-gray-100" {...props}>
            {children}
          </code>
        </pre>
      );
    }

    return (
      <code
        className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm"
        {...props}
      >
        {children}
      </code>
    );
  },
});

const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({
  message,
  onCopy,
  onEdit,
  onRegenerate,
  onDelete,
  isStreaming = false,
}) => {
  const isUser = message.role === 'user';

  // Memoize dark mode check to avoid querying DOM on every render
  const isDarkMode = useMemo(
    () => document.documentElement.classList.contains('dark'),
    [], // Only check once per mount - theme changes trigger full page re-render anyway
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Memoize event handlers to prevent child re-renders
  const handleCopy = useCallback(() => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      navigator.clipboard.writeText(message.content);
    }
    setIsMenuOpen(false);
  }, [onCopy, message.content]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setIsMenuOpen(false);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  }, [onEdit, message.id, message.content, editContent]);

  const handleCancelEdit = useCallback(() => {
    setEditContent(message.content);
    setIsEditing(false);
  }, [message.content]);

  const handleRegenerate = useCallback(() => {
    if (onRegenerate) {
      onRegenerate(message.id);
    }
    setIsMenuOpen(false);
  }, [onRegenerate, message.id]);

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(message.id);
    }
    setIsMenuOpen(false);
  }, [onDelete, message.id]);

  // Memoize markdown components to prevent recreation on every render
  const markdownComponents = useMemo(
    () => createMarkdownComponents(isDarkMode),
    [isDarkMode],
  );

  /**
   * Sanitize assistant message content for safe display
   * Only sanitize assistant messages, user messages are plain text
   */
  const sanitizedContent = useMemo(
    () =>
      !isUser
        ? DOMPurify.sanitize(message.content, {
            ALLOWED_TAGS: [
              'p',
              'br',
              'strong',
              'em',
              'u',
              'span',
              'div',
              'h1',
              'h2',
              'h3',
              'h4',
              'h5',
              'h6',
              'ul',
              'ol',
              'li',
              'code',
              'pre',
              'blockquote',
              'a',
            ],
            ALLOWED_ATTR: ['class', 'href', 'rel', 'target'],
            ALLOW_DATA_ATTR: false,
          })
        : message.content,
    [message.content, isUser],
  );

  return (
    <div
      className={`message-bubble flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[80%] rounded-lg p-4 space-y-2
          ${isUser ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}
          ${isStreaming ? 'animate-pulse' : ''}
        `}
      >
        {/* Role Label and Actions */}
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold uppercase ${isUser ? 'opacity-70' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {message.role}
          </span>
          {!isStreaming && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Message actions"
                className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isUser ? 'text-white opacity-70 hover:opacity-100' : 'text-gray-600 dark:text-gray-400'}`}
                title="Message actions"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {/* Action Menu Dropdown */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>

                    {(isUser || onEdit) && (
                      <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    )}

                    {!isUser && onRegenerate && (
                      <button
                        onClick={handleRegenerate}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Regenerate</span>
                      </button>
                    )}

                    {onDelete && (
                      <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          // Edit Mode
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-[100px] resize-y"
              aria-label="Edit message content"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            className={
              isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'
            }
          >
            {isUser ? (
              // User messages: plain text with line breaks
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            ) : (
              // Assistant messages: render markdown with syntax highlighting
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown components={markdownComponents}>
                  {sanitizedContent}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.attachments.map((attachment) => (
              <img
                key={attachment.id}
                src={attachment.previewUrl || attachment.url}
                alt={attachment.name}
                className="w-20 h-20 object-cover rounded border"
              />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-xs ${isUser ? 'opacity-50' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {message.timestamp.toLocaleTimeString()}
          {message.metadata?.processingTime && (
            <span className="ml-2">
              • {(message.metadata.processingTime / 1000).toFixed(2)}s
            </span>
          )}
        </div>

        {/* Streaming Indicator - Optimized with transform for better performance */}
        {isStreaming && (
          <div className="flex items-center space-x-1 text-xs">
            <span
              className="inline-block"
              style={{
                animation: 'streamingDot 1.4s ease-in-out infinite',
                willChange: 'transform',
              }}
            >
              ●
            </span>
            <span
              className="inline-block"
              style={{
                animation: 'streamingDot 1.4s ease-in-out 0.2s infinite',
                willChange: 'transform',
              }}
            >
              ●
            </span>
            <span
              className="inline-block"
              style={{
                animation: 'streamingDot 1.4s ease-in-out 0.4s infinite',
                willChange: 'transform',
              }}
            >
              ●
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize component with custom comparison function
// Only re-render if message content, role, or streaming state changes
export const MessageBubble = memo(
  MessageBubbleComponent,
  (prevProps, nextProps) => {
    // If streaming state changed, re-render
    if (prevProps.isStreaming !== nextProps.isStreaming) {
      return false;
    }

    // If message content or metadata changed, re-render
    if (
      prevProps.message.content !== nextProps.message.content ||
      prevProps.message.role !== nextProps.message.role ||
      prevProps.message.id !== nextProps.message.id
    ) {
      return false;
    }

    // If callbacks changed identity (rare), re-render
    if (
      prevProps.onCopy !== nextProps.onCopy ||
      prevProps.onEdit !== nextProps.onEdit ||
      prevProps.onRegenerate !== nextProps.onRegenerate ||
      prevProps.onDelete !== nextProps.onDelete
    ) {
      return false;
    }

    // Props are equal, skip re-render
    return true;
  },
);

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
