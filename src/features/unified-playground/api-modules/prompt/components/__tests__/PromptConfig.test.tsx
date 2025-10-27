/**
 * PromptConfig Component Tests
 * Tests for prompt configuration panel
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromptConfig } from '../PromptConfig';
import { DEFAULT_PROMPT_CONFIG } from '../../types';

describe('PromptConfig', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render configuration title', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      expect(
        screen.getByText(/Hide Configuration|Show Configuration/),
      ).toBeInTheDocument();
    });

    it('should render system prompt textarea', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      expect(
        screen.getByRole('textbox', { name: /System prompt/i }),
      ).toBeInTheDocument();
    });

    it('should render temperature slider', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      expect(screen.getByText('Temperature')).toBeInTheDocument();
    });
  });

  describe('System Prompt', () => {
    it('should display current system prompt', () => {
      render(
        <PromptConfig
          config={{ ...DEFAULT_PROMPT_CONFIG, systemPrompt: 'Test prompt' }}
          onChange={mockOnChange}
        />,
      );
      const textarea = screen.getByRole('textbox', { name: /System prompt/i });
      expect(textarea).toHaveValue('Test prompt');
    });

    it('should call onChange when system prompt changes', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      const textarea = screen.getByRole('textbox', { name: /System prompt/i });
      fireEvent.change(textarea, { target: { value: 'New prompt' } });
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ systemPrompt: 'New prompt' }),
      );
    });
  });

  describe('Temperature Control', () => {
    it('should display current temperature value', () => {
      render(
        <PromptConfig
          config={{ ...DEFAULT_PROMPT_CONFIG, temperature: 0.75 }}
          onChange={mockOnChange}
        />,
      );
      expect(screen.getByText('0.75')).toBeInTheDocument();
    });

    it('should render temperature slider control', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      const slider = screen.getByLabelText(/Temperature slider/i);
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '1');
    });

    it('should show temperature helper text', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      expect(
        screen.getByText(/Lower = focused, Higher = creative/),
      ).toBeInTheDocument();
    });
  });

  describe('Top K Control', () => {
    it('should display current topK value', () => {
      render(
        <PromptConfig
          config={{ ...DEFAULT_PROMPT_CONFIG, topK: 16 }}
          onChange={mockOnChange}
        />,
      );
      expect(screen.getByText('16')).toBeInTheDocument();
    });

    it('should render topK slider control', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      const slider = screen.getByLabelText(/Top K slider/i);
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('aria-valuemin', '1');
      expect(slider).toHaveAttribute('aria-valuemax', '50');
    });
  });

  describe('Max Tokens Control', () => {
    it('should display current maxTokens value', () => {
      render(
        <PromptConfig
          config={{ ...DEFAULT_PROMPT_CONFIG, maxTokens: 1024 }}
          onChange={mockOnChange}
        />,
      );
      expect(screen.getByText('1024')).toBeInTheDocument();
    });

    it('should render maxTokens slider control', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      const slider = screen.getByLabelText(/Max tokens slider/i);
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('aria-valuemin', '256');
      expect(slider).toHaveAttribute('aria-valuemax', '1024');
    });
  });

  describe('Reset Button', () => {
    it('should render reset button', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      expect(
        screen.getByRole('button', { name: /Reset to Defaults/ }),
      ).toBeInTheDocument();
    });

    it('should call onChange with default values when clicked', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      const resetButton = screen.getByRole('button', {
        name: /Reset to Defaults/,
      });
      fireEvent.click(resetButton);
      expect(mockOnChange).toHaveBeenCalledWith({
        systemPrompt: 'You are a helpful and friendly assistant.',
        temperature: 0.8,
        topK: 8,
        maxTokens: 512,
        enableStreaming: true,
      });
    });
  });

  describe('Disabled State', () => {
    it('should disable all controls when disabled prop is true', () => {
      render(
        <PromptConfig
          config={DEFAULT_PROMPT_CONFIG}
          onChange={mockOnChange}
          disabled={true}
        />,
      );
      expect(
        screen.getByRole('textbox', { name: /System prompt/i }),
      ).toBeDisabled();
      expect(screen.getByLabelText(/Temperature slider/i)).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      expect(
        screen.getByRole('button', { name: /Reset to Defaults/ }),
      ).toBeDisabled();
    });

    it('should disable advanced settings controls when disabled', () => {
      render(
        <PromptConfig
          config={DEFAULT_PROMPT_CONFIG}
          onChange={mockOnChange}
          disabled={true}
        />,
      );
      expect(screen.getByLabelText(/Top K slider/i)).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      expect(screen.getByLabelText(/Max tokens slider/i)).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  });
});
