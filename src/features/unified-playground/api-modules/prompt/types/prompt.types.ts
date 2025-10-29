/**
 * Prompt API Configuration and Session Types
 *
 * Types for prompt configuration, messages, conversations, and sessions
 *
 * SECURITY: System prompts are now predefined via systemPromptId (OWASP LLM01:2025 compliant)
 *
 * @module prompt/types/prompt.types
 */

import type { LanguageModelCreateOptions } from './api.types';
import type { SystemPromptId } from '../../../shared/utils/promptConstruction';

// ============================================================================
// Message Types
// ============================================================================

/**
 * Message role in conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Single message in a conversation
 */
export interface Message {
  /** Unique message ID */
  id: string;

  /** Message role (user, assistant, system) */
  role: MessageRole;

  /** Message content (text) */
  content: string;

  /** Attached files/images (optional) */
  attachments?: MessageAttachment[];

  /** Message timestamp */
  timestamp: Date;

  /** Tokens used in this message (if available) */
  tokens?: number;

  /** Message metadata */
  metadata?: MessageMetadata;
}

/**
 * Message attachment reference
 */
export interface MessageAttachment {
  /** Attachment ID */
  id: string;

  /** Attachment type */
  type: 'image' | 'file';

  /** File name */
  name: string;

  /** File size in bytes */
  size: number;

  /** MIME type */
  mimeType: string;

  /** Data URL or blob URL */
  url: string;

  /** Preview URL (for images) */
  previewUrl?: string;

  /** Image dimensions (for images) */
  dimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Message metadata
 */
export interface MessageMetadata {
  /** Processing time in milliseconds */
  processingTime?: number;

  /** Was this message streamed? */
  streamed?: boolean;

  /** Was this message regenerated? */
  regenerated?: boolean;

  /** Error information if message failed */
  error?: string;

  /** Model configuration used */
  modelConfig?: LanguageModelCreateOptions;
}

// ============================================================================
// Conversation Types
// ============================================================================

/**
 * Conversation/session container
 */
export interface Conversation {
  /** Unique conversation ID */
  id: string;

  /** Conversation title (generated or user-set) */
  title: string;

  /** All messages in chronological order */
  messages: Message[];

  /** Conversation creation timestamp */
  createdAt: Date;

  /** Last message timestamp */
  updatedAt: Date;

  /** SECURITY: System prompt ID (predefined) for this conversation */
  systemPromptId?: SystemPromptId;

  /** Model configuration for this conversation */
  modelConfig: LanguageModelCreateOptions;

  /** Total tokens used in conversation */
  totalTokens: number;

  /** Conversation metadata */
  metadata: ConversationMetadata;
}

/**
 * Conversation metadata
 */
export interface ConversationMetadata {
  /** Number of messages */
  messageCount: number;

  /** Number of user messages */
  userMessageCount: number;

  /** Number of assistant messages */
  assistantMessageCount: number;

  /** Average response time in milliseconds */
  averageResponseTime: number;

  /** Total processing time in milliseconds */
  totalProcessingTime: number;

  /** Was any message regenerated? */
  hasRegenerations: boolean;

  /** Conversation tags/labels */
  tags?: string[];
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Prompt playground configuration
 *
 * SECURITY: Uses systemPromptId instead of user-editable systemPrompt
 */
export interface PromptConfig extends LanguageModelCreateOptions {
  /**
   * SECURITY: System prompt ID (predefined, non-user-editable)
   * Replaces the vulnerable user-editable systemPrompt field
   * @see ALLOWED_SYSTEM_PROMPTS in promptConstruction.ts
   */
  systemPromptId?: SystemPromptId;

  /** Enable streaming responses? */
  enableStreaming: boolean;

  /** Enable auto-save to localStorage? */
  enableAutoSave: boolean;

  /** Enable conversation history? */
  enableHistory: boolean;

  /** Maximum conversation history length */
  maxHistoryLength: number;

  /** Enable markdown rendering? */
  enableMarkdown: boolean;

