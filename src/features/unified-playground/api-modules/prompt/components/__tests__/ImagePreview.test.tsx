/**
 * ImagePreview Component Tests
 * Tests for image thumbnail display with zoom modal
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImagePreview } from '../ImagePreview';

describe('ImagePreview', () => {
  const mockProps = {
    url: 'data:image/png;base64,test',
    name: 'test-image.png',
    size: 102400,
    dimensions: { width: 800, height: 600 },
  };

  describe('Basic Rendering', () => {
    it('should render image thumbnail', () => {
      render(<ImagePreview {...mockProps} />);
      const img = screen.getByAltText('test-image.png');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', mockProps.url);
    });

    it('should display image name', () => {
      render(<ImagePreview {...mockProps} />);
      expect(screen.getByText('test-image.png')).toBeInTheDocument();
    });

    it('should format file size correctly', () => {
      render(<ImagePreview {...mockProps} />);
      expect(screen.getByText('100.0 KB')).toBeInTheDocument();
    });

    it('should display dimensions when provided', () => {
      render(<ImagePreview {...mockProps} />);
      expect(screen.getByText('800 × 600')).toBeInTheDocument();
    });

    it('should use alt text when provided', () => {
      render(<ImagePreview {...mockProps} alt="Custom alt text" />);
      expect(screen.getByAltText('Custom alt text')).toBeInTheDocument();
    });
  });

  describe('Details Display', () => {
    it('should show details when showDetails is true', () => {
      render(<ImagePreview {...mockProps} showDetails={true} />);
      expect(screen.getByText('test-image.png')).toBeInTheDocument();
      expect(screen.getByText('100.0 KB')).toBeInTheDocument();
    });

    it('should hide details when showDetails is false', () => {
      render(<ImagePreview {...mockProps} showDetails={false} />);
      expect(screen.queryByText('100.0 KB')).not.toBeInTheDocument();
    });
  });

  describe('Remove Button', () => {
    it('should show remove button when removable and onRemove provided', () => {
      const onRemove = vi.fn();
      render(
        <ImagePreview {...mockProps} onRemove={onRemove} removable={true} />,
      );

      const thumbnail = screen
        .getByAltText('test-image.png')
        .closest('.image-preview');
      expect(
        thumbnail?.querySelector('button[aria-label="Remove image"]'),
      ).toBeInTheDocument();
    });

    it('should not show remove button when removable is false', () => {
      const onRemove = vi.fn();
      render(
        <ImagePreview {...mockProps} onRemove={onRemove} removable={false} />,
      );

      const thumbnail = screen
        .getByAltText('test-image.png')
        .closest('.image-preview');
      expect(
        thumbnail?.querySelector('button[aria-label="Remove image"]'),
      ).not.toBeInTheDocument();
    });

    it('should call onRemove when clicked', () => {
      const onRemove = vi.fn();
      render(
        <ImagePreview {...mockProps} onRemove={onRemove} removable={true} />,
      );

      const thumbnail = screen
        .getByAltText('test-image.png')
        .closest('.image-preview');
      const removeButton = thumbnail?.querySelector(
        'button[aria-label="Remove image"]',
      );

      if (removeButton) {
        fireEvent.click(removeButton);
        expect(onRemove).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Zoom Modal', () => {
    it('should open zoom modal when image is clicked', () => {
      render(<ImagePreview {...mockProps} />);
      const img = screen.getByAltText('test-image.png');
      fireEvent.click(img);

      // Modal should show the image again (full-size version)
      const images = screen.getAllByAltText('test-image.png');
      expect(images.length).toBeGreaterThan(1);
    });

    it('should close modal when close button is clicked', () => {
      render(<ImagePreview {...mockProps} />);
      const img = screen.getByAltText('test-image.png');
      fireEvent.click(img);

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      const images = screen.getAllByAltText('test-image.png');
      expect(images.length).toBe(1);
    });

    it('should close modal when backdrop is clicked', () => {
      const { container } = render(<ImagePreview {...mockProps} />);
      const img = screen.getByAltText('test-image.png');
      fireEvent.click(img);

      const backdrop = container.querySelector('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
        const images = screen.getAllByAltText('test-image.png');
        expect(images.length).toBe(1);
      }
    });

    it('should show download button in modal', () => {
      render(<ImagePreview {...mockProps} />);
      const img = screen.getByAltText('test-image.png');
      fireEvent.click(img);

      expect(screen.getByText('Download')).toBeInTheDocument();
    });
  });

  describe('Image Error Handling', () => {
    it('should handle image load errors gracefully', () => {
      render(<ImagePreview {...mockProps} />);
      const img = screen.getByAltText('test-image.png');
      fireEvent.error(img);

      expect(screen.getByText('Image Error')).toBeInTheDocument();
    });
  });

  describe('File Size Formatting', () => {
    it('should format bytes correctly', () => {
      render(<ImagePreview {...mockProps} size={500} />);
      expect(screen.getByText('500 B')).toBeInTheDocument();
    });

    it('should format kilobytes correctly', () => {
      render(<ImagePreview {...mockProps} size={2048} />);
      expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    });

    it('should format megabytes correctly', () => {
      render(<ImagePreview {...mockProps} size={5242880} />);
      expect(screen.getByText('5.0 MB')).toBeInTheDocument();
    });
  });

  describe('Custom onClick', () => {
    it('should call custom onClick instead of opening modal', () => {
      const onClick = vi.fn();
      render(<ImagePreview {...mockProps} onClick={onClick} />);

      const img = screen.getByAltText('test-image.png');
      fireEvent.click(img);

      expect(onClick).toHaveBeenCalledTimes(1);

      // Modal should not open
      const images = screen.getAllByAltText('test-image.png');
      expect(images.length).toBe(1);
    });
  });
});
