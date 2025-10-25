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

  /** Optional copyable URL (for chrome:// URLs that can't be linked) */
  copyableUrl?: {
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
 * Generate progressive loading messages for any API
 * @param apiName - Name of the API (e.g., 'Prompt', 'Proofreader', 'Rewriter')
 * @returns Array of time-based loading messages
 */
function getProgressiveMessages(
  apiName: string,
): { threshold: number; message: LoadingMessage }[] {
  return [
    // 0-10 seconds: Initial optimistic message
    {
      threshold: 0,
      message: {
        message: `Initializing ${apiName}...`,
        subtitle: `Setting up the ${apiName.toLowerCase()} engine`,
        level: 'info',
      },
    },
    // 10-30 seconds: Let them know it might take a while
    {
      threshold: 10,
      message: {
        message: 'Downloading AI Model...',
        subtitle: 'This may take up to 3 minutes on first use',
        helpText: `The ${apiName} API requires a large language model (~22GB). Download happens once.`,
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
          'Requirements: Unmetered Wi-Fi connection, 22GB+ free storage, Chrome 138+',
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
          'This is normal for first-time setup. You can check download status in Chrome internals.',
        level: 'warning',
        copyableUrl: {
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
          'Ensure: 22GB+ free disk space, 4GB+ VRAM, unmetered connection.',
        level: 'urgent',
        copyableUrl: {
          text: 'Open Chrome Internals',
          url: 'chrome://on-device-internals',
        },
      },
    },
  ];
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Progressive loading message hook
 *
 * Returns increasingly detailed/urgent messages as time passes.
 *
 * @param isActive - Whether loading is currently active
 * @param apiName - Name of the API (e.g., 'Prompt', 'Proofreader', 'Rewriter')
 * @param messageType - Type of loading operation ('init' | 'processing')
 * @returns Loading message state and controls
 *
 * @example
 * ```tsx
 * const { currentMessage, elapsedTime } = useProgressiveLoadingMessage(
 *   isLoading,
 *   'Prompt',
 *   'init'
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
  apiName: string = 'Proofreader',
  messageType: 'init' | 'processing' = 'init',
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
    // For regular processing (not initialization), return simple message
    if (messageType === 'processing') {
      return {
        message: `Processing with ${apiName}...`,
        subtitle: `Analyzing text with ${apiName}`,
        level: 'info',
      };
    }

    // For initialization, use progressive messages
    const messages = getProgressiveMessages(apiName);

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
  }, [elapsedTime, apiName, messageType]);

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
