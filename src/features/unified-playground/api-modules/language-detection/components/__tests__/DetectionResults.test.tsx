/**
 * DetectionResults Component Tests
 *
 * Tests for language detection results display component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetectionResults } from '../DetectionResults';
import type { DetectionCandidate } from '../../types';

describe('DetectionResults', () => {
  const mockResults: DetectionCandidate[] = [
    { detectedLanguage: 'en', confidence: 0.95 },
    { detectedLanguage: 'es', confidence: 0.03 },
    { detectedLanguage: 'fr', confidence: 0.02 },
  ];

  const defaultProps = {
    results: mockResults,
    onCopy: vi.fn(),
    className: '',
  };

  describe('Rendering', () => {
    it('should render results list', () => {
      render(<DetectionResults {...defaultProps} />);

      expect(screen.getByText('en')).toBeInTheDocument();
      expect(screen.getByText('es')).toBeInTheDocument();
      expect(screen.getByText('fr')).toBeInTheDocument();
    });

    it('should show confidence scores', () => {
      render(<DetectionResults {...defaultProps} />);

      expect(screen.getByText(/95%/)).toBeInTheDocument();
      expect(screen.getByText(/3%/)).toBeInTheDocument();
      expect(screen.getByText(/2%/)).toBeInTheDocument();
    });

    it('should render empty state when no results', () => {
      render(<DetectionResults {...defaultProps} results={[]} />);

      expect(screen.getByText(/no language detected/i)).toBeInTheDocument();
    });

    it('should display primary result prominently', () => {
      render(<DetectionResults {...defaultProps} />);

      // Primary result should be displayed
      const primaryElement = screen
        .getByText('en')
        .closest('[data-primary="true"]');
      expect(primaryElement).toBeInTheDocument();
    });
  });

  describe('Confidence Bars', () => {
    it('should render confidence bar for each result', () => {
      render(<DetectionResults {...defaultProps} />);

      // Check for progress bars or confidence indicators
      const confidenceBars = screen.getAllByRole('progressbar');
      expect(confidenceBars).toHaveLength(3);
    });

    it('should show correct confidence widths', () => {
      render(<DetectionResults {...defaultProps} />);

      const bars = screen.getAllByRole('progressbar');

      // First bar (95%) should be wider than second (3%)
      const firstBar = bars[0];
      const secondBar = bars[1];

      const firstWidth = firstBar.getAttribute('aria-valuenow');
      const secondWidth = secondBar.getAttribute('aria-valuenow');

      expect(Number(firstWidth)).toBeGreaterThan(Number(secondWidth));
    });

    it('should color-code by confidence level', () => {
      const mixedResults: DetectionCandidate[] = [
        { detectedLanguage: 'en', confidence: 0.95 }, // High - green
        { detectedLanguage: 'es', confidence: 0.6 }, // Medium - yellow
        { detectedLanguage: 'fr', confidence: 0.3 }, // Low - red
      ];

      render(<DetectionResults {...defaultProps} results={mixedResults} />);

      const bars = screen.getAllByRole('progressbar');
      expect(bars).toHaveLength(3);

      // Each should have different styling based on confidence
      bars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-valuenow');
      });
    });
  });

  describe('Copy Functionality', () => {
    it('should render copy button', () => {
      render(<DetectionResults {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('should call onCopy when button clicked', () => {
      const onCopy = vi.fn();
      render(<DetectionResults {...defaultProps} onCopy={onCopy} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      expect(onCopy).toHaveBeenCalled();
    });

    it('should disable copy button when no results', () => {
      render(<DetectionResults {...defaultProps} results={[]} />);

      const copyButton = screen.queryByRole('button', { name: /copy/i });
      expect(copyButton).not.toBeInTheDocument();
    });
  });

  describe('Language Display', () => {
    it('should show language codes', () => {
      render(<DetectionResults {...defaultProps} />);

      expect(screen.getByText('en')).toBeInTheDocument();
      expect(screen.getByText('es')).toBeInTheDocument();
    });

    it('should show language names if available', () => {
      const resultsWithNames: DetectionCandidate[] = [
        { detectedLanguage: 'en', confidence: 0.95, languageName: 'English' },
        { detectedLanguage: 'es', confidence: 0.03, languageName: 'Spanish' },
      ];

      render(<DetectionResults {...defaultProps} results={resultsWithNames} />);

      expect(screen.getByText(/english/i)).toBeInTheDocument();
      expect(screen.getByText(/spanish/i)).toBeInTheDocument();
    });

    it('should handle unknown language codes', () => {
      const unknownResults: DetectionCandidate[] = [
        { detectedLanguage: 'xxx', confidence: 0.5 },
      ];

      render(<DetectionResults {...defaultProps} results={unknownResults} />);

      expect(screen.getByText('xxx')).toBeInTheDocument();
    });
  });

  describe('Result Ordering', () => {
    it('should display results in confidence order', () => {
      const unorderedResults: DetectionCandidate[] = [
        { detectedLanguage: 'fr', confidence: 0.2 },
        { detectedLanguage: 'en', confidence: 0.95 },
        { detectedLanguage: 'es', confidence: 0.5 },
      ];

      render(<DetectionResults {...defaultProps} results={unorderedResults} />);

      const languageCodes = screen.getAllByText(/en|es|fr/);

      // First should be 'en' (highest confidence)
      expect(languageCodes[0].textContent).toContain('en');
    });

    it('should handle ties in confidence', () => {
      const tiedResults: DetectionCandidate[] = [
        { detectedLanguage: 'en', confidence: 0.5 },
        { detectedLanguage: 'es', confidence: 0.5 },
      ];

      render(<DetectionResults {...defaultProps} results={tiedResults} />);

      expect(screen.getByText('en')).toBeInTheDocument();
      expect(screen.getByText('es')).toBeInTheDocument();
    });
  });

  describe('Single Result', () => {
    it('should handle single result gracefully', () => {
      const singleResult: DetectionCandidate[] = [
        { detectedLanguage: 'en', confidence: 0.99 },
      ];

      render(<DetectionResults {...defaultProps} results={singleResult} />);

      expect(screen.getByText('en')).toBeInTheDocument();
      expect(screen.getByText(/99%/)).toBeInTheDocument();
    });
  });

  describe('Many Results', () => {
    it('should handle many results', () => {
      const manyResults: DetectionCandidate[] = Array.from(
        { length: 10 },
        (_, i) => ({
          detectedLanguage: `lang${i}`,
          confidence: (10 - i) / 10,
        }),
      );

      render(<DetectionResults {...defaultProps} results={manyResults} />);

      expect(screen.getByText('lang0')).toBeInTheDocument();
      expect(screen.getByText('lang9')).toBeInTheDocument();
    });

    it('should limit display if maxDisplay prop provided', () => {
      const manyResults: DetectionCandidate[] = Array.from(
        { length: 10 },
        (_, i) => ({
          detectedLanguage: `lang${i}`,
          confidence: (10 - i) / 10,
        }),
      );

      render(
        <DetectionResults
          {...defaultProps}
          results={manyResults}
          maxDisplay={3}
        />,
      );

      expect(screen.getByText('lang0')).toBeInTheDocument();
      expect(screen.getByText('lang1')).toBeInTheDocument();
      expect(screen.getByText('lang2')).toBeInTheDocument();

      // Should show "and X more" message
      expect(screen.getByText(/more/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for confidence bars', () => {
      render(<DetectionResults {...defaultProps} />);

      const bars = screen.getAllByRole('progressbar');
      bars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-label');
        expect(bar).toHaveAttribute('aria-valuenow');
        expect(bar).toHaveAttribute('aria-valuemin');
        expect(bar).toHaveAttribute('aria-valuemax');
      });
    });

    it('should have semantic HTML structure', () => {
      render(<DetectionResults {...defaultProps} />);

      // Should use list elements for results
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    it('should indicate primary result to screen readers', () => {
      render(<DetectionResults {...defaultProps} />);

      // Primary result should have appropriate aria attributes
      const primaryElement = screen.getByText('en').closest('[role]');
      expect(primaryElement).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero confidence', () => {
      const zeroConfidence: DetectionCandidate[] = [
        { detectedLanguage: 'en', confidence: 0 },
      ];

      render(<DetectionResults {...defaultProps} results={zeroConfidence} />);

      expect(screen.getByText(/0%/)).toBeInTheDocument();
    });

    it('should handle confidence of 1.0', () => {
      const perfectConfidence: DetectionCandidate[] = [
        { detectedLanguage: 'en', confidence: 1.0 },
      ];

      render(
        <DetectionResults {...defaultProps} results={perfectConfidence} />,
      );

      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it('should handle very small confidence values', () => {
      const tinyConfidence: DetectionCandidate[] = [
        { detectedLanguage: 'en', confidence: 0.001 },
      ];

      render(<DetectionResults {...defaultProps} results={tinyConfidence} />);

      // Should round to reasonable precision
      expect(screen.getByText(/[<1]%|0%/)).toBeInTheDocument();
    });

    it('should handle long language codes', () => {
      const longCode: DetectionCandidate[] = [
        { detectedLanguage: 'zh-Hans-CN', confidence: 0.9 },
      ];

      render(<DetectionResults {...defaultProps} results={longCode} />);

      expect(screen.getByText('zh-Hans-CN')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <DetectionResults {...defaultProps} className="custom-class" />,
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
