/**
 * MessageBubble Component
 * Individual message display with markdown support
 */

import React, { useState, useRef, useEffect } from 'react';
import { Copy, Edit, RotateCcw, Trash2, MoreVertical } from 'lucide-react';
import { Streamdown } from 'streamdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '../types';
import type { Components } from 'react-markdown';

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
  code: ({ node: _node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    // Only support TypeScript and JavaScript
    const supportedLanguages = [
      'typescript',
      'ts',
      'javascript',
      'js',
      'tsx',
      'jsx',
    ];
    const normalizedLang = language.toLowerCase();
    const isSupported = supportedLanguages.includes(normalizedLang);

    if (!inline && isSupported) {
      const displayLang =
        normalizedLang === 'ts'
          ? 'typescript'
          : normalizedLang === 'js'
            ? 'javascript'
            : normalizedLang;

      return (
        <div className="relative group my-4">
          <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded z-10">
            {displayLang}
          </div>
          <SyntaxHighlighter
            language={displayLang}
            style={isDarkMode ? oneDark : oneLight}
            customStyle={{
              margin: 0,
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              padding: '1rem',
            }}
            showLineNumbers
            {...props}
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

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onCopy,
  onEdit,
  onRegenerate,
  onDelete,
  isStreaming = false,
}) => {
  const isUser = message.role === 'user';
  const isDarkMode = document.documentElement.classList.contains('dark');
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

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      navigator.clipboard.writeText(message.content);
    }
    setIsMenuOpen(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(message.id);
    }
    setIsMenuOpen(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
    setIsMenuOpen(false);
  };

  // Get custom markdown components
  const markdownComponents = createMarkdownComponents(isDarkMode);

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
                <Streamdown components={markdownComponents}>
                  {message.content}
                </Streamdown>
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

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="flex items-center space-x-1 text-xs">
            <span className="animate-bounce">●</span>
            <span className="animate-bounce delay-100">●</span>
            <span className="animate-bounce delay-200">●</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
