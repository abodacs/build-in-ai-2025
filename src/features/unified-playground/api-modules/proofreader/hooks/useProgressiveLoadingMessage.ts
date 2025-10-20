/**
 * useProgressiveLoadingMessage Hook
 *
 * Provides time-based progressive loading messages that escalate as time passes.
 * Helps users understand what's happening during long-running operations.
 *
 * @module proofreader/hooks/useProgressiveLoadingMessage
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Loading message with contextual information
 */
export interface LoadingMessage {
  /** Main message text */
  message: string;

  /** Optional subtitle or additional context */
  subtitle?: string;

  /** Optional help text or tip */
  helpText?: string;

  /** Message severity/urgency level */
  level: 'info' | 'warning' | 'urgent';

  /** Optional action link */
  actionLink?: {
    text: string;
    url: string;
  };
}

/**
 * Hook return type
 */
export interface UseProgressiveLoadingMessageReturn {
  /** Current loading message */
  currentMessage: LoadingMessage;

  /** Time elapsed in seconds */
  elapsedTime: number;

  /** Reset the timer */
  reset: () => void;
}

// ============================================================================
// Message Stages
// ============================================================================

/**
 * Progressive loading messages for Proofreader initialization
 */
const PROOFREADER_MESSAGES: { threshold: number; message: LoadingMessage }[] = [
  // 0-10 seconds: Initial optimistic message
  {
    threshold: 0,
    message: {
      message: 'Initializing Proofreader...',
      subtitle: 'Setting up the proofreading engine',
      level: 'info',
    },
  },
  // 10-30 seconds: Let them know it might take a while
  {
    threshold: 10,
    message: {
      message: 'Downloading AI Model...',
      subtitle: 'This may take up to 3 minutes on first use',
      helpText:
        'The Proofreader API requires a large language model (~22GB). Download happens once.',
      level: 'info',
    },
  },
  // 30-60 seconds: Provide more context
  {
    threshold: 30,
    message: {
      message: 'Model Download in Progress...',
      subtitle: 'Large download detected. Please ensure stable connection.',
      helpText:
        'Requirements: Unmetered Wi-Fi connection, 22GB+ free storage, Chrome 141-145 (Origin Trial)',
      level: 'warning',
    },
  },
  // 60-120 seconds: Escalate with troubleshooting
  {
    threshold: 60,
    message: {
      message: 'Still Downloading Model...',
      subtitle: 'Download may take several minutes on slower connections',
      helpText:
        'This is normal for first-time setup. You can check download status at chrome://on-device-internals',
      level: 'warning',
      actionLink: {
        text: 'Check Download Status',
        url: 'chrome://on-device-internals',
      },
    },
  },
  // 120+ seconds: Troubleshooting guidance
  {
    threshold: 120,
    message: {
      message: 'Download Taking Longer Than Expected',
      subtitle: 'If stuck, verify system requirements',
      helpText:
        'Ensure: 22GB+ free disk space, 4GB+ VRAM, unmetered connection, Origin Trial enabled. Check chrome://on-device-internals for errors.',
      level: 'urgent',
      actionLink: {
        text: 'Troubleshooting Guide',
        url: 'chrome://on-device-internals',
      },
    },
  },
];

// ============================================================================
// Hook
// ============================================================================

/**
 * Progressive loading message hook
 *
 * Returns increasingly detailed/urgent messages as time passes.
 *
 * @param isActive - Whether loading is currently active
 * @param messageType - Type of loading operation ('proofreader-init' | 'proofreading')
 * @returns Loading message state and controls
 *
 * @example
 * ```tsx
 * const { currentMessage, elapsedTime } = useProgressiveLoadingMessage(
 *   isLoading,
 *   'proofreader-init'
 * );
 *
 * return (
 *   <div>
 *     <h3>{currentMessage.message}</h3>
 *     <p>{currentMessage.subtitle}</p>
 *     {currentMessage.helpText && <small>{currentMessage.helpText}</small>}
 *   </div>
 * );
 * ```
 */
export function useProgressiveLoadingMessage(
  isActive: boolean,
  messageType: 'proofreader-init' | 'proofreading' = 'proofreader-init',
): UseProgressiveLoadingMessageReturn {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Reset timer when inactive
  useEffect(() => {
    if (!isActive) {
      setElapsedTime(0);
      return;
    }

    // Start timer when active
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // Get current message based on elapsed time
  const getCurrentMessage = useCallback((): LoadingMessage => {
    // For regular proofreading (not initialization), return simple message
    if (messageType === 'proofreading') {
      return {
        message: 'Proofreading Text...',
        subtitle: 'Analyzing text for corrections',
        level: 'info',
      };
    }

    // For initialization, use progressive messages
    const messages = PROOFREADER_MESSAGES;

    // Find the appropriate message based on elapsed time
    // Start from the end and work backwards to find the highest threshold that's been passed
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg && elapsedTime >= msg.threshold) {
        return msg.message;
      }
    }

    // Fallback to first message (should never happen, but safe)
    return (
      messages[0]?.message ?? { message: 'Loading...', level: 'info' as const }
    );
  }, [elapsedTime, messageType]);

  // Reset function
  const reset = useCallback(() => {
    setElapsedTime(0);
  }, []);

  return {
    currentMessage: getCurrentMessage(),
    elapsedTime,
    reset,
  };
}

// ============================================================================
// Export
// ============================================================================

export default useProgressiveLoadingMessage;