  /** Enable code syntax highlighting? */
  enableCodeHighlight: boolean;
}

/**
 * Default prompt configuration
 *
 * SECURITY: Uses predefined system prompt ID
 */
export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  systemPromptId: 'general', // SECURITY: Predefined prompt (OWASP LLM01:2025 compliant)
  temperature: 0.8,
  topK: 8,
  maxTokens: 2048, // Default max tokens for responses (max allowed: 4096)
  enableStreaming: true,
  enableAutoSave: true,
  enableHistory: true,
  maxHistoryLength: 50,
  enableMarkdown: true,
  enableCodeHighlight: true,
};

// ============================================================================
// Session Management Types
// ============================================================================

/**
 * Active prompt session
 */
export interface PromptSession {
  /** Session ID */
  id: string;

  /** Current conversation */
  conversation: Conversation;

  /** Session state */
  state: SessionState;

  /** Session start time */
  startedAt: Date;

  /** Last activity time */
  lastActivity: Date;
}

/**
 * Session state
 */
export type SessionState =
  | 'idle' // No active operation
  | 'prompting' // Executing prompt
  | 'streaming' // Streaming response
  | 'processing' // Processing attachments
  | 'error'; // Error state

/**
 * Session storage data (for persistence)
 */
export interface SessionStorageData {
  /** Stored conversations */
  conversations: Conversation[];

  /** Active conversation ID */
  activeConversationId?: string;

  /** User preferences */
  preferences: PromptConfig;

  /** Last updated timestamp */
  lastUpdated: Date;
}

// ============================================================================
// Context Window Management Types
// ============================================================================

/**
 * Context window information
 */
export interface ContextWindow {
  /** Maximum tokens allowed */
  maxTokens: number;

  /** Tokens used so far */
  tokensUsed: number;

  /** Tokens remaining */
  tokensRemaining: number;

  /** Percentage used (0-100) */
  percentageUsed: number;

  /** Is the context window near limit? */
  nearLimit: boolean;

  /** Warning message if near limit */
  warningMessage: string | null;
}

/**
 * Token usage breakdown
 */
export interface TokenUsage {
  /** System prompt tokens */
  systemPromptTokens: number;

  /** Conversation history tokens */
  historyTokens: number;

  /** Current prompt tokens */
  promptTokens: number;

  /** Total input tokens */
  totalInputTokens: number;

  /** Response tokens (output) */
  responseTokens: number;

  /** Total tokens */
  totalTokens: number;
}

// ============================================================================
// Streaming Types
// ============================================================================

/**
 * Streaming status
 */
export type StreamingStatus = 'idle' | 'streaming' | 'complete' | 'error';

/**
 * Streaming state
 */
export interface StreamingState {
  /** Current status */
  status: StreamingStatus;

  /** Accumulated content */
  content: string;

  /** Chunks received */
  chunksReceived: number;

  /** Start time */
  startTime: Date | null;

  /** End time */
  endTime: Date | null;

  /** Time to first chunk (latency) */
  timeToFirstChunk: number | null;

  /** Error if failed */
  error: string | null;
}

// ============================================================================
// Export/Import Types
// ============================================================================

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'markdown' | 'txt' | 'csv' | 'html';

/**
 * Export data structure
 */
export interface ExportData {
  /** Export format version */
  version: string;

  /** Export timestamp */
  timestamp: Date;

  /** Exported conversation */
  conversation: Conversation;

  /** Export format */
  format: ExportFormat;

  /** Export metadata */
  metadata: {
    exportedBy: string;
    source: string;
    includesAttachments: boolean;
  };
}

// ============================================================================
// Performance Metrics Types
// ============================================================================

/**
 * Prompt performance metrics
 */
export interface PromptMetrics {
  /** Prompt execution time in milliseconds */
  executionTime: number;

  /** Time to first token (for streaming) */
  timeToFirstToken: number | null;

  /** Tokens per second (for streaming) */
  tokensPerSecond: number | null;

  /** Total tokens used */
  tokensUsed: number;

  /** Model initialization time */
  initTime: number | null;

  /** Processing start time */
  startTime: Date;

  /** Processing end time */
  endTime: Date;

