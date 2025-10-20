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
  const lastMessageCountRef = useRef(messages.length);

  // Scroll to bottom handler with configurable behavior
  const scrollToBottom = useCallback(
    (behavior: 'auto' | 'smooth' = 'smooth') => {
      if (bottomRef.current) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ behavior });
        });
      }
    },
    [],
  );

  // Intersection Observer to detect if user is at bottom
  useEffect(() => {
    const bottomElement = bottomRef.current;
    if (!bottomElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isBottom = entries[0]?.isIntersecting ?? false;
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

  // Check if user is actually at bottom (more reliable than state during fast updates)
  const checkIsAtBottom = useCallback(() => {
    if (!containerRef.current) return false;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Consider "at bottom" if within 100px of bottom
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // Auto-scroll on new messages (only if user is at bottom)
  useEffect(() => {
    if (!autoScroll) return;

    const currentMessageCount = messages.length;
    const hasNewMessage = currentMessageCount > lastMessageCountRef.current;

    if (hasNewMessage) {
      // New message added - only scroll if user is at bottom
      if (isAtBottom) {
        scrollToBottom('smooth');
      }
      lastMessageCountRef.current = currentMessageCount;
    } else if (isStreaming && streamingContent) {
      // Streaming in progress - check actual scroll position for accuracy
      // This prevents scroll from happening if user scrolled up during streaming
      if (checkIsAtBottom()) {
        scrollToBottom('auto'); // Use 'auto' for smoother streaming experience
      }
    }
  }, [
    messages.length,
    streamingContent,
    isStreaming,
    autoScroll,
    isAtBottom,
    scrollToBottom,
    checkIsAtBottom,
  ]);

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
        className="chat-interface flex flex-col space-y-4 p-4 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-900 hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500 scroll-smooth"
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
            onClick={() => {
              scrollToBottom('smooth');
              // Reset tracking to prevent double-scroll
              lastMessageCountRef.current = messages.length;
            }}
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
