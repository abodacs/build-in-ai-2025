/**
 * ChatInterface Component
 * Displays conversation messages with auto-scroll, stop button, and scroll controls
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MessageSquare, ArrowDown, StopCircle } from 'lucide-react';
import type { Message } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatInterfaceProps {
  messages: Message[];
  isStreaming?: boolean;
  streamingContent?: string;
  onCopyMessage?: (content: string) => void;
  onStop?: () => void;
  autoScroll?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isStreaming = false,
  streamingContent = '',
  onCopyMessage,
  onStop,
  autoScroll = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Intersection Observer to detect if user is at bottom
  useEffect(() => {
    const bottomElement = bottomRef.current;
    if (!bottomElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isBottom = entries[0].isIntersecting;
        setIsAtBottom(isBottom);
        setShowScrollButton(!isBottom && messages.length > 0);
      },
      {
        root: containerRef.current,
        threshold: 0.1,
      },
    );

    observer.observe(bottomElement);

    return () => {
      observer.disconnect();
    };
  }, [messages.length]);

  // Auto-scroll to bottom when new messages arrive (only if user was at bottom)
  useEffect(() => {
    if (autoScroll && isAtBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, autoScroll, isAtBottom]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="chat-interface flex items-center justify-center h-full text-gray-500">
        <div className="text-center space-y-4">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-400" />
          <div className="space-y-2">
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm text-gray-400">
              Type a message below to begin
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Chat Messages Container */}
      <div
        ref={containerRef}
        className="chat-interface flex flex-col space-y-4 p-4 overflow-y-auto h-full"
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onCopy={onCopyMessage}
          />
        ))}

        {/* Streaming Message */}
        {isStreaming && streamingContent && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              timestamp: new Date(),
            }}
            isStreaming
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        {/* Stop Button (shown during streaming) */}
        {isStreaming && onStop && (
          <button
            onClick={onStop}
            aria-label="Stop generation"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors animate-pulse"
            title="Stop generation"
          >
            <StopCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Stop</span>
          </button>
        )}

        {/* Scroll to Bottom Button (shown when not at bottom) */}
        {showScrollButton && !isStreaming && (
          <button
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
            className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
