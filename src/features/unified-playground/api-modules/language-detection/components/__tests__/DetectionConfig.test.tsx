/**
 * DetectionConfig Component Tests
 *
 * Tests for language detection configuration component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetectionConfig } from '../DetectionConfig';

describe('DetectionConfig', () => {
  const defaultConfig = {
    confidenceThreshold: 0.5,
    maxCandidates: 3,
    showAllCandidates: false,
  };

  const defaultProps = {
    config: defaultConfig,
    onChange: vi.fn(),
    disabled: false,
  };

  describe('Rendering', () => {
    it('should render all config controls', () => {
      render(<DetectionConfig {...defaultProps} />);

      expect(
        screen.getByLabelText(/confidence threshold/i),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/max candidates/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show all candidates/i)).toBeInTheDocument();
    });

    it('should display current config values', () => {
      render(<DetectionConfig {...defaultProps} />);

      const thresholdInput = screen.getByLabelText(
        /confidence threshold/i,
      ) as HTMLInputElement;
      expect(thresholdInput.value).toBe('0.5');

      const maxCandidatesInput = screen.getByLabelText(
        /max candidates/i,
      ) as HTMLInputElement;
      expect(maxCandidatesInput.value).toBe('3');

      const showAllCheckbox = screen.getByLabelText(
        /show all candidates/i,
      ) as HTMLInputElement;
      expect(showAllCheckbox.checked).toBe(false);
    });
  });

  describe('Confidence Threshold', () => {
    it('should update threshold on change', () => {
      const onChange = vi.fn();
      render(<DetectionConfig {...defaultProps} onChange={onChange} />);

      const thresholdInput = screen.getByLabelText(/confidence threshold/i);
      fireEvent.change(thresholdInput, { target: { value: '0.7' } });

      expect(onChange).toHaveBeenCalledWith({
        confidenceThreshold: 0.7,
      });
    });

    it('should show threshold percentage', () => {
      render(<DetectionConfig {...defaultProps} />);

      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });

    it('should update percentage display on change', () => {
      const { rerender } = render(<DetectionConfig {...defaultProps} />);

      rerender(
        <DetectionConfig
          {...defaultProps}
          config={{ ...defaultConfig, confidenceThreshold: 0.8 }}
        />,
      );

      expect(screen.getByText(/80%/)).toBeInTheDocument();
    });

    it('should have slider range 0-1', () => {
      render(<DetectionConfig {...defaultProps} />);

      const thresholdInput = screen.getByLabelText(
        /confidence threshold/i,
      ) as HTMLInputElement;
      expect(thresholdInput.getAttribute('min')).toBe('0');
      expect(thresholdInput.getAttribute('max')).toBe('1');
    });

    it('should have reasonable step value', () => {
      render(<DetectionConfig {...defaultProps} />);

      const thresholdInput = screen.getByLabelText(
        /confidence threshold/i,
      ) as HTMLInputElement;
      expect(thresholdInput.getAttribute('step')).toBe('0.05');
    });
  });

  describe('Max Candidates', () => {
    it('should update maxCandidates on change', () => {
      const onChange = vi.fn();
      render(<DetectionConfig {...defaultProps} onChange={onChange} />);

      const maxCandidatesInput = screen.getByLabelText(/max candidates/i);
      fireEvent.change(maxCandidatesInput, { target: { value: '5' } });

      expect(onChange).toHaveBeenCalledWith({
        maxCandidates: 5,
      });
    });

    it('should have reasonable min/max values', () => {
      render(<DetectionConfig {...defaultProps} />);

      const maxCandidatesInput = screen.getByLabelText(
        /max candidates/i,
      ) as HTMLInputElement;
      expect(
        Number(maxCandidatesInput.getAttribute('min')),
      ).toBeGreaterThanOrEqual(1);
      expect(
        Number(maxCandidatesInput.getAttribute('max')),
      ).toBeLessThanOrEqual(10);
    });

    it('should only accept integers', () => {
      const onChange = vi.fn();
      render(<DetectionConfig {...defaultProps} onChange={onChange} />);

      const maxCandidatesInput = screen.getByLabelText(/max candidates/i);
      fireEvent.change(maxCandidatesInput, { target: { value: '3.5' } });

      // Should convert to integer or ignore
      const calls = onChange.mock.calls;
      if (calls.length > 0) {
        expect(Number.isInteger(calls[0][0].maxCandidates)).toBe(true);
      }
    });
  });

  describe('Show All Candidates', () => {
    it('should toggle showAllCandidates', () => {
      const onChange = vi.fn();
      render(<DetectionConfig {...defaultProps} onChange={onChange} />);

      const checkbox = screen.getByLabelText(/show all candidates/i);
      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalledWith({
        showAllCandidates: true,
      });
    });

    it('should show current checked state', () => {
      render(
        <DetectionConfig
          {...defaultProps}
          config={{ ...defaultConfig, showAllCandidates: true }}
        />,
      );

      const checkbox = screen.getByLabelText(
        /show all candidates/i,
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should have description text', () => {
      render(<DetectionConfig {...defaultProps} />);

      expect(screen.getByText(/show all candidates/i)).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable all controls when disabled', () => {
      render(<DetectionConfig {...defaultProps} disabled={true} />);

      const thresholdInput = screen.getByLabelText(/confidence threshold/i);
      const maxCandidatesInput = screen.getByLabelText(/max candidates/i);
      const checkbox = screen.getByLabelText(/show all candidates/i);

      expect(thresholdInput).toBeDisabled();
      expect(maxCandidatesInput).toBeDisabled();
      expect(checkbox).toBeDisabled();
    });

    it('should not call onChange when disabled', () => {
      const onChange = vi.fn();
      render(
        <DetectionConfig
          {...defaultProps}
          onChange={onChange}
          disabled={true}
        />,
      );

      const thresholdInput = screen.getByLabelText(/confidence threshold/i);
      fireEvent.change(thresholdInput, { target: { value: '0.8' } });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Config Validation', () => {
    it('should handle extreme threshold values', () => {
      render(
        <DetectionConfig
          {...defaultProps}
          config={{ ...defaultConfig, confidenceThreshold: 0 }}
        />,
      );

      expect(screen.getByText(/0%/)).toBeInTheDocument();
    });

    it('should handle threshold of 1.0', () => {
      render(
        <DetectionConfig
          {...defaultProps}
          config={{ ...defaultConfig, confidenceThreshold: 1 }}
        />,
      );

      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it('should handle max candidates of 1', () => {
      render(
        <DetectionConfig
          {...defaultProps}
          config={{ ...defaultConfig, maxCandidates: 1 }}
        />,
      );

      const input = screen.getByLabelText(
        /max candidates/i,
      ) as HTMLInputElement;
      expect(input.value).toBe('1');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels', () => {
      render(<DetectionConfig {...defaultProps} />);

      const thresholdInput = screen.getByLabelText(/confidence threshold/i);
      const maxCandidatesInput = screen.getByLabelText(/max candidates/i);
      const checkbox = screen.getByLabelText(/show all candidates/i);

      expect(thresholdInput).toHaveAccessibleName();
      expect(maxCandidatesInput).toHaveAccessibleName();
      expect(checkbox).toHaveAccessibleName();
    });

    it('should have helper text for each control', () => {
      render(<DetectionConfig {...defaultProps} />);

      // Check for descriptive text
      expect(screen.getByText(/minimum confidence/i)).toBeInTheDocument();
      expect(screen.getByText(/maximum number/i)).toBeInTheDocument();
    });

    it('should use semantic form elements', () => {
      render(<DetectionConfig {...defaultProps} />);

      const inputs = screen.getAllByRole('slider');
      expect(inputs.length).toBeGreaterThan(0);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('should show visual indication of current threshold', () => {
      render(<DetectionConfig {...defaultProps} />);

      // Threshold value should be visible
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });

    it('should update visual feedback in real-time', () => {
      const { rerender } = render(<DetectionConfig {...defaultProps} />);

      rerender(
        <DetectionConfig
          {...defaultProps}
          config={{ ...defaultConfig, confidenceThreshold: 0.9 }}
        />,
      );

      expect(screen.getByText(/90%/)).toBeInTheDocument();
    });
  });
});
