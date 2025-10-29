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

    it('should render system prompt select', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      // Component now uses a Select dropdown (OWASP LLM01:2025 compliant)
      expect(
        screen.getByLabelText(/System Prompt \(Protected\)/i),
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
          config={{ ...DEFAULT_PROMPT_CONFIG, systemPromptId: 'creative' }}
          onChange={mockOnChange}
        />,
      );
      // Component now uses Select with systemPromptId
      // For Radix UI Select, check the trigger's text content instead of value
      const selectTrigger = screen.getByRole('combobox', {
        name: /Select system prompt/i,
      });
      expect(selectTrigger).toBeInTheDocument();
      // Verify the select shows "Creative" as the displayed text
      expect(selectTrigger).toHaveTextContent(/Creative/i);
    });

    it('should call onChange when system prompt changes', () => {
      render(
        <PromptConfig config={DEFAULT_PROMPT_CONFIG} onChange={mockOnChange} />,
      );
      const selectTrigger = screen.getByRole('combobox', {
        name: /Select system prompt/i,
      });
      fireEvent.click(selectTrigger);
      // Select the 'creative' option - use getByRole to be more specific
      const creativeOption = screen.getByRole('option', { name: /Creative/i });
      fireEvent.click(creativeOption);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ systemPromptId: 'creative' }),
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
      expect(slider).toHaveAttribute('aria-valuemax', '4096');
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
        systemPromptId: 'general',
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
      // Component now uses Select instead of textarea
      const select = screen.getByLabelText(/System Prompt \(Protected\)/i);
      expect(select).toBeDisabled();
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
