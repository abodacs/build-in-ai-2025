/**
 * WriterResults Tests - Button Functionality
 *
 * Essential tests for WriterResults component.
 * Focus: Copy, Download, Retry buttons, content display.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WriterResults } from '../WriterResults';

describe('WriterResults', () => {
  describe('Content Display', () => {
    it('should show empty state when no content', () => {
      render(
        <WriterResults
          content={null}
          isWriting={false}
          isStreaming={false}
          metrics={null}
        />,
      );

      expect(
        screen.getByText(/generated content will appear here/i),
      ).toBeInTheDocument();
    });

    it('should display content when available', () => {
      render(
        <WriterResults
          content="Test content"
          isWriting={false}
          isStreaming={false}
          metrics={null}
        />,
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should show streaming indicator when streaming', () => {
      render(
        <WriterResults
          content=""
          isWriting={true}
          isStreaming={true}
          metrics={null}
        />,
      );

      expect(screen.getByLabelText(/generating/i)).toBeInTheDocument();
    });
  });

  describe('Copy Button', () => {
    it('should render copy button when handler provided', () => {
      render(
        <WriterResults
          content="Content to copy"
          isWriting={false}
          isStreaming={false}
          metrics={null}
          onCopy={vi.fn()}
        />,
      );

      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('should call onCopy when clicked', () => {
      const onCopy = vi.fn();
      render(
        <WriterResults
          content="Content"
          isWriting={false}
          isStreaming={false}
          metrics={null}
          onCopy={onCopy}
        />,
      );

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      expect(onCopy).toHaveBeenCalledTimes(1);
    });

    it('should show "Copied!" feedback after copy', async () => {
      render(
        <WriterResults
          content="Content"
          isWriting={false}
          isStreaming={false}
          metrics={null}
          onCopy={vi.fn()}
        />,
      );

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });

    it('should not show copy button when no handler', () => {
      render(
        <WriterResults
          content="Content"
          isWriting={false}
          isStreaming={false}
          metrics={null}
        />,
      );

      expect(
        screen.queryByRole('button', { name: /copy/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Download Button', () => {
    it('should render download button when handler provided', () => {
      render(
        <WriterResults
          content="Content"
          isWriting={false}
          isStreaming={false}
          metrics={null}
          onDownload={vi.fn()}
        />,
      );

      expect(
        screen.getByRole('button', { name: /download/i }),
      ).toBeInTheDocument();
    });

    it('should call onDownload when clicked', () => {
      const onDownload = vi.fn();
      render(
        <WriterResults
          content="Content"
          isWriting={false}
          isStreaming={false}
          metrics={null}
          onDownload={onDownload}
        />,
      );

      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      expect(onDownload).toHaveBeenCalledTimes(1);
    });
  });

  describe('Retry Button', () => {
    it('should render retry button when handler provided', () => {
      render(
        <WriterResults
          content="Content"
          isWriting={false}
          isStreaming={false}
          metrics={null}
          onRetry={vi.fn()}
        />,
      );

      expect(
        screen.getByRole('button', { name: /regenerate/i }),
      ).toBeInTheDocument();
    });

    it('should call onRetry when clicked', () => {
      const onRetry = vi.fn();
      render(
        <WriterResults
          content="Content"
          isWriting={false}
          isStreaming={false}
          metrics={null}
          onRetry={onRetry}
        />,
      );

      const retryButton = screen.getByRole('button', { name: /regenerate/i });
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Metrics', () => {
    it('should show metrics when available', () => {
      const metrics = {
        duration: 1500,
        words: 100,
        tokensPerSecond: 50,
      };

      render(
        <WriterResults
          content="Content"
          isWriting={false}
          isStreaming={false}
          metrics={metrics}
        />,
      );

      expect(screen.getByText(/1500ms/i)).toBeInTheDocument();
      const wordElements = screen.getAllByText(/100 words/i);
      expect(wordElements.length).toBeGreaterThan(0);
    });

    it('should not show metrics while writing', () => {
      const metrics = {
        duration: 1500,
        words: 100,
        tokensPerSecond: 50,
      };

      render(
        <WriterResults
          content="Content"
          isWriting={true}
          isStreaming={false}
          metrics={metrics}
        />,
      );

      expect(screen.queryByText(/1500ms/i)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should hide buttons while writing', () => {
      render(
        <WriterResults
          content="Content"
          isWriting={true}
          isStreaming={false}
          metrics={null}
          onCopy={vi.fn()}
          onDownload={vi.fn()}
          onRetry={vi.fn()}
        />,
      );

      expect(
        screen.queryByRole('button', { name: /copy/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /download/i }),
      ).not.toBeInTheDocument();
    });

    it('should handle empty content string', () => {
      render(
        <WriterResults
          content=""
          isWriting={false}
          isStreaming={false}
          metrics={null}
        />,
      );

      expect(
        screen.getByText(/generated content will appear here/i),
      ).toBeInTheDocument();
    });
  });
});
