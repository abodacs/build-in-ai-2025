/**
 * StreamingMetrics Component Test Suite
 *
 * Tests for real-time metrics display during streaming operations.
 * Covers character/word counting, change detection, and visual indicators.
 *
 * Coverage: 15+ tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreamingMetrics } from '../StreamingMetrics';
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

describe('StreamingMetrics', () => {
  const defaultProps = {
    originalText: 'Hello world',
    streamingContent: 'Hello wonderful world',
    isStreaming: true,
  };

  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe('Rendering', () => {
    it('renders with basic metrics', () => {
      renderWithProviders(<StreamingMetrics {...defaultProps} />);

      // Should show streaming indicator
      expect(screen.getByText(/Streaming/i)).toBeInTheDocument();

      // Should show original length
      expect(screen.getByText(/Original/i)).toBeInTheDocument();

      // Should show current length
      expect(screen.getByText(/Current/i)).toBeInTheDocument();
    });

    it('displays character counts correctly', () => {
      renderWithProviders(<StreamingMetrics {...defaultProps} />);

      // Original: "Hello world" = 11 chars
      // Current: "Hello wonderful world" = 21 chars
      expect(screen.getByText('11')).toBeInTheDocument();
      expect(screen.getByText('21')).toBeInTheDocument();
    });

    it('shows streaming status when active', () => {
      renderWithProviders(<StreamingMetrics {...defaultProps} />);

      expect(screen.getByText(/Streaming/i)).toBeInTheDocument();
    });

    it('shows completed status when not streaming', () => {
      renderWithProviders(
        <StreamingMetrics {...defaultProps} isStreaming={false} />,
      );

      expect(screen.getByText(/Stream Complete/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Metrics Calculation Tests
  // ==========================================================================

  describe('Metrics Calculation', () => {
    it('calculates expanding text correctly', () => {
      const props = {
        originalText: 'Short',
        streamingContent: 'Much longer text here',
        isStreaming: true,
      };

      renderWithProviders(<StreamingMetrics {...props} />);

      // Should show positive delta
      expect(screen.getByText(/\+\d+ chars/i)).toBeInTheDocument();
    });

    it('calculates condensing text correctly', () => {
      const props = {
        originalText: 'This is a very long text that needs to be shortened',
        streamingContent: 'Short text',
        isStreaming: true,
      };

      renderWithProviders(<StreamingMetrics {...props} />);

      // Should show negative delta (delta will be positive number in display)
      expect(screen.getByText(/chars/i)).toBeInTheDocument();
    });

    it('calculates word counts accurately', () => {
      const props = {
        originalText: 'One two three',
        streamingContent: 'One two three four five',
        isStreaming: true,
      };

      renderWithProviders(<StreamingMetrics {...props} />);

      // Original: 3 words, Current: 5 words
      expect(screen.getByText(/3w/i)).toBeInTheDocument();
      expect(screen.getByText(/5w/i)).toBeInTheDocument();
    });

    it('calculates percent change correctly', () => {
      const props = {
        originalText: 'Ten chars!', // 10 chars
        streamingContent: 'Twenty characters!!', // 19 chars
        isStreaming: true,
      };

      renderWithProviders(<StreamingMetrics {...props} />);

      // Change: (19-10)/10 * 100 = 90%
      expect(screen.getByText(/90%/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Visual Indicators Tests
  // ==========================================================================

  describe('Visual Indicators', () => {
    it('shows expanding indicator for longer content', () => {
      const props = {
        originalText: 'Short',
        streamingContent: 'Much longer content here',
        isStreaming: true,
      };

      const { container } = renderWithProviders(
        <StreamingMetrics {...props} />,
      );

      // Should show positive delta badge
      expect(screen.getByText(/\+\d+ chars/i)).toBeInTheDocument();
    });

    it('shows condensing indicator for shorter content', () => {
      const props = {
        originalText: 'Very long original text here',
        streamingContent: 'Short',
        isStreaming: true,
      };

      renderWithProviders(<StreamingMetrics {...props} />);

      // Should show delta (without + sign for negative)
      expect(screen.getByText(/chars/i)).toBeInTheDocument();
    });

    it('shows live generation indicator when streaming', () => {
      renderWithProviders(<StreamingMetrics {...defaultProps} />);

      expect(screen.getByText(/Generating in real-time/i)).toBeInTheDocument();
    });

    it('hides live generation indicator when not streaming', () => {
      renderWithProviders(
        <StreamingMetrics {...defaultProps} isStreaming={false} />,
      );

      expect(
        screen.queryByText(/Generating in real-time/i),
      ).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Progress Tests
  // ==========================================================================

  describe('Progress Tracking', () => {
    it('shows progress bar when estimated total is provided', () => {
      renderWithProviders(
        <StreamingMetrics {...defaultProps} estimatedTotal={100} />,
      );

      expect(screen.getByText(/Progress/i)).toBeInTheDocument();
    });

    it('hides progress bar when no estimated total', () => {
      renderWithProviders(<StreamingMetrics {...defaultProps} />);

      expect(screen.queryByText(/Progress/i)).not.toBeInTheDocument();
    });

    it('calculates progress percentage correctly', () => {
      const props = {
        originalText: 'Original',
        streamingContent: 'A'.repeat(50), // 50 chars
        isStreaming: true,
        estimatedTotal: 100,
      };

      renderWithProviders(<StreamingMetrics {...props} />);

      // Progress: 50/100 = 50%
      expect(screen.getByText(/50%/i)).toBeInTheDocument();
    });

    it('caps progress at 100%', () => {
      const props = {
        originalText: 'Original',
        streamingContent: 'A'.repeat(150), // 150 chars
        isStreaming: true,
        estimatedTotal: 100,
      };

      renderWithProviders(<StreamingMetrics {...props} />);

      // Progress should be capped at 100%
      expect(screen.getByText(/100%/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles empty original text', () => {
      const props = {
        originalText: '',
        streamingContent: 'Some content',
        isStreaming: true,
      };

      expect(() => {
        renderWithProviders(<StreamingMetrics {...props} />);
      }).not.toThrow();
    });

    it('handles empty streaming content', () => {
      const props = {
        originalText: 'Some text',
        streamingContent: '',
        isStreaming: true,
      };

      expect(() => {
        renderWithProviders(<StreamingMetrics {...props} />);
      }).not.toThrow();
    });

    it('handles identical original and streaming content', () => {
      const props = {
        originalText: 'Same text',
        streamingContent: 'Same text',
        isStreaming: true,
      };

      renderWithProviders(<StreamingMetrics {...props} />);

      // Should show 0% change
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });

    it('handles very long content', () => {
      const props = {
        originalText: 'A'.repeat(10000),
        streamingContent: 'B'.repeat(15000),
        isStreaming: true,
      };

      expect(() => {
        renderWithProviders(<StreamingMetrics {...props} />);
      }).not.toThrow();
    });

    it('handles special characters in text', () => {
      const props = {
        originalText: 'Hello 🌍 world! 你好',
        streamingContent: 'Hello 🌍 wonderful world! 你好 世界',
        isStreaming: true,
      };

      expect(() => {
        renderWithProviders(<StreamingMetrics {...props} />);
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // Word Delta Tests
  // ==========================================================================

  describe('Word Delta', () => {
    it('shows positive word delta when words increase', () => {
      const props = {
        originalText: 'One two',
        streamingContent: 'One two three four',
        isStreaming: true,
      };

      renderWithProviders(<StreamingMetrics {...props} />);

      // Delta: +2 words
      expect(screen.getByText(/\+2/i)).toBeInTheDocument();
    });

    it('shows negative word delta when words decrease', () => {
      const props = {
        originalText: 'One two three four five',
        streamingContent: 'One two',
        isStreaming: true,
      };

      renderWithProviders(<StreamingMetrics {...props} />);

      // Delta: -3 words
      expect(screen.getByText(/-3/i)).toBeInTheDocument();
    });

    it('shows zero word delta when word count unchanged', () => {
      const props = {
        originalText: 'Hello world test',
        streamingContent: 'Different words here',
        isStreaming: true,
      };

      renderWithProviders(<StreamingMetrics {...props} />);

      // Both have 3 words, so delta = 0
      expect(screen.getByText(/^0$/)).toBeInTheDocument();
    });
  });
});
