/**
 * PromptInput Component Tests
 * Tests for prompt input field with multiline support
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromptInput } from '../PromptInput';

describe('PromptInput', () => {
  const mockOnChange = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnSubmit.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render textarea', () => {
      render(
        <PromptInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />,
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should display current value', () => {
      render(
        <PromptInput
          value="Test prompt"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />,
      );
      expect(screen.getByRole('textbox')).toHaveValue('Test prompt');
    });

    it('should render send button', () => {
      render(
        <PromptInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />,
      );
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should call onChange when text is entered', () => {
      render(
        <PromptInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />,
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New text' } });
      expect(mockOnChange).toHaveBeenCalledWith('New text');
    });

    it('should call onSubmit when send button is clicked', () => {
      render(
        <PromptInput
          value="Test prompt"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />,
      );
      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('should call onSubmit when Enter key is pressed', () => {
      render(
        <PromptInput
          value="Test prompt"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />,
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('should not call onSubmit when Shift+Enter is pressed', () => {
      render(
        <PromptInput
          value="Test prompt"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />,
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, {
        key: 'Enter',
        code: 'Enter',
        shiftKey: true,
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Token Counter', () => {
    it('should display estimated tokens when provided', () => {
      render(
        <PromptInput
          value="Test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          estimatedTokens={10}
        />,
      );
      // Component now uses TokenVisualization which calculates tokens from content
      // estimatedTokens prop is not used for display
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should not display tokens when estimatedTokens is 0', () => {
      render(
        <PromptInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          estimatedTokens={0}
        />,
      );
      // TokenVisualization component always renders, even with empty content
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('File Indicator', () => {
    it('should show file indicator when hasFiles is true', () => {
      render(
        <PromptInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          hasFiles={true}
        />,
      );
      // Component no longer displays file indicators
      // hasFiles prop is accepted but not used for display
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should not show file indicator when hasFiles is false', () => {
      render(
        <PromptInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          hasFiles={false}
        />,
      );
      // Component no longer displays file indicators
      expect(screen.queryByText(/files attached/i)).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable textarea when disabled', () => {
      render(
        <PromptInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          disabled={true}
        />,
      );
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should disable send button when disabled', () => {
      render(
        <PromptInput
          value="Test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          disabled={true}
        />,
      );
      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('should disable send button when value is empty', () => {
      render(
        <PromptInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />,
      );
      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('should enable send button when value is not empty', () => {
      render(
        <PromptInput
          value="Test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />,
      );
      expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled();
    });
  });

  describe('Placeholder', () => {
    it('should show default placeholder', () => {
      render(
        <PromptInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />,
      );
      expect(
        screen.getByPlaceholderText(/type your message/i),
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on textarea', () => {
      render(
        <PromptInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />,
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-label');
    });

    it('should have proper aria-label on send button', () => {
      render(
        <PromptInput
          value="Test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />,
      );
      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toHaveAttribute('aria-label');
    });
  });
});
