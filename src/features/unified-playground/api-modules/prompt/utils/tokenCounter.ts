/**
 * Token Counter Utilities
 *
 * Utility functions for estimating token counts and managing context windows
 *
 * @module prompt/utils/tokenCounter
 */

import type { Message, TokenUsage, ContextWindow } from '../types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Average characters per token (rough estimate)
 * This varies by language and tokenization method, but 4 is a reasonable average
 */
const CHARS_PER_TOKEN = 4;

/**
 * Average tokens per word (English)
 */
const TOKENS_PER_WORD = 1.3;

/**
 * Default maximum context tokens
 */
const DEFAULT_MAX_TOKENS = 4096;

// ============================================================================
// Basic Token Estimation
// ============================================================================

/**
 * Estimate token count from text (character-based)
 * @param text - Text to count tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  if (!text) {
    return 0;
  }

  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Estimate token count from text (word-based)
 * @param text - Text to count tokens for
 * @returns Estimated token count
 */
export function estimateTokensFromWords(text: string): number {
  if (!text) {
    return 0;
  }

  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * TOKENS_PER_WORD);
}

/**
 * Estimate tokens using average of both methods
 * @param text - Text to count tokens for
 * @returns Estimated token count
 */
export function estimateTokensAccurate(text: string): number {
  if (!text) {
    return 0;
  }

  const charBased = estimateTokens(text);
  const wordBased = estimateTokensFromWords(text);

  return Math.round((charBased + wordBased) / 2);
}

// ============================================================================
// Message Token Counting
// ============================================================================

/**
 * Estimate tokens in a single message
 * @param message - Message to count
 * @returns Estimated token count
 */
export function estimateMessageTokens(message: Message): number {
  let total = 0;

  // Content tokens
  total += estimateTokensAccurate(message.content);

  // Add overhead for role and structure (~4 tokens per message)
  total += 4;

  // Add tokens for attachments (estimated)
  if (message.attachments && message.attachments.length > 0) {
    // Each image adds approximately 85-170 tokens depending on detail level
    // Using 128 as average
    total += message.attachments.length * 128;
  }

  return total;
}

/**
 * Estimate tokens for multiple messages
 * @param messages - Messages to count
 * @returns Estimated token count
 */
export function estimateMessagesTokens(messages: Message[]): number {
  return messages.reduce((total, message) => {
    return total + estimateMessageTokens(message);
  }, 0);
}

/**
 * Estimate tokens for conversation history
 * @param messages - All messages in conversation
 * @param systemPrompt - Optional system prompt
 * @returns Token usage breakdown
 */
export function estimateConversationTokens(
  messages: Message[],
  systemPrompt?: string,
): TokenUsage {
  const systemPromptTokens = systemPrompt
    ? estimateTokensAccurate(systemPrompt) + 4 // +4 for structure
    : 0;

  const userMessages = messages.filter((m) => m.role === 'user');
  const assistantMessages = messages.filter((m) => m.role === 'assistant');

  const promptTokens = estimateMessagesTokens(userMessages);
  const responseTokens = estimateMessagesTokens(assistantMessages);
  const historyTokens = promptTokens + responseTokens;

  return {
    systemPromptTokens,
    historyTokens,
    promptTokens,
    totalInputTokens: systemPromptTokens + historyTokens,
    responseTokens,
    totalTokens: systemPromptTokens + historyTokens,
  };
}

// ============================================================================
// Context Window Management
// ============================================================================

/**
 * Calculate context window usage
 * @param currentTokens - Current token count
 * @param maxTokens - Maximum allowed tokens
 * @param warningThreshold - Threshold for warning (0-1)
 * @returns Context window information
 */
export function calculateContextWindow(
  currentTokens: number,
  maxTokens: number = DEFAULT_MAX_TOKENS,
  warningThreshold: number = 0.8,
): ContextWindow {
  const tokensRemaining = maxTokens - currentTokens;
  const rawPercentage = (currentTokens / maxTokens) * 100;
  // Round to nearest integer for clean display
  const percentageUsed = Math.round(rawPercentage);
  const nearLimit = rawPercentage >= warningThreshold * 100;

  let warningMessage: string | null = null;

  if (nearLimit) {
    if (rawPercentage >= 95) {
      warningMessage = `Context window is almost full (${percentageUsed}%). Please start a new conversation.`;
    } else {
      warningMessage = `Context window is ${percentageUsed}% full. Consider starting a new conversation soon.`;
    }
  }

  return {
    maxTokens,
    tokensUsed: currentTokens,
    tokensRemaining,
    percentageUsed,
    nearLimit,
    warningMessage,
  };
}

