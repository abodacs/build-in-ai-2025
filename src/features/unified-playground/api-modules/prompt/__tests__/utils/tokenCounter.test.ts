/**
 * Token Counter Utilities Test Suite
 *
 * Tests token estimation, context window calculation,
 * and message trimming utilities
 *
 * Coverage: 20+ tests
 */

import { describe, it, expect } from 'vitest';
import {
  estimateTokens,
  calculateContextWindow,
  trimMessagesToFit,
  estimateMessageTokens,
} from '../../utils/tokenCounter';
import { createMockMessage } from '../test-utils';

describe('tokenCounter', () => {
  // ==========================================================================
  // Token Estimation Tests
  // ==========================================================================

  describe('estimateTokens', () => {
    it('estimates tokens for simple text', () => {
      const text = 'Hello world';
      const tokens = estimateTokens(text);

      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThanOrEqual(Math.ceil(text.length / 3));
    });

    it('estimates tokens for empty string', () => {
      const tokens = estimateTokens('');

      expect(tokens).toBe(0);
    });

    it('estimates tokens for long text', () => {
      const text = 'The quick brown fox jumps over the lazy dog. '.repeat(100);
      const tokens = estimateTokens(text);

      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeCloseTo(text.length / 4, -1);
    });

    it('handles text with special characters', () => {
      const text = 'Hello! How are you? 你好 🎉';
      const tokens = estimateTokens(text);

      expect(tokens).toBeGreaterThan(0);
    });

    it('handles text with newlines', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const tokens = estimateTokens(text);

      expect(tokens).toBeGreaterThan(0);
    });

    it('handles text with tabs and spaces', () => {
      const text = 'Word1\t\tWord2    Word3';
      const tokens = estimateTokens(text);

      expect(tokens).toBeGreaterThan(0);
    });

    it('provides consistent estimates', () => {
      const text = 'Consistent test text';
      const estimate1 = estimateTokens(text);
      const estimate2 = estimateTokens(text);

      expect(estimate1).toBe(estimate2);
    });
  });

  // ==========================================================================
  // Message Token Estimation Tests
  // ==========================================================================

  describe('estimateMessageTokens', () => {
    it('estimates tokens for user message', () => {
      const message = createMockMessage({
        role: 'user',
        content: 'What is the weather today?',
      });

      const tokens = estimateMessageTokens(message);

      expect(tokens).toBeGreaterThan(0);
    });

    it('estimates tokens for assistant message', () => {
      const message = createMockMessage({
        role: 'assistant',
        content: 'The weather is sunny with a temperature of 75°F.',
      });

      const tokens = estimateMessageTokens(message);

      expect(tokens).toBeGreaterThan(0);
    });

    it('includes role overhead in estimate', () => {
      const shortMessage = createMockMessage({
        role: 'user',
        content: 'Hi',
      });

      const tokens = estimateMessageTokens(shortMessage);

      // Should include overhead for role markers
      expect(tokens).toBeGreaterThan(estimateTokens('Hi'));
    });

    it('handles message with attachments', () => {
      const message = createMockMessage({
        role: 'user',
        content: 'Check this image',
        attachments: [
          {
            id: 'img-1',
            type: 'image',
            name: 'test.jpg',
            size: 1024,
            mimeType: 'image/jpeg',
            url: 'blob:test',
          },
        ],
      });

      const tokens = estimateMessageTokens(message);

      // Should include tokens for image placeholder
      expect(tokens).toBeGreaterThan(estimateTokens('Check this image'));
    });

    it('handles empty message content', () => {
      const message = createMockMessage({
        role: 'user',
        content: '',
      });

      const tokens = estimateMessageTokens(message);

      // Should still have role overhead
      expect(tokens).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Context Window Calculation Tests
  // ==========================================================================

  describe('calculateContextWindow', () => {
    it('calculates basic context window info', () => {
      const window = calculateContextWindow(1000, 4096);

      expect(window.maxTokens).toBe(4096);
      expect(window.tokensUsed).toBe(1000);
      expect(window.tokensRemaining).toBe(3096);
      expect(window.percentageUsed).toBe(24); // 1000/4096 = 24.41% → rounds to 24
    });

    it('detects when near limit (default threshold)', () => {
      const window = calculateContextWindow(3500, 4096);

      expect(window.nearLimit).toBe(true);
      expect(window.warningMessage).toBeDefined();
    });

    it('does not warn when well below limit', () => {
      const window = calculateContextWindow(1000, 4096);

      expect(window.nearLimit).toBe(false);
      expect(window.warningMessage).toBeNull();
    });

    it('uses custom warning threshold', () => {
      const window = calculateContextWindow(2048, 4096, 0.5);

      expect(window.nearLimit).toBe(true);
      expect(window.percentageUsed).toBe(50);
    });

    it('handles zero tokens used', () => {
      const window = calculateContextWindow(0, 4096);

      expect(window.tokensUsed).toBe(0);
      expect(window.tokensRemaining).toBe(4096);
      expect(window.percentageUsed).toBe(0);
      expect(window.nearLimit).toBe(false);
    });

    it('handles tokens at maximum', () => {
      const window = calculateContextWindow(4096, 4096);

      expect(window.tokensRemaining).toBe(0);
      expect(window.percentageUsed).toBe(100);
      expect(window.nearLimit).toBe(true);
    });

    it('handles tokens exceeding maximum', () => {
      const window = calculateContextWindow(5000, 4096);

      expect(window.tokensRemaining).toBe(-904);
      expect(window.percentageUsed).toBeGreaterThan(100);
      expect(window.nearLimit).toBe(true);
    });

    it('provides warning message with percentage', () => {
      const window = calculateContextWindow(3500, 4096);

      expect(window.warningMessage).toContain('85%');
    });

    it('suggests action in warning message', () => {
      const window = calculateContextWindow(3500, 4096);

      expect(window.warningMessage).toContain('Consider');
    });
  });

  // ==========================================================================
  // Message Trimming Tests
  // ==========================================================================

  describe('trimMessagesToFit', () => {
    it('keeps all messages when under limit', () => {
      const messages = [
        createMockMessage({ content: 'Message 1' }),
        createMockMessage({ content: 'Message 2' }),
        createMockMessage({ content: 'Message 3' }),
      ];

      const trimmed = trimMessagesToFit(messages, 1000);

      expect(trimmed).toHaveLength(3);
      expect(trimmed).toEqual(messages);
    });

    it('trims oldest messages when over limit', () => {
      const messages = [
        createMockMessage({ content: 'Old message '.repeat(50) }),
        createMockMessage({ content: 'Recent message '.repeat(50) }),
        createMockMessage({ content: 'Latest message '.repeat(50) }),
      ];

      const trimmed = trimMessagesToFit(messages, 200);

      expect(trimmed.length).toBeLessThan(messages.length);
      expect(trimmed[trimmed.length - 1].content).toBe(messages[2].content);
    });

    it('always keeps at least one message', () => {
      const messages = [
        createMockMessage({ content: 'Very long message '.repeat(1000) }),
      ];

      const trimmed = trimMessagesToFit(messages, 10);

      expect(trimmed).toHaveLength(1);
    });

    it('keeps system messages', () => {
      const messages = [
        createMockMessage({ role: 'system', content: 'System prompt' }),
        createMockMessage({
          role: 'user',
          content: 'Old message '.repeat(100),
        }),
        createMockMessage({ role: 'user', content: 'Recent message' }),
      ];

      const trimmed = trimMessagesToFit(messages, 100);

      const hasSystem = trimmed.some((m) => m.role === 'system');
      expect(hasSystem).toBe(true);
    });

    it('preserves message order', () => {
      const messages = [
        createMockMessage({ content: 'First' }),
        createMockMessage({ content: 'Second' }),
        createMockMessage({ content: 'Third' }),
        createMockMessage({ content: 'Fourth' }),
      ];

      const trimmed = trimMessagesToFit(messages, 100);

      for (let i = 1; i < trimmed.length; i++) {
        const originalIndex1 = messages.indexOf(trimmed[i - 1]);
        const originalIndex2 = messages.indexOf(trimmed[i]);
        expect(originalIndex2).toBeGreaterThan(originalIndex1);
      }
    });

    it('handles empty message array', () => {
      const trimmed = trimMessagesToFit([], 1000);

      expect(trimmed).toEqual([]);
    });

    it('handles zero token limit gracefully', () => {
      const messages = [createMockMessage({ content: 'Test' })];

      const trimmed = trimMessagesToFit(messages, 0);

      expect(trimmed).toHaveLength(1);
    });

    it('calculates token usage for result', () => {
      const messages = [
        createMockMessage({ content: 'Message 1' }),
        createMockMessage({ content: 'Message 2' }),
      ];

      const trimmed = trimMessagesToFit(messages, 1000);

      // Should be able to estimate total tokens
      const totalTokens = trimmed.reduce(
        (sum, msg) => sum + estimateMessageTokens(msg),
        0,
      );
      expect(totalTokens).toBeLessThanOrEqual(1000);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles very long single word', () => {
      const text = 'a'.repeat(10000);
      const tokens = estimateTokens(text);

      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(text.length);
    });

    it('handles unicode characters', () => {
      const text = '你好世界 🌍 مرحبا بالعالم';
      const tokens = estimateTokens(text);

      expect(tokens).toBeGreaterThan(0);
    });

    it('handles mixed content', () => {
      const text = 'Code: ```const x = 42;``` 数字 🎯';
      const tokens = estimateTokens(text);

      expect(tokens).toBeGreaterThan(0);
    });

    it('handles whitespace-only text', () => {
      const text = '     \n\n\t\t   ';
      const tokens = estimateTokens(text);

      expect(tokens).toBeGreaterThanOrEqual(0);
    });

    it('calculates window at exact threshold', () => {
      // 4096 * 0.8 = 3276.8, so use 3277 to be at exactly 80%
      const window = calculateContextWindow(3277, 4096, 0.8);

      expect(window.percentageUsed).toBe(80); // 3277/4096 = 80.00% → rounds to 80
      expect(window.nearLimit).toBe(true);
    });

    it('handles negative token counts gracefully', () => {
      const window = calculateContextWindow(-100, 4096);

      expect(window.tokensUsed).toBe(-100);
      expect(window.tokensRemaining).toBeGreaterThan(4096);
    });
  });
});
