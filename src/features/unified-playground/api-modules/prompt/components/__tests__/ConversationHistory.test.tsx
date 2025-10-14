/**
 * ConversationHistory Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationHistory } from '../ConversationHistory';
import type { Message } from '../../types';

describe('ConversationHistory', () => {
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
      content: 'Hi!',
      timestamp: new Date(),
    },
  ];

  const defaultProps = {
    messages: mockMessages,
    tokenCount: 100,
    maxTokens: 2048,
    onClear: vi.fn(),
    onExport: vi.fn(),
    onRemoveMessage: vi.fn(),
    onMessageClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render history sidebar', () => {
    render(<ConversationHistory {...defaultProps} />);
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('should display all messages', () => {
    render(<ConversationHistory {...defaultProps} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi!')).toBeInTheDocument();
  });

  it('should show token usage meter', () => {
    render(<ConversationHistory {...defaultProps} />);
    expect(screen.getByText(/token usage/i)).toBeInTheDocument();
    expect(screen.getByText(/100.*2,048/i)).toBeInTheDocument();
  });

  it('should show warning when tokens near limit', () => {
    render(
      <ConversationHistory
        {...defaultProps}
        tokenCount={1800}
        maxTokens={2048}
      />,
    );
    expect(screen.getByText(/approaching context limit/i)).toBeInTheDocument();
  });

  it('should filter messages by search query', () => {
    render(<ConversationHistory {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(/search messages/i);
    fireEvent.change(searchInput, { target: { value: 'Hello' } });
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.queryByText('Hi!')).not.toBeVisible();
  });

  it('should call onClear when clear is confirmed', () => {
    render(<ConversationHistory {...defaultProps} />);
    const clearButton = screen.getByRole('button', { name: /clear history/i });
    fireEvent.click(clearButton);
    const confirmButton = screen.getByText(/yes, clear/i);
    fireEvent.click(confirmButton);
    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it('should call onExport with format when export is clicked', () => {
    render(<ConversationHistory {...defaultProps} />);
    const exportButton = screen.getByRole('button', {
      name: /export conversation/i,
    });
    fireEvent.click(exportButton);
    const jsonButton = screen.getByText(/export as json/i);
    fireEvent.click(jsonButton);
    expect(defaultProps.onExport).toHaveBeenCalledWith('json');
  });

  it('should call onRemoveMessage when message is removed', () => {
    render(<ConversationHistory {...defaultProps} />);
    const removeButtons = screen.getAllByLabelText(/remove message/i);
    fireEvent.click(removeButtons[0]);
    expect(defaultProps.onRemoveMessage).toHaveBeenCalledWith('1');
  });

  it('should call onMessageClick when message is clicked', () => {
    render(<ConversationHistory {...defaultProps} />);
    const messages = screen.getAllByText(/Hello|Hi!/);
    fireEvent.click(messages[0].closest('.group')!);
    expect(defaultProps.onMessageClick).toHaveBeenCalledWith('1');
  });

  it('should collapse when isOpen is false', () => {
    render(<ConversationHistory {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('History')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText(/open conversation history/i),
    ).toBeInTheDocument();
  });
});
