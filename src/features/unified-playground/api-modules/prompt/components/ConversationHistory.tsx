/**
 * ConversationHistory Component
 * Sidebar displaying conversation history with search, export, and management
 */

import React, { useState, useMemo } from 'react';
import { AlertCircle, Paperclip, Download, Trash2, X } from 'lucide-react';
import type { Message } from '../types';

interface ConversationHistoryProps {
  messages: Message[];
  tokenCount: number;
  maxTokens: number;
  onClear?: () => void;
  onExport?: (format: 'json' | 'txt' | 'markdown') => void;
  onRemoveMessage?: (messageId: string) => void;
  onMessageClick?: (messageId: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  messages,
  tokenCount,
  maxTokens,
  onClear,
  onExport,
  onRemoveMessage,
  onMessageClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Calculate token usage percentage
  const tokenPercentage = Math.round((tokenCount / maxTokens) * 100);
  const isNearLimit = tokenPercentage >= 80;
  const isAtLimit = tokenPercentage >= 95;

  // Filter messages by search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) {
      return messages;
    }

    const query = searchQuery.toLowerCase();
    return messages.filter(
      (msg) =>
        msg.content.toLowerCase().includes(query) ||
        msg.role.toLowerCase().includes(query),
    );
  }, [messages, searchQuery]);

  // Handle export
  const handleExport = (format: 'json' | 'txt' | 'markdown') => {
    onExport?.(format);
    setShowExportMenu(false);
  };

  // Handle clear with confirmation
  const handleClearClick = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    onClear?.();
    setShowClearConfirm(false);
  };

  const cancelClear = () => {
    setShowClearConfirm(false);
  };

  return (
    <div className="conversation-history flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Search Section */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full px-3 py-2 pr-8 border rounded text-sm"
            aria-label="Search messages"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Token Usage Meter */}
      <div className="p-4 border-b bg-white dark:bg-gray-800">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Token Usage</span>
            <span
              className={`font-mono ${
                isAtLimit
                  ? 'text-red-600'
                  : isNearLimit
                    ? 'text-yellow-600'
                    : 'text-gray-600'
              }`}
            >
              {tokenCount.toLocaleString()} / {maxTokens.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isAtLimit
                  ? 'bg-red-500'
                  : isNearLimit
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(tokenPercentage, 100)}%` }}
            />
          </div>
          {isNearLimit && (
            <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <p>
                {isAtLimit
                  ? 'Context limit reached. Clear history to continue.'
                  : 'Approaching context limit.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Message Count */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
        {filteredMessages.length === messages.length
          ? `${messages.length} message${messages.length !== 1 ? 's' : ''}`
          : `${filteredMessages.length} of ${messages.length} message${messages.length !== 1 ? 's' : ''}`}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500 scroll-smooth">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            {searchQuery ? 'No messages found' : 'No messages yet'}
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className="group relative p-3 border rounded hover:bg-white dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => onMessageClick?.(message.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onMessageClick?.(message.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View ${message.role} message from ${new Date(message.timestamp).toLocaleString()}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold uppercase ${
                        message.role === 'user'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {message.role}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {message.content}
                  </p>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Paperclip className="w-3 h-3" />
                      <span>
                        {message.attachments.length} attachment
                        {message.attachments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
                {onRemoveMessage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveMessage(message.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity"
                    aria-label="Remove message"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t bg-white dark:bg-gray-800 space-y-2">
        {/* Export Button with Menu */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={messages.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Export conversation"
          >
            <Download className="w-4 h-4" />
            <span>Export Conversation</span>
          </button>
          {showExportMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border rounded shadow-lg">
              <button
                onClick={() => handleExport('json')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Export as JSON
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Export as Text
              </button>
              <button
                onClick={() => handleExport('markdown')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Export as Markdown
              </button>
            </div>
          )}
        </div>

        {/* Clear Button with Confirmation */}
        {!showClearConfirm ? (
          <button
            onClick={handleClearClick}
            disabled={messages.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 rounded text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Clear conversation history"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium text-center">
              Clear all messages?
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmClear}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Yes, Clear
              </button>
              <button
                onClick={cancelClear}
                className="flex-1 px-4 py-2 border rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHistory;
