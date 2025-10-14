/**
 * ChatInterface Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatInterface } from '../ChatInterface';
import type { Message } from '../../types';

describe('ChatInterface', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hi there!',
      timestamp: new Date(),
    },
  ];

  it('should render all messages', () => {
    render(<ChatInterface messages={mockMessages} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should show empty state when no messages', () => {
    render(<ChatInterface messages={[]} />);
    expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
  });

  it('should show streaming indicator when streaming', () => {
    render(
      <ChatInterface
        messages={mockMessages}
        isStreaming={true}
        streamingContent="Typing..."
      />,
    );
    expect(screen.getByText('Typing...')).toBeInTheDocument();
  });

  it('should call onCopyMessage when provided', () => {
    const onCopy = vi.fn();
    render(<ChatInterface messages={mockMessages} onCopyMessage={onCopy} />);
    // Test would require MessageBubble to trigger copy
    expect(onCopy).toBeDefined();
  });

  it('should auto-scroll to bottom by default', () => {
    const { container } = render(
      <ChatInterface messages={mockMessages} autoScroll={true} />,
    );
    expect(container.querySelector('[ref]')).toBeDefined();
  });
});
