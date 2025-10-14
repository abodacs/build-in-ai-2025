/**
 * useConversationHistory Hook
 *
 * Hook for managing conversation history and messages.
 *
 * @module prompt/hooks/useConversationHistory
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { SessionManager } from '../services/SessionManager';
import type {
  Conversation,
  Message,
  MessageRole,
  MessageAttachment,
  ContextWindow,
  ExportFormat,
} from '../types';
import {
  estimateConversationTokens,
  calculateContextWindow,
} from '../utils/tokenCounter';

// ============================================================================
// Types
// ============================================================================

interface UseConversationHistoryOptions {
  /** Enable auto-save to localStorage */
  autoSave?: boolean;

  /** Maximum context tokens */
  maxContextTokens?: number;

  /** System prompt */
  systemPrompt?: string;
}

interface UseConversationHistoryReturn {
  // Current conversation
  currentConversation: Conversation | null;
  messages: Message[];
  messageCount: number;

  // Conversation management
  createConversation: (title?: string) => void;
  switchConversation: (conversationId: string) => boolean;
  deleteConversation: (conversationId: string) => boolean;
  clearCurrentConversation: () => void;
  updateConversationTitle: (title: string) => void;

  // Message management
  addMessage: (
    role: MessageRole,
    content: string,
    attachments?: MessageAttachment[],
  ) => Message;
  updateMessage: (messageId: string, content: string) => boolean;
  deleteMessage: (messageId: string) => boolean;
  clearMessages: () => void;
  getLastMessages: (count: number) => Message[];
  getMessagesByRole: (role: MessageRole) => Message[];

  // Context window
  contextWindow: ContextWindow;
  isNearContextLimit: boolean;

  // All conversations
  allConversations: Conversation[];

  // Export/Import
  exportConversation: (format: ExportFormat) => string;
  importConversation: (json: string) => Conversation;