  /** Was operation successful? */
  success: boolean;

  /** Error message if failed */
  error?: string;
}

/**
 * Aggregated performance statistics
 */
export interface PerformanceStatistics {
  /** Total prompts executed */
  totalPrompts: number;

  /** Successful prompts */
  successfulPrompts: number;

  /** Failed prompts */
  failedPrompts: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Average execution time */
  averageExecutionTime: number;

  /** Average tokens per prompt */
  averageTokensPerPrompt: number;

  /** Total tokens used */
  totalTokensUsed: number;

  /** Fastest prompt time */
  fastestPromptTime: number;

  /** Slowest prompt time */
  slowestPromptTime: number;

  /** Session start time */
  sessionStart: Date;

  /** Last prompt time */
  lastPromptTime: Date | null;
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Prompt input state
 */
export interface PromptInputState {
  /** Current input value */
  value: string;

  /** Is input focused? */
  focused: boolean;

  /** Attached files */
  attachments: MessageAttachment[];

  /** Input character count */
  characterCount: number;

  /** Estimated token count */
  estimatedTokens: number;

  /** Is input valid? */
  valid: boolean;

  /** Validation error message */
  validationError?: string;
}

/**
 * Configuration panel state
 */
export interface ConfigPanelState {
  /** Is panel open/expanded? */
  open: boolean;

  /** Active configuration tab */
  activeTab: 'basic' | 'advanced' | 'system';

  /** Unsaved changes? */
  hasUnsavedChanges: boolean;

  /** Configuration being edited */
  editingConfig: PromptConfig;
}

/**
 * Chat interface state
 */
export interface ChatInterfaceState {
  /** Should auto-scroll to bottom? */
  autoScroll: boolean;

  /** Is history panel open? */
  historyPanelOpen: boolean;

  /** Selected message IDs (for actions) */
  selectedMessages: string[];

  /** Message being edited */
  editingMessageId: string | null;

  /** Search query for messages */
  searchQuery: string;

  /** Filtered messages based on search */
  filteredMessages: Message[];
}

// ============================================================================
// Preset Templates Types
// ============================================================================

/**
 * Prompt template for common use cases
 */
export interface PromptTemplate {
  /** Template ID */
  id: string;

  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Template category */
  category:
    | 'general'
    | 'coding'
    | 'writing'
    | 'analysis'
    | 'creative'
    | 'learning';

  /** SECURITY: System prompt ID (predefined) */
  systemPromptId: SystemPromptId;

  /** Recommended configuration */
  config: Partial<PromptConfig>;

  /** Example prompts */
  examples: string[];

  /** Template icon */
  icon: string;
}

/**
 * Built-in prompt templates
 *
 * SECURITY: Uses predefined system prompt IDs
 */
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'general-assistant',
    name: 'General Assistant',
    description: 'A helpful AI assistant for everyday questions and tasks',
    category: 'general',
    systemPromptId: 'general', // SECURITY: Predefined prompt
    config: {
      temperature: 0.7,
      topK: 8,
    },
    examples: [
      'What is the capital of France?',
      'Explain quantum computing in simple terms',
      'Help me plan a trip to Japan',
    ],
    icon: '🤖',
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    description: 'Expert programming help and code generation',
    category: 'coding',
    systemPromptId: 'technical', // SECURITY: Predefined prompt
    config: {
      temperature: 0.3,
      topK: 5,
      enableCodeHighlight: true,
    },
    examples: [
      'Write a function to sort an array in JavaScript',
      'Explain how async/await works in TypeScript',
      'Debug this React component',
    ],
    icon: '💻',
  },
  {
    id: 'creative-writer',
    name: 'Creative Writer',
    description: 'Generate creative content, stories, and ideas',
    category: 'creative',
    systemPromptId: 'creative', // SECURITY: Predefined prompt
    config: {
      temperature: 0.9,
      topK: 40,
    },
    examples: [
      'Write a short story about a time traveler',
      'Generate ideas for a sci-fi novel',
      'Help me write a compelling character description',
    ],
    icon: '✍️',
  },
];
