/**
 * Session Manager
 *
 * Manages conversation history, context window, and session persistence.
 * Handles message storage, retrieval, and localStorage sync.
 *
 * @module prompt/services/SessionManager
 */

import type {
  Message,
  Conversation,
  SessionStorageData,
  ContextWindow,
  TokenUsage,
  PromptConfig,
  MessageRole,
  MessageAttachment,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_PREFIX = 'chrome-ai-prompt-session';
const MAX_STORED_CONVERSATIONS = 50;
const CONTEXT_WINDOW_WARNING_THRESHOLD = 0.8; // 80%

// ============================================================================
// SessionManager Class
// ============================================================================

/**
 * SessionManager - Conversation history and session management
 *
 * Responsibilities:
 * - Message creation and storage
 * - Conversation management
 * - Context window tracking
 * - localStorage persistence
 * - Conversation export/import
 */
export class SessionManager {
  // Current active conversation
  private activeConversation: Conversation | null = null;

  // All conversations (recent first)
  private conversations: Conversation[] = [];

  // Storage enabled flag
  private storageEnabled: boolean = true;

  // Max context tokens (default, can be updated)
  private maxContextTokens: number = 4096;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(storageEnabled = true) {
    this.storageEnabled = storageEnabled;

    if (this.storageEnabled) {
      this.loadFromStorage();
    }
  }

  // ============================================================================
  // Conversation Management
  // ============================================================================

  /**
   * Create a new conversation
   * @param config - Prompt configuration for the conversation
   * @param title - Optional conversation title
   * @returns Created conversation
   */
  createConversation(
    config: PromptConfig,
    title = 'New Conversation',
  ): Conversation {
    const now = new Date();

    const conversation: Conversation = {
      id: this.generateId(),
      title,
      messages: [],
      createdAt: now,
      updatedAt: now,
      systemPrompt: config.systemPrompt,
      modelConfig: {
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        topK: config.topK,
        maxTokens: config.maxTokens,
      },
      totalTokens: 0,
      metadata: {
        messageCount: 0,
        userMessageCount: 0,
        assistantMessageCount: 0,
        averageResponseTime: 0,
        totalProcessingTime: 0,
        hasRegenerations: false,
      },
    };

    this.conversations.unshift(conversation);
    this.activeConversation = conversation;

    // Limit stored conversations
    if (this.conversations.length > MAX_STORED_CONVERSATIONS) {
      this.conversations = this.conversations.slice(
        0,
        MAX_STORED_CONVERSATIONS,
      );
    }

    this.saveToStorage();

    return conversation;
  }

  /**
   * Get active conversation
   */
  getActiveConversation(): Conversation | null {
    return this.activeConversation;
  }

  /**
   * Set active conversation by ID
   * @param conversationId - Conversation ID to activate
   * @returns true if found and activated
   */
  setActiveConversation(conversationId: string): boolean {
    const conversation = this.conversations.find(
      (c) => c.id === conversationId,
    );

    if (conversation) {
      this.activeConversation = conversation;
      this.saveToStorage();
      return true;
    }

    return false;
  }

  /**
   * Get all conversations
   */
  getAllConversations(): Conversation[] {
    return [...this.conversations];
  }

  /**
   * Get conversation by ID
   */
  getConversation(conversationId: string): Conversation | null {
    return this.conversations.find((c) => c.id === conversationId) || null;
  }

  /**
   * Delete conversation
   * @param conversationId - Conversation ID to delete
   * @returns true if deleted
   */
  deleteConversation(conversationId: string): boolean {
    const index = this.conversations.findIndex((c) => c.id === conversationId);

    if (index === -1) {
      return false;
    }

    this.conversations.splice(index, 1);

    // If active conversation was deleted, clear it
    if (this.activeConversation?.id === conversationId) {
      this.activeConversation = null;
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Clear all conversations
   */
  clearAllConversations(): void {
    this.conversations = [];
    this.activeConversation = null;
    this.saveToStorage();
  }

  /**
   * Update conversation title
   */
  updateConversationTitle(conversationId: string, title: string): boolean {
    const conversation = this.conversations.find(
      (c) => c.id === conversationId,
    );

    if (conversation) {
      conversation.title = title;
      conversation.updatedAt = new Date();
      this.saveToStorage();
      return true;
    }

    return false;
  }

  // ============================================================================
  // Message Management
  // ============================================================================

  /**
   * Add a message to the active conversation
   * @param role - Message role
   * @param content - Message content
   * @param attachments - Optional attachments
   * @param metadata - Optional metadata
   * @returns Created message
   */
  addMessage(
    role: MessageRole,
    content: string,
    attachments?: MessageAttachment[],
    metadata?: Message['metadata'],
  ): Message {
    if (!this.activeConversation) {
      throw new Error(
        'No active conversation. Call createConversation() first.',
      );
    }

    const message: Message = {
      id: this.generateId(),
      role,
      content,
      attachments,
      timestamp: new Date(),
      metadata,
    };

    this.activeConversation.messages.push(message);
    this.activeConversation.updatedAt = new Date();

    // Update metadata
    this.updateConversationMetadata();

    this.saveToStorage();

    return message;
  }

  /**
   * Add user message
   */
  addUserMessage(content: string, attachments?: MessageAttachment[]): Message {
    return this.addMessage('user', content, attachments);
  }

  /**
   * Add assistant message
   */
  addAssistantMessage(
    content: string,
    metadata?: Message['metadata'],
  ): Message {
    return this.addMessage('assistant', content, undefined, metadata);
  }

  /**
   * Get all messages from active conversation
   */
  getMessages(): Message[] {
    if (!this.activeConversation) {
      return [];
    }

    return [...this.activeConversation.messages];
  }

  /**
   * Get messages by role
   */
  getMessagesByRole(role: MessageRole): Message[] {
    if (!this.activeConversation) {
      return [];
    }

    return this.activeConversation.messages.filter((m) => m.role === role);
  }

  /**
   * Get last N messages
   */
  getLastMessages(count: number): Message[] {
    if (!this.activeConversation) {
      return [];
    }

    return this.activeConversation.messages.slice(-count);
  }

  /**
   * Update message content (for regenerations)
   */
  updateMessage(messageId: string, content: string): boolean {
    if (!this.activeConversation) {
      return false;
    }

    const message = this.activeConversation.messages.find(
      (m) => m.id === messageId,
    );

    if (message) {
      message.content = content;
      message.metadata = {
        ...message.metadata,
        regenerated: true,
      };
      this.activeConversation.updatedAt = new Date();
      this.updateConversationMetadata();
      this.saveToStorage();
      return true;
    }

    return false;
  }

  /**
   * Delete message
   */
  deleteMessage(messageId: string): boolean {
    if (!this.activeConversation) {
      return false;
    }

    const index = this.activeConversation.messages.findIndex(
      (m) => m.id === messageId,
    );

    if (index !== -1) {
      this.activeConversation.messages.splice(index, 1);
      this.activeConversation.updatedAt = new Date();
      this.updateConversationMetadata();
      this.saveToStorage();
      return true;
    }

    return false;
  }

  /**
   * Clear messages in active conversation
   */
  clearMessages(): void {
    if (!this.activeConversation) {
      return;
    }

    this.activeConversation.messages = [];
    this.activeConversation.updatedAt = new Date();
    this.updateConversationMetadata();
    this.saveToStorage();
  }

  // ============================================================================
  // Context Window Management
  // ============================================================================

  /**
   * Set maximum context tokens
   */
  setMaxContextTokens(maxTokens: number): void {
    this.maxContextTokens = maxTokens;
  }

  /**
   * Get context window information
   * @param currentTokens - Current token count
   * @returns Context window info
   */
  getContextWindow(currentTokens: number): ContextWindow {
    const tokensRemaining = this.maxContextTokens - currentTokens;
    const percentageUsed = (currentTokens / this.maxContextTokens) * 100;
    const nearLimit = percentageUsed >= CONTEXT_WINDOW_WARNING_THRESHOLD * 100;

    return {
      maxTokens: this.maxContextTokens,
      tokensUsed: currentTokens,
      tokensRemaining,
      percentageUsed,
      nearLimit,
      warningMessage: nearLimit
        ? `Context window is ${Math.round(percentageUsed)}% full. Consider starting a new conversation.`
        : null,
    };
  }

  /**
   * Get token usage breakdown (estimated)
   * Note: This is an estimate since we don't have actual token counts
   */
  getTokenUsageEstimate(): TokenUsage {
    if (!this.activeConversation) {
      return {
        systemPromptTokens: 0,
        historyTokens: 0,
        promptTokens: 0,
        totalInputTokens: 0,
        responseTokens: 0,
        totalTokens: 0,
      };
    }

    // Rough estimate: 1 token ~= 4 characters
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);

    const systemPromptTokens = this.activeConversation.systemPrompt
      ? estimateTokens(this.activeConversation.systemPrompt)
      : 0;

    let historyTokens = 0;
    let userTokens = 0;
    let assistantTokens = 0;

    for (const message of this.activeConversation.messages) {
      const tokens = estimateTokens(message.content);

      if (message.role === 'user') {
        userTokens += tokens;
      } else if (message.role === 'assistant') {
        assistantTokens += tokens;
      }

      historyTokens += tokens;
    }

    return {
      systemPromptTokens,
      historyTokens,
      promptTokens: userTokens,
      totalInputTokens: systemPromptTokens + historyTokens,
      responseTokens: assistantTokens,
      totalTokens: systemPromptTokens + historyTokens,
    };
  }

  // ============================================================================
  // Metadata Management
  // ============================================================================

  /**
   * Update conversation metadata
   */
  private updateConversationMetadata(): void {
    if (!this.activeConversation) {
      return;
    }

    const messages = this.activeConversation.messages;
    const userMessages = messages.filter((m) => m.role === 'user');
    const assistantMessages = messages.filter((m) => m.role === 'assistant');

    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;

    for (const message of assistantMessages) {
      if (message.metadata?.processingTime) {
        totalResponseTime += message.metadata.processingTime;
        responseCount++;
      }
    }

    const averageResponseTime =
      responseCount > 0 ? totalResponseTime / responseCount : 0;

    // Check for regenerations
    const hasRegenerations = messages.some(
      (m) => m.metadata?.regenerated === true,
    );

    this.activeConversation.metadata = {
      messageCount: messages.length,
      userMessageCount: userMessages.length,
      assistantMessageCount: assistantMessages.length,
      averageResponseTime,
      totalProcessingTime: totalResponseTime,
      hasRegenerations,
    };
  }

  // ============================================================================
  // Storage Management
  // ============================================================================

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    if (!this.storageEnabled) {
      return;
    }

    try {
      const data: SessionStorageData = {
        conversations: this.conversations,
        activeConversationId: this.activeConversation?.id,
        preferences: {} as PromptConfig, // Would be set separately
        lastUpdated: new Date(),
      };

      // Transform dates before stringifying (Date.toJSON() is called before replacer)
      const transformed = this.transformDatesForStorage(data);

      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}-data`,
        JSON.stringify(transformed),
      );
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}-data`);

      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      const data: SessionStorageData = this.transformDatesFromStorage(parsed);

      this.conversations = data.conversations || [];

      // Set active conversation
      if (data.activeConversationId) {
        this.activeConversation =
          this.conversations.find((c) => c.id === data.activeConversationId) ||
          null;
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  /**
   * Clear localStorage
   */
  clearStorage(): void {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}-data`);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  // ============================================================================
  // Export/Import
  // ============================================================================

  /**
   * Export conversation as JSON
   */
  exportConversation(conversationId?: string): string {
    const conversation = conversationId
      ? this.getConversation(conversationId)
      : this.activeConversation;

    if (!conversation) {
      throw new Error('No conversation to export');
    }

    const transformed = this.transformDatesForStorage(conversation);
    return JSON.stringify(transformed, null, 2);
  }

  /**
   * Import conversation from JSON
   */
  importConversation(json: string): Conversation {
    try {
      const parsed = JSON.parse(json);
      const conversation: Conversation = this.transformDatesFromStorage(parsed);

      // Generate new ID to avoid conflicts
      conversation.id = this.generateId();

      this.conversations.unshift(conversation);
      this.saveToStorage();

      return conversation;
    } catch {
      throw new Error('Failed to import conversation: Invalid JSON');
    }
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Transform dates to storage format (deep copy with date replacement)
   */
  private transformDatesForStorage(obj: any): any {
    if (obj instanceof Date) {
      return { __type: 'Date', value: obj.toISOString() };
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformDatesForStorage(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = this.transformDatesForStorage(obj[key]);
        }
      }
      return result;
    }

    return obj;
  }

  /**
   * Transform dates from storage format (deep copy with date reconstruction)
   */
  private transformDatesFromStorage(obj: any): any {
    if (obj && typeof obj === 'object' && obj.__type === 'Date') {
      return new Date(obj.value);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformDatesFromStorage(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = this.transformDatesFromStorage(obj[key]);
        }
      }
      return result;
    }

    return obj;
  }
}

// ============================================================================
// Export
// ============================================================================

export default SessionManager;
