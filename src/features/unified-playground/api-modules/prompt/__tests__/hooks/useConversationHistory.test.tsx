/**
 * useConversationHistory Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConversationHistory } from '../../hooks/useConversationHistory';

describe('useConversationHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty messages', () => {
    const { result } = renderHook(() => useConversationHistory());
    expect(result.current.messages).toEqual([]);
    expect(result.current.messageCount).toBe(0);
  });

  it('adds user message', () => {
    const { result } = renderHook(() => useConversationHistory());

    act(() => {
      result.current.addMessage({
        role: 'user',
        content: 'Hello',
      });
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[0].role).toBe('user');
  });

  it('adds assistant message', () => {
    const { result } = renderHook(() => useConversationHistory());

    act(() => {
      result.current.addMessage({
        role: 'assistant',
        content: 'Hi there!',
      });
    });

    expect(result.current.messages[0].role).toBe('assistant');
  });

  it('removes message by id', () => {
    const { result } = renderHook(() => useConversationHistory());

    let messageId: string;
    act(() => {
      messageId = result.current.addMessage({
        role: 'user',
        content: 'Test',
      });
    });

    act(() => {
      result.current.removeMessage(messageId!);
    });

    expect(result.current.messages).toHaveLength(0);
  });

  it('clears all messages', () => {
    const { result } = renderHook(() => useConversationHistory());

    act(() => {
      result.current.addMessage({ role: 'user', content: 'Test 1' });
      result.current.addMessage({ role: 'assistant', content: 'Test 2' });
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.messages).toHaveLength(0);
  });

  it('respects maxMessages limit', () => {
    const { result } = renderHook(() =>
      useConversationHistory({ maxMessages: 2 }),
    );

    act(() => {
      result.current.addMessage({ role: 'user', content: 'Msg 1' });
      result.current.addMessage({ role: 'user', content: 'Msg 2' });
      result.current.addMessage({ role: 'user', content: 'Msg 3' });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('Msg 2');
  });

  it('tracks token count', () => {
    const { result } = renderHook(() => useConversationHistory());

    act(() => {
      result.current.addMessage({ role: 'user', content: 'Hello world' });
    });

    expect(result.current.tokenCount).toBeGreaterThan(0);
  });

  it('exports conversation as JSON', () => {
    const { result } = renderHook(() => useConversationHistory());

    act(() => {
      result.current.addMessage({ role: 'user', content: 'Test' });
    });

    const exported = result.current.export('json');
    expect(exported).toContain('"content":"Test"');
  });

  it('exports conversation as text', () => {
    const { result } = renderHook(() => useConversationHistory());

    act(() => {
      result.current.addMessage({ role: 'user', content: 'Hello' });
      result.current.addMessage({ role: 'assistant', content: 'Hi' });
    });

    const exported = result.current.export('txt');
    expect(exported).toContain('User: Hello');
    expect(exported).toContain('Assistant: Hi');
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() =>
      useConversationHistory({ enablePersistence: true }),
    );

    act(() => {
      result.current.addMessage({ role: 'user', content: 'Persist me' });
    });

    expect(localStorage.getItem('prompt-conversation-history')).toBeTruthy();
  });

  it('loads from localStorage on mount', () => {
    localStorage.setItem(
      'prompt-conversation-history',
      JSON.stringify({
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'Restored',
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    );

    const { result } = renderHook(() =>
      useConversationHistory({ enablePersistence: true }),
    );

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Restored');
  });
});