  // State
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useConversationHistory - Manage conversation history
 *
 * Provides conversation and message management with context window tracking.
 */
export function useConversationHistory(
  options: UseConversationHistoryOptions = {},
): UseConversationHistoryReturn {
  const { autoSave = true, maxContextTokens = 4096, systemPrompt } = options;

  // Session manager
  const sessionManagerRef = useRef<SessionManager | null>(null);

  // State
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [contextWindow, setContextWindow] = useState<ContextWindow>({
    maxTokens: maxContextTokens,
    tokensUsed: 0,
    tokensRemaining: maxContextTokens,
    percentageUsed: 0,
    nearLimit: false,
    warningMessage: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const messageCount = messages.length;
  const isNearContextLimit = contextWindow.nearLimit;

  // ============================================================================
  // Initialization
  // ============================================================================

  useEffect(() => {
    if (!sessionManagerRef.current) {
      sessionManagerRef.current = new SessionManager(autoSave);
      sessionManagerRef.current.setMaxContextTokens(maxContextTokens);

      // Load existing conversation or create new one
      const existing = sessionManagerRef.current.getActiveConversation();
      if (existing) {
        setCurrentConversation(existing);
        setMessages(existing.messages);
      }

      // Load all conversations
      setAllConversations(sessionManagerRef.current.getAllConversations());
    }
  }, [autoSave, maxContextTokens]);

  // ============================================================================
  // Conversation Management
  // ============================================================================

  /**
   * Create a new conversation
   */
  const createConversation = useCallback(
    (title = 'New Conversation') => {
      if (!sessionManagerRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        const conversation = sessionManagerRef.current.createConversation(
          {
            systemPrompt,
            maxTokens: maxContextTokens,
            enableHistory: true,
            enableAutoSave: autoSave,
          } as any,
          title,
        );

        setCurrentConversation(conversation);
        setMessages(conversation.messages);
        setAllConversations(sessionManagerRef.current.getAllConversations());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create conversation',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [autoSave, maxContextTokens, systemPrompt],
  );

  /**
   * Switch to a different conversation
   */
  const switchConversation = useCallback((conversationId: string): boolean => {
    if (!sessionManagerRef.current) return false;

    try {
      setIsLoading(true);
      setError(null);

      const success =
        sessionManagerRef.current.setActiveConversation(conversationId);

      if (success) {
        const conversation = sessionManagerRef.current.getActiveConversation();
        setCurrentConversation(conversation);
        setMessages(conversation?.messages || []);
      }

      return success;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to switch conversation',
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(
    (conversationId: string): boolean => {
      if (!sessionManagerRef.current) return false;

      try {
        setIsLoading(true);
        setError(null);

        const success =
          sessionManagerRef.current.deleteConversation(conversationId);

        if (success) {
          setAllConversations(sessionManagerRef.current.getAllConversations());

          // If deleted conversation was active, clear current
          if (currentConversation?.id === conversationId) {
            setCurrentConversation(null);
            setMessages([]);
          }
        }

        return success;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete conversation',
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [currentConversation],
  );

  /**
   * Clear current conversation
   */
  const clearCurrentConversation = useCallback(() => {
    if (currentConversation) {
      deleteConversation(currentConversation.id);
    }
  }, [currentConversation, deleteConversation]);

  /**
   * Update conversation title
   */
  const updateConversationTitle = useCallback(
    (title: string) => {
      if (!sessionManagerRef.current || !currentConversation) return;

      try {
        setError(null);
        const success = sessionManagerRef.current.updateConversationTitle(
          currentConversation.id,
          title,
        );

        if (success) {
          setCurrentConversation((prev) => (prev ? { ...prev, title } : null));
          setAllConversations(sessionManagerRef.current.getAllConversations());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update title');
      }
    },
    [currentConversation],
  );

  // ============================================================================
  // Message Management
  // ============================================================================

  /**
   * Add a message
   */
  const addMessage = useCallback(
    (
      role: MessageRole,
      content: string,
      attachments?: MessageAttachment[],
    ): Message => {
      if (!sessionManagerRef.current) {
        throw new Error('SessionManager not initialized');
      }

      try {
        setError(null);
        const message = sessionManagerRef.current.addMessage(
          role,
          content,
          attachments,
        );
        setMessages(sessionManagerRef.current.getMessages());
        setCurrentConversation(
          sessionManagerRef.current.getActiveConversation(),
        );

        return message;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to add message';
        setError(errorMsg);
        throw err;
      }
    },
    [],
  );

  /**
   * Update a message
   */
  const updateMessage = useCallback(
    (messageId: string, content: string): boolean => {
      if (!sessionManagerRef.current) return false;

      try {
        setError(null);
        const success = sessionManagerRef.current.updateMessage(
          messageId,
          content,
        );

        if (success) {
          setMessages(sessionManagerRef.current.getMessages());
          setCurrentConversation(
            sessionManagerRef.current.getActiveConversation(),
          );
        }

        return success;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update message',
        );
        return false;
      }
    },
    [],
  );

  /**
   * Delete a message
   */
  const deleteMessage = useCallback((messageId: string): boolean => {
    if (!sessionManagerRef.current) return false;

    try {
      setError(null);
      const success = sessionManagerRef.current.deleteMessage(messageId);

      if (success) {
        setMessages(sessionManagerRef.current.getMessages());
        setCurrentConversation(
          sessionManagerRef.current.getActiveConversation(),
        );
      }

      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      return false;
    }
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    if (!sessionManagerRef.current) return;

    try {
      setError(null);
      sessionManagerRef.current.clearMessages();
      setMessages([]);
      setCurrentConversation(sessionManagerRef.current.getActiveConversation());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear messages');
    }
  }, []);

  /**
   * Get last N messages
   */
  const getLastMessages = useCallback(
    (count: number): Message[] => {
      return messages.slice(-count);
    },
    [messages],
  );

  /**
   * Get messages by role
   */
  const getMessagesByRole = useCallback(
    (role: MessageRole): Message[] => {
      return messages.filter((m) => m.role === role);
    },
    [messages],
  );

  // ============================================================================
  // Context Window
  // ============================================================================

  /**
   * Update context window information
   */
  useEffect(() => {
    if (messages.length > 0) {
      const tokenUsage = estimateConversationTokens(messages, systemPrompt);
      const window = calculateContextWindow(
        tokenUsage.totalTokens,
        maxContextTokens,
      );
      setContextWindow(window);
    } else {
      setContextWindow({
        maxTokens: maxContextTokens,
        tokensUsed: 0,
        tokensRemaining: maxContextTokens,
        percentageUsed: 0,
        nearLimit: false,
        warningMessage: null,
      });
    }
  }, [messages, maxContextTokens, systemPrompt]);

  // ============================================================================
  // Export/Import
  // ============================================================================

  /**
   * Export conversation
   */
  const exportConversation = useCallback(
    (format: ExportFormat): string => {
      if (!sessionManagerRef.current || !currentConversation) {
        throw new Error('No conversation to export');
      }

      try {
        setError(null);

        if (format === 'json') {
          return sessionManagerRef.current.exportConversation(
            currentConversation.id,
          );
        }

        // Handle other formats (markdown, txt, etc.)
        const data = JSON.parse(
          sessionManagerRef.current.exportConversation(currentConversation.id),
        );

        if (format === 'txt') {
          return data.messages
            .map((m: Message) => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n\n');
        }

        if (format === 'markdown') {
          return data.messages
            .map((m: Message) => `**${m.role.toUpperCase()}:** ${m.content}`)
            .join('\n\n---\n\n');
        }

        return sessionManagerRef.current.exportConversation(
          currentConversation.id,
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Export failed';
        setError(errorMsg);
        throw err;
      }
    },
    [currentConversation],
  );

  /**
   * Import conversation
   */
  const importConversation = useCallback((json: string): Conversation => {
    if (!sessionManagerRef.current) {
      throw new Error('SessionManager not initialized');
    }

    try {
      setError(null);
      const conversation = sessionManagerRef.current.importConversation(json);
      setAllConversations(sessionManagerRef.current.getAllConversations());

      return conversation;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Import failed';
      setError(errorMsg);
      throw err;
    }
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Current conversation
    currentConversation,
    messages,
    messageCount,

    // Conversation management
    createConversation,
    switchConversation,
    deleteConversation,
    clearCurrentConversation,
    updateConversationTitle,

    // Message management
    addMessage,
    updateMessage,
    deleteMessage,
    clearMessages,
    getLastMessages,
    getMessagesByRole,

    // Context window
    contextWindow,
    isNearContextLimit,

    // All conversations
    allConversations,

    // Export/Import
    exportConversation,
    importConversation,

    // State
    isLoading,
    error,
  };
}

export default useConversationHistory;
