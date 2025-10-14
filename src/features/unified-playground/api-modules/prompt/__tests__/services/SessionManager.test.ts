/**
 * SessionManager Test Suite
 *
 * Tests conversation history, message management, context window tracking,
 * and localStorage persistence
 *
 * Coverage: 35+ tests (happy path, edge cases, storage)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionManager } from '../../services/SessionManager';
import {
  createMockPromptConfig,
  createMockMessage,
  mockLocalStorage,
} from '../test-utils';

describe('SessionManager', () => {
  let manager: SessionManager;
  let storage: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    storage = mockLocalStorage();
    Object.defineProperty(global, 'localStorage', {
      value: storage,
      writable: true,
    });

    manager = new SessionManager(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Conversation Management Tests
  // ==========================================================================

  describe('Conversation Management', () => {
    it('creates new conversation', () => {
      const config = createMockPromptConfig();

      const conversation = manager.createConversation(config, 'Test Conv');

      expect(conversation).toBeDefined();
      expect(conversation.title).toBe('Test Conv');
      expect(conversation.messages).toEqual([]);
      expect(conversation.systemPrompt).toBe(config.systemPrompt);
    });

    it('creates conversation with default title', () => {
      const conversation = manager.createConversation(createMockPromptConfig());

      expect(conversation.title).toBe('New Conversation');
    });

    it('sets new conversation as active', () => {
      const conversation = manager.createConversation(createMockPromptConfig());

      const active = manager.getActiveConversation();

      expect(active).toBe(conversation);
      expect(active?.id).toBe(conversation.id);
    });

    it('gets all conversations', () => {
      manager.createConversation(createMockPromptConfig(), 'Conv 1');
      manager.createConversation(createMockPromptConfig(), 'Conv 2');
      manager.createConversation(createMockPromptConfig(), 'Conv 3');

      const conversations = manager.getAllConversations();

      expect(conversations).toHaveLength(3);
      expect(conversations[0].title).toBe('Conv 3'); // Most recent first
    });

    it('gets conversation by ID', () => {
      const conv1 = manager.createConversation(
        createMockPromptConfig(),
        'Conv 1',
      );
      manager.createConversation(createMockPromptConfig(), 'Conv 2');

      const found = manager.getConversation(conv1.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(conv1.id);
      expect(found?.title).toBe('Conv 1');
    });

    it('returns null for non-existent conversation', () => {
      const found = manager.getConversation('non-existent-id');

      expect(found).toBeNull();
    });

    it('sets active conversation by ID', () => {
      manager.createConversation(createMockPromptConfig(), 'Conv 1');
      const conv2 = manager.createConversation(
        createMockPromptConfig(),
        'Conv 2',
      );

      const success = manager.setActiveConversation(conv2.id);

      expect(success).toBe(true);
      expect(manager.getActiveConversation()?.id).toBe(conv2.id);
    });

    it('returns false when setting non-existent conversation', () => {
      const success = manager.setActiveConversation('non-existent');

      expect(success).toBe(false);
    });

    it('deletes conversation', () => {
      const conv = manager.createConversation(createMockPromptConfig());

      const deleted = manager.deleteConversation(conv.id);

      expect(deleted).toBe(true);
      expect(manager.getConversation(conv.id)).toBeNull();
    });

    it('clears active conversation when deleted', () => {
      const conv = manager.createConversation(createMockPromptConfig());

      manager.deleteConversation(conv.id);

      expect(manager.getActiveConversation()).toBeNull();
    });

    it('returns false when deleting non-existent conversation', () => {
      const deleted = manager.deleteConversation('non-existent');

      expect(deleted).toBe(false);
    });

    it('clears all conversations', () => {
      manager.createConversation(createMockPromptConfig());
      manager.createConversation(createMockPromptConfig());

      manager.clearAllConversations();

      expect(manager.getAllConversations()).toHaveLength(0);
      expect(manager.getActiveConversation()).toBeNull();
    });

    it('updates conversation title', () => {
      const conv = manager.createConversation(
        createMockPromptConfig(),
        'Old Title',
      );

      const updated = manager.updateConversationTitle(conv.id, 'New Title');

      expect(updated).toBe(true);
      expect(manager.getConversation(conv.id)?.title).toBe('New Title');
    });

    it('returns false when updating non-existent conversation', () => {
      const updated = manager.updateConversationTitle(
        'non-existent',
        'New Title',
      );

      expect(updated).toBe(false);
    });

    it('limits stored conversations to maximum', () => {
      for (let i = 0; i < 60; i++) {
        manager.createConversation(createMockPromptConfig(), `Conv ${i}`);
      }

      const conversations = manager.getAllConversations();

      expect(conversations.length).toBeLessThanOrEqual(50);
    });
  });

  // ==========================================================================
  // Message Management Tests
  // ==========================================================================

  describe('Message Management', () => {
    beforeEach(() => {
      manager.createConversation(createMockPromptConfig());
    });

    it('adds message to active conversation', () => {
      const message = manager.addMessage('user', 'Hello');

      expect(message).toBeDefined();
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello');
    });

    it('adds user message', () => {
      const message = manager.addUserMessage('User message');

      expect(message.role).toBe('user');
      expect(message.content).toBe('User message');
    });

    it('adds assistant message', () => {
      const message = manager.addAssistantMessage('Assistant response');

      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Assistant response');
    });

    it('adds message with attachments', () => {
      const attachments = [
        {
          id: 'img-1',
          type: 'image' as const,
          name: 'test.jpg',
          size: 1024,
          mimeType: 'image/jpeg',
          url: 'blob:test',
        },
      ];

      const message = manager.addMessage(
        'user',
        'Check this image',
        attachments,
      );

      expect(message.attachments).toEqual(attachments);
    });

    it('adds message with metadata', () => {
      const metadata = { processingTime: 1000, streamed: true };

      const message = manager.addAssistantMessage('Response', metadata);

      expect(message.metadata).toMatchObject(metadata);
    });

    it('throws error when adding message without active conversation', () => {
      const emptyManager = new SessionManager(false);

      expect(() => emptyManager.addMessage('user', 'Test')).toThrow(
        'No active conversation',
      );
    });

    it('gets all messages', () => {
      manager.addUserMessage('Message 1');
      manager.addAssistantMessage('Message 2');
      manager.addUserMessage('Message 3');

      const messages = manager.getMessages();

      expect(messages).toHaveLength(3);
    });

    it('gets messages by role', () => {
      manager.addUserMessage('User 1');
      manager.addAssistantMessage('Assistant 1');
      manager.addUserMessage('User 2');
      manager.addAssistantMessage('Assistant 2');

      const userMessages = manager.getMessagesByRole('user');
      const assistantMessages = manager.getMessagesByRole('assistant');

      expect(userMessages).toHaveLength(2);
      expect(assistantMessages).toHaveLength(2);
    });

    it('gets last N messages', () => {
      manager.addUserMessage('Msg 1');
      manager.addUserMessage('Msg 2');
      manager.addUserMessage('Msg 3');
      manager.addUserMessage('Msg 4');
      manager.addUserMessage('Msg 5');

      const last3 = manager.getLastMessages(3);

      expect(last3).toHaveLength(3);
      expect(last3[2].content).toBe('Msg 5');
    });

    it('updates message content', () => {
      const message = manager.addAssistantMessage('Original');

      const updated = manager.updateMessage(message.id, 'Updated');

      expect(updated).toBe(true);
      const messages = manager.getMessages();
      expect(messages[0].content).toBe('Updated');
      expect(messages[0].metadata?.regenerated).toBe(true);
    });

    it('returns false when updating non-existent message', () => {
      const updated = manager.updateMessage('non-existent', 'New content');

      expect(updated).toBe(false);
    });

    it('deletes message', () => {
      const message = manager.addUserMessage('To delete');

      const deleted = manager.deleteMessage(message.id);

      expect(deleted).toBe(true);
      expect(manager.getMessages()).toHaveLength(0);
    });

    it('returns false when deleting non-existent message', () => {
      const deleted = manager.deleteMessage('non-existent');

      expect(deleted).toBe(false);
    });

    it('clears all messages', () => {
      manager.addUserMessage('Msg 1');
      manager.addUserMessage('Msg 2');
      manager.addUserMessage('Msg 3');

      manager.clearMessages();

      expect(manager.getMessages()).toHaveLength(0);
    });

    it('returns empty array when no active conversation', () => {
      const emptyManager = new SessionManager(false);

      expect(emptyManager.getMessages()).toEqual([]);
      expect(emptyManager.getMessagesByRole('user')).toEqual([]);
      expect(emptyManager.getLastMessages(5)).toEqual([]);
    });
  });

  // ==========================================================================
  // Context Window Management Tests
  // ==========================================================================

  describe('Context Window Management', () => {
    it('sets max context tokens', () => {
      manager.setMaxContextTokens(2048);

      const window = manager.getContextWindow(1000);

      expect(window.maxTokens).toBe(2048);
    });

    it('calculates context window info', () => {
      manager.setMaxContextTokens(4096);

      const window = manager.getContextWindow(1024);

      expect(window.maxTokens).toBe(4096);
      expect(window.tokensUsed).toBe(1024);
      expect(window.tokensRemaining).toBe(3072);
      expect(window.percentageUsed).toBeCloseTo(25, 1);
      expect(window.nearLimit).toBe(false);
    });

    it('detects near limit', () => {
      manager.setMaxContextTokens(1000);

      const window = manager.getContextWindow(850);

      expect(window.nearLimit).toBe(true);
      expect(window.warningMessage).toBeDefined();
      expect(window.warningMessage).toContain('85%');
    });

    it('provides warning message when near limit', () => {
      manager.setMaxContextTokens(1000);

      const window = manager.getContextWindow(900);

      expect(window.warningMessage).toContain(
        'Consider starting a new conversation',
      );
    });

    it('gets token usage estimate', () => {
      manager.createConversation(
        createMockPromptConfig({
          systemPrompt: 'Test system prompt',
        }),
      );

      manager.addUserMessage('Hello world');
      manager.addAssistantMessage('Hello! How can I help?');

      const usage = manager.getTokenUsageEstimate();

      expect(usage.systemPromptTokens).toBeGreaterThan(0);
      expect(usage.historyTokens).toBeGreaterThan(0);
      expect(usage.promptTokens).toBeGreaterThan(0);
      expect(usage.responseTokens).toBeGreaterThan(0);
    });

    it('returns zero usage when no conversation', () => {
      const emptyManager = new SessionManager(false);

      const usage = emptyManager.getTokenUsageEstimate();

      expect(usage.totalTokens).toBe(0);
      expect(usage.systemPromptTokens).toBe(0);
      expect(usage.historyTokens).toBe(0);
    });
  });

  // ==========================================================================
  // Metadata Management Tests
  // ==========================================================================

  describe('Metadata Management', () => {
    beforeEach(() => {
      manager.createConversation(createMockPromptConfig());
    });

    it('updates metadata after adding messages', () => {
      manager.addUserMessage('Msg 1');
      manager.addAssistantMessage('Resp 1');

      const conversation = manager.getActiveConversation();

      expect(conversation?.metadata.messageCount).toBe(2);
      expect(conversation?.metadata.userMessageCount).toBe(1);
      expect(conversation?.metadata.assistantMessageCount).toBe(1);
    });

    it('calculates average response time', () => {
      manager.addAssistantMessage('Resp 1', { processingTime: 1000 });
      manager.addAssistantMessage('Resp 2', { processingTime: 2000 });
      manager.addAssistantMessage('Resp 3', { processingTime: 3000 });

      const conversation = manager.getActiveConversation();

      expect(conversation?.metadata.averageResponseTime).toBe(2000);
    });

    it('tracks total processing time', () => {
      manager.addAssistantMessage('Resp 1', { processingTime: 500 });
      manager.addAssistantMessage('Resp 2', { processingTime: 700 });

      const conversation = manager.getActiveConversation();

      expect(conversation?.metadata.totalProcessingTime).toBe(1200);
    });

    it('detects regenerations', () => {
      const message = manager.addAssistantMessage('Original');
      manager.updateMessage(message.id, 'Regenerated');

      const conversation = manager.getActiveConversation();

      expect(conversation?.metadata.hasRegenerations).toBe(true);
    });
  });

  // ==========================================================================
  // Storage Management Tests
  // ==========================================================================

  describe('Storage Management', () => {
    it('saves to localStorage on conversation create', () => {
      manager.createConversation(createMockPromptConfig(), 'Test');

      expect(storage.setItem).toHaveBeenCalled();
    });

    it('saves to localStorage on message add', () => {
      manager.createConversation(createMockPromptConfig());
      storage.setItem.mockClear();

      manager.addUserMessage('Test');

      expect(storage.setItem).toHaveBeenCalled();
    });

    it('loads from localStorage on init', () => {
      // Setup storage
      const savedData = {
        conversations: [
          {
            id: 'test-id',
            title: 'Saved Conv',
            messages: [],
            createdAt: { __type: 'Date', value: new Date().toISOString() },
            updatedAt: { __type: 'Date', value: new Date().toISOString() },
            systemPrompt: 'Test',
            modelConfig: {},
            totalTokens: 0,
            metadata: {},
          },
        ],
        activeConversationId: 'test-id',
        preferences: {},
        lastUpdated: { __type: 'Date', value: new Date().toISOString() },
      };

      storage.getItem.mockReturnValue(JSON.stringify(savedData));

      const newManager = new SessionManager(true);

      expect(newManager.getAllConversations()).toHaveLength(1);
      expect(newManager.getActiveConversation()?.title).toBe('Saved Conv');
    });

    it('handles invalid localStorage data', () => {
      storage.getItem.mockReturnValue('invalid json');

      const newManager = new SessionManager(true);

      expect(newManager.getAllConversations()).toHaveLength(0);
    });

    it('handles missing localStorage data', () => {
      storage.getItem.mockReturnValue(null);

      const newManager = new SessionManager(true);

      expect(newManager.getAllConversations()).toHaveLength(0);
    });

    it('clears storage', () => {
      manager.createConversation(createMockPromptConfig());

      manager.clearStorage();

      expect(storage.removeItem).toHaveBeenCalled();
    });

    it('does not save when storage disabled', () => {
      const noStorageManager = new SessionManager(false);

      noStorageManager.createConversation(createMockPromptConfig());

      expect(storage.setItem).not.toHaveBeenCalled();
    });

    it('serializes and deserializes dates correctly', () => {
      const conv = manager.createConversation(createMockPromptConfig());
      const originalDate = conv.createdAt;

      // Simulate storage round-trip
      const stored = storage.setItem.mock.calls[0][1];
      storage.getItem.mockReturnValue(stored);

      const newManager = new SessionManager(true);
      const loaded = newManager.getConversation(conv.id);

      expect(loaded?.createdAt).toBeInstanceOf(Date);
      expect(loaded?.createdAt.getTime()).toBe(originalDate.getTime());
    });
  });

  // ==========================================================================
  // Export/Import Tests
  // ==========================================================================

  describe('Export/Import', () => {
    it('exports active conversation', () => {
      const conv = manager.createConversation(
        createMockPromptConfig(),
        'Export Test',
      );
      manager.addUserMessage('Test message');

      const exported = manager.exportConversation();

      expect(exported).toBeDefined();
      const parsed = JSON.parse(exported);
      expect(parsed.title).toBe('Export Test');
      expect(parsed.messages).toHaveLength(1);
    });

    it('exports specific conversation', () => {
      const conv1 = manager.createConversation(
        createMockPromptConfig(),
        'Conv 1',
      );
      const conv2 = manager.createConversation(
        createMockPromptConfig(),
        'Conv 2',
      );

      const exported = manager.exportConversation(conv1.id);

      const parsed = JSON.parse(exported);
      expect(parsed.title).toBe('Conv 1');
    });

    it('throws error when exporting without conversation', () => {
      const emptyManager = new SessionManager(false);

      expect(() => emptyManager.exportConversation()).toThrow(
        'No conversation to export',
      );
    });

    it('imports conversation', () => {
      const exported = JSON.stringify({
        id: 'import-test',
        title: 'Imported Conv',
        messages: [createMockMessage()],
        createdAt: new Date(),
        updatedAt: new Date(),
        systemPrompt: 'Test',
        modelConfig: {},
        totalTokens: 0,
        metadata: {},
      });

      const imported = manager.importConversation(exported);

      expect(imported).toBeDefined();
      expect(imported.title).toBe('Imported Conv');
      expect(imported.messages).toHaveLength(1);
      expect(imported.id).not.toBe('import-test'); // New ID generated
    });

    it('throws error when importing invalid JSON', () => {
      expect(() => manager.importConversation('invalid json')).toThrow(
        'Invalid JSON',
      );
    });

    it('adds imported conversation to list', () => {
      const exported = JSON.stringify({
        id: 'test',
        title: 'Imported',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        systemPrompt: 'Test',
        modelConfig: {},
        totalTokens: 0,
        metadata: {},
      });

      const beforeCount = manager.getAllConversations().length;
      manager.importConversation(exported);

      expect(manager.getAllConversations()).toHaveLength(beforeCount + 1);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles operations without active conversation gracefully', () => {
      const emptyManager = new SessionManager(false);

      expect(() => emptyManager.clearMessages()).not.toThrow();
      expect(emptyManager.updateMessage('id', 'content')).toBe(false);
      expect(emptyManager.deleteMessage('id')).toBe(false);
    });

    it('generates unique IDs', () => {
      const conv1 = manager.createConversation(createMockPromptConfig());
      const conv2 = manager.createConversation(createMockPromptConfig());

      expect(conv1.id).not.toBe(conv2.id);
    });

    it('handles empty conversation list operations', () => {
      const emptyManager = new SessionManager(false);

      expect(emptyManager.getAllConversations()).toEqual([]);
      expect(emptyManager.getActiveConversation()).toBeNull();
      expect(emptyManager.getConversation('any-id')).toBeNull();
    });

    it('handles storage errors gracefully', () => {
      storage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() =>
        manager.createConversation(createMockPromptConfig()),
      ).not.toThrow();
    });

    it('handles load errors gracefully', () => {
      storage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => new SessionManager(true)).not.toThrow();
    });
  });
});