/**
 * Check if there's enough space for a new message
 * @param currentTokens - Current token count
 * @param newMessageTokens - Estimated tokens for new message
 * @param maxTokens - Maximum allowed tokens
 * @param reserveTokens - Reserve space for response (default: 500)
 * @returns true if there's enough space
 */
export function hasSpaceForMessage(
  currentTokens: number,
  newMessageTokens: number,
  maxTokens: number = DEFAULT_MAX_TOKENS,
  reserveTokens: number = 500,
): boolean {
  return currentTokens + newMessageTokens + reserveTokens <= maxTokens;
}

/**
 * Calculate how many messages can fit in remaining context
 * @param currentTokens - Current token count
 * @param averageMessageTokens - Average tokens per message
 * @param maxTokens - Maximum allowed tokens
 * @param reserveTokens - Reserve space for response
 * @returns Number of messages that can fit
 */
export function getRemainingMessageCapacity(
  currentTokens: number,
  averageMessageTokens: number,
  maxTokens: number = DEFAULT_MAX_TOKENS,
  reserveTokens: number = 500,
): number {
  const availableTokens = maxTokens - currentTokens - reserveTokens;

  if (availableTokens <= 0) {
    return 0;
  }

  return Math.floor(availableTokens / averageMessageTokens);
}

// ============================================================================
// History Trimming
// ============================================================================

/**
 * Trim messages to fit within token limit
 * Keeps most recent messages and preserves conversation flow
 * @param messages - All messages
 * @param maxTokens - Maximum tokens to keep
 * @param systemPrompt - Optional system prompt
 * @returns Trimmed messages
 */
