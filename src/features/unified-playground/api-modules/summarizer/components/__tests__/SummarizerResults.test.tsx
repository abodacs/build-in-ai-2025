/**
 * SummarizerResults Component Tests
 *
 * Tests for SummarizerResults component with Streamdown markdown rendering
 *
 * Coverage Target: 85%+
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { SummarizerResults } from '../SummarizerResults';
import type { SummarizerMetrics } from '../../types/summarizer.types';

// ============================================================================
// Mocks
// ============================================================================

// Mock Streamdown to avoid CSS import issues
vi.mock('streamdown', () => ({
  Streamdown: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="streamdown-content">{children}</div>
  ),
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};

Object.assign(navigator, {
  clipboard: mockClipboard,
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Store original methods
const originalAppendChild = document.body.appendChild;
const originalRemoveChild = document.body.removeChild;

// ============================================================================
// Test Data
// ============================================================================

const mockMetrics: SummarizerMetrics = {
  processingTime: 1500,
  originalWordCount: 500,
  summaryWordCount: 100,
  compressionRatio: 5.0,
  cacheHitRate: 0.5,
  chunksProcessed: 3,
  streamingLatency: [100, 150, 200],
  averageTime: 1500,
  modelInitTime: 200,
  summaryTimes: [1500],
};

// ============================================================================
// Tests
// ============================================================================

describe('SummarizerResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove('dark');

    // Mock appendChild and removeChild for export tests
    document.body.appendChild = vi.fn((element) => {
      if (element instanceof HTMLAnchorElement && element.download) {
        element.click();
      }
      return element;
    }) as any;

    document.body.removeChild = vi.fn() as any;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
  });

  // ==========================================================================
  // Content Display Tests
  // ==========================================================================

  describe('Content Display', () => {
    it('should render summary text with Streamdown', () => {
      const { container } = render(
        <SummarizerResults result="This is a test summary" />,
      );

      const streamdownContent = container.querySelector(
        '[data-testid="streamdown-content"]',
      );
      expect(streamdownContent).toBeTruthy();
      expect(streamdownContent).toHaveTextContent('This is a test summary');
    });

    it('should show streaming indicator when isStreaming=true', () => {
      const { container } = render(
        <SummarizerResults result="" isStreaming={true} />,
      );

      const title = container.querySelector('[data-slot="card-title"]');
      expect(title).toHaveTextContent(/streaming summary/i);
    });

    it('should not show streaming indicator when isStreaming=false', () => {
      const { container } = render(
        <SummarizerResults result="Summary" isStreaming={false} />,
      );

      const title = container.querySelector('[data-slot="card-title"]');
      expect(title).not.toHaveTextContent(/streaming/i);
    });

    it('should display summary title', () => {
      const { container } = render(<SummarizerResults result="Test" />);

      const title = container.querySelector('[data-slot="card-title"]');
      expect(title).toHaveTextContent('Summary');
    });
  });

  // ==========================================================================
  // Markdown Rendering Tests
  // ==========================================================================

  describe('Markdown Rendering with Streamdown', () => {
    it('should render markdown content', () => {
      const markdownContent = '# Heading\n\n**Bold** and *italic*';
      const { container } = render(
        <SummarizerResults result={markdownContent} />,
      );

      const content = container.querySelector(
        '[data-testid="streamdown-content"]',
      );
      expect(content).toHaveTextContent('Heading');
      expect(content).toHaveTextContent('Bold');
      expect(content).toHaveTextContent('italic');
    });

    it('should handle code blocks', () => {
      const markdownContent = '```javascript\nconst x = 10;\n```';
      const { container } = render(
        <SummarizerResults result={markdownContent} />,
      );

      const content = container.querySelector(
        '[data-testid="streamdown-content"]',
      );
      expect(content).toHaveTextContent('const x = 10;');
    });
  });

  // ==========================================================================
  // Button Functionality Tests
  // ==========================================================================

  describe('Copy Button', () => {
    it('should render copy button', () => {
      const { container } = render(<SummarizerResults result="Test content" />);

      const copyButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('Copy'),
      );
      expect(copyButton).toBeTruthy();
    });

    it('should copy text to clipboard when clicked', async () => {
      const testContent = 'Content to copy';
      const { container } = render(<SummarizerResults result={testContent} />);

      const copyButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('Copy'),
      );

      if (copyButton) {
        fireEvent.click(copyButton);

        await waitFor(() => {
          expect(mockClipboard.writeText).toHaveBeenCalledWith(testContent);
        });
      }
    });

    it('should disable copy button during streaming', () => {
      const { container } = render(
        <SummarizerResults result="Test" isStreaming={true} />,
      );

      const copyButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('Copy'),
      );
      expect(copyButton?.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('Export Button', () => {
    it('should render export button', () => {
      const { container } = render(<SummarizerResults result="Test content" />);

      const exportButton = Array.from(
        container.querySelectorAll('button'),
      ).find((btn) => btn.textContent?.includes('Export'));
      expect(exportButton).toBeTruthy();
    });

    it('should create download when clicked', () => {
      const { container } = render(
        <SummarizerResults result="Export this content" />,
      );

      const exportButton = Array.from(
        container.querySelectorAll('button'),
      ).find((btn) => btn.textContent?.includes('Export'));

      if (exportButton) {
        fireEvent.click(exportButton);

        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(document.body.appendChild).toHaveBeenCalled();
      }
    });

    it('should disable export button during streaming', () => {
      const { container } = render(
        <SummarizerResults result="Test" isStreaming={true} />,
      );

      const exportButton = Array.from(
        container.querySelectorAll('button'),
      ).find((btn) => btn.textContent?.includes('Export'));
      expect(exportButton?.hasAttribute('disabled')).toBe(true);
    });
  });

  // ==========================================================================
  // Performance Metrics Tests
  // ==========================================================================

  describe('Performance Metrics', () => {
    it('should display metrics when provided', () => {
      const { container } = render(
        <SummarizerResults
          result="Test"
          metrics={mockMetrics}
          showMetrics={true}
        />,
      );

      expect(container.textContent).toContain('Performance Insights');
      expect(container.textContent).toContain('1500ms');
      expect(container.textContent).toContain('5.0x');
    });

    it('should hide metrics during streaming', () => {
      const { container } = render(
        <SummarizerResults
          result="Test"
          metrics={mockMetrics}
          showMetrics={true}
          isStreaming={true}
        />,
      );

      expect(container.textContent).not.toContain('Performance Insights');
    });

    it('should not show metrics when showMetrics=false', () => {
      const { container } = render(
        <SummarizerResults
          result="Test"
          metrics={mockMetrics}
          showMetrics={false}
        />,
      );

      expect(container.textContent).not.toContain('Performance Insights');
    });

    it('should show cache hit rate and chunks processed', () => {
      const { container } = render(
        <SummarizerResults
          result="Test"
          metrics={mockMetrics}
          showMetrics={true}
        />,
      );

      expect(container.textContent).toContain('Cache Hit Rate');
      expect(container.textContent).toContain('50%');
      expect(container.textContent).toContain('Chunks Processed');
      expect(container.textContent).toContain('3');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty result string', () => {
      const { container } = render(<SummarizerResults result="" />);

      const streamdownContent = container.querySelector(
        '[data-testid="streamdown-content"]',
      );
      expect(streamdownContent).toBeTruthy();
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(10000);
      const { container } = render(<SummarizerResults result={longContent} />);

      const streamdownContent = container.querySelector(
        '[data-testid="streamdown-content"]',
      );
      expect(streamdownContent).toBeTruthy();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <SummarizerResults result="Test" className="custom-class" />,
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeTruthy();
    });

    it('should handle streaming state transition', () => {
      const { container, rerender } = render(
        <SummarizerResults result="" isStreaming={true} />,
      );

      let title = container.querySelector('[data-slot="card-title"]');
      expect(title).toHaveTextContent(/streaming/i);

      rerender(<SummarizerResults result="Complete" isStreaming={false} />);

      title = container.querySelector('[data-slot="card-title"]');
      expect(title).not.toHaveTextContent(/streaming/i);
      expect(title).toHaveTextContent('Summary');
    });
  });

  // ==========================================================================
  // Dark Mode Support
  // ==========================================================================

  describe('Dark Mode Support', () => {
    it('should render with dark mode class', () => {
      document.documentElement.classList.add('dark');

      const { container } = render(<SummarizerResults result="Test" />);

      const content = container.querySelector('.dark\\:bg-gray-800');
      expect(content).toBeTruthy();
    });
  });
});
