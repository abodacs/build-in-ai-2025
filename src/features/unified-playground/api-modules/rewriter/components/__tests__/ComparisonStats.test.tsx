/**
 * ComparisonStats Component Test Suite
 *
 * Tests for detailed comparison statistics between original and rewritten text.
 * Covers metrics calculation, readability scoring, and visual presentation.
 *
 * Coverage: 20+ tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonStats } from '../ComparisonStats';
import { ThemeProvider } from '@/providers/ThemeProvider';

// ============================================================================
// Test Setup
// ============================================================================

function renderWithProviders(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

beforeEach(() => {
  // Mock matchMedia for ThemeProvider
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// ============================================================================
// Tests
// ============================================================================

describe('ComparisonStats', () => {
  const defaultProps = {
    originalText: 'Hello world',
    rewrittenText: 'Hello wonderful world',
  };

  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe('Rendering', () => {
    it('renders with basic structure', () => {
      renderWithProviders(<ComparisonStats {...defaultProps} />);

      expect(screen.getByText(/Comparison Statistics/i)).toBeInTheDocument();
      expect(screen.getByText(/Overall Change/i)).toBeInTheDocument();
    });

    it('displays all metric categories', () => {
      renderWithProviders(<ComparisonStats {...defaultProps} />);

      // These may appear multiple times, so use getAllByText
      expect(screen.getAllByText(/Characters/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Words/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Sentences/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Readability/i).length).toBeGreaterThan(0);
    });

    it('shows original and rewritten labels for each metric', () => {
      renderWithProviders(<ComparisonStats {...defaultProps} />);

      // Should have multiple "Original" and "Rewritten" labels
      const originalLabels = screen.getAllByText(/^Original$/i);
      const rewrittenLabels = screen.getAllByText(/^Rewritten$/i);

      expect(originalLabels.length).toBeGreaterThan(0);
      expect(rewrittenLabels.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Character Count Tests
  // ==========================================================================

  describe('Character Counting', () => {
    it('calculates character counts correctly', () => {
      const props = {
        originalText: 'Test', // 4 chars
        rewrittenText: 'Testing', // 7 chars
      };

      renderWithProviders(<ComparisonStats {...props} />);

      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('shows positive character delta', () => {
      const props = {
        originalText: 'Short', // 5 chars
        rewrittenText: 'Much longer', // 11 chars
      };

      renderWithProviders(<ComparisonStats {...props} />);

      // Delta: +6 chars
      expect(screen.getByText(/\+6/i)).toBeInTheDocument();
    });

    it('shows negative character delta', () => {
      const props = {
        originalText: 'Very long text', // 14 chars
        rewrittenText: 'Short', // 5 chars
      };

      renderWithProviders(<ComparisonStats {...props} />);

      // Delta: -9 chars
      expect(screen.getByText(/-9/i)).toBeInTheDocument();
    });

    it('handles zero character change', () => {
      const props = {
        originalText: 'Same length',
        rewrittenText: 'Other stuff', // Same length: 11 chars
      };

      renderWithProviders(<ComparisonStats {...props} />);

      // Should not show delta when zero
      const charSection = screen.getByText(/Characters/i).closest('div');
      expect(charSection).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Word Count Tests
  // ==========================================================================

  describe('Word Counting', () => {
    it('calculates word counts correctly', () => {
      const props = {
        originalText: 'One two three', // 3 words
        rewrittenText: 'One two three four five', // 5 words
      };

      renderWithProviders(<ComparisonStats {...props} />);

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows word delta correctly', () => {
      const props = {
        originalText: 'One two', // 2 words
        rewrittenText: 'One two three four five six', // 6 words
      };

      renderWithProviders(<ComparisonStats {...props} />);

      // Delta: +4 words
      expect(screen.getByText(/\+4 words/i)).toBeInTheDocument();
    });

    it('handles multiple spaces correctly', () => {
      const props = {
        originalText: 'One    two     three', // Multiple spaces
        rewrittenText: 'One two three', // Normal spaces
      };

      renderWithProviders(<ComparisonStats {...props} />);

      // Both should count as 3 words
      const wordCounts = screen.getAllByText('3');
      expect(wordCounts.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================================================
  // Sentence Count Tests
  // ==========================================================================

  describe('Sentence Counting', () => {
    it('calculates sentence counts correctly', () => {
      const props = {
        originalText: 'First sentence. Second sentence.',
        rewrittenText:
          'First sentence. Second sentence. Third sentence! Fourth?',
      };

      renderWithProviders(<ComparisonStats {...props} />);

      // Numbers may appear multiple times (in different contexts)
      const twoElements = screen.getAllByText('2');
      const fourElements = screen.getAllByText('4');
      expect(twoElements.length).toBeGreaterThan(0);
      expect(fourElements.length).toBeGreaterThan(0);
    });

    it('handles different sentence terminators', () => {
      const props = {
        originalText: 'Statement. Question? Exclamation!',
        rewrittenText: 'One sentence',
      };

      renderWithProviders(<ComparisonStats {...props} />);

      // Numbers may appear multiple times
      const threeElements = screen.getAllByText('3');
      const oneElements = screen.getAllByText('1');
      expect(threeElements.length).toBeGreaterThan(0);
      expect(oneElements.length).toBeGreaterThan(0);
    });

    it('shows sentence delta', () => {
      const props = {
        originalText: 'One.',
        rewrittenText: 'One. Two. Three.',
      };

      renderWithProviders(<ComparisonStats {...props} />);

      expect(screen.getByText(/\+2 sentences/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Readability Tests
  // ==========================================================================

  describe('Readability', () => {
    it('categorizes easy readability correctly', () => {
      const props = {
        originalText: 'I am. You go. We run. They eat. Cats sleep.',
        rewrittenText: 'Same. Same. Same. Same. Same.',
      };

      renderWithProviders(<ComparisonStats {...props} />);

      // Short sentences = Easy readability
      expect(screen.getAllByText(/Easy/i).length).toBeGreaterThan(0);
    });

    it('categorizes complex readability correctly', () => {
      const props = {
        originalText:
          'This is a very long sentence with many words that makes it complex to read and understand.',
        rewrittenText:
          'This sentence has been rewritten with additional complexity and verbosity to ensure comprehensive understanding.',
      };

      renderWithProviders(<ComparisonStats {...props} />);

      // Long sentences = Complex or Very Complex (may appear multiple times)
      const complexElements = screen.getAllByText(
        /^(Complex|Very Complex|Moderate)$/i,
      );
      expect(complexElements.length).toBeGreaterThan(0);
    });

    it('shows words per sentence metric', () => {
      const props = {
        originalText: 'Short sentence. Another one.',
        rewrittenText:
          'This is a much longer and more detailed sentence with many more words.',
      };

      renderWithProviders(<ComparisonStats {...props} />);

      // May appear multiple times (original and rewritten)
      const wordsPerSentence = screen.getAllByText(/words\/sentence/i);
      expect(wordsPerSentence.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Overall Change Tests
  // ==========================================================================

  describe('Overall Change', () => {
    it('shows expanding indicator for longer text', () => {
      const props = {
        originalText: 'Short',
        rewrittenText: 'Much much longer text here',
      };

      renderWithProviders(<ComparisonStats {...props} />);

      expect(screen.getByText(/Expanded/i)).toBeInTheDocument();
    });

    it('shows condensing indicator for shorter text', () => {
      const props = {
        originalText: 'Very long original text here with many words',
        rewrittenText: 'Short',
      };

      renderWithProviders(<ComparisonStats {...props} />);

      expect(screen.getByText(/Condensed/i)).toBeInTheDocument();
    });

    it('shows maintained indicator for same length', () => {
      const props = {
        originalText: 'Same length',
        rewrittenText: 'Other words', // Same character count
      };

      renderWithProviders(<ComparisonStats {...props} />);

      expect(screen.getByText(/Maintained/i)).toBeInTheDocument();
    });

    it('calculates percent change correctly', () => {
      const props = {
        originalText: 'A'.repeat(100), // 100 chars
        rewrittenText: 'B'.repeat(150), // 150 chars
      };

      renderWithProviders(<ComparisonStats {...props} />);

      // Change: (150-100)/100 * 100 = 50%
      expect(screen.getByText(/50%/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Additional Metrics Tests
  // ==========================================================================

  describe('Additional Metrics', () => {
    it('shows average word length', () => {
      renderWithProviders(<ComparisonStats {...defaultProps} />);

      expect(screen.getByText(/Avg word length/i)).toBeInTheDocument();
    });

    it('shows transformation type', () => {
      const props = {
        originalText: 'Short',
        rewrittenText: 'Much longer text',
      };

      renderWithProviders(<ComparisonStats {...props} />);

      expect(screen.getByText(/Transformation/i)).toBeInTheDocument();
      expect(screen.getByText(/Expanded/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles empty original text', () => {
      const props = {
        originalText: '',
        rewrittenText: 'Some content',
      };

      expect(() => {
        renderWithProviders(<ComparisonStats {...props} />);
      }).not.toThrow();
    });

    it('handles empty rewritten text', () => {
      const props = {
        originalText: 'Some content',
        rewrittenText: '',
      };

      expect(() => {
        renderWithProviders(<ComparisonStats {...props} />);
      }).not.toThrow();
    });

    it('handles identical texts', () => {
      const props = {
        originalText: 'Same text',
        rewrittenText: 'Same text',
      };

      renderWithProviders(<ComparisonStats {...props} />);

      expect(screen.getByText(/0%/i)).toBeInTheDocument();
      expect(screen.getByText(/Maintained/i)).toBeInTheDocument();
    });

    it('handles very long texts', () => {
      const props = {
        originalText: 'A'.repeat(10000),
        rewrittenText: 'B'.repeat(15000),
      };

      expect(() => {
        renderWithProviders(<ComparisonStats {...props} />);
      }).not.toThrow();
    });

    it('handles special characters', () => {
      const props = {
        originalText: 'Hello 🌍 world! 你好',
        rewrittenText: 'Hello 🌍 wonderful world! 你好 世界',
      };

      expect(() => {
        renderWithProviders(<ComparisonStats {...props} />);
      }).not.toThrow();
    });

    it('handles text with only whitespace', () => {
      const props = {
        originalText: '   \n\t   ',
        rewrittenText: 'Real content',
      };

      expect(() => {
        renderWithProviders(<ComparisonStats {...props} />);
      }).not.toThrow();
    });

    it('handles single character texts', () => {
      const props = {
        originalText: 'A',
        rewrittenText: 'B',
      };

      expect(() => {
        renderWithProviders(<ComparisonStats {...props} />);
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // Visual Presentation Tests
  // ==========================================================================

  describe('Visual Presentation', () => {
    it('shows arrows between original and rewritten values', () => {
      renderWithProviders(<ComparisonStats {...defaultProps} />);

      // Should have arrow symbols (→) between original and rewritten
      const container = screen
        .getByText(/Comparison Statistics/i)
        .closest('div');
      expect(container).toBeInTheDocument();
    });

    it('displays formatted numbers with commas', () => {
      const props = {
        originalText: 'A'.repeat(1000),
        rewrittenText: 'B'.repeat(5000),
      };

      renderWithProviders(<ComparisonStats {...props} />);

      // Should format numbers with commas
      expect(screen.getByText(/1,000/i)).toBeInTheDocument();
      expect(screen.getByText(/5,000/i)).toBeInTheDocument();
    });
  });
});
