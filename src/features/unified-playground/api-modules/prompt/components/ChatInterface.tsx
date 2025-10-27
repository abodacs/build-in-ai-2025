/**
 * ChatInterface Component
 * Displays conversation messages with manual scroll control
 * PERFORMANCE OPTIMIZED: Memoized to prevent unnecessary re-renders
 */

import React, { memo } from 'react';
import { MessageSquare, StopCircle } from 'lucide-react';
import type { Message } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatInterfaceProps {
  messages: Message[];
  isStreaming?: boolean;
  streamingContent?: string;
  onCopyMessage?: (content: string) => void;
  onStop?: () => void;
  onExamplePromptClick?: (prompt: string) => void;
}

const ChatInterfaceComponent: React.FC<ChatInterfaceProps> = ({
  messages,
  isStreaming = false,
  streamingContent = '',
  onCopyMessage,
  onStop,
  onExamplePromptClick,
}) => {
  if (messages.length === 0 && !isStreaming) {
    return (
      <div
        className="chat-interface flex items-center justify-center h-full text-gray-500 p-8"
        role="status"
        aria-live="polite"
      >
        <div className="text-center space-y-6 max-w-2xl">
          <MessageSquare
            className="w-16 h-16 mx-auto text-blue-400"
            aria-hidden="true"
          />
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              Start a conversation with AI
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Try these example prompts or type your own below
            </p>
          </div>

          {/* Example Prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
            <button
              onClick={() =>
                onExamplePromptClick?.(
                  'Explain quantum computing in simple terms',
                )
              }
              className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-400 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Try example prompt: Explain quantum computing"
            >
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Explain quantum computing
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Get a simple explanation of complex topics
              </div>
            </button>

            <button
              onClick={() =>
                onExamplePromptClick?.(
                  'Write a creative short story about a time traveler',
                )
              }
              className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-400 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Try example prompt: Write a creative story"
            >
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Write a creative story
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Generate creative content and ideas
              </div>
            </button>

            <button
              onClick={() =>
                onExamplePromptClick?.(
                  'Help me write a JavaScript function to debounce user input',
                )
              }
              className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-400 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Try example prompt: Help me code a function"
            >
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Help me code a function
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Get coding assistance and examples
              </div>
            </button>

            <button
              onClick={() =>
                onExamplePromptClick?.(
                  'Describe what you see in the image I uploaded',
                )
              }
              className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-400 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Try example prompt with image: Describe this image"
            >
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                📷 Describe this image
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Attach images for multimodal analysis
              </div>
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-blue-500" aria-hidden="true">
                  ✓
                </span>
                <span>Streaming responses in real-time</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500" aria-hidden="true">
                  ✓
                </span>
                <span>Image upload & analysis (up to 3)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500" aria-hidden="true">
                  ✓
                </span>
                <span>100% private, runs on your device</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Chat Messages Container */}
      <div className="chat-interface flex-1 flex flex-col space-y-4 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-900 hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500 scroll-smooth">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onCopy={onCopyMessage}
          />
        ))}

        {/* Streaming Message */}
        {isStreaming && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent || 'Waiting for response...',
              timestamp: new Date(),
            }}
            isStreaming
          />
        )}
      </div>

      {/* Stop Button (shown during streaming) */}
      {isStreaming && onStop && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={onStop}
            aria-label="Stop generation"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors animate-pulse"
            title="Stop generation"
          >
            <StopCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Stop</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Memoize component with custom comparison
// Only re-render if messages array, streaming state, or streaming content changes
export const ChatInterface = memo(
  ChatInterfaceComponent,
  (prevProps, nextProps) => {
    // Re-render if streaming state changed
    if (prevProps.isStreaming !== nextProps.isStreaming) {
      return false;
    }

    // Re-render if streaming content changed
    if (prevProps.streamingContent !== nextProps.streamingContent) {
      return false;
    }

    // Re-render if messages array reference changed or length changed
    if (
      prevProps.messages !== nextProps.messages ||
      prevProps.messages.length !== nextProps.messages.length
    ) {
      return false;
    }

    // Re-render if callback references changed (rare, but important for correctness)
    if (
      prevProps.onCopyMessage !== nextProps.onCopyMessage ||
      prevProps.onStop !== nextProps.onStop ||
      prevProps.onExamplePromptClick !== nextProps.onExamplePromptClick
    ) {
      return false;
    }

    // Props are equal, skip re-render
    return true;
  },
);

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;
