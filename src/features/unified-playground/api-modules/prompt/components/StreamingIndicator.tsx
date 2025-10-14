/**
 * StreamingIndicator Component
 * Animated indicator for streaming responses with typing animation
 */

import React, { useEffect, useState } from 'react';

interface StreamingIndicatorProps {
  /**
   * Is streaming active?
   */
  isStreaming: boolean;

  /**
   * Current streaming content (partial response)
   */
  content?: string;

  /**
   * Show content along with indicator?
   */
  showContent?: boolean;

  /**
   * Custom label text
   */
  label?: string;

  /**
   * Indicator variant
   */
  variant?: 'dots' | 'pulse' | 'typing' | 'spinner';

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Show elapsed time?
   */
  showElapsedTime?: boolean;
}

export const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({
  isStreaming,
  content,
  showContent = true,
  label = 'AI is thinking',
  variant = 'dots',
  size = 'md',
  showElapsedTime = false,
}) => {
  const [dots, setDots] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Animate dots
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev % 3) + 1);
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Track elapsed time
  useEffect(() => {
    if (!isStreaming || !showElapsedTime) {
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming, showElapsedTime]);

  if (!isStreaming) {
    return null;
  }

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  // Render different variants
  const renderIndicator = () => {
    switch (variant) {
      case 'dots':
        return (
          <span className="inline-flex gap-1">
            <span
              className={`w-2 h-2 rounded-full bg-blue-500 ${dots >= 1 ? 'opacity-100' : 'opacity-30'} transition-opacity`}
            />
            <span
              className={`w-2 h-2 rounded-full bg-blue-500 ${dots >= 2 ? 'opacity-100' : 'opacity-30'} transition-opacity`}
            />
            <span
              className={`w-2 h-2 rounded-full bg-blue-500 ${dots >= 3 ? 'opacity-100' : 'opacity-30'} transition-opacity`}
            />
          </span>
        );

      case 'pulse':
        return (
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </span>
        );

      case 'typing':
        return (
          <span className="inline-flex items-baseline gap-1">
            <span
              className="animate-bounce inline-block h-2 w-2 rounded-full bg-blue-500"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="animate-bounce inline-block h-2 w-2 rounded-full bg-blue-500"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="animate-bounce inline-block h-2 w-2 rounded-full bg-blue-500"
              style={{ animationDelay: '300ms' }}
            />
          </span>
        );

      case 'spinner':
        return (
          <span className="inline-block">
            <svg
              className="animate-spin h-5 w-5 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`streaming-indicator ${sizeClasses[size]}`}>
      {/* Indicator with label */}
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        {renderIndicator()}
        <span className="font-medium">{label}</span>
        {showElapsedTime && elapsedTime > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">
            {elapsedTime}s
          </span>
        )}
      </div>

      {/* Streaming content preview */}
      {showContent && content && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border-l-2 border-blue-500 relative">
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {content}
            {/* Blinking cursor */}
            <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamingIndicator;
