/**
 * PromptInput Component
 * Multiline textarea with keyboard shortcuts and file attachment
 */

import React, { useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { FieldError } from '../../shared/components';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onAttachFile?: () => void;
  disabled?: boolean;
  placeholder?: string;
  hasFiles?: boolean;
  estimatedTokens?: number;
  /** Inline error message to display */
  error?: string;
  /** Error help text for recovery guidance */
  errorHelpText?: string;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onSubmit,
  onAttachFile,
  disabled = false,
  placeholder = 'Type your message...',
  estimatedTokens = 0,
  error,
  errorHelpText,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
    }
  }, [value]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to submit (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }

    // Escape to clear
    if (e.key === 'Escape') {
      onChange('');
    }
  };

  return (
    <div className="prompt-input-container space-y-2">
      {/* Textarea Container */}
      <div
        className={`border rounded-lg bg-white dark:bg-gray-800 ${error ? 'border-red-400 dark:border-red-500' : ''}`}
      >
        <textarea
          ref={textareaRef}
          id="prompt-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="Message input"
          aria-invalid={!!error}
          aria-describedby={
            error
              ? 'prompt-input-error prompt-input-info prompt-input-shortcuts'
              : 'prompt-input-info prompt-input-shortcuts'
          }
          className="w-full p-3 resize-none rounded-t-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] max-h-[50vh] overflow-y-auto"
          rows={3}
        />

        {/* Action Bar - Outside textarea */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
          {/* Left: File Attachment */}
          <div className="flex items-center">
            {onAttachFile && (
              <button
                onClick={onAttachFile}
                disabled={disabled}
                aria-label="Attach file"
                className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>

          {/* Right: Send Button */}
          <button
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            aria-label="Send message"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline error message */}
      {error && (
        <FieldError
          id="prompt-input-error"
          message={error}
          helpText={errorHelpText}
          severity="error"
        />
      )}

      {/* Info Bar */}
      <div className="flex justify-between text-xs">
        {/* Character/Token Count - with aria-live for screen readers */}
        <span
          id="prompt-input-info"
          aria-live="polite"
          aria-atomic="true"
          className="text-gray-600 dark:text-gray-400"
        >
          {value.length} characters
          {estimatedTokens > 0 && ` • ~${estimatedTokens} tokens`}
        </span>

        {/* Keyboard Shortcuts Help */}
        <span
          id="prompt-input-shortcuts"
          className="text-gray-400 dark:text-gray-500"
        >
          Enter to send • Shift+Enter for newline • Escape to clear
        </span>
      </div>
    </div>
  );
};

export default PromptInput;
