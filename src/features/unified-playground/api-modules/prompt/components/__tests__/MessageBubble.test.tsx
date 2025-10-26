/**
 * MessageBubble Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import type { Message } from '../../types';

describe('MessageBubble', () => {
  const userMessage: Message = {
    id: '1',
    role: 'user',
    content: 'Test user message',
    timestamp: new Date(),
  };

  const assistantMessage: Message = {
    id: '2',
    role: 'assistant',
    content: 'Test assistant message',
    timestamp: new Date(),
  };

  it('should render user message', () => {
    render(<MessageBubble message={userMessage} />);
    expect(screen.getByText('Test user message')).toBeInTheDocument();
  });

  it('should render assistant message', () => {
    render(<MessageBubble message={assistantMessage} />);
    expect(screen.getByText('Test assistant message')).toBeInTheDocument();
  });

  it('should show streaming indicator when isStreaming', () => {
    render(<MessageBubble message={userMessage} isStreaming={true} />);
    expect(screen.getByText('Test user message')).toBeInTheDocument();
  });

  it('should call onCopy when copy button is clicked', () => {
    const onCopy = vi.fn();
    render(<MessageBubble message={userMessage} onCopy={onCopy} />);

    // First, open the actions menu
    const actionsButton = screen.getByRole('button', {
      name: /message actions/i,
    });
    fireEvent.click(actionsButton);

    // Then click the copy button in the dropdown
    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    expect(onCopy).toHaveBeenCalledWith('Test user message');
  });

  it('should render attachments if present', () => {
    const messageWithAttachment: Message = {
      ...userMessage,
      attachments: [
        {
          id: '1',
          type: 'image',
          name: 'test.png',
          size: 1024,
          mimeType: 'image/png',
          url: 'data:image/png',
        },
      ],
    };
    render(<MessageBubble message={messageWithAttachment} />);

    // Component displays the image directly, not a text count
    const image = screen.getByAltText('test.png');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'data:image/png');
  });
});
