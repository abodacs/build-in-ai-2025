/**
 * PromptConfig Component Tests
 * Tests for prompt configuration panel
 */

import { describe, it, expect, vi } from 'vitest';
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
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    it('should render system prompt textarea', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      expect(screen.getByLabelText('System Prompt')).toBeInTheDocument();
    });

    it('should render temperature slider', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      expect(screen.getByText(/Temperature:/)).toBeInTheDocument();
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
      const textarea = screen.getByLabelText('System Prompt');
      expect(textarea).toHaveValue('Test prompt');
    });

    it('should call onChange when system prompt changes', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      const textarea = screen.getByLabelText('System Prompt');
      fireEvent.change(textarea, { target: { value: 'New prompt' } });
      expect(mockOnChange).toHaveBeenCalledWith({ systemPrompt: 'New prompt' });
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
      expect(screen.getByText(/Temperature: 0\.75/)).toBeInTheDocument();
    });

    it('should call onChange when temperature changes', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      const slider = screen.getByRole('slider', { name: /Temperature:/ });
      fireEvent.change(slider, { target: { value: '0.5' } });
      expect(mockOnChange).toHaveBeenCalledWith({ temperature: 0.5 });
    });

    it('should show temperature helper text', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      expect(
        screen.getByText(/Lower = more focused, Higher = more creative/),
      ).toBeInTheDocument();
    });
  });

  describe('Advanced Settings Toggle', () => {
    it('should show advanced settings toggle button', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      expect(
        screen.getByRole('button', { name: /Advanced Settings/ }),
      ).toBeInTheDocument();
    });

    it('should expand advanced settings when clicked', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      const toggleButton = screen.getByRole('button', {
        name: /Advanced Settings/,
      });
      fireEvent.click(toggleButton);
      expect(screen.getByText(/Top K:/)).toBeInTheDocument();
    });

    it('should collapse advanced settings when clicked again', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      const toggleButton = screen.getByRole('button', {
        name: /Advanced Settings/,
      });
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);
      expect(screen.queryByText(/Top K:/)).not.toBeInTheDocument();
    });
  });

  describe('Advanced Settings - Top K', () => {
    it('should display current topK value', () => {
      render(
        <PromptConfig
          config={{ ...DEFAULT_PROMPT_CONFIG, topK: 16 }}
          onChange={mockOnChange}
        />,
      );
      const toggleButton = screen.getByRole('button', {
        name: /Advanced Settings/,
      });
      fireEvent.click(toggleButton);
      expect(screen.getByText(/Top K: 16/)).toBeInTheDocument();
    });

    it('should call onChange when topK changes', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      const toggleButton = screen.getByRole('button', {
        name: /Advanced Settings/,
      });
      fireEvent.click(toggleButton);
      const slider = screen.getByRole('slider', { name: /Top K:/ });
      fireEvent.change(slider, { target: { value: '20' } });
      expect(mockOnChange).toHaveBeenCalledWith({ topK: 20 });
    });
  });

  describe('Advanced Settings - Max Tokens', () => {
    it('should display current maxTokens value', () => {
      render(
        <PromptConfig
          config={{ ...DEFAULT_PROMPT_CONFIG, maxTokens: 1024 }}
          onChange={mockOnChange}
        />,
      );
      const toggleButton = screen.getByRole('button', {
        name: /Advanced Settings/,
      });
      fireEvent.click(toggleButton);
      expect(screen.getByText(/Max Tokens: 1024/)).toBeInTheDocument();
    });

    it('should call onChange when maxTokens changes', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      const toggleButton = screen.getByRole('button', {
        name: /Advanced Settings/,
      });
      fireEvent.click(toggleButton);
      const slider = screen.getByRole('slider', { name: /Max Tokens:/ });
      fireEvent.change(slider, { target: { value: '512' } });
      expect(mockOnChange).toHaveBeenCalledWith({ maxTokens: 512 });
    });
  });

  describe('Streaming Toggle', () => {
    it('should display streaming checkbox', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      const toggleButton = screen.getByRole('button', {
        name: /Advanced Settings/,
      });
      fireEvent.click(toggleButton);
      expect(screen.getByLabelText('Enable Streaming')).toBeInTheDocument();
    });

    it('should reflect streaming enabled state', () => {
      render(
        <PromptConfig
          config={{ ...DEFAULT_PROMPT_CONFIG, enableStreaming: true }}
          onChange={mockOnChange}
        />,
      );
      const toggleButton = screen.getByRole('button', {
        name: /Advanced Settings/,
      });
      fireEvent.click(toggleButton);
      const checkbox = screen.getByLabelText('Enable Streaming');
      expect(checkbox).toBeChecked();
    });

    it('should call onChange when streaming is toggled', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      const toggleButton = screen.getByRole('button', {
        name: /Advanced Settings/,
      });
      fireEvent.click(toggleButton);
      const checkbox = screen.getByLabelText('Enable Streaming');
      fireEvent.click(checkbox);
      expect(mockOnChange).toHaveBeenCalledWith({ enableStreaming: false });
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
        systemPrompt: 'You are a helpful AI assistant.',
        temperature: 0.8,
        topK: 8,
        maxTokens: 2048,
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
      expect(screen.getByLabelText('System Prompt')).toBeDisabled();
      expect(
        screen.getByRole('slider', { name: /Temperature:/ }),
      ).toBeDisabled();
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
      const toggleButton = screen.getByRole('button', {
        name: /Advanced Settings/,
      });
      fireEvent.click(toggleButton);
      expect(screen.getByRole('slider', { name: /Top K:/ })).toBeDisabled();
      expect(
        screen.getByRole('slider', { name: /Max Tokens:/ }),
      ).toBeDisabled();
      expect(screen.getByLabelText('Enable Streaming')).toBeDisabled();
    });
  });
});
