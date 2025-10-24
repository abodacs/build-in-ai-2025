/**
 * CorrectionCard Component Tests
 *
 * Tests for individual correction card display with actions.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CorrectionCard } from '../CorrectionCard';
import type { ProofreadCorrection } from '../../types';

describe('CorrectionCard', () => {
  const mockCorrection: ProofreadCorrection = {
    correction: 'the',
    type: 'spelling',
    startIndex: 0,
    endIndex: 3,
    explanation: 'Spelling error: teh should be the',
  };

  const defaultProps = {
    correction: mockCorrection,
    index: 0,
    state: 'pending' as const,
    onApply: vi.fn(),
    onIgnore: vi.fn(),
  };

  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('Rendering', () => {
    it('should render correction card', () => {
      render(<CorrectionCard {...defaultProps} />);

      expect(screen.getByText('teh')).toBeInTheDocument();
      expect(screen.getByText('the')).toBeInTheDocument();
    });

    it('should display correction type badge', () => {
      render(<CorrectionCard {...defaultProps} />);

      expect(screen.getByText('spelling')).toBeInTheDocument();
    });

    it('should display correction index', () => {
      render(<CorrectionCard {...defaultProps} index={5} />);

      expect(screen.getByText('#6')).toBeInTheDocument();
    });

    it('should display explanation', () => {
      render(<CorrectionCard {...defaultProps} />);

      expect(screen.getByText(/Spelling error/)).toBeInTheDocument();
    });

    it('should display original text with strikethrough', () => {
      render(<CorrectionCard {...defaultProps} />);

      const originalText = screen.getByText('teh');
      expect(originalText).toHaveClass('line-through');
    });

    it('should display suggestion', () => {
      render(<CorrectionCard {...defaultProps} />);

      expect(screen.getByText('the')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // State Display
  // ==========================================================================

  describe('State Display', () => {
    it('should show apply and ignore buttons for pending state', () => {
      render(<CorrectionCard {...defaultProps} state="pending" />);

      expect(
        screen.getByRole('button', { name: /apply/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /ignore/i }),
      ).toBeInTheDocument();
    });

    it('should show applied badge for applied state', () => {
      render(<CorrectionCard {...defaultProps} state="applied" />);

      expect(screen.getByText('Applied')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /apply/i }),
      ).not.toBeInTheDocument();
    });

    it('should show ignored badge for ignored state', () => {
      render(<CorrectionCard {...defaultProps} state="ignored" />);

      expect(screen.getByText('Ignored')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /ignore/i }),
      ).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Actions
  // ==========================================================================

  describe('Actions', () => {
    it('should call onApply when apply button clicked', () => {
      const onApply = vi.fn();
      render(<CorrectionCard {...defaultProps} onApply={onApply} />);

      const applyButton = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(applyButton);

      expect(onApply).toHaveBeenCalledOnce();
    });

    it('should call onIgnore when ignore button clicked', () => {
      const onIgnore = vi.fn();
      render(<CorrectionCard {...defaultProps} onIgnore={onIgnore} />);

      const ignoreButton = screen.getByRole('button', { name: /ignore/i });
      fireEvent.click(ignoreButton);

      expect(onIgnore).toHaveBeenCalledOnce();
    });

    it('should disable buttons when disabled prop is true', () => {
      render(<CorrectionCard {...defaultProps} disabled={true} />);

      const applyButton = screen.getByRole('button', { name: /apply/i });
      const ignoreButton = screen.getByRole('button', { name: /ignore/i });

      expect(applyButton).toBeDisabled();
      expect(ignoreButton).toBeDisabled();
    });
  });

  // ==========================================================================
  // Correction Types
  // ==========================================================================

  describe('Correction Types', () => {
    const correctionTypes: Array<ProofreadCorrection['type']> = [
      'grammar',
      'spelling',
      'punctuation',
      'style',
      'clarity',
    ];

    it.each(correctionTypes)('should render %s correction type', (type) => {
      const correction: ProofreadCorrection = {
        ...mockCorrection,
        type,
      };

      render(<CorrectionCard {...defaultProps} correction={correction} />);

      expect(screen.getByText(type)).toBeInTheDocument();
    });

    it('should apply correct badge variant for grammar', () => {
      const correction: ProofreadCorrection = {
        ...mockCorrection,
        type: 'grammar',
      };

      render(<CorrectionCard {...defaultProps} correction={correction} />);

      const badge = screen.getByText('grammar');
      expect(badge.className).toContain('destructive');
    });

    it('should apply correct badge variant for style', () => {
      const correction: ProofreadCorrection = {
        ...mockCorrection,
        type: 'style',
      };

      render(<CorrectionCard {...defaultProps} correction={correction} />);

      const badge = screen.getByText('style');
      expect(badge.className).toContain('secondary');
    });

    it('should apply correct badge variant for punctuation', () => {
      const correction: ProofreadCorrection = {
        ...mockCorrection,
        type: 'punctuation',
      };

      render(<CorrectionCard {...defaultProps} correction={correction} />);

      const badge = screen.getByText('punctuation');
      expect(badge.className).toContain('default');
    });
  });

  // ==========================================================================
  // Custom Class Name
  // ==========================================================================

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <CorrectionCard {...defaultProps} className="custom-class" />,
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle long original text', () => {
      const longCorrection: ProofreadCorrection = {
        ...mockCorrection,
      };

      render(<CorrectionCard {...defaultProps} correction={longCorrection} />);

      expect(screen.getByText(longCorrection.original)).toBeInTheDocument();
    });

    it('should handle long suggestion text', () => {
      const longCorrection: ProofreadCorrection = {
        ...mockCorrection,
        correction:
          'This is a very long suggestion text that should be displayed correctly',
      };

      render(<CorrectionCard {...defaultProps} correction={longCorrection} />);

      expect(screen.getByText(longCorrection.correction)).toBeInTheDocument();
    });

    it('should handle long explanation', () => {
      const longCorrection: ProofreadCorrection = {
        ...mockCorrection,
        explanation:
          'This is a very long explanation that provides detailed reasoning for why this correction is necessary',
      };

      render(<CorrectionCard {...defaultProps} correction={longCorrection} />);

      expect(screen.getByText(longCorrection.explanation)).toBeInTheDocument();
    });

    it('should handle Unicode characters', () => {
      const unicodeCorrection: ProofreadCorrection = {
        ...mockCorrection,
        correction: 'こんにちは世界',
      };

      render(
        <CorrectionCard {...defaultProps} correction={unicodeCorrection} />,
      );

      expect(screen.getByText('こんにちは')).toBeInTheDocument();
      expect(screen.getByText('こんにちは世界')).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      const specialCorrection: ProofreadCorrection = {
        ...mockCorrection,
        correction: 'test?!',
      };

      render(
        <CorrectionCard {...defaultProps} correction={specialCorrection} />,
      );

      expect(screen.getByText('test!@#$%')).toBeInTheDocument();
      expect(screen.getByText('test?!')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<CorrectionCard {...defaultProps} />);

      const applyButton = screen.getByRole('button', { name: /apply/i });
      const ignoreButton = screen.getByRole('button', { name: /ignore/i });

      expect(applyButton).toHaveAccessibleName();
      expect(ignoreButton).toHaveAccessibleName();
    });

    it('should show tooltip for explanation icon', () => {
      render(<CorrectionCard {...defaultProps} />);

      // Info icon should be present
      const infoIcon = screen.getByRole('img', { hidden: true });
      expect(infoIcon).toBeInTheDocument();
    });
  });
});
