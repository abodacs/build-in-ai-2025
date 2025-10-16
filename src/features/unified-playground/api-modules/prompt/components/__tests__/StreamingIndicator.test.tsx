/**
 * StreamingIndicator Component Tests
 * Tests for streaming status indicator with animations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreamingIndicator } from '../StreamingIndicator';

describe('StreamingIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Visibility', () => {
    it('should not render when isStreaming is false', () => {
      const { container } = render(<StreamingIndicator isStreaming={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when isStreaming is true', () => {
      render(<StreamingIndicator isStreaming={true} />);
      expect(screen.getByText(/AI is thinking/i)).toBeInTheDocument();
    });

    it('should use custom label when provided', () => {
      render(<StreamingIndicator isStreaming={true} label="Processing..." />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render dots variant', () => {
      const { container } = render(
        <StreamingIndicator isStreaming={true} variant="dots" />,
      );
      expect(
        container.querySelector('.w-2.h-2.rounded-full'),
      ).toBeInTheDocument();
    });

    it('should render pulse variant', () => {
      const { container } = render(
        <StreamingIndicator isStreaming={true} variant="pulse" />,
      );
      expect(container.querySelector('.animate-ping')).toBeInTheDocument();
    });

    it('should render typing variant', () => {
      const { container } = render(
        <StreamingIndicator isStreaming={true} variant="typing" />,
      );
      expect(container.querySelector('.animate-bounce')).toBeInTheDocument();
    });

    it('should render spinner variant', () => {
      const { container } = render(
        <StreamingIndicator isStreaming={true} variant="spinner" />,
      );
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should show content when showContent is true', () => {
      render(
        <StreamingIndicator
          isStreaming={true}
          content="Hello, world!"
          showContent={true}
        />,
      );
      expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });

    it('should not show content when showContent is false', () => {
      render(
        <StreamingIndicator
          isStreaming={true}
          content="Hello, world!"
          showContent={false}
        />,
      );
      expect(screen.queryByText('Hello, world!')).not.toBeInTheDocument();
    });

    it('should show blinking cursor with content', () => {
      const { container } = render(
        <StreamingIndicator
          isStreaming={true}
          content="Test"
          showContent={true}
        />,
      );
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Elapsed Time', () => {
    it('should not show elapsed time by default', () => {
      render(<StreamingIndicator isStreaming={true} />);
      expect(screen.queryByText(/\ds$/)).not.toBeInTheDocument();
    });

    it('should show elapsed time when enabled', () => {
      render(<StreamingIndicator isStreaming={true} showElapsedTime={true} />);
      vi.advanceTimersByTime(2000);
      expect(screen.queryByText(/\ds$/)).toBeInTheDocument();
    });

    it('should update elapsed time', () => {
      render(<StreamingIndicator isStreaming={true} showElapsedTime={true} />);
      vi.advanceTimersByTime(3000);
      expect(screen.queryByText(/3s$/)).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size class', () => {
      const { container } = render(
        <StreamingIndicator isStreaming={true} size="sm" />,
      );
      expect(container.querySelector('.text-sm')).toBeInTheDocument();
    });

    it('should apply medium size class', () => {
      const { container } = render(
        <StreamingIndicator isStreaming={true} size="md" />,
      );
      expect(container.querySelector('.text-base')).toBeInTheDocument();
    });

    it('should apply large size class', () => {
      const { container } = render(
        <StreamingIndicator isStreaming={true} size="lg" />,
      );
      expect(container.querySelector('.text-lg')).toBeInTheDocument();
    });
  });
});