export function trimMessagesToFit(
  messages: Message[],
  maxTokens: number,
  systemPrompt?: string,
): Message[] {
  if (messages.length === 0) {
    return [];
  }

  const systemTokens = systemPrompt
    ? estimateTokensAccurate(systemPrompt) + 4
    : 0;

  const availableTokens = maxTokens - systemTokens;

  // Separate system messages (always keep these)
  const systemMessages = messages.filter((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');

  // Always keep at least one message, even if it exceeds the limit
  if (nonSystemMessages.length === 0) {
    return systemMessages;
  }

  // Start from the end (most recent) and work backwards
  const trimmedMessages: Message[] = [];
  let currentTokens = 0;

  // Add system messages first (always included)
  for (const message of systemMessages) {
    trimmedMessages.push(message);
    currentTokens += estimateMessageTokens(message);
  }

  // Add non-system messages from most recent backwards
  for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
    const message = nonSystemMessages[i];
    const messageTokens = estimateMessageTokens(message);

    if (
      currentTokens + messageTokens <= availableTokens ||
      trimmedMessages.filter((m) => m.role !== 'system').length === 0
    ) {
      trimmedMessages.push(message);
      currentTokens += messageTokens;
    } else {
      // Can't fit any more messages
      break;
    }
  }

  // Restore original order
  trimmedMessages.sort((a, b) => {
    const indexA = messages.indexOf(a);
    const indexB = messages.indexOf(b);
    return indexA - indexB;
  });

  return trimmedMessages;
}

/**
 * Get messages that should be removed to fit within limit
 * @param messages - All messages
 * @param maxTokens - Maximum tokens allowed
 * @param systemPrompt - Optional system prompt
 * @returns Messages to remove
 */
export function getMessagesToRemove(
  messages: Message[],
  maxTokens: number,
  systemPrompt?: string,
): Message[] {
  const trimmed = trimMessagesToFit(messages, maxTokens, systemPrompt);
  const toRemove: Message[] = [];

  for (const message of messages) {
    if (!trimmed.find((m) => m.id === message.id)) {
      toRemove.push(message);
    }
  }

  return toRemove;
}

// ============================================================================
// Text Truncation
// ============================================================================

/**
 * Truncate text to fit within token limit
 * @param text - Text to truncate
 * @param maxTokens - Maximum tokens
 * @param suffix - Suffix to add when truncated (e.g., "...")
 * @returns Truncated text
 */
export function truncateToTokenLimit(
  text: string,
  maxTokens: number,
  suffix: string = '...',
): string {
  const currentTokens = estimateTokens(text);

  if (currentTokens <= maxTokens) {
    return text;
  }

  // Calculate target character count
  const suffixTokens = estimateTokens(suffix);
  const targetTokens = maxTokens - suffixTokens;
  const targetChars = targetTokens * CHARS_PER_TOKEN;

  // Truncate and add suffix
  return text.substring(0, targetChars) + suffix;
}

/**
 * Truncate text smartly (at word boundaries)
 * @param text - Text to truncate
 * @param maxTokens - Maximum tokens
 * @param suffix - Suffix to add when truncated
 * @returns Truncated text
 */
export function truncateToTokenLimitSmart(
  text: string,
  maxTokens: number,
  suffix: string = '...',
): string {
  const currentTokens = estimateTokens(text);

  if (currentTokens <= maxTokens) {
    return text;
  }

  // Calculate target character count
  const suffixTokens = estimateTokens(suffix);
  const targetTokens = maxTokens - suffixTokens;
  const targetChars = targetTokens * CHARS_PER_TOKEN;

  // Find last word boundary before target
  let truncateAt = targetChars;
  while (truncateAt > 0 && text[truncateAt] !== ' ') {
    truncateAt--;
  }

  // If no word boundary found, just truncate at target
  if (truncateAt === 0) {
    truncateAt = targetChars;
  }

  return text.substring(0, truncateAt).trim() + suffix;
}

// ============================================================================
// Token Cost Estimation
// ============================================================================

/**
 * Estimate cost of a conversation (in tokens)
 * Useful for understanding conversation "cost" in context window
 * @param messages - All messages
 * @param systemPrompt - Optional system prompt
 * @returns Cost breakdown
 */
export function estimateConversationCost(
  messages: Message[],
  systemPrompt?: string,
): {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  averagePerMessage: number;
  messagesCount: number;
} {
  const usage = estimateConversationTokens(messages, systemPrompt);
  const messagesCount = messages.length;
  const averagePerMessage =
    messagesCount > 0 ? usage.totalTokens / messagesCount : 0;

  return {
    inputTokens: usage.totalInputTokens,
    outputTokens: usage.responseTokens,
    totalTokens: usage.totalTokens,
    averagePerMessage,
    messagesCount,
  };
}

/**
 * Estimate remaining conversation turns
 * @param currentTokens - Current tokens used
 * @param averageMessagePairTokens - Average tokens per user+assistant pair
 * @param maxTokens - Maximum tokens
 * @returns Estimated remaining turns
 */
export function estimateRemainingTurns(
  currentTokens: number,
  averageMessagePairTokens: number,
  maxTokens: number = DEFAULT_MAX_TOKENS,
): number {
  const remainingTokens = maxTokens - currentTokens;

  if (remainingTokens <= 0) {
    return 0;
  }

  return Math.floor(remainingTokens / averageMessagePairTokens);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format token count to human-readable string
 * @param tokens - Token count
 * @returns Formatted string (e.g., "1.2K tokens")
 */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens} tokens`;
  } else if (tokens < 1000000) {
    return `${(tokens / 1000).toFixed(1)}K tokens`;
  } else {
    return `${(tokens / 1000000).toFixed(2)}M tokens`;
  }
}

/**
 * Get token count color based on usage
 * @param percentageUsed - Percentage of context used (0-100)
 * @returns Color indicator
 */
export function getTokenCountColor(
  percentageUsed: number,
): 'green' | 'yellow' | 'orange' | 'red' {
  if (percentageUsed < 50) {
    return 'green';
  } else if (percentageUsed < 75) {
    return 'yellow';
  } else if (percentageUsed < 90) {
    return 'orange';
  } else {
    return 'red';
  }
}

// ============================================================================
// Export
// ============================================================================

export default {
  estimateTokens,
  estimateTokensFromWords,
  estimateTokensAccurate,
  estimateMessageTokens,
  estimateMessagesTokens,
  estimateConversationTokens,
  calculateContextWindow,
  hasSpaceForMessage,
  getRemainingMessageCapacity,
  trimMessagesToFit,
  getMessagesToRemove,
  truncateToTokenLimit,
  truncateToTokenLimitSmart,
  estimateConversationCost,
  estimateRemainingTurns,
  formatTokenCount,
  getTokenCountColor,
};
