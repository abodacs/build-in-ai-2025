/**
 * Prompt API Integration Test Suite
 *
 * Tests complete workflows combining services, hooks, and components
 *
 * Coverage: 10+ integration scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setupLanguageModelAPIMock,
  cleanupLanguageModelAPIMock,
  createMockLanguageModel,
  createMockPromptConfig,
  waitFor,
} from './test-utils';
import { ChromeAIPromptService } from '../services/ChromeAIPromptService';
import { PromptManager } from '../services/PromptManager';
import { SessionManager } from '../services/SessionManager';
import { MultimodalHandler } from '../services/MultimodalHandler';

describe('Prompt API Integration', () => {
  let mockAPI: ReturnType<typeof setupLanguageModelAPIMock>;

  beforeEach(() => {
    mockAPI = setupLanguageModelAPIMock();
  });

  afterEach(() => {
    cleanupLanguageModelAPIMock();
  });

  // ==========================================================================
  // Service Integration Tests
  // ==========================================================================

  describe('Service Layer Integration', () => {
    it('creates instance and executes prompt end-to-end', async () => {
      // Create and initialize manager
      const manager = new PromptManager();
      await manager.initialize({ systemPrompt: 'Test assistant' });

      // Execute prompt
      const result = await manager.prompt('Hello');

      expect(result).toBe('Mock response');
      expect(manager.isReady()).toBe(true);

      manager.destroy();
    });

    it('manages session with prompt execution', async () => {
      const manager = new PromptManager();
      const sessionManager = new SessionManager(false);

      // Initialize
      await manager.initialize(createMockPromptConfig());

      // Create conversation
      const conversation = sessionManager.createConversation(
        createMockPromptConfig(),
      );
      expect(conversation).toBeDefined();

      // Add user message
      const userMessage = sessionManager.addUserMessage('Test prompt');

      // Execute prompt
      const response = await manager.prompt(userMessage.content);

      // Add assistant response
      const assistantMessage = sessionManager.addAssistantMessage(response);

      // Verify conversation state
      const messages = sessionManager.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');

      manager.destroy();
    });

    it('handles multimodal workflow', async () => {
      const multimodalHandler = new MultimodalHandler();

      // Validate file
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const validation = multimodalHandler.validateFile(mockFile);

      expect(validation.valid).toBe(true);
    });
  });

  // ==========================================================================
  // Availability to Execution Flow
  // ==========================================================================

  describe('Complete Availability Flow', () => {
    it('checks availability, creates instance, and executes', async () => {
      // Check availability
      const availability = await ChromeAIPromptService.checkAvailability();
      expect(availability).toBe('readily');

      // Create instance
      const instance = await ChromeAIPromptService.createInstance({
        systemPrompt: 'Test',
      });
      expect(instance).toBeDefined();

      // Execute prompt
      const result = await ChromeAIPromptService.prompt(
        instance,
        'Test prompt',
      );
      expect(result).toBeDefined();

      // Cleanup
      ChromeAIPromptService.destroy(instance);
    });

    it('handles download required workflow', async () => {
      mockAPI.availability.mockResolvedValue('after-download');

      const availability = await ChromeAIPromptService.checkAvailability();
      expect(availability).toBe('after-download');

      // Should still be able to create instance
      const manager = new PromptManager();
      await manager.initialize({});

      expect(manager.isReady()).toBe(true);

      manager.destroy();
    });
  });

  // ==========================================================================
  // Session Persistence Flow
  // ==========================================================================

  describe('Session Persistence Flow', () => {
    it('creates conversation, adds messages, and exports', () => {
      const sessionManager = new SessionManager(false);

      // Create conversation
      const conv = sessionManager.createConversation(
        createMockPromptConfig(),
        'Test Chat',
      );

      // Add messages
      sessionManager.addUserMessage('Question 1');
      sessionManager.addAssistantMessage('Answer 1');
      sessionManager.addUserMessage('Question 2');
      sessionManager.addAssistantMessage('Answer 2');

      // Export
      const exported = sessionManager.exportConversation();
      expect(exported).toBeDefined();

      const parsed = JSON.parse(exported);
      expect(parsed.title).toBe('Test Chat');
      expect(parsed.messages).toHaveLength(4);
    });

    it('exports and imports conversation', () => {
      const sessionManager1 = new SessionManager(false);
      const sessionManager2 = new SessionManager(false);

      // Create and populate conversation
      sessionManager1.createConversation(
        createMockPromptConfig(),
        'Export Test',
      );
      sessionManager1.addUserMessage('Test message');

      // Export
      const exported = sessionManager1.exportConversation();

      // Import to new manager
      const imported = sessionManager2.importConversation(exported);

      expect(imported.title).toBe('Export Test');
      expect(imported.messages).toHaveLength(1);
      expect(imported.messages[0].content).toBe('Test message');
    });
  });

  // ==========================================================================
  // Streaming Workflow
  // ==========================================================================

  describe('Streaming Workflow', () => {
    it('executes streaming prompt with session management', async () => {
      const manager = new PromptManager();
      const sessionManager = new SessionManager(false);

      // Initialize
      await manager.initialize({ enableStreaming: true });

      // Create conversation
      sessionManager.createConversation(createMockPromptConfig());
      sessionManager.addUserMessage('Streaming test');

      // Stream response
      const chunks: string[] = [];
      const result = await manager.promptStreaming('Test', (chunk) => {
        chunks.push(chunk);
      });

      expect(chunks.length).toBeGreaterThan(0);
      expect(result).toBe(chunks.join(''));

      // Add to session
      sessionManager.addAssistantMessage(result);
      expect(sessionManager.getMessages()).toHaveLength(2);

      manager.destroy();
    });
  });

  // ==========================================================================
  // Error Recovery Flow
  // ==========================================================================

  describe('Error Recovery Flow', () => {
    it('recovers from failed prompt with retry', async () => {
      const mockInstance = createMockLanguageModel();
      let attempts = 0;
      mockInstance.prompt = vi.fn(async () => {
        attempts++;
        if (attempts < 3) throw new Error('Temporary failure');
        return 'Success after retries';
      });
      mockAPI.create.mockResolvedValue(mockInstance);

      const manager = new PromptManager();
      await manager.initialize({});

      const result = await manager.prompt('Test');

      expect(result).toBe('Success after retries');
      expect(attempts).toBe(3);

      manager.destroy();
    });

    it('handles session operations after errors', () => {
      const sessionManager = new SessionManager(false);

      sessionManager.createConversation(createMockPromptConfig());

      // Try to update non-existent message
      const updated = sessionManager.updateMessage('invalid-id', 'new content');
      expect(updated).toBe(false);

      // Session should still be functional
      sessionManager.addUserMessage('Test');
      expect(sessionManager.getMessages()).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Token Management Flow
  // ==========================================================================

  describe('Token Management Flow', () => {
    it('tracks tokens across conversation', () => {
      const sessionManager = new SessionManager(false);
      sessionManager.setMaxContextTokens(4096);

      sessionManager.createConversation(
        createMockPromptConfig({
          systemPrompt: 'You are a helpful assistant',
        }),
      );

      // Add messages
      sessionManager.addUserMessage('Tell me about AI');
      sessionManager.addAssistantMessage(
        'AI is a field of computer science...',
      );

      // Get token estimate
      const usage = sessionManager.getTokenUsageEstimate();

      expect(usage.totalTokens).toBeGreaterThan(0);
      expect(usage.systemPromptTokens).toBeGreaterThan(0);
      expect(usage.historyTokens).toBeGreaterThan(0);

      // Check context window
      const window = sessionManager.getContextWindow(usage.totalTokens);

      expect(window.maxTokens).toBe(4096);
      expect(window.tokensUsed).toBe(usage.totalTokens);
      expect(window.percentageUsed).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Configuration Update Flow
  // ==========================================================================

  describe('Configuration Update Flow', () => {
    it('updates configuration and reinitializes', async () => {
      const manager = new PromptManager();

      // Initial configuration
      await manager.initialize({ temperature: 0.5, topK: 3 });
      expect(manager.getConfig()?.temperature).toBe(0.5);

      // Update configuration
      await manager.updateConfig({ temperature: 0.9 });

      expect(manager.getConfig()?.temperature).toBe(0.9);
      expect(manager.getConfig()?.topK).toBe(3); // Should preserve other settings

      manager.destroy();
    });
  });

  // ==========================================================================
  // Metrics Tracking Flow
  // ==========================================================================

  describe('Metrics Tracking Flow', () => {
    it('tracks execution metrics across multiple prompts', async () => {
      const manager = new PromptManager();
      await manager.initialize({});

      // Execute multiple prompts
      await manager.prompt('Prompt 1');
      await manager.prompt('Prompt 2');
      await manager.prompt('Prompt 3');

      // Check metrics
      const metrics = manager.getMetrics();
      expect(metrics).toHaveLength(3);

      const avgTime = manager.getAverageExecutionTime();
      expect(avgTime).toBeGreaterThan(0);

      const successRate = manager.getSuccessRate();
      expect(successRate).toBe(1.0); // All successful

      manager.destroy();
    });
  });

  // ==========================================================================
  // Cleanup and Resource Management
  // ==========================================================================

  describe('Cleanup Flow', () => {
    it('properly cleans up all resources', async () => {
      const manager = new PromptManager();
      const sessionManager = new SessionManager(false);

      // Setup
      await manager.initialize({});
      sessionManager.createConversation(createMockPromptConfig());
      sessionManager.addUserMessage('Test');

      // Verify setup
      expect(manager.isReady()).toBe(true);
      expect(sessionManager.getMessages()).toHaveLength(1);

      // Cleanup
      manager.destroy();
      sessionManager.clearAllConversations();

      // Verify cleanup
      expect(manager.isReady()).toBe(false);
      expect(sessionManager.getAllConversations()).toHaveLength(0);
    });
  });
});
