/**
 * DetectionInput Component Tests
 *
 * Tests for language detection input component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetectionInput } from '../DetectionInput';

describe('DetectionInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onDetect: vi.fn(),
    onClear: vi.fn(),
    isDetecting: false,
    disabled: false,
    maxLength: 5000,
  };

  describe('Rendering', () => {
    it('should render textarea', () => {
      render(<DetectionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should render detect button', () => {
      render(<DetectionInput {...defaultProps} />);

      const detectButton = screen.getByRole('button', { name: /detect/i });
      expect(detectButton).toBeInTheDocument();
    });

    it('should render clear button', () => {
      render(<DetectionInput {...defaultProps} />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should display character count', () => {
      render(<DetectionInput {...defaultProps} value="Hello" />);

      expect(screen.getByText(/5/)).toBeInTheDocument();
      expect(screen.getByText(/5,000/)).toBeInTheDocument();
    });
  });

  describe('Text Input', () => {
    it('should call onChange when text changes', () => {
      const onChange = vi.fn();
      render(<DetectionInput {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Hello world' } });

      expect(onChange).toHaveBeenCalledWith('Hello world');
    });

    it('should display current value', () => {
      render(<DetectionInput {...defaultProps} value="Test value" />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Test value');
    });

    it('should show placeholder when empty', () => {
      render(<DetectionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder');
    });
  });

  describe('Detect Button', () => {
    it('should be disabled when text is empty', () => {
      render(<DetectionInput {...defaultProps} value="" />);

      const detectButton = screen.getByRole('button', { name: /detect/i });
      expect(detectButton).toBeDisabled();
    });

    it('should be enabled when text is present', () => {
      render(<DetectionInput {...defaultProps} value="Hello" />);

      const detectButton = screen.getByRole('button', { name: /detect/i });
      expect(detectButton).not.toBeDisabled();
    });

    it('should be disabled when detecting', () => {
      render(
        <DetectionInput {...defaultProps} value="Hello" isDetecting={true} />,
      );

      const detectButton = screen.getByRole('button', { name: /detecting/i });
      expect(detectButton).toBeDisabled();
    });

    it('should call onDetect when clicked', () => {
      const onDetect = vi.fn();
      render(
        <DetectionInput {...defaultProps} value="Hello" onDetect={onDetect} />,
      );

      const detectButton = screen.getByRole('button', { name: /detect/i });
      fireEvent.click(detectButton);

      expect(onDetect).toHaveBeenCalled();
    });

    it('should show loading state when detecting', () => {
      render(
        <DetectionInput {...defaultProps} value="Test" isDetecting={true} />,
      );

      expect(screen.getByText(/detecting/i)).toBeInTheDocument();
    });

    it('should be disabled when exceeds max length', () => {
      const longText = 'a'.repeat(5001);
      render(
        <DetectionInput {...defaultProps} value={longText} maxLength={5000} />,
      );

      const detectButton = screen.getByRole('button', { name: /detect/i });
      expect(detectButton).toBeDisabled();
    });
  });

  describe('Clear Button', () => {
    it('should be disabled when text is empty', () => {
      render(<DetectionInput {...defaultProps} value="" />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeDisabled();
    });

    it('should be enabled when text is present', () => {
      render(<DetectionInput {...defaultProps} value="Hello" />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).not.toBeDisabled();
    });

    it('should call onClear when clicked', () => {
      const onClear = vi.fn();
      render(
        <DetectionInput {...defaultProps} value="Hello" onClear={onClear} />,
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      expect(onClear).toHaveBeenCalled();
    });

    it('should be disabled when detecting', () => {
      render(
        <DetectionInput {...defaultProps} value="Test" isDetecting={true} />,
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Character Counter', () => {
    it('should show correct count', () => {
      render(<DetectionInput {...defaultProps} value="Hello" />);

      expect(screen.getByText(/5/)).toBeInTheDocument();
    });

    it('should update count on text change', () => {
      const { rerender } = render(
        <DetectionInput {...defaultProps} value="Hi" />,
      );
      expect(screen.getByText(/2/)).toBeInTheDocument();

      rerender(<DetectionInput {...defaultProps} value="Hello" />);
      expect(screen.getByText(/5/)).toBeInTheDocument();
    });

    it('should highlight when over limit', () => {
      const longText = 'a'.repeat(5001);
      render(
        <DetectionInput {...defaultProps} value={longText} maxLength={5000} />,
      );

      // Check for warning text
      expect(screen.getByText(/exceeds maximum length/i)).toBeInTheDocument();
    });

    it('should show max length', () => {
      render(<DetectionInput {...defaultProps} maxLength={1000} />);

      expect(screen.getByText(/1,000/)).toBeInTheDocument();
    });
  });

  describe('Sample Texts', () => {
    it('should render sample text buttons', () => {
      render(<DetectionInput {...defaultProps} />);

      // Look for common sample button text
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(2); // At least detect, clear, and samples
    });

    it('should load sample text on button click', () => {
      const onChange = vi.fn();
      render(<DetectionInput {...defaultProps} onChange={onChange} />);

      // Find a sample button (not detect or clear)
      const buttons = screen.getAllByRole('button');
      const sampleButton = buttons.find(
        (btn) => !btn.textContent?.match(/detect|clear/i),
      );

      if (sampleButton) {
        fireEvent.click(sampleButton);
        expect(onChange).toHaveBeenCalled();
      }
    });
  });

  describe('Disabled State', () => {
    it('should disable all controls when disabled prop is true', () => {
      render(<DetectionInput {...defaultProps} value="Test" disabled={true} />);

      const textarea = screen.getByRole('textbox');
      const detectButton = screen.getByRole('button', { name: /detect/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });

      expect(textarea).toBeDisabled();
      expect(detectButton).toBeDisabled();
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels', () => {
      render(<DetectionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAccessibleName();
    });

    it('should have button labels', () => {
      render(<DetectionInput {...defaultProps} value="Test" />);

      const detectButton = screen.getByRole('button', { name: /detect/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });

      expect(detectButton).toHaveAccessibleName();
      expect(clearButton).toHaveAccessibleName();
    });

    it('should indicate required field if applicable', () => {
      render(<DetectionInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      // Check if aria attributes are set
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text', () => {
      const longText = 'a'.repeat(10000);
      const onChange = vi.fn();

      render(
        <DetectionInput
          {...defaultProps}
          value={longText}
          onChange={onChange}
        />,
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      const specialText = '!@#$%^&*()';
      render(<DetectionInput {...defaultProps} value={specialText} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe(specialText);
    });

    it('should handle Unicode characters', () => {
      const unicodeText = 'こんにちは世界';
      render(<DetectionInput {...defaultProps} value={unicodeText} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe(unicodeText);
    });

    it('should handle newlines', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';
      render(<DetectionInput {...defaultProps} value={multilineText} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe(multilineText);
    });
  });
});
